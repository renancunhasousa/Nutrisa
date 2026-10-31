# Estúdio de Posts & IA (Marketing do Instagram)

Referência técnica e funcional do módulo de geração de conteúdo e design de posts para o Instagram da **Dra. Isabela Muñoz** integrado na plataforma **NutrIsa**.

---

## 1. Visão Geral

O módulo permite à nutricionista criar posts com visual editorial e chancelado pela ciência clínica (ACSM), com assistência de Inteligência Artificial generativa, alternância de identidade visual e exportação direta em alta resolução (1080 × 1350 px, proporção 4:5 do Feed do Instagram).

- **Rota na Plataforma**: `#marketing`
- **Aba no Navbar**: `Posts & IA` (ícone `Sparkles`)
- **Página Principal**: `app/src/features/marketing/MarketingPage.jsx`
- **Hook de Estado**: `app/src/features/marketing/hooks/usePostStudio.js`
- **Serviço de Domínio & IA**: `app/src/features/marketing/services/postGeneratorService.js`
- **Serviço de Ideias do WhatsApp**: `app/src/features/marketing/services/whatsappPostService.js`
- **Componentes Principais**:
  - `PostDesignConfig.jsx`: Configurações de design na aba **Design**, com seleção de modelo de publicação, paleta de cores, fotos e adição de novos slides ao projeto.
  - `PostAIAssistant.jsx`: Assistente na aba **Criativo**, com integração a dúvidas reais do WhatsApp e tendências da Web para nutrição.
  - `PostContentEditor.jsx`: Editor na aba **Conteúdo**, com campos verticalizados (um embaixo do outro), tipografia refinada para os labels dos inputs, ícone `FileText` e destaque visual quebrado para o criativo ativo.
  - `CaptionBox.jsx`: Caixa na aba **Legenda** com título em caixa alta padronizado (`LEGENDA DO INSTAGRAM`), layout vertical que se expande até a base do painel lateral, geração de copy persuasivo por IA e botão de cópia com 1 clique.
  - `PostSlideViewer.jsx`: Prancheta central com fita de slides no **topo do post** (permitindo criar livremente múltiplos slides/posts), presets de zoom (45%, 55%, 65%), modo foco e ícone do Instagram sem fundo verde.
  - `PostCanvas.jsx`: Renderizador nativo de 1080×1350 px (4:5) com suporte a 7 formatos e 3 paletas.

---

## 2. Formatos de Post Suportados (7 Modelos)

Os formatos são **dinâmicos e adaptados à organização ativa**:
- Para a organização da **Dra. Isabela Muñoz**: exibe `1. Dra. Isabela Explica`, fotos oficiais dela e chancela ACSM.
- Para **outros consultórios/nutricionistas**: o formato 1 adapta-se automaticamente para o nome da profissional (ex: `1. Dra. Camila Explica` ou `1. Nutri Explica`), utilizando a foto enviada por ela (ou avatar neutro) e chamada de consulta para a sua própria clínica.

| Formato | ID | Objetivo Clínico & Editorial | Elementos Visuais Chave |
| :--- | :--- | :--- | :--- |
| **1. [Nutri] Explica** *(Dra. Isabela Explica)* | `autoridade` | Posicionamento de destaque, autoridade e desmistificação nutricional. | Foto oficial com recorte da nutricionista, assinatura/crédito, título com trecho em degradê e card de rodapé. |
| **2. Prato & Performance** | `prato` | Educação alimentar, estratégias pré/pós-treino e gastronomia esportiva. | Imagem gastronômica real, gradiente de fusão e HUD de macronutrientes (Kcal, Proteína, Carboidrato, Gorduras). |
| **3. Ciência vs. Senso Comum** | `ciencia` | Combate a mitos com base em evidências científicas e fisiologia. | Badge de evidência, pergunta instigante, card vermelho de senso comum vs. card iluminado de ciência clínica. |
| **4. Dicas 01 / 02 / 03** | `dicas` | Lista numerada prática de 3 estratégias de fácil absorção para salvar e compartilhar. | Cards numerados elegantes com título, descrição e rodapé de salvamento. |
| **5. CTA de Consulta** | `cta` | Conversão direta para agendamento de consulta com a nutricionista responsável. | Bullet points com benefícios do acompanhamento individualizado e botão de chamada de ação. |
| **6. Manifesto Clínico** | `manifesto` | Frase editorial de impacto, mentalidade e quebra de culpa alimentar. | Citação central em tipografia grande, linha dourada de acento e posicionamento de marca. |
| **7. Ponto / Passo Clínico** | `passo` | Explicação fisiológica aprofundada de um ponto ou erro silencioso. | Número grande em destaque (ex: `03`), badge de contexto, título destacado e card dourado de conduta clínica (💡). |
| **Carrossel Completo** | `carrossel` | Sequência educativa (Capa, Lâminas Intermediárias de qualquer modelo e CTA Final). | Paginação visual de lâminas, navegação por abas estilo contratos e exportação completa em ZIP. |

