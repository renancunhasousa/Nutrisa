import { requireSupabase } from '../../../shared/services/supabase.js';
import { normalizePatientPhone } from '../domain/phone.js';

const PATIENT_FIELDS = 'id,organization_id,full_name,preferred_name,birth_date,sex,cpf,email,phone,whatsapp_phone,avatar_url,acquisition_source,lifecycle_stage,status,notes,last_consultation_at,next_appointment_at,consent_health_data_at,consent_communications_at,created_at,updated_at';

function throwIfError(error) {
  if (error) throw new Error(error.message || 'Erro ao acessar a base de pacientes.');
}

export async function listPatients(organizationId, search = '') {
  const client = requireSupabase();
  let query = client
    .from('patients')
    .select(PATIENT_FIELDS)
    .eq('organization_id', organizationId)
    .neq('status', 'archived')
    .order('full_name');

  if (search.trim()) query = query.ilike('full_name', `%${search.trim()}%`);
  const { data, error } = await query;
  throwIfError(error);
  return data ?? [];
}

export async function createPatient(organizationId, values) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('patients')
    .insert({
      organization_id: organizationId,
      full_name: values.full_name.trim(),
      preferred_name: values.preferred_name?.trim() || null,
      birth_date: values.birth_date || null,
      sex: values.sex || null,
      cpf: values.cpf?.trim() || null,
      email: values.email?.trim().toLowerCase() || null,
      phone: values.phone?.trim() || null,
      whatsapp_phone: values.whatsapp_phone?.trim() || values.phone?.trim() || null,
      avatar_url: values.avatar_url?.trim() || null,
      acquisition_source: values.acquisition_source?.trim() || null,
      lifecycle_stage: values.lifecycle_stage || 'lead',
      notes: values.notes?.trim() || null,
      consent_health_data_at: values.consent_health_data ? new Date().toISOString() : null,
      consent_communications_at: values.consent_communications ? new Date().toISOString() : null,
    })
    .select(PATIENT_FIELDS)
    .single();
  throwIfError(error);
  return data;
}

export async function findPatientsByPhone(organizationId, phone) {
  const normalizedPhone = normalizePatientPhone(phone);
  if (!organizationId || !normalizedPhone) return [];
  const client = requireSupabase();
  const { data, error } = await client
    .from('patients')
    .select(PATIENT_FIELDS)
    .eq('organization_id', organizationId)
    .neq('status', 'archived')
    .or(`phone_normalized.eq.${normalizedPhone},whatsapp_phone_normalized.eq.${normalizedPhone}`)
    .limit(2);
  throwIfError(error);
  return data || [];
}

export async function findPatientByPhone(organizationId, phone) {
  const matches = await findPatientsByPhone(organizationId, phone);
  if (matches.length > 1) {
    throw new Error('Este telefone pertence a mais de um paciente. Revise os cadastros antes de continuar.');
  }
  return matches[0] || null;
}

export async function updatePatient(patientId, values) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('patients')
    .update({
      full_name: values.full_name.trim(),
      preferred_name: values.preferred_name?.trim() || null,
      birth_date: values.birth_date || null,
      sex: values.sex || null,
      cpf: values.cpf?.trim() || null,
      email: values.email?.trim().toLowerCase() || null,
      phone: values.phone?.trim() || null,
      whatsapp_phone: values.whatsapp_phone?.trim() || values.phone?.trim() || null,
      acquisition_source: values.acquisition_source?.trim() || null,
      lifecycle_stage: values.lifecycle_stage || 'active',
      notes: values.notes?.trim() || null,
      consent_health_data_at: values.consent_health_data ? (values.consent_health_data_at || new Date().toISOString()) : null,
      consent_communications_at: values.consent_communications ? (values.consent_communications_at || new Date().toISOString()) : null,
    })
    .eq('id', patientId)
    .select(PATIENT_FIELDS)
    .single();
  throwIfError(error);
  return data;
}

export async function archivePatient(patientId) {
  const client = requireSupabase();
  const { error } = await client.from('patients').update({
    status: 'archived',
    archived_at: new Date().toISOString(),
  }).eq('id', patientId);
  throwIfError(error);
}
