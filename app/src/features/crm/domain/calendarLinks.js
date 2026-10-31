import { normalizeName } from '../../agenda/services/appointmentMatcher.js';
import { isConsultationEvent } from '../../agenda/domain/calendarMapper.js';
import { normalizePatientPhone } from '../../pacientes/domain/phone.js';

export function extractEmails(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  return [...new Set(matches.map((e) => e.trim().toLowerCase()))];
}

export function extractEventEmails(event, calendarId = '') {
  const emails = new Set();
  const calOwner = String(calendarId || '').trim().toLowerCase();

  if (Array.isArray(event?.attendees)) {
    for (const attendee of event.attendees) {
      if (attendee?.self || attendee?.resource) continue;
      const email = attendee?.email?.trim().toLowerCase();
      if (email && !email.includes('resource.calendar.google.com') && (!calOwner || email !== calOwner)) {
        emails.add(email);
      }
    }
  }

  for (const email of extractEmails(event?.description)) {
    if (!calOwner || email !== calOwner) emails.add(email);
  }
  for (const email of extractEmails(event?.summary)) {
    if (!calOwner || email !== calOwner) emails.add(email);
  }

  return [...emails];
}

export function extractPhones(text) {
  if (!text || typeof text !== 'string') return [];
  const regex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4,5}[-\s]?\d{4})/g;
  const matches = text.match(regex) || [];
  return matches
    .map((p) => normalizePatientPhone(p))
    .filter((p) => p && p.length >= 10);
}

export function extractEventPhones(event) {
  const phones = new Set();
  for (const p of extractPhones(event?.description)) phones.add(p);
  for (const p of extractPhones(event?.summary)) phones.add(p);
  return [...phones];
}

/**
 * Chave estável do nome do evento: remove tags de status ([CONFIRMADO]), emojis e normaliza.
 * Eventos "Maria Silva" e "[CONFIRMADO] maria  silva ✅" compartilham a mesma chave.
 */
export function eventNameKey(summary) {
  const clean = String(summary || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[✅❌]/g, ' ');
  return normalizeName(clean);
}

export function buildPatientNameIndex(patients) {
  return patients.map((patient) => {
    const names = [patient.full_name, patient.preferred_name].filter(Boolean).map(normalizeName).filter(Boolean);
    return { patient, names, tokens: new Set(names.flatMap((name) => name.split(' '))) };
  });
}

export function buildPatientIndex(patients) {
  const byEmail = new Map();
  const byPhone = new Map();

  patients.forEach((patient) => {
    if (patient.email) {
      const email = patient.email.trim().toLowerCase();
      if (email) {
        if (!byEmail.has(email)) byEmail.set(email, []);
        byEmail.get(email).push(patient);
      }
    }

    const pPhone = patient.phone ? normalizePatientPhone(patient.phone) : null;
    const wPhone = patient.whatsapp_phone ? normalizePatientPhone(patient.whatsapp_phone) : null;
    [pPhone, wPhone].filter(Boolean).forEach((phone) => {
      if (!byPhone.has(phone)) byPhone.set(phone, []);
      if (!byPhone.get(phone).includes(patient)) byPhone.get(phone).push(patient);
    });
  });

  const nameIndex = buildPatientNameIndex(patients);

  return { byEmail, byPhone, nameIndex };
}

function editDistance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const rows = [];
  for (let i = 0; i <= a.length; i += 1) {
    rows[i] = [i];
    for (let j = 1; j <= b.length; j += 1) {
      if (i === 0) { rows[i][j] = j; continue; }
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      // Troca de letras adjacentes (ex.: pereria/pereira) conta como 1 erro.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

// Similaridade entre duas palavras: igual (1), abreviação/prefixo (0.9) ou erro leve de digitação (0.8).
function wordSimilarity(a, b) {
  if (a === b) return 1;
  if (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))) return 0.9;
  const longest = Math.max(a.length, b.length);
  const limit = longest >= 9 ? 2 : longest >= 4 ? 1 : 0;
  return limit && editDistance(a, b, limit) <= limit ? 0.8 : 0;
}

