begin;

create or replace function public.cleanup_orphan_checklist_notifications(limit_count integer default 500)
returns table (deleted_id text)
language plpgsql
security definer
set search_path = public, extensions
as $$
with candidates as (
  select n.id
  from public.checklist_notifications n
  left join public.checklist_tasks t on t.id = n.task_id
  left join public.checklists c on c.id = n.checklist_id
  where (n.task_id is not null and t.id is null)
     or (n.checklist_id is not null and c.id is null)
  order by n.created_at asc
  limit limit_count
)
delete from public.checklist_notifications n
using candidates c
where n.id = c.id
returning n.id;
$$;

grant execute on function public.cleanup_orphan_checklist_notifications(integer) to service_role;

commit;
