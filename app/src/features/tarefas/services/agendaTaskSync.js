import { fetchCalendarPage } from '../../agenda/services/calendar.js';
import { KEY_GOOGLE_TOKEN } from '../../../config/storageKeys.js';
import { GOOGLE_CALENDAR_ID } from '../../../config/env.js';

export const AGENDA_SYNC_MODES = {
  dieta: {
    id: 'dieta',
    title: 'Plano Alimentar',
    taskTitle: 'Elaborar e enviar Plano Alimentar',
    category: 'dieta',
    priority: 'alta',
    dayOffset: 1, // Data da consulta + 1 dia
    offsetBadge: 'Data da Consulta + 1 dia',
    offsetNotice: 'Aviso: Esta opção importará os pacientes da semana criando tarefas com prazo para o dia seguinte da consulta (+1 dia), tempo ideal para elaboração e liberação do plano.',
    description: 'Importa consultas com prazo para 1 dia após o atendimento (+1 dia).',
    iconName: 'Salad',
    colorTheme: {
      border: 'border-orange-200 hover:border-orange-400',
      activeBorder: 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/50',
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      iconBg: 'bg-orange-100 text-orange-600',
    },
  },
  exames: {
    id: 'exames',
    title: 'Avaliação de Exames e Documentos',
    taskTitle: 'Analisar Exames Laboratoriais e Documentos',
    category: 'exames',
    priority: 'alta',
    dayOffset: -1, // Data da consulta - 1 dia
    offsetBadge: 'Data da Consulta - 1 dia',
    offsetNotice: 'Aviso: Esta opção importará os pacientes da semana criando tarefas com prazo para 1 dia antes da consulta (-1 dia), ideal para checar laudos, exames laboratoriais e bioimpedância pré-atendimento.',
    description: 'Importa consultas com prazo para 1 dia antes (-1 dia) para avaliar exames e anexos.',
    iconName: 'ClipboardList',
    colorTheme: {
      border: 'border-teal-200 hover:border-teal-400',
      activeBorder: 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/50',
      badge: 'bg-teal-100 text-teal-800 border-teal-200',
      iconBg: 'bg-teal-100 text-teal-600',
    },
  },
  anamnese: {
    id: 'anamnese',
    title: 'Anamnese & Laudo',
    taskTitle: 'Preparar Anamnese & Laudo pré-consulta',
    category: 'anamnese',
    priority: 'media',
    dayOffset: -1, // Data da consulta - 1 dia
    offsetBadge: 'Data da Consulta - 1 dia',
    offsetNotice: 'Aviso: Esta opção importará os pacientes da semana criando tarefas com prazo para 1 dia antes da consulta (-1 dia), para preparo prévio de prontuário e anamnese.',
    description: 'Importa consultas com prazo para 1 dia antes do atendimento (-1 dia).',
    iconName: 'FileText',
    colorTheme: {
      border: 'border-sky-200 hover:border-sky-400',
      activeBorder: 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/50',
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
      iconBg: 'bg-sky-100 text-sky-600',
    },
  },
  retorno: {
    id: 'retorno',
    title: 'Retorno & Agenda',
    taskTitle: 'Confirmar Retorno & Agendamento',
    category: 'retorno',
    priority: 'media',
    dayOffset: -1, // Data da consulta - 1 dia
    offsetBadge: 'Data da Consulta - 1 dia',
    offsetNotice: 'Aviso: Esta opção importará os agendamentos criando tarefas para 1 dia antes da consulta (-1 dia), perfeito para enviar lembretes e confirmar presença.',
    description: 'Importa consultas com prazo para 1 dia antes (-1 dia) para confirmação de retorno.',
    iconName: 'Calendar',
    colorTheme: {
      border: 'border-amber-200 hover:border-amber-400',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
    },
  },
  geral: {
    id: 'geral',
    title: 'Geral / Consultório',
    taskTitle: 'Organização do Atendimento no Consultório',
    category: 'geral',
    priority: 'media',
    dayOffset: 0, // Mesma data agendada
    offsetBadge: 'Mesma data agendada',
    offsetNotice: 'Aviso: Esta opção importará os pacientes da semana com a mesma data agendada (no dia da consulta), ideal para organizar a rotina do consultório.',
    description: 'Importa consultas na mesma data exata agendada para rotina do consultório.',
    iconName: 'CheckSquare',
    colorTheme: {
      border: 'border-slate-200 hover:border-slate-400',
      activeBorder: 'border-slate-600 ring-2 ring-slate-600/20 bg-slate-100/60',
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
    },
  },
};

/**
 * Limpa e extrai o nome do paciente removendo prefixos de consulta e tags.
 */
