# Finanças & Gestão de Pacotes de Parceria

Este documento descreve a arquitetura, modelo de dados e funcionamento do módulo de **Finanças & Pacotes** (`app/src/features/financas`) na plataforma NutrIsa.

---

## 🎯 Objetivo

Centralizar em uma interface clínica a gestão de:
1. **Pacotes & Parcerias com Médicos/Nutrólogos**:
   - Controle de frequência (semanal, quinzenal, mensal, etc.).
   - Acompanhamento do progresso das consultas (consultas contratadas vs. consultas já realizadas).
   - Identificação imediata de pendências (sessões restantes a realizar, exames pendentes ou pagamentos parciais).
   - Registro de histórico individual de cada sessão com data e anotações clínicas.
   - Apuração do valor do pacote e repasse da parceria.
   - Exportação para planilha CSV (compatível com Excel / Google Sheets).
2. **Fluxo de Caixa & Lançamentos**:
   - Registro de entradas (receitas de consultas, pacotes e parcerias) e saídas (repasses, custos de consultório).
   - Apuração de saldo geral e filtros por categoria.

---

## 📦 Modelo de Dados dos Pacotes (`financeStorage.js`)

| Propriedade | Tipo | Descrição | Exemplo |
|---|---|---|---|
| `id` | `string` | Identificador único do pacote | `"pkg-171829000-abc12"` |
| `patientName` | `string` | Nome do paciente atendido | `"Fernanda Rocha"` |
| `patientId` | `string \| null` | ID do paciente cadastrado na clínica (opcional) | `"uuid-paciente"` |
| `patientPhone` | `string` | Telefone / WhatsApp para contato e follow-up | `"(11) 98765-4321"` |
| `partnerName` | `string` | Nome do parceiro clínico (ex: Nutrólogo) | `"Dr. Lucas (Nutrologia)"` |
| `planName` | `string` | Nome do plano / protocolo | `"Protocolo Integrado 6M (Nutro + Nutri)"` |
| `frequency` | `string` | Periodicidade das sessões | `"Semanal"`, `"Quinzenal"`, `"Mensal"` |
| `totalConsultations` | `number` | Total de consultas contratadas | `6` |
| `completedConsultations` | `number` | Total de consultas já realizadas | `2` |
| `packageValue` | `number` | Valor total contratado em R$ | `2400.00` |
| `partnerShare` | `number` | Valor de repasse para o parceiro em R$ | `1200.00` |
| `paymentStatus` | `string` | Situação financeira | `"pago"`, `"parcial"`, `"pendente"` |
| `status` | `string` | Estado do pacote | `"ativo"`, `"concluido"`, `"pausado"`, `"cancelado"` |
| `startDate` | `string` | Data de início do acompanhamento (ISO date) | `"2026-10-01"` |
| `notes` | `string` | Pendências clínicas, exames ou observações | `"Aguardando exames laboratoriais do nutrólogo"` |
| `sessionsHistory` | `Array` | Histórico detalhado de sessões realizadas | `[{ id, date, notes }]` |

---

## 🔄 Regras de Negócio e Comportamento

1. **Incremento Rápido de Consulta (`+1`)**:
   - A tabela dispõe de um botão de ação rápida `+1` na linha do pacote. Ao clicar, o total de consultas concluídas é incrementado em 1 e um registro correspondente é inserido no `sessionsHistory`.
   - Se o número de consultas realizadas atingir o total contratado (`completedConsultations >= totalConsultations`), o status do pacote é automaticamente atualizado para `"concluido"`.

2. **Cálculo de Pendências**:
   - `consultasPendentes = Math.max(0, totalConsultations - completedConsultations)`.
   - O filtro "Com Pendências" exibe pacotes que possuam consultas restantes a realizar, pagamentos pendentes ou observações ativas.

3. **Persistência Híbrida (Offline-First + Supabase na Nuvem)**:
   - Armazenado localmente no `localStorage` sob as chaves `nutrisa_finance_packages` e `nutrisa_finance_transactions` (definidas em `app/src/config/storageKeys.js`) para resposta otimista instantânea.
   - Sincronização em nuvem em segundo plano com o **Supabase**:
     - Tabela `public.partner_packages`: armazena os pacotes, sessões (`sessions_history` em JSONB), valores e repasses com isolamento por `organization_id` e RLS multi-tenant (`private.is_organization_member`).
     - Tabela `public.finance_entries`: armazena os lançamentos de receitas e despesas com categoria, forma de pagamento e `organization_id`.
   - Dispara o evento global `nutrisa_finance_updated` via `window.dispatchEvent`, mantendo sincronização reativa imediata entre abas e componentes.

4. **Vínculo com Prontuário, Fotos e WhatsApp**:
   - Cada pacote na tabela de gestão possui auto-matching com a lista de pacientes cadastrados (`patients`) através do `patientId`, telefone normalizado ou nome.
   - **Exibição de Fotos Reais de Perfil**: a tabela renderiza o avatar com a foto sincronizada do WhatsApp (`avatar_url` ou `photo_url`) do paciente cadastrado, com fallback para iniciais se não houver foto.
   - **Identificação Limpa**: exibição do nome do paciente com tipografia refinada e sem poluição visual do número de WhatsApp na célula principal.
   - **Cores Oficiais dos Status**:
     - `concluido`: Verde (`bg-emerald-50 text-emerald-700 border-emerald-200`)
     - `ativo`: Azul (`bg-blue-50 text-blue-700 border-blue-200`)
     - `pausado`: Amarelo (`bg-amber-50 text-amber-700 border-amber-200`)
     - `cancelado`: Vermelho (`bg-rose-50 text-rose-700 border-rose-200`)
   - **Botão com ícone de pessoinha (`User`)** na coluna Ações: seleciona o paciente no `PatientContext` global (`selectPatient`) e navega diretamente para o prontuário no módulo de **Pacientes** (`#pacientes`).
   - **Link Direto para o WhatsApp**: caso haja telefone válido, um clique no número abre a conversa diretamente no WhatsApp Web/App (`https://wa.me/55...`), facilitando a cobrança e agendamento de consultas.
   - **Auto-vínculo em segundo plano**: pacotes sem `patientId` associam silenciosamente o ID do paciente ao detectar correspondência na base clínica.
   - **Vínculo a Cadastro Existente no Modal (`PackageModal`)**: bloco no padrão visual do sistema com botão verde "Vincular a cadastro existente" e aviso tracejado quando desvinculado; oferece busca rápida por Nome, WhatsApp ou CPF e sugestões automáticas baseadas no nome, preenchendo telefone e ID do paciente automaticamente. Permite também trocar de paciente ou desvincular.

5. **Exportação CSV**:
   - Gera arquivo `.csv` codificado em UTF-8 com BOM (`\uFEFF`) e delimitador `;`, garantindo abertura direta no Excel sem caracteres corrompidos.

