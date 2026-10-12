create or replace function private.bootstrap_organization_internal(
  p_name text default 'NutrIsa'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_organization_id uuid;
  v_name text := nullif(btrim(p_name), '');
  v_slug text;
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória';
  end if;

  select membership.organization_id
  into v_organization_id
  from public.organization_members membership
  where membership.user_id = v_user_id
  order by membership.created_at
  limit 1;

  if v_organization_id is not null then
    return v_organization_id;
  end if;

  select organization.id
  into v_organization_id
  from public.organizations organization
  where not exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = organization.id
  )
  order by (organization.slug = 'nutrisa') desc, organization.created_at
  limit 1
  for update of organization skip locked;

  if v_organization_id is null then
    v_name := coalesce(v_name, 'NutrIsa');
    v_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
    v_slug := coalesce(nullif(v_slug, ''), 'organizacao');

    insert into public.organizations (name, slug)
    values (v_name, v_slug || '-' || left(gen_random_uuid()::text, 8))
    returning id into v_organization_id;
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_organization_id, v_user_id, 'owner');

  return v_organization_id;
end;
$$;

revoke all on function private.bootstrap_organization_internal(text) from public, anon;
grant execute on function private.bootstrap_organization_internal(text) to authenticated;

create or replace function public.bootstrap_organization(p_name text default 'NutrIsa')
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.bootstrap_organization_internal(p_name);
$$;

revoke all on function public.bootstrap_organization(text) from public, anon;
grant execute on function public.bootstrap_organization(text) to authenticated;

comment on function public.bootstrap_organization(text) is
  'RPC autenticada sem elevação direta; delega o bootstrap à implementação privada e protegida.';
