---
description: Mantém docs/reference/ e README.md sincronizados após alterações relevantes
trigger: always_on
---

# Regra de Sincronização de Documentação e Referências

Sempre que forem realizadas alterações relevantes na plataforma NutrIsa, você DEVE revisar e manter sincronizados:

1. **`docs/reference/`**:
   - `docs/reference/calendar-categories.md`: se houver alterações no mapeamento de categorias, cores, status ou lógica de agenda.
   - Criar ou atualizar referências em `docs/reference/` para novas regras de domínio, contratos de dados, variáveis de anamnese ou integrações de IA.
2. **`README.md`**:
   - Manter a tabela de "Onde editar", comandos e links de documentação perfeitamente alinhados com o estado real do projeto.

Consulte a skill `sync-docs-reference` sempre que precisar do checklist detalhado.
