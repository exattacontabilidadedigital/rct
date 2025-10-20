import type { SupabaseClient } from "@supabase/supabase-js";

import {
  SUPABASE_CHECKLIST_SELECT,
  SUPABASE_CHECKLIST_SELECT_LEGACY,
  SUPABASE_CHECKLIST_SELECT_MINIMAL,
  mapSupabaseChecklistRow,
  toSupabaseBoardInsert,
  toSupabaseTaskInsert,
} from "@/lib/checklist-normalizers";
import type { ChecklistBoard } from "@/types/platform";
import type { SupabaseChecklistRow } from "@/lib/checklist-normalizers";
import type { Database } from "./types";

const FALLBACK_ERROR_CODES = new Set(["42703", "PGRST204"]);
const PROJECTION_LEVELS = [
  SUPABASE_CHECKLIST_SELECT,
  SUPABASE_CHECKLIST_SELECT_LEGACY,
  SUPABASE_CHECKLIST_SELECT_MINIMAL,
];
let preferredProjectionIndex = PROJECTION_LEVELS.length - 1;

export async function insertSupabaseBoardWithTasks(
  client: SupabaseClient<Database>,
  board: ChecklistBoard,
): Promise<void> {
  const { error: boardError } = await client.from("checklists").insert(toSupabaseBoardInsert(board));
  if (boardError) {
    throw boardError;
  }

  if (board.tasks.length === 0) {
    return;
  }

  const taskPayloads = board.tasks.map((task) => toSupabaseTaskInsert(task));
  const retryWithoutBlueprintColumn = async () => {
    console.warn("[supabase] checklist_tasks missing blueprint_id column; retrying insert without it");
    const fallbackPayloads: Database["public"]["Tables"]["checklist_tasks"]["Insert"][] =
      taskPayloads.map((payload) => {
        const { blueprint_id, ...rest } = payload;
        void blueprint_id;
        return rest;
      });
    const { error: fallbackError } = await client.from("checklist_tasks").insert(fallbackPayloads);
    if (fallbackError) {
      throw fallbackError;
    }
  };

  const { error: taskError } = await client.from("checklist_tasks").insert(taskPayloads);
  if (taskError) {
    if (taskError.code === "42703" || taskError.code === "PGRST204") {
      await retryWithoutBlueprintColumn();
      return;
    }

    throw taskError;
  }
}

export async function fetchSupabaseCompanyBoards(
  client: SupabaseClient<Database>,
  companyId: string,
): Promise<ChecklistBoard[]> {
  const executeSelect = (projection: string) =>
    client
      .from("checklists")
      .select(projection)
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

  let data: unknown[] | null | undefined;
  let lastError: unknown = null;

  for (let index = preferredProjectionIndex; index < PROJECTION_LEVELS.length; index += 1) {
    const projection = PROJECTION_LEVELS[index];
    const response = await executeSelect(projection);

    if (!response.error) {
      preferredProjectionIndex = index;
      data = response.data;
      lastError = null;
      break;
    }

    lastError = response.error;

    if (!FALLBACK_ERROR_CODES.has(response.error?.code ?? "")) {
      break;
    }

    if (index < PROJECTION_LEVELS.length - 1) {
      preferredProjectionIndex = index + 1;
      continue;
    }
  }

  if (lastError) {
    throw lastError;
  }

  if (!data) {
    return [];
  }

  return (data as unknown as SupabaseChecklistRow[]).map((row) => mapSupabaseChecklistRow(row));
}
