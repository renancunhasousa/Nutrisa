/**
 * postGeneratorService.js
 * Serviço central de gerenciamento de templates, paletas e geração com IA para Instagram da Dra. Isabela Muñoz
 */

export const POST_FORMATS = [
  {
    id: 'autoridade',
    label: '1. Dra. Isabela Explica',
    subtitle: 'Autoridade & Elegância',
    description: 'Post com a foto oficial da Dra., focado em autoridade médica, desmistificação e posicionamento de luxo.'
  },
  {
    id: 'prato',
    label: '2. Prato & Performance',
    subtitle: 'Nutrição & Esporte',
    description: 'Post visual com foto gastronômica esportiva e HUD com contagem de macronutrientes (Kcal, Proteína, Carboidrato, Gorduras).'
  },
  {
    id: 'ciencia',
    label: '3. Ciência vs. Senso Comum',
    subtitle: 'Evidências & ACSM',
    description: 'Post em cards contrastantes comparando crenças populares com evidências científicas chanceladas pelo ACSM.'
  },
  {
    id: 'dicas',
    label: '4. Dicas 01 / 02 / 03',
    subtitle: 'Lista Numerada • Alta Performance',
    description: 'Post de lista com 3 dicas clínicas numeradas em destaque, ideal para salvar e compartilhar.'
  },
  {
    id: 'cta',
    label: '5. CTA de Consulta',
    subtitle: 'Chamada para Ação',
    description: 'Post de conversão poderoso com chamada direta para agendamento de consulta com a Dra. Isabela.'
  },
  {
    id: 'manifesto',
    label: '6. Manifesto Clínico',
    subtitle: 'Frase de Impacto • Editorial',
    description: 'Layout editorial de alto impacto com citação central em tipografia grande, linha de acento e identidade da marca.'
  },
  {
    id: 'passo',
    label: '7. Ponto / Passo Clínico',
    subtitle: 'Número Grande • Conduta 💡',
    description: 'Lâmina editorial com número grande em destaque, título, explicação fisiológica profunda e card dourado de conduta clínica com lâmpada.'
  }
];

export const POST_THEMES = [
  {
    id: 'marrom',
    name: 'Marrom & Ouro Luxo',
    tag: 'Paleta Oficial do Site',
    dotColor: '#F3A950',
    canvasBg: 'radial-gradient(circle at 80% 20%, #3B332A 0%, #25211D 70%)',
    headerColor: '#F5E3C0',
    accentColor: '#F3A950',
    textColor: '#E1E1E1',
    cardBg: 'rgba(46, 42, 37, 0.85)',
    borderGold: 'rgba(245, 227, 192, 0.25)',
    borderStrong: 'rgba(243, 169, 80, 0.5)',
    gradientText: 'linear-gradient(90deg, #F3A950, #F5E3C0)',
    hudValColor: '#F3A950',
    hudLblColor: '#F5E3C0',
    isDark: true
  },
  {
    id: 'tiffany',
    name: 'Verde Tiffany & Ouro',
    tag: 'Identidade da Marca NutrIsa',
    dotColor: '#14B8A6',
    canvasBg: 'radial-gradient(circle at 80% 20%, #14B8A6 0%, #0D9488 45%, #0F766E 90%)',
    headerColor: '#FFF8E7',
    accentColor: '#F3A950',
    textColor: '#F1F5F9',
    cardBg: 'rgba(15, 118, 110, 0.80)',
    borderGold: 'rgba(243, 169, 80, 0.40)',
    borderStrong: 'rgba(243, 169, 80, 0.70)',
    gradientText: 'linear-gradient(90deg, #F3A950, #FFF8E7)',
    hudValColor: '#F3A950',
    hudLblColor: '#FFF8E7',
    isDark: true
  },
  {
    id: 'bege',
    name: 'Bege Claro & Editorial',
    tag: 'Tons Terrosos & Ouro',
    dotColor: '#B88237',
    canvasBg: 'radial-gradient(circle at 80% 20%, #FAF6EE 0%, #EFE6D6 80%)',
    headerColor: '#2E261F',
    accentColor: '#B88237',
    textColor: '#5C4D42',
    cardBg: 'rgba(247, 241, 230, 0.78)',
    borderGold: 'rgba(184, 130, 55, 0.28)',
    borderStrong: 'rgba(184, 130, 55, 0.60)',
    gradientText: 'linear-gradient(90deg, #B88237, #8C5E20)',
    hudValColor: '#B88237',
    hudLblColor: '#6B584B',
    isDark: false
  }
];

