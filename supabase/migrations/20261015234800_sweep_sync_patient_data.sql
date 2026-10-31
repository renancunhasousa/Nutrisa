-- Função de varredura e sincronização em lote da base de pacientes
create or replace function public.sweep_sync_patient_data(p_organization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_photos_updated integer := 0;
  v_conversations_linked integer := 0;
begin
  -- 1. Vincula mensagens órfãs que tenham o telefone de algum paciente cadastrado
  with linked as (
    update public.log_conversas l
    set patient_id = p.id
    from public.patients p
    where l.organization_id = p_organization_id
      and p.organization_id = p_organization_id
      and l.patient_id is null
      and (
        regexp_replace(l.contato_jid, '\D', '', 'g') = regexp_replace(coalesce(p.whatsapp_phone, p.phone, ''), '\D', '', 'g')
        or regexp_replace(l.contato_jid, '\D', '', 'g') = '55' || regexp_replace(coalesce(p.whatsapp_phone, p.phone, ''), '\D', '', 'g')
      )
    returning l.id_mensagem
  )
  select count(*) into v_conversations_linked from linked;

  -- 2. Atualiza avatar_url dos pacientes a partir da foto mais recente do WhatsApp
  with updated_avatars as (
    update public.patients p
    set avatar_url = sub.foto_perfil,
        updated_at = now()
    from (
      select distinct on (p2.id)
        p2.id as patient_id,
        l.foto_perfil
      from public.patients p2
      join public.log_conversas l on (l.patient_id = p2.id)
      where p2.organization_id = p_organization_id
        and l.foto_perfil is not null
        and length(trim(l.foto_perfil)) > 10
      order by p2.id, l.data_envio desc
    ) sub
    where p.id = sub.patient_id
      and (p.avatar_url is null or p.avatar_url = '')
    returning p.id
  )
  select count(*) into v_photos_updated from updated_avatars;

  return jsonb_build_object(
    'photos_updated', v_photos_updated,
    'conversations_linked', v_conversations_linked
  );
end;
$$;

grant execute on function public.sweep_sync_patient_data(uuid) to authenticated;
