/**
 * paymentUtils.js
 * Utilidades canónicas y blindaje para métodos de pago y Pago Combinado en MarketSaaS.
 * Proporciona validación matemática, redondeo seguro a 2 decimales, normalización
 * de esquemas y cálculo de proporciones para arqueo de caja y reportes.
 */

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  QR: 'qr',
  CARD: 'card',
  CREDIT: 'credit',
  COMBINED: 'combined'
});

export const PAYMENT_METHOD_LABELS = Object.freeze({
  [PAYMENT_METHODS.CASH]: 'Efectivo',
  [PAYMENT_METHODS.QR]: 'QR Simple (Digital)',
  [PAYMENT_METHODS.CARD]: 'Tarjeta POS',
  [PAYMENT_METHODS.CREDIT]: 'A Cuenta (Fiao)',
  [PAYMENT_METHODS.COMBINED]: 'Pago Combinado'
});

/**
 * Redondeo matemático seguro a 2 decimales para evitar desajustes por precisión en punto flotante IEEE 754.
 * @param {number|string} val 
 * @returns {number}
 */
export const roundMoney = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Normaliza y sanea el objeto de desglose de un Pago Combinado.
 * Protege contra valores negativos, strings malformados o inyecciones desde DevTools.
 * 
 * @param {Object} rawSplit Objeto recibido { cash, qr, card, cashGiven, change }
 * @param {number} totalAmount Monto total esperado de la venta
 * @returns {Object} Objeto saneado e inmutable con 2 decimales
 */
export const normalizeSplitPayment = (rawSplit, totalAmount = 0) => {
  if (!rawSplit || typeof rawSplit !== 'object') {
    return null;
  }

  const safeTotal = Math.max(0, roundMoney(totalAmount));

  // Sanitizar porciones asegurando que no sean negativas ni NaN
  const cash = Math.max(0, roundMoney(rawSplit.cash || rawSplit.cashAmount || 0));
  const qr = Math.max(0, roundMoney(rawSplit.qr || rawSplit.qrAmount || 0));
  const card = Math.max(0, roundMoney(rawSplit.card || rawSplit.cardAmount || 0));

  // Cálculo de efectivo entregado y cambio
  const cashGivenRaw = rawSplit.cashGiven || rawSplit.cash_given || rawSplit.cashReceived || rawSplit.cash_received;
  const cashGiven = cashGivenRaw != null ? Math.max(0, roundMoney(cashGivenRaw)) : cash;
  const change = cashGiven > cash ? roundMoney(cashGiven - cash) : 0;

  const sumCovered = roundMoney(cash + qr + card);
  const diff = roundMoney(safeTotal - sumCovered);
  const isExact = Math.abs(diff) < 0.01;

  return {
    cash,
    qr,
    card,
    cashGiven,
    change,
    totalCovered: sumCovered,
    isExact,
    difference: diff
  };
};

/**
 * Valida si un Pago Combinado cubre con precisión matemática el total requerido.
 * 
 * @param {Object} split Objeto con { cash, qr, card }
 * @param {number} total Monto total requerido
 * @returns {{ isValid: boolean, covered: number, remaining: number, error: string|null }}
 */
export const validateSplitPayment = (split, total) => {
  const safeTotal = Math.max(0, roundMoney(total));
  const normalized = normalizeSplitPayment(split, safeTotal);

  if (!normalized) {
    return {
      isValid: false,
      covered: 0,
      remaining: safeTotal,
      error: 'Detalles de pago combinado no especificados.'
    };
  }

  const { cash, qr, card, totalCovered } = normalized;

  // Al menos dos métodos deben tener saldo o al menos uno positivo si se usa combinado
  const methodsCount = [cash > 0, qr > 0, card > 0].filter(Boolean).length;
  if (methodsCount < 1) {
    return {
      isValid: false,
      covered: 0,
      remaining: safeTotal,
      error: 'Debes ingresar un monto en al menos uno de los métodos de pago.'
    };
  }

  const diff = roundMoney(safeTotal - totalCovered);

  if (diff > 0.009) {
    return {
      isValid: false,
      covered: totalCovered,
      remaining: diff,
      error: `Faltan Bs. ${diff.toFixed(2)} para cubrir el total de Bs. ${safeTotal.toFixed(2)}.`
    };
  }

  if (diff < -0.009) {
    return {
      isValid: false,
      covered: totalCovered,
      remaining: 0,
      error: `El monto ingresado excede el total por Bs. ${Math.abs(diff).toFixed(2)}.`
    };
  }

  return {
    isValid: true,
    covered: totalCovered,
    remaining: 0,
    error: null
  };
};

/**
 * Extrae las proporciones exactas de dinero (Efectivo, QR, Tarjeta, Fiao) de CUALQUIER orden,
 * ya sea que tenga pago simple o pago combinado.
 * Función crítica para que el Arqueo de Caja (CashRegisterModal), el Resumen Semanal
 * y los Reportes de Ventas cuadren de forma 100% matemática.
 * 
 * @param {Object} order Pedido normalizado
 * @returns {{ cash: number, qr: number, card: number, credit: number, total: number }}
 */
