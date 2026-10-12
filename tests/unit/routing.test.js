import assert from 'node:assert/strict';
import test from 'node:test';
import { APP_MODES, readAppMode, writeAppMode } from '../../app/src/routing.js';

test('Produtos é uma rota válida e não cai no padrão Pacientes', () => {
  assert.ok(APP_MODES.includes('produtos'));
  assert.equal(readAppMode({ hash: '#produtos' }), 'produtos');
  assert.equal(readAppMode({ hash: '#/produtos/' }), 'produtos');
});

test('navegação para Produtos grava um único histórico e retorna a rota selecionada', () => {
  const calls = [];
  const mode = writeAppMode('produtos', {
    location: { hash: '#pacientes' },
    history: { pushState: (...args) => calls.push(args) },
  });

  assert.equal(mode, 'produtos');
  assert.deepEqual(calls, [[null, '', '#produtos']]);
});

test('rota desconhecida continua protegida pelo fallback de Pacientes', () => {
  assert.equal(readAppMode({ hash: '#rota-inexistente' }), 'pacientes');
  assert.equal(writeAppMode('rota-inexistente', { location: { hash: '' }, history: { pushState: assert.fail } }), null);
});
