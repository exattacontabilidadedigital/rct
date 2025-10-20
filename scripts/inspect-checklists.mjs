import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const main = async () => {
  const { data, error } = await supabase
    .from("checklists")
    .select(
      `id, company_id, name, created_at, updated_at, checklist_tasks (id, title, owner, status, phase, priority, due_date, pillar, tags)`
    )
    .limit(10);

  if (error) {
    console.error("Supabase error", error);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
};

main().catch((error) => {
  console.error("Unexpected failure", error);
  process.exit(1);
});
