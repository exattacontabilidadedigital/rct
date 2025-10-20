import "dotenv/config";

import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing Supabase URL or anon key in .env");
  process.exit(1);
}

const client = createClient(url, anonKey, { auth: { persistSession: false } });

async function main() {
  const boardId = "ba0021c6-73c9-5251-a3d8-010817353c94";
  const basePayload = {
    id: randomUUID(),
    blueprint_id: "manual-test",
    board_id: boardId,
    title: "Tarefa teste via fallback",
    description: "Inserida por script de validação",
    severity: "laranja",
    status: "todo",
    owner: "Equipe",
    category: "Planejamento",
    due_date: null,
    phase: null,
    pillar: null,
    priority: null,
    reference_items: null,
    evidence_items: null,
    note_items: null,
    tags: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from("checklist_tasks").insert(basePayload);

  if (!error) {
    console.log("Unexpected: insert succeeded without hitting fallback");
    return;
  }

  console.log("Initial insert error", error.code, error.message);

  if (error.code !== "PGRST204" && error.code !== "42703") {
    console.error("Unexpected error code", error);
    process.exit(1);
  }

  const { blueprint_id: _discard, ...fallbackPayload } = basePayload;
  void _discard;
  const { error: fallbackError } = await client.from("checklist_tasks").insert(fallbackPayload);
  if (fallbackError) {
    console.error("Fallback insert failed", fallbackError);
    process.exit(1);
  }

  console.log("Fallback insert succeeded", fallbackPayload.id);
}

main().catch((error) => {
  console.error("Unexpected failure", error);
  process.exit(1);
});
