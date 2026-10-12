set lock_timeout = '5s';

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (btrim(name) <> ''),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  constraint organization_members_role_check
    check (role in ('owner', 'professional', 'receptionist', 'assistant'))
);

create index if not exists organization_members_user_idx
  on public.organization_members (user_id, organization_id);

create or replace function private.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_organization_role(
  p_organization_id uuid,
  p_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role = any (p_roles)
  );
$$;

revoke all on function private.is_organization_member(uuid) from public;
revoke all on function private.has_organization_role(uuid, text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, text[]) to authenticated;

-- Keep the legacy patient columns during the expand-and-contract migration.
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  name text,
  birth_date date,
  gender text,
  cpf text,
  email text,
  phone text,
  avatar_url text,
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.patients
  add column if not exists name text,
  add column if not exists birth_date date,
  add column if not exists gender text,
  add column if not exists cpf text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists status text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz,
  add column if not exists organization_id uuid,
  add column if not exists full_name text,
  add column if not exists preferred_name text,
  add column if not exists sex text,
  add column if not exists whatsapp_phone text,
  add column if not exists acquisition_source text,
  add column if not exists lifecycle_stage text,
  add column if not exists last_consultation_at timestamptz,
  add column if not exists next_appointment_at timestamptz,
  add column if not exists active_plan_id uuid,
  add column if not exists consent_health_data_at timestamptz,
  add column if not exists consent_communications_at timestamptz,
  add column if not exists consent_photos_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists source text,
  add column if not exists external_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

insert into public.organizations (name, slug)
values ('NutrIsa', 'nutrisa')
on conflict (slug) do nothing;

-- Replace any legacy status check before translating values such as "ativo".
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select constraint_name.conname
    from pg_constraint constraint_name
    where constraint_name.conrelid = 'public.patients'::regclass
      and constraint_name.contype = 'c'
      and pg_get_constraintdef(constraint_name.oid) ~* '\mstatus\M'
  loop
    execute format(
      'alter table public.patients drop constraint %I',
      constraint_record.conname
    );
  end loop;
end
$$;

update public.patients
set organization_id = (
  select organization.id
  from public.organizations organization
  where organization.slug = 'nutrisa'
)
where organization_id is null;

update public.patients
set full_name = coalesce(nullif(btrim(full_name), ''), nullif(btrim(name), ''), 'Paciente legado ' || left(id::text, 8)),
    name = coalesce(nullif(btrim(name), ''), nullif(btrim(full_name), ''), 'Paciente legado ' || left(id::text, 8)),
    sex = coalesce(nullif(btrim(sex), ''), nullif(btrim(gender), '')),
    lifecycle_stage = case
      when lower(coalesce(lifecycle_stage, '')) in ('lead', 'scheduled', 'active', 'at_risk', 'inactive', 'churned')
        then lower(lifecycle_stage)
      when lower(coalesce(status, '')) in ('inactive', 'inativo', 'archived', 'arquivado') then 'inactive'
      else 'active'
    end,
    status = case
      when lower(coalesce(status, '')) in ('archived', 'arquivado', 'inactive', 'inativo') then 'archived'
      when lower(coalesce(status, '')) in ('blocked', 'bloqueado') then 'blocked'
      when lower(coalesce(status, '')) in ('active', 'ativo') then 'active'
      else 'active'
    end,
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, created_at, now());

