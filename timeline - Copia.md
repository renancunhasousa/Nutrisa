# 🚀 Roadmap Estratégico NutrIsa: Matriz Esforço vs. Impacto

Este documento reúne **10 iniciativas estratégicas** projetadas para acelerar o faturamento, elevar a retenção de pacientes e automatizar rotinas operacionais da clínica da Dra. Isabela Muñoz.

---

## 📊 Matriz de Priorização (Esforço vs. Impacto / Ganho Financeiro)

| # | Iniciativa | Esforço | Impacto / Lucro | Quadrante | Prazo Estimado |
|---|------------|:-------:|:---------------:|:---------:|:--------------:|
| **01** | **Radar Inteligente de Retornos (Reengajamento WhatsApp)** | 🟢 Baixo | 🚀 Muito Alto | *Quick Win de Ouro* | 1 a 2 dias |
| **02** | **Botão de IA "Sugerir Resposta Rápida" no Feed** | 🟢 Baixo | 🔥 Alto | *Quick Win* | 1 dia |
| **03** | **Alerta Automático de "No-Show" e Confirmação 24h** | 🟢 Baixo | 🔥 Alto | *Quick Win* | 1 a 2 dias |
| **04** | **Triagem de Alertas Clínicos & SLA Crítico no Sino** | 🟢 Baixo | 📈 Médio | *Quick Win* | 1 dia |
| **05** | **Cobrança Recorrente / Assinaturas de Planos (Stripe/Pix)** | 🟡 Médio | 🚀 Muito Alto | *Grande Aposta* | 3 a 4 dias |
| **06** | **Gerador Rápido de Prescrição de Suplementos em PDF** | 🟡 Médio | 🔥 Alto | *Eficiência Clínica* | 2 a 3 dias |
| **07** | **Portal Web Interativo do Paciente (PWA sem Senha)** | 🟡 Médio | 🚀 Muito Alto | *Diferencial Premium* | 3 a 5 dias |
| **08** | **Linha do Tempo Visual de Evolução Corporal (360°)** | 🟡 Médio | 🔥 Alto | *Retenção & Valor* | 3 a 4 dias |
| **09** | **IA Co-Piloto para Montagem de Cardápio e Macro Nutrientes** | 🔴 Alto | 🚀 Muito Alto | *Transformação Operacional* | 5 a 7 dias |
| **10** | **Campanhas de Reativação em Massa com Segmentação** | 🔴 Alto | 🔥 Alto | *Escala Comercial* | 4 a 6 dias |

---

## 🔍 Detalhamento das 10 Iniciativas

---

### 1. 🎯 Radar Inteligente de Retornos & Reengajamento Ativo
* **Objetivo:** Aumentar o faturamento imediato resgatando pacientes inativos.
* **Como Funciona:** 
  - O sistema cruza a última data de consulta/atendimento com a base de pacientes.
  - Exibe um painel de pacientes que completaram **30, 45 ou 60 dias sem agendamento**.
  - Botão de **1 clique via WhatsApp** com mensagem personalizada: *"Oi [Nome], a Isa pediu para saber como você está se adaptando à dieta! Vamos marcar sua reavaliação para medir a evolução da sua massa magra?"*
* **Ganho:** Reduz o *churn* (abandono) de acompanhamento e aumenta o faturamento em **25% a 40%** sem gastar R$ 1 a mais em anúncios.
* **Esforço:** 🟢 **Baixo** (queries prontas no Supabase + botão `wa.me`).

---

### 2. ⚡ Co-Piloto de IA: "Sugerir Resposta" no Modal da Conversa
* **Objetivo:** Economizar tempo da secretária e da Dra., acelerando o tempo de resposta (SLA).
* **Como Funciona:** 
  - Dentro do modal de detalhes da conversa (`👁️ Ver`), adiciona-se o botão **"✨ Sugerir Resposta com IA"**.
  - A IA (Gemini) lê a dúvida do paciente, considera o tom humanizado da clínica e gera uma resposta pronta e acolhedora.
  - Botões rápidos de *"Copiar"* ou *"Abrir no WhatsApp"*.
* **Ganho:** Reduz em até **70%** o tempo gasto digitando mensagens operacionais e garante que a secretária bata a meta de resposta em até 15 minutos (bônus).
* **Esforço:** 🟢 **Baixo** (integração direta com o serviço do Gemini já existente).

---

### 3. 📅 Prevenção Ativa de "No-Show" (Faltas em Consultas)
* **Objetivo:** Acabar com buracos na agenda e horas ociosas da Dra. Isabela.
* **Como Funciona:**
  - O dashboard lista as consultas das próximas 24h e 48h.
  - Disparo de confirmação com 1 toque com opção de *"Confirmar presença"* ou *"Remarcar antecipadamente"*.
  - Em caso de cancelamento, a secretária visualiza uma **Fila de Espera** para preencher o horário vago imediatamente.
* **Ganho:** Recupera de 2 a 4 consultas por semana que seriam perdidas por falta de aviso do paciente.
* **Esforço:** 🟢 **Baixo**.

---

