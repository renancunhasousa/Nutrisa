# Referência — Cadastro de Pacientes

Este documento define o cadastro de pacientes no Supabase. A implementação está versionada nas migrações [`create_patient_database`](../../supabase/migrations/20261010023559_create_patient_database.sql), [`harden_bootstrap_function`](../../supabase/migrations/20261010025115_harden_bootstrap_function.sql) e [`link_patient_workspace`](../../supabase/migrations/20261010123000_link_patient_workspace.sql). O frontend compartilha o contexto de pacientes entre Cadastro e Atendimento para permitir cadastro assistido a partir do WhatsApp.

## Escopo desta entrega

A migração cria a fundação multi-tenant e o cadastro operacional:

- `organizations`: clínica proprietária dos dados;
- `organization_members`: vínculo entre `auth.users`, organização e papel;
- `patients`: identidade, contato principal, estágio de relacionamento e consentimentos;
- `patient_contacts`: múltiplos contatos normalizados por paciente;
- `patient_audit_log`: registro mínimo de inclusão, alteração e exclusão cadastral.

Consultas, anamneses, avaliações físicas, dietas, conversas, tarefas e contratos não são armazenados em `patients`. Cada domínio continua independente. O Atendimento apenas identifica um cadastro por `patient_id` ou telefone e abre o formulário de paciente; não copia automaticamente o conteúdo integral da conversa para o prontuário.

## Cadastro de pacientes

A rota `#pacientes` é a entrada padrão do sistema autenticado. Ela oferece somente:

- busca por nome, CPF, telefone ou e-mail;
- inclusão e edição do cadastro;
- consulta dos dados pessoais, contatos, etapa, origem, consentimentos e observações;
- isolamento dos registros pela organização autenticada.

Na lista e no cartão branco de detalhes, `avatar_url` substitui as iniciais no quadrado do paciente. As iniciais permanecem como fallback quando não existe foto ou o carregamento falha.

No cabeçalho do bloco de detalhes do paciente, estão disponíveis atalhos rápidos para as rotas clínicas vinculadas ao paciente (`dietas`, `anamnese`, `laudo`, `dashboard`, `agenda`, `tarefas`, `contratos`). Em estado padrão, os botões exibem apenas ícones compactos em pílulas elegantes; ao passar o mouse (`hover`), cada botão expande suavemente com micro-animação para exibir o rótulo do módulo correspondente. Os módulos integrados (`Dietas`, `Tarefas` e `Contratos`) aproveitam o `selectedPatient` ativo no `PatientContext` para preenchimento ágil.

No grid de dados cadastrais, o card de **Observações** fica posicionado ao lado de **Comunicações**, ocupando a largura combinada dos dois blocos superiores (`sm:col-span-1 xl:col-span-2`), mantendo harmonia visual e leitura integrada.

Abaixo do grid cadastral, delimitado por um traço horizontal separador (`border-t`), localiza-se o card de **Resumo com IA** no mesmo padrão visual dos demais cards cadastrais (borda suave, fundo claro e ícone de estrela sem fundo). O card exibe um preview textual de no máximo duas linhas e conta com ação **"Ver completo"**, que abre um popup modal elegante com a íntegra da síntese clínica estruturada, botões para cópia rápida e opção de regerar o resumo.

Esse recurso agrega de forma cruzada e contextual:
- Dados pessoais e cadastrais (idade calculada, sexo, contatos, estágio de relacionamento e notas);
- Histórico do WhatsApp (data da última conversa, principais mensagens, dúvidas e solicitações do paciente);
- Tarefas e demandas operacionais pendentes/concluídas associadas;
- Metas e estrutura de plano alimentar rascunhado/ativo.

Ao clicar em **"Gerar com IA"**, a inteligência sintetiza os dados em tópicos clínicos estruturados (Perfil & Contato, Última Interação & Dúvidas WhatsApp, Plano Alimentar & Demandas, e Próximos Passos). O resumo é salvo automaticamente no `localStorage` e na base de dados (`metadata.ai_summary`), permanecendo visível até que o usuário solicite uma nova geração (que substitui o conteúdo anterior).

## Cadastro assistido pelo WhatsApp

No detalhe de uma conversa, o painel de Atendimento apresenta uma das ações:

- **Abrir paciente**, quando `patient_id` ou o telefone normalizado corresponde a um cadastro carregado;
- **Cadastrar paciente**, quando não existe correspondência.

O novo cadastro é apenas um rascunho preenchido no formulário existente. O sistema aproveita nome do contato, telefone/WhatsApp, e-mail explicitamente presente na mensagem, origem `WhatsApp`, etapa `lead`, data e categoria do atendimento. O texto integral da conversa não é copiado para observações e nenhum consentimento é marcado automaticamente.

