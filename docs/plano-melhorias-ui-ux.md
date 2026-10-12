# Plano de Melhorias de Interface e UX — NutrIsa

**Status:** proposta para priorização  
**Data da análise:** 04/10/2026  
**Escopo observado:** Avaliação, Anamnese, Dietas, Atendimento, Agenda, Tarefas, Contratos e Marketing  
**Resoluções de referência:** desktop em 1440 × 1000 px e mobile em 390 × 844 px

## 1. Objetivo

Evoluir a NutrIsa de um conjunto consistente de ferramentas clínicas para uma experiência integrada de trabalho, centrada no paciente e confortável em qualquer tamanho de tela.

Este documento converte a análise visual da plataforma em:

- princípios de experiência;
- nova proposta de navegação;
- melhorias globais e por módulo;
- backlog priorizado;
- critérios de aceite;
- roteiro sugerido de implementação.

## 2. Diagnóstico executivo

### Pontos fortes atuais

- Identidade visual profissional e coerente com a marca.
- Paleta verde, tiffany, bege e dourado bem aplicada.
- Boa legibilidade e uso de espaço no desktop.
- Títulos de página claros e contextualizados.
- Padrões visuais relativamente consistentes entre os módulos.
- Bons estados vazios, indicadores e chamadas para ação.
- Fluxos divididos em etapas nas tarefas clínicas mais complexas.
- Tela de Tarefas especialmente clara para priorização operacional.

### Maiores oportunidades

1. Corrigir a experiência mobile, hoje afetada por cortes e overflow horizontal.
2. Simplificar a navegação entre oito módulos.
3. Reduzir a competição visual entre ações primárias e secundárias.
4. Aumentar textos pequenos e o contraste de informações auxiliares.
5. Criar uma página inicial operacional com o resumo do dia.
6. Manter o paciente selecionado como contexto entre os módulos.
7. Padronizar componentes, feedbacks e estados de salvamento.
8. Melhorar acessibilidade por teclado, leitores de tela e toque.

## 3. Princípios de experiência

### 3.1 Paciente no centro

O usuário não deve precisar localizar o mesmo paciente novamente ao alternar entre avaliação, anamnese, dieta, agenda, tarefas ou contratos.

### 3.2 Uma ação principal por contexto

Cada tela ou etapa deve deixar evidente qual é o próximo passo. Ações secundárias não devem competir visualmente com a ação principal.

### 3.3 Mobile como fluxo próprio

Telas densas, como Agenda, Dietas e Marketing, não devem apenas encolher. Elas precisam adotar modos de visualização próprios para telas pequenas.

### 3.4 Divulgação progressiva

Exibir primeiro o necessário para concluir a tarefa atual. Configurações avançadas, ações raras e detalhes devem aparecer sob demanda.

### 3.5 Estado sempre visível

O usuário deve saber se algo está vazio, carregando, salvo, com alterações pendentes, publicado ou com erro.

### 3.6 Acessibilidade como padrão

Contraste, foco, teclado, tamanho de toque e identificação de controles devem fazer parte dos componentes básicos.

## 4. Arquitetura de navegação proposta

### 4.1 Organização conceitual

```text
NutrIsa
├── Início — visão “Hoje”
├── Pacientes — busca e Patient 360
├── Clínica
│   ├── Avaliação
│   ├── Anamnese
│   └── Dietas
├── Operação
│   ├── Agenda
│   ├── Tarefas
│   └── Atendimento
└── Negócio
    ├── Contratos
    └── Marketing
```

### 4.2 Desktop

- Manter navegação superior, mas agrupar módulos por finalidade.
- Incluir busca global por paciente.
- Exibir o paciente ativo próximo à navegação.
- Disponibilizar ações globais em um botão “Criar”.
- Manter notificações, IA e perfil no canto direito.

### 4.3 Mobile

Destino planejado para a fase integrada (após a criação de Início e Pacientes):

1. Início;
2. Agenda;
3. Pacientes;
4. Tarefas;
5. Mais.

**Entrega P0 concluída em 04/10/2026:** enquanto as páginas Início e Pacientes ainda não existem, a barra mobile utiliza somente módulos funcionais: Avaliação, Dietas, Agenda, Tarefas e Mais. O menu Mais reúne Anamnese, Atendimento, Contratos, Marketing, IA e Perfil. Quando as páginas futuras forem implementadas, os dois primeiros destinos poderão ser substituídos sem refazer a estrutura responsiva.

