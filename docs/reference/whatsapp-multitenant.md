# Integração WhatsApp Multi-Tenant (Evolution API + n8n)

## Visão Geral

A plataforma NutrIsa suporta múltiplos consultórios e organizações de forma isolada, permitindo que cada clínica conecte seu próprio número de WhatsApp via Evolution API.

## Arquitetura de Instâncias

1. **Organização Oficial (Dra. Isabela Muñoz):**
   - Instância padrão: `IsaNutri`
   - Identificador no banco (`clinic_profiles.whatsapp_instance_name`): `IsaNutri`
2. **Novas Organizações (Multi-Tenant):**
   - Identificador gerado dinamicamente: `org_<organization_id_prefix>` (ex: `org_0bddfb3d`)
   - Armazenamento: `clinic_profiles.whatsapp_instance_name` e `whatsapp_phone` no Supabase.

## Fluxos no n8n

- **Conexão e QR Code:**
  - Webhook: `https://n8n.srv1277139.hstgr.cloud/webhook/nutrisa-whatsapp-qrcode`
  - Ações suportadas:
    - `create_or_connect`: Cria a instância na Evolution API via `POST /instance/create` (caso não exista) e retorna o QR Code em base64 (`qrcode_ready`).
    - `status`: Verifica se a instância já foi pareada no celular (`open` ou `connecting`).
    - `logout`: Desconecta a instância via `DELETE /instance/logout/:instance`.
  - Autenticação com a Evolution API: Global API Key via header `apikey`.

- **Envio de Mensagens:**
  - Webhook: `https://n8n.srv1277139.hstgr.cloud/webhook/nutrisa-whatsapp-send`
  - Envia mensagens pela instância da organização correspondente (`sendText/:instance_name`).

- **Monitoramento e Recebimento de Mensagens:**
  - Webhook: `https://n8n.srv1277139.hstgr.cloud/webhook/n8n_Isanutri`
  - Cada instância na Evolution API possui um webhook configurado apontando para esse endpoint com os eventos `MESSAGES_UPSERT`, `MESSAGES_UPDATE` e `CONNECTION_UPDATE`.
  - O fluxo identifica a instância receptora (`body.instance`) e vincula as mensagens e tarefas no Supabase (`log_conversas` e `nutrisa_tasks`) com o `organization_id` correspondente.
  - Ao criar qualquer nova instância no fluxo de QR Code, o webhook é registrado automaticamente na Evolution API.
