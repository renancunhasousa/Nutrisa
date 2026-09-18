import { updateCalendarEvent } from './calendar.js';
import { colorMapper } from '../domain/calendarMapper.js';

/**
 * Expressões e palavras-chave indicando confirmação afirmativa de consulta.
 */
const CONFIRMATION_POSITIVE_REGEX = /(?:^|\b)(?:sim|simm+|confirmo|confirmar|confirmado|confirmada|confirmad[ií]ssim[ao]|pode confirmar|estarei l[aá]|estarei presente|vou sim|vou comparecer|com certeza|ok combinado|certo,? confirmo|perfeito,? confirmo|confirmad[oa] sim|t[aá] confirmado|opa,? confirmo|combinado,? confirmo)(?:\b|[!.,\s]|$)/i;

/**
 * Expressões negativas ou de dúvida que invalidam uma confirmação automática.
 */
const CONFIRMATION_NEGATIVE_REGEX = /(?:^|\b)(?:n[aã]o\b|remarc|desmarc|cancel|adiar|trocar|outro dia|n[aã]o vou|n[aã]o posso|n[aã]o consigo|imprevisto|d[uú]vida|quanto custa|qual o valor)(?:\b|[!.,\s]|$)/i;

/**
 * Detecta se uma mensagem de WhatsApp expressa intenção inequívoca de confirmação de presença.
 * @param {string} text - Texto da mensagem
 * @returns {boolean}
 */
export function detectConfirmationIntent(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim();
  if (!clean) return false;

  // Se houver negação ou intenção de remarcação/cancelamento, recusa
  if (CONFIRMATION_NEGATIVE_REGEX.test(clean)) return false;

  // Verifica se casa com as frases afirmativas de confirmação
  return CONFIRMATION_POSITIVE_REGEX.test(clean);
}

/**
 * Expressões e palavras-chave indicando cancelamento, desmarcação ou necessidade de remarcar.
 */
const CANCELLATION_REGEX = /(?:^|\b)(?:n[aã]o vou conseguir|n[aã]o poderei|n[aã]o posso ir|n[aã]o vai dar|n[aã]o vou poder|n[aã]o vou ir|n[aã]o consigo ir|preciso remarcar|gostaria de remarcar|quero remarcar|tem como remarcar|podemos remarcar|remarca[rç]|pode cancelar|quero cancelar|preciso cancelar|desmarca[rç]|pode desmarcar|tive um imprevisto|outro dia|adiar a consulta)(?:\b|[!.,\s]|$)/i;

/**
 * Detecta se uma mensagem de WhatsApp expressa intenção inequívoca de cancelamento ou remarcação.
 * @param {string} text - Texto da mensagem
 * @returns {boolean}
 */
export function detectCancellationIntent(text) {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim();
  if (!clean) return false;
  return CANCELLATION_REGEX.test(clean);
}

/**
 * Normaliza strings para comparação (remove acentos, pontuação, múltiplos espaços e converte para minúsculas).
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cruza o nome do paciente com eventos da agenda que estejam nos próximos dias.
 * 
 * @param {string} patientName - Nome do paciente (ex: vindo do WhatsApp)
 * @param {Array} events - Lista de eventos do Google Calendar
 * @param {Object} options
 * @param {number} options.maxDaysAhead - Janela futura em dias (padrão 8 dias)
 * @param {boolean} options.allowConfirmed - Se permite eventos já confirmados (útil para cancelamento)
 * @returns {Object|null} Retorna o evento mais próximo correspondente ou null
 */