O menu “Mais” reúne Avaliação, Anamnese, Dietas, Atendimento, Contratos, Marketing e Configurações.

Critérios:

- ícone e texto nos destinos principais;
- item ativo claramente identificado;
- área de toque mínima de 44 × 44 px;
- nenhum item essencial dependente de tooltip;
- navegação acessível por teclado e leitor de tela.

## 5. Página inicial “Hoje”

### Conteúdo recomendado

- próximas consultas;
- pacientes aguardando confirmação;
- tarefas vencidas e do dia;
- mensagens de WhatsApp aguardando resposta;
- dietas e laudos pendentes;
- contratos aguardando assinatura;
- retornos previstos;
- atividades acessadas recentemente.

### Ações rápidas

- Novo paciente;
- Nova avaliação;
- Nova dieta;
- Nova tarefa;
- Novo contrato;
- Abrir agenda.

### Resultado esperado

Ao entrar na plataforma, o usuário entende em poucos segundos o que precisa de atenção, sem percorrer vários módulos.

## 6. Contexto persistente do paciente

### Comportamento proposto

- Campo global “Buscar paciente”.
- Paciente selecionado permanece ativo ao trocar de módulo.
- Barra contextual apresenta nome, foto/iniciais, status do plano e próxima consulta.
- Ações dos módulos usam automaticamente o paciente ativo.
- Troca de paciente pede confirmação somente quando houver alterações não salvas.

### Evolução para Patient 360

- resumo cadastral;
- última e próxima consulta;
- evolução corporal;
- avaliações e laudos;
- anamnese;
- dieta atual e versões anteriores;
- conversas e follow-ups;
- tarefas;
- contratos e assinaturas.

## 7. Melhorias globais de interface

### 7.1 Hierarquia de ações

Usar quatro níveis consistentes:

| Nível | Uso | Exemplo |
|---|---|---|
| Primário | Próximo passo principal | Publicar dieta |
| Secundário | Alternativa frequente | Salvar rascunho |
| Terciário | Ação auxiliar | Duplicar |
| Perigoso | Remoção ou cancelamento | Excluir tarefa |

Regras:

- no máximo uma ação primária por bloco;
- ações raras devem ficar no menu `•••`;
- ações destrutivas devem ter rótulo e confirmação adequada;
- evitar duplicar a mesma ação no topo e no rodapé sem motivo claro.

### 7.2 Cabeçalho de página

Criar um componente único com:

- título;
- descrição curta;
- contexto opcional do paciente;
- ação principal;
- ações secundárias;
- comportamento responsivo padronizado.

No mobile, título e ações ficam empilhados. A ação principal ocupa toda a largura quando isso facilitar a execução.

### 7.3 Tipografia

Escala recomendada:

| Elemento | Desktop | Mobile |
|---|---:|---:|
| Título principal | 30–32 px | 24–26 px |
| Título de seção | 18–20 px | 18 px |
| Texto padrão | 14–16 px | 14–16 px |
| Campo de formulário | 14–16 px | 16 px |
| Informação auxiliar | mínimo 12 px | mínimo 12 px |

Evitar textos operacionais de 9–11 px, especialmente em cinza claro.

### 7.4 Superfícies e cards

- Reduzir caixas aninhadas.
- Usar elevação somente para destacar hierarquia ou interação.
- Diminuir a repetição de bordas em todos os blocos.
- Reservar `rounded-3xl` para containers principais.
- Usar divisores e espaçamento para subgrupos internos.

### 7.5 Feedback e salvamento

Padronizar os estados:

- Salvando…
- Salvo às 14:32;
- Alterações não salvas;
- Publicado;
- Falha ao salvar — tentar novamente;
- Processando com IA;
- Ação concluída.

Formulários longos devem ter salvamento automático ou recuperação de rascunho.

### 7.6 Estados vazios

Todo estado vazio deve informar:

1. o que ainda não existe;
2. por que aquilo é útil;
3. qual ação cria o primeiro item.

### 7.7 Conteúdo e linguagem

- Preferir rótulos orientados à tarefa.
- Reduzir termos técnicos quando não forem necessários.
- Usar verbos diretos em botões.
- Manter “Carregar dados demo” como ação secundária ou exclusiva do ambiente de demonstração.

Exemplos:

- “Upload PDFs” → “Enviar avaliações”;
- “Laudo unificado” → “Revisar e gerar laudo”;
- “Definir estrutura” → “Escolher modelo do prontuário”;
- “Dashboard” → “Atendimento WhatsApp”.

