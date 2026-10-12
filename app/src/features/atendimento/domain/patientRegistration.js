import { findPatientInListByPhone, findPatientsInListByPhone, normalizePatientPhone } from '../../pacientes/domain/phone.js';

const GENERIC_NAMES = /^(paciente|paciente sem nome|contato|contato sem nome|desconhecido|unknown)$/i;

export function getConversationPatientName(conversation = {}) {
  const name = String(conversation.nome_paciente || conversation.nome_contato || conversation.contato || '').trim();
  return !name || GENERIC_NAMES.test(name) || /^\+?[\d\s().-]+$/.test(name) ? '' : name;
}

export function getConversationPatientPhone(conversation = {}) {
  return String(conversation.telefone_paciente || conversation.contato_jid || conversation.telefone || '')
    .replace(/@.*$/, '')
    .trim();
}

export function findConversationPatient(patients, conversation = {}) {
  if (conversation.patient_id) {
    const linked = patients.find((patient) => patient.id === conversation.patient_id);
    if (linked) return linked;
  }
  return findPatientInListByPhone(patients, getConversationPatientPhone(conversation));
}

export function findConversationPatientMatches(patients, conversation = {}) {
  if (conversation.patient_id) {
    const linked = patients.find((patient) => patient.id === conversation.patient_id);
    if (linked) return [linked];
  }
  return findPatientsInListByPhone(patients, getConversationPatientPhone(conversation));
}

function extractEmail(value) {
  return String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || '';
}

function getConversationMessage(conversation = {}) {
  return conversation.conteudo_mensagem || conversation.mensagem_texto || conversation.mensagem || '';
}

export function buildPatientDraftFromConversation(conversation = {}) {
  const phone = getConversationPatientPhone(conversation);
  const message = getConversationMessage(conversation);
  const dateValue = conversation.data_envio || conversation.created_at || conversation.data;
  const parsedDate = dateValue ? new Date(dateValue) : null;
  const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(parsedDate)
    : '';
  const category = String(conversation.categoria || conversation.categoria_paciente || '').trim();
  const details = [
    `Cadastro iniciado a partir de uma conversa do WhatsApp${dateLabel ? ` em ${dateLabel}` : ''}.`,
    category && category !== 'Geral' ? `Categoria inicial do atendimento: ${category}.` : '',
  ].filter(Boolean).join(' ');

  return {
    full_name: getConversationPatientName(conversation),
    phone,
    whatsapp_phone: phone,
    email: extractEmail(message),
    avatar_url: String(conversation.foto_perfil || '').trim(),
    acquisition_source: 'WhatsApp',
    lifecycle_stage: 'lead',
    notes: details,
  };
}

export function listUnregisteredWhatsAppContacts(conversations, patients) {
  const registeredPhones = new Set(patients.flatMap((patient) => [patient.phone, patient.whatsapp_phone])
    .map(normalizePatientPhone)
    .filter(Boolean));
  const groups = new Map();

  for (const conversation of conversations) {
    if (conversation.patient_id) continue;
    const phone = getConversationPatientPhone(conversation);
    const normalizedPhone = normalizePatientPhone(phone);
    if (!normalizedPhone || registeredPhones.has(normalizedPhone)) continue;

    const dateValue = conversation.data_envio || conversation.created_at || conversation.data;
    const timestamp = dateValue ? new Date(dateValue).getTime() : 0;
    const current = groups.get(normalizedPhone) || {
      id: normalizedPhone,
      phone,
      name: '',
      email: '',
      photoUrl: '',
      photoTimestamp: -Infinity,
      latestAt: null,
      latestTimestamp: -Infinity,
      latestConversation: conversation,
      messageCount: 0,
    };
    current.messageCount += 1;
    current.name ||= getConversationPatientName(conversation);
    current.email ||= extractEmail(getConversationMessage(conversation));
    const photoUrl = String(conversation.foto_perfil || '').trim();
    if (photoUrl && (!current.photoUrl || timestamp >= current.photoTimestamp)) {
      current.photoUrl = photoUrl;
      current.photoTimestamp = Number.isFinite(timestamp) ? timestamp : 0;
    }
    if (Number.isFinite(timestamp) && timestamp > current.latestTimestamp) {
      current.latestTimestamp = timestamp;
      current.latestAt = dateValue;
      current.latestConversation = conversation;
      current.phone = phone;
    }
    groups.set(normalizedPhone, current);
  }

  return [...groups.values()]
    .map((contact) => {
      const draft = buildPatientDraftFromConversation({
        ...contact.latestConversation,
        nome_paciente: contact.name,
        telefone_paciente: contact.phone,
        foto_perfil: contact.photoUrl,
      });
      return {
        id: contact.id,
        name: contact.name || `Contato final ${contact.id.slice(-4)}`,
        phone: contact.phone,
        email: contact.email,
        photoUrl: contact.photoUrl,
        latestAt: contact.latestAt,
        latestTimestamp: contact.latestTimestamp,
        messageCount: contact.messageCount,
        draft: { ...draft, email: contact.email || draft.email },
      };
    })
    .sort((left, right) => (right.latestTimestamp || 0) - (left.latestTimestamp || 0));
}
