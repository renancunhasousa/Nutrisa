import { WHATSAPP_SEND_WEBHOOK_URL } from '../../../config/env.js';

function responseError(payload, status) {
  const detail = payload?.message || payload?.error || payload?.description;
  return detail ? String(detail) : `O envio pelo WhatsApp falhou (${status}).`;
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
  signal,
  fetchImpl = fetch,
  url = WHATSAPP_SEND_WEBHOOK_URL,
} = {}) {
  const cleanPhone = String(phone || '').trim();
  const cleanMessage = String(message || '').trim();

  if (!url) throw new Error('Configure VITE_N8N_WHATSAPP_SEND_URL para enviar mensagens.');
  if (!cleanPhone) throw new Error('O paciente não possui WhatsApp cadastrado.');
  if (!cleanMessage) throw new Error('Escreva uma mensagem antes de enviar.');
  if (cleanMessage.length > 4096) throw new Error('A mensagem deve ter no máximo 4096 caracteres.');

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: cleanPhone,
      message: cleanMessage,
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
