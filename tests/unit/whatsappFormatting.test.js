import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWhatsAppFormatting } from '../../app/src/features/atendimento/domain/whatsappFormatting.js';

test('interpreta formatação simples e dupla de negrito do WhatsApp', () => {
  assert.deepEqual(parseWhatsAppFormatting('Oi *Ana* e **Maria**'), [
    { type: 'text', value: 'Oi ' },
    { type: 'bold', value: 'Ana' },
    { type: 'text', value: ' e ' },
    { type: 'bold', value: 'Maria' },
  ]);
});

test('interpreta itálico, riscado e monoespaçado preservando texto comum', () => {
  assert.deepEqual(parseWhatsAppFormatting('_atenção_ ~cancelado~ ```código```'), [
    { type: 'italic', value: 'atenção' },
    { type: 'text', value: ' ' },
    { type: 'strike', value: 'cancelado' },
    { type: 'text', value: ' ' },
    { type: 'code', value: 'código' },
  ]);
});

test('mantém tags HTML como texto sem interpretá-las', () => {
  assert.deepEqual(parseWhatsAppFormatting('<script>alert(1)</script>'), [
    { type: 'text', value: '<script>alert(1)</script>' },
  ]);
});
