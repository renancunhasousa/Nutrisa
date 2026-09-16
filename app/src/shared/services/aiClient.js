import { sanitizeJsonString } from '../utils/formatters.js';
import { KEY_AI_ACCESS } from '../../config/storageKeys.js';
const ACCESS_KEY = KEY_AI_ACCESS;
export function getAiAccessToken() {
  try { return sessionStorage.getItem(ACCESS_KEY) || ''; } catch { return ''; }
}
export function setAiAccessToken(value) {
  if (value) sessionStorage.setItem(ACCESS_KEY, value.trim());
  else sessionStorage.removeItem(ACCESS_KEY);
}
async function request(options = {}) {
  const response = await fetch('/api/ai', {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(getAiAccessToken() ? { Authorization: 'Bearer ' + getAiAccessToken() } : {}) },
    signal: AbortSignal.timeout(100_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível acessar o serviço de IA.');
  return data;
}
export const getAiStatus = () => request();
export async function executeGemini(payload, selectedModel) {
  const { models } = await getAiStatus();
  const model = models.includes(selectedModel) ? selectedModel : models[0];
  return request({ method: 'POST', body: JSON.stringify({ model, payload }) });
}
export async function callGeminiWithFallback({ prompt, systemInstruction = '', jsonMode = false, model }) {
  const { result, usedModel } = await executeGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: { temperature: 0.2, maxOutputTokens: 4000, ...(jsonMode ? { responseMimeType: 'application/json' } : {}) },
  }, model);
  const text = result.candidates[0].content.parts.filter(part => part.text).map(part => part.text).join('\n');
  return { modelUsed: usedModel, text, json: jsonMode ? JSON.parse(sanitizeJsonString(text)) : null };
}
