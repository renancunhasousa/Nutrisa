set lock_timeout = '10s';

create table if not exists public.clinic_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  name text not null default '',
  title text not null default '',
  crn text not null default '',
  phone text not null default '',
  email text not null default '',
  clinic text not null default '',
  address text not null default '',
  instagram text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clinic_profiles is 'Perfil profissional da clínica e do nutricionista responsável vinculado à organização.';

alter table public.clinic_profiles enable row level security;

drop policy if exists clinic_profiles_select on public.clinic_profiles;
create policy clinic_profiles_select
on public.clinic_profiles for select to authenticated
using ((select private.is_organization_member(organization_id)));

drop policy if exists clinic_profiles_insert on public.clinic_profiles;
create policy clinic_profiles_insert
on public.clinic_profiles for insert to authenticated
with check ((select private.is_organization_member(organization_id)));

drop policy if exists clinic_profiles_update on public.clinic_profiles;
create policy clinic_profiles_update
on public.clinic_profiles for update to authenticated
using ((select private.is_organization_member(organization_id)))
with check ((select private.is_organization_member(organization_id)));

-- Seed para a organização padrão se já existir
insert into public.clinic_profiles (
  organization_id,
  name,
  title,
  crn,
  phone,
  email,
  clinic,
  address,
  instagram
)
values (
  'd116690a-ae43-4e33-88d0-cd1d45a49991',
  'Dra. Isabela Muñoz Mendonça',
  'Nutricionista Clínica e Esportiva',
  'CRN-3 / 58.492',
  '(19) 99876-5432',
  'isabelamunoznutri@hotmail.com',
  'Clínica Integrada de Saúde & Performance',
  'Rua Barão de Jaguara, 655 - Centro, Campinas - SP',
  '@nutri.isabelamunoz'
)
on conflict (organization_id) do nothing;
