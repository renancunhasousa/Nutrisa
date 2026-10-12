import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

test('cada feature pode abrir o histórico filtrado do paciente ativo', () => {
  const history = readSource('app/src/features/pacientes/components/PatientFeatureHistory.jsx');
  const contextBar = readSource('app/src/features/pacientes/components/PatientContextBar.jsx');
  assert.match(history, /filter\(\(record\) => record\.recordType === type\)/);
  assert.match(history, /Ver histórico/);
  assert.match(history, /writeClinicalRecordHandoff/);
  assert.match(contextBar, /PatientFeatureHistory/);
});
