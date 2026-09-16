# Guia de Desenvolvimento

## Pré-requisitos

- Node.js >= 18
- npm >= 9

## Estrutura do Repositório

```
NutrIsa/
├── api/           # Serverless function (Vercel)
├── server/ai/     # Lógica de backend: models, validation, providers
├── app/           # Frontend Vite + React
├── docs/          # Documentação do projeto
├── tests/         # Testes unitários e e2e
└── workflows/     # Tipos de workflows n8n
```

## Setup Local

```bash
# 1. Variáveis de ambiente (raiz)
cp .env.example .env
# Preencha GEMINI_API_KEY e demais variáveis

# 2. Variáveis de ambiente (frontend)
cp app/.env.example app/.env
# Preencha VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY etc.

# 3. Instalar dependências
npm install
cd app && npm install
cd ..

# 4. Subir o servidor de desenvolvimento
npm run dev
```

O script `npm run dev` na raiz executa o servidor de API local (`server/devApi.js`)
em paralelo com o Vite (`app/`).

## Scripts disponíveis (raiz)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API local + Vite dev server |
| `npm test` | Testes unitários (Vitest) |

## Scripts disponíveis (app/)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Vite dev server |
| `npm run build` | Build de produção |
| `npm run lint` | OXLint |

## Fluxo de dados

```
Browser → shared/services/aiClient.js → /api/ai (Vercel)
                                          → server/ai/service.js
                                            → server/ai/validation.js
                                            → server/ai/providers/gemini.js
```

## Adicionando uma feature nova

1. Criar pasta em `app/src/features/<nome>/`
2. Seguir a estrutura: `components/`, `hooks/`, `services/`, `domain/`, `prompts/`
3. Código compartilhado por mais de uma feature → `app/src/shared/`
4. Registrar a rota no `App.jsx` (array `MODES` e `pages`)

## Variáveis de ambiente

Ver [`.env.example`](../.env.example) (raiz) e [`app/.env.example`](../app/.env.example).
Centralizado no frontend em [`app/src/config/env.js`](../app/src/config/env.js).

## Testes

```bash
npm test                   # Todos os testes unitários
npm test tests/unit/domain # Apenas testes de domínio
```

Ver [`docs/testing.md`](./testing.md) para mais detalhes.
