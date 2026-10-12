import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const readSource = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

test('cadastro de pacientes não exibe atalhos, métricas ou associação com outros módulos', () => {
  const page = readSource('app/src/features/pacientes/PacientesPage.jsx');
  const candidates = readSource('app/src/features/pacientes/components/WhatsAppPatientCandidates.jsx');

  assert.doesNotMatch(page, /getPatientWorkspace|listUnlinkedRecords|linkRecordToPatient/);
  assert.doesNotMatch(page, /Vincular registros antigos|WhatsApp do paciente|Próximos cuidados/);
  assert.match(page, /Cadastro de pacientes/);
  assert.match(page, /Dados cadastrais/);
  assert.match(page, /WhatsAppPatientCandidates/);
  assert.ok(page.lastIndexOf('<WhatsAppPatientCandidates') > page.indexOf('lg:grid-cols'), 'a lista do WhatsApp deve aparecer depois do cadastro de pacientes');
  assert.match(page, /patient\.avatar_url/);
  assert.match(candidates, /Contatos do WhatsApp não cadastrados/);
  assert.match(candidates, /listUnregisteredWhatsAppContacts/);
  assert.match(candidates, /contact\.photoUrl/);
  assert.match(candidates, /loading="lazy"/);
  assert.match(candidates, /onRegister\(contact\.draft\)/);
});

test('contexto de pacientes é compartilhado com atendimento para cadastro assistido', () => {
  const app = readSource('app/src/App.jsx');
  const action = readSource('app/src/features/atendimento/components/ConversationPatientAction.jsx');

  assert.match(app, /<PatientProvider>[\s\S]*<AppLayout/);
  assert.match(app, /dashboard:\s*<AtendimentoPage[\s\S]*onNavigate=\{setAppMode\}/);
  assert.doesNotMatch(app, /PatientScopeBar|usePatient|selectedPatient/);
  assert.doesNotMatch(app, /patient=\{/);
  assert.match(action, /Cadastrar paciente/);
  assert.match(action, /Abrir paciente/);
  assert.match(action, /findPatientByPhone/);
});

test('serviço de pacientes contém somente operações do cadastro', () => {
  const service = readSource('app/src/features/pacientes/services/patients.js');

  assert.match(service, /export async function listPatients/);
  assert.match(service, /export async function createPatient/);
  assert.match(service, /export async function findPatientByPhone/);
  assert.match(service, /export async function findPatientsByPhone/);
  assert.match(service, /export async function updatePatient/);
  assert.match(service, /avatar_url: values\.avatar_url/);
  assert.doesNotMatch(service, /physical_evaluations|anamnese|plano_alimentar|log_conversas|appointments|nutrisa_tasks|contracts/);
  assert.doesNotMatch(service, /savePatient|linkRecord|getPatientWorkspace/);
});
