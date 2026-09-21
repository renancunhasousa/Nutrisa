import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyAssessment, validateAssessment, selectedValue } from '../../app/src/features/avaliacao/domain/assessment.js';
import { buildComparativeData } from '../../app/src/features/avaliacao/domain/comparative.js';
import { normalizeConversation, conversationsCsv } from '../../app/src/features/atendimento/domain/conversations.js';
import { isClosingOrGreetingMessage } from '../../app/src/features/atendimento/domain/classification.js';
import { colorMapper } from '../../app/src/features/agenda/domain/calendarMapper.js';
import { mergeLocalEvents } from '../../app/src/features/agenda/services/calendar.js';

test('an empty assessment has no demonstration values', () => {
  assert.deepEqual(emptyAssessment().metrics, []);
  assert.deepEqual(emptyAssessment().patient, {});
});
test('extraction rejects missing patient, missing metrics and duplicate metrics', () => {
  assert.throws(() => validateAssessment({}));
  assert.throws(() => validateAssessment({ patient: { name: 'Teste' } }));
  assert.throws(() => validateAssessment({ patient: { name: 'Teste' }, metrics: [{key:'weight'}, {key:'weight'}] }));
});
test('extraction preserves missing values, zero and decimal commas', () => {
  const result = validateAssessment({ patient: { name: 'Teste' }, metrics: [{ key:'weight', biaValue:'60,5', adipometryValue:0 }] });
  assert.equal(result.metrics[0].biaValue, 60.5);
  assert.equal(result.metrics[0].selected, 'adipometry');
  assert.equal(result.segmental.rightArm.leanMass, null);
  assert.equal(result.biaEquipment, 'Não informado');
});
test('invalid numeric values fail validation', () => {
  assert.throws(() => validateAssessment({patient:{name:'Teste'},metrics:[{key:'weight',biaValue:'abc'}]}));
});
test('custom and missing metrics do not become fabricated zeros', () => {
  assert.equal(selectedValue({key:'weight',selected:'custom'},{weight:0}),0);
  assert.equal(selectedValue({key:'weight',selected:'custom'}),null);
  assert.equal(selectedValue({key:'weight',selected:'bia',biaValue:null}),null);
});
test('comparative excludes current date from historical columns', () => {
  const value={ patient:{date:'01/08/2026'},metrics:[],history:[{date:'01/07/2026',weight:61},{date:'01/08/2026',weight:60}] };
  assert.deepEqual(buildComparativeData(value,()=>null).pastDates,['01/07/2026']);
});
test('conversation aliases and string booleans normalize once', () => {
  const result=normalizeConversation({nome_contato:'Teste',contato_jid:'123@s.whatsapp.net',mensagem:'Oi',respondida:'false'});
  assert.equal(result.respondida,false);
  assert.equal(result.telefone_paciente,'123');
  assert.equal(result.conteudo_mensagem,'Oi');
  assert.equal(result.nome_paciente,'Teste');
});
test('CSV uses normalized message and safely quotes formulas/newlines', () => {
  const csv=conversationsCsv([{mensagem_texto:'Olá, "teste"\nsegunda linha',nome_contato:'=1+1'}],()=> 'secretaria');
  assert.ok(csv.includes('Olá, ""teste""\nsegunda linha'));
  assert.ok(csv.includes("'=1+1"));
});
test('courtesy classifier handles emoji without splitting surrogate pairs', () => {
  assert.equal(isClosingOrGreetingMessage({mensagem_texto:'Obrigada ❤️'}),true);
  assert.equal(isClosingOrGreetingMessage({mensagem_texto:'Tenho uma dúvida sobre meu exame'}),false);
});
test('confirmation status is independent of category color', () => {
  assert.equal(colorMapper.getStatusKey({colorId:'7'}),'a_confirmar');
  assert.equal(colorMapper.getStatusKey({summary:'Não confirmado'}),'a_confirmar');
  assert.equal(colorMapper.getStatusKey({summary:'[CANCELADO]',description:'confirmado antes'}),'desmarcado');
  assert.equal(colorMapper.getStatusKey({statusKey:'confirmado'}),'confirmado');
});
test('local calendar overrides survive a refresh without mutating remote data', () => {
  const remote=[{id:'1',summary:'Original'}];
  assert.equal(mergeLocalEvents(remote,{'1':{summary:'Local'}})[0].summary,'Local');
  assert.equal(remote[0].summary,'Original');
});

test('task categories include exames with correct module link and properties', async () => {
  const { TASK_CATEGORIES } = await import('../../app/src/features/tarefas/domain/taskTypes.js');
  assert.ok(TASK_CATEGORIES.exames);
  assert.equal(TASK_CATEGORIES.exames.id, 'exames');
  assert.equal(TASK_CATEGORIES.exames.label, 'Exames & Documentos');
  assert.equal(TASK_CATEGORIES.exames.defaultModule, 'laudo');
});

test('isConsultationEvent distinguishes patient appointments from personal events in calendar indicators', async () => {
  const { isConsultationEvent, colorMapper } = await import('../../app/src/features/agenda/domain/calendarMapper.js');

  // Compromissos pessoais não devem ser considerados consultas
  assert.equal(isConsultationEvent({ summary: 'Nazareno' }), false);
  assert.equal(isConsultationEvent({ summary: 'Culto Nazareno' }), false);
  assert.equal(isConsultationEvent({ summary: 'Unha' }), false);
  assert.equal(isConsultationEvent({ summary: 'Fazer unhas' }), false);
  assert.equal(isConsultationEvent({ summary: 'Dentista' }), false);
  assert.equal(isConsultationEvent({ summary: 'Almoço com família' }), false);
  assert.equal(isConsultationEvent({ summary: 'Pilates' }), false);
  assert.equal(isConsultationEvent({ summary: 'Mariana Silva', colorId: '9' }), false, 'colorId 9 (Pessoal) não deve ser consulta');
  assert.equal(isConsultationEvent({ summary: '[DESMARCADO] Carlos Eduardo' }), false, 'desmarcado não deve ser consulta ativa');

  // Consultas legítimas de pacientes devem ser consideradas
  assert.equal(isConsultationEvent({ summary: 'Mariana Silva' }), true);
  assert.equal(isConsultationEvent({ summary: '[CONFIRMADO] Carlos Roberto' }), true);
  assert.equal(isConsultationEvent({ summary: 'Consulta - João Pedro' }), true);
  assert.equal(isConsultationEvent({ summary: 'Retorno - Beatriz Souza' }), true);

  // Categorização no WebDiet
  assert.equal(colorMapper.getCategoryByEvent({ summary: 'Nazareno' }).label, 'Pessoal');
  assert.equal(colorMapper.getCategoryByEvent({ summary: 'Unha' }).label, 'Pessoal');
});


