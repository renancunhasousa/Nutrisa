import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyAppointmentDates, deriveAppointmentDates, eventNameKey, resolveCalendarLinks,
} from '../../app/src/features/crm/domain/calendarLinks.js';

const now = new Date('2026-10-15T12:00:00-03:00').getTime();
const evt = (summary, iso, extra = {}) => ({ id: summary + iso, summary, start: { dateTime: iso }, end: { dateTime: iso }, ...extra });
const patients = [
  { id: 'p1', full_name: 'Maria da Silva Santos' },
  { id: 'p2', full_name: 'João Pereira' },
  { id: 'p3', full_name: 'Ana Souza' },
  { id: 'p4', full_name: 'Ana Souza Lima' },
];

test('chave do evento ignora tags de status, emojis, acentos e caixa', () => {
  assert.equal(eventNameKey('[CONFIRMADO] João  Pereira ✅'), 'joao pereira');
});

test('liga automaticamente apenas quando o nome identifica um único paciente', () => {
  const groups = resolveCalendarLinks([
    evt('Maria Silva', '2026-09-01T10:00:00-03:00'),
    evt('Joao Pereira', '2026-09-10T10:00:00-03:00'),
    evt('Ana Souza', '2026-09-12T10:00:00-03:00'),
    evt('Carla', '2026-09-13T10:00:00-03:00'),
  ], patients);
  const by = (label) => groups.find((group) => group.label === label);
  assert.equal(by('Maria Silva').status, 'auto');
  assert.equal(by('Maria Silva').patient.id, 'p1');
  assert.equal(by('Joao Pereira').patient.id, 'p2');
  assert.equal(by('Ana Souza').patient.id, 'p3'); // nome completo idêntico vence o parcial
  assert.equal(by('Carla').status, 'unmatched');
});

test('nome só com primeiro nome nunca liga sozinho, mas sugere candidatos', () => {
  const [group] = resolveCalendarLinks([evt('Joao', '2026-09-10T10:00:00-03:00')], patients);
  assert.equal(group.status, 'unmatched');
  assert.deepEqual(group.candidates.map((p) => p.id), ['p2']);
});

test('vínculo manual e ignorado têm prioridade sobre a correspondência automática', () => {
  const links = new Map([['carla', { patient_id: 'p2', ignored: false }], ['joao pereira', { patient_id: null, ignored: true }]]);
  const groups = resolveCalendarLinks([
    evt('Carla', '2026-09-13T10:00:00-03:00'),
    evt('Joao Pereira', '2026-09-10T10:00:00-03:00'),
  ], patients, links);
  assert.equal(groups.find((g) => g.label === 'Carla').status, 'manual');
  assert.equal(groups.find((g) => g.label === 'Joao Pereira').status, 'ignored');
});

test('ignora compromissos pessoais e eventos desmarcados', () => {
  const groups = resolveCalendarLinks([
    evt('Almoço família', '2026-09-10T12:00:00-03:00'),
    evt('[DESMARCADO] Maria Silva', '2026-09-11T10:00:00-03:00'),
  ], patients);
  assert.equal(groups.length, 0);
});

test('deriva última consulta (passado) e próxima consulta (futuro) por paciente', () => {
  const groups = resolveCalendarLinks([
    evt('Maria Silva', '2026-08-01T10:00:00-03:00'),
    evt('Maria Silva', '2026-09-20T10:00:00-03:00'),
    evt('Maria Silva', '2026-10-30T10:00:00-03:00'),
    evt('Maria Silva', '2026-11-30T10:00:00-03:00'),
  ], patients);
  const dates = deriveAppointmentDates(groups, now).get('p1');
  assert.equal(new Date(dates.last_consultation_at).toISOString(), new Date('2026-09-20T10:00:00-03:00').toISOString());
  assert.equal(new Date(dates.next_appointment_at).toISOString(), new Date('2026-10-30T10:00:00-03:00').toISOString());
});

