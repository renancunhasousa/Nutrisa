create or replace function private.normalize_phone(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when regexp_replace(coalesce(p_value, ''), '[^0-9]', '', 'g') = '' then null
    when length(regexp_replace(p_value, '[^0-9]', '', 'g')) in (10, 11)
      then '55' || regexp_replace(p_value, '[^0-9]', '', 'g')
    else regexp_replace(p_value, '[^0-9]', '', 'g')
  end;
$$;

revoke all on function private.normalize_phone(text) from public;

alter table public.log_conversas
  add column if not exists organization_id uuid,
  add column if not exists patient_id uuid;

do $$
declare
  v_organization_id uuid;
begin
  select id into v_organization_id
  from public.organizations
  where slug = 'nutrisa';

  if v_organization_id is null then
    raise exception 'Organizacao NutrIsa nao encontrada';
  end if;

  update public.log_conversas
  set organization_id = v_organization_id
  where organization_id is null;
end
$$;

with patient_phones as (
  select organization_id, normalized_phone, min(patient_id::text)::uuid as patient_id
  from (
    select id as patient_id, organization_id, phone_normalized as normalized_phone
    from public.patients
    where phone_normalized is not null
    union all
    select id, organization_id, whatsapp_phone_normalized
    from public.patients
    where whatsapp_phone_normalized is not null
  ) phones
  group by organization_id, normalized_phone
  having count(distinct patient_id) = 1
)
update public.log_conversas conversation
set patient_id = patient_phone.patient_id
from patient_phones patient_phone
where conversation.patient_id is null
  and conversation.organization_id = patient_phone.organization_id
  and private.normalize_phone(conversation.contato_jid) = patient_phone.normalized_phone;

alter table public.log_conversas alter column organization_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.log_conversas'::regclass
      and conname = 'log_conversas_organization_id_fkey'
  ) then
    alter table public.log_conversas
      add constraint log_conversas_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.log_conversas'::regclass
      and conname = 'log_conversas_patient_tenant_fkey'
  ) then
    alter table public.log_conversas
      add constraint log_conversas_patient_tenant_fkey
      foreign key (patient_id, organization_id)
      references public.patients(id, organization_id) on delete cascade;
  end if;
end
$$;

create index if not exists log_conversas_patient_sent_idx
  on public.log_conversas (organization_id, patient_id, data_envio desc);

alter table public.log_conversas enable row level security;

drop policy if exists log_conversas_select_member on public.log_conversas;
drop policy if exists log_conversas_insert_member on public.log_conversas;
drop policy if exists log_conversas_update_member on public.log_conversas;
drop policy if exists log_conversas_delete_member on public.log_conversas;

create policy log_conversas_select_member on public.log_conversas
  for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy log_conversas_insert_member on public.log_conversas
  for insert to authenticated
  with check ((select private.is_organization_member(organization_id)));
create policy log_conversas_update_member on public.log_conversas
  for update to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));
create policy log_conversas_delete_member on public.log_conversas
  for delete to authenticated
  using ((select private.is_organization_member(organization_id)));

revoke all on table public.log_conversas from anon, authenticated;
grant select, insert, update, delete on table public.log_conversas to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'log_conversas'
  ) then
    alter publication supabase_realtime add table public.log_conversas;
  end if;
end
$$;
