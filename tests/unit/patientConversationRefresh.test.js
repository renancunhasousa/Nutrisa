import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync(join(process.cwd(), 'app/src/features/atendimento/components/PatientConversationView.jsx'), 'utf8');

test('conversa do paciente atualiza automaticamente e informa o horário', () => {
  assert.match(source, /AUTO_REFRESH_INTERVAL_MS\s*=\s*30_000/);
  assert.match(source, /setInterval\(refreshWhenVisible,\s*AUTO_REFRESH_INTERVAL_MS\)/);
  assert.match(source, /visibilityState\s*===\s*'visible'/);
  assert.match(source, /Atualizado às/);
  assert.match(source, /setLastUpdated\(new Date\(\)\)/);
});

test('barra da conversa exibe busca, horário e botão Atualizar nessa ordem', () => {
  const searchPosition = source.indexOf('placeholder="Buscar na conversa"');
  const updatedAtPosition = source.indexOf('Atualizado às');
  const refreshButtonPosition = source.indexOf('<span>Atualizar</span>');

  assert.ok(searchPosition >= 0);
  assert.ok(updatedAtPosition > searchPosition);
  assert.ok(refreshButtonPosition > updatedAtPosition);
});
