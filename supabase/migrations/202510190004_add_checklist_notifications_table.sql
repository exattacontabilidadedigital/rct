begin;

create table if not exists public.checklist_notifications (
  id text primary key,
  company_id uuid not null references public.companies (id) on delete cascade,
  checklist_id uuid references public.checklists (id) on delete set null,
  task_id uuid references public.checklist_tasks (id) on delete set null,
  kind text not null,
  severity text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  due_date date,
  phase text,
  pillar text,
  priority text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checklist_notifications_company_idx on public.checklist_notifications (company_id);
create index if not exists checklist_notifications_checklist_idx on public.checklist_notifications (checklist_id);
create index if not exists checklist_notifications_task_idx on public.checklist_notifications (task_id);
create index if not exists checklist_notifications_kind_idx on public.checklist_notifications (kind);

create trigger set_timestamp before update on public.checklist_notifications
  for each row execute procedure public.set_updated_at();

alter table public.checklist_notifications enable row level security;

create policy if not exists "Members read checklist notifications" on public.checklist_notifications
  for select using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = public.checklist_notifications.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

create policy if not exists "Members manage checklist notifications" on public.checklist_notifications
  for all using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = public.checklist_notifications.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

commit;
