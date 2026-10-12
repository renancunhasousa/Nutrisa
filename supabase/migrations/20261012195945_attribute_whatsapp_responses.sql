alter table public.log_conversas
  add column if not exists responded_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists responded_by_name text,
  add column if not exists responded_by_role text,
  add column if not exists responded_by_type text,
  add column if not exists response_channel text;

alter table public.log_conversas
  drop constraint if exists log_conversas_responded_by_role_check,
  add constraint log_conversas_responded_by_role_check
    check (responded_by_role is null or responded_by_role in ('owner', 'professional', 'receptionist', 'assistant', 'custom')),
  drop constraint if exists log_conversas_responded_by_type_check,
  add constraint log_conversas_responded_by_type_check
    check (responded_by_type is null or responded_by_type in ('isabela', 'secretaria', 'administrativo', 'profissional', 'personalizado'));

create index if not exists log_conversas_responder_idx
  on public.log_conversas (organization_id, responded_by_user_id, data_envio desc);

comment on column public.log_conversas.responded_by_user_id is 'Usuário autenticado que enviou a resposta pela NutrIsa.';
comment on column public.log_conversas.responded_by_name is 'Nome exibido do responsável no momento do envio.';
comment on column public.log_conversas.responded_by_role is 'Cargo de acesso no momento do envio.';
comment on column public.log_conversas.responded_by_type is 'Agrupamento operacional usado nas métricas de atendimento.';
comment on column public.log_conversas.response_channel is 'Canal que originou a resposta, por exemplo nutrisa_app.';
