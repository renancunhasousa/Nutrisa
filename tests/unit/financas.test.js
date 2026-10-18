import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPackages,
  savePackage,
  deletePackage,
  recordPackageConsultation,
  getTransactions,
  saveTransaction,
  deleteTransaction,
} from '../../app/src/features/financas/services/financeStorage.js';
import { APP_MODES, readAppMode } from '../../app/src/routing.js';

// Setup de mock do localStorage se necessário
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

test('Finanças é reconhecido como modo de navegação válido', () => {
  assert.equal(APP_MODES.includes('financas'), true);
  assert.equal(readAppMode({ hash: '#financas' }), 'financas');
});

test('financeStorage inicializa pacotes seed quando vazio', () => {
  localStorage.clear();
  const packages = getPackages();
  assert.equal(Array.isArray(packages), true);
  assert.equal(packages.length > 0, true);
  const seed = packages[0];
  assert.equal(typeof seed.partnerName, 'string');
  assert.equal(typeof seed.totalConsultations, 'number');
  assert.equal(typeof seed.completedConsultations, 'number');
});

test('savePackage cria novo pacote e calcula campos corretamente', () => {
  const newPkg = {
    patientName: 'Camila Teste',
    partnerName: 'Dr. Nutrólogo',
    planName: 'Protocolo Especial',
    frequency: 'Mensal',
    totalConsultations: 5,
    completedConsultations: 1,
    packageValue: 1500,
    partnerShare: 750,
    status: 'ativo',
    notes: 'Exames pendentes',
  };

  const list = savePackage(newPkg);
  const created = list.find((p) => p.patientName === 'Camila Teste');
  assert.ok(created);
  assert.equal(created.totalConsultations, 5);
  assert.equal(created.completedConsultations, 1);
  assert.equal(created.status, 'ativo');
});

test('recordPackageConsultation incrementa consultas e adiciona ao histórico', () => {
  const list = getPackages();
  const target = list[0];
  const initialCompleted = target.completedConsultations;

  recordPackageConsultation(target.id, 'Sessão de teste realizada', '2026-10-16');

  const updatedList = getPackages();
  const updated = updatedList.find((p) => p.id === target.id);
  assert.equal(updated.completedConsultations, initialCompleted + 1);
  assert.equal(updated.sessionsHistory.length > 0, true);
  assert.equal(updated.sessionsHistory[0].notes, 'Sessão de teste realizada');
});

test('recordPackageConsultation marca como concluído ao atingir o total', () => {
  const newPkg = savePackage({
    patientName: 'Marcos Conclusão',
    planName: 'Plano Rápido',
    partnerName: 'Dr. Lucas',
    totalConsultations: 2,
    completedConsultations: 1,
    status: 'ativo',
  });

  const target = newPkg.find((p) => p.patientName === 'Marcos Conclusão');
  recordPackageConsultation(target.id, 'Última consulta');

  const updated = getPackages().find((p) => p.id === target.id);
  assert.equal(updated.completedConsultations, 2);
  assert.equal(updated.status, 'concluido');
});

test('deletePackage remove o pacote da lista', () => {
  const list = getPackages();
  const toDelete = list[0];
  const updated = deletePackage(toDelete.id);
  assert.equal(updated.some((p) => p.id === toDelete.id), false);
});

test('financeStorage gerencia transações financeiras (receitas e despesas)', () => {
  const tx = {
    description: 'Teste Receita',
    type: 'receita',
    category: 'Consulta',
    amount: 350,
    date: '2026-10-16',
    status: 'pago',
  };

  const list = saveTransaction(tx);
  const created = list.find((t) => t.description === 'Teste Receita');
  assert.ok(created);
  assert.equal(created.amount, 350);

  const afterDelete = deleteTransaction(created.id);
  assert.equal(afterDelete.some((t) => t.id === created.id), false);
});
