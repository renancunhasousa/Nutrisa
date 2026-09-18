# 📋 Checklist de Tarefas e Execução NutrIsa

> **Visão de Ação Rápida:** Use este documento para acompanhar o progresso das tarefas diárias, marcar o que já foi feito (`[x]`) e visualizar imediatamente os próximos passos.
> Para entender regras de negócio, tabelas do Supabase e o racional financeiro de cada item, consulte o **[Roadmap Master](roadmap.md)**.

---

## ⚡ Próximos Passos Imediatos (Quick Wins de Alto Impacto)

Ações de baixo esforço e retorno financeiro/operacional imediato:

- [ ] **1. Radar de Retornos no WhatsApp** — Criar listagem/filtro de pacientes a mais de 35 dias sem agendamento e botão de 1 clique para WhatsApp.
- [ ] **2. Co-Piloto de Resposta Rápida (IA)** — Inserir botão *"✨ Sugerir Resposta"* com Gemini dentro do modal de conversa do WhatsApp.
- [ ] **3. Alerta de Sintomas Urgentes no Sino** — Detectar palavras-chave (*"azia"*, *"diarreia"*, *"tontura"*, *"estômago"*) em `log_conversas` e acender o sino.
- [ ] **4. Alerta de SLA (> 1 hora)** — Destacar no sino mensagens recebidas que estão há mais de 60 minutos sem resposta da recepção.
- [ ] **5. Filtro de No-Show pela Borda Cinza** — Filtrar a agenda do dia seguinte para disparar confirmações apenas para quem está com borda Cinza ("À confirmar").

---

## 🔒 Fase 0: Segurança, RLS e Fundação de Dados

Garante conformidade antes do tráfego de dados reais de saúde:

- [ ] **Revisão de RLS no Supabase:**
  - [ ] Ativar Row Level Security nas tabelas de saúde (`patients`, `physical_evaluations`, `antropometria`, `plano_alimentar`, `log_conversas`).
  - [ ] Criar políticas de acesso isolando dados por profissional/clínica.
- [ ] **Padronização de Auditoria:**
  - [ ] Garantir campos `created_at`, `updated_at`, `created_by` e `patient_id` nas tabelas principais.
- [ ] **Segurança de Chaves:**
  - [ ] Assegurar que nenhuma chave privada de IA (`GEMINI_API_KEY`) seja injetada no bundle do frontend.

---

## 👤 Fase 1: Patient 360 & Linha do Tempo de Evolução

Transforma o prontuário em uma experiência visual para fidelizar pacientes:

- [ ] **Ficha Unificada do Paciente:**
  - [ ] Tela de perfil do paciente com dados cadastrais, última consulta e status do plano.
  - [ ] Aba de histórico unificado de interações e consultas.
- [ ] **Evolução Corporal 360°:**
  - [ ] Gráfico comparativo de bioimpedância (evolução de massa magra kg, % gordura e AIC).
  - [ ] Comparador de medidas antropométricas e dobras cutâneas entre consultas.
- [ ] **Fotos de Avaliação "Antes & Depois":**
  - [ ] Bucket seguro no Supabase Storage para fotos de evolução.
  - [ ] Visualizador comparativo lado a lado para exibição em consulta.
- [ ] **Laudo Visual 1-Page:**
  - [ ] Exportação do gráfico de evolução e métricas em PDF de 1 página timbrado.

---

## 💬 Fase 2: CRM de Relacionamento & WhatsApp Inteligente

Automatiza o atendimento da recepção e acolhe sintomas clínicos:

- [ ] **Vínculo Paciente ↔ WhatsApp:**
  - [ ] Associação automática entre número de telefone do WhatsApp e ID do paciente.
  - [ ] Botão na conversa para abrir a ficha do paciente diretamente.
- [ ] **Triagem Inteligente no Sino de Notificações:**
  - [ ] Classificação automática de mensagens em `administrativa`, `dúvida_comum` e `urgência_clínica`.
  - [ ] Notificação visual destacada no sino para mensagens com sintomas adversos.
- [ ] **SLA de Atendimento da Recepção:**
  - [ ] Contador de tempo de espera e alerta visual quando ultrapassar 60 minutos sem resposta.
- [ ] **Assistente de Resposta com IA:**
  - [ ] Prompt no Gemini treinado com tom acolhedor e condutas gerais do consultório.
  - [ ] Botão de copiar ou disparar direto no WhatsApp Web.

