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

commit;
