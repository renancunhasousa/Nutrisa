create table if not exists public.contract_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  icon text not null default '📋',
  default_price numeric(12,2) not null default 0.00 check (default_price >= 0),
  default_payment_method text not null default 'Pix',
  description text default '',
  consultas_count integer default 1 check (consultas_count >= 1),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create index if not exists contract_plans_org_order_idx
  on public.contract_plans (organization_id, is_active, display_order, created_at);

alter table public.contract_plans enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'contract_plans' and policyname = 'contract_plans_select_module'
  ) then
    create policy contract_plans_select_module
    on public.contract_plans for select to authenticated
    using ((select private.has_module_permission(organization_id, 'contratos')));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'contract_plans' and policyname = 'contract_plans_insert_module'
  ) then
    create policy contract_plans_insert_module
    on public.contract_plans for insert to authenticated
    with check (
      created_by = (select auth.uid())
      and (select private.has_module_permission(organization_id, 'contratos'))
    );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'contract_plans' and policyname = 'contract_plans_update_module'
  ) then
    create policy contract_plans_update_module
    on public.contract_plans for update to authenticated
    using ((select private.has_module_permission(organization_id, 'contratos')))
    with check ((select private.has_module_permission(organization_id, 'contratos')));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'contract_plans' and policyname = 'contract_plans_delete_module'
  ) then
    create policy contract_plans_delete_module
    on public.contract_plans for delete to authenticated
    using ((select private.has_module_permission(organization_id, 'contratos')));
  end if;
end $$;

grant select, insert, update, delete on table public.contract_plans to authenticated;
revoke all on table public.contract_plans from anon;

drop trigger if exists contract_plans_set_updated_at on public.contract_plans;
create trigger contract_plans_set_updated_at
before update on public.contract_plans
for each row execute function private.set_updated_at();
