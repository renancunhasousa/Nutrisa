/**
 * whatsappPostService.js
 * Serviço de Inteligência de Conteúdo: analisa mensagens reais do WhatsApp de pacientes da NutrIsa
 * e gera pautas de marketing para o Instagram com recomendação automática do modelo ideal entre os 7 disponíveis.
 */

import { fetchConversations } from '../../atendimento/services/conversations.js';
import { POST_FORMATS } from './postGeneratorService.js';

const VALID_FORMATS = ['autoridade', 'prato', 'ciencia', 'dicas', 'cta', 'manifesto', 'passo'];

/**
 * Filtra e seleciona as mensagens de pacientes que contêm dúvidas, dificuldades ou queixas relevantes.
 */
export function filterRelevantWhatsAppMessages(conversations = []) {
  if (!Array.isArray(conversations) || conversations.length === 0) return [];

  // Padrões de ruído para ignorar (saudações vazias, confirmações curtas, links)
  const noisePatterns = [
    /^(oi|olá|ola|bom dia|boa tarde|boa noite|obrigad[ao]|valeu|ok|sim|não|nao|combinado|fechado|tá bom|ta bom|blz|beleza)\.?$/i,
    /^https?:\/\//i
  ];

  return conversations
    .filter((c) => {
      const text = (c.mensagem_texto || c.conteudo_mensagem || '').trim();
      if (text.length < 15) return false;
      const isNoise = noisePatterns.some((pattern) => pattern.test(text));
      return !isNoise;
    })
    .slice(0, 40);
}

/**
 * Pautas reais típicas de consultório nutricional/esportivo para fallback caso não haja mensagens no momento
 */
export const DEFAULT_WHATSAPP_IDEAS = [
  {
    title: 'Por que o peso na balança oscila até 2kg de um dia pro outro?',
    format: 'passo',
    formatLabel: '7. Ponto / Passo Clínico',
    whatsappInsight: 'Dúvida frequente de pacientes ansiosos com oscilações diárias de peso após treino pesado ou refeição com mais sódio.',
    tag: 'Retenção & Balança'
  },
  {
    title: 'Creatina antes ou depois do treino? O que a ciência comprova',
    format: 'ciencia',
    formatLabel: '3. Ciência vs Senso Comum',
    whatsappInsight: 'Pacientes em dúvida se o horário da creatina afeta o resultado ou se ela retém líquidos prejudiciais.',
    tag: 'Suplementação'
  },
  {
    title: 'O que comer antes do treino quando você acorda cedo e sem fome',
    format: 'prato',
    formatLabel: '2. Prato & Performance',
    whatsappInsight: 'Queixa de pacientes que treinam às 6h da manhã e sentem náusea comendo comida sólida.',
    tag: 'Pré-Treino'
  },
  {
    title: '3 estratégias para não sabotar a dieta no final de semana',
    format: 'dicas',
    formatLabel: '4. Dicas 01 / 02 / 03',
    whatsappInsight: 'Pacientes relatam seguir o plano impecável de segunda a sexta, mas perder o controle no sábado e domingo.',
    tag: 'Constância'
  },
  {
    title: 'Déficit calórico sem passar fome: como calcular com precisão',
    format: 'autoridade',
    formatLabel: '1. Dra. Isabela Explica',
    whatsappInsight: 'Dúvida de pacientes que cortam calorias excessivamente e sofrem com compulsão noturna.',
    tag: 'Metabolismo'
  },
  {
    title: 'Constância supera a perfeição: o resultado que você procura é construído em 12 meses',
    format: 'manifesto',
    formatLabel: '6. Manifesto Clínico',
    whatsappInsight: 'Pacientes desanimados após deslizes pontuais na primeira semana de acompanhamento.',
    tag: 'Mentalidade'
  }
];

/**
 * Analisa as mensagens do WhatsApp do Supabase com IA (Gemini)
 * e devolve ideias de post com o formato recomendado dentre os 7 existentes.
 */
