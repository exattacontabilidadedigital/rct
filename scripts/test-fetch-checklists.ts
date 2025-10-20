import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const client = createClient(url, serviceRole, { auth: { persistSession: false } });

const projections = [
  `id, reference_date, company_id, name, description, created_at, updated_at, checklist_tasks (
      id, blueprint_id, board_id, title, description, severity, status, owner, category, due_date, phase, pillar, priority, reference_items, evidence_items, note_items, tags, created_at, updated_at
    )`,
  `id, reference_date, company_id, name, description, created_at, updated_at, checklist_tasks (
      id, board_id, title, description, severity, status, owner, category, due_date, phase, pillar, priority, reference_items, evidence_items, note_items, tags, created_at, updated_at
    )`,
  `id, company_id, name, description, created_at, updated_at, checklist_tasks (
      id, board_id, title, description, severity, status, owner, category, due_date, created_at, updated_at
    )`,
];

async function fetchBoards(companyId: string) {
  if (!/[0-9a-fA-F-]{36}/.test(companyId)) {
    console.log(`Skipping non-UUID company ${companyId}`);
    return [];
  }

  for (const projection of projections) {
    const { data, error } = await client
      .from("checklists")
      .select(projection)
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (!error) {
      return data ?? [];
    }

    if (error.code !== "42703" && error.code !== "PGRST204") {
      throw error;
    }

    console.warn(`Projection failed (${error.code}); retrying with fallback projection...`);
  }

  return [];
}

fetchBoards("18d0b86a-20f9-43c7-ba52-1d9bbb34c43e")
  .then((boards) => {
    console.log(`Fetched ${boards.length} boards with fallback logic.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to fetch boards", error);
    process.exit(1);
  });
