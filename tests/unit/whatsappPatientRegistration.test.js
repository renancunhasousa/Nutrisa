import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPatientDraftFromConversation,
  findConversationPatient,
  findConversationPatientMatches,
  getConversationPatientName,
  getConversationPatientPhone,
  listUnregisteredWhatsAppContacts,
} from '../../app/src/features/atendimento/domain/patientRegistration.js';
import { normalizePatientPhone } from '../../app/src/features/pacientes/domain/phone.js';

test('normaliza telefones brasileiros e remove o sufixo do WhatsApp', () => {
  assert.equal(normalizePatientPhone('(19) 99750-7104'), '5519997507104');
  assert.equal(normalizePatientPhone('5519997507104@s.whatsapp.net'), '5519997507104');
  assert.equal(getConversationPatientPhone({ contato_jid: '5519997507104@s.whatsapp.net' }), '5519997507104');
});

test('localiza cadastro primeiro pelo patient_id e depois pelo telefone', () => {
  const patients = [
    { id: 'patient-a', full_name: 'Ana', whatsapp_phone: '(19) 99750-7104' },
    { id: 'patient-b', full_name: 'Beatriz', phone: '11988887777' },
  ];

  assert.equal(findConversationPatient(patients, { patient_id: 'patient-b', telefone_paciente: '5519997507104' }).id, 'patient-b');
  assert.equal(findConversationPatient(patients, { contato_jid: '5519997507104@s.whatsapp.net' }).id, 'patient-a');
  assert.equal(findConversationPatient(patients, { telefone: '21999999999' }), null);
});

test('não escolhe silenciosamente quando familiares compartilham o telefone', () => {
  const patients = [
    { id: 'patient-a', full_name: 'Ana', whatsapp_phone: '11988887777' },
    { id: 'patient-b', full_name: 'Bruno', phone: '+55 11 98888-7777' },
  ];
  const conversation = { telefone_paciente: '5511988887777' };

  assert.equal(findConversationPatient(patients, conversation), null);
  assert.deepEqual(findConversationPatientMatches(patients, conversation).map((patient) => patient.id), ['patient-a', 'patient-b']);
});

test('pré-preenche cadastro com dados seguros disponíveis na conversa', () => {
  const draft = buildPatientDraftFromConversation({
    nome_paciente: '  Ana Souza  ',
    telefone_paciente: '5519999999999',
    mensagem_texto: 'Olá, meu e-mail é ANA.SOUZA@example.com e gostaria de agendar.',
    data_envio: '2026-10-10T12:00:00.000Z',
    categoria: 'Agendamento e Horários',
  });

  assert.equal(draft.full_name, 'Ana Souza');
  assert.equal(draft.phone, '5519999999999');
  assert.equal(draft.whatsapp_phone, '5519999999999');
  assert.equal(draft.email, 'ana.souza@example.com');
  assert.equal(draft.acquisition_source, 'WhatsApp');
  assert.equal(draft.lifecycle_stage, 'lead');
  assert.match(draft.notes, /conversa do WhatsApp/i);
  assert.match(draft.notes, /Agendamento e Horários/);
  assert.doesNotMatch(draft.notes, /gostaria de agendar/i);
});

test('não transforma rótulo genérico ou telefone em nome do paciente', () => {
  assert.equal(getConversationPatientName({ nome_paciente: 'Paciente sem nome' }), '');
  assert.equal(getConversationPatientName({ nome_contato: '+55 19 99999-9999' }), '');
});

test('lista contatos não cadastrados agrupados pelo telefone e pela mensagem mais recente', () => {
  const patients = [{ id: 'registered', full_name: 'Cadastrada', whatsapp_phone: '11977776666' }];
  const contacts = listUnregisteredWhatsAppContacts([
    { id: 'a-new', nome_paciente: 'Ana', telefone_paciente: '11999990000', mensagem_texto: 'Oi', foto_perfil: 'https://example.com/ana.jpg', data_envio: '2026-10-09T10:00:00Z' },
    { id: 'a-old', nome_paciente: 'Ana', telefone_paciente: '5511999990000', mensagem_texto: 'E-mail ana@example.com', data_envio: '2026-10-08T10:00:00Z' },
    { id: 'b', nome_paciente: 'Bruno', contato_jid: '5519888887777@s.whatsapp.net', data_envio: '2026-10-10T10:00:00Z' },
    { id: 'registered-message', nome_paciente: 'Cadastrada', telefone_paciente: '5511977776666', data_envio: '2026-10-10T12:00:00Z' },
    { id: 'linked', patient_id: 'archived-patient', nome_paciente: 'Vinculada', telefone_paciente: '21966665555', data_envio: '2026-10-10T13:00:00Z' },
    { id: 'no-phone', nome_paciente: 'Sem telefone', data_envio: '2026-10-10T14:00:00Z' },
  ], patients);

  assert.deepEqual(contacts.map((contact) => contact.name), ['Bruno', 'Ana']);
  assert.equal(contacts[1].messageCount, 2);
  assert.equal(contacts[1].email, 'ana@example.com');
  assert.equal(contacts[1].photoUrl, 'https://example.com/ana.jpg');
  assert.equal(contacts[1].draft.avatar_url, 'https://example.com/ana.jpg');
  assert.equal(contacts[1].draft.acquisition_source, 'WhatsApp');
  assert.equal(contacts[1].draft.whatsapp_phone, '11999990000');
});
