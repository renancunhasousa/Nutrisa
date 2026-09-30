/**
 * trendingTopicsService.js
 * Serviço de Inteligência de Tendências da Web e Redes Sociais:
 * Pesquisa e sintetiza pautas virais e em alta na internet sobre nutrição esportiva,
 * longevidade e medicina do estilo de vida com recomendação de formato dentre os 7 modelos do estúdio.
 */

import { POST_FORMATS } from './postGeneratorService.js';

const VALID_FORMATS = ['autoridade', 'prato', 'ciencia', 'dicas', 'cta', 'manifesto', 'passo'];

/**
 * Catálogo offline de temas de alto engajamento e tendências atuais na web/redes
 */
export const DEFAULT_TRENDING_TOPICS = [
  {
    title: 'Berberina funciona mesmo como "Ozempic natural" ou é mito da internet?',
    format: 'ciencia',
    formatLabel: '3. Ciência vs Senso Comum',
    tag: 'Tendência Web • Fitoterápicos',
    insight: 'Debate em alta nas redes sobre suplementos que prometem emagrecimento rápido sem esforço.'
  },
  {
    title: 'Glicemia e pico de insulina: por que a ordem dos alimentos no prato importa?',
    format: 'prato',
    formatLabel: '2. Prato & Performance',
    tag: 'Tendência Web • Crononutrição',
    insight: 'Tendência viral sobre começar a refeição por fibras e proteínas para evitar picos de glicose.'
  },
  {
    title: 'Creatina para o cérebro e foco mental: o que os novos estudos mostram',
    format: 'passo',
    formatLabel: '7. Ponto / Passo Clínico',
    tag: 'Tendência Web • Nootrópicos',
    insight: 'Novas pesquisas sobre o impacto da creatina na cognição, sono e fadiga mental além da hipertrofia.'
  },
  {
    title: '3 sinais de que você está comendo menos calorias do que o corpo precisa',
    format: 'dicas',
    formatLabel: '4. Dicas 01 / 02 / 03',
    tag: 'Tendência Web • Metabolismo',
    insight: 'Conteúdo educativo em alta contra dietas extremas que travam a tireoide e a queima de gordura.'
  },
  {
    title: 'Água com limão e vinagre em jejum queima gordura? A verdade clínica',
    format: 'autoridade',
    formatLabel: '1. Dra. Isabela Explica',
    tag: 'Tendência Web • Mitos Virais',
    insight: 'Mito clássico que volta a viralizar ciclicamente nas redes sociais de bem-estar.'
  },
  {
    title: 'Você não precisa recomeçar na segunda-feira. Precisa não desistir na sexta à noite.',
    format: 'manifesto',
    formatLabel: '6. Manifesto Clínico',
    tag: 'Tendência Web • Mentalidade',
    insight: 'Frase de impacto de alto compartilhamento sobre consistência e autocompaixão na dieta.'
  }
];

/**
 * Busca tendências da internet e redes com a IA (Gemini)
 */
export async function fetchTrendingWebTopics({ callAiFn, model } = {}) {
  if (typeof callAiFn !== 'function') {
    return DEFAULT_TRENDING_TOPICS;
  }

  const prompt = `Você é o estrategista de marketing digital e tendências da Dra. Isabela Muñoz (Nutricionista Clínica e Esportiva, certificada ACSM).

Sua tarefa é identificar 6 TEMAS EM ALTA e tendências quentes da internet e das redes sociais (Instagram, TikTok, Google Trends, PubMed recente) sobre:
- Nutrição esportiva e hipertrofia
- Emagrecimento definitivo e controle metabólico
- Suplementação da moda (creatina, whey, berberina, magnésio, cafeína)
- Mitos virais da internet sobre alimentos proibidos ou dietas da moda
- Longevidade saudável, sono e microbiota

Para cada tema identificado:
1. Crie um título magnético com gancho forte de retenção.
2. Recomende OBRIGATORIAMENTE o melhor formato entre os 7 do estúdio:
   - "autoridade": 1. Dra. Isabela Explica (posicionamento, desmistificação médica)
   - "prato": 2. Prato & Performance (refeições reais, macros, glicemia)
   - "ciencia": 3. Ciência vs Senso Comum (mitos da internet vs evidências ACSM)
   - "dicas": 4. Dicas 01 / 02 / 03 (listas práticas de 3 passos)
   - "cta": 5. CTA de Consulta (conversão para agendamento)
   - "manifesto": 6. Manifesto Clínico (frases curtas de impacto editorial)
   - "passo": 7. Ponto / Passo Clínico (fisiologia com card dourado de conduta 💡)

Retorne OBRIGATORIAMENTE um array JSON no seguinte formato:
[
  {
    "title": "Título em formato de gancho para o Instagram",
    "format": "autoridade | prato | ciencia | dicas | cta | manifesto | passo",
    "tag": "Nome do Tema Curto (sem whatsapp nem caracteres especiais)",
    "insight": "Breve explicação do porquê esse tema está em alta na internet"
  }
]`;

  try {
    const response = await callAiFn({
      prompt,
      systemInstruction: 'Você é um estrategista de conteúdo viral de nutrição e medicina. Devolva apenas um array JSON válido.',
      jsonMode: true,
      model
    });

    let rawList = response.json;
    if (!rawList && response.text) {
      try {
        rawList = JSON.parse(response.text);
      } catch {}
    }

    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((item) => {
        const formatId = VALID_FORMATS.includes(item.format) ? item.format : 'ciencia';
        const foundFormat = POST_FORMATS.find((f) => f.id === formatId);
        return {
          title: item.title || 'Tendência de Nutrição em Alta',
          format: formatId,
          formatLabel: foundFormat ? foundFormat.label : formatId,
          tag: String(item.tag || 'Tendência Web').replace(/^whatsapp\s*•?\s*/i, '').trim(),
          insight: item.insight || 'Tema em alta nas redes sociais e pesquisas de saúde.'
        };
      });
    }
  } catch (err) {
    console.warn('Erro ao buscar tendências da web com IA:', err.message);
  }

  return DEFAULT_TRENDING_TOPICS;
}
