import { supabase } from '../../../shared/services/supabase.js';

export function normalizeInviteCode(code = '') {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').trim();
}

function requireClient() {
  if (!supabase) throw new Error('O Supabase precisa estar configurado para gerenciar a equipe.');
  return supabase;
}

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export async function getClinicInviteCode(organizationId) {
  if (!organizationId) return '';
  return unwrap(await requireClient().rpc('get_clinic_invite_code', { p_organization_id: organizationId }));
}

export async function saveClinicInviteCode(organizationId, rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (code.length < 6) throw new Error('O código precisa ter ao menos 6 caracteres.');
  return unwrap(await requireClient().rpc('set_clinic_invite_code', { p_organization_id: organizationId, p_code: code }));
}

export async function listTeamMembers(organizationId) {
  if (!organizationId) return [];
  const rows = unwrap(await requireClient().rpc('list_clinic_team', { p_organization_id: organizationId })) || [];
  return rows.map((row) => ({ ...row, permissions: row.permissions || [], isOwner: row.is_owner }));
}

export async function saveTeamMember(organizationId, memberData) {
  const id = unwrap(await requireClient().rpc('save_clinic_team_member', {
    p_organization_id: organizationId, p_id: memberData.id || null, p_name: memberData.name,
    p_email: memberData.email, p_role: memberData.role, p_permissions: memberData.permissions || [],
  }));
  return { ...memberData, id, isOwner: memberData.role === 'owner' };
}

export async function deleteTeamMember(organizationId, memberId) {
  unwrap(await requireClient().rpc('delete_clinic_team_member', { p_organization_id: organizationId, p_id: memberId }));
}

export async function joinOrganizationWithInviteCode(rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (!code) throw new Error('Informe o código da clínica.');
  return unwrap(await requireClient().rpc('join_clinic_with_code', { p_code: code }));
}

export async function getCurrentMembership() {
  if (!supabase) return null;
  const rpcResult = await supabase.rpc('get_my_clinic_membership');
  if (rpcResult.error?.code === 'PGRST202' || rpcResult.error?.status === 404) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const userId = authData.user?.id;
    if (!userId) return null;
    const fallback = await supabase
      .from('organization_members')
      .select('organization_id,user_id,display_name,email,role,permissions,avatar_url')
      .eq('user_id', userId)
      .order('created_at')
      .limit(1)
      .maybeSingle();
    const row = unwrap(fallback);
    return row ? {
      ...row,
      permissions: row.permissions || [],
      isOwner: row.role === 'owner',
      avatarUrl: row.avatar_url || null,
    } : null;
  }
  const rows = unwrap(rpcResult) || [];
  const row = rows[0];
  return row ? {
    ...row,
    permissions: row.permissions || [],
    isOwner: row.is_owner,
    avatarUrl: row.avatar_url || null,
  } : null;
}

export async function updateMyClinicProfile({ displayName, avatarUrl }) {
  const client = requireClient();
  const rows = unwrap(await client.rpc('update_my_clinic_profile', {
    p_display_name: displayName,
    p_avatar_url: avatarUrl ?? null,
  })) || [];
  const row = rows[0];
  return row ? {
    ...row,
    permissions: row.permissions || [],
    isOwner: row.is_owner,
    avatarUrl: row.avatar_url || null,
  } : null;
}

export async function uploadUserAvatar(userId, file) {
  const client = requireClient();
  const extension = file.name.split('.').pop() || 'png';
  const path = `${userId}/${Date.now()}.${extension}`;
  const { error } = await client.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw new Error(error.message || 'Falha ao enviar foto de perfil.');
  const { data } = client.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function createClinicOrganization({ clinicName, professionalName = '', crn = '' }) {
  const client = requireClient();
  const orgId = unwrap(await client.rpc('create_clinic_organization', {
    p_clinic_name: clinicName,
    p_professional_name: professionalName,
    p_crn: crn,
  }));
  return orgId;
}


