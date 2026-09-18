# Categorias e Status do Google Calendar

Documentação de referência para o mapeamento das categorias e status de eventos
usado em `app/src/features/agenda/domain/calendarMapper.js`.

## Categorias (tipo de consulta)

Cada evento do Google Calendar é classificado por categoria com base no seu **Color ID**
(campo `colorId` da API do Google Calendar).

| Color ID | Cor Google | Categoria NutrIsa | Cor de Exibição |
|----------|-----------|-------------------|-----------------|
| `1`  | Lavender  | Online            | `#1bb3c8` (ciano) |
| `2`  | Sage      | Primeira vez      | `#2ecc71` (verde) |
| `3`  | Grape     | Permuta           | `#8e24aa` (roxo) |
| `4`  | Flamingo  | Presencial        | `#dc66aa` (rosa) |
| `5`  | Banana    | Encaixe           | `#c86422` (laranja escuro) |
| `6`  | Tangerine | Em grupo          | `#f6821f` (laranja) |
| `7`  | Peacock   | Online            | `#1bb3c8` (ciano) |
| `8`  | Graphite  | Pacote            | `#767676` (cinza) |
| `9`  | Blueberry | Pessoal           | `#1e75bb` (azul) |
| `10` | Basil     | Antropometria     | `#2e7d32` (verde escuro) |
| `11` | Tomato    | Retorno           | `#f25c38` (vermelho/laranja) |
| `—`  | (padrão)  | Consulta          | `#1bb3c8` (ciano) |

> **Nota:** Para eventos sem `colorId`, a categoria padrão é **Consulta (Online)**.

## Status de confirmação

O status de um evento é determinado a partir de palavras-chave no **título** ou na **descrição** do evento.

| Status | Identificadores no texto | Cor da borda |
|--------|--------------------------|--------------|
| `confirmado`  | `confirmado`, `✅` | `#00d2a0` (verde menta) |
| `a_confirmar` | `não confirmado`, `a confirmar` | `#9ca3af` (cinza) |
| `desmarcado`  | `desmarcado`, `cancelado`, `❌` | `#ef4444` (vermelho) |

> **Padrão:** Eventos sem palavra-chave de status são classificados como **À confirmar**.

## Criação e Edição de Eventos

A interface permite criar novos agendamentos clicando diretamente nos horários da grade semanal/mensal ou através do botão **Novo Agendamento**.

- **Criação direta:** O evento é criado via `POST` na API do Google Calendar (`createCalendarEvent`), definindo data, horário, `colorId` correspondente ao tipo de consulta WebDiet e status no resumo/descrição.
- **Edição:** Alterações em eventos existentes são sincronizadas diretamente via `PATCH` na API do Google Calendar (`updateCalendarEvent`).

## Confirmação e Desmarcação Assistida via WhatsApp

O serviço `appointmentMatcher.js` analisa as mensagens recebidas do WhatsApp para detectar intenções de confirmação de presença (ex: *"Sim"*, *"Confirmo"*, *"Estarei lá"*) ou de cancelamento/remarcação (ex: *"Não vou conseguir"*, *"Preciso remarcar"*, *"Pode desmarcar"*):
- Cruza o nome do contato com os agendamentos futuros (janela de D+0 a D+7).
- Gera alertas no **Sino de Notificações** com botão de 1 clique:
  - Confirmação: *"Confirmar na Agenda"* (Tag `[CONFIRMADO]`, borda Verde Menta `#00d2a0`).
  - Desmarcação: *"Marcar como Desmarcado (Vermelho)"* (Tag `[DESMARCADO]`, borda Vermelha `#ef4444`).
- Exibe banner inteligente e botões dedicados no **Modal de Atendimento WhatsApp** (`WhatsAppFeedTable`).
- Ao acionar a ação, aplica a respectiva tag no Google Calendar via API (`updateCalendarEvent`), sincronizando a agenda em tempo real e liberando o horário para encaixes e remarcações.

## Referências

- [Documentação da API do Google Calendar — Colors](https://developers.google.com/calendar/api/v3/reference/colors/get)
- [Documentação da API do Google Calendar — Events](https://developers.google.com/calendar/api/v3/reference/events)
- [`calendarMapper.js`](../../app/src/features/agenda/domain/calendarMapper.js)
- [`calendar.js`](../../app/src/features/agenda/services/calendar.js)
- [`appointmentMatcher.js`](../../app/src/features/agenda/services/appointmentMatcher.js)

