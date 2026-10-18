set lock_timeout = '10s';

alter table public.clinic_profiles
add column if not exists marketing_photo_url text;

comment on column public.clinic_profiles.marketing_photo_url is 'URL da foto oficial do profissional/nutricionista para estúdio de marketing e redes sociais.';
