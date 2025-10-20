import "dotenv/config";

import { createSupabaseServiceClient } from "@/lib/supabase";

async function main() {
  const supabase = createSupabaseServiceClient();
  const limit = Number.parseInt(process.env.NOTIFICATION_CLEANUP_LIMIT ?? "500", 10);

  console.log(`🧹 Starting orphan notification cleanup (batch size: ${limit}).`);

  const { data, error } = await supabase.rpc("cleanup_orphan_checklist_notifications", {
    limit_count: limit,
  });

  if (error) {
    console.error("❌ Failed to remove orphan notifications", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("✨ No orphan notifications detected.");
    return;
  }

  console.log(`🗑️ Removed ${data.length} notifications:`);
  for (const row of data) {
    console.log(`  • ${row.deleted_id}`);
  }
}

main().catch((err) => {
  console.error("❌ Unexpected cleanup failure", err);
  process.exit(1);
});
