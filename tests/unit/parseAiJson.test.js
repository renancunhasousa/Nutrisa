import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAiJson, normalizeJsonString, closeTruncatedJson, extractKeyValuePairs } from '../../app/src/shared/utils/formatters.js';

test('parseAiJson: parseia JSON limpo e padrão', () => {
  const input = '{"NOME": "Mariana Santos", "OBJETIVO": "Emagrecimento"}';
  const result = parseAiJson(input);
  assert.deepEqual(result, { NOME: 'Mariana Santos', OBJETIVO: 'Emagrecimento' });
});

test('parseAiJson: lida com blocos de markdown e texto introdutório', () => {
  const input = 'Aqui está a anamnese processada:\n```json\n{"NOME": "Mariana Santos", "IDADE": "34 anos"}\n```\nEspero que ajude!';
  const result = parseAiJson(input);
  assert.deepEqual(result, { NOME: 'Mariana Santos', IDADE: '34 anos' });
});

test('parseAiJson: recupera JSON com quebras de linha literais reais dentro de strings', () => {
  // Simula o erro exato "Unterminated string in JSON at position X (line Y column Z)"
  const rawWithNewlines = '{\n  "NOME": "Mariana",\n  "AVALIACAO": "Primeira linha de notas.\nSegunda linha de conduta nutricional.\nTerceira recomendação.",\n  "STATUS": "ok"\n}';
  
  // JSON.parse padrão deve falhar com SyntaxError
  assert.throws(() => JSON.parse(rawWithNewlines), SyntaxError);

  // parseAiJson deve corrigir e parsear com sucesso
  const result = parseAiJson(rawWithNewlines);
  assert.equal(result.NOME, 'Mariana');
  assert.ok(result.AVALIACAO.includes('Primeira linha de notas.'));
  assert.ok(result.AVALIACAO.includes('Segunda linha de conduta'));
  assert.equal(result.STATUS, 'ok');
});

test('parseAiJson: repara e recupera JSON truncado por limite de tokens', () => {
  // JSON cortado abruptamente pelo LLM sem fechar a última string nem as chaves
  const truncated = '{\n  "NOME": "Mariana Santos Silva",\n  "OBJETIVO": "Hipertrofia e definição muscular",\n  "CONDUTA": "Prescrever plano com 2.0g/kg de proteína e creatina';

  assert.throws(() => JSON.parse(truncated));

  const result = parseAiJson(truncated);
  assert.equal(result.NOME, 'Mariana Santos Silva');
  assert.equal(result.OBJETIVO, 'Hipertrofia e definição muscular');
  assert.ok(result.CONDUTA.includes('Prescrever plano'));
});

test('parseAiJson: tolera trailing commas e caracteres de controle', () => {
  const trailing = '{\n  "NOME": "Mariana",\n  "IDADE": "34",\n}';
  const result = parseAiJson(trailing);
  assert.equal(result.NOME, 'Mariana');
  assert.equal(result.IDADE, '34');
});
