# Checklist Notifications – Staging Validation

Run this checklist after deploying the Supabase migrations and before re-enabling RLS in production.

## 1. Pre-flight
- [ ] Confirm `supabase db push` completed in staging (link to rollout log).
- [ ] Ensure staging `.env` contains `SUPABASE_SERVICE_ROLE_KEY` for the server sync path.
- [ ] Clear local caches and restart the staging frontend to avoid stale session data.

## 2. Authenticated member flow
1. Log in as an active company member (non-admin works).
2. Navigate to `/app/checklist` and confirm notifications load without errors.
3. Mark a notification as read, refresh the page, and verify the read state persists.
4. Trigger a new notification (e.g., force a task overdue) and confirm it appears within 60 seconds.
5. Inspect the network tab to ensure `setSupabaseNotificationRead` calls return `200`.

## 3. Unauthorized access checks
- [ ] Remove the test user from the company and attempt to reload notifications → expect `403`.
- [ ] With developer tools, try to modify `company_id` in the request payload → expect rejection.
- [ ] Verify there are no anonymous writes in the Supabase logs during the window.

## 4. Service role sync
- [ ] Trigger any server-side sync path (e.g., re-opening the dashboard) and verify the route handler persists notifications without RLS failures.
- [ ] Check Supabase logs for `cleanup_orphan_checklist_notifications` access denials (should be none).

## 5. Sign-off
- [ ] Capture screenshots or console logs showing successful read/write attempts.
- [ ] Update the release ticket with outcomes for each step.
- [ ] Once all boxes are checked, re-enable RLS in production and redeploy.
