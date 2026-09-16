# Arquitetura

## Fluxo principal

`main.jsx` monta `App.jsx`. O App controla navegação por hash e mantém as telas já visitadas montadas para preservar rascunhos durante a troca de abas. `AppLayout` compõe `Navbar`, `ProfileSettings` e `AiSettings`.

Cada funcionalidade está em `features/`. Componentes que atendem uma única funcionalidade permanecem dentro dela. `shared/` contém somente código utilizado por mais de um módulo.

### Avaliação

`useAvaliacao` coordena upload e seleção. `domain/assessment.js` valida os dados e resolve valores selecionados. `domain/comparative.js` prepara a evolução histórica. O prompt de extração está em `prompts/extract.js`.

`AvaliacaoContext` distribui o estado apenas dentro do módulo. `components/` contém as etapas de upload e seleção; `report/` contém o relatório e uma composição por página. Dados de demonstração são carregados somente por ação explícita. Falhas na extração mantêm a etapa de upload.

### Anamnese

`AnamnesePage` coordena editor, modelos e geração. `services/documents.js` lê TXT e PDFs com a dependência local PDF.js, carregada sob demanda. PDFs sem texto selecionável retornam uma orientação para o usuário; não há OCR local.

### Atendimento

`services/conversations.js` busca todas as páginas. `domain/conversations.js` normaliza aliases e prepara CSV. `domain/classification.js` concentra classificação por atendente e cortesia. A página prepara os indicadores e passa dados aos componentes e ao relatório.

### Agenda

`services/calendar.js` faz leitura paginada do Google Calendar. `domain/calendarMapper.js` centraliza categoria/status. Ajustes são sobreposições locais persistidas por ID de evento e agenda; não há gravação no Google. A consulta não troca silenciosamente para outra agenda em caso de falha de permissão.

### IA

O frontend chama somente `shared/services/aiClient.js` → `/api/ai`. O servidor valida modelo/conteúdo e usa `server/ai/service.js` para chamar Gemini e executar fallback. Configurações de modelo são fornecidas pelo servidor a todas as telas.

Os modelos padrão foram conferidos no [catálogo oficial Gemini](https://ai.google.dev/gemini-api/docs/models). `GEMINI_MODELS` permite ajustar a lista sem editar componentes.

## Convenções

- Componentes em PascalCase; hooks com prefixo `use`; funções de domínio sem React.
- Nenhuma chave de provedor de IA em código de navegador.
- Prompts pertencem à funcionalidade; transporte HTTP pertence a serviços.
- Validação e adaptação dos dados acontecem na entrada.
- Testes unitários em `tests/unit`; dados de teste devem ser sintéticos.
- Não editar `dist/`, `node_modules/` ou arquivos gerados de ferramentas.

Os estilos existentes foram preservados. Algumas páginas ainda podem ser divididas em componentes menores conforme evoluírem, especialmente o editor de anamnese e os cálculos do dashboard.
