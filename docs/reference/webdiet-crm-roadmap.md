# Plano de evolução: WebDiet + CRM

## Objetivo

Evoluir a NutrIsa para uma plataforma centrada no paciente, reunindo CRM, prontuário nutricional, acompanhamento clínico e plano alimentar em um único histórico.

## Princípios

- `patients` é a entidade central; os demais registros devem apontar para o paciente.
- Dados clínicos devem ter histórico e, quando necessário, versionamento.
- Acesso deve ser separado por profissional/ clínica e protegido por RLS.
- Toda funcionalidade nova deve incluir ou atualizar testes automatizados.
- IA sugere e organiza informações; a decisão e a prescrição continuam sob responsabilidade do profissional.

## Estado atual identificado

Já existem tabelas para `patients`, `appointments`, `consultations`, `anamnese`, `prontuario`, `evolucao`, `physical_evaluations`, `antropometria`, `calculo_energetico`, `plano_alimentar`, `suplementos`, `exames`, `log_conversas`, `tasks` e `finance_entries`.

Antes de dados reais de pacientes, revisar RLS: várias tabelas sensíveis estão atualmente sem Row Level Security.

## Fases recomendadas

### Fase 0 — Segurança e fundação

- Definir autenticação e o profissional responsável por cada registro.
- Criar, se necessário, `organizations`/clínicas e vínculos profissional–paciente.
- Habilitar RLS nas tabelas expostas e criar políticas baseadas no vínculo real de acesso.
- Padronizar `created_at`, `updated_at`, `created_by` e `patient_id`.
- Não armazenar chaves secretas no frontend.

### Fase 1 — Patient 360 e timeline

- Criar a ficha unificada do paciente.
- Exibir dados cadastrais, próxima consulta, plano atual, tarefas e último contato.
- Montar timeline com consultas, avaliações, mensagens, documentos e alterações de plano.
- Permitir filtros por tipo e período.
- Criar testes para ordenação, filtros e isolamento de pacientes.

### Fase 2 — CRM de relacionamento

- Adicionar origem do lead, etapa do funil, tags e status de acompanhamento.
- Criar tarefas de retorno e lembretes.
- Vincular `log_conversas` ao paciente por telefone, identificador do WhatsApp ou associação manual.
- Separar mensagens operacionais, administrativas e clínicas, sem transformar automaticamente uma mensagem em diagnóstico.
- Mostrar na ficha do paciente um resumo e o histórico relevante da conversa, com busca por período e assunto.
- Criar alertas de paciente sem resposta e retorno vencido.
- Registrar consentimentos de comunicação e preferências de contato.

### WhatsApp como entrada do CRM

O WhatsApp pode alimentar o CRM, mas deve funcionar como uma fonte controlada de eventos, não como substituto do prontuário.

- **Entrada:** receber mensagens, telefone, data, direção (paciente/equipe), status e identificador da conversa.
- **Identificação:** encontrar o paciente por telefone; quando houver ambiguidade, enviar para confirmação manual.
- **Contexto:** registrar assunto, última interação, intenção provável e prioridade operacional.
- **Ação:** criar tarefa, atualizar etapa do funil, sugerir retorno ou sinalizar revisão profissional.
- **Limites clínicos:** sintomas e informações de saúde devem ser marcados para avaliação humana; a automação não deve prescrever, diagnosticar ou publicar conduta sozinha.
- **Auditoria:** guardar origem, regra/IA utilizada, usuário que confirmou e data da alteração.
- **Privacidade:** limitar o texto exibido por função, aplicar retenção adequada e registrar consentimento para mensagens automatizadas.

### Automação futura via WhatsApp/RPA

Quando a integração estiver disponível, começar com automações de baixo risco:

1. Capturar lead e criar paciente potencial.
2. Confirmar ou sugerir agendamento.
3. Enviar lembrete de consulta e retorno.
4. Perguntar sobre adesão e coletar feedback estruturado.
5. Criar tarefa para a equipe quando houver resposta, atraso ou termo prioritário.

Evitar inicialmente automações que alterem dados clínicos, publiquem plano alimentar ou respondam sintomas sem aprovação do profissional.

### Fase 3 — WebDiet profissional

- Consolidar anamnese, avaliações, exames e cálculo energético.
- Criar plano alimentar com refeições, substituições e observações.
- Versionar planos: rascunho, publicado, arquivado.
- Registrar quem publicou cada versão e quando.
- Associar suplementos, receitas e lista de compras ao plano.

### Fase 4 — Portal do paciente

- Criar acesso autenticado e seguro do paciente.
- Exibir plano vigente, lista de compras, próxima consulta e evolução autorizada.
- Permitir registros de adesão, dúvidas e feedback.
- Usar Storage com políticas próprias para fotos e documentos.

### Fase 5 — Inteligência e operação

- Sugestões de IA baseadas somente nos dados autorizados do paciente.
- Resumo de consulta e sugestão de resposta para mensagens.
- Métricas de retenção, comparecimento, adesão e faturamento.
- Auditoria de acessos e alterações em dados clínicos.

## Modelo mínimo de relacionamento

```text
organization
  └── professional
        └── patient
              ├── consultations
              ├── anamnesis
              ├── evaluations
              ├── meal_plan_versions
              ├── exams
              ├── conversations
              └── follow_up_tasks
```

## Critério de pronto

Uma fase só deve ser considerada concluída quando tiver fluxo funcional, permissões revisadas, testes automatizados relevantes, documentação atualizada e verificação em ambiente seguro.

## Próximo passo recomendado

Implementar a Fase 0 e, em seguida, a primeira versão da timeline do paciente. Esse caminho cria a base de segurança e já entrega uma visão clara do valor do WebDiet e do CRM.
