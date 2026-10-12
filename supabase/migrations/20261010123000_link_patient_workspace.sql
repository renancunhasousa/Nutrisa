set lock_timeout = '10s';

-- NutrIsa is intentionally single-clinic for this phase. The first authenticated
-- account claims the existing clinic; later accounts require explicit membership.
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
begin
  if v_user_id is null then
    raise exception 'Autenticacao obrigatoria';
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
  where organization.slug = 'nutrisa'
  for update;

  if v_organization_id is null then
    raise exception 'Organizacao NutrIsa nao encontrada';
  end if;

  if exists (
    select 1 from public.organization_members membership
    where membership.organization_id = v_organization_id
  ) then
    raise exception 'Usuario sem acesso a NutrIsa';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_organization_id, v_user_id, 'owner');

  return v_organization_id;
end;
$$;

revoke all on function private.bootstrap_organization_internal(text) from public, anon;
grant execute on function private.bootstrap_organization_internal(text) to authenticated;

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

alter table public.physical_evaluations
  add column if not exists organization_id uuid,
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists notes text,
  add column if not exists status text not null default 'completed',
  add column if not exists updated_at timestamptz not null default now();

alter table public.anamnese
  add column if not exists organization_id uuid,
  add column if not exists patient_answers text,
  add column if not exists professional_notes text,
  add column if not exists report text,
  add column if not exists patient_translation text,
  add column if not exists clinic_insights text,
  add column if not exists status text not null default 'completed';

alter table public.plano_alimentar
  add column if not exists organization_id uuid;

alter table public.log_conversas
  add column if not exists organization_id uuid,
  add column if not exists patient_id uuid;

alter table public.appointments
  add column if not exists organization_id uuid,
  add column if not exists external_provider text,
  add column if not exists external_id text,
  add column if not exists summary text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.nutrisa_tasks
  add column if not exists organization_id uuid,
  add column if not exists patient_id uuid;

alter table public.contracts
  add column if not exists organization_id uuid,
  add column if not exists patient_id uuid,
  add column if not exists public_token uuid,
  add column if not exists signed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.contracts
set public_token = id
where public_token is null;

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

  update public.physical_evaluations set organization_id = v_organization_id where organization_id is null;
  update public.anamnese set organization_id = v_organization_id where organization_id is null;
  update public.plano_alimentar set organization_id = v_organization_id where organization_id is null;
  update public.log_conversas set organization_id = v_organization_id where organization_id is null;
  update public.appointments set organization_id = v_organization_id where organization_id is null;
  update public.nutrisa_tasks set organization_id = v_organization_id where organization_id is null;
  update public.contracts set organization_id = v_organization_id where organization_id is null;
end
$$;

-- Automatic linking is deliberately limited to an unambiguous exact phone match.
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
update public.nutrisa_tasks task
set patient_id = patient_phone.patient_id
from patient_phones patient_phone
where task.patient_id is null
  and task.organization_id = patient_phone.organization_id
  and private.normalize_phone(task.patient_phone) = patient_phone.normalized_phone;

alter table public.physical_evaluations alter column organization_id set not null;
alter table public.anamnese alter column organization_id set not null;
alter table public.plano_alimentar alter column organization_id set not null;
alter table public.log_conversas alter column organization_id set not null;
alter table public.appointments alter column organization_id set not null;
alter table public.nutrisa_tasks alter column organization_id set not null;
alter table public.contracts alter column organization_id set not null;
alter table public.contracts alter column public_token set default gen_random_uuid();
alter table public.contracts alter column public_token set not null;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'physical_evaluations', 'anamnese', 'plano_alimentar', 'log_conversas',
    'appointments', 'nutrisa_tasks', 'contracts'
  ]
  loop
    if not exists (
      select 1 from pg_constraint
      where conrelid = format('public.%I', v_table)::regclass
        and conname = v_table || '_organization_id_fkey'
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (organization_id) references public.organizations(id) on delete restrict',
        v_table,
        v_table || '_organization_id_fkey'
      );
    end if;

    if not exists (
      select 1 from pg_constraint
      where conrelid = format('public.%I', v_table)::regclass
        and conname = v_table || '_patient_tenant_fkey'
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (patient_id, organization_id) references public.patients(id, organization_id) on delete cascade',
        v_table,
        v_table || '_patient_tenant_fkey'
      );
    end if;
  end loop;
end
$$;

