const DAY = 86_400_000;

export const normalizeCrmPhone = (value) => String(value || '')
  .replace(/\D/g, '')
  .replace(/^55(?=\d{10,11}$)/, '');

const ageInDays = (value, now) => value
  ? Math.max(0, Math.floor((now - new Date(value).getTime()) / DAY))
  : null;

const isFuture = (value, now) => value && new Date(value).getTime() > now;

function findLatestPatientMessage(conversations, patient) {
  const phone = normalizeCrmPhone(patient.whatsapp_phone || patient.phone);
  return conversations.find((message) => (
    (message.patient_id && message.patient_id === patient.id)
    || (phone && normalizeCrmPhone(message.telefone_paciente) === phone)
  ));
}

export function getBirthdaySignal(birthDate, now = Date.now()) {
  if (!birthDate) return null;
  const match = String(birthDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  if (isNaN(month) || isNaN(day)) return null;

  const nowDate = new Date(now);
  const todayMidnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();

  let bdayMidnight = new Date(nowDate.getFullYear(), month, day).getTime();
  let diffDays = Math.round((bdayMidnight - todayMidnight) / DAY);
  if (diffDays < 0) {
    bdayMidnight = new Date(nowDate.getFullYear() + 1, month, day).getTime();
    diffDays = Math.round((bdayMidnight - todayMidnight) / DAY);
  }

  if (diffDays === 0) {
    return {
      type: 'birthday_today',
      score: 95,
      detail: 'Aniversariante hoje! 🎂',
    };
  }
  if (diffDays > 0 && diffDays <= 7) {
    return {
      type: 'birthday_soon',
      score: 65,
      detail: diffDays === 1 ? 'Aniversário amanhã 🎂' : `Aniversário em ${diffDays} dias 🎂`,
    };
  }
  return null;
}

export function buildRadarItem(patient, conversations, tasks, now = Date.now()) {
  const signals = [];
  const lastMessage = findLatestPatientMessage(conversations, patient);
  const waitingMinutes = Number(lastMessage?.tempo_espera_minutos || 0);

  if (lastMessage && !lastMessage.respondida && waitingMinutes >= 60) {
    signals.push({
      type: 'unanswered',
      score: 100 + Math.min(waitingMinutes / 60, 24),
      detail: `Aguardando resposta há ${Math.round(waitingMinutes / 60)}h`,
    });
  }

  const overdueTasks = tasks.filter((task) => task.patientId === patient.id
    && task.status !== 'completed'
    && task.dueDate
    && new Date(`${task.dueDate}T23:59:59`).getTime() < now);
  if (overdueTasks.length) {
    signals.push({
      type: 'overdue_task',
      score: 80,
      detail: `${overdueTasks.length} ${overdueTasks.length === 1 ? 'tarefa vencida' : 'tarefas vencidas'}`,
    });
  }

  const daysSinceConsultation = ageInDays(patient.last_consultation_at, now);
  if (daysSinceConsultation >= 90 && !isFuture(patient.next_appointment_at, now)) {
    signals.push({ type: 'inactive', score: 60, detail: `${daysSinceConsultation} dias desde a última consulta` });
  } else if (daysSinceConsultation >= 35 && !isFuture(patient.next_appointment_at, now)) {
    signals.push({ type: 'return_due', score: 70, detail: `${daysSinceConsultation} dias sem retorno agendado` });
  }

  const daysSinceCreated = ageInDays(patient.created_at, now);
  if (patient.lifecycle_stage === 'lead' && daysSinceCreated >= 7) {
    signals.push({ type: 'stalled_lead', score: 40, detail: `Lead cadastrado há ${daysSinceCreated} dias` });
  }

  const birthdaySignal = getBirthdaySignal(patient.birth_date, now);
  if (birthdaySignal) {
    signals.push(birthdaySignal);
  }

  if (!signals.length) return null;
  signals.sort((a, b) => b.score - a.score);
  return {
    patient,
    signals,
    score: signals[0].score,
    lastActivity: lastMessage?.data_envio || patient.updated_at,
  };
}

export function buildCommercialOpportunities(radarItems, patients) {
  const countSignal = (type) => radarItems.filter((item) => item.signals.some((signal) => signal.type === type)).length;
  const segments = [
    {
      id: 'continuity',
      title: 'Plano Evolução 90',
      audience: 'Pacientes com retorno pendente',
      pain: 'Perdem consistência entre consultas e adiam a reavaliação.',
      offer: '3 meses, consulta mensal, ajuste do plano e acompanhamento assíncrono.',
      patientCount: countSignal('return_due'),
      priority: 3,
    },
    {
      id: 'reactivation',
      title: 'Programa Retoma 30',
      audience: 'Pacientes afastados há 90 dias ou mais',
      pain: 'Querem recomeçar, mas sentem culpa ou dificuldade de voltar à rotina.',
      offer: 'Reentrada de 30 dias, diagnóstico de barreiras, plano simplificado e checkpoint.',
      patientCount: countSignal('inactive'),
      priority: 2,
    },
    {
      id: 'first-journey',
      title: 'Jornada Primeiros Passos',
      audience: 'Leads que ainda não iniciaram acompanhamento',
      pain: 'Têm interesse, mas não enxergam com clareza o processo e o valor do acompanhamento.',
      offer: 'Consulta inicial, avaliação, plano alimentar e retorno curto de validação.',
      patientCount: countSignal('stalled_lead'),
      priority: 1,
    },
  ];

  const activeWithoutNextStep = patients.filter((patient) => patient.lifecycle_stage === 'active'
    && !patient.next_appointment_at).length;
  if (activeWithoutNextStep) {
    segments.push({
      id: 'membership',
      title: 'Acompanhamento Contínuo',
      audience: 'Pacientes ativos sem próximo passo registrado',
      pain: 'Recebem orientação pontual, mas podem perder ritmo sem uma cadência definida.',
      offer: 'Mensalidade com consulta periódica, revisão de metas e suporte com SLA definido.',
      patientCount: activeWithoutNextStep,
      priority: 2.5,
    });
  }
  return segments.filter((segment) => segment.patientCount > 0)
    .sort((a, b) => (b.patientCount * b.priority) - (a.patientCount * a.priority));
}

export function isPatientInOpportunity(item, opportunityId) {
  if (!item || !opportunityId) return false;
  if (opportunityId === 'continuity') return item.signals.some((s) => s.type === 'return_due');
  if (opportunityId === 'reactivation') return item.signals.some((s) => s.type === 'inactive');
  if (opportunityId === 'first-journey') return item.signals.some((s) => s.type === 'stalled_lead');
  if (opportunityId === 'membership') return item.patient.lifecycle_stage === 'active' && !item.patient.next_appointment_at;
  return false;
}
