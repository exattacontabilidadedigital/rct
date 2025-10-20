begin;

drop policy if exists "Members manage checklist notifications" on public.checklist_notifications;
drop policy if exists "Members read checklist notifications" on public.checklist_notifications;

create policy "Members can read company notifications" on public.checklist_notifications
  for select
  using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = checklist_notifications.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

create policy "Members can insert company notifications" on public.checklist_notifications
  for insert
  with check (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = checklist_notifications.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

create policy "Members can update company notifications" on public.checklist_notifications
  for update
  using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = checklist_notifications.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  )
  with check (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = checklist_notifications.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

create policy "Members can delete company notifications" on public.checklist_notifications
  for delete
  using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = checklist_notifications.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

commit;
