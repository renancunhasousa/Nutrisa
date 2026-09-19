# Plano de Implementação — CRM + Patient 360

## 1. Objetivo

Transformar a NutrIsa em uma plataforma de gestão de relacionamento e acompanhamento clínico para nutricionistas, mantendo o paciente como entidade central.

O CRM não será um módulo separado do prontuário. Ele será a camada operacional sobre o histórico do paciente: contatos, conversas, agenda, retornos, tarefas, contratos e pagamentos convivem com anamneses, consultas, avaliações, dietas e planos alimentares.

## 2. Princípios de produto

1. **Paciente no centro:** qualquer conversa, consulta, dieta ou tarefa deve poder ser aberta a partir do paciente.
2. **Histórico imutável:** novas consultas e planos geram registros ou versões; nunca sobrescrevem o passado.
3. **CRM especializado:** priorizar retenção, retorno, confirmação, no-show e acompanhamento nutricional.
4. **IA como copiloto:** pode classificar, resumir e sugerir; não publica conduta clínica sem aprovação humana.
5. **LGPD e mínimo privilégio:** dados de saúde exigem isolamento por organização, auditoria e permissões por função.
6. **Integração gradual:** Google Calendar, WhatsApp e pagamentos devem ser adaptadores; o banco da NutrIsa é a fonte de relacionamento.

## 3. Modelo conceitual

```text
organization
  └── users / professionals
        └── patients
              ├── patient_contacts
              ├── consultations
              │     ├── anamneses
              │     ├── physical_evaluations
              │     └── clinical_notes
              ├── meal_plans
              │     └── meal_plan_versions
              │           └── meals / diet_items
              ├── supplement_prescriptions
              ├── conversations / conversation_messages
              ├── appointments
              ├── contracts / subscriptions / payments
              ├── follow_up_tasks
              └── patient_files
```

## 4. Entidades e responsabilidades

### `organizations`

Clínica ou conta proprietária dos dados. Deve existir mesmo que a primeira instalação tenha apenas uma nutricionista.

Campos mínimos: `id`, `name`, `created_at`, `updated_at`.

### `users` e `organization_members`

Usuários autenticados e seus papéis na organização.

Papéis iniciais: `owner`, `professional`, `receptionist`, `assistant`.

### `patients`

Cadastro estável do paciente e estado resumido para listagens rápidas.

Campos recomendados:

```text
id, organization_id, full_name, preferred_name,
birth_date, sex, cpf, email, phone, whatsapp_phone,
avatar_url, acquisition_source, lifecycle_stage,
status, last_consultation_at, next_appointment_at,
active_plan_id, consent_health_data_at,
created_at, updated_at, archived_at
```

`lifecycle_stage`: `lead`, `scheduled`, `active`, `at_risk`, `inactive`, `churned`.

`status`: `active`, `archived`, `blocked`.

Dados clínicos detalhados não devem ser armazenados em colunas genéricas do paciente. Eles pertencem às consultas, anamneses e avaliações.

### `patient_contacts`

Permite mais de um telefone, e-mail ou canal sem perder o histórico.

Campos: `patient_id`, `type`, `value`, `is_primary`, `verified_at`, `metadata`.

### `consultations`

Representa cada atendimento realizado ou planejado.

Campos: `patient_id`, `appointment_id`, `professional_id`, `type`, `status`, `scheduled_at`, `started_at`, `completed_at`, `summary`, `created_by`.

### `anamneses` e `anamnesis_versions`

A anamnese deve ser versionada. Uma nova coleta cria uma versão vinculada à consulta; a versão anterior permanece consultável.

Estados: `draft`, `completed`, `archived`.

Guardar respostas estruturadas em JSONB apenas para campos realmente variáveis; campos usados em filtros e alertas devem ser colunas tipadas.

### `physical_evaluations` e `evaluation_metrics`

Cada avaliação pertence a uma consulta e registra peso, composição corporal, medidas, dobras, bioimpedância e fotos quando houver.

Métricas devem ter `metric_key`, `value`, `unit`, `measured_at`, `source` e `reference_range` quando aplicável. Nunca substituir a avaliação anterior.

### `meal_plans`

Identidade lógica do plano, por exemplo “Acompanhamento para hipertrofia”.

Campos: `patient_id`, `goal`, `status`, `started_at`, `ended_at`, `current_version_id`.

### `meal_plan_versions`

Versão concreta e auditável de uma dieta.

Campos: `meal_plan_id`, `version_number`, `status`, `title`, `calorie_target`, `macro_targets`, `content`, `created_by`, `published_at`, `archived_at`.

Estados: `draft`, `published`, `archived`.

Uma versão publicada não deve ser editada destrutivamente. Alterações criam a próxima versão.

### `conversations` e `conversation_messages`

Histórico do WhatsApp ou outro canal. O vínculo principal é `patient_id`; o telefone é apenas o mecanismo de identificação inicial.

Campos importantes: `channel`, `external_thread_id`, `direction`, `message_text`, `sent_at`, `read_at`, `responded_at`, `classification`, `requires_clinical_review`.

