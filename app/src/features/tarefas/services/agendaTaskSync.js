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

function extractPatientName(summary) {
  let name = summary || '';
  // Remove prefixos comuns
  name = name.replace(/\[.*?\]/g, '').trim();
  name = name.replace(/^(Consulta\s*-\s*|Retorno\s*-\s*|Primeira\sVez\s*-\s*)/i, '').trim();
  return name;
}

export async function syncTasksFromCalendar(existingTasks, windowDays = 7, modeId = 'dieta') {
  const tokenRaw = localStorage.getItem(KEY_GOOGLE_TOKEN);
  if (!tokenRaw) {
    throw new Error('Google Calendar não está conectado. Conecte no módulo Agenda primeiro.');
  }

  const tokenInfo = JSON.parse(tokenRaw);
  if (!tokenInfo?.access_token) {
    throw new Error('Token inválido. Reconecte o Google Calendar.');
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

  const events = await fetchCalendarPage(tokenInfo.access_token, GOOGLE_CALENDAR_ID, firstDay, lastDay);

  const newTasks = [];
  let tasksIgnored = 0;

  for (const event of events) {
    if (event.status === 'cancelled') continue;
    
    const summaryLower = (event.summary || '').toLowerCase();
    if (summaryLower.includes('pessoal') || summaryLower.includes('feriado') || summaryLower.includes('bloqueio')) {
       continue;
    }

    const patientName = extractPatientName(event.summary);
    if (!patientName) continue;

    const eventDate = event.start?.dateTime ? new Date(event.start.dateTime) : (event.start?.date ? new Date(event.start.date) : null);
    if (!eventDate) continue;
    
    const eventDateStr = eventDate.toISOString().split('T')[0];
    
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

    newTasks.push({
      title: modeConfig.taskTitle,
      patientName: patientName,
      category: modeConfig.category,
      priority: modeConfig.priority,
      dueDate: dueDate,
      notes: `Importado da agenda (${modeConfig.title}). Consulta: ${eventDate.toLocaleDateString('pt-BR')}. Prazo: ${dueDateObj.toLocaleDateString('pt-BR')}.`,
      calendarEventId: event.id,
      eventDate: eventDateStr,
      autoGenerated: true,
    });
  }

  return { newTasks, newTasksCreated: newTasks.length, tasksIgnored, modeConfig };
}