---

## 3. Identidades Visuais & Paletas de Cores

O post permite alternar instantaneamente entre 3 paletas da marca:

1. **Marrom & Ouro Luxo (`marrom`)**:
   - Paleta original do site institucional da Dra. Isabela Muñoz.
   - Fundo em degradê escuro radial (`#25211D` a `#1A1714`), dourado âmbar (`#F3A950`), dourado champanhe (`#F5E3C0`) e cartões com blur acrílico.
2. **Verde Tiffany & Clínico (`tiffany`)**:
   - Paleta oficial da marca da plataforma NutrIsa.
   - Fundo petróleo/tiffany escuro (`#082321` a `#0D3E3A`), toques em Tiffany mint (`#5EEAD4`, `#2DD4BF`) e dourado suave para contraste de alto padrão.
3. **Bege Claro & Editorial (`bege`)**:
   - Paleta diurna clean (Off-White).
   - Fundo champagne suave (`#FAF6EE` a `#EFE6D6`), tipografia nobre em grafite escuro (`#1C1917`), detalhes em verde Tiffany profundo (`#0D9488`) e bronze (`#D97706`).

---

## 4. Integração com Inteligência Artificial

A geração automatizada é orquestrada por `generatePostContent()` via `aiClient.js` (`callGeminiWithFallback`):

- **Persona**: Nutricionista Clínica e Esportiva de elite chancelada pelo ACSM.
- **Saída**: Estrutura JSON com títulos, subtítulos, trechos destacados, macronutrientes, cards de mito vs. verdade e **legenda pronta do Instagram** com gancho de retenção, copy explicativo e chamada para agendamento.
- **Modo Offline / Resiliência**: Caso a API externa ou chaves não estejam disponíveis, a aplicação ativa presets inteligentes pré-definidos (ex: Creatina, Treino em Jejum, etc.), garantindo que a nutricionista nunca fique travada.

---

## 5. Inteligência de Pautas: WhatsApp & Busca Web

O assistente de conteúdo conta com duas fontes inteligentes de pautas que alternam os botões de ação e os cards recomendados:

### A. Dúvidas Reais do WhatsApp (`whatsappPostService.js`)
1. **Extração das Mensagens**: Varre as últimas conversas de pacientes do Supabase (`log_conversas`), filtrando ruídos e isolando dúvidas e relatos clínicos reais.
2. **Clusterização & Ganchos**: A IA agrupa as maiores dores da semana e cria títulos no formato de gancho para o feed.
3. **Recomendação Automática de Formato**: A IA associa cada dor diretamente ao modelo ideal entre os 7 (ex.: mito alimentar ➔ *3. Ciência vs Senso Comum*; dúvida de refeição ➔ *2. Prato & Performance*; queixa fisiológica ➔ *7. Passo Clínico*).
4. **Botão de Ação**: Exibe **`[Analisar WhatsApp]`** no cabeçalho quando a aba *Dúvidas Reais* estiver ativa.

### B. Tendências em Alta na Web (`trendingTopicsService.js`)
1. **Varredura de Assuntos Virais**: Identifica pesquisas em alta, debates nas redes sociais e tendências de saúde/nutrição esportiva (ex.: compostos fitoterápicos, saúde intestinal, jejum intermitente e metabolismo).
2. **Botão de Ação**: O botão superior se transforma contextualmente em **`[Buscar Web]`** quando a aba *Temas Editoriais* é selecionada.
3. **Aplicação com 1 Clique**: Ao clicar em qualquer tema da web, o prompt da IA é preenchido e o modelo ideal recomendado é automaticamente ativado no seletor.

---

## 6. Exportação & Download em Alta Resolução
 
- A renderização de exportação utiliza `html-to-image` (`toPng`).
- O canvas é capturado nas dimensões nativas de **1080 × 1350 px (4:5)** sem perda de nitidez de fontes ou imagens.
- **Post Único**: O download do arquivo `.png` individual é disparado diretamente no navegador.
- **Carrossel Completo (ZIP)**: Quando o formato Carrossel está ativo, o sistema itera automaticamente por todas as lâminas, renderiza cada PNG em alta resolução e utiliza `jszip` para compactar o pacote contendo:
  - `slide-01-capa.png`
  - `slide-02-conteudo.png` ...
  - `slide-05-fechamento-cta.png`
  - `legenda-instagram.txt` (a legenda gerada pela IA já pronta para colar no Instagram).
  - O download do arquivo `.zip` é realizado com 1 clique, sem sobrecarga de servidor.