Classificações iniciais: `administrative`, `appointment`, `billing`, `clinical_question`, `urgent_clinical`, `other`.

### `appointments`

Espelho operacional da agenda, com `external_provider`, `external_id`, `starts_at`, `ends_at`, `type`, `confirmation_status`, `attendance_status` e `patient_id`.

O Google Calendar continua sendo integração de agenda; o vínculo paciente-agendamento deve ser persistido na NutrIsa.

### `follow_up_tasks`

Tarefas de CRM e assistência clínica não urgente.

Campos: `patient_id`, `assigned_to`, `type`, `priority`, `status`, `due_at`, `completed_at`, `source`, `notes`.

Tipos iniciais: `confirm_appointment`, `return_radar`, `answer_message`, `review_clinical_message`, `renew_plan`, `collect_document`.

### `contracts`, `subscriptions` e `payments`

Devem ser relacionados ao paciente e, quando aplicável, ao plano. O financeiro não deve ser inferido apenas pelas cores da agenda.

## 5. Experiência do usuário

### Menu principal

- Dashboard
- Pacientes
- Inbox / WhatsApp
- Agenda
- Retornos e tarefas
- Avaliações
- Dietas e planos
- Contratos e financeiro
- Configurações

### Lista de pacientes

Filtros: nome, telefone, etapa do ciclo de vida, última consulta, próxima consulta, plano vigente, responsável, origem e pendências.

Indicadores por paciente: última interação, próxima ação, status do plano e risco de abandono.

### Ficha Patient 360

Abas sugeridas:

1. **Visão geral:** resumo atual, próxima ação, plano vigente e alertas.
2. **Linha do tempo:** consultas, mensagens, dietas, avaliações, contratos e tarefas em ordem cronológica.
3. **Consultas e anamneses:** histórico clínico por atendimento.
4. **Evolução:** gráficos de peso, gordura, massa magra, medidas e fotos.
5. **Dietas e planos:** plano atual, versões anteriores, publicação e compartilhamento.
6. **Conversas:** histórico do WhatsApp e respostas pendentes.
7. **Agenda e tarefas:** próximos eventos, follow-ups e retornos.
8. **Documentos e financeiro:** contratos, pagamentos e arquivos.

### Dashboard CRM

O dashboard deve responder:

- Quem precisa de atenção hoje?
- Quais mensagens estão fora do SLA?
- Quem tem consulta amanhã sem confirmação?
- Quem está há 35–45 dias sem retorno?
- Quais planos vencem ou precisam ser renovados?
- Quais horários foram liberados por cancelamento?

## 6. Fluxos principais

### Novo paciente

1. Criar lead ou paciente.
2. Normalizar telefone e procurar duplicidades.
3. Registrar origem e consentimentos.
4. Criar agendamento, se houver.
5. Enviar tarefa de pré-anamnese.
6. Ao concluir o primeiro atendimento, promover para `active`.

### Consulta concluída

1. Fechar consulta.
2. Salvar anamnese e avaliação como novos registros.
3. Criar ou versionar o plano alimentar.
4. Publicar somente após revisão profissional.
5. Criar próxima tarefa de retorno.
6. Atualizar os resumos de `patients` por trigger ou serviço transacional.

### Mensagem recebida

1. Identificar paciente por telefone ou encaminhar para fila de não identificados.
2. Salvar mensagem idempotentemente.
3. Classificar como administrativa ou clínica.
4. Criar tarefa se exigir resposta.
5. Escalar para revisão profissional quando houver possível urgência clínica.

### Radar de retorno

1. Encontrar pacientes ativos sem próxima consulta.
2. Calcular dias desde a última consulta ou publicação do plano.
3. Criar uma única tarefa aberta por paciente e campanha.
4. Permitir mensagem sugerida e registro do resultado.

## 7. Segurança e LGPD

- RLS por `organization_id` em todas as tabelas.
- Dados clínicos acessíveis apenas a profissionais e assistentes autorizados.
- Recepção pode ver agenda, contato e status operacional, mas não necessariamente detalhes clínicos.
- Auditoria de leitura e alteração em anamneses, avaliações e dietas publicadas.
- Tokens de portal do paciente com expiração, revogação e escopo mínimo.
- Consentimento separado para dados de saúde, comunicação e fotos de evolução.
- Nenhuma chave de serviço ou token de WhatsApp no frontend.
- Backups e política de retenção documentados antes de produção.

## 8. Ordem de implementação

> **Estratégia de compatibilidade:** esta implementação não deve substituir os módulos atuais de uma vez. O CRM será adicionado em camadas, começando por leitura e agregação. As telas e fluxos existentes continuam sendo a fonte de escrita até que cada novo módulo seja validado.

### Trilhas de evolução sem quebra

#### Trilha A — Leitura segura e compatibilidade

