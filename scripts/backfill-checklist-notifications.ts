import "dotenv/config";

import { buildChecklistNotifications } from "@/lib/checklist";
import {
  mapSupabaseChecklistRow,
  type SupabaseChecklistRow,
  type SupabaseChecklistTaskRow,
} from "@/lib/checklist-normalizers";
import { createSupabaseServiceClient } from "@/lib/supabase";
import {
  fetchSupabaseChecklistNotifications,
  syncSupabaseChecklistNotifications,
} from "@/lib/supabase/notifications";

async function main() {
  const supabase = createSupabaseServiceClient();

  console.log("📥 Fetching companies...");

  const { data: companyRows, error } = await supabase
    .from("companies")
    .select("id")
    .order("id", { ascending: true });

  if (error) {
    console.error("❌ Failed to load companies", error);
    process.exit(1);
  }

  if (!companyRows || companyRows.length === 0) {
    console.log("ℹ️ No companies found. Nothing to backfill.");
    return;
  }

  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  const invalidIds = companyRows
    .map((row) => row?.id)
    .filter((value): value is string => typeof value === "string" && !UUID_REGEX.test(value));

  if (invalidIds.length) {
    console.warn("⚠️ Found company ids with unexpected format:", invalidIds.slice(0, 5));
  }

  const companyIds = companyRows
    .map((row) => row?.id as string | null | undefined)
    .filter((value): value is string => typeof value === "string" && UUID_REGEX.test(value));

  const skipped = companyRows.length - companyIds.length;
  if (skipped > 0) {
    console.warn(`⚠️ Skipped ${skipped} company records without valid UUIDs.`);
  }

  console.log("➡️ Companies to process:", companyIds.slice(0, 10));

  let totalSynced = 0;

  for (const companyId of companyIds) {
    console.log(`\n🏢 Company ${companyId}: loading boards`);

    try {
      const BOARD_PROJECTIONS = [`id, company_id, name, description, created_at, updated_at`];

      let boardRows: SupabaseChecklistRow[] = [];
      let boardError: unknown = null;

      for (const projection of BOARD_PROJECTIONS) {
        const response = await supabase
          .from("checklists")
          .select(projection)
          .eq("company_id", companyId)
          .order("created_at", { ascending: true });

        if (!response.error) {
          boardRows = response.data as unknown as SupabaseChecklistRow[];
          boardError = null;
          break;
        }

        boardError = response.error;
        const code = response.error?.code ?? "";
        if (code !== "42703" && code !== "PGRST204") {
          break;
        }
      }

      if (boardError) {
        console.error(`❌ Failed to load boards for company ${companyId}`, boardError);
        continue;
      }

      if (!boardRows || boardRows.length === 0) {
        console.log("ℹ️ No boards found. Skipping.");
        continue;
      }

      console.log(`📋 Loaded ${boardRows.length} board rows for company ${companyId}`);

      const invalidBoardIds = boardRows
        .map((row) => row?.id as string | null | undefined)
        .filter((value): value is string => typeof value === "string" && !UUID_REGEX.test(value));

      if (invalidBoardIds.length) {
        console.warn(
          `⚠️ Found ${invalidBoardIds.length} board ids with unexpected format`,
          invalidBoardIds.slice(0, 5),
        );
      }

      const validBoardRows = boardRows.filter((row) => typeof row?.id === "string" && UUID_REGEX.test(row.id));
      const boardIds = validBoardRows.map((row) => row.id);

      if (!boardIds.length) {
        console.warn("⚠️ No valid board ids found. Skipping.");
        continue;
      }

      const TASK_PROJECTIONS = [
        `id, board_id, blueprint_id, title, description, severity, status, owner, category, due_date, phase, pillar, priority, reference_items, evidence_items, note_items, tags, created_at, updated_at`,
        `id, board_id, title, description, severity, status, owner, category, due_date, phase, pillar, priority, reference_items, evidence_items, note_items, tags, created_at, updated_at`,
        `id, board_id, title, description, severity, status, owner, category, due_date, created_at, updated_at`,
      ];

      let taskRows: SupabaseChecklistTaskRow[] = [];
      let taskError: unknown = null;

      for (const projection of TASK_PROJECTIONS) {
        const response = await supabase
          .from("checklist_tasks")
          .select(projection)
          .in("board_id", boardIds)
          .order("created_at", { ascending: true });

        if (!response.error) {
          taskRows = response.data as unknown as SupabaseChecklistTaskRow[];
          taskError = null;
          break;
        }

        taskError = response.error;
        const code = response.error?.code ?? "";
        if (code !== "42703" && code !== "PGRST204") {
          break;
        }
      }

      if (taskError) {
        console.error(`❌ Failed to load tasks for company ${companyId}`, taskError);
        continue;
      }

      const tasksByBoard = new Map<string, SupabaseChecklistTaskRow[]>();
      for (const task of taskRows ?? []) {
        if (!task?.board_id || !UUID_REGEX.test(task.board_id)) continue;
        const list = tasksByBoard.get(task.board_id) ?? [];
        list.push(task);
        tasksByBoard.set(task.board_id, list);
      }

      console.log(`🧮 Grouped tasks for ${tasksByBoard.size} boards.`);

      const boards = validBoardRows.map((row) =>
        mapSupabaseChecklistRow({
          ...row,
          checklist_tasks: tasksByBoard.get(row.id) ?? [],
        } as SupabaseChecklistRow),
      );

      console.log(`📦 Normalized ${boards.length} boards. Fetching existing notifications...`);

      const existing = await fetchSupabaseChecklistNotifications(supabase, companyId);
      console.log(`📨 Retrieved ${existing.length} existing notifications.`);
      const rebuilt = buildChecklistNotifications(boards, existing);
      const readLookup = new Map(existing.map((notification) => [notification.id, notification.read]));
      const merged = rebuilt.map((notification) =>
        readLookup.has(notification.id) ? { ...notification, read: readLookup.get(notification.id) ?? notification.read } : notification,
      );

      console.log(`🛠️ Built ${rebuilt.length} notifications. Syncing with Supabase...`);

      await syncSupabaseChecklistNotifications(supabase, companyId, merged);

      console.log(`✅ Synced ${merged.length} notifications (was ${existing.length})`);
      totalSynced += merged.length;
    } catch (companyError) {
      console.error(`❌ Company ${companyId} failed:`, companyError);
    }
  }

  console.log("\n🎉 Backfill complete!");
  console.log(`📊 Total notifications now persisted: ${totalSynced}`);
}

main().catch((err) => {
  console.error("❌ Unexpected failure", err);
  process.exit(1);
});
