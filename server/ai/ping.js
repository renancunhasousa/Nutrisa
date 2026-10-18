// Executa ping ultraleve e rápido em paralelo nos provedores de IA configurados
// para diagnóstico em tempo real sem onerar custos ou latência.
import { getModels } from './models.js';
import { callGeminiApi } from './providers/gemini.js';
import { callOpenAiApi } from './providers/openai.js';
import { callDeepSeekApi } from './providers/deepseek.js';

const PING_PAYLOAD = {
  contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
  generationConfig: { maxOutputTokens: 5, temperature: 0.1 },
};

/**
 * Dispara teste de conexão ao vivo para todos os provedores em paralelo.
 *
 * @param {{ env?: object, fetchImpl?: typeof fetch }} options
 * @returns {Promise<{ results: Record<string, { configured: boolean, online: boolean, latencyMs?: number, model?: string, error?: string }> }>}
 */
export async function pingAllProviders({ env = process.env, fetchImpl = fetch } = {}) {
  const hasGemini = Boolean(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY);
  const hasOpenAi = Boolean(env.OPENAI_API_KEY);
  const hasDeepSeek = Boolean(env.DEEPSEEK_API_KEY);
  const geminiModels = getModels(env);

  const [geminiResult, openAiResult, deepSeekResult] = await Promise.all([
    // 1. Google Gemini (tenta modelo preferido e faz fallback entre modelos Gemini se 503/429)
    (async () => {
      if (!hasGemini) return { configured: false, online: false };
      const start = Date.now();
      let lastStatus;
      let lastError;

      for (const model of geminiModels) {
        try {
          const res = await callGeminiApi(model, PING_PAYLOAD, { env, fetchImpl });
          if (res.ok) {
            return {
              configured: true,
              online: true,
              latencyMs: Date.now() - start,
              status: res.status,
              model,
            };
          }
          lastStatus = res.status;
          const body = await res.json().catch(() => ({}));
          lastError = body?.error?.message || `HTTP ${res.status}`;
          if (res.status === 503 || res.status === 429) continue;
          break;
        } catch (err) {
          lastError = err.message;
        }
      }

      return {
        configured: true,
        online: false,
        latencyMs: Date.now() - start,
        model: geminiModels[0],
        error: lastError || (lastStatus ? `HTTP ${lastStatus}` : 'Falha'),
      };
    })(),

    // 2. OpenAI
    (async () => {
      if (!hasOpenAi) return { configured: false, online: false };
      const start = Date.now();
      try {
        const res = await callOpenAiApi('gpt-6-luna', PING_PAYLOAD, { env, fetchImpl });
        const latencyMs = Date.now() - start;
        return {
          configured: true,
          online: res.ok,
          latencyMs,
          status: res.status,
          model: 'gpt-6-luna',
          ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
        };
      } catch (err) {
        return {
          configured: true,
          online: false,
          latencyMs: Date.now() - start,
          model: 'gpt-6-luna',
          error: err.message,
        };
      }
    })(),

    // 3. DeepSeek
    (async () => {
      if (!hasDeepSeek) return { configured: false, online: false };
      const start = Date.now();
      try {
        const res = await callDeepSeekApi('deepseek-flash', PING_PAYLOAD, { env, fetchImpl });
        const latencyMs = Date.now() - start;
        return {
          configured: true,
          online: res.ok,
          latencyMs,
          status: res.status,
          model: 'deepseek-flash',
          ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
        };
      } catch (err) {
        return {
          configured: true,
          online: false,
          latencyMs: Date.now() - start,
          model: 'deepseek-flash',
          error: err.message,
        };
      }
    })(),
  ]);

  return {
    results: {
      gemini: geminiResult,
      openai: openAiResult,
      deepseek: deepSeekResult,
    },
  };
}
