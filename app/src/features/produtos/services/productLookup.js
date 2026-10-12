export function normalizeBarcodeInput(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 14);
}

export async function lookupProductByBarcode(barcodeValue) {
  const barcode = normalizeBarcodeInput(barcodeValue);
  if (barcode.length < 7) throw new Error('Informe um código de barras válido, com pelo menos 7 dígitos.');

  const response = await fetch(`/api/products?barcode=${encodeURIComponent(barcode)}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível consultar o código de barras.');
  return data;
}

