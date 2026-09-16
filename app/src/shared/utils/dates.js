/**
 * Utilitários de formatação de datas para pt-BR.
 */

/**
 * Formata uma data para o padrão dd/mm/aaaa em pt-BR.
 * Retorna '--' para entradas inválidas.
 */
export function formatDateBr(dateInput) {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data e hora para o padrão dd/mm/aaaa às hh:mm em pt-BR.
 * Retorna '--' para entradas inválidas.
 */
export function formatDateTimeBr(dateInput) {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '--';
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
