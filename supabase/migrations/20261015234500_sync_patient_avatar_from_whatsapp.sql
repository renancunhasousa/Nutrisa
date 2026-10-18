-- Sincronização automática da foto de perfil do WhatsApp para o cadastro do paciente.
create or replace function public.sync_patient_avatar_from_log_conversas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.patient_id is not null and new.foto_perfil is not null and length(trim(new.foto_perfil)) > 10 then
    update public.patients
    set avatar_url = new.foto_perfil,
        updated_at = now()
    where id = new.patient_id
      and (avatar_url is null or avatar_url = '');
  end if;
  return new;
end;
$$;

drop trigger if exists log_conversas_sync_patient_avatar on public.log_conversas;
create trigger log_conversas_sync_patient_avatar
after insert or update of foto_perfil, patient_id on public.log_conversas
for each row
execute function public.sync_patient_avatar_from_log_conversas();

-- Backfill para atualizar os pacientes existentes que já possuem foto no histórico
update public.patients p
set avatar_url = sub.foto_perfil,
    updated_at = now()
from (
  select distinct on (p2.id)
    p2.id as patient_id,
    l.foto_perfil
  from public.patients p2
  join public.log_conversas l on l.patient_id = p2.id
  where l.foto_perfil is not null and length(trim(l.foto_perfil)) > 10
  order by p2.id, l.data_envio desc
) sub
where p.id = sub.patient_id
  and (p.avatar_url is null or p.avatar_url = '');
