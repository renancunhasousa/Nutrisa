import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

test('PageHeader component exports semantic header with category, title and actions', () => {
  const component = readSource('app/src/shared/ui/PageHeader.jsx');

  assert.match(component, /export default function PageHeader/);
  assert.match(component, /<header className=/);
  assert.match(component, /category/);
  assert.match(component, /title/);
  assert.match(component, /description/);
  assert.match(component, /actions/);
  assert.match(component, /text-xs font-extrabold uppercase tracking-widest text-emerald-700/);
});

test('features adopt standard PageHeader', () => {
  const pacientes = readSource('app/src/features/pacientes/PacientesPage.jsx');
  const dietas = readSource('app/src/features/dietas/DietasPage.jsx');
  const atendimento = readSource('app/src/features/atendimento/AtendimentoPage.jsx');
  const agenda = readSource('app/src/features/agenda/AgendaPage.jsx');
  const tarefas = readSource('app/src/features/tarefas/TarefasPage.jsx');
  const marketing = readSource('app/src/features/marketing/MarketingPage.jsx');

  assert.match(pacientes, /<PageHeader/);
  assert.match(dietas, /<PageHeader/);
  assert.match(atendimento, /<PageHeader/);
  assert.match(agenda, /<PageHeader/);
  assert.match(tarefas, /<PageHeader/);
  assert.match(marketing, /<PageHeader/);
});
