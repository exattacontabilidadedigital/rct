begin;

-- Extensions
create extension if not exists "pgcrypto" with schema public;

-- Enums
create type public.user_role as enum ('empresa', 'colaborador', 'contador');
create type public.maturity_level as enum ('inicial', 'em_adaptacao', 'avancado');
create type public.risk_level as enum ('verde', 'laranja', 'vermelho');
create type public.checklist_pillar as enum ('planejamento', 'operacoes', 'compliance');
create type public.checklist_status as enum ('draft', 'in_progress', 'completed');
create type public.checklist_item_status as enum ('pending', 'in_progress', 'completed', 'blocked');
create type public.content_type as enum ('artigo', 'video', 'curso', 'ebook', 'mapa_mental', 'webinar');
create type public.membership_status as enum ('active', 'invited', 'inactive');
create type public.alert_status as enum ('active', 'resolved');

-- Utility function for updated_at columns
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role public.user_role not null default 'empresa',
  full_name text,
  phone text,
  avatar_url text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  cnpj text unique,
  regime text not null,
  sector text,
  maturity public.maturity_level not null default 'inicial',
  risk_level public.risk_level not null default 'verde',
  checklist_progress numeric(5,2) not null default 0,
  origin text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Company members (empresa, colaborador, contador)
create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.user_role not null,
  status public.membership_status not null default 'active',
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz default now(),
  joined_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, profile_id)
);
create index company_members_company_idx on public.company_members (company_id);
create index company_members_profile_idx on public.company_members (profile_id);

-- Checklist templates (base definitions)
create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  version integer not null default 1,
  default_maturity public.maturity_level not null default 'inicial',
  is_active boolean not null default true,
  applicability jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Checklist sections (pillars / grupos)
create table public.checklist_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  title text not null,
  pillar public.checklist_pillar not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, position)
);
create index checklist_sections_template_idx on public.checklist_sections (template_id);

-- Checklist items (per template/section)
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates (id) on delete cascade,
  section_id uuid not null references public.checklist_sections (id) on delete cascade,
  title text not null,
  description text,
  severity public.risk_level not null default 'laranja',
  required boolean not null default true,
  resources jsonb not null default '[]'::jsonb,
  effort_hours numeric(4,1),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_id, position)
);
create index checklist_items_template_idx on public.checklist_items (template_id);
create index checklist_items_section_idx on public.checklist_items (section_id);

-- Company checklist instances (uma empresa executando um template)
create table public.company_checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  template_id uuid not null references public.checklist_templates (id) on delete restrict,
  status public.checklist_status not null default 'in_progress',
  progress numeric(5,2) not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, template_id, status)
);
create index company_checklists_company_idx on public.company_checklists (company_id);

-- Company checklist item progress
create table public.company_checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_checklist_id uuid not null references public.company_checklists (id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items (id) on delete cascade,
  status public.checklist_item_status not null default 'pending',
  assigned_to uuid references public.profiles (id) on delete set null,
  due_date date,
  completed_at timestamptz,
  notes text,
  evidence_url text,
  score numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_checklist_id, checklist_item_id)
);
create index company_checklist_items_checklist_idx on public.company_checklist_items (company_checklist_id);
create index company_checklist_items_assigned_idx on public.company_checklist_items (assigned_to);

-- Conteúdos educativos e materiais
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  content_type public.content_type not null,
  url text,
  is_premium boolean not null default false,
  tags text[] not null default array[]::text[],
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_items_type_idx on public.content_items (content_type);
create index content_items_published_idx on public.content_items (published_at);

-- Alertas e notificações geradas para o dashboard
create table public.company_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  source text not null,
  title text not null,
  description text,
  severity public.risk_level not null default 'laranja',
  status public.alert_status not null default 'active',
  actionable_until date,
  resolved_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index company_alerts_company_idx on public.company_alerts (company_id);
create index company_alerts_status_idx on public.company_alerts (status);

-- Triggers for updated_at
create trigger set_timestamp before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.companies
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.company_members
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.checklist_templates
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.checklist_sections
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.checklist_items
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.company_checklists
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.company_checklist_items
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.content_items
  for each row execute procedure public.set_updated_at();
create trigger set_timestamp before update on public.company_alerts
  for each row execute procedure public.set_updated_at();

-- Row Level Security policies
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_sections enable row level security;
alter table public.checklist_items enable row level security;
alter table public.company_checklists enable row level security;
alter table public.company_checklist_items enable row level security;
alter table public.content_items enable row level security;
alter table public.company_alerts enable row level security;

-- Profiles RLS
create policy "View own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Insert own profile" on public.profiles
  for insert with check (id = auth.uid());
create policy "Update own profile" on public.profiles
  for update using (id = auth.uid());

-- Companies RLS
create policy "Members view company" on public.companies
  for select using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = public.companies.id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );
create policy "Owners create company" on public.companies
  for insert with check (owner_profile_id = auth.uid());
create policy "Owners update company" on public.companies
  for update using (owner_profile_id = auth.uid());

-- Company members RLS
create policy "Members read memberships" on public.company_members
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1
      from public.company_members cm
      where cm.company_id = public.company_members.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );
create policy "Users join companies" on public.company_members
  for insert with check (profile_id = auth.uid());
create policy "Users update membership" on public.company_members
  for update using (profile_id = auth.uid());

-- Checklist templates & items (read-only for authenticated users)
create policy "Templates readable" on public.checklist_templates
  for select using (true);
create policy "Sections readable" on public.checklist_sections
  for select using (true);
create policy "Items readable" on public.checklist_items
  for select using (true);

-- Company checklist RLS
create policy "Members read company checklists" on public.company_checklists
  for select using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = public.company_checklists.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );
create policy "Members manage company checklists" on public.company_checklists
  for all using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = public.company_checklists.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

-- Company checklist items RLS
create policy "Members manage checklist items" on public.company_checklist_items
  for all using (
    exists (
      select 1
      from public.company_checklists ccl
      join public.company_members cm on cm.company_id = ccl.company_id
      where ccl.id = public.company_checklist_items.company_checklist_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

-- Content readable por qualquer usuário autenticado ou anônimo
create policy "Public content" on public.content_items
  for select using (true);

-- Alerts RLS
create policy "Members manage alerts" on public.company_alerts
  for all using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = public.company_alerts.company_id
        and cm.profile_id = auth.uid()
        and cm.status = 'active'
    )
  );

commit;