alter table public.patients
  alter column organization_id set not null,
  alter column full_name set not null,
  alter column lifecycle_stage set default 'lead',
  alter column lifecycle_stage set not null,
  alter column status set default 'active',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_organization_id_fkey'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_id_organization_id_key'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_id_organization_id_key unique (id, organization_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_lifecycle_stage_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_lifecycle_stage_check
      check (lifecycle_stage in ('lead', 'scheduled', 'active', 'at_risk', 'inactive', 'churned'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_status_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_status_check
      check (status in ('active', 'archived', 'blocked'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_full_name_not_blank'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_full_name_not_blank check (btrim(full_name) <> '');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_cpf_format_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_cpf_format_check
      check (cpf is null or length(regexp_replace(cpf, '[^0-9]', '', 'g')) = 11)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_metadata_object_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_metadata_object_check
      check (jsonb_typeof(metadata) = 'object');
  end if;
end
$$;

alter table public.patients
  add column if not exists full_name_normalized text generated always as (
    lower(regexp_replace(btrim(full_name), '\s+', ' ', 'g'))
  ) stored,
  add column if not exists cpf_normalized text generated always as (
    nullif(regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g'), '')
  ) stored,
  add column if not exists phone_normalized text generated always as (
    case
      when regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = '' then null
      when length(regexp_replace(phone, '[^0-9]', '', 'g')) in (10, 11)
        then '55' || regexp_replace(phone, '[^0-9]', '', 'g')
      else regexp_replace(phone, '[^0-9]', '', 'g')
    end
  ) stored,
  add column if not exists whatsapp_phone_normalized text generated always as (
    case
      when regexp_replace(coalesce(whatsapp_phone, ''), '[^0-9]', '', 'g') = '' then null
      when length(regexp_replace(whatsapp_phone, '[^0-9]', '', 'g')) in (10, 11)
        then '55' || regexp_replace(whatsapp_phone, '[^0-9]', '', 'g')
      else regexp_replace(whatsapp_phone, '[^0-9]', '', 'g')
    end
  ) stored;

create unique index if not exists patients_organization_cpf_uidx
  on public.patients (organization_id, cpf_normalized)
  where cpf_normalized is not null and length(cpf_normalized) = 11;

create unique index if not exists patients_organization_source_external_uidx
  on public.patients (organization_id, source, external_id)
  where source is not null and external_id is not null;

create index if not exists patients_organization_name_idx
  on public.patients (organization_id, full_name_normalized);

create index if not exists patients_organization_lifecycle_idx
  on public.patients (organization_id, lifecycle_stage, status);

create index if not exists patients_organization_phone_idx
  on public.patients (organization_id, phone_normalized)
  where phone_normalized is not null;

create index if not exists patients_organization_whatsapp_idx
  on public.patients (organization_id, whatsapp_phone_normalized)
  where whatsapp_phone_normalized is not null;

create table if not exists public.patient_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  patient_id uuid not null,
  type text not null,
  value text not null,
  label text,
  is_primary boolean not null default false,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_contacts_patient_tenant_fkey
    foreign key (patient_id, organization_id)
    references public.patients (id, organization_id)
    on delete cascade,
  constraint patient_contacts_type_check
    check (type in ('phone', 'whatsapp', 'email', 'other')),
  constraint patient_contacts_value_not_blank check (btrim(value) <> ''),
  constraint patient_contacts_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

alter table public.patient_contacts
  add column if not exists normalized_value text generated always as (
    case
      when type in ('phone', 'whatsapp') then
        case
          when regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g') = '' then null
          when length(regexp_replace(value, '[^0-9]', '', 'g')) in (10, 11)
            then '55' || regexp_replace(value, '[^0-9]', '', 'g')
          else regexp_replace(value, '[^0-9]', '', 'g')
        end
      when type = 'email' then lower(btrim(value))
      else lower(btrim(value))
    end
  ) stored;

create unique index if not exists patient_contacts_unique_value_uidx
  on public.patient_contacts (organization_id, patient_id, type, normalized_value)
  where normalized_value is not null;

create unique index if not exists patient_contacts_one_primary_uidx
  on public.patient_contacts (patient_id, type)
  where is_primary;

create index if not exists patient_contacts_lookup_idx
  on public.patient_contacts (organization_id, type, normalized_value);

create table if not exists public.patient_audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  patient_id uuid not null,
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  changed_fields text[] not null default '{}'::text[],
  occurred_at timestamptz not null default now(),
  constraint patient_audit_log_action_check check (action in ('INSERT', 'UPDATE', 'DELETE'))
);

create index if not exists patient_audit_log_patient_idx
  on public.patient_audit_log (organization_id, patient_id, occurred_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.sync_patient_legacy_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.full_name := coalesce(nullif(btrim(new.full_name), ''), nullif(btrim(new.name), ''));
    new.name := coalesce(nullif(btrim(new.name), ''), new.full_name);
    new.sex := coalesce(nullif(btrim(new.sex), ''), nullif(btrim(new.gender), ''));
    new.gender := coalesce(nullif(btrim(new.gender), ''), new.sex);
    if (select auth.uid()) is not null then
      new.created_by := (select auth.uid());
      new.updated_by := (select auth.uid());
    end if;
  else
    if new.full_name is distinct from old.full_name then
      new.name := new.full_name;
    elsif new.name is distinct from old.name then
      new.full_name := new.name;
    end if;

    if new.sex is distinct from old.sex then
      new.gender := new.sex;
    elsif new.gender is distinct from old.gender then
      new.sex := new.gender;
    end if;

    if (select auth.uid()) is not null then
      new.created_by := old.created_by;
      new.updated_by := (select auth.uid());
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.prevent_patient_tenant_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id do paciente não pode ser alterado';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_last_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner'
    and (
      tg_op = 'DELETE'
      or new.role <> 'owner'
      or new.organization_id is distinct from old.organization_id
    )
    and not exists (
      select 1
      from public.organization_members membership
      where membership.organization_id = old.organization_id
        and membership.user_id <> old.user_id
        and membership.role = 'owner'
    ) then
    raise exception 'A organização precisa manter ao menos um owner';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.audit_patient_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed_fields text[] := '{}'::text[];
begin
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(changed.key order by changed.key), '{}'::text[])
    into v_changed_fields
    from (
      select coalesce(new_value.key, old_value.key) as key
      from jsonb_each(to_jsonb(new)) new_value
      full join jsonb_each(to_jsonb(old)) old_value using (key)
      where new_value.value is distinct from old_value.value
        and coalesce(new_value.key, old_value.key) <> 'updated_at'
    ) changed;
  else
    v_changed_fields := array['*'];
  end if;

  insert into public.patient_audit_log (
    organization_id,
    patient_id,
    action,
    actor_id,
    changed_fields
  ) values (
    case when tg_op = 'DELETE' then old.organization_id else new.organization_id end,
    case when tg_op = 'DELETE' then old.id else new.id end,
    tg_op,
    (select auth.uid()),
    v_changed_fields
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.sync_patient_legacy_fields() from public;
revoke all on function private.prevent_patient_tenant_change() from public;
revoke all on function private.prevent_last_organization_owner() from public;
revoke all on function private.audit_patient_change() from public;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function private.set_updated_at();

drop trigger if exists organization_members_keep_owner on public.organization_members;
create trigger organization_members_keep_owner
before update or delete on public.organization_members
for each row execute function private.prevent_last_organization_owner();

drop trigger if exists patients_sync_legacy_fields on public.patients;
create trigger patients_sync_legacy_fields
before insert or update on public.patients
for each row execute function private.sync_patient_legacy_fields();

drop trigger if exists patients_prevent_tenant_change on public.patients;
create trigger patients_prevent_tenant_change
before update on public.patients
for each row execute function private.prevent_patient_tenant_change();

drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at
before update on public.patients
for each row execute function private.set_updated_at();

drop trigger if exists patients_write_audit on public.patients;
create trigger patients_write_audit
after insert or update or delete on public.patients
for each row execute function private.audit_patient_change();

drop trigger if exists patient_contacts_set_updated_at on public.patient_contacts;
create trigger patient_contacts_set_updated_at
before update on public.patient_contacts
for each row execute function private.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.patients enable row level security;
alter table public.patient_contacts enable row level security;
alter table public.patient_audit_log enable row level security;

-- Remove legacy patient policies before defining tenant-aware policies.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'patients'
  loop
    execute format('drop policy if exists %I on public.patients', policy_record.policyname);
  end loop;
end
$$;

create policy organizations_select_member
on public.organizations
for select
to authenticated
using ((select private.is_organization_member(id)));

create policy organizations_update_owner
on public.organizations
for update
to authenticated
using ((select private.has_organization_role(id, array['owner']::text[])))
with check ((select private.has_organization_role(id, array['owner']::text[])));

create policy organization_members_select_member
on public.organization_members
for select
to authenticated
using ((select private.is_organization_member(organization_id)));

create policy organization_members_insert_owner
on public.organization_members
for insert
to authenticated
with check ((select private.has_organization_role(organization_id, array['owner']::text[])));

create policy organization_members_update_owner
on public.organization_members
for update
to authenticated
using ((select private.has_organization_role(organization_id, array['owner']::text[])))
with check ((select private.has_organization_role(organization_id, array['owner']::text[])));

create policy organization_members_delete_owner
on public.organization_members
for delete
to authenticated
using ((select private.has_organization_role(organization_id, array['owner']::text[])));

create policy patients_select_member
on public.patients
for select
to authenticated
using ((select private.is_organization_member(organization_id)));

create policy patients_insert_member
on public.patients
for insert
to authenticated
with check ((select private.is_organization_member(organization_id)));

create policy patients_update_member
on public.patients
for update
to authenticated
using ((select private.is_organization_member(organization_id)))
with check ((select private.is_organization_member(organization_id)));

create policy patients_delete_owner
on public.patients
for delete
to authenticated
using ((select private.has_organization_role(organization_id, array['owner']::text[])));

create policy patient_contacts_select_member
on public.patient_contacts
for select
to authenticated
using ((select private.is_organization_member(organization_id)));

create policy patient_contacts_insert_member
on public.patient_contacts
for insert
to authenticated
with check ((select private.is_organization_member(organization_id)));

create policy patient_contacts_update_member
on public.patient_contacts
for update
to authenticated
using ((select private.is_organization_member(organization_id)))
with check ((select private.is_organization_member(organization_id)));

create policy patient_contacts_delete_member
on public.patient_contacts
for delete
to authenticated
using ((select private.is_organization_member(organization_id)));

create policy patient_audit_log_select_clinical_team
on public.patient_audit_log
for select
to authenticated
using ((select private.has_organization_role(
  organization_id,
  array['owner', 'professional', 'assistant']::text[]
)));

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;
revoke all on table public.patients from anon, authenticated;
revoke all on table public.patient_contacts from anon, authenticated;
revoke all on table public.patient_audit_log from anon, authenticated;

grant select, update on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organization_members to authenticated;
grant select, insert, update, delete on table public.patients to authenticated;
grant select, insert, update, delete on table public.patient_contacts to authenticated;
grant select on table public.patient_audit_log to authenticated;

create or replace function public.bootstrap_organization(p_name text default 'NutrIsa')
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

revoke all on function public.bootstrap_organization(text) from public, anon;
grant execute on function public.bootstrap_organization(text) to authenticated;

comment on table public.patients is
  'Cadastro operacional central do paciente. Dados clínicos detalhados pertencem às tabelas de consultas, anamneses e avaliações.';
comment on column public.patients.name is
  'Coluna legada mantida temporariamente em sincronia com full_name.';
comment on column public.patients.gender is
  'Coluna legada mantida temporariamente em sincronia com sex.';
comment on column public.patients.active_plan_id is
  'Referência reservada ao plano vigente; a FK será adicionada com o módulo de planos versionados.';
comment on table public.patient_contacts is
  'Contatos normalizados e históricos do paciente, isolados por organização.';
comment on table public.patient_audit_log is
  'Auditoria mínima das alterações cadastrais; não armazena snapshots de dados pessoais.';
