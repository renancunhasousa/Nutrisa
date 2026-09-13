export default async function handler(req, res) {
  // Configuração CORS para permitir chamadas do front-end
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { provider, model, payload, stream = false } = req.body || {};

    if (!provider || !model) {
      return res.status(400).json({ error: 'Parâmetros "provider" e "model" são obrigatórios.' });
    }

    // --- PROVEDOR GOOGLE GEMINI ---
    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Chave GEMINI_API_KEY não configurada no servidor Vercel.' });
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await geminiRes.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (!geminiRes.ok) {
        return res.status(geminiRes.status).json({
          error: `Google Gemini API error (${geminiRes.status})`,
          details: responseData
        });
      }

      return res.status(200).json(responseData);
    }

    // --- PROVEDOR DEEPSEEK ---
    if (provider === 'deepseek') {
      const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Chave DEEPSEEK_API_KEY não configurada no servidor Vercel.' });
      }

      const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      const responseText = await dsRes.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (!dsRes.ok) {
        return res.status(dsRes.status).json({
          error: `DeepSeek API error (${dsRes.status})`,
          details: responseData
        });
      }

      return res.status(200).json(responseData);
    }

    return res.status(400).json({ error: `Provedor "${provider}" não reconhecido.` });
  } catch (error) {
    console.error('Erro no proxy de IA:', error);
    return res.status(500).json({ error: 'Erro interno ao processar requisição de IA.', message: error.message });
  }
}
