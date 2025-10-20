begin;

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

comment on function public.company_actor_can_access(uuid) is 'Returns true when the current auth user can read/write data for the given company.';

-- Recreate policies to rely on the helper guard

drop policy if exists "Members can read company notifications" on public.checklist_notifications;
drop policy if exists "Members can insert company notifications" on public.checklist_notifications;
drop policy if exists "Members can update company notifications" on public.checklist_notifications;
drop policy if exists "Members can delete company notifications" on public.checklist_notifications;

create policy "Actors can read company notifications" on public.checklist_notifications
  for select
  using (
    public.company_actor_can_access(checklist_notifications.company_id)
  );

create policy "Actors can insert company notifications" on public.checklist_notifications
  for insert
  with check (
    public.company_actor_can_access(checklist_notifications.company_id)
  );

create policy "Actors can update company notifications" on public.checklist_notifications
  for update
  using (
    public.company_actor_can_access(checklist_notifications.company_id)
  )
  with check (
    public.company_actor_can_access(checklist_notifications.company_id)
  );

create policy "Actors can delete company notifications" on public.checklist_notifications
  for delete
  using (
    public.company_actor_can_access(checklist_notifications.company_id)
  );

commit;
