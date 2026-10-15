# Modelos compartilhados de documentos

Os modelos reutilizáveis de anamnese e contrato são persistidos na tabela `public.document_templates`. Cada registro pertence a uma `organization_id`, portanto fica disponível em qualquer computador depois que a pessoa entra na mesma clínica.

## Estrutura

- `template_type`: `anamnese` ou `contrato`;
- `name`: nome exibido no seletor;
- `content`: JSONB; anamneses usam `{ "text": "..." }` e contratos usam `{ "pages": [...] }`;
- `source_key`: identificador usado somente para tornar idempotente a migração de modelos antigos do navegador;
- `created_by`, `created_at` e `updated_at`: autoria e auditoria básica.

O acesso exige sessão autenticada e é protegido por RLS. A permissão é verificada no módulo `anamnese` ou `contratos`, conforme o tipo do modelo. O papel `anon` não possui acesso à tabela.

## Migração do navegador

No primeiro carregamento de cada módulo, os modelos encontrados nas chaves legadas `nutrisa_anamnese_templates` e `nutrisa_contratos_templates` são enviados ao Supabase. A chave local só é removida depois de uma gravação bem-sucedida. O `source_key` evita duplicidade se o envio for repetido.

O rascunho corrente da anamnese continua local (`nutrisa_anamnese_draft`), pois ele não é um modelo salvo.

## Código relacionado

- `app/src/shared/services/documentTemplates.js`
- `app/src/features/anamnese/hooks/useAnamnese.js`
- `app/src/features/contratos/hooks/useContratos.js`
- migração `create_document_templates`
