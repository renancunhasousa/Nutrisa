import test from 'node:test';
import assert from 'node:assert/strict';
import { CLINICAL_MODULES, ROLE_PRESETS, hasModulePermission } from '../../app/src/features/auth/permissions.js';
import {
  findOrganizationByInviteCode,
  getClinicInviteCode,
  normalizeInviteCode,
  saveClinicInviteCode,
} from '../../app/src/features/auth/services/teamService.js';

// Setup de localStorage mock para ambiente Node
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

test('CLINICAL_MODULES lista os módulos clínicos e operacionais esperados', () => {
  const ids = CLINICAL_MODULES.map((m) => m.id);
  assert.ok(ids.includes('dietas'));
  assert.ok(ids.includes('anamnese'));
  assert.ok(ids.includes('avaliacao'));
  assert.ok(ids.includes('agenda'));
  assert.ok(ids.includes('crm'));
  assert.ok(ids.includes('contratos'));
});

test('hasModulePermission concede acesso total irrestrito para owner/Dra.', () => {
  const owner = { role: 'owner', isOwner: true };
  assert.equal(hasModulePermission(owner, 'dietas'), true);
  assert.equal(hasModulePermission(owner, 'financeiro'), true);
  assert.equal(hasModulePermission(owner, 'qualquer-modulo'), true);
});

test('hasModulePermission valida permissões individuais por módulo', () => {
  const receptionist = {
    role: 'receptionist',
    permissions: ['agenda', 'tarefas', 'crm'],
  };

  assert.equal(hasModulePermission(receptionist, 'agenda'), true);
  assert.equal(hasModulePermission(receptionist, 'crm'), true);
  assert.equal(hasModulePermission(receptionist, 'dietas'), false);
  assert.equal(hasModulePermission(receptionist, 'anamnese'), false);
});

test('hasModulePermission com role customizado obedece array de permissões', () => {
  const financeMember = {
    role: 'custom',
    permissions: ['contratos', 'agenda'],
  };

  assert.equal(hasModulePermission(financeMember, 'contratos'), true);
  assert.equal(hasModulePermission(financeMember, 'agenda'), true);
  assert.equal(hasModulePermission(financeMember, 'marketing'), false);
});

test('hasModulePermission concede acesso em modo offline/deslogado (fallback defensivo)', () => {
  assert.equal(hasModulePermission(null, 'agenda'), true);
  assert.equal(hasModulePermission(undefined, 'crm'), true);
});

test('hasModulePermission bloqueia quando membro não possui o módulo nas permissões', () => {
  const restrictedMember = { role: 'assistant', permissions: [] };
  assert.equal(hasModulePermission(restrictedMember, 'agenda'), false);
  assert.equal(hasModulePermission(restrictedMember, 'dietas'), false);
});

test('normalizeInviteCode sanitiza e normaliza o código da clínica', () => {
  assert.equal(normalizeInviteCode(' isabela-2026 '), 'ISABELA-2026');
  assert.equal(normalizeInviteCode('dra.isabela#10'), 'DRAISABELA10');
  assert.equal(normalizeInviteCode('nutrisa-sp'), 'NUTRISA-SP');
});

test('salva e recupera código de convite da clínica com persistência', () => {
  const orgId = 'clinica-moema-123';
  saveClinicInviteCode(orgId, 'DRA-MOEMA');

  const retrieved = getClinicInviteCode(orgId);
  assert.equal(retrieved, 'DRA-MOEMA');

  const matchedOrg = findOrganizationByInviteCode('dra-moema');
  assert.equal(matchedOrg, orgId);
});

test('findOrganizationByInviteCode reconhece prefixo padrão NUTRISA ou ISABELA', () => {
  assert.equal(findOrganizationByInviteCode('NUTRISA-2026'), 'nutrisa-default');
  assert.equal(findOrganizationByInviteCode('ISABELA-CLINICA'), 'nutrisa-default');
});
