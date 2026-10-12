import { ROLE_PRESETS } from '../permissions.js';

const STORAGE_INVITE_CODE_KEY = (orgId) => `nutrisa_clinic_invite_code_${orgId || 'default'}`;
const STORAGE_TEAM_MEMBERS_KEY = (orgId) => `nutrisa_clinic_team_members_${orgId || 'default'}`;
const GLOBAL_CLINIC_DIRECTORY_KEY = 'nutrisa_clinic_codes_directory';

export function normalizeInviteCode(code = '') {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .trim();
}

export function getClinicInviteCode(organizationId) {
  if (!organizationId) return 'NUTRISA-2026';
  const saved = localStorage.getItem(STORAGE_INVITE_CODE_KEY(organizationId));
  if (saved) return saved;

  const defaultCode = `NUTRISA-${String(organizationId).slice(0, 4).toUpperCase()}`;
  saveClinicInviteCode(organizationId, defaultCode);
  return defaultCode;
}

export function saveClinicInviteCode(organizationId, rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (!code) throw new Error('O código não pode ser vazio.');

  localStorage.setItem(STORAGE_INVITE_CODE_KEY(organizationId), code);

  // Registra no diretório global local para permitir busca durante o login
  try {
    const directory = JSON.parse(localStorage.getItem(GLOBAL_CLINIC_DIRECTORY_KEY) || '{}');
    directory[code] = organizationId;
    localStorage.setItem(GLOBAL_CLINIC_DIRECTORY_KEY, JSON.stringify(directory));
  } catch {
    // fallback seguro
  }

  return code;
}

export function findOrganizationByInviteCode(rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (!code) return null;
  try {
    const directory = JSON.parse(localStorage.getItem(GLOBAL_CLINIC_DIRECTORY_KEY) || '{}');
    if (directory[code]) return directory[code];
  } catch {
    // ignore
  }

  // Se o código for padrão para a clínica da Dra. Isabela
  if (code.startsWith('NUTRISA') || code.includes('ISABELA')) {
    return 'nutrisa-default';
  }
  return null;
}

export function listTeamMembers(organizationId, currentUser) {
  const key = STORAGE_TEAM_MEMBERS_KEY(organizationId);
  let members = [];
  try {
    members = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    members = [];
  }

  // Garante que o usuário logado (proprietário/Dra.) exista na lista
  const ownerEmail = currentUser?.email || 'dra.isabela@nutrisa.com';
  const hasOwner = members.some((m) => m.role === 'owner');
  if (!hasOwner) {
    const ownerMember = {
      id: currentUser?.id || 'owner-main',
      name: currentUser?.user_metadata?.full_name || 'Dra. Isabela Munoz',
      email: ownerEmail,
      role: 'owner',
      permissions: ROLE_PRESETS.owner.modules,
      isOwner: true,
      created_at: new Date().toISOString(),
    };
    members.unshift(ownerMember);
    localStorage.setItem(key, JSON.stringify(members));
  }

  return members;
}

export function saveTeamMember(organizationId, memberData) {
  const key = STORAGE_TEAM_MEMBERS_KEY(organizationId);
  let members = [];
  try {
    members = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    members = [];
  }

  const existingIndex = members.findIndex((m) => m.id === memberData.id || (memberData.email && m.email === memberData.email));
  const newMember = {
    ...memberData,
    id: memberData.id || `member-${Date.now()}`,
    updated_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    members[existingIndex] = { ...members[existingIndex], ...newMember };
  } else {
    members.push({
      ...newMember,
      created_at: new Date().toISOString(),
    });
  }

  localStorage.setItem(key, JSON.stringify(members));
  return newMember;
}

export function deleteTeamMember(organizationId, memberId) {
  const key = STORAGE_TEAM_MEMBERS_KEY(organizationId);
  let members = [];
  try {
    members = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    members = [];
  }

  const filtered = members.filter((m) => m.id !== memberId && !m.isOwner);
  localStorage.setItem(key, JSON.stringify(filtered));
  return filtered;
}

export function getMemberForUser(organizationId, user) {
  if (!user) return null;
  const members = listTeamMembers(organizationId, user);
  const found = members.find((m) => m.id === user.id || m.email?.toLowerCase() === user.email?.toLowerCase());
  if (found) return found;

  // Se for o primeiro usuário ou tiver o papel de owner
  return members.find((m) => m.role === 'owner') || {
    id: user.id,
    name: user.email,
    email: user.email,
    role: 'owner',
    permissions: ROLE_PRESETS.owner.modules,
    isOwner: true,
  };
}
