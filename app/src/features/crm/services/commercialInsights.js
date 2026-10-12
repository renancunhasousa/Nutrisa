import { callGeminiWithFallback } from '../../../shared/services/aiClient.js';

function redact(value, name = '') {
  let text = String(value || '')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email removido]')
    .replace(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}[-.\s]?\d{4}/g, '[telefone removido]')
    .replace(/\b\d{11}\b/g, '[identificador removido]');
  const normalizedName = String(name || '').trim();
  if (normalizedName.length >= 3) {
    const escaped = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'gi'), '[paciente]');
  }
  return text.trim().slice(0, 240);
}

export function prepareCommercialDataset({ patients, conversations, opportunities }) {
  const lifecycle = patients.reduce((acc, patient) => {
    const stage = patient.lifecycle_stage || 'unknown';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});
  const painSignals = conversations
    .filter((message) => message.mensagem_texto || message.conteudo_mensagem)
    .slice(0, 60)
    .map((message) => ({
      category: message.categoria || 'Geral',
      text: redact(message.mensagem_texto || message.conteudo_mensagem, message.nome_paciente),
    }))
    .filter((message) => message.text.length >= 8);
  return {
    totalPatients: patients.length,
    lifecycle,
    opportunities: opportunities.map(({ title, audience, pain, offer, patientCount }) => ({ title, audience, pain, offer, patientCount })),
    anonymizedRecentSignals: painSignals,
  };
}

export async function generateCommercialInsights({ patients, conversations, opportunities, model }) {
  const dataset = prepareCommercialDataset({ patients, conversations, opportunities });
  const { json, modelUsed } = await callGeminiWithFallback({
    model,
    jsonMode: true,
    systemInstruction: 'Você é estrategista de produtos e CRM para uma clínica de nutrição brasileira. Você não diagnostica, não prescreve e não usa medo, culpa ou promessas de resultado garantido.',
    prompt: `Analise os dados agregados e trechos anonimizados abaixo para encontrar oportunidades comerciais responsáveis.\n\nDADOS:\n${JSON.stringify(dataset)}\n\nRetorne JSON válido com esta estrutura exata:\n{"executiveSummary":"string curta","painPatterns":[{"pain":"string","evidence":"string sem citar pacientes","opportunity":"string"}],"suggestedPlans":[{"name":"string","audience":"string","promise":"string ética e realista","deliverables":["string"],"duration":"string","salesAngle":"string","validationQuestion":"string"}],"nextActions":["string"]}\n\nRegras: máximo 4 dores, exatamente 3 planos e 4 próximas ações; não exponha nem tente reconstruir identidades; diferencie evidência observada de hipótese; não sugira preço sem dados de custo e posicionamento; planos clínicos exigem validação da nutricionista.`,
  });
  return { insight: json, modelUsed };
}
