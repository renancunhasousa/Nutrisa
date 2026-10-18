import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCommercialOpportunities, buildRadarItem, normalizeCrmPhone } from '../../app/src/features/crm/domain/radar.js';
import { prepareCommercialDataset } from '../../app/src/features/crm/services/commercialInsights.js';
import { NAV_ITEMS } from '../../app/src/layout/navigationItems.js';

const now = new Date('2026-10-12T12:00:00-03:00').getTime();

test('CRM prioriza mensagem fora do SLA acima das demais pendências', () => {
  const patient = {
    id: 'patient-1', full_name: 'Ana', whatsapp_phone: '+55 11 99999-0000',
    last_consultation_at: '2026-08-01T12:00:00-03:00', updated_at: '2026-10-10T12:00:00-03:00',
  };
  const conversations = [{ telefone_paciente: '5511999990000', respondida: false, tempo_espera_minutos: 180 }];
  const tasks = [{ patientId: 'patient-1', status: 'pending', dueDate: '2026-10-01' }];

  const item = buildRadarItem(patient, conversations, tasks, now);
  assert.equal(item.signals[0].type, 'unanswered');
  assert.deepEqual(item.signals.map((signal) => signal.type), ['unanswered', 'overdue_task', 'return_due']);
});

test('CRM não sinaliza retorno quando já existe próxima consulta', () => {
  const patient = {
    id: 'patient-2', full_name: 'Bia', last_consultation_at: '2026-07-01T12:00:00-03:00',
    next_appointment_at: '2026-10-20T12:00:00-03:00', updated_at: '2026-10-01T12:00:00-03:00',
  };
  assert.equal(buildRadarItem(patient, [], [], now), null);
});

test('CRM normaliza telefone brasileiro para vínculo e abertura do WhatsApp', () => {
  assert.equal(normalizeCrmPhone('+55 (11) 99999-0000'), '11999990000');
});

test('CRM transforma segmentos em oportunidades comerciais explicáveis', () => {
  const patient = { id: 'p1', lifecycle_stage: 'active' };
  const opportunities = buildCommercialOpportunities([
    { patient, signals: [{ type: 'return_due' }] },
  ], [patient]);
  assert.equal(opportunities[0].id, 'continuity');
  assert.equal(opportunities[0].patientCount, 1);
  assert.ok(opportunities.some((item) => item.id === 'membership'));
});

test('dataset da IA remove telefone, email e nome do paciente', () => {
  const dataset = prepareCommercialDataset({
    patients: [{ lifecycle_stage: 'active' }], opportunities: [],
    conversations: [{ nome_paciente: 'Ana Souza', categoria: 'Dúvida', mensagem_texto: 'Ana Souza falou no 11999990000 e ana@email.com' }],
  });
  const serialized = JSON.stringify(dataset);
  assert.doesNotMatch(serialized, /Ana Souza|11999990000|ana@email\.com/i);
  assert.match(serialized, /\[paciente\]|\[telefone removido\]|\[email removido\]/i);
});

test('módulo CRM é apresentado no painel como Relacionamento', () => {
  assert.equal(NAV_ITEMS.find((item) => item.id === 'crm')?.label, 'Relacionamento');
});

test('CRM identifica aniversariante do dia e dos próximos 7 dias', () => {
  const patientToday = {
    id: 'p-bday-1',
    full_name: 'Lucas Aniversariante',
    birth_date: '1995-10-12',
  };
  const itemToday = buildRadarItem(patientToday, [], [], now);
  assert.ok(itemToday);
  assert.ok(itemToday.signals.some((s) => s.type === 'birthday_today'));

  const patientSoon = {
    id: 'p-bday-2',
    full_name: 'Mariana Próxima',
    birth_date: '1992-10-15',
  };
  const itemSoon = buildRadarItem(patientSoon, [], [], now);
  assert.ok(itemSoon);
  assert.ok(itemSoon.signals.some((s) => s.type === 'birthday_soon'));
});

test('CRM filtra pacientes correspondentes a cada oportunidade comercial', async () => {
  const { isPatientInOpportunity } = await import('../../app/src/features/crm/domain/radar.js');

  const itemReturn = { patient: { lifecycle_stage: 'active' }, signals: [{ type: 'return_due' }] };
  assert.equal(isPatientInOpportunity(itemReturn, 'continuity'), true);
  assert.equal(isPatientInOpportunity(itemReturn, 'reactivation'), false);

  const itemInactive = { patient: { lifecycle_stage: 'active' }, signals: [{ type: 'inactive' }] };
  assert.equal(isPatientInOpportunity(itemInactive, 'reactivation'), true);

  const itemLead = { patient: { lifecycle_stage: 'lead' }, signals: [{ type: 'stalled_lead' }] };
  assert.equal(isPatientInOpportunity(itemLead, 'first-journey'), true);

  const itemActiveNoNext = { patient: { lifecycle_stage: 'active', next_appointment_at: null }, signals: [] };
  assert.equal(isPatientInOpportunity(itemActiveNoNext, 'membership'), true);
});

test('templates de WhatsApp geram textos carinhosos e URL codificada', async () => {
  const { buildWhatsAppUrl, getQuickTemplates } = await import('../../app/src/features/crm/domain/crmTemplates.js');

  const patient = { full_name: 'Camila Ferreira', phone: '(11) 98765-4321' };
  const templates = getQuickTemplates(patient, [{ type: 'return_due' }]);

  const returnTpl = templates.find((t) => t.id === 'return_due');
  assert.ok(returnTpl);
  assert.equal(returnTpl.isRecommended, true);
  assert.match(returnTpl.text, /Camila/);

  const url = buildWhatsAppUrl(patient.phone, returnTpl.text);
  assert.match(url, /^https:\/\/wa\.me\/5511987654321\?text=/);
});

test('CRM calcula SLA pela data_envio quando tempo_espera_minutos é nulo', () => {
  const patient = { id: 'p-sla', full_name: 'Duda', whatsapp_phone: '11988887777' };
  const conversations = [{
    patient_id: 'p-sla', respondida: false, tempo_espera_minutos: null,
    data_envio: '2026-10-12T06:00:00-03:00',
  }];
  const item = buildRadarItem(patient, conversations, [], now);
  assert.equal(item.signals[0].type, 'unanswered');
  assert.match(item.signals[0].detail, /6h/);
});

test('CRM marca lead parado pela última conversa, não pela data de cadastro', () => {
  const created_at = '2026-09-01T12:00:00-03:00';
  const recent = [{ patient_id: 'lead-1', respondida: true, data_envio: '2026-10-10T12:00:00-03:00' }];
  const old = [{ patient_id: 'lead-1', respondida: true, data_envio: '2026-10-01T12:00:00-03:00' }];
  const lead = { id: 'lead-1', lifecycle_stage: 'lead', created_at };
  assert.equal(buildRadarItem(lead, recent, [], now), null);
  assert.equal(buildRadarItem(lead, old, [], now).signals[0].type, 'stalled_lead');
});

test('CRM gera diagnóstico dos dados que alimentam o radar', async () => {
  const { buildRadarDiagnostics } = await import('../../app/src/features/crm/domain/radar.js');
  const patients = [{ id: 'a', whatsapp_phone: '11999990000' }, { id: 'b', birth_date: '1990-01-01', last_consultation_at: '2026-01-01' }];
  const result = buildRadarDiagnostics(patients, [{ telefone_paciente: '5511999990000' }]);
  assert.deepEqual(result, {
    patients: 2, conversations: 1, patientsWithConversation: 1, withoutConsultationDate: 1, withoutBirthDate: 1,
  });
});
