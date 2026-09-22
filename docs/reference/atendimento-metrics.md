# Métricas de Atendimento WhatsApp & Bonificação da Recepção

Documento de referência para apuração de metas e geração do Relatório Executivo de Atendimento em PDF da plataforma **NutrIsa**.

---

## 🎯 As 4 Metas Operacionais para Bonificação

O relatório executivo em PDF avalia o desempenho da secretária em quatro blocos centrais consolidados pela Inteligência Artificial e pelas regras de domínio:

| Bloco | Meta | Critério de Atingimento | Objetivo Estratégico |
|---|---|---|---|
| **1. Tempo** | SLA Médio de Resposta | **SLA médio &le; 30 minutos** *(Meta Ouro &le; 15 min)* | Agilidade no primeiro acolhimento e confirmação de consultas. |
| **2. Volume** | Absorção Operacional | **Secretária liderar o volume de respostas** (`total secretária &ge; total Dra. Isabela`) | Garantir autonomia do WhatsApp da clínica pela recepção. |
| **3. Intervenção** | Teto de Intervenções Clínicas | **Intervenções da Dra. em agendamentos/recepção &le; 25%** do total de mensagens | Manter a nutricionista focada nas consultas e condutas clínicas. |
| **4. Categorização** | Foco em Agendamentos | **Mensagens da secretária concentradas em "Agendamento e Horários"** | Assegurar que a atuação da recepção priorize captação, confirmação e remarcações. |

---

## ⚙️ Regras de Domínio e Código

- **Arquivo de Regras e Métricas:** [`metrics.js`](file:///e:/Antigravity/NutrIsa/app/src/features/atendimento/domain/metrics.js)
  - `calculateComparisonStats(filteredData, getAttendantType)`: calcula totais, médias, taxa de resposta rápida, pendências, intervenções absolutas e percentuais, além da taxa de mensagens em "Agendamento e Horários".
  - `evaluateSecretaryGoals(comparisonStats)`: valida de forma determinística os 4 blocos de metas (`isSlaOk`, `isVolOk`, `isIntervOk`, `isCategorizacaoOk`) e determina o status de bônus (`isBonusAtingido`).
- **Dashboard e Geração de Parecer IA:** [`AtendimentoPage.jsx`](file:///e:/Antigravity/NutrIsa/app/src/features/atendimento/AtendimentoPage.jsx)
  - Envia prompt estruturado para o modelo Gemini ativo com as 4 diretrizes explícitas.
  - Gera os 4 blocos de avaliação em JSON puro: `Tempo`, `Volume`, `Intervenção` e `Categorização`.
- **Relatório Executivo PDF:** [`WhatsAppPdfReport.jsx`](file:///e:/Antigravity/NutrIsa/app/src/features/atendimento/report/WhatsAppPdfReport.jsx)
  - Renderiza o Grid de 4 Metas Avaliadas com badges de conformidade (`✓ Meta` ou `✕ Fora`).
  - Apresenta diretrizes de SLA e Termo de Alinhamento e Bonificação oficial para assinatura da Dra. Isabela.
- **Cards de Atendentes:** [`WhatsAppAttendantCards.jsx`](file:///e:/Antigravity/NutrIsa/app/src/features/atendimento/components/WhatsAppAttendantCards.jsx)
  - Exibe badges em tempo real: percentual de intervenções da recepção no card da Dra. e percentual de foco em agendamentos no card da secretária.

---

## ⏰ Regra de SLA por Horário Comercial (Business Hours)

Para evitar distorções nas métricas de tempo de resposta da secretária (especialmente mensagens enviadas em finais de semana ou fora do expediente), o cálculo de tempo de espera no pipeline de atendimento (`n8n` &rarr; `log_conversas.tempo_espera_minutos`) adota as seguintes diretrizes:

- **Expediente Oficial:** Segunda a Sexta-feira, das **08:00 às 18:00** (Horário de Brasília, UTC-3).
- **Noites e Madrugadas:** O cronômetro de espera é **pausado** entre as 18:00 e as 08:00 do próximo dia útil.
- **Finais de Semana (Sábados e Domingos):** O cronômetro permanece **congelado** durante todo o sábado e domingo, iniciando a contagem apenas às 08:00 de segunda-feira.
- **Respostas Rápidas Fora do Expediente (Dra. Isabela):** Caso ocorra atendimento em período fora de expediente em intervalo rápido (&le; 120 min), o sistema registra o tempo real decorrido para valorizar a agilidade e prontidão clínica da Dra. Isabela.
