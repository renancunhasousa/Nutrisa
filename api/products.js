import { lookupProductByBarcode } from '../server/products/productLookup.js';
import { searchFoodDataCentral, isFdcConfigured } from '../server/products/foodDataCentral.js';
import { searchTbca, getTbcaFoodProfile, isTbcaConfigured } from '../server/products/tbcaParse.js';

const buckets = new Map();

function getClientAddress(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function allowRequest(req) {
  const now = Date.now();
  const key = getClientAddress(req);
  const bucket = buckets.get(key) || { count: 0, until: now + 60_000 };
  if (now > bucket.until) {
    bucket.count = 0;
    bucket.until = now + 60_000;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return bucket.count <= 60;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!allowRequest(req)) return res.status(429).json({ error: 'Muitas consultas. Aguarde um minuto.' });

  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    const source = req.query?.source || requestUrl.searchParams.get('source');
    const query = req.query?.query || requestUrl.searchParams.get('query');
    if (source === 'fdc' || query) {
      if (!query || String(query).trim().length < 2) {
        return res.status(400).json({ error: 'Informe uma busca com pelo menos 2 caracteres.' });
      }
      if (source === 'tbca') {
        if (!isTbcaConfigured()) {
          res.setHeader('Cache-Control', 'no-store');
          return res.status(200).json({
            foods: [],
            notConfigured: true,
            message: 'TBCA não configurada: defina TBCA_PARSE_API_KEY no ambiente do servidor.',
          });
        }
        const detailId = req.query?.detailId || requestUrl.searchParams.get('detailId');
        const result = detailId
          ? { food: await getTbcaFoodProfile(detailId) }
          : await searchTbca(query, { page: requestUrl.searchParams.get('page') || 1 });
        res.setHeader('Cache-Control', 'private, max-age=300');
        return res.status(200).json(result);
      }

      if (!isFdcConfigured()) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({
          foods: [],
          notConfigured: true,
          message: 'FoodData Central não configurado: defina FDC_API_KEY no ambiente do servidor.',
        });
      }
      const page = Math.max(Number(requestUrl.searchParams.get('page')) || 1, 1);
      const result = await searchFoodDataCentral(query, { pageSize: 8, pageNumber: page });
      result.page = page;
      result.hasMore = page * 8 < result.totalHits;
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.status(200).json(result);
    }
    const result = await lookupProductByBarcode(req.query?.barcode || requestUrl.searchParams.get('barcode'));
    if (!result) {
      res.setHeader('Cache-Control', 'public, s-maxage=300');
      return res.status(404).json({
        error: 'Produto não encontrado pelo código de barras. Envie uma foto do rótulo ou preencha manualmente.',
        code: 'PRODUCT_NOT_FOUND',
      });
    }
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(result);
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(error.status || 502).json({ error: error.message || 'Não foi possível consultar o produto.' });
  }
}
