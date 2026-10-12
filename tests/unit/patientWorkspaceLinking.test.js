import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

test('atalhos encaminham contexto somente para o módulo escolhido', () => {
  const page = readSource('app/src/features/pacientes/PacientesPage.jsx');
  const handoff = readSource('app/src/features/pacientes/services/patientHandoff.js');
  assert.match(page, /writePatientHandoff\(mode, selectedPatient\)/);
  assert.match(handoff, /handoff\?\.mode !== mode/);
  assert.match(handoff, /sessionStorage\.removeItem\(STORAGE_KEY\)/);
});

test('dietas e contratos persistem patient_id', () => {
  const diets = readSource('app/src/features/dietas/services/dietStorageService.js');
  const contracts = readSource('app/src/features/contratos/services/contracts.js');
  assert.match(diets, /patient_id: sanitized\.patient_id \|\| null/);
  assert.match(contracts, /patient_id: patientId \|\| null/);
  assert.doesNotMatch(contracts, /patient_id: null/);
});

test('avaliação e anamnese gravam registros vinculados', () => {
  const evaluations = readSource('app/src/features/avaliacao/services/evaluations.js');
  const anamneses = readSource('app/src/features/anamnese/services/anamneses.js');
  assert.match(evaluations, /from\('physical_evaluations'\)\.insert/);
  assert.match(evaluations, /patient_id: patientId/);
  assert.match(anamneses, /from\('anamnese'\)\.insert/);
  assert.match(anamneses, /patient_id: patientId/);
});

test('conversas sem vínculo são associadas por telefone normalizado', () => {
  const conversations = readSource('app/src/features/atendimento/services/conversations.js');
  assert.match(conversations, /linkConversationsToPatient/);
  assert.match(conversations, /\.is\('patient_id', null\)/);
  assert.match(conversations, /update\(\{ patient_id: patientId \}\)/);
});
