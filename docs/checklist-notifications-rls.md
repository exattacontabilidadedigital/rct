# Checklist Notifications RLS Guide

`public.checklist_notifications` currently ships with permissive policies so that development environments can mutate the table while RLS is technically enabled. Before re-enabling security in production, apply the tightened rules below.

## Recommended policies

```sql
alter table public.checklist_notifications enable row level security;

create or replace function public.company_actor_can_access(company_uuid uuid)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = company_uuid
      and cm.profile_id = auth.uid()
      and cm.status = 'active'
  )
  or exists (
    select 1
    from public.app_users au
    where au.company_id = company_uuid
      and au.status = 'active'
      and (
        au.auth_user_id = auth.uid()
        or au.id = auth.uid()
      )
  );
$$;

create policy if not exists "Actors can read company notifications" on public.checklist_notifications
  for select
  using (public.company_actor_can_access(checklist_notifications.company_id));

create policy if not exists "Actors can insert company notifications" on public.checklist_notifications
  for insert
  with check (public.company_actor_can_access(checklist_notifications.company_id));

create policy if not exists "Actors can update company notifications" on public.checklist_notifications
  for update
  using (public.company_actor_can_access(checklist_notifications.company_id))
  with check (public.company_actor_can_access(checklist_notifications.company_id));

create policy if not exists "Actors can delete company notifications" on public.checklist_notifications
  for delete
  using (public.company_actor_can_access(checklist_notifications.company_id));
```

### Rationale
- **Separation per verb** makes auditing simpler and blocks privilege escalation bugs if `with check` clauses change later.
- `company_actor_can_access` accepts both active members and active `app_users`, covering owners or staff linked directly to the company table.
- Deleting orphaned rows is still possible for active members, while the service role bypasses policies altogether.

## Deployment plan
1. Generate a new migration (already committed in `supabase/migrations/202510190007_extend_checklist_notifications_rls.sql`).
2. Deploy alongside the main notifications migration (`db push`).
3. Smoke test:
   - Log in as an active company member and mark a notification as read (should succeed).
   - Attempt to tamper with `company_id` via the network inspector (should 403).
   - Try as a user removed from the company — reads and writes should be denied.
4. Once validated, remove any temporary bypass logic and keep RLS enabled everywhere.

## Troubleshooting
- **`PGRST301` errors**: The authenticated user is not marked as `active` in `company_members` or `app_users`; confirm access flags.
- **Bulk sync failures**: Ensure server-side sync uses the service role client (`createSupabaseServiceClient`) so RLS bypasses apply.
- **Local development**: You can temporarily disable RLS locally with `alter table ... disable row level security;` but never commit this.