export const SUGGESTED_TOPICS = [
  {
    title: '5 erros que travam seu emagrecimento mesmo treinando pesado',
    tag: 'Carrossel • Emagrecimento',
    format: 'carrossel'
  },
  {
    title: 'Guia definitivo da Creatina: dosagem, horários e mitos',
    tag: 'Carrossel • Suplementação',
    format: 'carrossel'
  },
  {
    title: 'Dietas radicais e destruição do metabolismo',
    tag: 'Metabolismo & Massa Magra',
    format: 'autoridade'
  },
  {
    title: 'Creatina: pré ou pós-treino? O que a ciência prova',
    tag: 'Suplementação Esportiva',
    format: 'ciencia'
  },
  {
    title: 'Refeição pós-treino para máxima síntese proteica',
    tag: 'Estratégia Nutricional',
    format: 'prato'
  },
  {
    title: 'Treinar em jejum realmente queima mais gordura?',
    tag: 'ACSM & Emagrecimento',
    format: 'ciencia'
  }
];

export const DEFAULT_CAROUSEL_SLIDES = [
  {
    id: 1,
    type: 'cover',
    badge: 'Guia Clínico • Nutrição & Treino',
    tagline: 'Performance & Saúde',
    headline: '5 erros que travam seu emagrecimento mesmo treinando pesado',
    highlightText: 'travam seu emagrecimento',
    description: 'Você treina com afinco, cuida da alimentação, mas os resultados estagnaram na balança e no espelho? Entenda onde está o gargalo metabólico.',
    ctaIndicator: 'Deslize para ver os erros ➔'
  },
  {
    id: 2,
    type: 'content',
    stepNumber: '01',
    badge: 'Erro 01 • Déficit Ilusório',
    title: 'Superávit calórico disfarçado de comida saudável',
    highlightText: 'Superávit calórico',
    text: 'Pasta de amendoim, azeite de oliva, castanhas e açaí puro são alimentos nobres, porém extremamente densos energeticamente. Uma colherada despretensiosa pode adicionar 150 kcal extras e anular todo o déficit calórico gerado pelo seu treino.',
    tip: '💡 Conduta clínica: use balança de precisão nas primeiras 2 a 3 semanas para recalibrar a percepção visual das porções.'
  },
  {
    id: 3,
    type: 'content',
    stepNumber: '02',
    badge: 'Erro 02 • Proteína Insuficiente',
    title: 'Ingestão de proteína abaixo de 1.8g por kg de peso',
    highlightText: 'Proteína abaixo',
    text: 'Em fase de emagrecimento, a demanda proteica aumenta para poupar massa muscular. Com proteína insuficiente, o corpo cataboliza músculo, reduzindo sua taxa metabólica de repouso e provocando mais fome ao longo do dia.',
    tip: '💡 Conduta clínica: distribua o consumo proteico em pelo menos 3 a 4 refeições com 25g a 35g de alto valor biológico.'
  },
  {
    id: 4,
    type: 'content',
    stepNumber: '03',
    badge: 'Erro 03 • Sono & Cortisol',
    title: 'Privação de sono sabotando o controle da grelina',
    highlightText: 'Privação de sono',
    text: 'Dormir menos de 7 horas desregula os hormônios da fome: a grelina sobe (apetite por carboidratos rápidos) e a leptina cai (dificuldade de saciedade). O estresse crônico também eleva o cortisol, favorecendo o acúmulo de gordura visceral.',
    tip: '💡 Conduta clínica: priorize higiene do sono consistente e considere magnésio bisglicinato e ashwagandha se indicado.'
  },
  {
    id: 5,
    type: 'cta',
    badge: 'Periodização Estratégica',
    headline: 'O segredo não é comer menos. É periodizar com precisão.',
    highlightText: 'periodizar com precisão',
    description: 'Cada organismo tem uma taxa metabólica e uma demanda de treino única. No meu acompanhamento clínico e esportivo, traçamos uma estratégia milimétrica para você secar sem perder massa magra nem energia.',
    authorName: 'Isabela Muñoz',
    authorTitle: 'Nutrição Clínica, Esportiva & Performance • ACSM',
    ctaBoxText: 'Salve este carrossel para consultar na sua semana e toque no link da bio para agendar sua consulta! 🚀'
  }
];

