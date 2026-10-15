import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const migrationsDirectory = join(root, 'supabase', 'migrations');
const migrationFile = readdirSync(migrationsDirectory).find((file) => file.endsWith('_create_document_templates.sql'));
assert.ok(migrationFile, 'A migração de modelos compartilhados deve existir.');
const sql = readFileSync(join(migrationsDirectory, migrationFile), 'utf8');

test('modelos de anamnese e contrato são persistidos por organização', () => {
  assert.match(sql, /create table public\.document_templates/i);
  assert.match(sql, /organization_id uuid not null references public\.organizations/i);
  assert.match(sql, /template_type in \('anamnese', 'contrato'\)/i);
  assert.match(sql, /content jsonb not null/i);
});

test('modelos compartilhados usam RLS e permissões do módulo', () => {
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /private\.has_module_permission/i);
  assert.match(sql, /for update to authenticated[\s\S]*using[\s\S]*with check/i);
  assert.match(sql, /revoke all on table public\.document_templates from anon/i);
});

test('frontend migra modelos locais e passa a ler e gravar no Supabase', () => {
  const service = readFileSync(join(root, 'app', 'src', 'shared', 'services', 'documentTemplates.js'), 'utf8');
  const anamnese = readFileSync(join(root, 'app', 'src', 'features', 'anamnese', 'hooks', 'useAnamnese.js'), 'utf8');
  const contratos = readFileSync(join(root, 'app', 'src', 'features', 'contratos', 'hooks', 'useContratos.js'), 'utf8');

  assert.match(service, /from\('document_templates'\)/);
  assert.match(service, /upsert\(rows, \{ onConflict: 'organization_id,template_type,source_key' \}\)/);
  assert.match(anamnese, /importLocalDocumentTemplates/);
  assert.match(contratos, /importLocalDocumentTemplates/);
  assert.doesNotMatch(anamnese, /localStorage\.setItem\(KEY_ANAMNESE_TEMPLATES/);
  assert.doesNotMatch(contratos, /localStorage\.setItem\(KEY_CONTRACT_TEMPLATES/);
});