test('datas do cadastro prevalecem sobre as da agenda', () => {
  const dates = new Map([['p1', { last_consultation_at: '2026-09-20T00:00:00Z', next_appointment_at: null }]]);
  const [enriched, untouched] = applyAppointmentDates([
    { id: 'p1', last_consultation_at: null, next_appointment_at: '2026-12-01T00:00:00Z' },
    { id: 'p2' },
  ], dates);
  assert.equal(enriched.last_consultation_at, '2026-09-20T00:00:00Z');
  assert.equal(enriched.next_appointment_at, '2026-12-01T00:00:00Z');
  assert.deepEqual(untouched, { id: 'p2' });
});

test('nomes abreviados ou com erro leve viram sugestão, nunca ligação automática', () => {
  const groups = resolveCalendarLinks([
    evt('Mari Santos', '2026-09-01T10:00:00-03:00'),
    evt('Joao Pereria', '2026-09-02T10:00:00-03:00'),
  ], patients);
  const by = (label) => groups.find((group) => group.label === label);
  assert.equal(by('Mari Santos').status, 'suggested');
  assert.equal(by('Mari Santos').patient.id, 'p1');
  assert.equal(by('Joao Pereria').status, 'suggested');
  assert.equal(by('Joao Pereria').patient.id, 'p2');
  assert.equal(deriveAppointmentDates(groups, now).size, 0); // sugestão só vale depois de confirmada
});

test('sugestão ambígua entre pacientes parecidos vai para escolha com candidatos ordenados', () => {
  const [group] = resolveCalendarLinks([evt('Anna Souza', '2026-09-01T10:00:00-03:00')], patients);
  assert.equal(group.status, 'ambiguous');
  assert.deepEqual(group.candidates.map((p) => p.id).sort(), ['p3', 'p4']);
});

test('vincula automaticamente por e-mail nos convidados mesmo com nome incompleto', () => {
  const patientsWithEmail = [
    { id: 'p-mail-1', full_name: 'Lucas Ferreira Mendes', email: 'lucas@gmail.com' },
  ];
  const groups = resolveCalendarLinks([
    evt('Lucas', '2026-09-01T10:00:00-03:00', {
      attendees: [
        { email: 'dra.isabela@gmail.com', self: true },
        { email: 'lucas@gmail.com' },
      ],
    }),
  ], patientsWithEmail, new Map(), 'dra.isabela@gmail.com');

  assert.equal(groups[0].status, 'auto');
  assert.equal(groups[0].patient.id, 'p-mail-1');
  assert.equal(groups[0].matchReason, 'email');
});

test('vincula automaticamente por e-mail na descrição do evento', () => {
  const patientsWithEmail = [
    { id: 'p-mail-2', full_name: 'Camila Rocha', email: 'camila.rocha@hotmail.com' },
  ];
  const groups = resolveCalendarLinks([
    evt('Consulta Online', '2026-09-01T10:00:00-03:00', {
      description: 'Consulta confirmada. Contato: camila.rocha@hotmail.com',
    }),
  ], patientsWithEmail);

  assert.equal(groups[0].status, 'auto');
  assert.equal(groups[0].patient.id, 'p-mail-2');
  assert.equal(groups[0].matchReason, 'email');
});

test('vincula automaticamente por telefone na descrição do evento', () => {
  const patientsWithPhone = [
    { id: 'p-phone-1', full_name: 'Bruna Lima', phone: '11988887777', email: null },
  ];
  const groups = resolveCalendarLinks([
    evt('Bruna', '2026-09-01T10:00:00-03:00', {
      description: 'Agendamento feito via WhatsApp (11) 98888-7777',
    }),
  ], patientsWithPhone);

  assert.equal(groups[0].status, 'auto');
  assert.equal(groups[0].patient.id, 'p-phone-1');
  assert.equal(groups[0].matchReason, 'phone');
});