export const DEFAULT_POST_DATA = {
  format: 'autoridade',
  theme: 'marrom',
  badge: 'Nutrição de Precisão',
  tagline: 'Performance & Saúde',
  headline: 'Por que dietas radicais destroem seu metabolismo e sua massa muscular?',
  highlightText: 'destroem seu metabolismo',
  description: 'A restrição calórica sem periodização induz à perda de massa magra, desacelerando o gasto calórico diário e provocando o efeito rebote.',
  authorName: 'Isabela Muñoz',
  authorTitle: 'Nutrição Clínica, Esportiva & Performance',
  dishCategory: 'Pós-Treino Estratégico',
  dishHeadline: 'Recuperação Muscular & Reposição de Glicogênio',
  dishSubheadline: 'A janela pós-exercício exige um balanço preciso de carboidratos de absorção equilibrada com fontes nobres de aminoácidos para acelerar a síntese proteica.',
  dishKcal: '540',
  dishProteina: '42g',
  dishCarbos: '58g',
  dishGorduras: '14g',
  cienciaBadge: 'American College of Sports Medicine',
  cienciaTitle: 'Treinar em jejum queima mais gordura?',
  debateWrongTitle: 'Gasta mais gordura pura',
  debateWrongText: 'A oxidação de gordura momentânea pode ser levemente superior, porém a perda de intensidade no treino reduz o gasto calórico total do dia e compromete a musculatura.',
  debateRightTitle: 'O balanço de 24h é soberano',
  debateRightText: 'Estar nutrido permite manter volume e carga maiores de treino. O déficit energético ao longo do dia, e não o estômago vazio durante o exercício, dita o emagrecimento real.',
  // Campos do formato 4: Dicas 01/02/03
  dicasBadge: 'Nutrição de Elite',
  dicasTitle: '3 estratégias que aceleram seu resultado sem cortar o que você ama',
  dicasHighlight: 'sem cortar o que você ama',
  dica1Num: '01',
  dica1Title: 'Distribua proteína em todas as refeições',
  dica1Text: 'Mínimo de 25g por refeição para maximizar a síntese proteica e preservar massa magra.',
  dica2Num: '02',
  dica2Title: 'Priorize carboidratos ao redor do treino',
  dica2Text: 'Glicogênio bem reposto = mais força, menos fadiga e recuperação acelerada.',
  dica3Num: '03',
  dica3Title: 'Ajuste as calorias por fase de treino',
  dica3Text: 'Periodização calórica alinhada ao calendário de treino é o que separa resultado de estagnação.',
  dicasFooter: 'Salve e aplique esta semana!',
  // Campos do formato 5: CTA de Consulta
  ctaBadge: 'Acompanhamento Individualizado',
  ctaTitle: 'Chegou a hora da sua nutrição trabalhar para a sua melhor versão',
  ctaHighlight: 'sua melhor versão',
  ctaSubtitle: 'Cada organismo tem uma taxa metabólica única. Pare de seguir protocolos genéricos — periodize com precisão clínica e ACSM.',
  ctaBullet1: 'Periodização nutricional alinhada ao seu treino',
  ctaBullet2: 'Suplementação baseada em evidências (ACSM)',
  ctaBullet3: 'Ajustes semanais para resultados contínuos',
  ctaCallout: 'Agende sua consulta pelo link da bio e transforme sua performance!',
  // Campos do formato 6: Manifesto Clínico
  manifestoBadge: 'Nutrição de Precisão • ACSM',
  manifestoCitacao: 'A nutrição não é uma dieta.\nÉ a linguagem que o seu corpo usa para alcançar a sua melhor versão.',
  manifestoHighlight: 'sua melhor versão',
  manifestoAutor: 'Dra. Isabela Muñoz',
  manifestoTitulo: 'Nutricionista Clínica & Esportiva',
  manifestoCred: 'Certificação Internacional ACSM',
  manifestoCta: 'Agende sua consulta pelo link da bio ↗',
  // Campos do formato 7: Ponto / Passo Clínico
  passoBadge: 'Ponto 01 • Estratégia Clínica',
  stepNumber: '01',
  passoTitle: 'Superávit calórico disfarçado de comida saudável',
  passoHighlight: 'Superávit calórico',
  passoText: 'Pasta de amendoim, azeite de oliva, castanhas e açaí puro são alimentos nobres, porém extremamente densos energeticamente. Uma colherada despretensiosa pode adicionar 150 kcal extras e anular todo o déficit calórico gerado pelo seu treino.',
  passoTip: '💡 Conduta clínica: use balança de precisão nas primeiras 2 a 3 semanas para recalibrar a percepção visual das porções.',
  slides: [],
  caption: `Você já tentou cortar calorias drasticamente para emagrecer rápido e acabou se sentindo fraca, sem rendimento no treino e, semanas depois, recuperou todo o peso perdido?\n\nIsso acontece porque a restrição severa sem periodização nutricional faz seu corpo queimar massa magra como combustível. Com menos músculos ativos, sua taxa metabólica basal despenca, tornando o ganho de gordura muito mais fácil logo em seguida.\n\n🎯 No meu acompanhamento clínico e esportivo, traçamos estratégias com base na sua rotina real de treinos, garantindo energia, tônus muscular e resultados sustentáveis.\n\n👉 Quer ajustar sua periodização nutricional para a sua melhor versão? Toque no link da bio e agende sua consulta.\n\n#NutricaoEsportiva #DraIsabelaMunoz #PerformanceFeminina #MetabolismoAtivo #ACSM #Hipertrofia`
};

