set lock_timeout = '10s';

-- Adiciona suporte a Logotipo da Clínica e Assinatura Digital do Profissional
alter table public.clinic_profiles
  add column if not exists logo_url text,
  add column if not exists signature_url text;

comment on column public.clinic_profiles.logo_url is 'URL pública do logotipo da clínica ou consultório para laudos e impressões.';
comment on column public.clinic_profiles.signature_url is 'URL pública da assinatura digital ou carimbo da nutricionista para laudos e contratos.';
