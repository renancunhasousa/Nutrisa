import { requireSupabase } from '../../../shared/services/supabase.js';
import { KEY_GOOGLE_TOKEN } from '../../../config/storageKeys.js';
import { GOOGLE_CALENDAR_ID } from '../../../config/env.js';
import { fetchCalendarPage } from '../../agenda/services/calendar.js';
import { listCalendarLinks } from '../../crm/services/calendarLinks.js';
import { deriveAppointmentDates, resolveCalendarLinks } from '../../crm/domain/calendarLinks.js';

const DAY = 86_400_000;

function getValidGoogleToken() {
  try {
    const raw = localStorage.getItem(KEY_GOOGLE_TOKEN);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token) return null;
    if (parsed.expires_at && parsed.expires_at < Date.now()) return null;
    return parsed.access_token;
  } catch {
    return null;
  }
}

/**
 * Executa uma varredura cruzada completa na base de pacientes:
 * 1. Sincroniza fotos de perfil do WhatsApp para o avatar dos pacientes.
 * 2. Vincula conversas órfãs aos pacientes pelo telefone.
 * 3. Se houver Google Calendar conectado, busca consultas e salva
 *    as datas da última consulta e próxima consulta diretamente na base de pacientes.
 *
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {Array} params.patients
 * @returns {Promise<{ photosUpdated: number, conversationsLinked: number, appointmentsSynced: number, calendarConnected: boolean }>}
 */
export async function runPatientDataSweep({ organizationId, patients = [] }) {
  const client = requireSupabase();

  // 1. Executa sincronização do WhatsApp (fotos e conversas órfãs) via RPC
  let photosUpdated = 0;
  let conversationsLinked = 0;

  try {
    const { data, error } = await client.rpc('sweep_sync_patient_data', {
      p_organization_id: organizationId,
    });
    if (!error && data) {
      photosUpdated = Number(data.photos_updated || 0);
      conversationsLinked = Number(data.conversations_linked || 0);
    }
  } catch (rpcErr) {
    console.warn('Aviso na varredura do WhatsApp:', rpcErr);
  }

  // 2. Sincronização com Google Calendar (se conectado)
  const token = getValidGoogleToken();
  let appointmentsSynced = 0;
  const calendarConnected = Boolean(token);

  if (token && patients.length > 0) {
    try {
      const now = Date.now();
      const [events, manualLinks] = await Promise.all([
        fetchCalendarPage(token, GOOGLE_CALENDAR_ID, new Date(now - 180 * DAY), new Date(now + 120 * DAY)),
        listCalendarLinks(organizationId).catch(() => new Map()),
      ]);

      const groups = resolveCalendarLinks(events, patients, manualLinks, GOOGLE_CALENDAR_ID);
      const datesMap = deriveAppointmentDates(groups, now);

      // Atualiza last_consultation_at e next_appointment_at no banco para cada paciente
      const updates = [];
      for (const [patientId, dates] of datesMap.entries()) {
        const patient = patients.find((p) => p.id === patientId);
        if (!patient) continue;

        const newLast = dates.last_consultation_at || patient.last_consultation_at;
        const newNext = dates.next_appointment_at || patient.next_appointment_at;

        if (newLast !== patient.last_consultation_at || newNext !== patient.next_appointment_at) {
          updates.push(
            client
              .from('patients')
              .update({
                last_consultation_at: newLast || null,
                next_appointment_at: newNext || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', patientId)
          );
        }
      }

      if (updates.length > 0) {
        // Executa em batches de 20 para não sobrecarregar
        for (let i = 0; i < updates.length; i += 20) {
          await Promise.all(updates.slice(i, i + 20));
        }
        appointmentsSynced = updates.length;
      }
    } catch (calErr) {
      console.warn('Aviso na varredura da agenda:', calErr);
    }
  }

  return {
    photosUpdated,
    conversationsLinked,
    appointmentsSynced,
    calendarConnected,
  };
}
