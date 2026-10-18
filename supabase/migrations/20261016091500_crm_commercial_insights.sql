-- Histórico e persistência de insights comerciais gerados por IA no CRM
create table if not exists public.crm_commercial_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  insight jsonb not null,
  model_used text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_commercial_insights_org_idx
  on public.crm_commercial_insights (organization_id, created_at desc);

alter table public.crm_commercial_insights enable row level security;

drop policy if exists crm_commercial_insights_select_module on public.crm_commercial_insights;
create policy crm_commercial_insights_select_module on public.crm_commercial_insights for select to authenticated
  using ((select private.has_module_permission(organization_id, 'crm')));

drop policy if exists crm_commercial_insights_insert_module on public.crm_commercial_insights;
create policy crm_commercial_insights_insert_module on public.crm_commercial_insights for insert to authenticated
  with check ((select private.has_module_permission(organization_id, 'crm')));

notify pgrst, 'reload schema';