export function matchPatientNameToEvents(patientName, events = [], options = {}) {
  const { maxDaysAhead = 8, allowConfirmed = false } = options;
  if (!patientName || !Array.isArray(events) || events.length === 0) return null;

  const normPatient = normalizeName(patientName);
  if (!normPatient || normPatient.length < 3) return null;

  const patientTokens = normPatient.split(' ').filter(t => t.length > 1);
  const now = new Date();
  const startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endLimit = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);

  // Filtrar apenas eventos futuros ou de hoje
  const candidateEvents = events.filter(evt => {
    if (!evt || !evt.start) return false;
    const startIso = evt.start.dateTime || evt.start.date;
    if (!startIso) return false;
    const evtDate = new Date(startIso);
    if (isNaN(evtDate.getTime())) return false;
    if (evtDate < startLimit || evtDate > endLimit) return false;

    // Verificar se já está desmarcado
    const statusKey = colorMapper.getStatusKey(evt);
    if (statusKey === 'desmarcado') return false;
    if (!allowConfirmed && statusKey === 'confirmado') return false;

    return true;
  });

  if (candidateEvents.length === 0) return null;

  // Ordenar eventos cronologicamente para priorizar a consulta mais próxima
  candidateEvents.sort((a, b) => {
    const da = new Date(a.start.dateTime || a.start.date).getTime();
    const db = new Date(b.start.dateTime || b.start.date).getTime();
    return da - db;
  });

  // Procurar melhor correspondência
  for (const evt of candidateEvents) {
    const normSummary = normalizeName(evt.summary || '');
    if (!normSummary) continue;

    // 1. Correspondência exata ou substring direta
    if (normSummary === normPatient || normSummary.includes(normPatient) || normPatient.includes(normSummary)) {
      return evt;
    }

    // 2. Se o paciente tiver 2 ou mais nomes (ex: Mariana Silva), checar se todos os tokens estão presentes
    if (patientTokens.length >= 2) {
      const allTokensInSummary = patientTokens.every(token => normSummary.includes(token));
      if (allTokensInSummary) {
        return evt;
      }
    }

    // 3. Checar se o primeiro nome e o último sobrenome coincidem
    if (patientTokens.length >= 2) {
      const summaryTokens = normSummary.split(' ').filter(t => t.length > 1);
      if (summaryTokens.length >= 2) {
        const firstMatch = patientTokens[0] === summaryTokens[0];
        const lastMatch = patientTokens[patientTokens.length - 1] === summaryTokens[summaryTokens.length - 1];
        if (firstMatch && lastMatch) {
          return evt;
        }
      }
    }

    // 4. Se tiver apenas 1 nome (ex: "Mariana"), e o resumo começar com esse nome
    if (patientTokens.length === 1 && patientTokens[0].length >= 4) {
      const summaryTokens = normSummary.split(' ').filter(t => t.length > 1);
      if (summaryTokens.length > 0 && summaryTokens[0] === patientTokens[0]) {
        return evt;
      }
    }
  }

  return null;
}

/**
 * Atualiza o agendamento no Google Calendar marcando-o com [CONFIRMADO].
 * 
 * @param {string} accessToken - Token OAuth Google
 * @param {string} calendarId - ID do Google Calendar
 * @param {Object} event - Objeto do evento a ser confirmado
 * @param {Function} [fetchImpl] - Função de fetch
 * @returns {Promise<Object>} Evento atualizado retornado da API
 */
export async function confirmAppointmentEvent(accessToken, calendarId, event, fetchImpl = fetch) {
  if (!accessToken) {
    throw new Error('Autenticação com o Google Calendar necessária para confirmar o agendamento.');
  }
  if (!event || !event.id) {
    throw new Error('Evento inválido para confirmação.');
  }

  const rawSummary = event.summary || '';
  const cleanSummary = rawSummary
    .replace(/\[(confirmado|desmarcado|cancelado|a_confirmar|a confirmar)\]/gi, '')
    .replace(/[✅❌]/g, '')
    .trim();

  const finalSummary = `[CONFIRMADO] ${cleanSummary}`;

  const updatedPayload = {
    ...event,
    summary: finalSummary,
    statusKey: 'confirmado'
  };

  const result = await updateCalendarEvent(accessToken, calendarId, event.id, updatedPayload, fetchImpl);
  return {
    ...result,
    summary: finalSummary,
    statusKey: 'confirmado'
  };
}

/**
 * Atualiza o agendamento no Google Calendar marcando-o com [DESMARCADO].
 * 
 * @param {string} accessToken - Token OAuth Google
 * @param {string} calendarId - ID do Google Calendar
 * @param {Object} event - Objeto do evento a ser desmarcado
 * @param {Function} [fetchImpl] - Função de fetch
 * @returns {Promise<Object>} Evento atualizado retornado da API
 */
export async function cancelAppointmentEvent(accessToken, calendarId, event, fetchImpl = fetch) {
  if (!accessToken) {
    throw new Error('Autenticação com o Google Calendar necessária para desmarcar o agendamento.');
  }
  if (!event || !event.id) {
    throw new Error('Evento inválido para desmarcação.');
  }

  const rawSummary = event.summary || '';
  const cleanSummary = rawSummary
    .replace(/\[(confirmado|desmarcado|cancelado|a_confirmar|a confirmar)\]/gi, '')
    .replace(/[✅❌]/g, '')
    .trim();

  const finalSummary = `[DESMARCADO] ${cleanSummary}`;

  const updatedPayload = {
    ...event,
    summary: finalSummary,
    statusKey: 'desmarcado'
  };

  const result = await updateCalendarEvent(accessToken, calendarId, event.id, updatedPayload, fetchImpl);
  return {
    ...result,
    summary: finalSummary,
    statusKey: 'desmarcado'
  };
}
