-- ============================================================================
-- Módulo de Finanças & Parcerias (Pacotes de Acompanhamento e Fluxo de Caixa)
-- ============================================================================

-- 1. Atualizar validação de permissões da equipe para incluir o módulo 'financas'
create or replace function private.valid_permissions(p_permissions text[])
returns text[]
language sql
immutable
set search_path to ''
as $function$
  select coalesce(array_agg(distinct permission order by permission), '{}'::text[])
  from unnest(coalesce(p_permissions, '{}'::text[])) permission
  where permission = any(array[
    'pacientes',
    'crm',
    'laudo',
    'anamnese',
    'dietas',
    'produtos',
    'dashboard',
    'agenda',
    'tarefas',
    'financas',
    'contratos',
    'marketing',
    'ai',
    'configuracoes'
  ]::text[]);
$function$;

create or replace function public.save_clinic_team_member(
  p_organization_id uuid,
  p_id text,
  p_name text,
  p_email text,
  p_role text,
  p_permissions text[]
)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_email text := lower(btrim(p_email));
  v_user_id uuid;
  v_id uuid;
  v_permissions text[];
  v_role text := p_role;
begin
  if not private.has_organization_role(p_organization_id, array['owner']::text[]) then
    raise exception 'Apenas o owner pode gerenciar a equipe';
  end if;
  if v_email = '' or btrim(coalesce(p_name, '')) = '' then
    raise exception 'Nome e email sao obrigatorios';
  end if;
  if v_role not in ('owner', 'professional', 'receptionist', 'assistant', 'custom') then
    raise exception 'Papel invalido';
  end if;

  v_permissions := case
    when v_role = 'owner' then array[
      'pacientes',
      'crm',
      'laudo',
      'anamnese',
      'dietas',
      'produtos',
      'dashboard',
      'agenda',
      'tarefas',
      'financas',
      'contratos',
      'marketing',
      'ai',
      'configuracoes'
    ]::text[]
    else private.valid_permissions(p_permissions)
  end;

  select id into v_user_id from auth.users where lower(email) = v_email limit 1;
  if v_user_id is not null then
    insert into public.organization_members(organization_id, user_id, display_name, email, role, permissions)
    values (p_organization_id, v_user_id, btrim(p_name), v_email, v_role, v_permissions)
    on conflict (organization_id, user_id) do update
      set display_name = excluded.display_name,
          email = excluded.email,
          role = excluded.role,
          permissions = excluded.permissions;

    delete from private.team_invitations where organization_id = p_organization_id and email = v_email;
    return v_user_id::text;
  end if;

  if p_id is not null and p_id ~ '^[0-9a-fA-F-]{36}$' then
    v_id := p_id::uuid;
  end if;

  insert into private.team_invitations(id, organization_id, email, display_name, role, permissions)
  values (coalesce(v_id, gen_random_uuid()), p_organization_id, v_email, btrim(p_name), v_role, v_permissions)
  on conflict (organization_id, email) do update
    set display_name = excluded.display_name,
        role = excluded.role,
        permissions = excluded.permissions,
        updated_at = now()
  returning id into v_id;

  return v_id::text;
end;
$function$;

-- Garantir que os owners existentes possuam 'financas' listado no array de permissões
update public.organization_members
set permissions = array_append(permissions, 'financas')
where role = 'owner'
  and not ('financas' = any(permissions));

