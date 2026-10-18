set lock_timeout = '10s';

-- 1. Atualizar bootstrap_organization_internal para não lançar exceção bloqueante se o usuário ainda não tiver clínica
create or replace function private.bootstrap_organization_internal(p_name text default 'NutrIsa'::text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_organization_id uuid;
begin
  if v_user_id is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  -- 1. Se o usuário já é membro de alguma organização, retorna a sua organização
  select membership.organization_id
  into v_organization_id
  from public.organization_members membership
  where membership.user_id = v_user_id
  order by membership.created_at
  limit 1;

  if v_organization_id is not null then
    return v_organization_id;
  end if;

  -- 2. Se a organização mestre ainda não tiver donos (bootstrap inicial)
  select organization.id
  into v_organization_id
  from public.organizations organization
  where organization.slug = 'nutrisa'
  for update;

  if v_organization_id is not null and not exists (
    select 1 from public.organization_members membership
    where membership.organization_id = v_organization_id
  ) then
    insert into public.organization_members (organization_id, user_id, role)
    values (v_organization_id, v_user_id, 'owner');
    return v_organization_id;
  end if;

  -- Usuário novo ainda sem clínica vinculada
  return null;
end;
$$;

-- 2. Função RPC para criar uma nova clínica independente
create or replace function public.create_clinic_organization(
  p_clinic_name text,
  p_professional_name text default '',
  p_crn text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_user_meta_name text;
  v_org_id uuid;
  v_cleaned_clinic text := btrim(coalesce(p_clinic_name, ''));
  v_cleaned_prof text := btrim(coalesce(p_professional_name, ''));
  v_cleaned_crn text := btrim(coalesce(p_crn, ''));
  v_slug text;
  v_invite_code text;
  v_random_suffix text := lower(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória.';
  end if;

  if length(v_cleaned_clinic) = 0 then
    raise exception 'O nome do consultório/clínica é obrigatório.';
  end if;

  select lower(email), raw_user_meta_data->>'full_name'
  into v_user_email, v_user_meta_name
  from auth.users
  where id = v_user_id;

  if length(v_cleaned_prof) = 0 then
    v_cleaned_prof := coalesce(v_user_meta_name, v_user_email, 'Nutricionista');
  end if;

  -- Gera slug limpo no formato ^[a-z0-9]+(?:-[a-z0-9]+)*$
  v_slug := 'clinica-' || v_random_suffix;

  -- Cria a organização independente no Supabase
  insert into public.organizations (name, slug)
  values (v_cleaned_clinic, v_slug)
  returning id into v_org_id;

  -- Vincula a nova nutricionista como proprietária da sua organização
  insert into public.organization_members (
    organization_id,
    user_id,
    display_name,
    email,
    role,
    permissions
  )
  values (
    v_org_id,
    v_user_id,
    v_cleaned_prof,
    v_user_email,
    'owner',
    array['pacientes','crm','laudo','anamnese','dietas','produtos','dashboard','agenda','tarefas','contratos','financas','marketing','ai','configuracoes']::text[]
  );

  -- Gera código de convite exclusivo para a equipe desta nova clínica
  v_invite_code := 'CLINICA-' || upper(v_random_suffix);
  insert into private.clinic_invite_codes (organization_id, code)
  values (v_org_id, v_invite_code)
  on conflict (organization_id) do update set code = v_invite_code;

  -- Cria o perfil profissional inicial da nova clínica com seus próprios dados
  insert into public.clinic_profiles (
    organization_id,
    name,
    title,
    crn,
    phone,
    email,
    clinic,
    address,
    instagram,
    updated_by
  )
  values (
    v_org_id,
    v_cleaned_prof,
    'Nutricionista',
    v_cleaned_crn,
    '',
    v_user_email,
    v_cleaned_clinic,
    '',
    '',
    v_user_id
  )
  on conflict (organization_id) do nothing;

  -- Atualiza os metadados do usuário no auth.users
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('full_name', v_cleaned_prof, 'clinic_name', v_cleaned_clinic)
  where id = v_user_id;

  return v_org_id;
end;
$$;

revoke all on function public.create_clinic_organization(text, text, text) from public, anon;
grant execute on function public.create_clinic_organization(text, text, text) to authenticated;
