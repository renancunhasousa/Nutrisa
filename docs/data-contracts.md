# Dados e persistência

## Conversas

A tabela atual é `log_conversas`. A consulta ordena por `data_envio` e `id_mensagem` (com fallback para `data_envio`), com paginação por offset. Não foram alteradas tabelas ou políticas do Supabase.

`normalizeConversation` converte aliases em:

- `nome_paciente`, `telefone_paciente`, `mensagem_texto`, `conteudo_mensagem`;
- `data_envio`, `categoria`, `respondida` booleano e `tempo_espera_minutos`.

Tela e CSV usam a mesma normalização. CSV protege valores que poderiam ser interpretados como fórmulas. Consultas com limite explícito, como os alertas recentes, continuam limitadas; o dashboard busca o histórico paginado.

## Avaliação

A entrada exige paciente com nome e uma lista não vazia de métricas com chaves únicas. Valores inválidos falham antes da renderização. Dados ausentes permanecem ausentes: não são preenchidos com medições de demonstração.

O estado de avaliação existe em memória. Trocar abas mantém o estado; recarregar a página o descarta. Perfil e preferência de modelo usam armazenamento local. O demo é identificado como demonstração e não deve ser usado como laudo real.

## Anamnese

Modelos e rascunho de template são locais ao navegador. Questionário, notas e resultado permanecem em memória enquanto a aplicação está aberta. Não há prontuário compartilhado persistido por esse módulo.

## Agenda

O escopo Google é somente leitura. Ajustes de evento são salvos sob `nutrisa_agenda_edits:<calendarId>` e reaplicados após sincronização. Bloqueios e link Meet continuam locais. Essas informações não são compartilhadas com outros navegadores e não bloqueiam horários no Google.

As chaves antigas `nutriisa_*` da agenda foram preservadas para manter a compatibilidade com dados já salvos. Uma futura migração de nomes deve mover os valores existentes explicitamente.

## Referências

Os PDFs existentes de `model/` foram preservados. Não foram copiados para testes nem transmitidos a provedores durante a reorganização. Use documentos sintéticos ou anonimizados em novos testes versionados.
