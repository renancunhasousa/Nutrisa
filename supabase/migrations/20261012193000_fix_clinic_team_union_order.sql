create or replace function public.list_clinic_team(p_organization_id uuid)
returns table (id text, user_id uuid, name text, email text, role text, permissions text[], is_owner boolean, status text)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_organization_role(p_organization_id, array['owner']::text[]) then
    raise exception 'Apenas o owner pode gerenciar a equipe';
  end if;

  return query
    select team.member_id, team.member_user_id, team.member_name, team.member_email,
      team.member_role, team.member_permissions, team.member_is_owner, team.member_status
    from (
      select m.user_id::text as member_id, m.user_id as member_user_id,
        coalesce(m.display_name, u.raw_user_meta_data->>'full_name', u.email) as member_name,
        coalesce(m.email, u.email) as member_email, m.role as member_role,
        m.permissions as member_permissions, m.role = 'owner' as member_is_owner,
        'active'::text as member_status
      from public.organization_members m
      join auth.users u on u.id = m.user_id
      where m.organization_id = p_organization_id
      union all
      select i.id::text, null::uuid, i.display_name, i.email, i.role,
        i.permissions, false, 'pending'::text
      from private.team_invitations i
      where i.organization_id = p_organization_id
    ) team
    order by team.member_is_owner desc, team.member_name;
end;
$$;

revoke all on function public.list_clinic_team(uuid) from public, anon;
grant execute on function public.list_clinic_team(uuid) to authenticated;
notify pgrst, 'reload schema';