/**
 * Cria o prompt para a IA para post único ou carrossel completo
 */
export function buildAiPrompt({ topic, format = 'autoridade' }) {
  if (format === 'carrossel') {
    return `Você é a inteligência artificial da Dra. Isabela Muñoz (Nutricionista Clínica e Esportiva de elite, certificada ACSM).
Gere um CARROSSEL COMPLETO (sequência de 5 slides) de altíssimo engajamento para o Instagram sobre o tema: "${topic}".

Retorne OBRIGATORIAMENTE um JSON válido com esta estrutura exata:
{
  "slides": [
    {
      "id": 1,
      "type": "cover",
      "badge": "Badge curto (ex: Guia Prático)",
      "tagline": "Performance & Saúde",
      "headline": "Título da Capa com gancho forte",
      "highlightText": "Palavras-chave do título que receberão destaque dourado",
      "description": "Texto curto instigando a passar para o próximo slide",
      "ctaIndicator": "Deslize para ver ➔"
    },
    {
      "id": 2,
      "type": "content",
      "stepNumber": "01",
      "badge": "Ponto 01",
      "title": "Título do Ponto 1",
      "highlightText": "Parte do título com destaque",
      "text": "Explicação clínica detalhada em 2 a 3 frases claras",
      "tip": "💡 Dica clínica prática aplicável"
    },
    {
      "id": 3,
      "type": "content",
      "stepNumber": "02",
      "badge": "Ponto 02",
      "title": "Título do Ponto 2",
      "highlightText": "Parte do título com destaque",
      "text": "Explicação clínica detalhada em 2 a 3 frases claras",
      "tip": "💡 Dica clínica prática aplicável"
    },
    {
      "id": 4,
      "type": "content",
      "stepNumber": "03",
      "badge": "Ponto 03",
      "title": "Título do Ponto 3",
      "highlightText": "Parte do título com destaque",
      "text": "Explicação clínica detalhada em 2 a 3 frases claras",
      "tip": "💡 Dica clínica prática aplicável"
    },
    {
      "id": 5,
      "type": "cta",
      "badge": "Acompanhamento Individualizado",
      "headline": "Título de conclusão do raciocínio",
      "highlightText": "Destaque da conclusão",
      "description": "Parágrafo curto explicando a importância do acompanhamento individualizado",
      "ctaBoxText": "Salve este post para consultar depois e agende sua consulta pelo link da bio!"
    }
  ],
  "caption": "Legenda completa do Instagram convidando a deslizar pelas lâminas, com resumo dos pontos, CTA e hashtags estratégicas."
}`;
  }

  return `Você é a inteligência artificial da Dra. Isabela Muñoz (Nutricionista Clínica e Esportiva, certificada ACSM).
Gere o conteúdo para um post de alta conversão e autoridade no Instagram para o formato: "${format}".
Tema solicitado: "${topic}".

Retorne OBRIGATORIAMENTE um JSON válido com esta estrutura exata:
{
  "badge": "Frase curta (ex: Nutrição de Precisão ou ACSM)",
  "tagline": "Frase de efeito elegante (ex: Performance & Longevidade)",
  "headline": "Título instigante em formato de pergunta ou afirmação forte",
  "highlightText": "Parte do título que deve ficar com destaque dourado (2 a 4 palavras)",
  "description": "Texto explicativo curto com 2 a 3 frases claras de fundamentação clínica",
  "dishCategory": "Categoria (caso seja formato prato, ex: Refeição Pré-Treino)",
  "dishHeadline": "Título focado em estratégia alimentar",
  "dishSubheadline": "Explicação da combinação dos alimentos",
  "dishKcal": "Ex: 480",
  "dishProteina": "Ex: 38g",
  "dishCarbos": "Ex: 52g",
  "dishGorduras": "Ex: 12g",
  "cienciaBadge": "American College of Sports Medicine",
  "cienciaTitle": "Pergunta central do mito vs verdade",
  "debateWrongTitle": "O que as pessoas acreditam erroneamente",
  "debateWrongText": "Explicação do porquê esse senso comum prejudica o paciente",
  "debateRightTitle": "O que a evidência científica e o ACSM comprovam",
  "debateRightText": "A recomendação clínica precisa com base em bioquímica e fisiologia do exercício",
  "caption": "Legenda completa do Instagram pronta para publicar: com gancho de abertura magnético, explicação sem termos inacessíveis, chamada para ação convidando para consulta com Dra. Isabela Muñoz, e hashtags estratégicas de nutrição esportiva e clínica."
}`;
}

