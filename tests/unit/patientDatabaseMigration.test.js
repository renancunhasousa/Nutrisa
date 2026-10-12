import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const migrationFile = readdirSync(migrationsDirectory)
  .find((file) => file.endsWith('_create_patient_database.sql'));
const hardeningMigrationFile = readdirSync(migrationsDirectory)
  .find((file) => file.endsWith('_harden_bootstrap_function.sql'));

assert.ok(migrationFile, 'A migração create_patient_database deve existir.');
assert.ok(hardeningMigrationFile, 'A migração harden_bootstrap_function deve existir.');

const sql = readFileSync(join(migrationsDirectory, migrationFile), 'utf8');
const hardeningSql = readFileSync(join(migrationsDirectory, hardeningMigrationFile), 'utf8');
const config = readFileSync(join(process.cwd(), 'supabase', 'config.toml'), 'utf8');

test('patient database migration creates the multi-tenant core tables', () => {
  for (const table of [
    'organizations',
    'organization_members',
    'patients',
    'patient_contacts',
    'patient_audit_log',
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'));
  }

  assert.match(sql, /foreign key \(patient_id, organization_id\)[\s\S]*references public\.patients \(id, organization_id\)/i);
  assert.match(sql, /unique \(id, organization_id\)/i);
});

test('patient migration preserves and backfills the legacy contract', () => {
  assert.match(sql, /add column if not exists full_name text/i);
  assert.match(sql, /coalesce\(nullif\(btrim\(full_name\), ''\), nullif\(btrim\(name\), ''\)/i);
  assert.match(sql, /create trigger patients_sync_legacy_fields/i);
  assert.match(sql, /when lower\(coalesce\(status, ''\)\)[\s\S]*'ativo'/i);
});

test('patient migration normalizes identifiers and prevents silent duplicates', () => {
  assert.match(sql, /full_name_normalized text generated always/i);
  assert.match(sql, /cpf_normalized text generated always/i);
  assert.match(sql, /phone_normalized text generated always/i);
  assert.match(sql, /whatsapp_phone_normalized text generated always/i);
  assert.match(sql, /create unique index if not exists patients_organization_cpf_uidx/i);
  assert.match(sql, /create unique index if not exists patients_organization_source_external_uidx/i);
  assert.match(sql, /create unique index if not exists patient_contacts_one_primary_uidx/i);
});

test('patient data is protected by organization-aware RLS and explicit grants', () => {
  for (const table of [
    'organizations',
    'organization_members',
    'patients',
    'patient_contacts',
    'patient_audit_log',
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, 'i'));
  }

  assert.match(sql, /create policy patients_select_member[\s\S]*private\.is_organization_member\(organization_id\)/i);
  assert.match(sql, /create policy patients_update_member[\s\S]*with check/i);
  assert.match(sql, /create policy patients_delete_owner[\s\S]*array\['owner'\]/i);
  assert.match(sql, /create trigger organization_members_keep_owner[\s\S]*prevent_last_organization_owner/i);
  assert.doesNotMatch(sql, /auth\.role\s*\(/i);
  assert.match(config, /^auto_expose_new_tables = false$/m);
});

test('privileged helpers have a fixed search path and bootstrap requires authentication', () => {
  assert.match(sql, /function private\.is_organization_member[\s\S]*security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /function private\.audit_patient_change[\s\S]*security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /function public\.bootstrap_organization[\s\S]*if v_user_id is null then/i);
  assert.match(sql, /revoke all on function public\.bootstrap_organization\(text\) from public, anon/i);
  assert.match(sql, /grant execute on function public\.bootstrap_organization\(text\) to authenticated/i);
  assert.match(hardeningSql, /function private\.bootstrap_organization_internal[\s\S]*security definer[\s\S]*set search_path = ''/i);
  assert.match(hardeningSql, /if v_user_id is null then/i);
  assert.match(hardeningSql, /function public\.bootstrap_organization[\s\S]*security invoker[\s\S]*set search_path = ''/i);
  assert.match(hardeningSql, /select private\.bootstrap_organization_internal\(p_name\)/i);
});
