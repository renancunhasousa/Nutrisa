# Identidade Visual, Logotipo e Assinatura Digital da Clínica

Este documento descreve como a plataforma NutrIsa gerencia dinamicamente o logotipo do consultório e a assinatura digital da nutricionista responsável para todos os documentos, laudos e impressões geradas pelo sistema.

## 1. Banco de Dados e Storage

A tabela `clinic_profiles` isolada por organização no Supabase contém:
- `logo_url`: URL pública do logotipo da clínica (armazenado no bucket público `avatars` sob `clinic-assets/<org_id>/logo_<timestamp>.<ext>`).
- `signature_url`: URL pública da assinatura digital ou carimbo profissional (armazenado sob `clinic-assets/<org_id>/signature_<timestamp>.<ext>`).

### Estrutura da Tabela `clinic_profiles`
| Coluna | Tipo | Descrição |
|---|---|---|
| `organization_id` | `uuid` (PK) | Chave estrangeira para `organizations(id)`. |
| `name` | `text` | Nome completo do(a) nutricionista responsável. |
| `title` | `text` | Título ou especialidade (ex: Nutricionista Clínica e Esportiva). |
| `crn` | `text` | Registro profissional (ex: CRN-3 / 58.492). |
| `phone` | `text` | Telefone / WhatsApp do consultório. |
| `email` | `text` | E-mail profissional. |
| `clinic` | `text` | Nome da clínica ou consultório. |
| `address` | `text` | Endereço completo para rodapés de laudos. |
| `instagram` | `text` | Instagram profissional. |
| `logo_url` | `text` | Imagem do logotipo do consultório. |
| `signature_url` | `text` | Imagem da assinatura digital (PNG transparente). |
| `marketing_photo_url` | `text` | Foto profissional da nutricionista para o Estúdio de Marketing e redes sociais. |

## 2. Onde as Imagens São Usadas

1. **Laudos de Avaliação Física & Composição Corporal**:
   - Cabeçalho: [ResumoPage.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/avaliacao/report/ResumoPage.jsx), [ComposicaoPage.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/avaliacao/report/ComposicaoPage.jsx), [EvolucaoPage.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/avaliacao/report/EvolucaoPage.jsx), [OrientacoesPage.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/avaliacao/report/OrientacoesPage.jsx) usam `nutritionist.logoUrl || logoPdf`.
   - Rodapé: exibe `nutritionist.signatureUrl` digitalmente ou linha pontilhada de assinatura manual se a profissional ainda não tiver cadastrado imagem.
2. **Plano Alimentar (Dietas)**:
   - [DietReport.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/dietas/report/DietReport.jsx) consome `nut.logoUrl` e `nut.signatureUrl`.
3. **Contratos e Termos de Adesão**:
   - [ContratoPrintLayout.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/contratos/components/ContratoPrintLayout.jsx) e [PublicSignaturePage.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/contratos/PublicSignaturePage.jsx) renderizam no cabeçalho e na área de assinatura da contratada.
4. **Relatório Executivo de Atendimento WhatsApp**:
   - [WhatsAppPdfReport.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/atendimento/report/WhatsAppPdfReport.jsx) utiliza a marca e assinatura do consultório.
5. **Estúdio Criativo de Marketing & Carrossel IA**:
   - [PostCanvas.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/marketing/components/PostCanvas.jsx) e [PostDesignConfig.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/marketing/components/PostDesignConfig.jsx) utilizam `marketingPhotoUrl` com fallback automático para a foto oficial da Dra. Isabela Muñoz (`dra_isabela.png`). Os modelos, cores e formatos originais são 100% preservados, e o prompt adapta a assinatura e hashtags para a nutricionista ativa.
6. **Componentes Compartilhados**:
   - [ReportHeader.jsx](file:///e:/Antigravity/NutrIsa/app/src/shared/report/ReportHeader.jsx) e [ReportFooter.jsx](file:///e:/Antigravity/NutrIsa/app/src/shared/report/ReportFooter.jsx).

## 3. Gestão na Interface

No modal de **Perfil Profissional** ([ProfileSettings.jsx](file:///e:/Antigravity/NutrIsa/app/src/features/configuracoes/ProfileSettings.jsx)), a seção *Identidade Visual & Assinatura para Documentos* disponibiliza 3 cards integrados:
- Upload e pré-visualização de **Logotipo do Consultório**.
- Upload e pré-visualização de **Assinatura Digital / Carimbo** (PNG transparente).
- Upload e pré-visualização de **Foto Oficial (Marketing)** (com fallback oficial da Dra. Isabela Muñoz).
- Botões de exclusão/restauração para retornar aos padrões do sistema a qualquer momento com sincronização instantânea no Supabase e `localStorage`.
