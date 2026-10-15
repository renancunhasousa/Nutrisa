# Dados e persistência

## Pacientes

O contrato do cadastro central está versionado na migração `create_patient_database` e detalhado em [Base de Pacientes](reference/patients-database.md). O núcleo usa `organizations`, `organization_members`, `patients`, `patient_contacts` e `patient_audit_log`, com RLS por organização e sem acesso pelo papel `anon`.

A tabela `patients` legada é ampliada sem remoção de colunas ou registros. `name`/`gender` permanecem temporariamente sincronizados com `full_name`/`sex`. Consultas, anamneses, avaliações, planos alimentares, conversas, tarefas e contratos continuam em tabelas próprias. A migração `link_patient_workspace` fornece as chaves usadas pelos vínculos ativos do frontend.

O acesso pelo frontend exige uma sessão Supabase Auth. A chave pública identifica o projeto, mas não concede acesso aos cadastros protegidos. A seleção visual existe na rota `#pacientes`; somente um clique explícito em um atalho encaminha o paciente ao módulo escolhido.

## Conversas

A tabela atual é `log_conversas`. A consulta ordena por `data_envio` e `id_mensagem` (com fallback para `data_envio`), com paginação por offset. O painel atual é geral e não filtra conversas pelo cadastro de pacientes.

`normalizeConversation` converte aliases em:

- `nome_paciente`, `telefone_paciente`, `mensagem_texto`, `conteudo_mensagem`;
- `data_envio`, `categoria`, `respondida` booleano e `tempo_espera_minutos`.

Tela e CSV usam a mesma normalização. CSV protege valores que poderiam ser interpretados como fórmulas. Consultas com limite explícito, como os alertas recentes, continuam limitadas; o dashboard busca o histórico paginado.

## Avaliação

A entrada exige paciente com nome e uma lista não vazia de métricas com chaves únicas. Valores inválidos falham antes da renderização. Dados ausentes permanecem ausentes: não são preenchidos com medições de demonstração.

O estado de avaliação existe em memória durante a edição. Ao abrir o laudo final, uma avaliação iniciada pelo atalho do paciente é persistida em `physical_evaluations`. Perfil e preferência de modelo usam armazenamento local. O demo é identificado como demonstração e não deve ser usado como laudo real.

## Anamnese

Modelos salvos de anamnese e contrato pertencem à organização e ficam na tabela `document_templates`, com RLS e permissão pelo respectivo módulo. Assim, eles podem ser reutilizados em qualquer computador autenticado na mesma clínica. Modelos legados do `localStorage` são migrados automaticamente uma vez; somente o rascunho corrente da anamnese continua local ao navegador. Veja [Modelos compartilhados de documentos](reference/document-templates.md).

Quando iniciada pelo atalho do paciente, a geração salva questionário, notas, relatório, tradução e insights em `anamnese`.

## Agenda

O escopo Google é somente leitura. Ajustes de evento são salvos sob `nutrisa_agenda_edits:<calendarId>` e reaplicados após sincronização. Bloqueios e link Meet continuam locais. Essas informações não são compartilhadas com outros navegadores e não bloqueiam horários no Google.

As chaves antigas `nutriisa_*` da agenda foram preservadas para manter a compatibilidade com dados já salvos. Uma futura migração de nomes deve mover os valores existentes explicitamente.

## Vínculo clínico por paciente

Os atalhos da ficha encaminham temporariamente `patient_id`, nome e telefone apenas ao módulo escolhido. Dietas e contratos persistem esse identificador; avaliações e anamneses criam registros clínicos próprios ao concluir o fluxo. Conversas ainda sem associação são vinculadas pelo telefone normalizado quando o Atendimento é aberto pelo atalho. Abrir um módulo pelo menu principal não reutiliza uma seleção antiga.

## Referências

Os PDFs existentes de `model/` foram preservados. Não foram copiados para testes nem transmitidos a provedores durante a reorganização. Use documentos sintéticos ou anonimizados em novos testes versionados.
