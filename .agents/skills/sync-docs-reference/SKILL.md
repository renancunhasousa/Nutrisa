---
name: sync-docs-reference
test-policy: Toda nova funcionalidade ou alteraÃ§Ã£o de comportamento deve incluir testes automatizados novos ou atualizados; executar os testes pertinentes antes de concluir.
description: >-
  Mantém sincronizados e atualizados os arquivos de referência em docs/reference/
  e a documentação principal em README.md sempre que houver alterações relevantes
  no código, contratos de dados, rotas, variáveis de ambiente ou funcionalidades da NutrIsa.
---

# Sincronização Contínua de Referência e README

Esta skill estabelece o fluxo obrigatório para garantir que a documentação técnica em `docs/reference/` e o arquivo raiz `README.md` reflitam fielmente o estado real da plataforma NutrIsa.

---

## 🎯 Quando Acionar

Execute este procedimento sempre que houver:
1. **Novas features ou páginas** adicionadas à plataforma.
2. **Alterações de arquitetura** ou reorganização de pastas/arquivos no frontend (`app/src/features/*`) ou backend (`server/*`, `api/*`).
3. **Novas variáveis de ambiente** ou alteração no `.env` / `.env.example`.
4. **Alterações em contratos de domínio/dados**:
   - Categorias, cores ou status da Agenda (`calendarMapper.js` -> `docs/reference/calendar-categories.md`).
   - Mapeamento ou variáveis de Anamnese (`variables.js`, prompts -> `docs/reference/`).
   - Parâmetros e cálculos de Avaliação e Bioimpedância.
   - Modelos e integrações de IA suportados (`server/ai/models.js`, rotas `/api/ai`).
5. **Mudança de comandos** de build, execução ou testes (`package.json`).

---

## 📂 O que manter em `docs/reference/`

A pasta `docs/reference/` deve conter referências funcionais e de domínio claras:

- **`calendar-categories.md`**:
  - Mapeamento completo de `colorId`, cores visuais, nomenclaturas de categoria e palavras-chave de status (`confirmado`, `desmarcado`, etc.).
  - Chaves de persistência local (`localStorage`).
  - Fontes e links para o código em `app/src/features/agenda/domain/calendarMapper.js`.

- **Novos arquivos de referência sob demanda**:
  - Se for criado ou alterado um domínio complexo (ex: métricas de exames, contratos de webhook de atendimento WhatsApp, variáveis dinâmicas de anamnese), crie ou atualize o respectivo arquivo `docs/reference/<tema>.md`.
  - Arquivos de protótipos legados (como `anamnese-prototype.jsx.txt`) devem ser preservados como arquivo histórico/referência bruta, mas referenciados pelo seu correspondente ativo.

---

## 📝 O que atualizar em `README.md`

Ao revisar o `README.md`, valide e atualize:
1. **Tabela "Onde editar"**:
   - Garanta que qualquer novo módulo, feature ou pasta relevante esteja listado com seu caminho exato.
2. **Comandos de execução e teste**:
   - Garanta que os comandos para rodar o app, testes e builds estejam idênticos ao `package.json`.
3. **Seção de Documentação**:
   - Links para novos documentos em `docs/` e `docs/reference/`.
4. **Requisitos de ambiente e tecnologias**:
   - Versões mínimas de Node.js, integrações ativas (Supabase, Google Calendar, Gemini, WhatsApp).

---

## 🔄 Checklist de Execução

Ao finalizar qualquer ciclo de desenvolvimento relevante:

- [ ] 1. Identificar arquivos alterados com impacto em arquitetura, domínio ou configuração.
- [ ] 2. Se afetou a Agenda/Categorias: Atualizar `docs/reference/calendar-categories.md`.
- [ ] 3. Se afetou outro domínio central: Criar ou atualizar `docs/reference/<dominio>.md`.
- [ ] 4. Atualizar a tabela de diretórios e links em `README.md`.
- [ ] 5. Confirmar que não há links quebrados entre `README.md` e a pasta `docs/`.
