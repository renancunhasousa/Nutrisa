set lock_timeout = '10s';

-- 1. Coluna avatar_url em organization_members
alter table public.organization_members
  add column if not exists avatar_url text;

-- 2. Bucket avatars no storage
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Políticas para o bucket avatars
drop policy if exists "Avatars are publicly accessible" on storage.objects;
create policy "Avatars are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars');

drop policy if exists "Authenticated users can update avatars" on storage.objects;
create policy "Authenticated users can update avatars"
on storage.objects for update to authenticated
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

-- 3. Atualizar função get_my_clinic_membership para incluir avatar_url
drop function if exists public.get_my_clinic_membership();
create or replace function public.get_my_clinic_membership()
returns table (
  organization_id uuid,
  user_id uuid,
  display_name text,
  email text,
  role text,
  permissions text[],
  is_owner boolean,
  avatar_url text
)
language sql stable security definer set search_path = '' as $$
  select
    m.organization_id,
    m.user_id,
    coalesce(m.display_name, u.raw_user_meta_data->>'full_name', u.email),
    coalesce(m.email, u.email),
    m.role,
    m.permissions,
    m.role = 'owner',
    coalesce(m.avatar_url, u.raw_user_meta_data->>'avatar_url')
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where m.user_id = (select auth.uid())
  order by m.created_at limit 1;
$$;
revoke all on function public.get_my_clinic_membership() from public, anon;
grant execute on function public.get_my_clinic_membership() to authenticated;

-- 4. Função para atualizar meu próprio perfil
create or replace function public.update_my_clinic_profile(
  p_display_name text,
  p_avatar_url text default null
)
returns table (
  organization_id uuid,
  user_id uuid,
  display_name text,
  email text,
  role text,
  permissions text[],
  is_owner boolean,
  avatar_url text
)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_cleaned_name text := btrim(coalesce(p_display_name, ''));
begin
  if v_uid is null then
    raise exception 'Não autenticado.';
  end if;

  if length(v_cleaned_name) = 0 then
    raise exception 'O nome não pode ser vazio.';
  end if;

  update public.organization_members
  set
    display_name = v_cleaned_name,
    avatar_url = p_avatar_url,
    updated_at = now()
  where user_id = v_uid;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('full_name', v_cleaned_name, 'avatar_url', p_avatar_url)
  where id = v_uid;

  return query
  select * from public.get_my_clinic_membership();
end;
$$;
revoke all on function public.update_my_clinic_profile(text, text) from public, anon;
grant execute on function public.update_my_clinic_profile(text, text) to authenticated;
