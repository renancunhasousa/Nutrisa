import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const migrationsDirectory = join(root, 'supabase', 'migrations');
const migrationFile = readdirSync(migrationsDirectory).find((file) => file.endsWith('_multi_clinic_onboarding.sql'));
assert.ok(migrationFile, 'A migração de onboarding multi-clínicas deve existir.');
const sql = readFileSync(join(migrationsDirectory, migrationFile), 'utf8');

test('migração implementa criação autônoma de clínicas independentes no Supabase', () => {
  assert.match(sql, /create or replace function public\.create_clinic_organization/i);
  assert.match(sql, /insert into public\.organizations/i);
  assert.match(sql, /insert into public\.organization_members/i);
  assert.match(sql, /insert into private\.clinic_invite_codes/i);
  assert.match(sql, /insert into public\.clinic_profiles/i);
  assert.match(sql, /role[\s\S]*'owner'/i);
});

test('teamService exporta createClinicOrganization', () => {
  const service = readFileSync(join(root, 'app', 'src', 'features', 'auth', 'services', 'teamService.js'), 'utf8');
  assert.match(service, /export async function createClinicOrganization/);
  assert.match(service, /create_clinic_organization/);
});

test('AuthContext suporta cadastro de novos consultórios e criação de clínica', () => {
  const auth = readFileSync(join(root, 'app', 'src', 'features', 'auth', 'AuthContext.jsx'), 'utf8');
  assert.match(auth, /signUp: async/);
  assert.match(auth, /createClinic: async/);
  assert.match(auth, /createClinicOrganization/);
});

test('LoginPage possui alternador para criar novo consultório', () => {
  const login = readFileSync(join(root, 'app', 'src', 'features', 'auth', 'LoginPage.jsx'), 'utf8');
  assert.match(login, /Criar consultório/);
  assert.match(login, /Nome do Consultório \/ Clínica/);
  assert.match(login, /Criar meu consultório grátis/);
});

test('App.jsx integra onboarding suave com CreateClinicOnboarding', () => {
  const app = readFileSync(join(root, 'app', 'src', 'App.jsx'), 'utf8');
  assert.match(app, /CreateClinicOnboarding/);
  assert.match(app, /if \(!organizationId\) return <CreateClinicOnboarding \/>/);
});
