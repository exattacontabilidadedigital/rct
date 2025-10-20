begin;

alter table public.companies
  add column if not exists legacy_id text unique;

alter table public.checklists
  add column if not exists legacy_id text,
  add column if not exists reference_date date;

alter table public.checklist_tasks
  add column if not exists blueprint_id text;

commit;
