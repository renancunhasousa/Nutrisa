import { supabase } from '../../../shared/services/supabase.js';
import { KEY_NUTRITIONIST } from '../../../config/storageKeys.js';
import {
  DRA_ISABELA_PROFILE,
  EMPTY_CLINIC_PROFILE,
  isDraIsabelaOrganization,
  getClinicProfileFallback
} from '../defaultProfile.js';

export function normalizeClinicProfile(data, organizationId = null) {
  const isDra = isDraIsabelaOrganization(organizationId || data?.organization_id);
  const fallback = isDra ? DRA_ISABELA_PROFILE : EMPTY_CLINIC_PROFILE;

  if (!data) return { ...fallback };

  return {
    name: data.name !== undefined && data.name !== null ? data.name : fallback.name,
    title: data.title !== undefined && data.title !== null ? data.title : fallback.title,
    crn: data.crn !== undefined && data.crn !== null ? data.crn : fallback.crn,
    phone: data.phone !== undefined && data.phone !== null ? data.phone : fallback.phone,
    email: data.email !== undefined && data.email !== null ? data.email : fallback.email,
    clinic: data.clinic !== undefined && data.clinic !== null ? data.clinic : fallback.clinic,
    address: data.address !== undefined && data.address !== null ? data.address : fallback.address,
    instagram: data.instagram !== undefined && data.instagram !== null ? data.instagram : fallback.instagram,
    logoUrl: data.logo_url ?? data.logoUrl ?? fallback.logoUrl ?? '',
    signatureUrl: data.signature_url ?? data.signatureUrl ?? fallback.signatureUrl ?? '',
    marketingPhotoUrl: data.marketing_photo_url ?? data.marketingPhotoUrl ?? fallback.marketingPhotoUrl ?? '',
    whatsappInstanceName: data.whatsapp_instance_name ?? data.whatsappInstanceName ?? fallback.whatsappInstanceName ?? '',
    whatsappWebhookUrl: data.whatsapp_webhook_url ?? data.whatsappWebhookUrl ?? fallback.whatsappWebhookUrl ?? '',
    whatsappPhone: data.whatsapp_phone ?? data.whatsappPhone ?? fallback.whatsappPhone ?? '',
  };
}

export function getActiveNutritionist(organizationId = null) {
  try {
    const raw = localStorage.getItem('nutrisa_nutritionist_profile') || localStorage.getItem(KEY_NUTRITIONIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Cache de outra organização não pode vazar para a organização logada
      if (organizationId && parsed.organization_id && parsed.organization_id !== organizationId) {
        return getClinicProfileFallback(organizationId);
      }
      return normalizeClinicProfile(parsed, organizationId || parsed.organization_id);
    }
  } catch {}
  return getClinicProfileFallback(organizationId);
}

// Nome da proprietária cadastrado no perfil da clínica (usado em rótulos e textos da plataforma)
export function getOwnerLabel(organizationId = null) {
  return (getActiveNutritionist(organizationId).name || '').trim() || 'Profissional';
}

/**
 * Formata o nome do médico/nutricionista no formato curto: "Dra. <PrimeiroNome>"
 * Exemplo: "Dra. Isabela Muñoz Mendonça" -> "Dra. Isabela"
 * Exemplo: "Isabela Muñoz" -> "Dra. Isabela"
 * Exemplo: "Dr. Carlos Eduardo" -> "Dr. Carlos"
 */
export function formatDoctorShortName(fullName, fallback = 'Dra. Isabela') {
  if (!fullName || typeof fullName !== 'string') return fallback;
  const trimmed = fullName.trim();
  if (!trimmed || trimmed.toLowerCase() === 'profissional') return fallback;

  // Se explicitamente começar com "Dr." ou "Dr " (mas não "Dra"), mantém o gênero masculino "Dr."
  const isMaleDoctor = /^dr\.?\s+/i.test(trimmed) && !/^dra\.?\s+/i.test(trimmed);
  const prefix = isMaleDoctor ? 'Dr.' : 'Dra.';

  // Remove qualquer prefixo existente (dra., dr., nutri., etc.)
  const cleanName = trimmed.replace(/^(dra?\.?|nutri\.?)\s*/i, '').trim();
  const firstName = cleanName.split(/\s+/)[0] || '';

  if (!firstName) return fallback;
  return `${prefix} ${firstName}`;
}

// Retorna "Dra. <PrimeiroNome>" para interfaces compactas onde o nome completo invade elementos
export function getOwnerShortLabel(organizationId = null) {
  const profile = getActiveNutritionist(organizationId);
  return formatDoctorShortName(profile?.name);
}