export function extractPatientName(summary) {
  let name = summary || '';
  // Remove tags entre colchetes como [CONFIRMADO], [A CONFIRMAR], [DESMARCADO], etc.
  name = name.replace(/\[.*?\]/g, '').trim();
  // Remove emojis no início ou no fim
  name = name.replace(/^[\p{Emoji}\s]+/gu, '').replace(/[\p{Emoji}\s]+$/gu, '').trim();
  // Remove prefixos comuns de consulta/atendimento
  name = name.replace(/^(Consulta\s*[-–—:]\s*|Retorno\s*[-–—:]\s*|Primeira\s*Vez\s*[-–—:]\s*|Online\s*[-–—:]\s*|Presencial\s*[-–—:]\s*|Encaixe\s*[-–—:]\s*|Avalia[cç][aã]o\s*[-–—:]\s*|Atendimento\s*[-–—:]\s*)/i, '').trim();
  // Remove sufixos como (Online), (Presencial), etc.
  name = name.replace(/\s*\((?:online|presencial|retorno|primeira\s*vez|encaixe)\)\s*$/i, '').trim();
  return name;
}

/**
 * Avalia se um evento da agenda é realmente uma consulta/paciente ou um compromisso pessoal.
 */
export function isLikelyPatientAppointment(event) {
  if (!event || !event.summary) return false;
  if (event.status === 'cancelled') return false;

  // 1. Google Calendar / WebDiet: colorId '9' é Blueberry (compromisso Pessoal)
  if (event.colorId === '9') return false;

  const rawSummary = event.summary.trim();
  const summaryLower = rawSummary.toLowerCase();
  const descLower = (event.description || '').toLowerCase();

  // 2. Status desmarcado ou cancelado
  if (/desmarcado|cancelado|❌/.test(summaryLower) || /desmarcado|cancelado|❌/.test(descLower)) {
    return false;
  }

  // 3. Padrões de compromissos pessoais, vida pessoal, lazer, igreja, beleza e rotina não-clínica
  const NON_PATIENT_PATTERNS = [
    // Igreja / religião / espiritualidade (ex: nazareno, culto, missa, etc.)
    /\b(nazareno|igreja|culto|missa|c[eé]lula|par[oó]quia|retiro|pastor|pastora|louvor)\b/i,
    // Beleza / estética / autocuidado (ex: unha, manicure, cabelo, salão)
    /\b(unha|unhas|manicure|pedicure|cabelo|sal[aã]o|sobrancelha|depila[cç][aã]o|est[eé]tica|massagem|spa|c[ií]lios|maquiagem|podologia)\b/i,
    // Consultas médicas próprias / exames próprios
    /\b(m[eé]dico|dentista|oftalmo|oftalmologista|gineco|ginecologista|terapia|psic[oó]log[oa]|psiquiatra|dermato|dermatologista|fisioterapia|fisio|ultrassom|laborat[oó]rio|resson[aâ]ncia|tomografia|hemograma)\b/i,
    // Atividade física / esportes
    /\b(academia|treino|treinar|pilates|yoga|personal|nata[cç][aã]o|crossfit|corrida|futebol|muscula[cç][aã]o|beach tennis)\b/i,
    // Alimentação / social / lazer
    /\b(almo[cç]o|jantar|caf[eé]|anivers[aá]rio|festa|churrasco|happy hour|cinema|teatro|show)\b/i,
    // Viagem / deslocamento
    /\b(viagem|viajar|v[oô]o|aeroporto|hotel|praia|estrada)\b/i,
    // Administrativo / financeiro / casa / compras
    /\b(banco|cart[oó]rio|mercado|compras|shopping|oficina|mec[aâ]nico|lava\s*jato|reforma|conserto|faxina|diarista)\b/i,
    // Estudos / corporativo
    /\b(reuni[aã]o|mentoria|curso|aula|p[oó]s|gradua[cç][aã]o|congresso|palestra|workshop|prova|estudo)\b/i,
    // Bloqueios / folgas / feriados
    /\b(bloqueio|bloqueado|indispon[ií]vel|folga|recesso|feriado|f[eé]rias|intervalo|fechado)\b/i,
    // Palavras explícitas de evento pessoal
    /\b(pessoal|particular|lembrete|compromisso)\b/i,
  ];

  for (const pattern of NON_PATIENT_PATTERNS) {
    if (pattern.test(summaryLower)) {
      return false;
    }
  }

  // 4. Extração e validação do nome do paciente
  const patientName = extractPatientName(rawSummary);
  if (!patientName || patientName.length < 2) return false;

  const patientNameLower = patientName.toLowerCase();
  for (const pattern of NON_PATIENT_PATTERNS) {
    if (pattern.test(patientNameLower)) {
      return false;
    }
  }

  return true;
}

