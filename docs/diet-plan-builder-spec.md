# Especificação — Criador de Dietas em Etapas

## Objetivo

Criar uma ferramenta independente para a Dra. montar dietas com rapidez, controle profissional e reaproveitamento de conteúdo, sem alterar inicialmente agenda, CRM, anamnese ou avaliação corporal.

O módulo poderá funcionar com um paciente selecionado ou em modo rascunho. A ligação definitiva com o Patient 360 será feita posteriormente por `patient_id`.

## Fluxo da Dra.

```text
1. Paciente e objetivo
2. Anamnese e contexto
3. Metas nutricionais
4. Refeições
5. Alimentos e substituições
6. Recados e orientações
7. Revisão nutricional
8. Publicação e relatório
```

## Passo 1 — Paciente e objetivo

Campos iniciais:

- nome do paciente;
- objetivo: emagrecimento, hipertrofia, manutenção, performance ou personalizado;
- calorias-alvo;
- número de refeições;
- observações gerais;
- restrições e preferências conhecidas.

Nesta primeira versão, o cadastro pode ser simples e local ao módulo. O campo `patient_id` deve ser opcional para permitir a futura conexão com a base central.

## Passo 2 — Anamnese e contexto

A Dra. poderá:

- anexar PDF ou imagem da anamnese;
- colar o texto diretamente;
- selecionar uma anamnese já estruturada;
- iniciar sem anamnese.

A IA deverá extrair e organizar informações como:

- objetivo e rotina;
- horários disponíveis;
- preferências alimentares;
- alimentos rejeitados;
- alergias e intolerâncias;
- restrições culturais ou éticas;
- rotina de treino;
- refeições fora de casa;
- suplementos;
- observações relevantes.

O resultado deve aparecer para revisão e edição da Dra. antes de influenciar qualquer sugestão. A IA nunca deve publicar uma dieta automaticamente.

## Passo 3 — Metas nutricionais

A Dra. informa ou revisa:

- calorias totais;
- proteína em gramas ou percentual;
- carboidratos em gramas ou percentual;
- gorduras em gramas ou percentual;
- distribuição por refeição, em percentual ou valor manual.

O sistema deve mostrar imediatamente:

- meta total de calorias;
- meta de proteína, carboidrato e gordura;
- total atual da dieta;
- diferença entre meta e realizado.

## Passo 4 — Refeições

Cada refeição deve possuir:

- título editável;
- horário;
- observação própria;
- alimentos;
- substituições;
- total de calorias;
- total de proteína, carboidratos e gorduras.

A Dra. poderá adicionar, duplicar, reordenar, editar e excluir refeições.

Exemplos de títulos: Café da manhã, Pré-treino, Almoço, Lanche da tarde, Jantar e Ceia.

## Passo 5 — Alimentos e medidas

Cada alimento deve conter valores nutricionais padronizados por 100 g ou por unidade de referência:

- calorias;
- proteína;
- carboidratos;
- gorduras;
- fibras, quando disponível;
- unidade de referência;
- fonte dos dados.

Na dieta, a Dra. altera apenas:

- quantidade;
- unidade: gramas, mililitros, unidade, fatia, colher, xícara, concha etc.;
- medida caseira equivalente.

O sistema converte a medida para a base nutricional e recalcula automaticamente os totais.

## Banco de alimentos

O banco deve possuir:

- busca por nome;
- categorias;
- favoritos da Dra.;
- alimentos personalizados;
- sinônimos;
- medidas caseiras;
- fonte e data de atualização;
- status ativo/inativo.

A Dra. poderá cadastrar novos alimentos sem alterar os registros antigos. Alimentos usados em dietas publicadas devem manter um snapshot dos valores utilizados naquela versão.

## Substituições

Cada alimento poderá ter substituições cadastradas com:

- alimento substituto;
- quantidade equivalente;
- unidade;
- observação;
- grupo de equivalência;
- opção de substituição livre ou recomendada.

Exemplo: arroz branco, arroz integral, batata e mandioca podem pertencer a um grupo de carboidratos, mas a equivalência deve ser definida e revisável pela Dra.

## Gráfico de acompanhamento

O editor deve exibir uma barra ou gráfico comparando meta e realizado:

- calorias;
- proteína;
- carboidratos;
- gorduras.

O gráfico deve atualizar a cada alteração de quantidade, alimento ou refeição. Deve destacar excesso e insuficiência sem bloquear a edição.

## Sugestões com IA

A IA poderá sugerir uma refeição individualmente com base em:

- metas restantes do dia;
- contexto da anamnese;
- refeições já montadas;
- preferências e restrições;
- banco interno de alimentos;
- fontes externas aprovadas, quando necessário.

As sugestões devem retornar alimentos, quantidades, macros estimados e justificativa curta. A Dra. escolhe, ajusta ou rejeita a sugestão.

Busca externa deve ser usada apenas como apoio para encontrar informações ausentes. O valor nutricional utilizado precisa ser confirmado ou salvo como alimento pendente de revisão. A fonte consultada deve ser registrada.

## Recados e orientações

O relatório deve permitir adicionar recados:

- antes da dieta;
- entre refeições;
- ao final;
- vinculados a uma refeição específica.

Exemplos: hidratação, horário de treino, preparo, observações sobre substituições e orientações gerais.

## Passo 6 — Revisão

Antes de publicar, exibir:

- resumo do paciente;
- metas configuradas;
- totais da dieta;
- diferença entre meta e realizado;
- refeições e horários;
- substituições;
- recados;
- alimentos personalizados ou pendentes de confirmação.

Status: `rascunho`, `em_revisao`, `publicada`, `arquivada`.

Uma dieta publicada não deve ser sobrescrita. Alterações criam uma nova versão.

## Passo 7 — Relatório

O relatório deve reutilizar o padrão visual existente de laudos e contratos:

- cabeçalho com logo e dados profissionais;
- identificação do paciente;
- objetivo e metas;
- gráfico de calorias e macros;
- refeições com horário, alimentos, quantidades e totais;
- substituições;
- recados intermediários;
- orientações finais;
- rodapé, CRN, contato e paginação;
- layout próprio para impressão e PDF.

O relatório deve ter um modelo de impressão separado do editor, como já ocorre nos laudos.

## Modelo inicial de dados

```text
diet_drafts
  id, patient_id, title, objective, target_calories,
  target_protein, target_carbs, target_fat,
  status, anamnesis_context, notes, created_at, updated_at

diet_meals
  id, diet_id, title, time, position, notes

diet_meal_items
  id, meal_id, food_id, quantity, unit,
  household_measure, nutrition_snapshot, position

diet_substitutions
  id, meal_item_id, food_id, quantity, unit, notes

foods
  id, name, category, nutrition_per_100g,
  household_measures, source, is_custom, is_active

diet_notes
  id, diet_id, meal_id, placement, content, position

diet_versions
  id, diet_id, version_number, status,
  published_at, created_by, content_snapshot
```

## Implementação sem quebrar o sistema atual

1. Criar `features/dietas` isolada.
2. Começar com dados locais ou uma camada de serviço própria.
3. Não alterar as telas atuais de avaliação, anamnese, agenda ou conversas.
4. Reutilizar componentes visuais de laudo, cabeçalho, rodapé e impressão.
5. Permitir exportar o relatório sem exigir CRM.
6. Introduzir `patient_id` opcional desde o início.
7. Depois conectar o módulo ao cadastro central e ao Patient 360.

## Ordem recomendada de entrega

### MVP 1

- editor em etapas;
- refeições e alimentos;
- cálculo de macros;
- duplicar/excluir/reordenar;
- banco inicial de alimentos;
- relatório PDF.

### MVP 2

- substituições;
- alimentos personalizados;
- medidas caseiras;
- versões e histórico;
- recados intermediários;
- duplicar dieta anterior.

### MVP 3

- importação de PDF/texto de anamnese;
- estruturação por IA;
- sugestões de refeições;
- busca externa controlada;
- revisão e auditoria das fontes.

### Integração posterior

- vincular ao `patients` do Patient 360;
- exibir dietas na timeline;
- compartilhar no portal do paciente;
- relacionar dieta à consulta e ao plano contratado.

## Critérios de pronto