create unique index if not exists contracts_public_token_uidx
  on public.contracts (public_token);
create unique index if not exists appointments_external_event_uidx
  on public.appointments (organization_id, external_provider, external_id)
  where external_provider is not null and external_id is not null;

create index if not exists physical_evaluations_patient_date_idx
  on public.physical_evaluations (organization_id, patient_id, evaluation_date desc);
create index if not exists anamnese_patient_created_idx
  on public.anamnese (organization_id, patient_id, created_at desc);
create index if not exists plano_alimentar_patient_updated_idx
  on public.plano_alimentar (organization_id, patient_id, updated_at desc);
create index if not exists log_conversas_patient_sent_idx
  on public.log_conversas (organization_id, patient_id, data_envio desc);
create index if not exists appointments_patient_scheduled_idx
  on public.appointments (organization_id, patient_id, scheduled_at desc);
create index if not exists nutrisa_tasks_patient_due_idx
  on public.nutrisa_tasks (organization_id, patient_id, due_date desc);
create index if not exists contracts_patient_created_idx
  on public.contracts (organization_id, patient_id, created_at desc);

drop trigger if exists physical_evaluations_set_updated_at on public.physical_evaluations;
create trigger physical_evaluations_set_updated_at
before update on public.physical_evaluations
for each row execute function private.set_updated_at();

drop trigger if exists anamnese_set_updated_at on public.anamnese;
create trigger anamnese_set_updated_at
before update on public.anamnese
for each row execute function private.set_updated_at();

drop trigger if exists plano_alimentar_set_updated_at on public.plano_alimentar;
create trigger plano_alimentar_set_updated_at
before update on public.plano_alimentar
for each row execute function private.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function private.set_updated_at();

drop trigger if exists nutrisa_tasks_set_updated_at on public.nutrisa_tasks;
create trigger nutrisa_tasks_set_updated_at
before update on public.nutrisa_tasks
for each row execute function private.set_updated_at();

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function private.set_updated_at();

do $$
declare
  v_table text;
  v_policy record;
begin
  foreach v_table in array array[
    'physical_evaluations', 'anamnese', 'plano_alimentar', 'log_conversas',
    'appointments', 'nutrisa_tasks', 'contracts'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);

    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = v_table
    loop
      execute format('drop policy if exists %I on public.%I', v_policy.policyname, v_table);
    end loop;

    execute format(
      'create policy %I on public.%I for select to authenticated using ((select private.is_organization_member(organization_id)))',
      v_table || '_select_member', v_table
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_organization_member(organization_id)))',
      v_table || '_insert_member', v_table
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.is_organization_member(organization_id))) with check ((select private.is_organization_member(organization_id)))',
      v_table || '_update_member', v_table
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_organization_member(organization_id)))',
      v_table || '_delete_member', v_table
    );

    execute format('revoke all on table public.%I from anon, authenticated', v_table);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', v_table);
  end loop;
end
$$;

create or replace function public.get_contract_for_signature(p_token uuid)
returns table (
  patient_name text,
  plan text,
  final_content text,
  status text,
  created_at timestamptz,
  signed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    contract.patient_name,
    contract.plan,
    contract.final_content,
    contract.status,
    contract.created_at,
    contract.signed_at
  from public.contracts contract
  where contract.public_token = p_token
  limit 1;
$$;

create or replace function public.sign_contract(
  p_token uuid,
  p_signature_base64 text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_signature_base64 is null
    or length(p_signature_base64) > 2000000
    or p_signature_base64 !~ '^data:image/(png|jpeg);base64,' then
    raise exception 'Assinatura invalida';
  end if;

  update public.contracts
  set signature_base64 = p_signature_base64,
      status = 'signed',
      signed_at = now(),
      updated_at = now()
  where public_token = p_token
    and coalesce(status, 'pending') <> 'signed';

  return found;
end;
$$;

revoke all on function public.get_contract_for_signature(uuid) from public;
revoke all on function public.sign_contract(uuid, text) from public;
grant execute on function public.get_contract_for_signature(uuid) to anon, authenticated;
grant execute on function public.sign_contract(uuid, text) to anon, authenticated;

comment on function public.get_contract_for_signature(uuid) is
  'Returns only the fields required by the public signature page; the contracts table remains private.';
comment on function public.sign_contract(uuid, text) is
  'Signs a pending contract through an unguessable public token without exposing table access.';