export async function syncTasksFromCalendar(existingTasks, windowDays = 7, modeId = 'dieta', fetchCalendarPageImpl = fetchCalendarPage) {
  const tokenRaw = localStorage.getItem(KEY_GOOGLE_TOKEN);
  if (!tokenRaw) {
    const error = new Error('A Agenda do Google não está conectada. Por favor, conecte a sua conta no módulo "Agenda" antes de sincronizar as tarefas.');
    error.isAuthError = true;
    error.status = 401;
    throw error;
  }

  let tokenInfo;
  try {
    tokenInfo = JSON.parse(tokenRaw);
  } catch {
    const error = new Error('Token da Agenda corrompido ou inválido. Por favor, reconecte sua conta no módulo "Agenda".');
    error.isAuthError = true;
    error.status = 401;
    throw error;
  }

  if (!tokenInfo?.access_token) {
    const error = new Error('Acesso do Google Calendar não encontrado. Por favor, conecte sua conta no módulo "Agenda".');
    error.isAuthError = true;
    error.status = 401;
    throw error;
  }

  const modeConfig = AGENDA_SYNC_MODES[modeId] || AGENDA_SYNC_MODES.dieta;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Início da semana vigente (Domingo)
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - today.getDay());
  
  // Fim da janela a partir do início da semana
  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + windowDays);

  let events;
  try {
    events = await fetchCalendarPageImpl(tokenInfo.access_token, GOOGLE_CALENDAR_ID, firstDay, lastDay);
  } catch (err) {
    if (err.status === 401 || String(err.message).includes('401')) {
      const authError = new Error('Sessão da Agenda expirada ou não autorizada (401). Por favor, conecte novamente o Google Calendar no módulo "Agenda".');
      authError.isAuthError = true;
      authError.status = 401;
      throw authError;
    }
    throw err;
  }

  const newTasks = [];
  let tasksIgnored = 0;
  let personalEventsIgnored = 0;

  for (const event of events) {
    // Filtro rigoroso: apenas pacientes reais da clínica
    if (!isLikelyPatientAppointment(event)) {
      personalEventsIgnored++;
      continue;
    }

    const patientName = extractPatientName(event.summary);
    if (!patientName) continue;

    const eventDate = event.start?.dateTime ? new Date(event.start.dateTime) : (event.start?.date ? new Date(event.start.date) : null);
    if (!eventDate) continue;
    
    const eventDateStr = eventDate.toISOString().split('T')[0];

    // Extração do horário da consulta (quando o evento tem hora marcada)
    let eventTime = null;
    let horaFormatada = null;
    if (event.start?.dateTime) {
      const hours = String(eventDate.getHours()).padStart(2, '0');
      const minutes = String(eventDate.getMinutes()).padStart(2, '0');
      eventTime = `${hours}:${minutes}`;
      horaFormatada = `${hours}:${minutes}`;
    }
    
    // Cálculo do vencimento conforme o dayOffset configurado
    const dueDateObj = new Date(eventDate);
    dueDateObj.setDate(dueDateObj.getDate() + modeConfig.dayOffset);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    // Checar idempotência considerando a categoria para não colidir modos diferentes
    const isDuplicate = existingTasks.some(t => {
      if (t.calendarEventId === event.id && t.category === modeConfig.category) return true;
      if (t.patientName === patientName && t.dueDate === dueDate && t.category === modeConfig.category && t.autoGenerated) return true;
      return false;
    });

    if (isDuplicate) {
      tasksIgnored++;
      continue;
    }

    const timeLabel = horaFormatada ? ` às ${horaFormatada}` : '';

    newTasks.push({
      title: modeConfig.taskTitle,
      patientName: patientName,
      category: modeConfig.category,
      priority: modeConfig.priority,
      dueDate: dueDate,
      notes: `Importado da agenda (${modeConfig.title}). Consulta: ${eventDate.toLocaleDateString('pt-BR')}${timeLabel}. Prazo: ${dueDateObj.toLocaleDateString('pt-BR')}.`,
      calendarEventId: event.id,
      eventDate: eventDateStr,
      eventTime: eventTime,
      eventDateTime: event.start?.dateTime || null,
      autoGenerated: true,
    });
  }

  // Ordenação cronológica estrita: do mais cedo para o mais tarde
  newTasks.sort((a, b) => {
    // 1. Data da consulta (eventDate) ou vencimento
    const dateA = a.eventDate || a.dueDate || '';
    const dateB = b.eventDate || b.dueDate || '';
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    // 2. Horário do atendimento (mais cedo primeiro: ex: 08:00 antes de 09:30)
    const timeA = a.eventTime || '';
    const timeB = b.eventTime || '';
    if (timeA && timeB) {
      const diffTime = timeA.localeCompare(timeB);
      if (diffTime !== 0) return diffTime;
    } else if (timeA && !timeB) {
      return -1;
    } else if (!timeA && timeB) {
      return 1;
    }

    // 3. Desempate por nome do paciente
    return (a.patientName || '').localeCompare(b.patientName || '');
  });

  return {
    newTasks,
    newTasksCreated: newTasks.length,
    tasksIgnored,
    personalEventsIgnored,
    modeConfig,
  };
}
