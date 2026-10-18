# Referência de Domínio: Perfil Profissional da Clínica

Este documento descreve o funcionamento, persistência e governança multi-tenant dos dados de perfil profissional e identidade visual da clínica na NutrIsa.

---

## 🎯 Objetivo

Garantir que as informações profissionais da nutricionista responsável (Dra. Isabela Muñoz) e do consultório estejam salvas no **Supabase**, isoladas por organização (`organization_id`), de modo que **qualquer membro autorizado da equipe** (secretária, assistente ou outros profissionais) visualize e utilize automaticamente os mesmos dados em documentos, laudos, contratos e cabeçalhos.

---

## 🗄️ Estrutura do Banco de Dados (`public.clinic_profiles`)

A tabela é criada via migration `20261017120000_create_clinic_profile.sql` e estendida via `20261017150000_clinic_whatsapp_settings.sql`.

```sql
create table if not exists public.clinic_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  name text not null default '',
  title text not null default '',
  crn text not null default '',
  phone text not null default '',
  email text not null default '',
  clinic text not null default '',
  address text not null default '',
  instagram text not null default '',
  logo_url text,
  signature_url text,
  marketing_photo_url text,
  whatsapp_instance_name text,
  whatsapp_webhook_url text,
  whatsapp_phone text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Segurança e Row Level Security (RLS)
- **Leitura (`SELECT`)**: permitida para todos os membros autenticados pertencentes à organização (`private.is_organization_member(organization_id)`).
- **Escrita (`INSERT` / `UPDATE`)**: permitida para membros da organização.

---

## 🔒 Governança Multi-Organização e Proteção de Dados (Multi-Clínicas SaaS)

Para viabilizar a expansão e venda da NutrIsa para outros consultórios e nutricionistas, os dados pessoais e modelos da Dra. Isabela Muñoz estão **estritamente isolados**:

1. **Constante Oficial da Organização**:
   - `DRA_ISABELA_ORG_ID = 'd116690a-ae43-4e33-88d0-cd1d45a49991'` (NutrIsa / Dra. Isabela).
2. **Separação de Perfis Default**:
   - `DRA_ISABELA_PROFILE`: 100% dos dados reais dela (nome "Dra. Isabela Muñoz Mendonça", CRN-3 / 58.492, contatos, Instagram, clínica e endereço em Campinas). Instância WhatsApp configurada como `IsaNutri`. Aplicado **exclusivamente** para a organização dela.
   - `EMPTY_CLINIC_PROFILE`: objeto limpo/neutro para qualquer nova organização ou nutricionista contratante da plataforma (campos em branco e clínica genérica "Consultório de Nutrição"). Instância WhatsApp dinâmica baseada em `org_<organizationId>` ou customizada.
3. **Bloqueio de Vazamento de Identidade**:
   - **Contratos e Documentos**: novas clínicas iniciam com placeholders neutros (`___________________________`), nunca preenchendo automaticamente o nome, CRN ou telefone da Dra. Isabela.
   - **Assinatura Digital**: a imagem de assinatura da Dra. Isabela só é exibida na organização dela. Outros consultórios exibem linha manual para assinatura física ou a assinatura enviada no upload próprio.
   - **Estúdio de Marketing**: a foto `dra_isabela.png`, o @ do Instagram e a credencial ACSM não aparecem na galeria nem nos prompts de IA de outras organizações. Cada clínica usa sua própria foto ou avatar neutro.
   - **WhatsApp & Evolution API**: cada envio injeta `instance_name` e `organization_id`. Mensagens de outras clínicas jamais são disparadas pelo número da Dra. Isabela (`IsaNutri`), sendo roteadas para a instância correspondente cadastrada no perfil da clínica na VPS.

---

## 💻 Frontend e Camada de Serviços

### Arquivos Principais:
1. **`app/src/features/configuracoes/defaultProfile.js`**:
   - Centraliza `DRA_ISABELA_ORG_ID`, `DRA_ISABELA_PROFILE`, `EMPTY_CLINIC_PROFILE`, `isDraIsabelaOrganization(id)`, `isDraIsabelaProfile(profile)` e `getClinicProfileFallback(orgId)`.
2. **`app/src/features/configuracoes/services/clinicProfileService.js`**:
   - `fetchClinicProfile(organizationId)`: busca o perfil no Supabase; se não existir, inicializa com seed da Dra. Isabela **apenas se for a organização dela**; para outras organizações, inicializa limpo (`EMPTY_CLINIC_PROFILE`).
   - `saveClinicProfile(organizationId, profile, userId)`: grava via `upsert` na tabela `clinic_profiles` e sincroniza o `localStorage`.
   - `normalizeClinicProfile(data, organizationId)`: normaliza campos nulos respeitando o fallback da organização ativa (incluindo `whatsappInstanceName`, `whatsappWebhookUrl`, `whatsappPhone`).
3. **`app/src/features/configuracoes/useAppSettings.js`**:
   - Reage à alteração de `organizationId` obtida do contexto `useAuth()` e inicializa com fallback restrito por organização.
4. **`app/src/features/configuracoes/ProfileSettings.jsx`**:
   - Modal de dados cadastrais da clínica (identificação, contatos, endereço, consultório, uploads de logotipo e assinatura digital).
5. **`app/src/features/configuracoes/AiSettings.jsx` (Automações & IA)**:
   - Centraliza os Modelos de IA e a conexão do WhatsApp com a Evolution API (geração de QR Code em tela, status da instância e desconexão).
6. **`app/src/features/configuracoes/services/whatsappAutomationService.js`**:
   - Gerencia status de conexão, solicitação de QR Code e logout de instâncias via n8n.
7. **`app/src/features/atendimento/services/whatsappSender.js`**:
   - Resolve dinamicamente a `instance_name` (`IsaNutri` para Dra. Isabela, customizada ou `org_<organizationId>` para terceiros) e o webhook n8n de envio.


