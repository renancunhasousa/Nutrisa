/**
 * Módulo de conversão de medidas para o criador de dietas
 * Converte medidas caseiras (colher, fatia, xícara, unidade) para gramas e vice-versa.
 */

/**
 * Converte uma quantidade dada em determinada unidade/medida caseira para gramas de referência (base 100g)
 * @param {number} quantity - Quantidade selecionada (ex: 2)
 * @param {string} unit - Nome da unidade ('g', 'ml', ou nome da medida caseira)
 * @param {Array<{ name: string, grams: number }>} householdMeasures - Lista de medidas caseiras do alimento
 * @param {number} portionBaseGrams - Base do alimento (padrão 100g)
 * @returns {number} Quantidade equivalente em gramas
 */
export function convertToGrams(quantity = 0, unit = 'g', householdMeasures = [], portionBaseGrams = 100) {
  const qty = Number(quantity) || 0;
  if (qty <= 0) return 0;

  if (unit === 'g' || unit === 'ml') {
    return qty;
  }

  // Se for medida caseira, buscar nos householdMeasures do alimento
  if (Array.isArray(householdMeasures) && householdMeasures.length > 0) {
    const match = householdMeasures.find(
      m => m.name.toLowerCase().trim() === unit.toLowerCase().trim()
    );
    if (match && Number(match.grams) > 0) {
      return qty * Number(match.grams);
    }
  }

  // Fallback caso a unidade seja número ou padrão
  return qty * portionBaseGrams;
}

/**
 * Formata a quantidade e unidade para exibição amigável
 * Ex: "2 Colheres de sopa (50g)" ou "100g"
 */
export function formatMeasureDisplay(quantity, unit, grams) {
  const qty = Number(quantity) || 0;
  if (!unit || unit === 'g') {
    return `${qty}g`;
  }
  if (unit === 'ml') {
    return `${qty}ml`;
  }
  const g = Math.round(Number(grams) || 0);
  return `${qty} ${unit}${g > 0 ? ` (${g}g)` : ''}`;
}
