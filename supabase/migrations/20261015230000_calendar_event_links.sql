-- Vínculo entre nomes de eventos do Google Calendar (sem telefone) e pacientes.
-- A chave é o nome normalizado do evento, assim um vínculo vale para todos os eventos desse nome.
create table if not exists public.calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name_key text not null check (length(btrim(name_key)) > 0),
  patient_id uuid references public.patients(id) on delete cascade,
  ignored boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_event_links_target_check check (patient_id is not null or ignored),
  constraint calendar_event_links_unique_name unique (organization_id, name_key)
);

create index if not exists calendar_event_links_patient_idx
  on public.calendar_event_links (organization_id, patient_id);

alter table public.calendar_event_links enable row level security;

drop policy if exists calendar_event_links_select_module on public.calendar_event_links;
create policy calendar_event_links_select_module on public.calendar_event_links for select to authenticated
  using ((select private.has_module_permission(organization_id, 'crm')));

drop policy if exists calendar_event_links_insert_module on public.calendar_event_links;
create policy calendar_event_links_insert_module on public.calendar_event_links for insert to authenticated
  with check ((select private.has_module_permission(organization_id, 'crm')));

drop policy if exists calendar_event_links_update_module on public.calendar_event_links;
create policy calendar_event_links_update_module on public.calendar_event_links for update to authenticated
  using ((select private.has_module_permission(organization_id, 'crm')))
  with check ((select private.has_module_permission(organization_id, 'crm')));

drop policy if exists calendar_event_links_delete_module on public.calendar_event_links;
create policy calendar_event_links_delete_module on public.calendar_event_links for delete to authenticated
  using ((select private.has_module_permission(organization_id, 'crm')));

notify pgrst, 'reload schema';
