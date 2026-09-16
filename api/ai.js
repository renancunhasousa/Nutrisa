import { timingSafeEqual } from 'node:crypto';
import { generateContent, getModels } from '../server/ai/service.js';
export const MAX_BODY_BYTES = 4_000_000;
const buckets = new Map();
function equalSecret(a, b) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const production = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const expected = process.env.AI_ACCESS_TOKEN;
  if (production && !expected) return res.status(503).json({ error: 'Configure o código de acesso de IA no servidor.' });
  if (expected && !equalSecret(req.headers.authorization || '', 'Bearer ' + expected)) {
    return res.status(401).json({ error: 'Informe o código de acesso nas configurações de IA.' });
  }
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (req.method === 'GET') return res.status(200).json({ configured: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY), models: getModels() });
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ error: 'Envie JSON.' });
  if (Buffer.byteLength(JSON.stringify(req.body || {})) > MAX_BODY_BYTES) return res.status(413).json({ error: 'Arquivos muito grandes. Reduza os PDFs e tente novamente.' });
  // Best-effort per-instance limit. Production also needs a shared edge limit.
  const now = Date.now();
  for (const [key, bucket] of buckets) if (now > bucket.until) buckets.delete(key);
  const client = production ? 'clinic' : (req.socket?.remoteAddress || 'local');
  const bucket = buckets.get(client) || { count: 0, until: now + 60_000 };
  if (++bucket.count > 20) return res.status(429).json({ error: 'Muitas solicitações. Aguarde um minuto.' });
  buckets.set(client, bucket);
  try {
    return res.status(200).json(await generateContent(req.body || {}));
  } catch (error) {
    return res.status(error.status || 502).json({ error: error.name === 'TimeoutError' ? 'A IA demorou demais. Tente novamente.' : error.message });
  }
}
