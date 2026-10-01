# Referência — Criador e Editor de Dietas (Diet Plan Builder)

Este documento define a arquitetura, regras de domínio nutricional, contratos de dados no Supabase e fluxos operacionais da ferramenta de montagem de dietas (`app/src/features/dietas`).

---

## 1. Propósito e Visão Geral

Permitir que a nutricionista monte planos alimentares completos e personalizados com:
- **Painel unificado e monitoramento de macronutrientes em tempo real**: comparação instantânea entre metas estabelecidas (calorias, proteína, carboidratos, gorduras) e o total acumulado pelos alimentos prescritos;
- **Base de Alimentos TACO / IBGE Integrada**: tabela brasileira oficial com mais de 70 alimentos básicos cadastrados e suporte a medidas caseiras (colheres de sopa, xícaras, conchas, fatias, unidades);
- **Sincronização Nuvem (Supabase) + Funcionamento Offline**: dados sincronizados na tabela `public.foods` e `public.plano_alimentar`, com fallback instantâneo e auto-save em cache local (`localStorage`);
- **Impressão e Laudo PDF no Padrão NutrIsa**: página A4 diagramada para entrega direta ao paciente, com logo, dados do consultório, cabeçalho clínico, orientações de hidratação e assinatura digital.

---

## 2. Estrutura de Arquivos

```text
app/src/features/dietas/
├── DietasPage.jsx                      # Página controladora com navegação por abas
├── components/
│   ├── TargetMacrosBar.jsx             # Barra no topo com barras de progresso ao vivo
│   ├── FloatingMacrosFooter.jsx        # Rodapé flutuante exibido automaticamente ao rolar a página
│   ├── MealCard.jsx                    # Card de refeição com horários, alimentos e medidas
│   ├── FoodSearchModal.jsx             # Modal de busca rápida e filtro por categoria
│   ├── CustomFoodModal.jsx             # Modal para cadastrar novo alimento com medidas caseiras
│   ├── DietConfigSection.jsx           # Configuração de paciente e metas nutricionais (presets)
│   ├── DietHistoryModal.jsx            # Histórico de modelos e dietas salvas no Supabase
│   └── NotesSection.jsx                # Hidratação (ml/dia) e orientações complementares
├── domain/
│   ├── nutritionCalculations.js        # Cálculo de calorias, macros, percentuais e metas
│   ├── measureConversions.js           # Conversão entre medidas caseiras e gramas
│   └── dietValidators.js               # Sanitização de planos, refeições e itens
├── hooks/
│   └── useDietPlan.js                  # Gerenciamento de estado, auto-save e ações
├── services/
│   ├── foodService.js                  # Consulta a Supabase / TACO e favoritos
│   └── dietStorageService.js           # Persistência de planos no Supabase e local
├── data/
│   ├── tacoFoods.js                    # Base TACO/IBGE inicial embutida (offline-first)
│   └── demoDietData.js                 # Gerador de plano demonstrativo completo (5 refeições, macros e TACO)
└── report/
    └── DietReport.jsx                  # Layout A4 de impressão e exportação em PDF
```

---

## 3. Modelo de Dados e Persistência no Supabase

### 3.1. Tabela `public.foods`
Armazena a biblioteca de alimentos compartilhada (TACO + alimentos personalizados cadastrados pela Dra.):

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `UUID` (PK) | Identificador único (`gen_random_uuid()`) |
| `name` | `TEXT` | Nome do alimento (ex: 'Peito de frango grelhado') |
| `category` | `TEXT` | Categoria nutricional (ex: 'Carnes e Ovos', 'Frutas', etc.) |
| `calories` | `NUMERIC` | Calorias base por 100g |
| `protein` | `NUMERIC` | Proteínas (g) por 100g |
| `carbs` | `NUMERIC` | Carboidratos (g) por 100g |
| `fat` | `NUMERIC` | Gorduras (g) por 100g |
| `fiber` | `NUMERIC` | Fibras (g) por 100g |
| `portion_base_grams` | `NUMERIC` | Base de referência (padrão: 100g) |
| `household_measures` | `JSONB` | Array de medidas: `[{"name": "Colher de sopa", "grams": 25}]` |
| `source` | `TEXT` | Origem do dado ('TACO', 'IBGE', 'Personalizado') |
| `is_custom` | `BOOLEAN` | `true` se cadastrado manualmente pela nutricionista |
| `is_active` | `BOOLEAN` | Status de ativação |

### 3.2. Tabela `public.plano_alimentar`
Armazena o plano alimentar estruturado:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `UUID` (PK) | Identificador do plano |
| `patient_id` | `UUID` (nullable) | Vínculo opcional com `patients` (compatível com Patient 360) |
| `title` | `TEXT` | Título da prescrição (ex: 'Plano Alimentar - Fase 1') |
| `description` | `TEXT` | Resumo de objetivo e calorias |
| `status` | `TEXT` | Status: `'rascunho'` ou `'publicada'` |
| `content` | `JSONB` | Snapshot completo da dieta (refeições, itens, medidas, snapshots nutricionais e orientações) |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | Carimbo de data/hora |

---

## 4. Regras de Domínio e Cálculos Nutricionais

1. **Conversão de Medida Caseira para Gramas**:
   $$\text{gramas} = \text{quantidade} \times \text{gramas\_por\_medida}$$
2. **Cálculo Nutricional do Item (Snapshot Imutável)**:
   $$\text{fator} = \frac{\text{gramas}}{100}$$
   $$\text{kcal} = \text{kcal}_{100g} \times \text{fator}$$
   $$\text{prot} = \text{prot}_{100g} \times \text{fator}$$
   $$\text{carb} = \text{carb}_{100g} \times \text{fator}$$
   $$\text{gord} = \text{gord}_{100g} \times \text{fator}$$
3. **Distribuição Percentual Calórica**:
   - Proteína: 4 kcal por grama;
   - Carboidrato: 4 kcal por grama;
   - Gordura: 9 kcal por grama;
   $$\%_{\text{macro}} = \frac{\text{g}_{\text{macro}} \times \text{densidade}}{\text{Total kcal}} \times 100$$
4. **Comparativo Meta x Realizado**:
   - Status de conformidade considerado ideal entre 95% e 105% da meta;
   - Diferença ($\text{realizado} - \text{meta}$) exibida em gramas e calorias.

---

## 5. Testes Automatizados

O módulo possui suite de testes unitários em [`tests/unit/dietPlan.test.js`](file:///e:/Antigravity/NutrIsa/tests/unit/dietPlan.test.js):
- Conversão de medidas caseiras e gramas;
- Cálculo do snapshot nutricional por alimento;
- Soma cumulativa de refeições e dieta;
- Distribuição percentual dos macronutrientes;
- Comparativo de alvos e diferenças;
- Sanitização de planos e refeições com defaults;
- Duplicação segura e isolamento de planos.
