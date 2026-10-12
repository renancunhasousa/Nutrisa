export function getPatientFirstName(fullName = '') {
  const clean = String(fullName || '').trim();
  if (!clean) return 'paciente';
  return clean.split(/\s+/)[0];
}

export function buildWhatsAppUrl(phone, messageText = '') {
  const cleanPhone = String(phone || '')
    .replace(/\D/g, '')
    .replace(/^55(?=\d{10,11}$)/, '');
  if (!cleanPhone) return '';
  const text = encodeURIComponent(String(messageText || '').trim());
  return `https://wa.me/55${cleanPhone}${text ? `?text=${text}` : ''}`;
}

export function getQuickTemplates(patient, signals = []) {
  const firstName = getPatientFirstName(patient?.preferred_name || patient?.full_name);
  const signalTypes = new Set(signals.map((s) => s.type));

  const templates = [
    {
      id: 'return_due',
      title: 'Lembrete de Retorno',
      category: 'Retorno',
      isRecommended: signalTypes.has('return_due'),
      text: `Olá, ${firstName}! Tudo bem? Passando para saber como você está se adaptando à sua rotina alimentar. Já estamos no momento ideal para agendarmos o seu retorno e acompanharmos sua evolução! Qual o melhor dia e período para você?`,
    },
    {
      id: 'reactivation',
      title: 'Reativação Carinhosa',
      category: 'Reativação',
      isRecommended: signalTypes.has('inactive'),
      text: `Oi, ${firstName}! Lembrei de você hoje com muito carinho. Sei que a correria do dia a dia acontece, mas quero que saiba que estou aqui sempre que quiser retomar no seu ritmo, sem neuras ou julgamentos. Como você tem passado?`,
    },
    {
      id: 'birthday',
      title: 'Feliz Aniversário 🎂',
      category: 'Comemoração',
      isRecommended: signalTypes.has('birthday_today') || signalTypes.has('birthday_soon'),
      text: `Parabéns pelo seu aniversário, ${firstName}! 🎉🎂 Desejo muita saúde, momentos felizes e novas conquistas neste ciclo que se inicia. Um abraço bem carinhoso da sua nutri!`,
    },
    {
      id: 'stalled_lead',
      title: 'Apresentação para Lead',
      category: 'Novos Contatos',
      isRecommended: signalTypes.has('stalled_lead'),
      text: `Olá, ${firstName}! Tudo bem? Vi seu interesse em iniciar o acompanhamento nutricional. Gostaria de te apresentar como funciona o método e entender seus principais objetivos. Teria alguns minutos hoje para conversarmos?`,
    },
    {
      id: 'unanswered',
      title: 'Resposta de Atendimento',
      category: 'Atendimento',
      isRecommended: signalTypes.has('unanswered'),
      text: `Olá, ${firstName}! Peço desculpas pela espera no retorno. Já estou com suas informações abertas aqui. Me conta, como posso te ajudar hoje?`,
    },
    {
      id: 'checkin',
      title: 'Check-in de Rotina',
      category: 'Acompanhamento',
      isRecommended: !signalTypes.has('return_due') && !signalTypes.has('inactive') && !signalTypes.has('stalled_lead'),
      text: `Oi, ${firstName}! Passando para saber como está sendo a sua semana e como estão as refeições. Surgiu alguma dúvida ou desafio em que eu possa te apoiar?`,
    },
  ];

  return templates;
}
