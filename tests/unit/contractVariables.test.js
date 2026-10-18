import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CONTRACT_VARIABLES,
  getContractVariableBadgeHTML,
  getContractVariableValues,
  replaceContractVariables,
  formatContractTemplateToHTML,
  extractContractVariables,
} from '../../app/src/features/contratos/domain/contractVariables.js';

test('variáveis dinâmicas de contrato contêm data e hora da consulta', () => {
  const ids = CONTRACT_VARIABLES.map(v => v.id);
  assert.ok(ids.includes('dataConsulta'), 'Deve incluir dataConsulta');
  assert.ok(ids.includes('horaConsulta'), 'Deve incluir horaConsulta');
  assert.ok(ids.includes('dataHoraConsulta'), 'Deve incluir dataHoraConsulta');
  assert.ok(ids.includes('consultas'), 'Deve incluir consultas');
  assert.ok(ids.includes('paciente'), 'Deve incluir paciente');
  assert.ok(ids.includes('valor'), 'Deve incluir valor');
});

test('badge HTML de variável é gerado em verde igual ao padrão de anamnese', () => {
  const badge = getContractVariableBadgeHTML('dataConsulta');
  assert.match(badge, /contenteditable="false"/);
  assert.match(badge, /data-var="dataConsulta"/);
  assert.match(badge, /bg-emerald-100/);
  assert.match(badge, /text-emerald-800/);
  assert.match(badge, /border-emerald-300/);
  assert.match(badge, /⚡ \{\{ dataConsulta \}\}/);
});

test('getContractVariableValues formata dados de paciente e consultas corretamente', () => {
  const values = getContractVariableValues({
    paciente: { name: 'Mariana Lima' },
    plano: 'premium',
    valor: '2.400,00',
    formaPagamento: 'Cartão 3x',
    consultas: [
      { data: '2026-11-05', horario: '09:30' },
      { data: '2026-12-05', horario: '10:00' },
    ],
    dataAtual: '16/10/2026',
  });

  assert.equal(values.paciente, 'Mariana Lima');
  assert.equal(values.plano, 'PREMIUM');
  assert.equal(values.valor, 'R$ 2.400,00');
  assert.equal(values.formaPagamento, 'Cartão 3x');
  assert.equal(values.dataConsulta, '05/11/2026');
  assert.equal(values.horaConsulta, '09:30');
  assert.equal(values.dataHoraConsulta, '05/11/2026 às 09:30');
  assert.match(values.consultas, /1ª Consulta: 05\/11\/2026 às 09:30/);
  assert.match(values.consultas, /2ª Consulta: 05\/12\/2026 às 10:00/);
});

test('replaceContractVariables substitui badges em verde e tags brutas por valores preenchidos sem emojis de raio', () => {
  const badgeHTML = getContractVariableBadgeHTML('paciente');
  const inputHTML = `<p>O paciente ${badgeHTML} comparecerá na data {{ dataConsulta }} às {{ horaConsulta }} sob o plano {{ PLANO }}.</p>`;

  const result = replaceContractVariables(inputHTML, {
    paciente: { name: 'Carlos Eduardo' },
    plano: 'Essence',
    consultas: [{ data: '2026-10-25', horario: '15:00' }],
  });

  assert.doesNotMatch(result, /data-var=/);
  assert.doesNotMatch(result, /bg-emerald-100/);
  assert.doesNotMatch(result, /⚡/); // Garante que nenhum raio sai no documento impresso/PDF
  assert.match(result, /O paciente Carlos Eduardo comparecerá na data 25\/10\/2026 às 15:00 sob o plano ESSENCE\./);
});

test('formatContractTemplateToHTML converte tags brutas em badges verdes sem aninhar', () => {
  const input = '<p>Contrato de {{ paciente }} no plano {{ plano }}.</p>';
  const output = formatContractTemplateToHTML(input);

  assert.match(output, /data-var="paciente"/);
  assert.match(output, /data-var="plano"/);
  assert.match(output, /bg-emerald-100/);

  // Chamar novamente sobre o output não deve duplicar badges
  const secondPass = formatContractTemplateToHTML(output);
  assert.equal(secondPass, output);
});

test('extractContractVariables extrai variáveis de badges e tags brutas', () => {
  const badgeHTML = getContractVariableBadgeHTML('paciente');
  const content = `<div>${badgeHTML} e {{ valor }} e {{ dataConsulta }}</div>`;
  const vars = extractContractVariables(content);

  assert.equal(vars.length, 3);
  assert.ok(vars.includes('paciente'));
  assert.ok(vars.includes('valor'));
  assert.ok(vars.includes('dataConsulta'));
});

test('substitui variáveis da contratada para perfil da Dra. Isabela', () => {
  const template = '<p>Contratada: {{ nutricionista }}, {{ crn }}, clínica {{ clinica }}, tel: {{ telefone }}.</p>';
  const result = replaceContractVariables(template, {
    paciente: { name: 'Lucas Mendes' },
    organizationId: 'd116690a-ae43-4e33-88d0-cd1d45a49991',
  });

  assert.match(result, /Dra\. Isabela Muñoz Mendonça/);
  assert.match(result, /CRN-3 \/ 58\.492/);
  assert.match(result, /\(19\) 99876-5432/);
});

test('substitui variáveis da contratada dinamicamente para consultório externo', () => {
  const template = '<p>Contratada: {{ nutricionista }}, {{ crn }}, clínica {{ clinica }}, tel: {{ telefone }}.</p>';
  const result = replaceContractVariables(template, {
    paciente: { name: 'Beatriz Costa' },
    organizationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nutritionist: {
      name: 'Dra. Camila Santos',
      crn: 'CRN-3 / 99.123',
      clinic: 'Clínica Vida Ativa',
      phone: '(11) 98765-4321',
      address: 'Av. Paulista, 1000',
    },
  });

  assert.match(result, /Dra\. Camila Santos/);
  assert.match(result, /CRN-3 \/ 99\.123/);
  assert.match(result, /Clínica Vida Ativa/);
  assert.match(result, /\(11\) 98765-4321/);
  assert.doesNotMatch(result, /Isabela Muñoz/);
});

test('não vaza dados da Dra. Isabela para nova clínica com perfil em branco', () => {
  const template = '<p>Contratada: {{ nutricionista }}, {{ crn }}, clínica {{ clinica }}.</p>';
  const result = replaceContractVariables(template, {
    paciente: { name: 'João Silva' },
    organizationId: 'b2c3d4e5-f6a7-8901-bcde-fa2345678901',
    nutritionist: null,
  });

  assert.doesNotMatch(result, /Isabela Muñoz/);
  assert.doesNotMatch(result, /58\.492/);
  assert.match(result, /___________________________/);
  assert.match(result, /Consultório de Nutrição/);
});

