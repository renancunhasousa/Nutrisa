set lock_timeout = '10s';

alter table public.organization_members
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists permissions text[] not null default '{}'::text[];

alter table public.organization_members drop constraint if exists organization_members_role_check;
alter table public.organization_members add constraint organization_members_role_check
  check (role in ('owner', 'professional', 'receptionist', 'assistant', 'custom'));

update public.organization_members
set permissions = array['pacientes','crm','laudo','anamnese','dietas','produtos','dashboard','agenda','tarefas','contratos','marketing','ai','configuracoes']::text[]
where role = 'owner' and cardinality(permissions) = 0;

create or replace function private.prevent_owner_self_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner' and old.user_id = (select auth.uid()) and (
    tg_op = 'DELETE' or new.role <> 'owner' or new.user_id is distinct from old.user_id
    or new.organization_id is distinct from old.organization_id
  ) then
    raise exception 'O owner nao pode remover ou rebaixar o proprio acesso mestre';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$;
revoke all on function private.prevent_owner_self_change() from public, anon, authenticated;

drop trigger if exists organization_members_prevent_owner_self_change on public.organization_members;
create trigger organization_members_prevent_owner_self_change
before update or delete on public.organization_members
for each row execute function private.prevent_owner_self_change();

create table if not exists private.clinic_invite_codes (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  code text not null,
  updated_at timestamptz not null default now(),
  constraint clinic_invite_code_format check (code ~ '^[A-Z0-9][A-Z0-9-]{5,63}$')
);
create unique index if not exists clinic_invite_codes_code_uidx
  on private.clinic_invite_codes (upper(code));

create table if not exists private.team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null,
  permissions text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_invitations_email_not_blank check (btrim(email) <> ''),
  constraint team_invitations_role_check check (role in ('owner','professional','receptionist','assistant','custom')),
  unique (organization_id, email)
);

revoke all on table private.clinic_invite_codes, private.team_invitations from public, anon, authenticated;

create or replace function private.valid_permissions(p_permissions text[])
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(array_agg(distinct permission order by permission), '{}'::text[])
  from unnest(coalesce(p_permissions, '{}'::text[])) permission
  where permission = any(array['pacientes','crm','laudo','anamnese','dietas','produtos','dashboard','agenda','tarefas','contratos','marketing','ai','configuracoes']::text[]);
$$;
revoke all on function private.valid_permissions(text[]) from public, anon, authenticated;

create or replace function private.has_module_permission(p_organization_id uuid, p_module text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and (membership.role = 'owner' or p_module = any(membership.permissions))
  );
$$;
revoke all on function private.has_module_permission(uuid, text) from public, anon;
grant execute on function private.has_module_permission(uuid, text) to authenticated;

create or replace function private.can_access_module(p_module text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.organization_members m where m.user_id=(select auth.uid()) and (m.role='owner' or p_module=any(m.permissions)));
$$;
revoke all on function private.can_access_module(text) from public, anon;
grant execute on function private.can_access_module(text) to authenticated;

create or replace function public.get_my_clinic_membership()
returns table (organization_id uuid, user_id uuid, display_name text, email text, role text, permissions text[], is_owner boolean)
language sql stable security definer set search_path = '' as $$
  select m.organization_id, m.user_id, coalesce(m.display_name, u.raw_user_meta_data->>'full_name', u.email),
    coalesce(m.email, u.email), m.role, m.permissions, m.role = 'owner'
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where m.user_id = (select auth.uid())
  order by m.created_at limit 1;
$$;
revoke all on function public.get_my_clinic_membership() from public, anon;
grant execute on function public.get_my_clinic_membership() to authenticated;

