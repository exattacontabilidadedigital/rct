begin;

create or replace function public.mark_company_notifications_read(
  company_uuid uuid,
  notification_ids text[] default null,
  mark_read boolean default true
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  affected integer := 0;
  target_ids text[];
begin
  if company_uuid is null then
    raise exception 'company_uuid is required';
  end if;

  if not public.company_actor_can_access(company_uuid) then
    raise exception using errcode = '42501', message = 'permission denied for company';
  end if;

  target_ids := notification_ids;

  if target_ids is null then
    update public.checklist_notifications
    set read = mark_read,
        updated_at = timezone('utc', now())
    where company_id = company_uuid
      and read is distinct from mark_read;
    get diagnostics affected = row_count;
    return affected;
  end if;

  if cardinality(target_ids) = 0 then
    return 0;
  end if;

  update public.checklist_notifications
  set read = mark_read,
      updated_at = timezone('utc', now())
  where company_id = company_uuid
    and id = any(target_ids);

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.mark_company_notifications_read(uuid, text[], boolean) is
  'Marks one or all notifications as read/unread after validating the current actor access.';

grant execute on function public.mark_company_notifications_read(uuid, text[], boolean)
  to authenticated, service_role;

create or replace function public.sync_company_notifications(
  company_uuid uuid,
  notifications jsonb default '[]'::jsonb,
  remove_missing boolean default true
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  upserted integer := 0;
  now_ts timestamptz := timezone('utc', now());
begin
  if company_uuid is null then
    raise exception 'company_uuid is required';
  end if;

  if not public.company_actor_can_access(company_uuid) then
    raise exception using errcode = '42501', message = 'permission denied for company';
  end if;

  if notifications is null then
    notifications := '[]'::jsonb;
  end if;

  create temporary table tmp_notifications (
    id text primary key,
    checklist_id text,
    task_id text,
    kind text,
    severity text,
    title text,
    message text,
    read boolean,
    due_date date,
    phase text,
    pillar text,
    priority text,
    metadata jsonb,
    created_at timestamptz,
    updated_at timestamptz
  ) on commit drop;

  insert into tmp_notifications (
    id,
    checklist_id,
    task_id,
    kind,
    severity,
    title,
    message,
    read,
    due_date,
    phase,
    pillar,
    priority,
    metadata,
    created_at,
    updated_at
  )
  select
    coalesce(payload->> 'id', '')::text as id,
    nullif(payload->> 'checklist_id', '')::text,
    nullif(payload->> 'task_id', '')::text,
    coalesce(payload->> 'kind', 'task_event')::text,
    coalesce(payload->> 'severity', 'verde')::text,
    coalesce(payload->> 'title', 'Notificação')::text,
    coalesce(payload->> 'message', '')::text,
    coalesce((payload->> 'read')::boolean, false) as read,
    (payload->> 'due_date')::date,
    nullif(payload->> 'phase', '')::text,
    nullif(payload->> 'pillar', '')::text,
    nullif(payload->> 'priority', '')::text,
    coalesce(payload-> 'metadata', '{}'::jsonb) as metadata,
    coalesce((payload->> 'created_at')::timestamptz, now_ts) as created_at,
    now_ts as updated_at
  from jsonb_array_elements(notifications) as payload
  where payload ? 'id';

  delete from tmp_notifications where coalesce(id, '') = '';

  update tmp_notifications t
  set read = true
  from public.checklist_notifications existing
  where existing.company_id = company_uuid
    and existing.id = t.id
    and existing.read is true;

  insert into public.checklist_notifications as dest (
    id,
    company_id,
    checklist_id,
    task_id,
    kind,
    severity,
    title,
    message,
    read,
    due_date,
    phase,
    pillar,
    priority,
    metadata,
    created_at,
    updated_at
  )
  select
    id,
    company_uuid,
    checklist_id,
    task_id,
    kind,
    severity,
    title,
    message,
    read,
    due_date,
    phase,
    pillar,
    priority,
    metadata,
    created_at,
    updated_at
  from tmp_notifications
  on conflict (id) do update
    set checklist_id = excluded.checklist_id,
        task_id = excluded.task_id,
        kind = excluded.kind,
        severity = excluded.severity,
        title = excluded.title,
        message = excluded.message,
        read = excluded.read,
        due_date = excluded.due_date,
        phase = excluded.phase,
        pillar = excluded.pillar,
        priority = excluded.priority,
        metadata = excluded.metadata,
        created_at = coalesce(excluded.created_at, dest.created_at),
        updated_at = excluded.updated_at
    where dest.company_id = company_uuid;

  get diagnostics upserted = row_count;

  if remove_missing then
    delete from public.checklist_notifications
    where company_id = company_uuid
      and id not in (select id from tmp_notifications);
  end if;

  return upserted;
end;
$$;

comment on function public.sync_company_notifications(uuid, jsonb, boolean) is
  'Performs a transactional synchronization of checklist notifications with optional cleanup for missing rows.';

grant execute on function public.sync_company_notifications(uuid, jsonb, boolean)
  to authenticated, service_role;

commit;
