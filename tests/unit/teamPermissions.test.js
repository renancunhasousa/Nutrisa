import test from 'node:test';
import assert from 'node:assert/strict';
import { CLINICAL_MODULES, ROLE_PRESETS, hasModulePermission } from '../../app/src/features/auth/permissions.js';
import {
  normalizeInviteCode,
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

test('CLINICAL_MODULES lista os 14 módulos do menu lateral exatamente', () => {
  const ids = CLINICAL_MODULES.map((m) => m.id);
  assert.equal(ids.length, 14);
  assert.deepEqual(ids, [
    'pacientes',
    'crm',
    'laudo',
    'anamnese',
    'dietas',
    'produtos',
    'dashboard',
    'agenda',
    'tarefas',
    'contratos',
    'financas',
    'marketing',
    'ai',
    'configuracoes',
  ]);
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

test('serviço de equipe não usa localStorage como fonte de autorização', async () => {
  const source = await import('node:fs/promises').then((fs) => fs.readFile(
    new URL('../../app/src/features/auth/services/teamService.js', import.meta.url),
    'utf8',
  ));
  assert.doesNotMatch(source, /localStorage/);
  assert.match(source, /join_clinic_with_code/);
  assert.match(source, /get_my_clinic_membership/);
  assert.match(source, /PGRST202/);
});

test('permissões de equipe são persistidas e fiscalizadas no Supabase', async () => {
  const migration = await import('node:fs/promises').then((fs) => fs.readFile(
    new URL('../../supabase/migrations/20261012190000_secure_team_permissions.sql', import.meta.url),
    'utf8',
  ));
  assert.match(migration, /private\.team_invitations/);
  assert.match(migration, /lower\(i\.email\)=v_email/);
  assert.match(migration, /private\.has_module_permission/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table private\.clinic_invite_codes/);
  assert.match(migration, /notify pgrst, 'reload schema'/);
});

test('App bloqueia acesso direto a módulo sem permissão', async () => {
  const app = await import('node:fs/promises').then((fs) => fs.readFile(
    new URL('../../app/src/App.jsx', import.meta.url),
    'utf8',
  ));
  assert.match(app, /canAccessModule\(appMode\)/);
  assert.match(app, /não possui permissão/);
});