## 8. Responsividade e mobile

### Problemas observados

- navegação superior cortada;
- títulos extrapolando a largura da tela;
- etapas do fluxo parcialmente invisíveis;
- barras de ações extensas;
- chips e filtros saindo da área visível;
- conteúdo ocultado por `overflow-x-hidden`;
- módulos densos apenas comprimidos, sem adaptação do fluxo.

### Regras gerais

- Não usar `overflow-x-hidden` para esconder problemas de layout.
- Garantir `min-width: 0` em filhos de flex e grid quando necessário.
- Permitir quebra de linha em títulos e descrições.
- Empilhar ações abaixo de 768 px.
- Transformar grades de quatro ou cinco colunas em duas ou uma coluna.
- Utilizar rolagem horizontal somente em controles em que ela seja intencional e visualmente indicada.
- Testar larguras de 320, 360, 375, 390, 430, 768, 1024 e 1440 px.

### Stepper mobile

Substituir a linha horizontal extensa por:

```text
Etapa 1 de 3
Enviar avaliações
[████████░░░░░░░░]
```

As etapas completas podem aparecer em um resumo expansível.

## 9. Mapeamento por módulo

| Módulo | Atrito principal | Melhoria proposta | Prioridade |
|---|---|---|---|
| Avaliação | Stepper e títulos cortados no mobile | Stepper compacto, upload empilhado e CTA principal mais explícita | P0 |
| Anamnese | Muito conteúdo e fluxo dependente do stepper | Progresso compacto, autosave e orientação do próximo passo | P0/P1 |
| Dietas | Muitas ações concorrentes e editor denso | Barra de ações simplificada, refeições recolhíveis e menu de ações | P0/P1 |
| Atendimento | Alta densidade de filtros e indicadores | Filtros recolhíveis, KPIs acionáveis e hierarquia por urgência | P1 |
| Agenda | Calendário semanal inadequado para mobile | Visualização diária/lista no mobile e semana no desktop | P0 |
| Tarefas | Chips e ações podem extrapolar a largura | Compactar metadados, menu de ações e filtro mobile dedicado | P0 |
| Contratos | Etapas largas e formulário sem contexto persistente | Stepper compacto, paciente ativo e resumo antes de avançar | P0/P1 |
| Marketing | Configuração ocupa espaço antes do trabalho principal | Wizard inicial e alternância Editar/Pré-visualizar no mobile | P1 |

### 9.1 Avaliação

- [x] Trocar o stepper horizontal no mobile.
- [ ] Empilhar as duas áreas de upload sem largura excedente.
- [ ] Mostrar nome, tamanho e estado do arquivo após seleção.
- [ ] Desabilitar “Interpretar laudos” com explicação enquanto faltarem arquivos obrigatórios.
- [ ] Diferenciar claramente dados demo de dados reais.
- [ ] Mostrar o paciente ativo antes de iniciar a interpretação.

### 9.2 Anamnese

- [x] Aplicar stepper compacto no mobile.
- [ ] Salvar automaticamente questionário e notas.
- [ ] Indicar a última atualização do rascunho.
- [ ] Permitir recolher questionário ou notas para ampliar o campo em uso.
- [ ] Trocar comandos de editor que não cabem por uma barra móvel horizontal ou menu.
- [ ] Explicar o resultado esperado antes da geração por IA.

### 9.3 Dietas

- [x] Manter somente “Publicar dieta” como CTA primária.
- [x] Agrupar Duplicar, Histórico e outras ações em menu secundário.
- [ ] Evitar duplicidade entre ações do topo e rodapé flutuante.
- [ ] Transformar refeições em accordions no mobile.
- [ ] Levar mover, duplicar e excluir refeição para menu `•••`.
- [ ] Manter macros essenciais visíveis sem ocupar toda a tela.
- [ ] Exibir paciente, meta e status da dieta de maneira persistente.
- [ ] Confirmar claramente a diferença entre rascunho e dieta publicada.

### 9.4 Atendimento

- [ ] Exibir primeiro os indicadores que exigem ação.
- [x] Tornar filtros avançados recolhíveis.
- [ ] Permitir salvar combinações de filtros frequentes.
- [ ] Usar cards no mobile em vez de tabelas extensas.
- [ ] Disponibilizar ação direta a partir de pendências de SLA.
- [ ] Reduzir textos de 9–11 px nos indicadores.
- [ ] Explicar siglas como SLA no primeiro contato.

