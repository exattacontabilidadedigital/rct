import "dotenv/config";

import { instantiateChecklistBlueprint } from "@/lib/checklist";
import { calculateChecklistProgressFromBoards } from "@/lib/checklist";
import { toSupabaseTaskInsert } from "@/lib/checklist-normalizers";
import { createSupabaseServiceClient } from "@/lib/supabase";

async function main() {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("checklists")
    .select("id, company_id, name, created_at, updated_at, checklist_tasks ( id )")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Failed to load checklists", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("ℹ️ No checklists found. Nothing to do.");
    return;
  }

  let totalInserted = 0;

  for (const board of data) {
    const existingTasks = Array.isArray(board.checklist_tasks) ? board.checklist_tasks.length : 0;
    if (existingTasks > 0) {
      console.log(`✅ Board ${board.id} (${board.name}) already has ${existingTasks} tasks. Skipping.`);
      continue;
    }

    const referenceTimestamp = board.created_at ?? new Date().toISOString();
    const referenceDate = board.created_at ? new Date(board.created_at) : new Date();

    const tasks = instantiateChecklistBlueprint({
      checklistId: board.id,
      timestamp: referenceTimestamp,
      referenceDate,
    });

    if (!tasks.length) {
      console.warn(`⚠️ Blueprint returned no tasks for board ${board.id}. Skipping.`);
      continue;
    }

    const payload = tasks.map((task) => toSupabaseTaskInsert(task));

    const { error: insertError } = await supabase.from("checklist_tasks").insert(payload);
    if (insertError) {
      if (insertError.code === "42703" || insertError.code === "PGRST204") {
        console.warn(
          `⚠️ checklist_tasks is missing the blueprint_id column (board ${board.id}); retrying without it...`
        );
        const fallbackPayload = payload.map((entry) => {
          const { blueprint_id, ...rest } = entry as typeof entry & { blueprint_id?: unknown };
          void blueprint_id;
          return rest;
        });
        const { error: fallbackError } = await supabase.from("checklist_tasks").insert(fallbackPayload);
        if (fallbackError) {
          console.error(`❌ Failed to backfill tasks for board ${board.id} even without blueprint_id`, fallbackError);
          continue;
        }
      } else {
        console.error(`❌ Failed to backfill tasks for board ${board.id}`, insertError);
        continue;
      }
    }

    totalInserted += payload.length;
    console.log(`✨ Inserted ${payload.length} tasks for board ${board.id}`);

    const progress = calculateChecklistProgressFromBoards([
      {
        id: board.id,
        companyId: board.company_id,
        name: board.name,
        description: undefined,
        createdAt: board.created_at ?? referenceTimestamp,
        updatedAt: board.updated_at ?? referenceTimestamp,
        tasks,
      },
    ]);

    await supabase
      .from("companies")
      .update({ checklist_progress: progress.toString() })
      .eq("id", board.company_id);
  }

  if (totalInserted === 0) {
    console.log("ℹ️ No boards required backfill.");
  } else {
    console.log(`🎉 Backfill completed. Inserted ${totalInserted} tasks in total.`);
  }
}

main().catch((err) => {
  console.error("❌ Unexpected failure", err);
  process.exit(1);
});