-- 2. Tabela de Pacotes & Parcerias (public.finance_packages)
create table if not exists public.finance_packages (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  patient_name text not null,
  patient_phone text not null default '',
  partner_name text not null default '',
  plan_name text not null,
  frequency text not null default 'Mensal',
  total_consultations integer not null default 1 check (total_consultations >= 1),
  completed_consultations integer not null default 0 check (completed_consultations >= 0),
  package_value numeric(12,2) not null default 0,
  partner_share numeric(12,2) not null default 0,
  payment_status text not null default 'pago' check (payment_status in ('pago', 'parcial', 'pendente')),
  status text not null default 'ativo' check (status in ('ativo', 'concluido', 'pausado', 'cancelado')),
  start_date date,
  notes text not null default '',
  sessions_history jsonb not null default '[]'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_packages_org_status_idx
  on public.finance_packages (organization_id, status, created_at desc);

create index if not exists finance_packages_patient_id_idx
  on public.finance_packages (patient_id);

-- 3. Tabela de Lançamentos Financeiros / Fluxo de Caixa (public.finance_transactions)
create table if not exists public.finance_transactions (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  package_id text references public.finance_packages(id) on delete set null,
  description text not null,
  category text not null default 'Consulta Avulsa',
  type text not null default 'receita' check (type in ('receita', 'despesa')),
  amount numeric(12,2) not null default 0,
  date date not null default current_date,
  status text not null default 'pago' check (status in ('pago', 'pendente')),
  payment_method text not null default 'Pix',
  notes text not null default '',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_transactions_org_date_idx
  on public.finance_transactions (organization_id, date desc, created_at desc);

create index if not exists finance_transactions_package_id_idx
  on public.finance_transactions (package_id);

create index if not exists finance_transactions_patient_id_idx
  on public.finance_transactions (patient_id);

-- 4. Trigger para preencher organization_id automaticamente, vincular paciente por nome se aplicável e atualizar updated_at
create or replace function private.prepare_finance_package_row()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_patient_id uuid;
  v_patient_phone text;
begin
  if new.organization_id is null then
    select m.organization_id into new.organization_id
    from public.organization_members m
    where m.user_id = (select auth.uid())
    order by m.created_at
    limit 1;

    if new.organization_id is null then
      select o.id into new.organization_id
      from public.organizations o
      where o.slug = 'nutrisa'
      limit 1;
    end if;
  end if;

  if new.patient_id is null and btrim(coalesce(new.patient_name, '')) <> '' and new.organization_id is not null then
    select p.id, coalesce(nullif(p.whatsapp_phone, ''), p.phone, '')
    into v_patient_id, v_patient_phone
    from public.patients p
    where p.organization_id = new.organization_id
      and p.deleted_at is null
      and lower(btrim(p.full_name)) = lower(btrim(new.patient_name))
    limit 1;

    if v_patient_id is not null then
      new.patient_id := v_patient_id;
      if btrim(coalesce(new.patient_phone, '')) = '' and btrim(coalesce(v_patient_phone, '')) <> '' then
        new.patient_phone := v_patient_phone;
      end if;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := coalesce(new.updated_at, now());
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_prepare_finance_package_row on public.finance_packages;
create trigger trg_prepare_finance_package_row
  before insert or update on public.finance_packages
  for each row execute function private.prepare_finance_package_row();

create or replace function private.prepare_finance_transaction_row()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.organization_id is null then
    select m.organization_id into new.organization_id
    from public.organization_members m
    where m.user_id = (select auth.uid())
    order by m.created_at
    limit 1;

    if new.organization_id is null then
      select o.id into new.organization_id
      from public.organizations o
      where o.slug = 'nutrisa'
      limit 1;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := coalesce(new.updated_at, now());
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_prepare_finance_transaction_row on public.finance_transactions;
create trigger trg_prepare_finance_transaction_row
  before insert or update on public.finance_transactions
  for each row execute function private.prepare_finance_transaction_row();

-- 5. Políticas de Row Level Security (RLS)
alter table public.finance_packages enable row level security;

drop policy if exists finance_packages_select_module on public.finance_packages;
create policy finance_packages_select_module on public.finance_packages
  for select to authenticated
  using ((select private.has_module_permission(organization_id, 'financas')));

drop policy if exists finance_packages_insert_module on public.finance_packages;
create policy finance_packages_insert_module on public.finance_packages
  for insert to authenticated
  with check ((select private.has_module_permission(organization_id, 'financas')));

drop policy if exists finance_packages_update_module on public.finance_packages;
create policy finance_packages_update_module on public.finance_packages
  for update to authenticated
  using ((select private.has_module_permission(organization_id, 'financas')))
  with check ((select private.has_module_permission(organization_id, 'financas')));

drop policy if exists finance_packages_delete_module on public.finance_packages;
create policy finance_packages_delete_module on public.finance_packages
  for delete to authenticated
  using ((select private.has_module_permission(organization_id, 'financas')));

alter table public.finance_transactions enable row level security;

drop policy if exists finance_transactions_select_module on public.finance_transactions;
create policy finance_transactions_select_module on public.finance_transactions
  for select to authenticated
  using ((select private.has_module_permission(organization_id, 'financas')));

drop policy if exists finance_transactions_insert_module on public.finance_transactions;
create policy finance_transactions_insert_module on public.finance_transactions
  for insert to authenticated
  with check ((select private.has_module_permission(organization_id, 'financas')));

drop policy if exists finance_transactions_update_module on public.finance_transactions;
create policy finance_transactions_update_module on public.finance_transactions
  for update to authenticated
  using ((select private.has_module_permission(organization_id, 'financas')))
  with check ((select private.has_module_permission(organization_id, 'financas')));

drop policy if exists finance_transactions_delete_module on public.finance_transactions;
create policy finance_transactions_delete_module on public.finance_transactions
  for delete to authenticated
  using ((select private.has_module_permission(organization_id, 'financas')));

notify pgrst, 'reload schema';
