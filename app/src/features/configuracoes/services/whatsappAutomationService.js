import { getDefaultWhatsAppInstanceName } from '../defaultProfile.js';
import { saveClinicProfile } from './clinicProfileService.js';
import { WHATSAPP_SEND_WEBHOOK_URL } from '../../../config/env.js';

/**
 * Endpoint padrão para gestão de instâncias e QR Code via n8n/Evolution API.
 * Pode ser configurado via variável de ambiente ou perfil da clínica.
 */
export const DEFAULT_QRCODE_WEBHOOK_URL =
  'https://n8n.srv1277139.hstgr.cloud/webhook/nutrisa-whatsapp-qrcode';

/**
 * Consulta o status da conexão do WhatsApp da clínica ativa.
 */
export async function getWhatsAppConnectionStatus(organizationId, profile) {
  const instanceName = profile?.whatsappInstanceName?.trim() || getDefaultWhatsAppInstanceName(organizationId);

  // Sem organização não há instância para consultar
  if (!instanceName) {
    return {
      connected: false,
      status: 'close',
      instanceName: '',
      phone: '',
      isDraIsabela: false,
    };
  }

  // Consulta status real na VPS/n8n
  try {
    const res = await fetch(DEFAULT_QRCODE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'status',
        organization_id: organizationId,
        instance_name: instanceName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const isConnected = Boolean(data?.status === 'open' || data?.connected === true);
      return {
        connected: isConnected,
        status: data?.status || (isConnected ? 'open' : 'close'),
        instanceName,
        phone: data?.phone || profile?.whatsappPhone || '',
        isDraIsabela: instanceName === 'IsaNutri',
      };
    }
  } catch (err) {
    console.warn('Erro ao consultar status do WhatsApp na VPS:', err);
  }

  return {
    connected: false,
    status: 'close',
    instanceName,
    phone: profile?.whatsappPhone || '',
    isDraIsabela: instanceName === 'IsaNutri',
  };
}

/**
 * Solicita a geração de um novo QR Code para pareamento com a Evolution API.
 */
export async function requestWhatsAppQrCode({
  organizationId,
  clinicName,
  instanceName,
  webhookUrl = DEFAULT_QRCODE_WEBHOOK_URL,
  fetchImpl = fetch,
}) {
  const targetInstance = instanceName?.trim() || getDefaultWhatsAppInstanceName(organizationId) || 'consultorio';
  const targetUrl = webhookUrl || DEFAULT_QRCODE_WEBHOOK_URL;

  try {
    const response = await fetchImpl(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_or_connect',
        organization_id: organizationId,
        clinic_name: clinicName || 'Consultório',
        instance_name: targetInstance,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const base64 = data.base64 || data.qrcode?.base64 || null;
      const connected = data.connected || data.status === 'open';

      return {
        success: true,
        base64,
        pairingCode: data.pairingCode || data.code || null,
        instanceName: data.instanceName || targetInstance,
        status: data.status || (connected ? 'open' : (base64 ? 'qrcode_ready' : 'connecting')),
        connected,
      };
    }
  } catch (err) {
    console.warn('Erro ao chamar webhook de QR Code do n8n:', err);
  }

  return {
    success: false,
    error: true,
    message: 'Não foi possível conectar ao servidor WhatsApp. Verifique sua VPS.',
    instanceName: targetInstance,
  };
}

/**
 * Desconecta a instância do WhatsApp e atualiza o perfil no Supabase.
 */
export async function disconnectWhatsAppInstance({
  organizationId,
  currentProfile,
  userId,
  webhookUrl = DEFAULT_QRCODE_WEBHOOK_URL,
  fetchImpl = fetch,
}) {
  const targetUrl = webhookUrl || DEFAULT_QRCODE_WEBHOOK_URL;
  const instanceName = currentProfile?.whatsappInstanceName || getDefaultWhatsAppInstanceName(organizationId);

  try {
    await fetchImpl(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'logout',
        organization_id: organizationId,
        instance_name: instanceName,
      }),
    });
  } catch (err) {
    console.warn('Falha na requisição de logout na VPS:', err);
  }

  // Atualiza perfil no Supabase zerando o telefone conectado
  const updatedProfile = {
    ...currentProfile,
    whatsappPhone: '',
  };

  if (organizationId) {
    await saveClinicProfile(organizationId, updatedProfile, userId);
  }

  return updatedProfile;
}
