// Adaptador universal para provedores compatíveis com a API OpenAI (OpenAI, DeepSeek, etc.).
// Converte o payload proprietário do Gemini para Chat Completions e normaliza a resposta de volta.

/**
 * Converte payload no formato Gemini para OpenAI Chat Completions.
 *
 * @param {object} payload - Payload com `contents`, `systemInstruction`, `generationConfig`
 * @param {string} model - Nome do modelo (ex: 'gpt-4o-mini', 'deepseek-flash')
 * @returns {object} Payload no padrão OpenAI
 */
export function convertGeminiPayloadToOpenAi(payload, model) {
  const messages = [];

  // 1. System instruction
  let systemText = (payload.systemInstruction?.parts || [])
    .map(p => p.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  const isJson = payload.generationConfig?.responseMimeType === 'application/json';

  // OpenAI exige a palavra "json" em alguma mensagem caso response_format seja json_object
  if (isJson) {
    if (!systemText.toLowerCase().includes('json')) {
      systemText = systemText
        ? `${systemText}\nRetorne a resposta estritamente em formato JSON válido.`
        : 'Retorne a resposta estritamente em formato JSON válido.';
    }
  }

  if (systemText) {
    messages.push({ role: 'system', content: systemText });
  }

  // 2. Mensagens de contents (role: 'user' | 'model'/'assistant')
  for (const item of payload.contents || []) {
    const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
    const parts = item.parts || [];

    const hasImages = parts.some(p => p.inline_data || p.inlineData);

    if (!hasImages) {
      const text = parts.map(p => p.text || '').join('\n');
      messages.push({ role, content: text });
    } else {
      const content = [];
      for (const p of parts) {
        if (p.text) {
          content.push({ type: 'text', text: p.text });
        }
        const inline = p.inline_data || p.inlineData;
        if (inline?.data) {
          const mimeType = inline.mime_type || inline.mimeType || 'image/jpeg';
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${inline.data}`,
            },
          });
        }
      }
      messages.push({ role, content });
    }
  }

  const maxTokens = Math.min(
    Number(payload.generationConfig?.maxOutputTokens) || 8192,
    16384,
  );

  const body = {
    model,
    messages,
    temperature: payload.generationConfig?.temperature ?? 0.2,
    max_tokens: maxTokens,
  };

  if (isJson) {
    body.response_format = { type: 'json_object' };
  }

  return body;
}

/**
 * Normaliza o resultado retornado pelo OpenAI/DeepSeek para a estrutura
 * de candidates/parts esperada pelo frontend do NutrIsa.
 *
 * @param {object} openAiData
 * @returns {object} Formato unificado compatível com o cliente do NutrIsa
 */
export function formatOpenAiResponseToGemini(openAiData) {
  const text = openAiData?.choices?.[0]?.message?.content || '';
  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [{ text }],
        },
        finishReason: openAiData?.choices?.[0]?.finish_reason || 'STOP',
      },
    ],
    usageMetadata: openAiData?.usage ? {
      promptTokenCount: openAiData.usage.prompt_tokens,
      candidatesTokenCount: openAiData.usage.completion_tokens,
      totalTokenCount: openAiData.usage.total_tokens,
    } : undefined,
  };
}
