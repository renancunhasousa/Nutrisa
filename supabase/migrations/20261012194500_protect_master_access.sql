create or replace function private.prevent_owner_self_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner' and old.user_id = (select auth.uid()) and (
    tg_op = 'DELETE' or new.role <> 'owner' or new.user_id is distinct from old.user_id
    or new.organization_id is distinct from old.organization_id
  ) then
    raise exception 'O owner nao pode remover ou rebaixar o proprio acesso mestre';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.prevent_owner_self_change() from public, anon, authenticated;
drop trigger if exists organization_members_prevent_owner_self_change on public.organization_members;
create trigger organization_members_prevent_owner_self_change
before update or delete on public.organization_members
for each row execute function private.prevent_owner_self_change();
