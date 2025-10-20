# Checklist Notifications Maintenance

This document outlines how to keep `public.checklist_notifications` tidy by clearing rows that reference deleted checklists or tasks.

## On-demand cleanup
A service-role script lives at `scripts/cleanup-orphan-checklist-notifications.ts` and calls the stored procedure `cleanup_orphan_checklist_notifications()`.

```powershell
pnpm tsx scripts/cleanup-orphan-checklist-notifications.ts
```

Environment variables required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional `NOTIFICATION_CLEANUP_LIMIT` (default: `500`).

The script logs every deleted notification id. It exits with code `0` if nothing is removed.

## Scheduled execution (Supabase cron)
1. Deploy the migration `202510190006_add_cleanup_orphan_notifications_function.sql`.
2. Create a scheduled task in Supabase (Dashboard → Edge Functions → Scheduled Jobs):
    - **Job name:** `cleanup-orphan-notifications`
    - **Schedule:** `0 5 * * 1` (Mondays at 05:00 UTC) or adjust cadence.
    - **Hook target:** Edge Function or webhook that executes the RPC with the service role key.
    - **Payload (JSON):** `{"limit_count": 1000}`
3. CLI alternative using pg cron runner:
    ```powershell
    supabase functions deploy cleanup-orphans --import-map supabase/functions/import_map.json
    supabase functions trigger cleanup-orphans --payload '{"limit_count": 1000}'
    ```
4. Infrastructure cron (example GitHub Actions workflow):
    ```yaml
    name: cleanup-orphan-notifications
    on:
       schedule:
          - cron: "0 5 * * 1"
    jobs:
       cleanup:
          runs-on: ubuntu-latest
          steps:
             - uses: actions/checkout@v4
             - uses: pnpm/action-setup@v4
                with:
                   version: 9
             - run: pnpm install --frozen-lockfile
             - run: pnpm tsx scripts/cleanup-orphan-checklist-notifications.ts
                env:
                   SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
                   SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
                   NOTIFICATION_CLEANUP_LIMIT: "1000"
    ```

## Monitoring
- Track deleted counts in logs; sustained high numbers may indicate an upstream sync bug.
- Add an alert if the procedure fails (Supabase returns non-2xx) so you can inspect why checklist/task deletions are out of sync.

## Safety notes
- The database function runs as `SECURITY DEFINER` but execution is restricted to the service role; do not expose it via anon keys.
- The function deletes in batches (default 500). If the backlog is larger, run multiple times or increase the limit.