---

## 📅 Fase 3: Agenda Inteligente & Prevenção de No-Show

Zera horários ociosos utilizando a legenda oficial de cores do WebDiet / Google Calendar:

- [ ] **Disparo de Confirmação Cirúrgico:**
  - [ ] Leitura da agenda de D+1 filtrando apenas eventos com **borda Cinza ("À confirmar")**.
  - [ ] Mensagens automáticas personalizadas pelo tipo de consulta:
    - [ ] *Rosa Claro (Presencial):* Endereço, mapa e dicas de estacionamento.
    - [ ] *Azul Ciano (Online):* Link da sala do Google Meet.
    - [ ] *Verde Claro (Primeira Vez):* Envio de link de pré-anamnese.
    - [ ] *Verde Escuro (Antropometria):* Instruções de vestimenta e jejum.
- [x] **Confirmação Assistida via WhatsApp & Notificações:**
  - [x] Detecção inteligente de intenção de confirmação de presença (`appointmentMatcher.js`).
  - [x] Cruzamento automático do nome do paciente com a Google Agenda (janela D+0 a D+7).
  - [x] Notificações com botão de 1 clique no Sino (`NotificationPopover`) para confirmar direto na agenda.
  - [x] Card de identificação e confirmação de presença no Modal de Atendimento WhatsApp (`WhatsAppFeedTable`).
- [ ] **Radar de Encaixes Imediatos:**
  - [ ] Ao detectar evento com **borda Vermelha ("Desmarcado")**, alertar recepção com opções de lista de espera.
- [ ] **Ignorar Bloqueios Pessoais:**
  - [ ] Tratamento do evento **Azul Petróleo (Pessoal)** como privado, sem envio de notificações.

---

## 🥗 Fase 4: WebDiet Clínico, Cardápios & Prescrição Timbrada

Acelera a montagem de condutas e receitas no pós-consulta:

- [ ] **Cálculo Energético & Macros:**
  - [ ] Cálculo automático de TMB e GET baseado nos dados da bioimpedância.
  - [ ] Sugestão de divisão de macros (Proteína, Carboidrato e Lipídios) por refeição.
- [ ] **IA Co-Piloto de Cardápio:**
  - [ ] Geração de cardápio base combinando preferências da anamnese e metas calóricas.
  - [ ] Tabela de substituições inteligentes para o paciente variar os pratos.
  - [ ] Versionamento do plano alimentar (`rascunho` ➡️ `publicado` ➡️ `arquivado`).
- [ ] **Gerador Rápido de Prescrição de Suplementos (PDF):**
  - [ ] Interface rápida com checkboxes para suplementos padrão (Creatina, Whey, Ômega-3, Magnésio, etc.).
  - [ ] Layout de impressão com CRN da Dra. Isabela, instruções de consumo e cupom parceiro.

---

## 📱 Fase 5: Portal Web Interativo do Paciente (PWA)

Substitui PDFs soltos por um aplicativo leve no celular do paciente:

- [ ] **Acesso Simplificado e Seguro:**
  - [ ] Acesso via link exclusivo (`nutrisa.app/p/[slug]`) autenticado por token ou código no WhatsApp.
- [ ] **Painel do Paciente:**
  - [ ] Visualização do cardápio do dia e lista de compras da semana.
  - [ ] Acompanhamento da evolução corporal (gráfico de perda de gordura / ganho de massa).
  - [ ] Prescrição de suplementos acessível em 1 toque.
  - [ ] Lembretes de hidratação e contagem regressiva para a próxima consulta.

---

## 💳 Fase 6: Gestão Financeira & Planos Recorrentes (MRR)

Garante estabilidade e previsibilidade de caixa:

- [ ] **Gestão da Categoria "Pacote" (Cinza):**
  - [ ] Controle de vigência de planos trimestrais e semestrais.
  - [ ] Alertas de parcelas pagas, pendentes e vencidas.
- [ ] **Cobrança Recorrente (Stripe/Pix):**
  - [ ] Integração com gateway para débito recorrente no cartão ou Pix agendado.
- [ ] **Campanhas de Reativação:**
  - [ ] Filtro de pacientes sem consulta há mais de 90 dias para disparos segmentados em períodos de baixa demanda.