export async function uploadClinicAsset(organizationId, file, type = 'logo') {
  if (!supabase) throw new Error('Cliente Supabase não inicializado.');
  if (!organizationId) throw new Error('Organização não identificada para upload.');
  const extension = file.name?.split('.').pop() || 'png';
  const path = `clinic-assets/${organizationId}/${type}_${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw new Error(error.message || `Falha ao enviar arquivo de ${type}.`);
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchClinicProfile(organizationId) {
  if (!supabase || !organizationId) {
    try {
      const saved = localStorage.getItem('nutrisa_nutritionist_profile') || localStorage.getItem(KEY_NUTRITIONIST);
      return saved ? normalizeClinicProfile(JSON.parse(saved), organizationId) : getClinicProfileFallback(organizationId);
    } catch {
      return getClinicProfileFallback(organizationId);
    }
  }

  const { data, error } = await supabase
    .from('clinic_profiles')
    .select('name, title, crn, phone, email, clinic, address, instagram, logo_url, signature_url, marketing_photo_url, whatsapp_instance_name, whatsapp_webhook_url, whatsapp_phone, updated_at')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar perfil da clínica no Supabase:', error);
    try {
      const saved = localStorage.getItem(KEY_NUTRITIONIST);
      return saved ? normalizeClinicProfile(JSON.parse(saved), organizationId) : getClinicProfileFallback(organizationId);
    } catch {
      return getClinicProfileFallback(organizationId);
    }
  }

  if (data) {
    const profile = normalizeClinicProfile(data, organizationId);
    try {
      const serialized = JSON.stringify({ ...profile, organization_id: organizationId });
      localStorage.setItem(KEY_NUTRITIONIST, serialized);
      localStorage.setItem('nutrisa_nutritionist_profile', serialized);
    } catch {
      // Ignora erro de cota ou indisponibilidade de localStorage
    }
    return profile;
  }

  // Se não existir registro no banco para esta organização:
  // Para a organização da Dra. Isabela, faz seed com os dados dela.
  // Para outras clínicas, inicializa limpo com EMPTY_CLINIC_PROFILE para não contaminar.
  const initialProfile = isDraIsabelaOrganization(organizationId)
    ? { ...DRA_ISABELA_PROFILE }
    : { ...EMPTY_CLINIC_PROFILE };

  await supabase
    .from('clinic_profiles')
    .insert({
      organization_id: organizationId,
      name: initialProfile.name,
      title: initialProfile.title,
      crn: initialProfile.crn,
      phone: initialProfile.phone,
      email: initialProfile.email,
      clinic: initialProfile.clinic,
      address: initialProfile.address,
      instagram: initialProfile.instagram,
      logo_url: initialProfile.logoUrl || null,
      signature_url: initialProfile.signatureUrl || null,
      marketing_photo_url: initialProfile.marketingPhotoUrl || null,
      whatsapp_instance_name: initialProfile.whatsappInstanceName || null,
      whatsapp_webhook_url: initialProfile.whatsappWebhookUrl || null,
      whatsapp_phone: initialProfile.whatsappPhone || null,
    })
    .catch((insertError) => {
      console.warn('Não foi possível fazer seed inicial do perfil:', insertError);
    });

  return initialProfile;
}

export async function saveClinicProfile(organizationId, profile, userId = null) {
  const normalized = normalizeClinicProfile(profile);

  // Mantém cópia local imediata
  try {
    const serialized = JSON.stringify({ ...normalized, organization_id: organizationId });
    localStorage.setItem(KEY_NUTRITIONIST, serialized);
    localStorage.setItem('nutrisa_nutritionist_profile', serialized);
  } catch {
    // Silencia erros locais
  }

  if (!supabase || !organizationId) {
    return normalized;
  }

  const payload = {
    organization_id: organizationId,
    name: normalized.name,
    title: normalized.title,
    crn: normalized.crn,
    phone: normalized.phone,
    email: normalized.email,
    clinic: normalized.clinic,
    address: normalized.address,
    instagram: normalized.instagram,
    logo_url: normalized.logoUrl || null,
    signature_url: normalized.signatureUrl || null,
    marketing_photo_url: normalized.marketingPhotoUrl || null,
    whatsapp_instance_name: normalized.whatsappInstanceName || null,
    whatsapp_webhook_url: normalized.whatsappWebhookUrl || null,
    whatsapp_phone: normalized.whatsappPhone || null,
    updated_at: new Date().toISOString(),
    ...(userId ? { updated_by: userId } : {}),
  };

  const { data, error } = await supabase
    .from('clinic_profiles')
    .upsert(payload, { onConflict: 'organization_id' })
    .select('name, title, crn, phone, email, clinic, address, instagram, logo_url, signature_url, marketing_photo_url, whatsapp_instance_name, whatsapp_webhook_url, whatsapp_phone, updated_at')
    .single();

  if (error) {
    console.error('Erro ao salvar perfil da clínica no Supabase:', error);
    throw new Error(error.message || 'Falha ao salvar perfil profissional no banco de dados.');
  }

  return normalizeClinicProfile(data);
}
