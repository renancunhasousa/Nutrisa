/**
 * Serviço centralizado de integração com modelos de Inteligência Artificial Google Gemini
 * Suporta cascata automática de fallback entre modelos caso haja limitação de cota ou indisponibilidade.
 */

import { sanitizeJsonString } from '../utils/formatters';

const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'deepseek-flash',
  'deepseek-chat',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

export const callGeminiWithFallback = async ({ prompt, imageBase64 = null, systemInstruction = '', jsonMode = false }) => {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const deepseekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

  if (!geminiApiKey && !deepseekApiKey) {
    throw new Error('Chave VITE_GEMINI_API_KEY ou VITE_DEEPSEEK_API_KEY não configurada no ambiente.');
  }

  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      if (modelName.startsWith('deepseek')) {
        if (!deepseekApiKey) continue;

        const messages = [];
        if (systemInstruction) {
          messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const body = {
          model: modelName === 'deepseek-flash' ? 'deepseek-flash' : 'deepseek-chat',
          messages,
          stream: false
        };
        if (jsonMode) {
          body.response_format = { type: 'json_object' };
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status} (${modelName}): ${errText}`);
        }

        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content || '';
        if (!rawText) throw new Error(`Resposta vazia do modelo ${modelName}`);

        if (jsonMode) {
          return JSON.parse(sanitizeJsonString(rawText));
        }
        return rawText;
      }

      if (!geminiApiKey) continue;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

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