/** Ordena pacientes pelo quão bem o nome do evento combina; `allMatch` = toda palavra do evento achou par. */
export function rankPatientCandidates(nameKey, index) {
  const words = nameKey.split(' ').filter((word) => word.length > 1);
  if (!words.length) return [];
  return index.map((entry) => {
    const tokens = [...entry.tokens];
    const best = words.map((word) => Math.max(0, ...tokens.map((token) => wordSimilarity(word, token))));
    const firstNames = entry.names.map((name) => name.split(' ')[0]);
    const firstBonus = firstNames.some((first) => wordSimilarity(words[0], first) >= 0.9) ? 0.1 : 0;
    return {
      patient: entry.patient,
      score: best.reduce((sum, value) => sum + value, 0) / words.length + firstBonus,
      allMatch: best.every((value) => value > 0),
    };
  }).filter((item) => item.score >= 0.5).sort((a, b) => b.score - a.score);
}

/**
 * Liga um nome de evento a um paciente:
 * - nome completo idêntico (único) ou 2+ palavras contidas no nome de um único paciente → `auto`;
 * - 2+ palavras que combinam de forma aproximada com um único paciente → `suggested` (confirmar em lote);
 * - sem vencedor claro → `ambiguous`/`unmatched`, com candidatos ordenados para escolha em 1 clique.
 */
export function matchNameKeyToPatient(nameKey, index) {
  if (!nameKey) return { status: 'unmatched', candidates: [] };
  const exact = index.filter((entry) => entry.names.includes(nameKey));
  if (exact.length === 1) return { status: 'auto', patient: exact[0].patient, candidates: [] };
  if (exact.length > 1) return { status: 'ambiguous', candidates: exact.map((entry) => entry.patient) };

  const words = nameKey.split(' ').filter((word) => word.length > 1);
  if (words.length >= 2) {
    const subset = index.filter((entry) => words.every((word) => entry.tokens.has(word)));
    if (subset.length === 1) return { status: 'auto', patient: subset[0].patient, candidates: [] };
    if (subset.length > 1) return { status: 'ambiguous', candidates: subset.map((entry) => entry.patient) };
  }

  const ranked = rankPatientCandidates(nameKey, index);
  const candidates = ranked.slice(0, 5).map((item) => item.patient);
  if (words.length >= 2) {
    const complete = ranked.filter((item) => item.allMatch);
    if (complete.length === 1) return { status: 'suggested', patient: complete[0].patient, candidates };
    if (complete.length > 1) return { status: 'ambiguous', candidates: complete.slice(0, 5).map((item) => item.patient) };
  }
  // Primeiro nome sozinho nunca é ligado automaticamente; só sugere candidatos.
  return { status: 'unmatched', candidates };
}

const eventStart = (event) => {
  const value = event?.start?.dateTime || event?.start?.date;
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
};

/**
 * Agrupa eventos de consulta por nome e resolve o paciente de cada grupo.
 * Prioriza e-mail (100% inequívoco), depois telefone, e fallback para correspondência por nome.
 * @param {Array} events eventos do Google Calendar
 * @param {Array} patients pacientes da organização
 * @param {Map<string,{patient_id:string|null,ignored:boolean}>} manualLinks vínculos salvos por name_key
 * @param {string} calendarId ID do calendário para ignorar e-mail do proprietário
 */
