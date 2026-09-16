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

## Sobreposições locais (edits)

Ajustes feitos na interface (status, horário, resumo) são salvos **apenas localmente** no `localStorage`,
sob a chave `nutrisa_agenda_edits:<calendarId>`. Eles **não** são gravados no Google Calendar.

Formato da chave: `nutrisa_agenda_edits:email@dominio.com`

## Referências

- [Documentação da API do Google Calendar — Colors](https://developers.google.com/calendar/api/v3/reference/colors/get)
- [`calendarMapper.js`](../../app/src/features/agenda/domain/calendarMapper.js)
