/**
 * Regras de domínio e métricas operacionais para Atendimento WhatsApp e Relatório Executivo
 */

export const ADMINISTRATIVE_CATEGORIES = [
  'Agendamento e Horários',
  'Pagamentos e Financeiro',
  'Planos e Pacotes'
];

/**
 * Calcula as estatísticas comparativas entre Dra. Isabela e Secretária.
 */
export function calculateComparisonStats(filteredData = [], getAttendantType) {
  const isabelaConvs = filteredData.filter(c => getAttendantType(c) === 'isabela');
  const secretariaConvs = filteredData.filter(c => getAttendantType(c) === 'secretaria');

  const getStats = (list) => {
    const total = list.length;
    const answeredList = list.filter(c => c.respondida && c.tempo_espera_minutos != null);
    const times = answeredList.map(c => Number(c.tempo_espera_minutos));

    const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const min = times.length > 0 ? Math.min(...times) : 0;
    const max = times.length > 0 ? Math.max(...times) : 0;
    const fastRate = times.length > 0 ? Math.round((times.filter(t => t <= 15).length / times.length) * 100) : 0;
    const pendingCount = list.filter(c => !c.respondida).length;

    const catCounts = {};
    list.forEach(c => {
      const cat = c.categoria || 'Outro';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const topCategories = Object.entries(catCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { total, answeredCount: answeredList.length, avg, min, max, fastRate, pendingCount, topCategories };
  };

  const isabelaPendingCount = filteredData.filter(c => !c.respondida && getAttendantType(c) === 'isabela').length;
  const secretariaPendingCount = filteredData.filter(c => !c.respondida && getAttendantType(c) === 'secretaria').length;

  const isabelaStats = { ...getStats(isabelaConvs), pendingCount: isabelaPendingCount };
  const secretariaStats = { ...getStats(secretariaConvs), pendingCount: secretariaPendingCount };
  const totalAnswered = isabelaStats.answeredCount + secretariaStats.answeredCount;
  const totalMsgs = filteredData.length;

  // Intervenções da Dra. Isabela em assuntos administrativos/de recepção
  const isabelaInterventions = isabelaConvs.filter(c => ADMINISTRATIVE_CATEGORIES.includes(c.categoria)).length;
  const isabelaInterventionsPct = totalMsgs > 0 ? Math.round((isabelaInterventions / totalMsgs) * 100) : 0;

  // Categorização da secretária: foco em Agendamento e Horários
  const secretariaAgendamentoCount = secretariaConvs.filter(c => c.categoria === 'Agendamento e Horários').length;
  const secretariaAgendamentoPct = secretariaConvs.length > 0
    ? Math.round((secretariaAgendamentoCount / secretariaConvs.length) * 100)
    : 0;

  return {
    isabela: isabelaStats,
    secretaria: secretariaStats,
    totalAnswered,
    isabelaInterventions,
    isabelaInterventionsPct,
    secretariaAgendamentoCount,
    secretariaAgendamentoPct
  };
}

/**
 * Avalia as 4 metas operacionais da secretária para apuração de bônus:
 * 1. Tempo: SLA <= 30 min (Meta ouro <= 15 min)
 * 2. Volume: Secretária liderar o volume de respostas
 * 3. Intervenção: Intervenções da Dra. em assuntos administrativos <= 25% do total de mensagens
 * 4. Categorização: Principal categoria de mensagens enviada pela secretária ser "Agendamento e Horários"
 */
export function evaluateSecretaryGoals(comparisonStats = {}) {
  const secAvg = comparisonStats.secretaria?.avg || 0;
  const secTotal = comparisonStats.secretaria?.total || 0;
  const isaTotal = comparisonStats.isabela?.total || 0;
  const intervPct = comparisonStats.isabelaInterventionsPct ?? 0;
  const secAgendamentoPct = comparisonStats.secretariaAgendamentoPct ?? 0;
  const secAgendamentoCount = comparisonStats.secretariaAgendamentoCount ?? 0;

  const isSlaOk = secTotal === 0 || secAvg <= 30;
  const isVolOk = secTotal >= isaTotal;
  const isIntervOk = intervPct <= 25;

  const topCategory = comparisonStats.secretaria?.topCategories?.[0]?.name;
  const isCategorizacaoOk = secTotal === 0 || secAgendamentoPct >= 40 || topCategory === 'Agendamento e Horários';

  const isBonusAtingido = isSlaOk && isVolOk && isIntervOk && isCategorizacaoOk;

  return {
    isSlaOk,
    isVolOk,
    isIntervOk,
    isCategorizacaoOk,
    isBonusAtingido,
    avaliacaoMetas: [
      {
        meta: "Tempo",
        atingido: isSlaOk,
        detalhe: `Média de ${secAvg} min (Meta Ouro <= 15 min)`
      },
      {
        meta: "Volume",
        atingido: isVolOk,
        detalhe: `Secretária: ${secTotal} msgs vs Dra: ${isaTotal} msgs`
      },
      {
        meta: "Intervenção",
        atingido: isIntervOk,
        detalhe: `${comparisonStats.isabelaInterventions || 0} intervenções (${intervPct}% do total, meta <= 25%)`
      },
      {
        meta: "Categorização",
        atingido: isCategorizacaoOk,
        detalhe: `${secAgendamentoPct}% dos atendimentos da recepção em Agendamento e Horários (${secAgendamentoCount} msgs)`
      }
    ]
  };
}
