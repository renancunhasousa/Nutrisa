# Modelos compartilhados de documentos

Os modelos reutilizáveis de anamnese e contrato são persistidos na tabela `public.document_templates`. Cada registro pertence a uma `organization_id`, portanto fica disponível em qualquer computador depois que a pessoa entra na mesma clínica.

## Estrutura

- `template_type`: `anamnese` ou `contrato`;
- `name`: nome exibido no seletor;
- `content`: JSONB; anamneses usam `{ "text": "..." }` e contratos usam `{ "pages": [...] }`;
- `source_key`: identificador usado somente para tornar idempotente a migração de modelos antigos do navegador;
- `created_by`, `created_at` e `updated_at`: autoria e auditoria básica.

O acesso exige sessão autenticada e é protegido por RLS. A permissão é verificada no módulo `anamnese` ou `contratos`, conforme o tipo do modelo. O papel `anon` não possui acesso à tabela.

Modelos selecionados podem ser excluídos nos dois módulos. A interface pede confirmação, remove o registro definitivamente do Supabase dentro do escopo da organização e limpa a seleção atual após o sucesso.

## Migração do navegador

No primeiro carregamento de cada módulo, os modelos encontrados nas chaves legadas `nutrisa_anamnese_templates` e `nutrisa_contratos_templates` são enviados ao Supabase. A chave local só é removida depois de uma gravação bem-sucedida. O `source_key` evita duplicidade se o envio for repetido.

Tanto a Anamnese quanto os Contratos persistem localmente o identificador do último modelo selecionado (`nutrisa_last_anamnese_template_id` e `nutrisa_last_contratos_template_id`), restaurando automaticamente o modelo escolhido pela nutricionista ao reabrir cada módulo.

## Editor de Texto Rico em Contratos e Anamnese

Tanto a edição de modelos de contratos (`ContratosPage.jsx`) quanto a aba de **Estrutura Modelo** da Anamnese (`AnamnesePage.jsx`) utilizam barras de ferramentas de formatação rica (`ContratoRichTextToolbar.jsx` e `AnamneseRichTextToolbar.jsx`) com a mesma experiência:
- **Estilo de bloco**: Texto normal (`<p>`), Título da Seção/Cláusula (`<h2>`), Subtítulo (`<h3>`), Citação / Destaque (`<blockquote>`).
- **Formatação de texto**: Negrito (`Ctrl+B`), Itálico (`Ctrl+I`), Sublinhado (`Ctrl+U`).
- **Listas**: Lista com marcadores (*bullets*) e lista numerada ordenada.
- **Alinhamento**: Alinhar à esquerda, centralizar, alinhar à direita e justificar texto.
- **Histórico**: Desfazer (`undo`), Refazer (`redo`) e Limpar formatação (`removeFormat`).
- **Contador em tempo real**: Contagem de caracteres e campos dinâmicos inseridos no rodapé do editor.
- **Campos Dinâmicos (Tags)**:
  - **No Contrato**: A barra de ferramentas conta com o botão no mesmo estilo visual **`⚡ Variável`** com lista suspensa dos dados base preenchidos na Etapa 1 (`{{paciente}}`, `{{plano}}`, `{{valor}}`, `{{formaPagamento}}`, `{{data}}`, `{{dataConsulta}}`, `{{horaConsulta}}`, `{{dataHoraConsulta}}`, `{{consultas}}`). Suporta substituição de texto selecionado no editor pela pílula verde arredondada (`rounded-full`) ou inserção direta no cursor. A etapa 2 (Modelos) adota a mesma largura total ampla da seção 2 da Anamnese, com painel lateral direito dedicado listando as variáveis presentes.
  - **Na Anamnese**: A barra de ferramentas conta com o botão compacto **`⚡ Variável`**. A nutricionista pode escrever qualquer tag como `{{teste}}` ou `SINTOMAS`, selecionar o texto e clicar no botão para transformá-lo imediatamente em uma pílula verde arredondada (`rounded-full`) com o emoji de raio. Se clicado sem seleção ativa, abre um prompt para digitar o nome da variável. O painel lateral direito detecta e lista automaticamente todas as variáveis presentes para a IA preencher.

As variáveis são substituídas dinamicamente pelos dados reais e notas da consulta tanto na geração de IA do prontuário quanto no fechamento e assinatura de contratos.

## Código relacionado

- `app/src/shared/services/documentTemplates.js`
- `app/src/features/anamnese/hooks/useAnamnese.js`
- `app/src/features/anamnese/domain/variables.js`
- `app/src/features/anamnese/domain/formatting.js`
- `app/src/features/anamnese/components/AnamneseRichTextToolbar.jsx`
- `app/src/features/contratos/hooks/useContratos.js`
- `app/src/features/contratos/domain/contractVariables.js`
- `app/src/features/contratos/components/ContratoRichTextToolbar.jsx`
- `app/src/features/contratos/components/ContratoPrintLayout.jsx`
- migração `create_document_templates`