create or replace function public.get_clinic_invite_code(p_organization_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_code text;
begin
  if not private.has_organization_role(p_organization_id, array['owner']::text[]) then raise exception 'Apenas o owner pode acessar o convite'; end if;
  select code into v_code from private.clinic_invite_codes where organization_id = p_organization_id;
  if v_code is null then
    v_code := 'NUTRISA-' || upper(left(replace(p_organization_id::text, '-', ''), 8));
    insert into private.clinic_invite_codes(organization_id, code) values (p_organization_id, v_code);
  end if;
  return v_code;
end; $$;

create or replace function public.set_clinic_invite_code(p_organization_id uuid, p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_code text := upper(regexp_replace(btrim(coalesce(p_code,'')), '[^A-Za-z0-9-]', '', 'g'));
begin
  if not private.has_organization_role(p_organization_id, array['owner']::text[]) then raise exception 'Apenas o owner pode alterar o convite'; end if;
  if v_code !~ '^[A-Z0-9][A-Z0-9-]{5,63}$' then raise exception 'Codigo deve ter entre 6 e 64 caracteres'; end if;
  insert into private.clinic_invite_codes(organization_id, code) values (p_organization_id, v_code)
  on conflict (organization_id) do update set code = excluded.code, updated_at = now();
  return v_code;
end; $$;

create or replace function public.list_clinic_team(p_organization_id uuid)
returns table (id text, user_id uuid, name text, email text, role text, permissions text[], is_owner boolean, status text)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_organization_role(p_organization_id, array['owner']::text[]) then raise exception 'Apenas o owner pode gerenciar a equipe'; end if;
  return query
    select team.member_id, team.member_user_id, team.member_name, team.member_email,
      team.member_role, team.member_permissions, team.member_is_owner, team.member_status
    from (
      select m.user_id::text as member_id, m.user_id as member_user_id,
        coalesce(m.display_name,u.raw_user_meta_data->>'full_name',u.email) as member_name,
        coalesce(m.email,u.email) as member_email, m.role as member_role,
        m.permissions as member_permissions, m.role='owner' as member_is_owner, 'active'::text as member_status
      from public.organization_members m join auth.users u on u.id=m.user_id
      where m.organization_id=p_organization_id
      union all
      select i.id::text, null::uuid, i.display_name, i.email, i.role, i.permissions, false, 'pending'::text
      from private.team_invitations i where i.organization_id=p_organization_id
    ) team
    order by team.member_is_owner desc, team.member_name;
end; $$;

create or replace function public.save_clinic_team_member(p_organization_id uuid, p_id text, p_name text, p_email text, p_role text, p_permissions text[])
returns text language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(btrim(p_email)); v_user_id uuid; v_id uuid; v_permissions text[]; v_role text := p_role;
begin
  if not private.has_organization_role(p_organization_id, array['owner']::text[]) then raise exception 'Apenas o owner pode gerenciar a equipe'; end if;
  if v_email = '' or btrim(coalesce(p_name,'')) = '' then raise exception 'Nome e email sao obrigatorios'; end if;
  if v_role not in ('owner','professional','receptionist','assistant','custom') then raise exception 'Papel invalido'; end if;
  v_permissions := case when v_role='owner' then array['pacientes','crm','laudo','anamnese','dietas','produtos','dashboard','agenda','tarefas','contratos','marketing','ai','configuracoes']::text[] else private.valid_permissions(p_permissions) end;
  select id into v_user_id from auth.users where lower(email)=v_email limit 1;
  if v_user_id is not null then
    insert into public.organization_members(organization_id,user_id,display_name,email,role,permissions)
    values(p_organization_id,v_user_id,btrim(p_name),v_email,v_role,v_permissions)
    on conflict(organization_id,user_id) do update set display_name=excluded.display_name,email=excluded.email,role=excluded.role,permissions=excluded.permissions;
    delete from private.team_invitations where organization_id=p_organization_id and email=v_email;
    return v_user_id::text;
  end if;
  if p_id is not null and p_id ~ '^[0-9a-fA-F-]{36}$' then v_id := p_id::uuid; end if;
  insert into private.team_invitations(id,organization_id,email,display_name,role,permissions)
  values(coalesce(v_id,gen_random_uuid()),p_organization_id,v_email,btrim(p_name),v_role,v_permissions)
  on conflict(organization_id,email) do update set display_name=excluded.display_name,role=excluded.role,permissions=excluded.permissions,updated_at=now()
  returning id into v_id;
  return v_id::text;
end; $$;

create or replace function public.delete_clinic_team_member(p_organization_id uuid, p_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_organization_role(p_organization_id, array['owner']::text[]) then raise exception 'Apenas o owner pode gerenciar a equipe'; end if;
  delete from private.team_invitations where organization_id=p_organization_id and id::text=p_id;
  delete from public.organization_members where organization_id=p_organization_id and user_id::text=p_id and role <> 'owner';
end; $$;

create or replace function public.join_clinic_with_code(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid()); v_email text; v_invite private.team_invitations%rowtype;
begin
  if v_user_id is null then raise exception 'Autenticacao obrigatoria'; end if;
  select lower(email) into v_email from auth.users where id=v_user_id;
  select i.* into v_invite from private.team_invitations i join private.clinic_invite_codes c using(organization_id)
  where upper(c.code)=upper(btrim(p_code)) and lower(i.email)=v_email limit 1;
  if v_invite.id is null then raise exception 'Convite invalido ou nao destinado a este email'; end if;
  insert into public.organization_members(organization_id,user_id,display_name,email,role,permissions)
  values(v_invite.organization_id,v_user_id,v_invite.display_name,v_email,v_invite.role,v_invite.permissions)
  on conflict(organization_id,user_id) do update set display_name=excluded.display_name,email=excluded.email,role=excluded.role,permissions=excluded.permissions;
  delete from private.team_invitations where id=v_invite.id;
  return v_invite.organization_id;
end; $$;

do $$ declare f regprocedure; begin
  foreach f in array array[
    'public.get_clinic_invite_code(uuid)'::regprocedure,'public.set_clinic_invite_code(uuid,text)'::regprocedure,
    'public.list_clinic_team(uuid)'::regprocedure,'public.save_clinic_team_member(uuid,text,text,text,text,text[])'::regprocedure,
    'public.delete_clinic_team_member(uuid,text)'::regprocedure,'public.join_clinic_with_code(text)'::regprocedure
  ] loop execute format('revoke all on function %s from public, anon', f); execute format('grant execute on function %s to authenticated', f); end loop;
end $$;

-- Clinical records are protected by the same module capability enforced in the UI.
-- Owners always pass private.has_module_permission.
do $$
declare
  v_table text;
  v_module text;
  v_policy record;
begin
  for v_table, v_module in
    select * from (values
      ('physical_evaluations','laudo'), ('anamnese','anamnese'), ('plano_alimentar','dietas'),
      ('log_conversas','dashboard'), ('appointments','agenda'), ('nutrisa_tasks','tarefas'),
      ('contracts','contratos'), ('product_catalog','produtos')
    ) mapping(table_name, module_id)
  loop
    if to_regclass('public.' || v_table) is null then continue; end if;
    execute format('alter table public.%I enable row level security', v_table);
    for v_policy in select policyname from pg_policies where schemaname='public' and tablename=v_table
    loop execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_table); end loop;
    execute format('create policy %I on public.%I for select to authenticated using ((select private.has_module_permission(organization_id, %L)))', v_table||'_select_module', v_table, v_module);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.has_module_permission(organization_id, %L)))', v_table||'_insert_module', v_table, v_module);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.has_module_permission(organization_id, %L))) with check ((select private.has_module_permission(organization_id, %L)))', v_table||'_update_module', v_table, v_module, v_module);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.has_module_permission(organization_id, %L)))', v_table||'_delete_module', v_table, v_module);
  end loop;
end $$;

drop policy if exists product_catalog_select_module on public.product_catalog;
create policy product_catalog_select_module on public.product_catalog for select to authenticated
using (
  (organization_id is null and (select private.can_access_module('produtos')))
  or (select private.has_module_permission(organization_id, 'produtos'))
);

notify pgrst, 'reload schema';