/**
 * Normaliza os dados gerados pela IA ou fallback
 */
export function sanitizePostData(raw = {}, currentData = DEFAULT_POST_DATA) {
  let slides = currentData.slides || DEFAULT_CAROUSEL_SLIDES;
  if (Array.isArray(raw.slides) && raw.slides.length > 0) {
    slides = raw.slides.map((s, idx) => ({
      id: s.id || idx + 1,
      type: s.type || (idx === 0 ? 'cover' : idx === raw.slides.length - 1 ? 'cta' : 'content'),
      stepNumber: s.stepNumber || String(idx).padStart(2, '0'),
      badge: (s.badge || '').trim(),
      tagline: (s.tagline || 'Performance & Saúde').trim(),
      headline: (s.headline || s.title || '').trim(),
      title: (s.title || s.headline || '').trim(),
      highlightText: (s.highlightText || '').trim(),
      description: (s.description || s.text || '').trim(),
      text: (s.text || s.description || '').trim(),
      tip: (s.tip || '').trim(),
      ctaIndicator: (s.ctaIndicator || 'Deslize para ver ➔').trim(),
      ctaBoxText: (s.ctaBoxText || 'Salve este carrossel e agende sua consulta pelo link da bio!').trim(),
      authorName: s.authorName || 'Isabela Muñoz',
      authorTitle: s.authorTitle || 'Nutrição Clínica, Esportiva & Performance • ACSM'
    }));
  }

  return {
    ...currentData,
    badge: (raw.badge || currentData.badge || '').trim(),
    tagline: (raw.tagline || currentData.tagline || '').trim(),
    headline: (raw.headline || currentData.headline || '').trim(),
    highlightText: (raw.highlightText || currentData.highlightText || '').trim(),
    description: (raw.description || currentData.description || '').trim(),
    dishCategory: (raw.dishCategory || currentData.dishCategory || '').trim(),
    dishHeadline: (raw.dishHeadline || currentData.dishHeadline || '').trim(),
    dishSubheadline: (raw.dishSubheadline || currentData.dishSubheadline || '').trim(),
    dishKcal: (raw.dishKcal || currentData.dishKcal || '').trim(),
    dishProteina: (raw.dishProteina || currentData.dishProteina || '').trim(),
    dishCarbos: (raw.dishCarbos || currentData.dishCarbos || '').trim(),
    dishGorduras: (raw.dishGorduras || currentData.dishGorduras || '').trim(),
    cienciaBadge: (raw.cienciaBadge || currentData.cienciaBadge || '').trim(),
    cienciaTitle: (raw.cienciaTitle || currentData.cienciaTitle || '').trim(),
    debateWrongTitle: (raw.debateWrongTitle || currentData.debateWrongTitle || '').trim(),
    debateWrongText: (raw.debateWrongText || currentData.debateWrongText || '').trim(),
    debateRightTitle: (raw.debateRightTitle || currentData.debateRightTitle || '').trim(),
    debateRightText: (raw.debateRightText || currentData.debateRightText || '').trim(),
    slides,
    caption: (raw.caption || currentData.caption || '').trim()
  };
}