### 9.5 Agenda

- [ ] Usar agenda diária/lista em telas pequenas.
- [ ] Manter semana e mês no desktop e tablet.
- [ ] Criar atalho fixo para “Novo agendamento”.
- [ ] Destacar hoje, atrasos de confirmação e horários vagos.
- [ ] Garantir que a cor não seja o único indicador do status.
- [ ] Manter legenda de status acessível sob demanda.

### 9.6 Tarefas

- [x] Preservar o resumo 2 × 2 no mobile.
- [x] Impedir overflow dos chips de categoria e paciente.
- [ ] Levar editar e excluir para menu contextual no mobile.
- [ ] Manter concluir e abrir WhatsApp como ações evidentes.
- [ ] Criar filtro mobile em bottom sheet.
- [ ] Destacar vencimento com texto, não apenas cor.

### 9.7 Contratos

- [x] Aplicar stepper compacto.
- [ ] Preencher paciente a partir do contexto global.
- [ ] Mostrar resumo do plano, valor e consultas antes de avançar.
- [ ] Salvar rascunho automaticamente.
- [ ] Informar claramente quando o contrato ainda não foi enviado ou assinado.

### 9.8 Marketing

- [ ] Converter configuração inicial em wizard ou seção recolhível.
- [ ] No mobile, alternar entre “Editar” e “Pré-visualizar”.
- [ ] Tornar o preview fixo ou acessível durante a edição no desktop.
- [ ] Mostrar seleção atual de formato, paleta e foto em um resumo compacto.
- [ ] Exibir “Baixar post” apenas quando houver conteúdo pronto.
- [ ] Reduzir a densidade de opções exibidas simultaneamente.

## 10. Acessibilidade

### Checklist obrigatório

- [ ] Todos os controles clicáveis usam `button`, `a`, `input` ou semântica equivalente.
- [ ] Elementos interativos possuem estado de foco visível.
- [ ] Fluxos principais funcionam apenas com teclado.
- [ ] Botões de ícone possuem nome acessível.
- [ ] Campos possuem `label` associado.
- [ ] Erros são apresentados em texto e associados ao campo.
- [ ] Status não dependem somente de cor.
- [ ] Contraste atende WCAG AA.
- [ ] Áreas de toque possuem pelo menos 44 × 44 px.
- [ ] Animações respeitam `prefers-reduced-motion`.
- [ ] Stepper informa etapa atual com `aria-current="step"`.
- [ ] Toasts e processamentos usam regiões de status adequadas.

## 11. Componentes a padronizar

Criar ou consolidar os seguintes componentes compartilhados:

- [x] `PageHeader`;
- `ResponsiveNavigation`;
- `MobileBottomNavigation`;
- `PatientContextBar`;
- `GlobalPatientSearch`;
- `CompactStepper`;
- `ActionMenu`;
- `FilterDrawer`;
- `KpiCard`;
- `StatusBadge`;
- `EmptyState`;
- `SaveStatus`;
- `ConfirmDialog`;
- `FormField`;
- `SectionCard`;
- `MobileDesktopSwitch`.

## 12. Mapeamento técnico inicial

| Área | Arquivos de entrada prováveis | Mudança |
|---|---|---|
| Layout global | `app/src/layout/AppLayout.jsx` | Estrutura responsiva e contexto global |
| Navegação | `app/src/layout/Navbar.jsx` | Agrupamento desktop e navegação mobile |
| Tema | `app/src/styles/theme.css` | Escala tipográfica, superfícies, foco e tokens |
| Estilos globais | `app/src/styles/global.css` | Regras de acessibilidade e responsividade |
| Rotas/módulos | `app/src/App.jsx` | Inclusão de Início e Pacientes |
| Avaliação | `app/src/features/avaliacao` | Stepper e uploads responsivos |
| Anamnese | `app/src/features/anamnese` | Stepper, autosave e editor responsivo |
| Dietas | `app/src/features/dietas` | Barra de ações, cards e accordions |
| Atendimento | `app/src/features/atendimento` | Filtros e indicadores responsivos |
| Agenda | `app/src/features/agenda` | Visualização mobile específica |
| Tarefas | `app/src/features/tarefas` | Chips, filtros e ações mobile |
| Contratos | `app/src/features/contratos` | Stepper e contexto do paciente |
| Marketing | `app/src/features/marketing` | Wizard e alternância editor/preview |

## 13. Backlog priorizado

### P0 — Usabilidade essencial

