set lock_timeout = '10s';

alter table public.clinic_profiles
  add column if not exists whatsapp_instance_name text,
  add column if not exists whatsapp_webhook_url text,
  add column if not exists whatsapp_phone text;

comment on column public.clinic_profiles.whatsapp_instance_name is 'Identificador da instância na Evolution API (ex: IsaNutri ou org_uuid) para roteamento multi-clínicas.';
comment on column public.clinic_profiles.whatsapp_webhook_url is 'Endpoint HTTP customizado do n8n para envio de mensagens pelo WhatsApp da clínica.';
comment on column public.clinic_profiles.whatsapp_phone is 'Número de WhatsApp conectado a esta instância da clínica para exibição de status.';

-- Configura instância padrão para a organização da Dra. Isabela Muñoz
update public.clinic_profiles
set
  whatsapp_instance_name = coalesce(whatsapp_instance_name, 'IsaNutri'),
  whatsapp_phone = coalesce(whatsapp_phone, '(19) 99876-5432')
where organization_id = 'd116690a-ae43-4e33-88d0-cd1d45a49991';
