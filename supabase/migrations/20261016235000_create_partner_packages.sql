-- Migration: 20261016235000_create_partner_packages.sql
-- Criação da tabela de pacotes de parceria clínica e expansão multi-tenant de finance_entries

-- 1. Tabela partner_packages
create table if not exists public.partner_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  patient_name text not null,
  patient_phone text,
  partner_name text not null,
  plan_name text not null,
  frequency text default 'Mensal',
  total_consultations integer not null default 1,
  completed_consultations integer not null default 0,
  package_value numeric(10, 2) not null default 0.00,
  partner_share numeric(10, 2) not null default 0.00,
  payment_status text not null default 'pago',
  status text not null default 'ativo',
  start_date date not null default current_date,
  notes text,
  sessions_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para partner_packages
create index if not exists partner_packages_org_idx
  on public.partner_packages (organization_id);

create index if not exists partner_packages_patient_idx
  on public.partner_packages (organization_id, patient_id);

create index if not exists partner_packages_status_idx
  on public.partner_packages (organization_id, status);

-- Trigger de updated_at
drop trigger if exists partner_packages_set_updated_at on public.partner_packages;
create trigger partner_packages_set_updated_at
before update on public.partner_packages
for each row execute function private.set_updated_at();

-- 2. Atualizar finance_entries para multi-tenant e novas colunas
alter table public.finance_entries
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists payment_method text,
  add column if not exists status text default 'pago';

-- Preencher organization_id legado se houver
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations order by created_at limit 1;
  if v_org_id is not null then
    update public.finance_entries set organization_id = v_org_id where organization_id is null;
  end if;
end $$;

-- 3. Habilitar Row Level Security (RLS) e Policies
alter table public.partner_packages enable row level security;
alter table public.finance_entries enable row level security;

-- Policies para partner_packages
drop policy if exists partner_packages_select_member on public.partner_packages;
create policy partner_packages_select_member on public.partner_packages
  for select to authenticated using ((select private.is_organization_member(organization_id)));

drop policy if exists partner_packages_insert_member on public.partner_packages;
create policy partner_packages_insert_member on public.partner_packages
  for insert to authenticated with check ((select private.is_organization_member(organization_id)));

drop policy if exists partner_packages_update_member on public.partner_packages;
create policy partner_packages_update_member on public.partner_packages
  for update to authenticated using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));

drop policy if exists partner_packages_delete_member on public.partner_packages;
create policy partner_packages_delete_member on public.partner_packages
  for delete to authenticated using ((select private.is_organization_member(organization_id)));

-- Policies para finance_entries
drop policy if exists finance_entries_select_member on public.finance_entries;
create policy finance_entries_select_member on public.finance_entries
  for select to authenticated using (
    organization_id is null or (select private.is_organization_member(organization_id))
  );

drop policy if exists finance_entries_insert_member on public.finance_entries;
create policy finance_entries_insert_member on public.finance_entries
  for insert to authenticated with check (
    organization_id is null or (select private.is_organization_member(organization_id))
  );

drop policy if exists finance_entries_update_member on public.finance_entries;
create policy finance_entries_update_member on public.finance_entries
  for update to authenticated using (
    organization_id is null or (select private.is_organization_member(organization_id))
  ) with check (
    organization_id is null or (select private.is_organization_member(organization_id))
  );

drop policy if exists finance_entries_delete_member on public.finance_entries;
create policy finance_entries_delete_member on public.finance_entries
  for delete to authenticated using (
    organization_id is null or (select private.is_organization_member(organization_id))
  );

-- Grants
grant select, insert, update, delete on table public.partner_packages to authenticated;
grant select, insert, update, delete on table public.finance_entries to authenticated;
