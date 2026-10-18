import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const migrationsDirectory = join(root, 'supabase', 'migrations');
const migrationFile = readdirSync(migrationsDirectory).find((file) => file.endsWith('_user_avatar_and_profile.sql'));
assert.ok(migrationFile, 'A migração de avatar e perfil de usuário deve existir.');
const sql = readFileSync(join(migrationsDirectory, migrationFile), 'utf8');

test('migração adiciona coluna avatar_url e funções de perfil pessoal', () => {
  assert.match(sql, /add column if not exists avatar_url text/i);
  assert.match(sql, /update_my_clinic_profile/i);
  assert.match(sql, /get_my_clinic_membership/i);
  assert.match(sql, /bucket_id = 'avatars'/i);
});

test('teamService oferece funções de atualização de perfil e upload de foto', () => {
  const service = readFileSync(join(root, 'app', 'src', 'features', 'auth', 'services', 'teamService.js'), 'utf8');

  assert.match(service, /export async function updateMyClinicProfile/);
  assert.match(service, /export async function uploadUserAvatar/);
  assert.match(service, /avatarUrl: row\.avatar_url/);
});

test('Navbar exibe nome de quem está logado, cargo dinâmico e integra UserProfileModal', () => {
  const navbar = readFileSync(join(root, 'app', 'src', 'layout', 'Navbar.jsx'), 'utf8');

  assert.match(navbar, /UserProfileModal/);
  assert.match(navbar, /loggedUserName/);
  assert.match(navbar, /userRoleLabel/);
  assert.match(navbar, /setIsProfileModalOpen\(true\)/);
});

test('UserProfileModal permite editar nome, foto e exibe nível de acesso', () => {
  const modal = readFileSync(join(root, 'app', 'src', 'features', 'auth', 'components', 'UserProfileModal.jsx'), 'utf8');

  assert.match(modal, /useAuth/);
  assert.match(modal, /Foto de Perfil/);
  assert.match(modal, /uploadAvatar/);
  assert.match(modal, /updateProfile/);
  assert.match(modal, /Cargo \/ Nível de Acesso/);
});
