import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

test('seletor global mantém paciente ativo e permite trabalhar sem vínculo', () => {
  const selector = readSource('app/src/features/pacientes/components/PatientSelector.jsx');
  const context = readSource('app/src/features/pacientes/PatientContext.jsx');
  assert.match(selector, /Selecionar paciente/);
  assert.match(selector, /Trabalhar sem paciente/);
  assert.match(context, /nutrisa_selected_patient_id/);
});

test('ficha consulta múltiplos registros clínicos e oferece reabertura', () => {
  const history = readSource('app/src/features/pacientes/services/clinicalRecords.js');
  const component = readSource('app/src/features/pacientes/components/PatientClinicalHistory.jsx');
  for (const table of ['physical_evaluations', 'anamnese', 'plano_alimentar', 'contracts']) assert.match(history, new RegExp(`table: '${table}'`));
  assert.match(history, /eq\('patient_id', patientId\)/);
  assert.match(component, /Visualizar/);
  assert.match(component, /writeClinicalRecordHandoff/);
});

test('avaliação possui salvamento explícito e atualização do registro aberto', () => {
  const report = readSource('app/src/features/avaliacao/report/LaudoReport.jsx');
  const service = readSource('app/src/features/avaliacao/services/evaluations.js');
  assert.match(report, /Salvar no prontuário/);
  assert.match(report, /Atualizar no prontuário/);
  assert.match(service, /\.update\(payload\)\.eq\('id', id\)/);
});
