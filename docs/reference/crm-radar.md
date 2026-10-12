# Radar de Relacionamento

O Radar de Relacionamento é a fila operacional da NutrIsa. No menu principal, o módulo é exibido como **Relacionamento**; a rota técnica `#crm` é preservada por compatibilidade. A página cruza os cadastros já carregados com conversas recentes e tarefas para destacar pacientes que precisam de uma ação humana.

## Sinais e prioridade

| Sinal | Regra atual | Prioridade |
|---|---|---|
| SLA estourado | última conversa sem resposta, com espera de pelo menos 60 minutos | crítica |
| Aniversário hoje | data de nascimento do paciente coincide com o dia atual | alta |
| Tarefa vencida | tarefa vinculada ao paciente, pendente e com prazo anterior ao dia atual | alta |
| Retorno pendente | última consulta há pelo menos 35 dias e nenhuma próxima consulta futura | média-alta |
| Aniversário próximo | data de nascimento do paciente ocorre nos próximos 7 dias | média-alta |
| Reativação | última consulta há pelo menos 90 dias e nenhuma próxima consulta futura | média |
| Lead sem avanço | paciente em `lead` cadastrado há pelo menos 7 dias | acompanhamento |

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
- `next_appointment_at` ainda depende de associação persistida; eventos apenas locais do Google Agenda não são inferidos silenciosamente.

## Ações

- **Mensagem WhatsApp:** abre o modal de mensagens rápidas (`QuickMessageModal`), oferecendo modelos contextuais pré-configurados (Lembrete de retorno, Reativação carinhosa, Parabéns de aniversário, Apresentação para lead, Atendimento e Check-in de rotina). Permite edição livre, cópia de texto e abertura no WhatsApp oficial com texto codificado (`wa.me/55...`).
- **Conversa:** seleciona o paciente e abre Atendimento com o contexto encaminhado.
- **Abrir ficha:** seleciona o cadastro e retorna à ficha central do paciente.

O cálculo puro fica em `app/src/features/crm/domain/radar.js`, templates em `app/src/features/crm/domain/crmTemplates.js`, o modal em `app/src/features/crm/components/QuickMessageModal.jsx`, a página em `app/src/features/crm/CrmPage.jsx` e os testes em `tests/unit/crmRadar.test.js`.

## Oportunidades comerciais e IA

O bloco **Oportunidades de pacotes** converte os sinais do Radar em segmentos explicáveis:

- retorno pendente → hipótese de acompanhamento trimestral (Plano Evolução 90);
- afastamento acima de 90 dias → programa curto de reativação (Programa Retoma 30);
- lead parado → jornada inicial com processo e entregáveis claros (Jornada Primeiros Passos);
- paciente ativo sem próximo passo → acompanhamento contínuo (Acompanhamento Contínuo).

Cada card de oportunidade é interativo: ao clicar, o radar filtra imediatamente a lista de pacientes qualificados para aquele formato comercial, facilitando o contato direcionado.

O botão **Gerar insights com IA** é sempre acionado por uma pessoa. Antes do envio, o frontend agrega os estágios da base, inclui somente a contagem das oportunidades e anonimiza uma amostra limitada das conversas: remove nome do contato, telefone, e-mail e identificadores numéricos. A IA deve separar evidência de hipótese e retorna dores recorrentes, três sugestões de planos e próximas ações.

As sugestões não definem preço, não diagnosticam, não prescrevem, não prometem resultados e não são enviadas automaticamente. Planos, promessa, entregáveis e abordagem comercial exigem validação da nutricionista.

