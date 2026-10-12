# Catálogo Nutricional — Alimentos e Produtos

## Objetivo

O módulo `Alimentos e produtos` é a base nutricional central da clínica. Ele reúne alimentos, preparações, produtos industrializados, suplementos e bebidas. Itens verificados podem ser disponibilizados diretamente no criador de dietas.

Na navegação lateral o módulo aparece como **Cadastros**. O nome curto representa o ponto central de manutenção desses itens.

## Fluxo funcional

1. A profissional abre `#produtos`, escolhe **Cadastrar item** e define o tipo do cadastro.
2. Informa o código de barras e escolhe **Buscar código**. O frontend consulta primeiro o catálogo da clínica e, se necessário, chama `GET /api/products?barcode=...` para consultar o Open Food Facts. Esse caminho não usa Gemini.
3. Se o produto não for encontrado, a profissional pode preencher tudo manualmente ou escolher uma imagem da tabela nutricional.
4. A imagem também pode ser copiada diretamente de um anúncio: com o formulário aberto, basta clicar em **Clique aqui e pressione Ctrl+V** e colar a imagem da área de transferência.
5. **Interpretar imagem com IA** envia somente a imagem preparada para `/api/ai`. Não há busca por nome, pesquisa web, leitura de página ou abertura de link.
6. Todo resultado externo entra como `draft`. A profissional revisa porção, macros, ingredientes e alérgenos antes de salvar ou marcar como verificado.
7. Somente registros `verified` com `is_available_for_diets = true` aparecem na busca de alimentos da dieta.
8. O botão **Criar alimento** dentro da busca da dieta usa o mesmo `product_catalog`: salva um alimento verificado da organização, atualiza a busca e o adiciona imediatamente à refeição. Ele não grava mais na tabela legada quando há uma sessão válida.

## Contrato de dados

As migrations `create_product_catalog` e `unify_nutrition_catalog` mantêm `public.product_catalog`. O registro contém:

- identificação: nome, marca, categoria e código de barras;
- porção e macros principais: energia, proteínas, carboidratos, gorduras, fibras e sódio;
- nutrientes adicionais em `nutrition_facts`, no formato `{ name, amount, unit }`;
- ingredientes, alérgenos, descrição e imagem;
- rastreabilidade: `source_type`, `source_urls`, `source_notes` e responsáveis pela criação/alteração;
- revisão: `verification_status` (`draft` ou `verified`) e `verified_at`;
- arquivamento lógico por `archived_at`.
- classificação nutricional: `item_type`, `food_group` e `preparation_method`;
- base de cálculo explícita: `reference_quantity` e `reference_unit`;
- medidas caseiras em `household_measures`;
- fonte oficial, código e versão em `official_source`, `official_source_code` e `source_version`;
- liberação para dietas em `is_available_for_diets`.

Valores de energia e nutrientes sempre correspondem à quantidade-base. O adaptador da dieta preserva essa base; por exemplo, 24 g de proteína em uma porção de 30 g não são tratados como 24 g por 100 g.

Registros oficiais possuem `organization_id = null`, são compartilhados e somente leitura. Registros criados pela clínica continuam isolados pela organização. A base oficial conta com os **597 alimentos da TACO (4ª edição revisada e ampliada, NEPA/UNICAMP, 2011)** com composição centesimal completa, micronutrientes em `nutrition_facts` e medidas caseiras (`household_measures`) preservadas, além de itens selecionados da TBCA.

As origens ativas são `manual`, `open_food_facts`, `imported` (para bases oficiais como TACO/TBCA) e `ai_vision`. `ai_web` permanece aceita por compatibilidade com registros anteriores.

O bucket `product-images` aceita JPG, PNG e WebP de até 5 MB. As imagens de embalagens são públicas para leitura, enquanto upload e exclusão exigem usuário autenticado pertencente à organização indicada na primeira pasta do objeto.

## Segurança

- RLS está habilitado em `product_catalog`.
- `anon` não recebe acesso à tabela.
- `authenticated` pode ler a base oficial e os registros da própria clínica; mutações continuam limitadas aos registros da organização.
- O frontend também inclui `organization_id` nos filtros de atualização e arquivamento.
- A interpretação de IA roda no servidor, com `store: false`; a chave Gemini não é enviada ao navegador.

## Código de barras sem IA

O endpoint `GET /api/products?barcode=...` consulta o Open Food Facts quando o item ainda não está no catálogo local. O resultado conserva a URL de origem, recebe `source_type = open_food_facts` e permanece como rascunho para conferência humana.

A reutilização persistente dos dados deve respeitar ODbL e as regras de atribuição do Open Food Facts.

## Interpretação da imagem com IA

O endpoint `/api/ai` aceita a tarefa `product_research` somente quando acompanhada por `image`, com dados base64 e tipo JPG, PNG ou WebP. Solicitações com apenas nome ou URL são rejeitadas pelo servidor.

O serviço `server/ai/productResearch.js` envia ao Gemini um prompt e a imagem inline, sem ferramentas de Google Search ou URL Context. A saída usa schema JSON estruturado, é sanitizada no servidor e retorna `researchMode = label_image` e `sources = []`.

Fotos maiores são reduzidas no navegador antes do envio. A imagem usada na análise não é gravada no catálogo nem retida pela interação (`store: false`). A foto pública do produto continua sendo escolhida separadamente no campo **Imagem** do cadastro.

Se a tabela estiver ausente ou ilegível, o modelo deve deixar os campos sem valor, sem estimar. Se a cota Gemini estiver indisponível, o formulário continua editável para cadastro manual.

Variáveis usadas pelo servidor:

- `GEMINI_API_KEY`: credencial do Gemini;
- `AI_ACCESS_TOKEN`: proteção obrigatória do endpoint em produção.

## Arquivos principais

- `app/src/features/produtos/ProdutosPage.jsx`
- `app/src/features/produtos/components/ProductFormDialog.jsx`
- `app/src/features/produtos/services/products.js`
- `app/src/features/produtos/services/productResearchInput.js`
- `server/ai/productResearch.js`
- `server/products/openFoodFacts.js`
- `server/products/productLookup.js`
- `api/products.js`
- `supabase/migrations/*_create_product_catalog.sql`
- `supabase/migrations/*_expand_product_catalog_sources.sql`
- `supabase/migrations/*_unify_nutrition_catalog.sql`
- `tests/unit/productCatalog.test.js`
- `tests/unit/nutritionCatalog.test.js`
- `tests/unit/productLookup.test.js`