/**
 * Gera post ou carrossel completo via IA ou fallback inteligente
 */
export async function generatePostContent({ topic, format = 'autoridade', model, callAiFn }) {
  if (!topic || !topic.trim()) {
    throw new Error('Informe um tema ou selecione uma sugestão para gerar o post.');
  }

  const prompt = buildAiPrompt({ topic: topic.trim(), format });

  if (typeof callAiFn === 'function') {
    try {
      const response = await callAiFn({
        prompt,
        systemInstruction: 'Você é um estrategista de conteúdo para nutricionistas de elite e atletas. Devolva apenas JSON.',
        jsonMode: true,
        model
      });

      const parsed = response.json || (response.text ? JSON.parse(response.text) : null);
      if (parsed) {
        return sanitizePostData(parsed);
      }
    } catch (err) {
      console.warn('Falha na chamada remota de IA, utilizando gerador inteligente local:', err.message);
    }
  }

  // Fallback inteligente caso a IA externa não esteja disponível
  return getOfflinePreset(topic, format);
}

/**
 * Gerador de presets offline quando a API de IA estiver indisponível
 */
export function getOfflinePreset(topic = '', format = 'autoridade') {
  const clean = topic.toLowerCase();
  
  if (format === 'carrossel' || clean.includes('erros') || clean.includes('passos') || clean.includes('guia')) {
    return {
      ...DEFAULT_POST_DATA,
      format: 'carrossel',
      slides: DEFAULT_CAROUSEL_SLIDES,
      caption: `Você sabia que pequenos desajustes na rotina de treino e alimentação podem estagnar seu metabolismo?\n\nDeslize para o lado para conferir os 3 pontos mais comuns no consultório e como corrigi-los com precisão clínica.\n\nSalva este post para não esquecer e agende sua consulta pelo link da bio! ✨\n\n#NutricaoEsportiva #DraIsabelaMunoz #CarrosselNutricao #Hipertrofia #ACSM`
    };
  }

  if (clean.includes('creatina')) {
    return {
      ...DEFAULT_POST_DATA,
      format,
      badge: 'Suplementação Baseada em Evidências',
      tagline: 'Ciência & Força',
      headline: 'Creatina antes ou depois do treino: o que realmente faz diferença?',
      highlightText: 'o que realmente faz diferença',
      description: 'A creatina age por acúmulo crônico nos estoques intramusculares, e não por efeito agudo imediato. A regularidade diária supera o momento exato da ingestão.',
      cienciaTitle: 'Existe horário perfeito para tomar creatina?',
      debateWrongTitle: 'Precisa tomar logo antes do treino',
      debateWrongText: 'Ela não é pré-treino estimulante. A absorção imediata não afeta o desempenho daquela sessão isolada.',
      debateRightTitle: 'O consumo com carboidrato potencializa a captação',
      debateRightText: 'A insulina estimulada por refeições facilita o transporte de creatina para as células musculares ao longo das semanas.',
      caption: `Você ainda tem dúvida de quando tomar sua creatina?\n\n🔬 A ciência é clara: o efeito da creatina decorre da saturação celular crônica, e não do horário do treino!\n\n💡 Dica de ouro da nutri: tome junto com uma fonte de carboidrato ou proteína para otimizar a retenção muscular.\n\nSalva este post e envie para quem treina com você! 🚀`
    };
  }

  return {
    ...DEFAULT_POST_DATA,
    format,
    headline: topic,
    highlightText: topic.split(' ').slice(0, 3).join(' '),
    caption: `Tema do dia: ${topic}\n\nUma abordagem individualizada faz toda a diferença para o seu metabolismo e objetivos esportivos.\n\nAgende sua consulta com a Dra. Isabela Muñoz clicando no link da bio! ✨\n\n#NutricaoEsportiva #IsabelaMunoz #Performance`
  };
}

/**
 * Extrai o contexto completo e detalhado do post ou de todas as lâminas do carrossel
 */
