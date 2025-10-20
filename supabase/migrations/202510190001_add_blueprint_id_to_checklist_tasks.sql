 begin;

alter table public.checklist_tasks
  add column if not exists blueprint_id text;

commit;
