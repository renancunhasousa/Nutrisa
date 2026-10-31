# Métricas de Atendimento WhatsApp & Bonificação da Recepção

## Envio direto na conversa do paciente

A tela `PatientConversationView.jsx` permite responder ao paciente sem sair da NutrIsa. O serviço `whatsappSender.js` envia um `POST` ao webhook configurado em `VITE_N8N_WHATSAPP_SEND_URL` (ou no campo `whatsappWebhookUrl` do perfil da clínica), usando o contrato `{ phone, message, instance_name, patient_id, requested_by, organization_id, responder_name, responder_role, responder_type }`. Na ausência da variável, a aplicação usa a URL de produção da NutrIsa como fallback. O texto só é limpo após confirmação de sucesso; em caso de falha, permanece no compositor para nova tentativa. O botão externo continua disponível como fallback para abrir a mensagem no WhatsApp.

O workflow n8n responsável recebe a carga com o campo `instance_name`:
- Para a organização da **Dra. Isabela Muñoz**, `instance_name` é resolvido automaticamente como `IsaNutri`.
- Para **outras clínicas (multi-tenant)**, `instance_name` é obtido da configuração salva no perfil da clínica (ou assume `org_<organization_id>`).
- O nó HTTP Request do n8n dispara para o endpoint da VPS Evolution API: `POST /message/sendText/{{ $json.instance_name }}` com o header `apikey`. Chaves da Evolution API não são expostas no frontend.

Cada envio direto também carrega o usuário autenticado e grava em `log_conversas` os campos `responded_by_user_id`, `responded_by_name`, `responded_by_role`, `responded_by_type` e `response_channel`. O agrupamento operacional diferencia `isabela`, `secretaria`, `administrativo`, `profissional` e `personalizado`. Para preservar as metas históricas, somente `isabela` permanece no grupo clínico; os demais cargos integram o volume operacional da equipe, enquanto o detalhamento por usuário aparece separadamente.

A conversa combina três mecanismos de atualização: Supabase Realtime, recarga após envio e polling de fallback a cada 30 segundos. O polling é suspenso enquanto a aba está oculta e uma atualização é executada ao retornar. O cabeçalho mostra `Atualizado às HH:mm` com base na última consulta concluída com sucesso.

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
- **Formatação de Nome Curto na Interface:** [`clinicProfileService.js`](file:///e:/Antigravity/NutrIsa/app/src/features/configuracoes/services/clinicProfileService.js)
  - Funções `formatDoctorShortName(fullName)` e `getOwnerShortLabel()` garantem que em toda a interface do Atendimento (cards comparativos, tabela de conversas, filtros e gráficos) o nome seja padronizado como `Dra. <Primeiro Nome>` (ex: `Dra. Isabela`), evitando que nomes longos cadastrados no perfil quebrem ou invadam outros elementos visuais.

---

## ⏰ Regra de SLA por Horário Comercial (Business Hours)

Para evitar distorções nas métricas de tempo de resposta da secretária (especialmente mensagens enviadas em finais de semana ou fora do expediente), o cálculo de tempo de espera no pipeline de atendimento (`n8n` &rarr; `log_conversas.tempo_espera_minutos`) adota as seguintes diretrizes:

- **Expediente Oficial:** Segunda a Sexta-feira, das **08:00 às 18:00** (Horário de Brasília, UTC-3).
- **Noites e Madrugadas:** O cronômetro de espera é **pausado** entre as 18:00 e as 08:00 do próximo dia útil.
- **Finais de Semana (Sábados e Domingos):** O cronômetro permanece **congelado** durante todo o sábado e domingo, iniciando a contagem apenas às 08:00 de segunda-feira.
- **Respostas Rápidas Fora do Expediente (Dra. Isabela):** Caso ocorra atendimento em período fora de expediente em intervalo rápido (&le; 120 min), o sistema registra o tempo real decorrido para valorizar a agilidade e prontidão clínica da Dra. Isabela.
