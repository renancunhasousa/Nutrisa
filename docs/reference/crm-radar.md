# Radar de Relacionamento

O Radar de Relacionamento é a fila operacional da NutrIsa. No menu principal, o módulo é exibido como **Relacionamento**; a rota técnica `#crm` é preservada por compatibilidade. A página cruza os cadastros já carregados com conversas recentes e tarefas para destacar pacientes que precisam de uma ação humana.

## Sinais e prioridade

| Sinal | Regra atual | Prioridade |
|---|---|---|
| SLA estourado | última conversa sem resposta, com espera de pelo menos 60 minutos (usa `tempo_espera_minutos`; se nulo, calcula a partir de `data_envio`) | crítica |
| Aniversário hoje | data de nascimento do paciente coincide com o dia atual | alta |
| Tarefa vencida | tarefa vinculada ao paciente, pendente e com prazo anterior ao dia atual | alta |
| Retorno pendente | última consulta há pelo menos 35 dias e nenhuma próxima consulta futura | média-alta |
| Aniversário próximo | data de nascimento do paciente ocorre nos próximos 7 dias | média-alta |
| Reativação | última consulta há pelo menos 90 dias e nenhuma próxima consulta futura | média |
| Lead sem avanço | paciente em `lead` sem interação (última conversa) há pelo menos 7 dias; sem conversas, usa a data de cadastro | acompanhamento |

Quando um paciente possui mais de um sinal, ele aparece uma única vez e os sinais são exibidos juntos. A ordenação considera primeiro o sinal de maior prioridade.

## Filtros do Radar

A interface oferece abas de filtro rápido:
- **Todos:** visão completa dos pacientes que demandam atenção.
- **Urgentes:** mensagens sem resposta (SLA estourado) e tarefas vencidas.
- **Retornos:** pacientes há mais de 35 dias sem agendamento futuro.
- **Relacionamento:** reativação de inativos e leads parados.
- **Aniversários:** aniversariantes do dia e dos próximos 7 dias com contador em destaque.

## Fontes e limites

- Pacientes vêm do `PatientContext` e permanecem isolados pela organização autenticada.
- O histórico consultado no carregamento é limitado às 2.000 mensagens mais recentes dos últimos 120 dias.
- Tarefas usam o cache offline existente e são atualizadas a partir de `nutrisa_tasks`.
- O Radar não altera automaticamente estágio, prontuário ou conduta clínica.
- `next_appointment_at` e `last_consultation_at` do cadastro continuam valendo quando preenchidos. Quando estão vazios, o Radar usa as datas calculadas a partir do Google Calendar (ver "Vínculo agenda × pacientes").
- Quando nenhum paciente tem sinais, a tela exibe um diagnóstico (`buildRadarDiagnostics`): pacientes carregados, mensagens ligadas a pacientes, pacientes sem data da última consulta e sem data de nascimento.

## Vínculo agenda × pacientes

A agenda vive no Google Calendar e os eventos têm apenas o nome do paciente no título (sem telefone). A conferência visual dessa reconciliação e o cadastro ágil de novos pacientes/leads a partir da agenda ficam centralizados na rota **Pacientes** (`#pacientes`), enquanto a página Relacionamento continua consumindo os vínculos resolvidos em segundo plano para alimentar os sinais de retornos e reativações:

- Lê os eventos de 180 dias atrás a 120 dias à frente com o mesmo token Google da tela Agenda (`nutriisa_google_token`, expira em 1 hora; se faltar, o painel orienta a reconectar).
- Considera só consultas de paciente (`isConsultationEvent`): ignora pessoais, bloqueios e `[DESMARCADO]`.
- A chave é o **nome normalizado** (sem tags `[...]`, emojis, acentos e caixa), então um vínculo vale para todos os eventos daquele nome.
- **Prioridade 1 — E-mail (100% Preciso e Automático):** Extrai e-mails dos convidados (`attendees`), descrição ou resumo do evento (ignorando o e-mail da clínica/proprietária). Se encontrar correspondência com o e-mail cadastrado do paciente, o vínculo é automático e instantâneo, dispensando qualquer revisão manual mesmo que o título esteja abreviado ou incompleto.
- **Prioridade 2 — Telefone:** Extrai números de telefone da descrição/resumo e cruza com `whatsapp_phone` ou `phone` do cadastro.
- **Prioridade 3 — Nome:** Quando não há e-mail nem telefone no evento:
  - **Automático:** nome completo idêntico a um único paciente, ou 2+ palavras contidas no nome de um único paciente.
  - **Sugestões em lote:** nomes parecidos (abreviações ou pequenos erros de digitação) que combinam com um único paciente viram *sugestão* para confirmação em 1 clique ("Confirmar todas").
  - **Escolha manual:** nomes ambíguos ou sem correspondência exibem botões com os pacientes mais prováveis, botão "+ Cadastrar paciente" (para converter o evento em novo paciente/lead pré-preenchido) e opção "Não é paciente".
