begin;

create table if not exists public.checklist_task_audits (
  id text primary key,
  company_id uuid not null references public.companies (id) on delete cascade,
  checklist_id uuid not null references public.checklists (id) on delete cascade,
  task_id uuid not null references public.checklist_tasks (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  actor_name text,
  actor_role text,
  event text not null,
  summary text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checklist_task_audits_company_idx on public.checklist_task_audits (company_id);
create index if not exists checklist_task_audits_checklist_idx on public.checklist_task_audits (checklist_id);
create index if not exists checklist_task_audits_task_idx on public.checklist_task_audits (task_id);
create index if not exists checklist_task_audits_created_at_idx on public.checklist_task_audits (created_at desc);

create trigger set_timestamp before update on public.checklist_task_audits
  for each row execute procedure public.set_updated_at();

alter table public.checklist_task_audits enable row level security;

drop policy if exists "Actors can read task audits" on public.checklist_task_audits;
create policy "Actors can read task audits" on public.checklist_task_audits
  for select using (
    public.company_actor_can_access(checklist_task_audits.company_id)
  );

drop policy if exists "Actors can insert task audits" on public.checklist_task_audits;
create policy "Actors can insert task audits" on public.checklist_task_audits
  for insert with check (
    public.company_actor_can_access(checklist_task_audits.company_id)
  );

commit;