- Criar o núcleo `patients` sem remover tabelas ou serviços atuais.
- Importar ou projetar dados existentes em uma camada de leitura.
- Montar busca, ficha e timeline somente leitura.
- Vincular agenda, conversas e avaliações por IDs externos, telefone e nome normalizado.
- Exibir origem e confiança do vínculo quando houver ambiguidade.
- Manter as telas atuais como fallback.
- Validar com dados sintéticos e um grupo pequeno de pacientes.

#### Trilha B — Escrita controlada

- Ativar gravação no novo modelo apenas por módulo, começando por pacientes e tarefas.
- Usar escrita dupla temporária quando um registro novo precisar alimentar o modelo antigo e o novo.
- Comparar os resultados das duas fontes por logs e testes antes de desligar a escrita antiga.
- Fazer cada migração por feature flag ou configuração reversível.
- Só substituir a tela antiga após validação funcional, de segurança e de dados.

#### Regras para não quebrar o que já existe

1. Não apagar, renomear ou alterar o contrato das tabelas atuais durante a primeira fase.
2. Não alterar a integração do Google Calendar; primeiro apenas relacionar eventos existentes a pacientes.
3. Não mover conversas ou avaliações antigas sem `external_id`, `source` e registro de origem.
4. Não sobrescrever dietas, anamneses ou avaliações; importar como histórico ou versão.
5. Toda nova escrita deve ser idempotente e permitir reprocessamento.
6. Cada fase precisa de testes de regressão dos fluxos atuais antes de ser habilitada.
7. Deve existir um plano de rollback por módulo, sem depender de restauração total do banco.

### Fase 0 — Fundação e segurança

Criar organização, membros, papéis, RLS, auditoria, migrações e normalização de contatos.

### Fase 1 — Patient 360 mínimo

Criar `patients`, `patient_contacts`, consultas, timeline e tela de perfil com dados cadastrais, agenda e tarefas.

### Fase 2 — Histórico clínico

Adicionar anamneses versionadas, consultas concluídas, avaliações e gráficos de evolução.

### Fase 3 — Dietas e planos versionados

Adicionar `meal_plans`, versões, refeições, publicação, arquivamento e comparação entre versões.

### Fase 4 — CRM e comunicação

Vincular `log_conversas`, criar inbox por paciente, SLA, classificação e sugestão de resposta com aprovação humana.

### Fase 5 — Agenda e retenção

Persistir appointments, confirmação, no-show, radar de retorno, tarefas e encaixes.

### Fase 6 — Contratos, pacotes e cobrança

Relacionar contratos, vigência, pagamentos, planos recorrentes e campanhas de reativação.

### Fase 7 — Portal do paciente

Expor apenas dados publicados: dieta vigente, evolução autorizada, documentos, próxima consulta e lembretes.

## 9. Migração do estado atual

 A migração deve ocorrer em modo **expandir e contrair**: primeiro adicionar o novo modelo e seus adaptadores, depois validar, e somente no final retirar dependências antigas — se ainda for necessário.

1. Inventariar campos existentes em `log_conversas`, agenda, avaliações e contratos.
2. Criar tabelas novas sem apagar o modelo atual.
3. Normalizar telefone em formato E.164 quando possível.
4. Fazer correspondência por telefone e nome com revisão de conflitos.
5. Importar mensagens e eventos com `source` e `external_id`.
6. Marcar registros ambíguos para revisão manual.
7. Só depois trocar as telas para ler do novo modelo.
8. Manter o modelo anterior disponível durante pelo menos um ciclo completo de validação operacional.

### Critérios de avanço entre trilhas

Uma feature só pode passar da Trilha A para a Trilha B quando:

- os registros antigos aparecem corretamente na nova ficha;
- não existem duplicidades não resolvidas no conjunto de teste;
- os fluxos atuais de agenda, avaliação, anamnese e conversas continuam funcionando;
- os testes de regressão passam;
- o rollback da feature foi testado;
- a equipe consegue identificar qual fonte é a origem de cada dado.

## 10. Critérios de pronto

- Um paciente pode ser encontrado por nome ou telefone sem duplicação silenciosa.
- A ficha exibe dados operacionais e clínicos em uma única navegação.
- Nenhuma dieta, anamnese ou avaliação histórica é sobrescrita.
- É possível abrir uma conversa, consulta ou tarefa diretamente a partir do paciente.
- O CRM gera tarefas de retorno sem duplicá-las.
- Recepção e profissional veem apenas o que seus papéis permitem.
- Todas as operações críticas têm testes de domínio, integração e RLS.
- Documentação, contratos de dados e README refletem o modelo implementado.

## 11. Primeira entrega recomendada

Para validar o produto rapidamente, a primeira versão deve conter somente:

1. cadastro e busca de pacientes;
2. ficha Patient 360;
3. timeline de consultas, mensagens e tarefas;
4. agenda vinculada ao paciente;
5. radar de retorno;
6. anamnese e avaliação versionadas;
7. dieta atual e histórico de versões.

WhatsApp automatizado, cobrança e portal do paciente entram depois que esse núcleo estiver consistente e protegido.