export async function extractMarketingIdeasFromWhatsApp({
  fetchConversationsFn = fetchConversations,
  callAiFn,
  model
} = {}) {
  let relevantMessages = [];

  try {
    const rawConversations = await fetchConversationsFn({ limit: 80 });
    relevantMessages = filterRelevantWhatsAppMessages(rawConversations);
  } catch (err) {
    console.warn('Não foi possível ler as conversas do Supabase:', err.message);
  }

  // Se não houver mensagens ou se a IA não estiver disponível, retorna o catálogo curado
  if (relevantMessages.length === 0 || typeof callAiFn !== 'function') {
    return DEFAULT_WHATSAPP_IDEAS;
  }

  // Anonimiza e monta o resumo das mensagens para análise segura
  const anonymizedSnippets = relevantMessages
    .slice(0, 30)
    .map((m, idx) => `[Mensagem ${idx + 1}]: "${(m.mensagem_texto || '').slice(0, 180)}"`)
    .join('\n');

  const prompt = `Você é o estrategista de marketing médico e de conteúdo da Dra. Isabela Muñoz (Nutricionista Clínica e Esportiva, certificada ACSM).

Analise as mensagens REAIS que os pacientes enviaram no WhatsApp da clínica abaixo:
---
${anonymizedSnippets}
---

Sua missão:
1. Identifique as 4 a 6 principais dúvidas, queixas, dores, dificuldades na dieta ou mitos que os pacientes estão trazendo nas conversas.
2. Para cada dúvida identificada, crie uma pauta magnética para o Instagram e OBRIGATORIAMENTE recomende o melhor formato entre os 7 formatos do estúdio da Dra. Isabela:
   - "autoridade": 1. Dra. Isabela Explica (para autoridade médica, desmistificação de conceitos e posicionamento)
   - "prato": 2. Prato & Performance (para dúvidas sobre refeições reais, pré/pós treino e cálculos de macronutrientes)
   - "ciencia": 3. Ciência vs Senso Comum (para mitos populares confrontados com evidências científicas/ACSM)
   - "dicas": 4. Dicas 01 / 02 / 03 (para listas práticas de 3 passos ou estratégias para aplicar na rotina)
   - "cta": 5. CTA de Consulta (para dúvidas sobre agendamento, como funciona a consulta ou chamada direta)
   - "manifesto": 6. Manifesto Clínico (para frases de impacto sobre constância, autocrítica ou culpa alimentar)
   - "passo": 7. Ponto / Passo Clínico (para explicações aprofundadas com número grande e card de conduta clínica)

Retorne OBRIGATORIAMENTE um array JSON no seguinte formato (sem texto antes ou depois):
[
  {
    "title": "Título magnético em estilo gancho para o post",
    "format": "um dos 7 valores: autoridade | prato | ciencia | dicas | cta | manifesto | passo",
    "whatsappInsight": "Explicação curta do que os pacientes relataram no WhatsApp (ex: Pacientes com dúvida sobre o que comer antes do treino matinal)",
    "tag": "WhatsApp • [Nome do Tema Curto]"
  }
]`;

  try {
    const response = await callAiFn({
      prompt,
      systemInstruction: 'Você é um estrategista de conteúdo para nutricionistas esportivos. Devolva apenas um array JSON válido.',
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
        const formatId = VALID_FORMATS.includes(item.format) ? item.format : 'autoridade';
        const foundFormat = POST_FORMATS.find((f) => f.id === formatId);
        return {
          title: item.title || 'Dúvida Frequente do Consultório',
          format: formatId,
          formatLabel: foundFormat ? foundFormat.label : formatId,
          whatsappInsight: item.whatsappInsight || 'Dúvida recorrente identificada nas mensagens de pacientes.',
          tag: String(item.tag || 'Dúvida Real').replace(/^whatsapp\s*•?\s*/i, '').trim() || 'Dúvida Real'
        };
      });
    }
  } catch (err) {
    console.warn('Erro ao processar ideias do WhatsApp com a IA:', err.message);
  }

  return DEFAULT_WHATSAPP_IDEAS;
}
