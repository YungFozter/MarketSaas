/**
 * Utilidades de formateo para MarketSaaS
 */

/**
 * Formatea un monto numérico con el símbolo de moneda de la tienda
 * @param {number|string} amount
 * @param {string} symbol
 * @returns {string}
 */
export const formatCurrency = (amount, symbol = 'Bs.') => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return `${symbol} ${num.toFixed(2)}`;
};

/**
 * Formatea una fecha ISO a formato local legible
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Convierte un texto en un slug URL limpio y seguro
 * @param {string} text
 * @returns {string}
 */
export const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Limpia un número telefónico para enlaces de WhatsApp
 * @param {string} phone
 * @returns {string}
 */
export const cleanPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
};
