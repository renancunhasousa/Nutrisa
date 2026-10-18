import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const migrationsDirectory = join(root, 'supabase', 'migrations');
const migrationFile = readdirSync(migrationsDirectory).find((file) => file.endsWith('_create_clinic_profile.sql'));
assert.ok(migrationFile, 'A migração de clinic_profiles deve existir.');
const sql = readFileSync(join(migrationsDirectory, migrationFile), 'utf8');

test('tabela clinic_profiles vincula dados à organização com RLS', () => {
  assert.match(sql, /create table if not exists public\.clinic_profiles/i);
  assert.match(sql, /organization_id uuid primary key references public\.organizations/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /clinic_profiles_select/i);
  assert.match(sql, /clinic_profiles_update/i);
});

test('serviço de perfil da clínica faz persistência e normalização com Supabase', () => {
  const service = readFileSync(join(root, 'app', 'src', 'features', 'configuracoes', 'services', 'clinicProfileService.js'), 'utf8');

  assert.match(service, /from\('clinic_profiles'\)/);
  assert.match(service, /export async function fetchClinicProfile/);
  assert.match(service, /export async function saveClinicProfile/);
  assert.match(service, /\.upsert\(payload, \{ onConflict: 'organization_id' \}\)/);
});

test('useAppSettings e ProfileSettings conectam salvamento no Supabase por organização', () => {
  const hook = readFileSync(join(root, 'app', 'src', 'features', 'configuracoes', 'useAppSettings.js'), 'utf8');
  const modal = readFileSync(join(root, 'app', 'src', 'features', 'configuracoes', 'ProfileSettings.jsx'), 'utf8');

  assert.match(hook, /fetchClinicProfile\(organizationId\)/);
  assert.match(hook, /saveClinicProfile\(organizationId/);
  assert.match(hook, /saveProfile/);
  assert.match(modal, /saveProfile\(form\)/);
});

test('formatDoctorShortName padroniza sempre para Dra. e primeiro nome sem invadir a tela', async () => {
  const { formatDoctorShortName } = await import('../../app/src/features/configuracoes/services/clinicProfileService.js');

  assert.equal(formatDoctorShortName('Dra. Isabela Muñoz Mendonça'), 'Dra. Isabela');
  assert.equal(formatDoctorShortName('Dra Isabela Muñoz'), 'Dra. Isabela');
  assert.equal(formatDoctorShortName('Isabela Muñoz'), 'Dra. Isabela');
  assert.equal(formatDoctorShortName('Dra. Mariana Costa'), 'Dra. Mariana');
  assert.equal(formatDoctorShortName('Nutri Camila Silva'), 'Dra. Camila');
  assert.equal(formatDoctorShortName('Dr. Carlos Eduardo'), 'Dr. Carlos');
  assert.equal(formatDoctorShortName(''), 'Dra. Isabela');
  assert.equal(formatDoctorShortName(null), 'Dra. Isabela');
});

