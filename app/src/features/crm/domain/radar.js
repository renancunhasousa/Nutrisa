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

// Minutos de espera: usa o valor do banco; se ausente, calcula a partir de data_envio.
function getWaitingMinutes(message, now) {
  if (!message) return 0;
  const stored = message.tempo_espera_minutos;
  if (stored !== null && stored !== undefined && stored !== '' && Number.isFinite(Number(stored))) return Number(stored);
  const sentAt = message.data_envio ? new Date(message.data_envio).getTime() : NaN;
  return Number.isFinite(sentAt) ? Math.max(0, Math.floor((now - sentAt) / 60_000)) : 0;
}

export function buildRadarItem(patient, conversations, tasks, now = Date.now()) {
  const signals = [];
  const lastMessage = findLatestPatientMessage(conversations, patient);
  const waitingMinutes = getWaitingMinutes(lastMessage, now);

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

  if (patient.lifecycle_stage === 'lead') {
    // Leads importados em lote têm created_at igual; a última interação indica abandono real.
    const daysSinceMessage = ageInDays(lastMessage?.data_envio, now);
    if (daysSinceMessage !== null) {
      if (daysSinceMessage >= 7) {
        signals.push({ type: 'stalled_lead', score: 40, detail: `Lead sem interação há ${daysSinceMessage} dias` });
      }
    } else {
      const daysSinceCreated = ageInDays(patient.created_at, now);
      if (daysSinceCreated >= 7) {
        signals.push({ type: 'stalled_lead', score: 40, detail: `Lead cadastrado há ${daysSinceCreated} dias, sem conversas` });
      }
    }
  }

  const birthdaySignal = getBirthdaySignal(patient.birth_date, now);
  if (birthdaySignal) {
    signals.push(birthdaySignal);
  }

  if (!signals.length) return null;
  signals.sort((a, b) => b.score - a.score);

  const enrichedPatient = {
    ...patient,
    avatar_url: patient.avatar_url || lastMessage?.foto_perfil || null,
    whatsapp_name: lastMessage?.nome_paciente || lastMessage?.nome_contato || null,
  };

  const messageText = String(lastMessage?.mensagem_texto || lastMessage?.conteudo_mensagem || '').trim();

  return {
    patient: enrichedPatient,
    signals,
    score: signals[0].score,
    lastActivity: lastMessage?.data_envio || patient.updated_at,
    lastMessageSnippet: messageText ? (messageText.length > 70 ? messageText.slice(0, 70) + '…' : messageText) : null,
  };
}

export function buildCommercialOpportunities(radarItems, patients) {
  const countSignal = (type) => radarItems.filter((item) => item.signals.some((signal) => signal.type === type)).length;
  const activeWithoutNextStep = patients.filter((patient) => patient.lifecycle_stage === 'active'
    && !patient.next_appointment_at).length;

  const segments = [
    {
      id: 'continuity',
      title: 'Retorno Pendente',
      tagline: 'Puxa de volta quem está apenas atrasado na rotina do tratamento.',
      audience: 'Pacientes com retorno pendente (35 a 89 dias)',
      pain: 'Perdem consistência entre consultas e adiam a reavaliação.',
      offer: 'Pacote de 3 meses com consulta mensal, ajuste do plano e acompanhamento contínuo.',
      patientCount: countSignal('return_due'),
      priority: 3,
    },
    {
      id: 'membership',
      title: 'Plano Mensal Contínuo',
      tagline: 'Garante que o paciente recém-atendido não fique solto sem acompanhamento.',
      audience: 'Pacientes ativos sem próximo passo registrado',
      pain: 'Recebem orientação pontual, mas podem perder ritmo sem uma cadência definida.',
      offer: 'Mensalidade com consulta periódica, revisão de metas e suporte com SLA definido.',
      patientCount: activeWithoutNextStep,
      priority: 2.5,
    },
    {
      id: 'reactivation',
      title: 'Reativação de Pacientes',
      tagline: 'Resgata quem já desistiu e precisa de um empurrão com acolhimento para voltar.',
      audience: 'Pacientes afastados há 90 dias ou mais',
      pain: 'Querem recomeçar, mas sentem culpa ou dificuldade de voltar à rotina.',
      offer: 'Reentrada de 30 dias: diagnóstico de barreiras, plano simplificado e checkpoint.',
      patientCount: countSignal('inactive'),
      priority: 2,
    },
    {
      id: 'first-journey',
      title: 'Primeira Consulta (Leads)',
      tagline: 'Transforma quem tem interesse em cliente pagante.',
      audience: 'Leads que ainda não iniciaram acompanhamento',
      pain: 'Têm interesse, mas não enxergam com clareza o processo e o valor do acompanhamento.',
      offer: 'Consulta inicial, avaliação física, plano alimentar e retorno curto de validação.',
      patientCount: countSignal('stalled_lead'),
      priority: 1,
    },
  ];

  // Mantém sempre os 4 blocos visíveis, priorizando no topo os que possuem pacientes potenciais
  return segments.sort((a, b) => {
    const scoreA = a.patientCount > 0 ? (a.patientCount * a.priority) : -1;
    const scoreB = b.patientCount > 0 ? (b.patientCount * b.priority) : -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.priority - a.priority;
  });
}

// Explica por que o radar pode estar vazio (dados ausentes que alimentam os sinais).
export function buildRadarDiagnostics(patients, conversations) {
  const linked = new Set();
  patients.forEach((patient) => {
    if (findLatestPatientMessage(conversations, patient)) linked.add(patient.id);
  });
  return {
    patients: patients.length,
    conversations: conversations.length,
    patientsWithConversation: linked.size,
    withoutConsultationDate: patients.filter((p) => !p.last_consultation_at).length,
    withoutBirthDate: patients.filter((p) => !p.birth_date).length,
  };
}

export function isPatientInOpportunity(item, opportunityId) {
  if (!item || !opportunityId) return false;
  if (opportunityId === 'continuity') return item.signals.some((s) => s.type === 'return_due');
  if (opportunityId === 'reactivation') return item.signals.some((s) => s.type === 'inactive');
  if (opportunityId === 'first-journey') return item.signals.some((s) => s.type === 'stalled_lead');
  if (opportunityId === 'membership') return item.patient.lifecycle_stage === 'active' && !item.patient.next_appointment_at;
  return false;
}
