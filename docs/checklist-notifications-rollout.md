# Checklist Notifications Rollout Playbook

This checklist covers the operational steps required to ship the Supabase-backed checklist notifications feature across every environment and migrate any pre-existing in-memory notifications.

## 1. Prerequisites
- Supabase CLI v1.161+ installed and authenticated (`supabase login`).
- Access to the corresponding Supabase projects for development, staging, and production.
- `.env` file (or injected variables) including `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL`.
- Recent pull of `master` with migration `202510190004_add_checklist_notifications_table.sql`.

## 2. Run migrations per environment
1. Confirm the target branch is deployed: `git status` should be clean and include the new migration.
2. For each environment (`dev`, `staging`, `prod`):
   - Point your Supabase CLI profile to the correct project id:
     ```powershell
     supabase link --project-ref <project-ref> --password %SUPABASE_DB_PASSWORD%
     ```
   - Apply pending migrations:
     ```powershell
     supabase db push
     ```
   - Verify the table exists:
     ```powershell
     supabase db remote commit --dry-run
     ```
     Confirm `public.checklist_notifications` is present and policy hashes match the repository.
   - Capture the migration log for each environment in the release ticket.

### Quick command checklist (per environment)
- [ ] `supabase link --project-ref <project-ref>`
- [ ] `supabase db push`
- [ ] `supabase db remote commit --dry-run`
- [ ] Record success/failures in rollout log

## 3. Backfill historical notifications (optional but recommended)
If you need to persist notifications that existed prior to deploying the Supabase storage layer:

1. Export a JSON snapshot from production before rollout (for audit).
2. Run the Node backfill script once per environment using service credentials:
  ```powershell
  pnpm tsx scripts/backfill-checklist-notifications.ts
  ```
   The script will upsert notifications based on the builder output and mark historic read state where available.
3. Re-run the onboarding flow in a sandbox tenant to ensure notifications render correctly and stay read after refresh.

> ℹ️ The backfill script is idempotent; re-running it will simply upsert the latest deterministic snapshot and remove obsolete entries for the company.

## 4. Post-deployment checks
- Load the `/app/checklist` page for a company that previously had notifications and confirm they persist after hard refresh.
- Trigger a new notification (e.g., mark a task overdue) and confirm it is inserted into Supabase and can be marked as read.
- Inspect Supabase logs for errors in `checklist_notifications` writes.
- If you re-enable Row Level Security (see `docs/checklist-notifications-rls.md`), confirm queriers without active membership are denied.
- Confirm staging smoke tests before production:
  - [ ] Run through notification read/write scenarios with a regular member session.
  - [ ] Validate service-client sync paths (API session route) still succeed via server logs.
  - [ ] Document the results in the release checklist.

## 5. Rollback plan
- If an unexpected issue occurs, you can disable the feature temporarily by skipping the Supabase sync calls in `auth-context.tsx` (feature flag) and truncating `public.checklist_notifications`.
- Supabase migrations are forward-only; if rollback is absolutely required, create a follow-up migration to drop the table and policies.

---
For related security guidance, see `docs/checklist-notifications-rls.md`. Cleanup automation guidance lives in `docs/checklist-notifications-maintenance.md`.
