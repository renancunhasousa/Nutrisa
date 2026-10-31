import { requireSupabase } from '../../../shared/services/supabase.js';

export async function listCalendarLinks(organizationId) {
  if (!organizationId) return new Map();
  const { data, error } = await requireSupabase()
    .from('calendar_event_links')
    .select('name_key,patient_id,ignored')
    .eq('organization_id', organizationId);
  if (error) throw new Error(error.message || 'Erro ao carregar vínculos da agenda.');
  return new Map((data || []).map((row) => [row.name_key, { patient_id: row.patient_id, ignored: row.ignored }]));
}

export async function saveCalendarLink({ organizationId, nameKey, patientId = null, ignored = false }) {
  if (!organizationId || !nameKey || (!patientId && !ignored)) throw new Error('Dados do vínculo incompletos.');
  const { error } = await requireSupabase()
    .from('calendar_event_links')
    .upsert({
      organization_id: organizationId,
      name_key: nameKey,
      patient_id: ignored ? null : patientId,
      ignored,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,name_key' });
  if (error) throw new Error(error.message || 'Erro ao salvar o vínculo da agenda.');
}

export async function saveCalendarLinksBulk({ organizationId, links }) {
  if (!organizationId || !links?.length) return;
  const rows = links.map(({ nameKey, patientId }) => ({
    organization_id: organizationId,
    name_key: nameKey,
    patient_id: patientId,
    ignored: false,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await requireSupabase()
    .from('calendar_event_links')
    .upsert(rows, { onConflict: 'organization_id,name_key' });
  if (error) throw new Error(error.message || 'Erro ao salvar os vínculos da agenda.');
}

export async function removeCalendarLink({ organizationId, nameKey }) {
  const { error } = await requireSupabase()
    .from('calendar_event_links')
    .delete()
    .eq('organization_id', organizationId)
    .eq('name_key', nameKey);
  if (error) throw new Error(error.message || 'Erro ao remover o vínculo da agenda.');
}