- A Dra. consegue criar uma dieta sem abrir o WebDiet.
- Totais de cada refeição e da dieta são recalculados corretamente.
- O banco permite cadastrar alimento novo e medidas caseiras.
- Uma dieta publicada permanece preservada no histórico.
- O PDF mantém o padrão visual atual da NutrIsa.
- A IA apenas sugere e estrutura; a publicação depende da Dra.
- O módulo funciona mesmo sem o CRM estar implementado.

## Limites obrigatórios da implementação

Esta seção deve ser lida antes de qualquer alteração no código.

### Escopo permitido nesta fase

- Criar apenas o módulo de dietas e seus serviços, componentes, domínio e estilos próprios.
- Reutilizar componentes compartilhados existentes quando isso não alterar seu comportamento.
- Adicionar somente as dependências estritamente necessárias.
- Atualizar os contratos e a documentação relacionados ao novo módulo.

### Fora do escopo

- Não reescrever `App`, navegação global ou layout inteiro.
- Não alterar regras da agenda, Google Calendar, WhatsApp, notificações, contratos ou avaliação corporal.
- Não substituir a anamnese atual; a importação de anamnese será uma entrada opcional do editor.
- Não implementar CRM, portal do paciente, cobrança ou sincronização com WebDiet nesta fase.
- Não fazer migração destrutiva nem remover dados ou funcionalidades existentes.

### Organização esperada do código

```text
app/src/features/dietas/
├── DietasPage.jsx
├── components/
├── domain/
├── hooks/
├── services/
└── report/
```

Responsabilidades:

- `domain/`: regras puras de cálculo, conversão de medidas, macros e validações;
- `services/`: persistência, banco de alimentos, importação e IA;
- `hooks/`: estado do editor e fluxo entre etapas;
- `components/`: interface do editor;
- `report/`: layout de impressão e PDF, reutilizando o padrão visual existente.

### Persistência e compatibilidade

- O MVP pode começar com um serviço de persistência isolado, mas não deve espalhar `localStorage` ou chamadas de banco pelos componentes.
- Toda dieta deve ter um identificador próprio e uma versão.
- O conteúdo nutricional usado na dieta deve ser salvo como snapshot para que alterações futuras no banco de alimentos não mudem dietas antigas.
- `patient_id` deve ser opcional e não pode exigir a implementação do CRM.
- Operações de salvar, duplicar, publicar e arquivar devem ser idempotentes.

### IA e busca externa

- A IA deve receber dados estruturados e retornar JSON validado por schema.
- Respostas inválidas, incompletas ou sem fonte não podem entrar diretamente na dieta.
- Sugestões devem aparecer como rascunho editável.
- A IA não pode publicar, apagar ou alterar uma dieta sem ação explícita da Dra.
- Busca externa deve ser encapsulada em serviço próprio, com fonte registrada e revisão humana.
- A aplicação deve continuar funcionando se a IA ou a busca externa estiverem indisponíveis.

### Testes obrigatórios

Adicionar ou atualizar testes para:

- cálculo de calorias e macronutrientes;
- conversão entre gramas, mililitros, unidade e medidas caseiras;
- soma por refeição e por dieta;
- duplicação e exclusão de alimentos e refeições;
- substituições;
- versionamento e snapshot nutricional;
- validação de respostas da IA;
- importação de texto e falha segura de PDF;
- geração dos dados usados no relatório;
- regressão dos testes atuais da aplicação.

### Documentação obrigatória ao finalizar

- Atualizar `README.md` com o novo módulo e comandos, se houver mudança.
- Atualizar `docs/data-contracts.md` se houver persistência ou contrato novo.
- Criar ou atualizar `docs/reference/diet-plan-builder.md` com regras de alimentos, medidas, macros e estados.
- Atualizar `docs/testing.md` com os cenários adicionados.
- Registrar variáveis de ambiente novas em `.env.example` e na documentação.
- Verificar links e executar lint, testes e build antes de concluir.

### Critério de não regressão

O trabalho só deve ser considerado concluído se o Criador de Dietas funcionar isoladamente e os fluxos existentes de avaliação, anamnese, agenda, notificações, conversas e contratos continuarem passando pelos testes e pelo build sem alteração de comportamento não documentada.
