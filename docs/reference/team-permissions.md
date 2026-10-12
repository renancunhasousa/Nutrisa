# Gestão de Equipe e Controle de Acesso por Módulos

Esta referência descreve a arquitetura de múltiplos usuários, gestão de membros da clínica e controle de permissões por módulo da plataforma NutrIsa.

---

## 1. Visão Geral

A plataforma permite que a **Dra. Isabela (Proprietária / Owner)** adicione colaboradores (secretária, administrativo, assistente) e controle com precisão quais módulos do sistema cada membro pode visualizar e operar.

### Recursos Principais
1. **Código de Convite da Clínica**:
   - Cada clínica possui um código exclusivo e legível (ex.: `NUTRISA-2026` ou personalizado como `ISABELA-2026`).
   - A Dra. pode copiar ou editar o código no painel de equipe.
   - Funcionários e secretárias podem inserir esse código na tela de login (`LoginPage.jsx`) para se conectar diretamente à clínica da Dra.
2. **Presets de Papéis (Roles)**:
   - `owner` (**Dra. / Proprietária**): Acesso total e irrestrito a todos os módulos clínicos e financeiros, além de gerenciar a equipe.
   - `receptionist` (**Secretária / Recepção**): Acesso pré-configurado a Agenda, Atendimento WhatsApp, Tarefas e CRM / Relacionamento.
   - `assistant` (**Administrativo / Financeiro**): Acesso pré-configurado a Contratos e Tarefas.
   - `custom` (**Personalizado**): Módulos configurados individualmente.
3. **Barra de Atalhos com Liga/Desliga por Módulo**:
   - Inspirada diretamente na barra de **Atalhos do Paciente**, a Dra. pode ativar ou desativar cada módulo com um único clique em cada botão/ícone.

---

## 2. Módulos Controlados

| ID do Módulo | Nome Exibido | Ícone | Finalidade Principal |
|---|---|---|---|
| `dietas` | Dieta | `UtensilsCrossed` | Criação e edição de planos alimentares |
| `anamnese` | Anamnese | `FileText` | Questionários e prontuários clínicos |
| `avaliacao` | Avaliação | `Activity` | Medições corporais, dobras e laudos |
| `atendimento` | Atendimento | `MessageSquare` | WhatsApp e conversas com pacientes |
| `agenda` | Agenda | `Calendar` | Consultas, horários e compromissos |
| `tarefas` | Tarefas | `CheckSquare` | Gestão de tarefas diárias e follow-up |
| `contratos` | Contratos | `FileSignature` | Termos de adesão e assinaturas digitais |
| `crm` | Relacionamento | `Radar` | Radar de retenção, oportunidades e aniversários |
| `produtos` | Produtos | `ShoppingBag` | Catálogo de alimentos e suplementos |
| `marketing` | Marketing | `Sparkles` | Estúdio de criação de posts para Instagram |

---

## 3. Onde os Filtros São Aplicados

1. **`Navbar.jsx` (Navegação Desktop)**:
   - Os itens do menu superior são filtrados via `canAccessModule(item.id)`.
   - O botão **Equipe** só aparece para quem possui `isOwner === true`.
2. **`MobileNavigation.jsx` (Navegação Mobile)**:
   - Tanto os botões da barra inferior quanto o menu drawer "Mais" filtram módulos restritos.
3. **`PacientesPage.jsx` (Atalhos do Paciente)**:
   - A barra horizontal de atalhos rápidos do paciente ativo (`PATIENT_SHORTCUTS`) oculta os módulos que a secretária/assistente não tiver permissão de acessar.

---

## 4. Estrutura de Arquivos

- **Definições e Regras de Permissão**: [`app/src/features/auth/permissions.js`](file:///e:/Antigravity/NutrIsa/app/src/features/auth/permissions.js)
- **Serviço de Persistência e Códigos**: [`app/src/features/auth/services/teamService.js`](file:///e:/Antigravity/NutrIsa/app/src/features/auth/services/teamService.js)
- **Modal de Gestão de Membros e Barra de Permissões**: [`app/src/features/auth/components/TeamPermissionsModal.jsx`](file:///e:/Antigravity/NutrIsa/app/src/features/auth/components/TeamPermissionsModal.jsx)
- **Contexto de Autenticação**: [`app/src/features/auth/AuthContext.jsx`](file:///e:/Antigravity/NutrIsa/app/src/features/auth/AuthContext.jsx)
- **Tela de Login com Campo de Código da Clínica**: [`app/src/features/auth/LoginPage.jsx`](file:///e:/Antigravity/NutrIsa/app/src/features/auth/LoginPage.jsx)
- **Testes Unitários**: [`tests/unit/teamPermissions.test.js`](file:///e:/Antigravity/NutrIsa/tests/unit/teamPermissions.test.js)
