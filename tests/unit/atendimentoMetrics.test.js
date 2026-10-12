import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateComparisonStats, evaluateIsabelaGoals, evaluateSecretaryGoals } from '../../app/src/features/atendimento/domain/metrics.js';

test('calculateComparisonStats calculates intervention percentage and secretary category metrics', () => {
  const mockData = [
    // Mensagens da secretária
    { respondida: true, tempo_espera_minutos: 10, categoria: 'Agendamento e Horários', source: 'secretaria' },
    { respondida: true, tempo_espera_minutos: 15, categoria: 'Agendamento e Horários', source: 'secretaria' },
    { respondida: true, tempo_espera_minutos: 20, categoria: 'Pagamentos e Financeiro', source: 'secretaria' },
    { respondida: false, categoria: 'Agendamento e Horários', source: 'secretaria' },
    // Mensagens da Dra. Isabela
    { respondida: true, tempo_espera_minutos: 5, categoria: 'Dúvida Plano Alimentar', source: 'primario' },
    // Intervenção da Dra em agendamento
    { respondida: true, tempo_espera_minutos: 8, categoria: 'Agendamento e Horários', source: 'primario' },
  ];

  const getAttendantType = (c) => c.source === 'secretaria' ? 'secretaria' : 'isabela';

  const stats = calculateComparisonStats(mockData, getAttendantType);

  assert.equal(stats.isabela.total, 2);
  assert.equal(stats.secretaria.total, 4);
  assert.equal(stats.isabelaInterventions, 1);
  // Total msgs = 6, 1 intervenção = 1/6 = 17%
  assert.equal(stats.isabelaInterventionsPct, 17);
  // Secretária tem 3 mensagens em 'Agendamento e Horários' de 4 no total = 75%
  assert.equal(stats.secretariaAgendamentoCount, 3);
  assert.equal(stats.secretariaAgendamentoPct, 75);
  assert.equal(stats.isabelaClinicalCount, 1);
  assert.equal(stats.isabelaClinicalPct, 50);
});

test('evaluateIsabelaGoals checks SLA, protected volume, interventions and clinical focus', () => {
  const evaluation = evaluateIsabelaGoals({
    isabela: {
      avg: 12,
      total: 20,
      topCategories: [{ name: 'Dúvida Plano Alimentar', count: 15 }]
    },
    secretaria: { total: 80 },
    isabelaInterventions: 4,
    isabelaInterventionsPct: 20,
    isabelaClinicalCount: 16,
    isabelaClinicalPct: 80
  });

  assert.equal(evaluation.isSlaOk, true);
  assert.equal(evaluation.isVolOk, true);
  assert.equal(evaluation.isIntervOk, true);
  assert.equal(evaluation.isCategorizacaoOk, true);
  assert.equal(evaluation.avaliacaoMetas.length, 4);
});

test('evaluateIsabelaGoals flags operational overload and low clinical focus', () => {
  const evaluation = evaluateIsabelaGoals({
    isabela: {
      avg: 45,
      total: 60,
      topCategories: [{ name: 'Agendamento e Horários', count: 40 }]
    },
    secretaria: { total: 20 },
    isabelaInterventions: 30,
    isabelaInterventionsPct: 38,
    isabelaClinicalCount: 10,
    isabelaClinicalPct: 17
  });

  assert.equal(evaluation.isSlaOk, false);
  assert.equal(evaluation.isVolOk, false);
  assert.equal(evaluation.isIntervOk, false);
  assert.equal(evaluation.isCategorizacaoOk, false);
});

test('evaluateSecretaryGoals checks intervention threshold <= 25% and category focus on Agendamento e Horários', () => {
  const comparisonStatsSuccess = {
    secretaria: {
      avg: 12,
      total: 80,
      topCategories: [{ name: 'Agendamento e Horários', count: 60 }]
    },
    isabela: { total: 20 },
    isabelaInterventions: 4,
    isabelaInterventionsPct: 20, // <= 25% (Atingido)
    secretariaAgendamentoCount: 60,
    secretariaAgendamentoPct: 75 // Foco em Agendamento (Atingido)
  };

  const evaluation = evaluateSecretaryGoals(comparisonStatsSuccess);

  assert.equal(evaluation.isSlaOk, true);
  assert.equal(evaluation.isVolOk, true);
  assert.equal(evaluation.isIntervOk, true);
  assert.equal(evaluation.isCategorizacaoOk, true);
  assert.equal(evaluation.isBonusAtingido, true);

  const metas = evaluation.avaliacaoMetas;
  assert.equal(metas.length, 4);
  assert.equal(metas[0].meta, 'Tempo');
  assert.equal(metas[1].meta, 'Volume');
  assert.equal(metas[2].meta, 'Intervenção');
  assert.equal(metas[3].meta, 'Categorização');
  assert.equal(metas[2].atingido, true);
  assert.equal(metas[3].atingido, true);
});

test('evaluateSecretaryGoals fails intervention when exceeding 25%', () => {
  const comparisonStatsExceeded = {
    secretaria: { avg: 14, total: 50, topCategories: [{ name: 'Agendamento e Horários', count: 40 }] },
    isabela: { total: 50 },
    isabelaInterventions: 30,
    isabelaInterventionsPct: 30, // > 25% (Fora da meta)
    secretariaAgendamentoCount: 40,
    secretariaAgendamentoPct: 80
  };

  const evaluation = evaluateSecretaryGoals(comparisonStatsExceeded);

  assert.equal(evaluation.isIntervOk, false);
  assert.equal(evaluation.isBonusAtingido, false);
  assert.equal(evaluation.avaliacaoMetas[2].atingido, false);
});

test('evaluateSecretaryGoals fails categorization when secretary is not focused on Agendamento e Horários', () => {
  const comparisonStatsBadCategory = {
    secretaria: { avg: 10, total: 50, topCategories: [{ name: 'Pagamentos e Financeiro', count: 45 }] },
    isabela: { total: 20 },
    isabelaInterventions: 2,
    isabelaInterventionsPct: 5,
    secretariaAgendamentoCount: 5,
    secretariaAgendamentoPct: 10 // Apenas 10%
  };

  const evaluation = evaluateSecretaryGoals(comparisonStatsBadCategory);

  assert.equal(evaluation.isCategorizacaoOk, false);
  assert.equal(evaluation.isBonusAtingido, false);
  assert.equal(evaluation.avaliacaoMetas[3].atingido, false);
});
