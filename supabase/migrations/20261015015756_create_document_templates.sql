create table public.document_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_type text not null check (template_type in ('anamnese', 'contrato')),
  name text not null check (length(btrim(name)) between 1 and 120),
  content jsonb not null,
  source_key text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, template_type, source_key)
);

create index document_templates_org_type_updated_idx
  on public.document_templates (organization_id, template_type, updated_at desc);

alter table public.document_templates enable row level security;

create policy document_templates_select_module
on public.document_templates for select to authenticated
using ((select private.has_module_permission(
  organization_id,
  case template_type when 'anamnese' then 'anamnese' else 'contratos' end
)));

create policy document_templates_insert_module
on public.document_templates for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_module_permission(
    organization_id,
    case template_type when 'anamnese' then 'anamnese' else 'contratos' end
  ))
);

create policy document_templates_update_module
on public.document_templates for update to authenticated
using ((select private.has_module_permission(
  organization_id,
  case template_type when 'anamnese' then 'anamnese' else 'contratos' end
)))
with check ((select private.has_module_permission(
  organization_id,
  case template_type when 'anamnese' then 'anamnese' else 'contratos' end
)));

create policy document_templates_delete_module
on public.document_templates for delete to authenticated
using ((select private.has_module_permission(
  organization_id,
  case template_type when 'anamnese' then 'anamnese' else 'contratos' end
)));

grant select, insert, update, delete on table public.document_templates to authenticated;
revoke all on table public.document_templates from anon;

create trigger document_templates_set_updated_at
before update on public.document_templates
for each row execute function private.set_updated_at();
