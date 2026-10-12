# NutrIsa

Plataforma React para avaliação corporal, anamnese, indicadores de atendimento e leitura da agenda.

## Executar

Requisito: Node.js 22.12+ ou 24 LTS e npm.

```sh
npm --prefix app ci
npm run dev
```

Abra o endereço exibido pelo Vite. O mesmo processo atende a interface, `/api/ai` e `/api/products`.
Os arquivos `app/.env` existentes continuam sendo lidos. Veja os exemplos de ambiente antes de configurar uma instalação nova.

```sh
npm test
npm run lint
npm run build
```

Os testes usam dados sintéticos e serviços simulados; não enviam documentos nem chamam provedores pagos.

## Onde editar

| Alteração | Diretório |
|---|---|
| Menu e estrutura das telas | `app/src/layout` |
| Autenticação clínica (Google, senha e link por e-mail) | `app/src/features/auth` |
| Gestão de equipe, papéis e permissões por módulo | `app/src/features/auth` |
| Cadastro de pacientes e contatos | `app/src/features/pacientes` |
| Relacionamento: radar de retornos, reativação e oportunidades | `app/src/features/crm` |
| Upload, seleção e validação dos exames | `app/src/features/avaliacao` |
| Páginas do laudo | `app/src/features/avaliacao/report` |
| Editor e geração de anamnese | `app/src/features/anamnese` |
| Conversas, filtros, gráficos e CSV | `app/src/features/atendimento` |
| Calendário e ajustes locais | `app/src/features/agenda` |
| Perfil e configuração da IA | `app/src/features/configuracoes` |
| Alertas do consultório | `app/src/features/notificacoes` |
| Demandas, to-do e follow-up | `app/src/features/tarefas` |
| Montagem de dietas e plano alimentar | `app/src/features/dietas` |
| Catálogo nutricional de alimentos, preparações, produtos e suplementos | `app/src/features/produtos` |
| Contratos e termos de adesão | `app/src/features/contratos` |
| Estúdio de posts e marketing para Instagram | `app/src/features/marketing` |
| Comunicação com a IA no servidor | `server/ai` e `api/ai.js` |
| Consulta de produtos por código de barras | `server/products` e `api/products.js` |
| Migrações e configuração do Supabase | `supabase` |
| Componentes e UI compartilhada | `app/src/shared/ui` |
| Estilos globais e impressão | `app/src/styles` |

## Documentação

- [Arquitetura](docs/architecture.md)
- [Contexto global e histórico clínico](docs/reference/patient-clinical-history.md)
- [Gestão de Equipe & Permissões](docs/reference/team-permissions.md): controle de papéis (Dra./Owner, Secretária, Administrativo), código de convite da clínica e liga/desliga de módulos por barra de atalhos.
- [Configuração e publicação](docs/deployment.md)
- [Contratos de dados e persistência](docs/data-contracts.md)
- [Roteiro de verificação](docs/testing.md)
- [Roadmap Estratégico](docs/roadmap.md) e [Checklist de Tarefas](docs/tasks.md): visão de produto, matriz de impacto e tarefas de implementação.
- [Plano de implementação CRM + Patient 360](docs/crm-patient360-implementation-plan.md): modelo de dados, telas, segurança, fluxos, migração e fases de execução.
- [Cadastro de Pacientes](docs/reference/patients-database.md): dados cadastrais, consentimentos, políticas RLS, cadastro assistido e lista de contatos do WhatsApp ainda não cadastrados.
- [Radar de Relacionamento](docs/reference/crm-radar.md): fila priorizada por SLA, tarefas vencidas, retorno, reativação e leads sem avanço.
- [Especificação do Criador de Dietas](docs/diet-plan-builder-spec.md): editor em etapas, alimentos, macros, substituições, IA e relatório PDF.
- [Montagem de Dietas & Tabela TACO](docs/reference/diet-plan-builder.md): regras de macronutrientes, medidas caseiras, base de alimentos e sincronização com Supabase.
- [Catálogo Nutricional — Alimentos e Produtos](docs/reference/product-catalog.md): cadastro unificado, base de cálculo, medidas caseiras, código de barras e liberação de itens verificados para dietas.
- [Central de Tarefas & Follow-up](docs/reference/tasks-module.md): demandas clínicas, sincronização da agenda com regras de prazo e follow-up no WhatsApp.
- [Atendimento & Metas de Bonificação](docs/reference/atendimento-metrics.md): métricas de SLA, teto de intervenção médica (<= 25%) e foco em agendamentos no relatório executivo.
- [Estúdio de Posts & IA (Instagram)](docs/reference/marketing-studio.md): gerador de publicações e carrosséis (1080×1350), 7 formatos clínicos, 3 paletas (marrom, tiffany, bege), pautas inteligentes (WhatsApp & Busca Web), exportação ZIP e legendas prontas com IA.
- [Provedores de IA & Cadeia de Fallback](docs/reference/ai-providers-fallback.md): resiliência automática entre Gemini (titular), OpenAI GPT-4o-mini (1º fallback) e DeepSeek Flash (2º fallback) com suporte a visão e formato JSON.

Os PDFs em `model/` são referências existentes e não são importados pela aplicação. O protótipo antigo foi preservado em `docs/reference/anamnese-prototype.jsx.txt` e não é executável nesta plataforma.

