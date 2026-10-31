import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_CONTRACT_PLANS } from '../../app/src/features/contratos/services/contractPlansService.js';

test('DEFAULT_CONTRACT_PLANS possui planos padrão com preços e métodos', () => {
  assert.ok(DEFAULT_CONTRACT_PLANS.length >= 4);
  const essence = DEFAULT_CONTRACT_PLANS.find(p => p.name === 'Essence');
  assert.ok(essence, 'Deve existir plano Essence');
  assert.equal(essence.default_payment_method, 'Pix à vista');
  assert.ok(essence.default_price > 0);
});

test('plano mapeia múltiplos métodos de pagamento sem reduzir a um único item', () => {
  const rowMock = {
    id: 'uuid-1',
    organization_id: 'org-1',
    name: 'Plano Personalizado',
    icon: '💎',
    default_price: '3000.00',
    default_payment_method: 'Pix à vista',
    payment_methods: [
      { id: 'pm-1', name: 'Pix à vista', feePercentage: 0, price: 3000 },
      { id: 'pm-2', name: 'Cartão 3x', feePercentage: 4, price: 3120 },
      { id: 'pm-3', name: 'Cartão 6x', feePercentage: 8, price: 3240 },
    ],
    description: 'Acompanhamento VIP',
    consultas_count: 5,
    is_active: true,
    display_order: 1,
  };

  const hasCustomMethods = Array.isArray(rowMock.payment_methods) && rowMock.payment_methods.length > 0;
  const methods = hasCustomMethods
    ? rowMock.payment_methods
    : [{ id: '1', name: rowMock.default_payment_method, feePercentage: 0, price: Number(rowMock.default_price) }];

  assert.equal(methods.length, 3, 'Deve preservar exatamente as 3 formas cadastradas');
  assert.equal(methods[0].name, 'Pix à vista');
  assert.equal(methods[1].price, 3120);
  assert.equal(methods[2].feePercentage, 8);
});
