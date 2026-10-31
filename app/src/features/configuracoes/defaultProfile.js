export const DRA_ISABELA_ORG_ID = 'd116690a-ae43-4e33-88d0-cd1d45a49991';

export const DRA_ISABELA_PROFILE = {
  name: "Dra. Isabela Muñoz Mendonça",
  title: "Nutricionista Clínica e Esportiva",
  crn: "CRN-3 / 58.492",
  phone: "(19) 99876-5432",
  email: "isabelamunoznutri@hotmail.com",
  clinic: "Clínica Integrada de Saúde & Performance",
  address: "Rua Barão de Jaguara, 655 - Centro, Campinas - SP",
  instagram: "@nutri.isabelamunoz",
  logoUrl: "",
  signatureUrl: "",
  marketingPhotoUrl: "",
  whatsappInstanceName: "IsaNutri",
  whatsappWebhookUrl: "",
  whatsappPhone: "(19) 99876-5432"
};

/**
 * Perfil neutro/limpo para qualquer outra organização no SaaS.
 * Não contém dados pessoais nem foto da Dra. Isabela Muñoz.
 */
export const EMPTY_CLINIC_PROFILE = {
  name: "",
  title: "Nutricionista",
  crn: "",
  phone: "",
  email: "",
  clinic: "Consultório de Nutrição",
  address: "",
  instagram: "",
  logoUrl: "",
  signatureUrl: "",
  marketingPhotoUrl: "",
  whatsappInstanceName: "",
  whatsappWebhookUrl: "",
  whatsappPhone: ""
};

// Mantido para compatibilidade com importações legadas
export const DEFAULT_NUTRITIONIST = DRA_ISABELA_PROFILE;

export function isDraIsabelaOrganization(organizationId) {
  if (!organizationId) return false;
  return organizationId === DRA_ISABELA_ORG_ID;
}

// Organização criada antes da regra org_<uuid>; a instância na Evolution API já existe com este nome
const LEGACY_WHATSAPP_INSTANCE_ORG_ID = '0bddfb3d-7129-48a3-aa23-522de407cfdc';

/**
 * Nome padrão da instância WhatsApp de uma organização, usado quando o perfil não tem um nome salvo.
 * Única fonte de verdade para envio, status, QR Code e logout.
 */
export function getDefaultWhatsAppInstanceName(organizationId) {
  if (!organizationId) return '';
  if (isDraIsabelaOrganization(organizationId)) return 'IsaNutri';
  if (organizationId === LEGACY_WHATSAPP_INSTANCE_ORG_ID) return 'org_0bddfb3d';
  return `org_${organizationId}`;
}

export function isDraIsabelaProfile(profile) {
  if (!profile) return false;
  if (profile.organization_id === DRA_ISABELA_ORG_ID) return true;
  return /isabela\s+muñoz/i.test(profile.name || '');
}

export function getClinicProfileFallback(organizationId = null) {
  if (isDraIsabelaOrganization(organizationId)) {
    return { ...DRA_ISABELA_PROFILE };
  }
  return { ...EMPTY_CLINIC_PROFILE };
}