export function resolveCalendarLinks(events, patients, manualLinks = new Map(), calendarId = '') {
  const { byEmail, byPhone, nameIndex } = buildPatientIndex(patients);
  const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
  const groups = new Map();

  for (const event of events || []) {
    if (!isConsultationEvent(event)) continue;
    const start = eventStart(event);
    const key = eventNameKey(event.summary);
    if (start === null || !key) continue;

    if (!groups.has(key)) {
      groups.set(key, {
        nameKey: key,
        label: String(event.summary).replace(/\[[^\]]*\]/g, '').replace(/[✅❌]/g, '').trim(),
        starts: [],
        emails: new Set(),
        phones: new Set(),
      });
    }

    const group = groups.get(key);
    group.starts.push(start);
    extractEventEmails(event, calendarId).forEach((email) => group.emails.add(email));
    extractEventPhones(event).forEach((phone) => group.phones.add(phone));
  }

  return [...groups.values()].map((group) => {
    const groupEmails = [...group.emails];
    const groupPhones = [...group.phones];

    const manual = manualLinks.get(group.nameKey);
    if (manual?.ignored) {
      return { ...group, emails: groupEmails, phones: groupPhones, status: 'ignored', patient: null, candidates: [], matchReason: 'manual_ignored' };
    }
    if (manual?.patient_id && patientsById.has(manual.patient_id)) {
      return { ...group, emails: groupEmails, phones: groupPhones, status: 'manual', patient: patientsById.get(manual.patient_id), candidates: [], matchReason: 'manual' };
    }

    // 1. Prioridade máxima: correspondência direta por e-mail dos convidados / descrição
    const emailMatches = new Set();
    for (const email of groupEmails) {
      const matched = byEmail.get(email) || [];
      matched.forEach((p) => emailMatches.add(p));
    }
    if (emailMatches.size === 1) {
      const [matchedPatient] = emailMatches;
      return {
        ...group,
        emails: groupEmails,
        phones: groupPhones,
        status: 'auto',
        patient: matchedPatient,
        candidates: [],
        matchReason: 'email',
        matchedEmail: groupEmails[0],
      };
    }
    if (emailMatches.size > 1) {
      return {
        ...group,
        emails: groupEmails,
        phones: groupPhones,
        status: 'ambiguous',
        patient: null,
        candidates: [...emailMatches],
        matchReason: 'email_ambiguous',
      };
    }

    // 2. Segunda prioridade: correspondência por telefone encontrado na descrição / resumo
    const phoneMatches = new Set();
    for (const phone of groupPhones) {
      const matched = byPhone.get(phone) || [];
      matched.forEach((p) => phoneMatches.add(p));
    }
    if (phoneMatches.size === 1) {
      const [matchedPatient] = phoneMatches;
      return {
        ...group,
        emails: groupEmails,
        phones: groupPhones,
        status: 'auto',
        patient: matchedPatient,
        candidates: [],
        matchReason: 'phone',
        matchedPhone: groupPhones[0],
      };
    }
    if (phoneMatches.size > 1) {
      return {
        ...group,
        emails: groupEmails,
        phones: groupPhones,
        status: 'ambiguous',
        patient: null,
        candidates: [...phoneMatches],
        matchReason: 'phone_ambiguous',
      };
    }

    // 3. Fallback por nome (exato, aproximado ou candidatos)
    const match = matchNameKeyToPatient(group.nameKey, nameIndex);
    return {
      ...group,
      emails: groupEmails,
      phones: groupPhones,
      status: match.status,
      patient: match.patient || null,
      candidates: match.candidates,
      matchReason: 'name',
    };
  }).sort((a, b) => b.starts.length - a.starts.length || a.label.localeCompare(b.label, 'pt-BR'));
}

/** Calcula última consulta realizada e próxima consulta futura por paciente ligado. */
export function deriveAppointmentDates(groups, now = Date.now()) {
  const result = new Map();
  for (const group of groups) {
    if (!group.patient || (group.status !== 'auto' && group.status !== 'manual')) continue;
    const current = result.get(group.patient.id) || { last_consultation_at: null, next_appointment_at: null };
    for (const start of group.starts) {
      if (start <= now) {
        if (!current.last_consultation_at || start > new Date(current.last_consultation_at).getTime()) {
          current.last_consultation_at = new Date(start).toISOString();
        }
      } else if (!current.next_appointment_at || start < new Date(current.next_appointment_at).getTime()) {
        current.next_appointment_at = new Date(start).toISOString();
      }
    }
    result.set(group.patient.id, current);
  }
  return result;
}

/** Sobrepõe as datas da agenda às do cadastro (o valor do cadastro vence se já existir). */
export function applyAppointmentDates(patients, dates) {
  if (!dates?.size) return patients;
  return patients.map((patient) => {
    const calendar = dates.get(patient.id);
    if (!calendar) return patient;
    return {
      ...patient,
      last_consultation_at: patient.last_consultation_at || calendar.last_consultation_at,
      next_appointment_at: patient.next_appointment_at || calendar.next_appointment_at,
    };
  });
}