export const calculateSplitPortions = (order) => {
  if (!order || typeof order !== 'object') {
    return { cash: 0, qr: 0, card: 0, credit: 0, total: 0, isSplit: false };
  }

  const total = roundMoney(order.total || 0);

  // Extracción canónica e inmune a objetos de la categoría de método de pago
  let method = 'cash';
  if (typeof order.paymentMethod === 'string') {
    method = order.paymentMethod.toLowerCase().trim();
  } else if (order.paymentMethod && typeof order.paymentMethod === 'object') {
    method = String(order.paymentMethod.type || order.paymentMethod.method || '').toLowerCase().trim();
  } else if (typeof order.payment_method === 'string') {
    method = order.payment_method.toLowerCase().trim();
  } else if (order.payment_method && typeof order.payment_method === 'object') {
    method = String(order.payment_method.type || order.payment_method.method || '').toLowerCase().trim();
  }

  // Búsqueda exhaustiva del desglose de Pago Combinado en todas las propiedades posibles
  let rawSplit = 
    order.splitPayment || 
    order.split_payment || 
    (typeof order.paymentMethod === 'object' ? (order.paymentMethod?.splitPayment || order.paymentMethod?.split_payment) : null) ||
    (typeof order.payment_method === 'object' ? (order.payment_method?.splitPayment || order.payment_method?.split_payment) : null) ||
    order.customer?.splitPayment || 
    order.customer?.split_payment ||
    (order.metadata?.splitPayment || order.metadata?.split_payment);

  // Fallback si payment_method fue serializado como string JSON
  if (!rawSplit && typeof order.payment_method === 'string' && order.payment_method.startsWith('{')) {
    try {
      const parsed = JSON.parse(order.payment_method);
      rawSplit = parsed.splitPayment || parsed.split_payment || parsed;
    } catch {}
  }

  const isCombined = method === PAYMENT_METHODS.COMBINED || method === 'split' || Boolean(rawSplit);

  // Caso: Pago Combinado
  if (isCombined) {
    const split = normalizeSplitPayment(rawSplit, total);
    if (split && (split.cash > 0 || split.qr > 0 || split.card > 0)) {
      return {
        cash: split.cash,
        qr: split.qr,
        card: split.card,
        credit: 0,
        total: total,
        isSplit: true
      };
    }

    // Si está marcado como combinado pero se perdió el detalle numérico exacto,
    // NO asignar 100% a efectivo de forma arbitraria para no engañar los arqueos.
    return {
      cash: 0,
      qr: 0,
      card: 0,
      credit: 0,
      total: total,
      isSplit: true,
      isUnknownBreakdown: true
    };
  }

  // Casos simples directos
  if (method === PAYMENT_METHODS.QR || method === 'transfer') {
    return { cash: 0, qr: total, card: 0, credit: 0, total, isSplit: false };
  }

  if (method === PAYMENT_METHODS.CARD || method === 'pos') {
    return { cash: 0, qr: 0, card: total, credit: 0, total, isSplit: false };
  }

  if (method === PAYMENT_METHODS.CREDIT || method === 'fiao' || method === 'cuenta') {
    return { cash: 0, qr: 0, card: 0, credit: total, total, isSplit: false };
  }

  // Por defecto: Efectivo
  return { cash: total, qr: 0, card: 0, credit: 0, total, isSplit: false };
};

/**
 * Devuelve un texto descriptivo y resumido del pago para badges, reportes y comprobantes.
 * Ej: "Bs. 30.00 Efec. + Bs. 20.00 QR" o "Efectivo"
 * 
 * @param {Object} order 
 * @param {string} currency Símbolo monetario (ej: 'Bs.')
 * @returns {string}
 */
export const formatPaymentBreakdownText = (order, currency = 'Bs.') => {
  if (!order) return 'Efectivo';

  let method = 'cash';
  if (typeof order.paymentMethod === 'string') {
    method = order.paymentMethod.toLowerCase().trim();
  } else if (order.paymentMethod && typeof order.paymentMethod === 'object') {
    method = String(order.paymentMethod.type || order.paymentMethod.method || '').toLowerCase().trim();
  } else if (typeof order.payment_method === 'string') {
    method = order.payment_method.toLowerCase().trim();
  } else if (order.payment_method && typeof order.payment_method === 'object') {
    method = String(order.payment_method.type || order.payment_method.method || '').toLowerCase().trim();
  }

  const rawSplit = 
    order.splitPayment || 
    order.split_payment || 
    (typeof order.paymentMethod === 'object' ? (order.paymentMethod?.splitPayment || order.paymentMethod?.split_payment) : null) ||
    (typeof order.payment_method === 'object' ? (order.payment_method?.splitPayment || order.payment_method?.split_payment) : null) ||
    order.customer?.splitPayment || 
    order.customer?.split_payment;

  const isCombined = method === PAYMENT_METHODS.COMBINED || method === 'split' || Boolean(rawSplit);

  if (isCombined) {
    const p = calculateSplitPortions(order);
    const parts = [];
    if (p.cash > 0) parts.push(`${currency} ${p.cash.toFixed(2)} Efec.`);
    if (p.qr > 0) parts.push(`${currency} ${p.qr.toFixed(2)} QR`);
    if (p.card > 0) parts.push(`${currency} ${p.card.toFixed(2)} Tarjeta`);
    return parts.length > 0 ? parts.join(' + ') : 'Pago Combinado';
  }

  if (method === PAYMENT_METHODS.QR || method === 'transfer') return 'QR Simple';
  if (method === PAYMENT_METHODS.CARD || method === 'pos') return 'Tarjeta POS';
  if (method === PAYMENT_METHODS.CREDIT || method === 'fiao' || method === 'cuenta') return 'A Cuenta (Fiao)';
  return 'Efectivo';
};