export function extractPostContextForCaption(postData) {
  const isCarousel = postData.format === 'carrossel';
  const slides = (isCarousel && Array.isArray(postData.slides) && postData.slides.length > 0)
    ? postData.slides
    : [];

  if (slides.length > 0) {
    const slidesText = slides.map((s, idx) => {
      const parts = [
        `• Lâmina ${idx + 1} [Tipo: ${s.type || s.format || 'conteúdo'}]:`,
        s.badge ? `Tag: "${s.badge}"` : null,
        s.tagline ? `Subtítulo: "${s.tagline}"` : null,
        (s.headline || s.title) ? `Título Principal: "${s.headline || s.title}"` : null,
        (s.description || s.text) ? `Conteúdo/Explicação: "${s.description || s.text}"` : null,
        s.tip ? `Orientação/Conduta Clínica: "${s.tip}"` : null,
        s.ctaBoxText ? `Chamada de Ação: "${s.ctaBoxText}"` : null
      ].filter(Boolean).join(' | ');
      return parts;
    }).join('\n');

    return `FORMATO: CARROSSEL DE INSTAGRAM (${slides.length} LÂMINAS)\n\nCONTEÚDO ESTRUTURADO DE CADA SLIDE:\n${slidesText}`;
  }

  // Post Único por formato
  const format = postData.format || 'autoridade';
  if (format === 'prato') {
    return `FORMATO: PRATO & PERFORMANCE DE ELITE (Nutrição Gastronômica & Esportiva)
Categoria: ${postData.dishCategory || 'Pós-Treino Estratégico'}
Título: ${postData.dishHeadline || ''}
Explicação Fisiológica: ${postData.dishSubheadline || ''}
Macronutrientes Chave: ${postData.dishKcal || '0'} kcal | ${postData.dishProteina || '0g'} Proteína | ${postData.dishCarbos || '0g'} Carboidratos | ${postData.dishGorduras || '0g'} Gorduras`;
  }

  if (format === 'ciencia') {
    return `FORMATO: CIÊNCIA VS. SENSO COMUM (Evidências ACSM)
Tema: ${postData.cienciaTitle || ''}
Crença Popular / Senso Comum (Mito): "${postData.debateWrongTitle || ''}" - ${postData.debateWrongText || ''}
Evidência Científica / Conduta Clínica (Fato): "${postData.debateRightTitle || ''}" - ${postData.debateRightText || ''}`;
  }

  if (format === 'dicas') {
    return `FORMATO: DICAS CLÍNICAS NUMERADAS 01 / 02 / 03
Título: ${postData.dicasTitle || ''}
Dica 01: ${postData.dica1Title || ''} - ${postData.dica1Text || ''}
Dica 02: ${postData.dica2Title || ''} - ${postData.dica2Text || ''}
Dica 03: ${postData.dica3Title || ''} - ${postData.dica3Text || ''}`;
  }

  if (format === 'cta') {
    return `FORMATO: CTA DE CONSULTA & ACOMPANHAMENTO INDIVIDUALIZADO
Título Principal: ${postData.ctaTitle || ''}
Subtítulo: ${postData.ctaSubtitle || ''}
Pilares do Acompanhamento: ${[postData.ctaBullet1, postData.ctaBullet2, postData.ctaBullet3].filter(Boolean).join(' | ')}
Chamada Final: ${postData.ctaCallout || ''}`;
  }

  if (format === 'manifesto') {
    return `FORMATO: MANIFESTO CLÍNICO & EDITORIAL DE MARCA
Citação de Posicionamento: "${postData.manifestoCitacao || ''}"
Autora: ${postData.manifestoAutor || 'Dra. Isabela Muñoz'} (${postData.manifestoTitulo || 'Nutricionista Clínica & Esportiva - ACSM'})`;
  }

  // Autoridade / Padrão
  return `FORMATO: AUTORIDADE MÉDICA & NUTRIÇÃO DE PRECISÃO
Tag: ${postData.badge || 'Nutrição de Precisão'}
Headline: ${postData.headline || ''}
Explicação Clínica: ${postData.description || ''}
Autora: ${postData.authorName || 'Dra. Isabela Muñoz'}`;
}

/**
 * Gera legenda completa e persuasiva para o Instagram via IA com base no contexto
 */
