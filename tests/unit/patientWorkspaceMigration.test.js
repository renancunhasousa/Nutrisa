import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const migrationFile = readdirSync(migrationsDirectory).find((file) => file.endsWith('_link_patient_workspace.sql'));
assert.ok(migrationFile, 'A migração link_patient_workspace deve existir.');
const sql = readFileSync(join(migrationsDirectory, migrationFile), 'utf8');

const linkedTables = [
  'physical_evaluations',
  'anamnese',
  'plano_alimentar',
  'log_conversas',
  'appointments',
  'nutrisa_tasks',
  'contracts',
];

test('all patient workspace modules receive organization and patient links', () => {
  for (const table of linkedTables) {
    assert.match(sql, new RegExp(`alter table public\\.${table}[\\s\\S]*?organization_id uuid`, 'i'));
  }
  assert.match(sql, /add column if not exists patient_id uuid/i);
  assert.match(sql, /foreign key \(patient_id, organization_id\)[\s\S]*references public\.patients\(id, organization_id\)/i);
});

test('legacy WhatsApp and task data is linked only by an unambiguous phone', () => {
  assert.match(sql, /having count\(distinct patient_id\) = 1/gi);
  assert.match(sql, /private\.normalize_phone\(conversation\.contato_jid\)/i);
  assert.match(sql, /private\.normalize_phone\(task\.patient_phone\)/i);
  assert.doesNotMatch(sql, /lower\(.*patient_name.*\).*patient_id/is);
});

test('clinical module tables use authenticated organization RLS', () => {
  assert.match(sql, /alter table public\.%I enable row level security/i);
  assert.match(sql, /to authenticated using \(\(select private\.is_organization_member\(organization_id\)\)\)/i);
  assert.match(sql, /revoke all on table public\.%I from anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.%I to authenticated/i);
});

test('public contract signing uses narrow RPCs instead of public table access', () => {
  assert.match(sql, /create or replace function public\.get_contract_for_signature\(p_token uuid\)/i);
  assert.match(sql, /create or replace function public\.sign_contract/i);
  assert.match(sql, /where contract\.public_token = p_token/i);
  assert.match(sql, /length\(p_signature_base64\) > 2000000/i);
  assert.match(sql, /grant execute on function public\.sign_contract\(uuid, text\) to anon, authenticated/i);
  assert.doesNotMatch(sql, /grant select[^;]*contracts[^;]*anon/i);
});