- [x] Corrigir todo overflow horizontal em 320–430 px.
- [x] Criar navegação mobile utilizável.
- [x] Adaptar os steppers de Avaliação, Anamnese e Contratos.
- [x] Empilhar cabeçalhos e barras de ação.
- [ ] Garantir áreas de toque de 44 px.
- [ ] Criar visualização diária/lista para Agenda mobile.
- [ ] Corrigir cards e chips de Tarefas no mobile.
- [ ] Adaptar refeições e macros de Dietas.

### P1 — Clareza e consistência

- [ ] Padronizar cabeçalhos, botões e menus de ação.
- [ ] Aplicar escala tipográfica mínima.
- [ ] Reduzir bordas, cards aninhados e CTAs concorrentes.
- [ ] Padronizar estados de salvar, publicar, erro e processamento.
- [ ] Melhorar filtros de Atendimento.
- [ ] Criar fluxo Editar/Pré-visualizar em Marketing.
- [ ] Concluir checklist de acessibilidade.

### P2 — Experiência integrada

- [ ] Criar página “Hoje”.
- [ ] Implementar busca global de paciente.
- [ ] Persistir paciente ativo entre módulos.
- [ ] Criar barra contextual do paciente.
- [ ] Integrar atalhos entre Agenda, Tarefas e ficha do paciente.

### P3 — Evolução do produto

- [ ] Criar Patient 360.
- [ ] Adicionar comandos rápidos e busca global de ações.
- [ ] Permitir personalização da página inicial.
- [ ] Medir fluxos reais e executar testes de usabilidade.

## 14. Roteiro sugerido de implementação

### Sprint 1 — Fundação responsiva

- Navegação mobile.
- Correção de overflow.
- Cabeçalho responsivo.
- Stepper compacto.
- Tipografia e alvos de toque.

### Sprint 2 — Módulos operacionais

- Dietas.
- Tarefas.
- Agenda mobile.
- Atendimento e filtros.

### Sprint 3 — Módulos clínicos e conteúdo

- Avaliação.
- Anamnese.
- Contratos.
- Marketing.
- Feedbacks e estados de salvamento.

### Sprint 4 — Integração centrada no paciente

- Página “Hoje”.
- Busca global.
- Paciente ativo persistente.
- Primeira versão do Patient 360.

## 15. Critérios gerais de aceite

Uma melhoria somente é considerada concluída quando:

- não existe overflow horizontal acidental;
- todas as ações estão alcançáveis em 320 px de largura;
- o próximo passo principal é visualmente inequívoco;
- a tela pode ser utilizada por teclado;
- estados de loading, sucesso, vazio e erro foram contemplados;
- conteúdo importante não depende apenas de hover;
- botões de ícone possuem rótulo acessível;
- texto auxiliar possui tamanho e contraste adequados;
- o layout foi validado nas larguras definidas;
- não há regressão na impressão e geração de PDF quando aplicável.

## 16. Métricas de sucesso

- redução do tempo para localizar um paciente;
- redução de cliques para iniciar avaliação, dieta ou tarefa;
- redução de abandono em formulários longos;
- diminuição de erros ou perda de rascunho;
- aumento de uso no celular;
- redução de tarefas e mensagens vencidas;
- tempo entre login e primeira ação útil;
- resultado de testes de usabilidade com a equipe clínica.

## 17. Decisões recomendadas

1. Preservar a identidade visual atual.
2. Priorizar correções mobile antes de novas funcionalidades visuais.
3. Adotar navegação agrupada em vez de exibir oito módulos com o mesmo peso.
4. Criar uma única linguagem de componentes compartilhados.
5. Tratar “Hoje” e “Paciente 360” como os dois principais destinos futuros.
6. Evitar grandes refatorações simultâneas: migrar módulo por módulo sobre a nova fundação.

## 18. Histórico de implementação

### Entrega 5 — Padronização de cabeçalhos das ferramentas (PageHeader)

**Concluída em:** 10/10/2026

Implementado:

- criação do componente compartilhado `app/src/shared/ui/PageHeader.jsx`;
- padrão visual aberto e limpo (direto sobre o fundo da página, sem container/card envolvente desnecessário);
- estrutura unificada com tag de categoria superior (`text-emerald-700 font-extrabold uppercase`), título principal H1 (`text-2xl sm:text-3xl font-black text-slate-900`), badge opcional, descrição auxiliar e slots de ações alinhados;
- adoção padronizada em Cadastro de Pacientes, Montagem de Dietas, Atendimento WhatsApp, Agenda Inteligente, Minha Rotina & Tarefas e Marketing;
- ferramentas com stepper (Avaliação, Anamnese e Contratos) mantidas com seu fluxo de etapas autônomo.

