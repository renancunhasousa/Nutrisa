import { WHATSAPP_SEND_WEBHOOK_URL } from '../../../config/env.js';
import { getDefaultWhatsAppInstanceName } from '../../configuracoes/defaultProfile.js';
import { getActiveNutritionist } from '../../configuracoes/services/clinicProfileService.js';

function responseError(payload, status) {
  const detail = payload?.message || payload?.error || payload?.description;
  return detail ? String(detail) : `O envio pelo WhatsApp falhou (${status}).`;
}

export function resolveWhatsAppInstanceName(organizationId, customInstance = null) {
  if (customInstance && String(customInstance).trim()) {
    return String(customInstance).trim();
  }
  // Sem organização não há como saber por qual número enviar; nunca usar a instância de outra clínica
  if (!organizationId) {
    throw new Error('Clínica não identificada para envio pelo WhatsApp.');
  }
  return getDefaultWhatsAppInstanceName(organizationId);
}

export async function sendWhatsAppMessage({
  phone,
  message,
  patientId,
  requestedBy,
  organizationId,
  responderName,
  responderRole,
  responderType,
  instanceName,
  signal,
  fetchImpl = fetch,
  url = null,
} = {}) {
  const cleanPhone = String(phone || '').trim();
  const cleanMessage = String(message || '').trim();

  // Resolve configurações da clínica ativa
  let clinicProfile = null;
  try {
    clinicProfile = organizationId ? getActiveNutritionist(organizationId) : null;
  } catch {}

  const targetUrl = url !== null && url !== undefined ? url : (clinicProfile?.whatsappWebhookUrl || WHATSAPP_SEND_WEBHOOK_URL);

  if (!targetUrl) throw new Error('Configure VITE_N8N_WHATSAPP_SEND_URL para enviar mensagens.');
  if (!cleanPhone) throw new Error('O paciente não possui WhatsApp cadastrado.');
  if (!cleanMessage) throw new Error('Escreva uma mensagem antes de enviar.');
  if (cleanMessage.length > 4096) throw new Error('A mensagem deve ter no máximo 4096 caracteres.');

  const resolvedInstanceName = resolveWhatsAppInstanceName(
    organizationId,
    instanceName || clinicProfile?.whatsappInstanceName
  );

  const response = await fetchImpl(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: cleanPhone,
      message: cleanMessage,
      instance_name: resolvedInstanceName,
      patient_id: patientId || null,
      requested_by: requestedBy || null,
      organization_id: organizationId || null,
      responder_name: responderName || null,
      responder_role: responderRole || null,
      responder_type: responderType || null,
    }),
    signal,
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = text ? { message: text } : {};
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(responseError(payload, response.status));
  }

  return payload;
}