Antes de inserir, o serviço consulta novamente o telefone no Supabase. Se outra sessão tiver criado o paciente, o registro existente é selecionado em vez de duplicado. Telefone continua sem restrição global de unicidade porque familiares podem compartilhar um número. Quando mais de um cadastro corresponde, o sistema não escolhe nem cria automaticamente: direciona para revisão manual em Pacientes.

### Lista de contatos pendentes

A rota `#pacientes` também consulta o histórico de `log_conversas` em segundo plano e mostra **Contatos do WhatsApp não cadastrados** no final da página, depois da lista e dos dados do paciente. As regras são:

- mensagens são agrupadas pelo telefone normalizado, deixando uma linha por contato;
- a lista é ordenada pela mensagem mais recente e informa a quantidade de mensagens;
- quando `foto_perfil` está disponível, a foto do WhatsApp ocupa o avatar quadrado; se a imagem estiver ausente ou falhar, aparecem as iniciais;
- conversas sem telefone, já vinculadas por `patient_id` ou cujo telefone existe em `patients` não aparecem;
- nome e e-mail podem ser aproveitados de mensagens diferentes do mesmo contato;
- **Cadastrar** abre o formulário existente e uma nova consulta por telefone é executada antes da inserção;
- depois de salvar, o contato desaparece automaticamente porque passou a corresponder à base de pacientes.

Falha ao consultar conversas não bloqueia a consulta ou edição dos pacientes já cadastrados. A seção exibe erro e permite tentar novamente.

## Integração ativa do prontuário

O `patient_id` é encaminhado somente quando a profissional usa um atalho da ficha. O módulo de destino consome esse contexto uma única vez, evitando preenchimento acidental pelo menu. Avaliações, anamneses, dietas e contratos são persistidos com a chave do paciente; o Atendimento associa conversas sem vínculo pelo telefone normalizado.

## Estado dos módulos vinculados

As colunas e chaves abaixo conectam cada domínio ao cadastro central:

| Módulo | Tabela | Estado atual |
|---|---|---|
| Avaliação | `physical_evaluations` | salva o laudo final com `patient_id` |
| Anamnese | `anamnese` | salva coleta e análises com `patient_id` |
| Dieta | `plano_alimentar` | salva o plano com `patient_id` |
| WhatsApp | `log_conversas` | vincula mensagens pelo telefone normalizado e mantém `patient_id` |
| Agenda | `appointments` | eventos Google não são associados ao cadastro |
| Tarefas | `nutrisa_tasks` | sem preenchimento pelo cadastro selecionado |
| Contratos | `contracts` | salva o contrato com `patient_id` ao gerar o link |

As tabelas recebem `organization_id`, chave estrangeira composta para `patients (id, organization_id)`, índices por paciente/data, RLS por membro e privilégios explícitos somente para `authenticated`.

## Compatibilidade com a tabela legada

A tabela remota já possuía registros e os campos `name`, `gender`, `phone`, `cpf`, `email`, `avatar_url`, `status`, `notes`, `created_at` e `updated_at`. A migração segue o padrão expandir e contrair:

1. não remove registros nem colunas legadas;
2. cria a organização padrão `NutrIsa` e associa os registros existentes;
3. copia `name` para `full_name` e `gender` para `sex`;
4. traduz `status = 'ativo'` para `status = 'active'`;
5. mantém `name`/`full_name` e `gender`/`sex` sincronizados por trigger;
6. preserva `active_plan_id` sem chave estrangeira até a implantação dos planos versionados.

## Contrato de `patients`

| Grupo | Campos |
|---|---|
| Identidade | `id`, `full_name`, `preferred_name`, `birth_date`, `sex`, `cpf` |
| Contato rápido | `email`, `phone`, `whatsapp_phone`, `avatar_url` |
| CRM | `acquisition_source`, `lifecycle_stage`, `status`, `last_consultation_at`, `next_appointment_at`, `active_plan_id` |
| Consentimentos | `consent_health_data_at`, `consent_communications_at`, `consent_photos_at` |
| Integração | `source`, `external_id`, `metadata` |
| Auditoria | `created_by`, `updated_by`, `created_at`, `updated_at`, `archived_at` |
| Isolamento | `organization_id` |

Valores aceitos:

- `lifecycle_stage`: `lead`, `scheduled`, `active`, `at_risk`, `inactive`, `churned`;
- `status`: `active`, `archived`, `blocked`;
- papel do membro: `owner`, `professional`, `receptionist`, `assistant`.