- Daí saem `last_consultation_at` (último evento já ocorrido) e `next_appointment_at` (primeiro evento futuro), aplicados em memória sobre os pacientes. O banco de pacientes **não** é alterado.

Código: `domain/calendarLinks.js`, `services/calendarLinks.js`, `hooks/useCalendarPatientLinks.js`, `components/CalendarLinkReview.jsx`; testes em `tests/unit/crmCalendarLinks.test.js`. Migration: `supabase/migrations/20261015230000_calendar_event_links.sql`.

## Enriquecimento com WhatsApp

O cruzamento do telefone do paciente com a tabela `log_conversas` enriquece a visualização operacional do CRM e o cadastro:
- **Foto de perfil (`avatar_url`):** extraída automaticamente do `foto_perfil` do WhatsApp. Uma trigger no banco (`sync_patient_avatar_from_log_conversas`) atualiza o `avatar_url` do cadastro quando novas mensagens chegam, e o frontend faz fallback instantâneo em memória.
- **Nome no WhatsApp (`whatsapp_name`):** exibido ao lado do nome oficial quando o paciente usa um nome diferente ou apelido no WhatsApp.
- **Última mensagem:** trecho da última mensagem trocada para contextualização imediata antes do contato.


## Ações

- **Mensagem WhatsApp:** abre o modal de mensagens rápidas (`QuickMessageModal`), oferecendo modelos contextuais pré-configurados (Lembrete de retorno, Reativação carinhosa, Parabéns de aniversário, Apresentação para lead, Atendimento e Check-in de rotina). Permite edição livre, cópia de texto e abertura no WhatsApp oficial com texto codificado (`wa.me/55...`).
- **Conversa:** seleciona o paciente e abre Atendimento com o contexto encaminhado.
- **Abrir ficha:** seleciona o cadastro e retorna à ficha central do paciente.

O cálculo puro fica em `app/src/features/crm/domain/radar.js`, templates em `app/src/features/crm/domain/crmTemplates.js`, o modal em `app/src/features/crm/components/QuickMessageModal.jsx`, a página em `app/src/features/crm/CrmPage.jsx` e os testes em `tests/unit/crmRadar.test.js`.

## Funil de Oportunidades & Pacotes (Pipeline Visual de CRM)

O bloco **Funil de Oportunidades & Pacotes** substitui a antiga lista textual por um **dashboard visual executivo de CRM**:

- **Barra de Distribuição Proporcional (Pipeline):** Uma barra horizontal no cabeçalho exibe a fatia percentual da base de pacientes distribuída entre as 4 etapas comerciais:
  - 🟣 **Leads (Primeira Consulta):** conversão de contatos em pacientes pagantes;
  - 🟢 **Mensal (Plano Mensal Contínuo):** retenção contínua de pacientes ativos;
  - 🟡 **Retornos (Retorno Pendente):** resgate de atrasos entre 35 e 89 dias;
  - 🔴 **Reativação (Reativação de Pacientes):** acolhimento e resgate de afastados há mais de 90 dias.
- **Cards Métricos Executivos (4 colunas):** Cada etapa possui um cartão de métrica limpo com ícone temático, métrica numérica em destaque (`text-2xl font-black`), percentual do funil e uma barra individual de volume.
- **Redução do Muro de Texto:** O card foca na métrica e na frase de impacto (tagline). Os detalhes aprofundados de justificativa ("Público", "Dor" e "Formato da Oferta") ficam recolhidos por padrão e podem ser consultados sob demanda através do botão `ℹ` de detalhes.
- **Filtro Direto no Radar:** Clicar em qualquer card ou no botão `⚡ Filtrar` filtra instantaneamente a lista do radar de relacionamento, destacando os pacientes correspondentes àquela etapa do pipeline.
- **Insights com IA e Persistência:** O botão **Gerar insights com IA** gera hipóteses comerciais responsáveis sem expor dados pessoais. O resultado gerado é persistido tanto localmente (`localStorage`) quanto no Supabase (`crm_commercial_insights`), permanecendo salvo e disponível entre recarregamentos da página até que uma nova geração seja solicitada.
- **Bloco Colapsável e Padrão Visual:** O container da **Leitura Estratégica da IA** segue rigorosamente a identidade da plataforma: ícone sem fundo (`<Sparkles className="size-4 text-emerald-600" />`), título em caixa alta (`LEITURA ESTRATÉGICA DA IA`) e setinha (`ChevronDown`) à direita para expandir ou recolher a análise quando desejar.
- **Integração com Tarefas (Categoria Relacionamento):** Cada recomendação do bloco "Próximas ações" conta com um botão individual `+ Tarefa` e um botão em lote `Incluir todas em Tarefas`. Ao acionar, a ação é automaticamente inserida na Central de Tarefas (`nutrisa_tasks`) sob a nova categoria **Relacionamento**, com prazo programado para 2 dias e nota explicativa do radar.

