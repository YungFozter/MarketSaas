import { roundMoney } from './paymentUtils.js';
import { escapeHtml } from './formatters.js';

/**
 * Devuelve marca de tiempo segura en ms para ordenar cronológicamente.
 */
const toTimestampMs = (dateVal) => {
  if (!dateVal) return 0;
  const ms = new Date(dateVal).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

/**
 * Ordena movimientos cronológicamente de más reciente a más antiguo.
 */
export const getSortedTransactionsDesc = (transactions = []) => {
  if (!Array.isArray(transactions)) return [];
  return [...transactions].sort((a, b) => toTimestampMs(b?.date) - toTimestampMs(a?.date));
};

/**
 * Calcula los abonos cobrados de la Libreta de Deudas dentro del turno de caja activo,
 * desglosados por Efectivo vs QR Digital para cuadrar arqueo sin inflar ventas nuevas.
 */
export const calculateCreditPaymentsInShift = (creditCustomers = [], registerOpenedAt = null) => {
  const openedMs = registerOpenedAt ? toTimestampMs(registerOpenedAt) : 0;
  const hasOpenedBoundary = openedMs > 0;

  let cashTotal = 0;
  let cashCount = 0;
  let qrTotal = 0;
  let qrCount = 0;

  (creditCustomers || []).forEach((customer) => {
    const txs = Array.isArray(customer?.transactions) ? customer.transactions : [];
    txs.forEach((tx) => {
      if (!tx || tx.type !== 'payment') return;
      const txMs = toTimestampMs(tx.date);
      if (hasOpenedBoundary && txMs < openedMs) return;

      const amt = roundMoney(Math.max(0, Number(tx.amount) || 0));
      if (amt <= 0) return;

      if (tx.paymentMethod === 'qr') {
        qrTotal = roundMoney(qrTotal + amt);
        qrCount += 1;
      } else {
        cashTotal = roundMoney(cashTotal + amt);
        cashCount += 1;
      }
    });
  });

  return {
    cashTotal,
    cashCount,
    qrTotal,
    qrCount,
    total: roundMoney(cashTotal + qrTotal),
    totalCount: cashCount + qrCount
  };
};

/**
 * Anula/revierte un movimiento específico de la libreta de un vecino y recalcula
 * de forma exacta toda la línea de tiempo (balanceAfter y balance final).
 * @param {Object} customer
 * @param {string} transactionId
 * @returns {{ updatedCustomer: Object, removedTx: Object, previousBalance: number, newBalance: number } | null}
 */
export const revertTransactionFromCustomer = (customer, transactionId) => {
  if (!customer || !transactionId) return null;
  const txs = Array.isArray(customer.transactions) ? customer.transactions : [];
  const targetIndex = txs.findIndex(tx => tx?.id === transactionId);
  if (targetIndex === -1) return null;

  const removedTx = txs[targetIndex];
  const previousBalance = roundMoney(Number(customer.balance) || 0);

  // Detectar si existe algún saldo inicial previo no cubierto por el historial de transacciones
  const netTrackedBefore = txs.reduce((acc, tx) => {
    const amt = roundMoney(Number(tx?.amount) || 0);
    return tx?.type === 'payment' ? roundMoney(acc - amt) : roundMoney(acc + amt);
  }, 0);
  const openingBaseline = Math.max(0, roundMoney(previousBalance - netTrackedBefore));

  // Ordenar restantes del más antiguo al más reciente para recalcular cada balanceAfter
  const remainingAsc = txs
    .filter(tx => tx?.id !== transactionId)
    .map((tx, idx) => ({ tx, idx }))
    .sort((a, b) => {
      const diff = toTimestampMs(a.tx?.date) - toTimestampMs(b.tx?.date);
      return diff !== 0 ? diff : b.idx - a.idx;
    })
    .map(item => item.tx);

  let runningBalance = openingBaseline;
  const recalculatedAsc = remainingAsc.map(tx => {
    const amt = roundMoney(Math.max(0, Number(tx.amount) || 0));
    runningBalance = tx.type === 'payment'
      ? Math.max(0, roundMoney(runningBalance - amt))
      : roundMoney(runningBalance + amt);

    return {
      ...tx,
      amount: amt,
      balanceAfter: runningBalance
    };
  });

  const newBalance = Math.max(0, roundMoney(runningBalance));
  const recalculatedDesc = [...recalculatedAsc].reverse();

  return {
    updatedCustomer: {
      ...customer,
      balance: newBalance,
      transactions: recalculatedDesc,
      updatedAt: new Date().toISOString()
    },
    removedTx,
    previousBalance,
    newBalance
  };
};

/**
 * Ordena la lista de vecinos en libreta según criterio seleccionado.
 * @param {Array} customers
 * @param {'recent' | 'highest_debt' | 'lowest_debt' | 'name_asc'} sortBy
 */
export const sortCreditCustomers = (customers = [], sortBy = 'recent') => {
  const list = Array.isArray(customers) ? [...customers] : [];

  const getLastActivityMs = (c) => {
    const txs = Array.isArray(c?.transactions) ? c.transactions : [];
    let latestTx = 0;
    for (const tx of txs) {
      const ms = toTimestampMs(tx?.date);
      if (ms > latestTx) latestTx = ms;
    }
    return Math.max(latestTx, toTimestampMs(c?.updatedAt), toTimestampMs(c?.createdAt));
  };

  if (sortBy === 'highest_debt') {
    return list.sort((a, b) => {
      const diff = (Number(b?.balance) || 0) - (Number(a?.balance) || 0);
      return diff !== 0 ? diff : String(a?.name || '').localeCompare(String(b?.name || ''), 'es');
    });
  }

  if (sortBy === 'lowest_debt') {
    return list.sort((a, b) => {
      const diff = (Number(a?.balance) || 0) - (Number(b?.balance) || 0);
      return diff !== 0 ? diff : String(a?.name || '').localeCompare(String(b?.name || ''), 'es');
    });
  }

  if (sortBy === 'name_asc') {
    return list.sort((a, b) =>
      String(a?.name || '').localeCompare(String(b?.name || ''), 'es', { sensitivity: 'base' })
    );
  }

  // 'recent': último movimiento o actualización más reciente primero
  return list.sort((a, b) => getLastActivityMs(b) - getLastActivityMs(a));
};

/**
 * Sanitiza celdas CSV contra inyección de fórmulas en Excel/Sheets y aplica escape RFC 4180.
 */
const sanitizeCsvCell = (rawVal) => {
  const str = rawVal === null || rawVal === undefined ? '' : String(rawVal);
  const safeFormula = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safeFormula.replace(/"/g, '""')}"`;
};

/**
 * Construye el contenido CSV UTF-8 (con BOM) del resumen general de Libreta de Deudas.
 */
export const buildCreditSummaryCsv = (customers = [], currency = 'Bs.', formatBoliviaDateTime) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    if (typeof formatBoliviaDateTime === 'function') return formatBoliviaDateTime(dateStr);
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) ? d.toISOString() : String(dateStr);
  };

  const headers = [
    'Vecino / Cliente',
    'Teléfono',
    'Torre / Depto / Dirección',
    `Saldo Pendiente (${currency})`,
    `Límite de Crédito (${currency})`,
    'Estado',
    'Movimientos Registrados',
    'Último Movimiento',
    'Notas'
  ];

  const rows = (customers || []).map((c) => {
    const bal = roundMoney(Number(c?.balance) || 0);
    const limit = roundMoney(Number(c?.creditLimit) || 0);
    const txs = getSortedTransactionsDesc(c?.transactions || []);
    const lastTx = txs[0];
    const lastTxText = lastTx
      ? `${lastTx.type === 'payment' ? 'Abono' : 'Fiao'} ${currency} ${Number(lastTx.amount || 0).toFixed(2)} (${formatDate(lastTx.date)})`
      : 'Sin movimientos';

    return [
      sanitizeCsvCell(c?.name || ''),
      sanitizeCsvCell(c?.phone || ''),
      sanitizeCsvCell(c?.apartment || ''),
      sanitizeCsvCell(bal.toFixed(2)),
      sanitizeCsvCell(limit > 0 ? limit.toFixed(2) : 'Sin límite'),
      sanitizeCsvCell(bal > 0 ? 'Con deuda' : 'Al día'),
      sanitizeCsvCell(txs.length),
      sanitizeCsvCell(lastTxText),
      sanitizeCsvCell(c?.notes || '')
    ].join(',');
  });

  return `\uFEFF${[headers.map(sanitizeCsvCell).join(','), ...rows].join('\r\n')}`;
};

/**
 * Descarga en navegador el CSV de resumen de Libreta de Deudas.
 */
export const downloadCreditSummaryCsv = (customers = [], storeConfig = {}, formatBoliviaDateTime) => {
  if (typeof window === 'undefined' || !Array.isArray(customers) || customers.length === 0) return false;
  const currency = storeConfig?.currencySymbol || 'Bs.';
  const csvContent = buildCreditSummaryCsv(customers, currency, formatBoliviaDateTime);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug = String(storeConfig?.id || storeConfig?.name || 'tienda')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date());

  link.href = url;
  link.setAttribute('download', `libreta-deudas-${slug}-${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};

/**
 * Abre una ventana de impresión limpia con el Estado de Cuenta individual de un vecino.
 */
export const printCustomerStatement = (customer, storeConfig = {}, formatBoliviaDateTime) => {
  if (!customer || typeof window === 'undefined') return false;
  const printWindow = window.open('', '_blank', 'width=760,height=840');
  if (!printWindow) return false;

  const currency = escapeHtml(storeConfig?.currencySymbol || 'Bs.');
  const storeName = escapeHtml(storeConfig?.name || 'Mi Tienda');
  const storePhone = escapeHtml(storeConfig?.whatsapp || storeConfig?.phone || '');
  const custName = escapeHtml(customer.name || 'Vecino');
  const custApt = escapeHtml(customer.apartment || '');
  const custPhone = escapeHtml(customer.phone || '');
  const currentBalance = roundMoney(Number(customer.balance) || 0).toFixed(2);
  const creditLimit = roundMoney(Number(customer.creditLimit) || 0);
  const printedAt = escapeHtml(
    typeof formatBoliviaDateTime === 'function'
      ? formatBoliviaDateTime(new Date().toISOString())
      : new Date().toLocaleString('es-BO')
  );

  const sortedTxs = getSortedTransactionsDesc(customer.transactions || []);
  const rowsHtml = sortedTxs.length === 0
    ? '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:24px;">Sin movimientos registrados</td></tr>'
    : sortedTxs.map((tx) => {
        const isCharge = tx.type === 'charge';
        const dateLabel = escapeHtml(
          typeof formatBoliviaDateTime === 'function' ? formatBoliviaDateTime(tx.date) : tx.date
        );
        const typeLabel = isCharge ? 'Compra Fiada' : `Abono (${tx.paymentMethod === 'qr' ? 'QR' : 'Efectivo'})`;
        const amountLabel = `${isCharge ? '+' : '-'}${currency} ${Number(tx.amount || 0).toFixed(2)}`;
        const balanceAfterLabel = `${currency} ${Number(tx.balanceAfter || 0).toFixed(2)}`;
        return `
          <tr>
            <td>${dateLabel}</td>
            <td><span class="badge ${isCharge ? 'badge-charge' : 'badge-pay'}">${escapeHtml(typeLabel)}</span></td>
            <td>${escapeHtml(tx.concept || '')}</td>
            <td class="num ${isCharge ? 'text-rose' : 'text-emerald'}">${amountLabel}</td>
            <td class="num">${balanceAfterLabel}</td>
          </tr>
        `;
      }).join('');

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Estado de Cuenta - ${custName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 24px; line-height: 1.45; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px; gap: 16px; }
    .title { font-size: 20px; font-weight: 800; margin: 0; }
    .sub { font-size: 12px; color: #475569; margin: 4px 0 0; }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 18px; }
    .summary-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; }
    .summary-val { font-size: 16px; font-weight: 800; }
    .balance { color: ${Number(currentBalance) > 0 ? '#e11d48' : '#059669'}; font-size: 22px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; background: #f1f5f9; color: #334155; padding: 9px 10px; border-bottom: 1px solid #cbd5e1; font-weight: 800; }
    td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; font-weight: 700; }
    .text-rose { color: #e11d48; }
    .text-emerald { color: #059669; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; }
    .badge-charge { background: #ffe4e6; color: #9f1239; }
    .badge-pay { background: #d1fae5; color: #065f46; }
    .footer { margin-top: 20px; font-size: 11px; color: #64748b; text-align: center; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${storeName} — Estado de Cuenta</h1>
      <p class="sub">Emitido el ${printedAt}${storePhone ? ` • Tel/WhatsApp: ${storePhone}` : ''}</p>
    </div>
  </div>
  <div class="summary">
    <div>
      <span class="summary-label">Vecino / Cliente</span>
      <span class="summary-val">${custName}</span>
      <p class="sub">${[custApt, custPhone ? `Tel: ${custPhone}` : ''].filter(Boolean).join(' • ') || 'Cliente en libreta'}</p>
    </div>
    <div style="text-align:right;">
      <span class="summary-label">Saldo Pendiente Actual</span>
      <span class="summary-val balance">${currency} ${currentBalance}</span>
      ${creditLimit > 0 ? `<p class="sub">Límite configurado: ${currency} ${creditLimit.toFixed(2)}</p>` : ''}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Tipo</th>
        <th>Detalle / Concepto</th>
        <th class="num">Monto</th>
        <th class="num">Saldo</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p class="footer">Comprobante informativo generado desde Libreta de Cuentas (${storeName}).</p>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};
