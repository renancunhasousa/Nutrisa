import test from 'node:test';
import assert from 'node:assert/strict';
import { sendWhatsAppMessage } from '../../app/src/features/atendimento/services/whatsappSender.js';

test('envia mensagem ao webhook com o contrato esperado', async () => {
  let request;
  const result = await sendWhatsAppMessage({
    phone: '(19) 99999-0000',
    message: ' Olá! ',
    patientId: 'patient-1',
    requestedBy: 'user-1',
    organizationId: 'org-1',
    responderName: 'Dra. Isabela',
    responderRole: 'owner',
    responderType: 'isabela',
    url: 'https://n8n.example/webhook/send',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ success: true, message_id: 'msg-1' }), { status: 200 });
    },
  });

  assert.equal(request.url, 'https://n8n.example/webhook/send');
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), {
    phone: '(19) 99999-0000',
    message: 'Olá!',
    patient_id: 'patient-1',
    requested_by: 'user-1',
    organization_id: 'org-1',
    responder_name: 'Dra. Isabela',
    responder_role: 'owner',
    responder_type: 'isabela',
  });
  assert.equal(result.message_id, 'msg-1');
});

test('preserva a mensagem de erro retornada pelo webhook', async () => {
  await assert.rejects(
    sendWhatsAppMessage({
      phone: '5519999990000',
      message: 'Teste',
      url: 'https://n8n.example/webhook/send',
      fetchImpl: async () => new Response(JSON.stringify({ message: 'Instância desconectada.' }), { status: 502 }),
    }),
    /Instância desconectada/,
  );
});

test('bloqueia envio sem configuração ou conteúdo válido', async () => {
  await assert.rejects(sendWhatsAppMessage({ phone: '5519999990000', message: 'Oi', url: '' }), /VITE_N8N/);
  await assert.rejects(sendWhatsAppMessage({ phone: '', message: 'Oi', url: 'https://n8n.example' }), /WhatsApp cadastrado/);
  await assert.rejects(sendWhatsAppMessage({ phone: '5519999990000', message: '   ', url: 'https://n8n.example' }), /Escreva uma mensagem/);
});