Validação executada:

- `npm run lint`: 0 erros;
- `npm test`: 80 testes aprovados, 0 falhas;
- `npm run build`: compilação de produção aprovada (575ms).

### Entrega 4 — Base visual global

**Concluída em:** 04/10/2026

Implementado:

- fundo geral mais suave e levemente aquecido, mantendo o verde/tiffany e dourado da marca;
- superfícies, bordas e sombras refinadas para reduzir o aspecto de blocos pesados;
- tipografia-base de leitura, antialiasing e seleção de texto padronizados;
- tokens de espaçamento, raios e superfícies (`ui-surface` e `ui-panel`) criados para migrar telas gradualmente;
- cabeçalho superior ajustado à nova camada de superfícies.

Validação executada:

- `npm run lint`: aprovado, com avisos preexistentes em outros módulos;
- `npm test`: 63 testes aprovados, 0 falhas;
- `npm run build`: compilação de produção aprovada;
- revisão em navegador a 1440 px: fundo, superfícies e navegação renderizados sem overflow ou overlay de erro.

### Entrega 3 — Filtros recolhíveis no Atendimento (desktop)

**Concluída em:** 04/10/2026

Implementado:

- indicador “Aguardando” priorizado na grade de KPIs, com contraste e texto auxiliar maiores;
- filtros avançados recolhíveis, com estado acessível (`aria-expanded`).

Validação executada:

- `npm run lint`: aprovado, com avisos preexistentes em outros módulos;
- `npm test`: 63 testes aprovados, 0 falhas;
- `npm run build`: compilação de produção aprovada;
- revisão em navegador a 1440 px: filtros recolhíveis renderizados sem overflow ou overlay de erro.

### Entrega 2 — Hierarquia de ações na montagem de dieta (desktop)

**Concluída em:** 04/10/2026

Implementado:

- “Publicar dieta” definido como a única ação primária do cabeçalho;
- ações auxiliares agrupadas em “Mais ações”: salvar rascunho, modelos e histórico, duplicar, nova dieta e dados demo;
- estado de salvamento exposto no cabeçalho;
- menu fechado ao clicar fora ou pressionar `Esc`, com semântica e estado ARIA.

Validação executada:

- `npm run lint`: aprovado, com avisos preexistentes em outros módulos;
- `npm test`: 63 testes aprovados, 0 falhas;
- `npm run build`: compilação de produção aprovada;
- revisão em navegador a 1440 px: tela carregada, sem overflow horizontal, sem overlay de erro e menu “Mais ações” aberto com todos os cinco destinos esperados.

### Entrega 1 — Fundação responsiva e navegação mobile

**Concluída em:** 04/10/2026

Implementado:

- barra inferior mobile com cinco destinos e indicador de tarefas;
- menu “Mais” em formato de bottom sheet;
- cabeçalho mobile compacto com módulo atual e notificações;
- navegação desktop preservada;
- espaçamento inferior seguro para o conteúdo não ficar atrás da barra;
- correções de largura mínima e containers nos oito módulos;
- steppers responsivos em Avaliação, Anamnese e Contratos;
- rolagem intencional das abas densas de Dietas;
- formulário de consultas de Contratos adaptado para telas estreitas;
- foco visual global, suporte a `prefers-reduced-motion` e alvos principais de 44 px;
- comportamento responsivo da janela de notificações;
- tokens iniciais de tipografia e tamanho mínimo de toque.

Arquivos principais criados:

- `app/src/layout/MobileNavigation.jsx`;
- `app/src/layout/navigationItems.js`.

Validação executada:

- `npm run lint`: aprovado, permanecendo somente avisos preexistentes fora desta entrega;
- `npm test`: 63 testes aprovados, 0 falhas;
- `npm run build`: compilação de produção aprovada;
- verificação visual em 320, 390 e 1440 px;
- oito módulos verificados sem overflow horizontal (`scrollWidth` igual ao viewport);
- menu Mais aberto e verificado com todos os destinos esperados;
- nenhuma tela em branco ou overlay de erro do Vite.

Observação: o ambiente local retorna respostas 401 esperadas para integrações protegidas sem autenticação. Não foram encontradas exceções JavaScript ou erros de renderização causados por esta entrega.