### 4. 🚨 Triagem de Alertas Clínicos Urgentes no Sino de Notificações
* **Objetivo:** Prioridade máxima para dúvidas de sintomas e adaptação alimentar.
* **Como Funciona:**
  - A automação identifica mensagens contendo termos como *"dor"*, *"passando mal"*, *"azia"*, *"diarreia"*, *"tontura no treino"* ou dúvidas de exames pré-operatórios.
  - O sino de notificações acende em vermelho com etiqueta de alerta prioritário para a Dra. Isabela responder antes de qualquer outra demanda.
* **Ganho:** Segurança clínica extrema para os pacientes e paz de espírito para a nutricionista.
* **Esforço:** 🟢 **Baixo**.

---

### 5. 💳 Gestão de Planos Recorrentes & Cobrança Automática (Stripe / PIX)
* **Objetivo:** Transformar consultas avulsas em receita mensal garantida (MRR).
* **Como Funciona:**
  - Criação de planos trimestrais e semestrais de acompanhamento (ex: R$ 380/mês no cartão de crédito com débito recorrente automático).
  - Painel de status financeiro: *Ativo, A Vencer, Inadimplente*.
* **Ganho:** Previsibilidade financeira mensal e fim da cobrança manual constrangedora por WhatsApp.
* **Esforço:** 🟡 **Médio** (usando o MCP do Stripe / Supabase já configurados).

---

### 6. 💊 Gerador de Prescrição de Suplementos com 1 Clique (PDF Timbrado)
* **Objetivo:** Agilidade no pós-consulta imediato.
* **Como Funciona:**
  - Tela simples com catálogo pré-configurado de suplementos (Creatina, Whey, Ômega-3, Magnésio, Enzimas, Probióticos, etc.) e dosagens habituais.
  - A Dra. seleciona os itens com checkboxes e clica em **"Gerar Receita PDF"**.
  - O PDF sai timbrado com logo, dados profissionais, CRN e link direto para compra em farmácias parceiras (com cupom da clínica).
* **Ganho:** Economiza de 15 a 20 minutos por consulta e abre oportunidade de **comissão/afiliação** com marcas parceiras.
* **Esforço:** 🟡 **Médio**.

---

### 7. 📲 Portal Web Interativo do Paciente (PWA com Link Seguro)
* **Objetivo:** Experiência VIP e percepção de valor altíssima para o paciente.
* **Como Funciona:**
  - Cada paciente recebe um link direto exclusivo (ex: `nutrisa.app/p/gabriela-carnielli`).
  - Ele abre no celular parecendo um app nativo, onde encontra:
    1. Gráfico interativo da sua evolução na balança/bioimpedância.
    2. Seu plano alimentar atualizado com lista de compras por corredor de supermercado.
    3. Lembretes de hidratação e horários de suplementos.
* **Ganho:** Fidelização imediata, efeito "boca a boca" (pacientes compartilham nas redes sociais) e justificativa para cobrar consultas com ticket mais alto.
* **Esforço:** 🟡 **Médio**.

---

### 8. 📈 Linha do Tempo Visual de Evolução Corporal 360°
* **Objetivo:** Mostrar ao paciente que o método da Dra. Isabela realmente funciona.
* **Como Funciona:**
  - Painel que cruza consultas anteriores e atuais (`physical_evaluations` e `antropometria`).
  - Gráfico comparativo de curvas: **Massa Magra subindo 📈 vs. % Gordura descendo 📉**.
  - Módulo de fotos "Antes & Depois" com comparação lado a lado ou efeito "slider".
* **Ganho:** Motivação total do paciente para continuar no acompanhamento a longo prazo.
* **Esforço:** 🟡 **Médio**.

---

### 9. 🤖 IA Co-Piloto de Cardápio Personalizado e Cálculo de Macros
* **Objetivo:** Reduzir drasticamente o tempo que a Dra. gasta elaborando planos alimentares.
* **Como Funciona:**
  - A IA cruza a TMB (da bioimpedância) + objetivo (hipertrofia, emagrecimento, etc.) + restrições da Anamnese (intolerância a lactose, vegetariano, rotina de trabalho).
  - Sugere uma estrutura de cardápio com opções de substituição automática e distribuição perfeita de macronutrientes (Proteínas, Gorduras, Carboidratos).
* **Ganho:** Economiza até **40 minutos de planejamento por paciente**, permitindo que a Dra. atenda mais clientes sem sobrecarga mental.
* **Esforço:** 🔴 **Alto**.

---

### 10. 📣 Campanhas de Reativação Segmentadas por WhatsApp
* **Objetivo:** Lotar a agenda em meses de baixa sazonalidade.
* **Como Funciona:**
  - Filtro inteligente por perfil de paciente (ex: *"Pacientes com foco em emagrecimento que não consultam há mais de 90 dias"* ou *"Atletas que precisam de ajuste pós-prova"*).
  - Geração de mensagens humanizadas em lote para envio cadenciado via WhatsApp.
* **Ganho:** Capacidade de gerar picos de receita e preencher horários ociosos sob demanda.
* **Esforço:** 🔴 **Alto**.

---

## 🏆 Recomendação de Execução Imediata (Top 3):
1. **Radar de Retornos (Item 01):** É dinheiro que já está na mesa hoje; basta um painel simples filtrando quem está há mais de 30 dias sem retorno.
2. **Sugerir Resposta com IA no Feed (Item 02):** Alivia a carga de trabalho diária da recepção imediatamente.
3. **Prevenção de No-Show (Item 03):** Garante que o tempo da Dra. Isabela não seja desperdiçado com faltas.