CPF e telefones ganham colunas geradas normalizadas. Telefones brasileiros com 10 ou 11 dígitos recebem o prefixo `55`. CPF válido em formato deve ter 11 dígitos; a validação foi criada como `NOT VALID` para não bloquear a migração caso exista dado legado a revisar.

## Duplicidade e busca

- CPF é único dentro da organização quando possui 11 dígitos.
- A combinação `organization_id + source + external_id` é única para importações idempotentes.
- Contatos iguais do mesmo tipo não se repetem para o mesmo paciente.
- Só pode existir um contato principal de cada tipo por paciente.
- Índices cobrem nome normalizado, telefone, WhatsApp, status e etapa do ciclo de vida.

Telefone não é globalmente único: familiares podem compartilhar um número. A aplicação deve apresentar possíveis correspondências para revisão em vez de fundir pacientes silenciosamente.

## Segurança e RLS

As cinco tabelas usam RLS. `anon` não recebe privilégio sobre nenhuma delas. Usuários `authenticated` precisam pertencer à organização do registro:

- membros podem consultar, incluir e atualizar pacientes e contatos;
- somente `owner` pode excluir paciente;
- somente `owner` administra membros da organização;
- auditoria cadastral é visível a `owner`, `professional` e `assistant`;
- a troca de `organization_id` de um paciente existente é bloqueada por trigger.

As funções auxiliares de autorização ficam no schema não exposto `private`, usam `SECURITY DEFINER`, `search_path` vazio e privilégios explícitos. A RPC pública `bootstrap_organization()` usa `SECURITY INVOKER`, só pode ser executada por `authenticated` e delega a operação privilegiada a uma função privada que valida `auth.uid()`.

O frontend usa Supabase Auth com Google OAuth, senha ou link por e-mail. O login Google chama `signInWithOAuth`, retorna à origem atual da aplicação e reaproveita a sessão persistida pelo cliente Supabase. A chave pública identifica o projeto, mas as consultas clínicas carregam o token da sessão e dependem de RLS. Nesta fase a aplicação é intencionalmente de uma única clínica: o primeiro acesso autenticado reivindica `NutrIsa`; contas posteriores precisam receber vínculo explícito em `organization_members`.

O provedor Google precisa permanecer habilitado em **Authentication → Providers** no projeto Supabase, e as URLs locais e de produção devem constar em **Authentication → URL Configuration**. O Client ID usado diretamente pela Agenda (`VITE_GOOGLE_CLIENT_ID`) é uma configuração separada: ele autoriza chamadas ao Google Calendar e não é necessário para iniciar o login clínico via Supabase.

Contratos continuam assináveis por link público sem abrir a tabela `contracts`. O link usa `public_token` e duas RPCs restritas: `get_contract_for_signature()` expõe somente os campos necessários e `sign_contract()` valida tipo e tamanho da assinatura antes da atualização.

## Implantação

Pré-requisitos: Supabase CLI 2.120.0, projeto remoto vinculado e uma sessão administrativa autorizada.

```powershell
npx --yes supabase@2.120.0 login
npx --yes supabase@2.120.0 link --project-ref <PROJECT_REF>
npx --yes supabase@2.120.0 db push --dry-run
npx --yes supabase@2.120.0 db push
npx --yes supabase@2.120.0 migration list
```

No primeiro login da conta responsável pela clínica, o frontend executa automaticamente:

```http
POST /rest/v1/rpc/bootstrap_organization
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN_DO_USUARIO>

{"p_name":"NutrIsa"}
```

Isso reivindica a organização padrão e registra a conta como `owner`. Chamadas posteriores da mesma conta são idempotentes. Depois que a clínica possui um membro, outra conta não cria uma segunda clínica automaticamente.

## Verificação após o deploy

1. uma chamada com chave pública, sem access token de usuário, deve receber `401` ou `403` em `/rest/v1/patients`;
2. o `owner` deve enxergar os registros legados depois de executar `bootstrap_organization()`;
3. um usuário autenticado sem vínculo não deve enxergar pacientes;
4. CPF duplicado na mesma organização deve falhar, mas o mesmo CPF em outra organização é permitido;
5. alteração cadastral deve criar uma linha em `patient_audit_log` sem copiar o conteúdo integral do paciente.
6. o Atendimento deve oferecer cadastro assistido e os demais módulos devem continuar funcionando sem receber automaticamente os dados do paciente selecionado;
7. um link público de contrato deve ler/assinar somente via RPC, sem `SELECT` ou `UPDATE` anônimo na tabela;
8. a tela de pacientes não deve consultar nem alterar registros dos demais módulos.
9. uma conversa com telefone já cadastrado deve abrir o paciente existente em vez de criar duplicidade.