export async function generateInstagramCaption({ postData, model, callAiFn }) {
  const context = extractPostContextForCaption(postData);
  const isCarousel = postData.format === 'carrossel';

  const prompt = `Você é um estrategista sênior de marketing e copywriter para a Dra. Isabela Muñoz, nutricionista clínica, esportiva e com certificação ACSM.

Sua missão é escrever a LEGENDA DEFINITIVA para este post no Instagram, aproveitando integralmente o contexto e a mensagem das lâminas/artes:

------------------------------------------------
${context}
------------------------------------------------

ESTRUTURA OBRIGATÓRIA DA LEGENDA:
1. 💥 GANCHO INICIAL (Primeiras 1-2 frases):
   - Deve ser instigante, provocar identificação imediata ou quebrar um senso comum antes que o usuário veja o botão "...mais".
   - Use uma quebra de linha dupla após o gancho.

2. 🧠 DESENVOLVIMENTO CLÍNICO:
   - Aprofunde o raciocínio fisiológico com clareza, empatia e autoridade.
   ${isCarousel ? '- Faça menção natural ao carrossel (ex: "Como detalhei nas lâminas...", "No ponto 2 fica claro que...").' : ''}
   - Parágrafos curtos (máximo 2 a 3 linhas por parágrafo), com excelente espaçamento para leitura confortável no feed.

3. 🎯 CONDUTA PRÁTICA & SOLUÇÃO:
   - Entregue um valor prático que o leitor consiga aplicar ou compreender.

4. 📲 CHAMADA PARA AÇÃO (CTA):
   - Conduza o leitor a salvar o post para consultar depois, compartilhar com amigos que treinam ou tocar no link da bio para agendar sua consulta individualizada com a Dra. Isabela.

5. 🏷️ HASHTAGS ESTRATÉGICAS:
   - No final, insira de 6 a 8 hashtags altamente relevantes no nicho de nutrição esportiva e clínica (ex: #NutricaoEsportiva #DraIsabelaMunoz #Metabolismo #Hipertrofia #ACSM #NutricaoDePrecisao).

IMPORTANTE: Devolva APENAS o texto puro pronto da legenda para ser postado no Instagram, sem introduções como "Aqui está a sua legenda:" e sem aspas no início ou fim.`;

  if (typeof callAiFn === 'function') {
    try {
      const response = await callAiFn({
        prompt,
        systemInstruction: 'Você é um estrategista de conteúdo para nutricionistas de elite e atletas. Devolva apenas o texto final da legenda formatada para o Instagram.',
        model
      });

      const text = response.text || (response.json ? (typeof response.json === 'string' ? response.json : response.json.caption || JSON.stringify(response.json)) : '');
      if (text && text.trim()) {
        return text.trim();
      }
    } catch (err) {
      console.warn('Erro ao chamar IA remota para legenda, usando fallback inteligente:', err);
    }
  }

  // Fallback local se a API estiver sem conexão
  return generateLocalFallbackCaption(postData);
}

function generateLocalFallbackCaption(postData) {
  const isCarousel = postData.format === 'carrossel';
  const slides = postData.slides || [];
  const mainTitle = postData.headline || postData.dishHeadline || postData.cienciaTitle || postData.dicasTitle || postData.ctaTitle || 'Estratégia Nutricional';

  if (isCarousel && slides.length > 0) {
    return `${mainTitle} — você já parou para analisar como pequenos desajustes afetam sua performance e seu metabolismo?\n\nDeslize as lâminas para conferir o passo a passo completo que estruturei com base em fisiologia e evidências clínicas.\n\n🎯 Cada organismo exige uma periodização única, ajustada à sua rotina real de treinos e exames bioquímicos.\n\n👉 Salve este carrossel para consultar na sua semana e agende sua consulta individualizada pelo link da bio!\n\n#NutricaoEsportiva #DraIsabelaMunoz #CarrosselClinico #Metabolismo #ACSM #Performance`;
  }

  return `${mainTitle}\n\nA restrição severa ou o treino sem estratégia nutricional calculada são os principais motivos de estagnação metabólica e perda de rendimento.\n\n🔬 Com uma periodização precisa, garantimos energia, preservação de massa muscular e resultados sustentáveis no seu dia a dia.\n\nToque no link da bio para agendar sua consulta e transformar sua performance! ✨\n\n#NutricaoEsportiva #DraIsabelaMunoz #NutricaoDePrecisao #SaudeEPerformance #ACSM`;
}
