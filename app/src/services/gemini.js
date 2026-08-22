/**
 * Serviço centralizado de integração com modelos de Inteligência Artificial Google Gemini
 * Suporta cascata automática de fallback entre modelos caso haja limitação de cota ou indisponibilidade.
 */

import { sanitizeJsonString } from '../utils/formatters';

const FALLBACK_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

export const callGeminiWithFallback = async ({ prompt, imageBase64 = null, systemInstruction = '', jsonMode = false }) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave VITE_GEMINI_API_KEY não configurada no ambiente.');
  }

  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const contents = [];
      const parts = [];

      if (imageBase64) {
        parts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
          }
        });
      }

      parts.push({ text: prompt });
      contents.push({ role: 'user', parts });

      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2500,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status} (${modelName}): ${errText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!rawText) {
        throw new Error(`Resposta vazia do modelo ${modelName}`);
      }

      return {
        modelUsed: modelName,
        text: rawText,
        json: jsonMode ? JSON.parse(sanitizeJsonString(rawText)) : null
      };

    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Fallback] Falha no modelo ${modelName}:`, err.message);
      // Continua para o próximo modelo na cascata
    }
  }

  throw new Error(`Todos os modelos Gemini falharam. Último erro: ${lastError?.message || 'Erro desconhecido'}`);
};
