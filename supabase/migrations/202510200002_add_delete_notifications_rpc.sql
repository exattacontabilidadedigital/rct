begin;

create or replace function public.delete_company_notifications(
  company_uuid uuid,
  notification_ids text[]
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  affected integer := 0;
begin
  if company_uuid is null then
    raise exception 'company_uuid is required';
  end if;

  if notification_ids is null or array_length(notification_ids, 1) is null then
    return affected;
  end if;

  if not public.company_actor_can_access(company_uuid) then
    raise exception using errcode = '42501', message = 'permission denied for company';
  end if;

  delete from public.checklist_notifications
  where company_id = company_uuid
    and id = any(notification_ids);

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.delete_company_notifications(uuid, text[]) is
  'Deletes a list of notifications for a company after validating actor permissions.';

grant execute on function public.delete_company_notifications(uuid, text[])
  to authenticated, service_role;

commit;
