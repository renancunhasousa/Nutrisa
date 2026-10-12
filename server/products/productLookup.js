import { lookupOpenFoodFacts, normalizeBarcode } from './openFoodFacts.js';

export async function lookupProductByBarcode(barcodeValue, {
  fetchImpl = fetch,
  lookupOpenFoodFactsImpl = lookupOpenFoodFacts,
} = {}) {
  const barcode = normalizeBarcode(barcodeValue);
  const product = await lookupOpenFoodFactsImpl(barcode, { fetchImpl });
  return product ? { product, provider: 'open_food_facts' } : null;
}
