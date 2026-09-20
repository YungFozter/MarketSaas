import * as XLSX from 'xlsx';

/**
 * Normaliza y formatea las órdenes para reportes contables
 */
export const prepareSalesData = (orders = [], formatBoliviaDateTime) => {
  const formatDateTime = (dateStr) => {
    if (formatBoliviaDateTime) return formatBoliviaDateTime(dateStr);
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleString('es-BO') : dateStr;
    } catch {
      return dateStr;
    }
  };

  const formattedRows = orders.map((o, idx) => {
    const isPos = String(o.id || '').includes('POS');
    const customerName = o.customer?.name || (isPos ? 'Venta de Mostrador (Presencial)' : 'Vecino');
    const phone = o.customer?.phone || (isPos ? 'Presencial' : '-');
    const condo = o.customer?.condominium || (isPos ? 'En Tienda (Mostrador)' : 'En Tienda');
    const apt = [o.customer?.tower, o.customer?.apartment].filter(Boolean).join(' - ') || (isPos ? 'Mostrador' : '-');
    const deliveryType = o.deliveryType === 'delivery' ? 'Delivery a Domicilio' : 'Retiro en Tienda';

    const payMethodRaw = typeof o.paymentMethod === 'object' ? o.paymentMethod?.method : o.paymentMethod;
    const paymentMethodLabel = 
      payMethodRaw === 'qr' ? 'QR Simple (Digital)' :
      payMethodRaw === 'card' ? 'Tarjeta POS' :
      payMethodRaw === 'cash' ? 'Efectivo' : (payMethodRaw || 'Efectivo');

    const statusLabel = 
      o.status === 'delivered' ? 'Entregado / Cobrado' :
      o.status === 'preparing' ? 'En Preparación' :
      o.status === 'on_the_way' ? 'En Camino' :
      o.status === 'cancelled' ? 'Cancelado' : 'Pendiente';

    const totalVal = Number(o.total || 0);

    return {
      index: idx + 1,
      id: String(o.id || ''),
      date: formatDateTime(o.createdAt || o.created_at),
      customer: customerName,
      phone,
      location: condo,
      details: apt,
      deliveryType,
      paymentMethod: paymentMethodLabel,
      total: totalVal,
      totalFormatted: totalVal.toFixed(2),
      status: statusLabel,
      itemCount: Array.isArray(o.items) ? o.items.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0
    };
  });

  const totalAmount = formattedRows.reduce((acc, r) => acc + r.total, 0);
  const totalCount = formattedRows.length;
  const cashTotal = formattedRows.filter(r => r.paymentMethod.includes('Efectivo')).reduce((acc, r) => acc + r.total, 0);
  const qrTotal = formattedRows.filter(r => r.paymentMethod.includes('QR')).reduce((acc, r) => acc + r.total, 0);
  const cardTotal = formattedRows.filter(r => r.paymentMethod.includes('Tarjeta')).reduce((acc, r) => acc + r.total, 0);

  return {
    rows: formattedRows,
    summary: {
      totalAmount,
      totalAmountFormatted: totalAmount.toFixed(2),
      totalCount,
      cashTotal: cashTotal.toFixed(2),
      qrTotal: qrTotal.toFixed(2),
      cardTotal: cardTotal.toFixed(2),
      avgTicket: totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : '0.00'
    }
  };
};

/**
 * Exporta a Excel (.XLSX) con soporte para columnas separadas y autoajuste de ancho
 */
export const exportSalesToXLSX = (orders, storeConfig, formatBoliviaDateTime, titleSuffix = '') => {
  const { rows, summary } = prepareSalesData(orders, formatBoliviaDateTime);
  const storeName = storeConfig?.name || 'Mi Tienda';
  const currency = storeConfig?.currencySymbol || 'Bs.';
  const reportTitle = titleSuffix 
    ? `REPORTE DE VENTAS (${titleSuffix.toUpperCase()}) - ${storeName.toUpperCase()}`
    : `REPORTE DE VENTAS - ${storeName.toUpperCase()}`;

  // Estructura en matriz para SheetJS
  const data = [
    [reportTitle],
    [`Generado: ${new Date().toLocaleString('es-BO')}`, '', '', '', '', '', '', `Total Recaudado: ${currency} ${summary.totalAmountFormatted}`],
    [], // Fila en blanco
    ['#', 'ID Pedido', 'Fecha y Hora', 'Cliente', 'Teléfono', 'Ubicación / Condominio', 'Torre / Depto', 'Modalidad', 'Método de Pago', `Total (${currency})`, 'Estado']
  ];

  rows.forEach(r => {
    data.push([
      r.index,
      r.id,
      r.date,
      r.customer,
      r.phone,
      r.location,
      r.details,
      r.deliveryType,
      r.paymentMethod,
      r.total,
      r.status
    ]);
  });

  // Fila de totales al final
  data.push([]);
  data.push(['', '', '', '', '', '', '', '', 'TOTAL GENERAL:', summary.totalAmount, `${summary.totalCount} Ventas`]);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Definir anchos de columna automáticos
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 18 },  // ID Pedido
    { wch: 20 },  // Fecha
    { wch: 28 },  // Cliente
    { wch: 16 },  // Teléfono
    { wch: 24 },  // Condominio
    { wch: 16 },  // Torre/Depto
    { wch: 20 },  // Modalidad
    { wch: 20 },  // Método
    { wch: 14 },  // Total
    { wch: 18 }   // Estado
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Ventas');

  const cleanStoreName = storeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileName = `reporte_ventas_${cleanStoreName}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Exporta a Excel con Diseño y Colores (.XLS estilizado con celdas esmeralda, bordes y estilos)
 */
export const exportSalesToStyledExcel = (orders, storeConfig, formatBoliviaDateTime, titleSuffix = '') => {
  const { rows, summary } = prepareSalesData(orders, formatBoliviaDateTime);
  const storeName = storeConfig?.name || 'Mi Tienda';
  const currency = storeConfig?.currencySymbol || 'Bs.';
  const reportMainTitle = titleSuffix
    ? `REPORTE OFICIAL DE VENTAS &bull; ${storeName.toUpperCase()} &bull; ${titleSuffix.toUpperCase()}`
    : `REPORTE OFICIAL DE VENTAS &bull; ${storeName.toUpperCase()}`;

  const tableRowsHtml = rows.map((r, i) => `
    <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; color: #64748b; font-size: 11px;">${r.index}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; font-family: monospace; font-weight: bold; color: #047857; font-size: 11px;">${r.id}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; color: #334155; font-size: 11px;">${r.date}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; font-weight: 500; color: #0f172a; font-size: 11px;">${r.customer}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #475569; font-size: 11px;">${r.phone}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #334155; font-size: 11px;">${r.location}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; color: #64748b; font-size: 11px;">${r.details}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; color: #334155; font-size: 11px;">${r.deliveryType}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-weight: 600; color: #0f172a; font-size: 11px;">${r.paymentMethod}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: right; font-weight: bold; color: #0f172a; font-size: 11px; mso-number-format: '\\#\\,\\#\\#0\\.00';">${r.totalFormatted}</td>
      <td style="border: 1px solid #cbd5e1; padding: 7px 10px; text-align: center; font-weight: 600; color: ${r.status.includes('Entregado') ? '#047857' : '#d97706'}; font-size: 11px;">${r.status}</td>
    </tr>
  `).join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Reporte de Ventas</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          th { background-color: #059669; color: #ffffff; font-weight: bold; border: 1px solid #047857; padding: 10px; text-align: center; font-size: 12px; }
          td { border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="11" style="background-color: #064e3b; color: #ffffff; font-size: 18px; font-weight: bold; text-align: center; padding: 15px;">
              ${reportMainTitle}
            </td>
          </tr>
          <tr>
            <td colspan="6" style="background-color: #ecfdf5; color: #065f46; font-size: 11px; padding: 8px;">
              <b>Fecha de Emisión:</b> ${new Date().toLocaleString('es-BO')} &nbsp;|&nbsp; <b>Zona Horaria:</b> Bolivia (UTC-04:00) ${titleSuffix ? `&nbsp;|&nbsp; <b>Filtro:</b> ${titleSuffix}` : ''}
            </td>
            <td colspan="5" style="background-color: #ecfdf5; color: #065f46; font-size: 11px; padding: 8px; text-align: right;">
              <b>Total Recaudado:</b> ${currency} ${summary.totalAmountFormatted} &nbsp;|&nbsp; <b>Transacciones:</b> ${summary.totalCount}
            </td>
          </tr>
          <tr><td colspan="11" style="height: 10px;"></td></tr>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 130px;">ID Pedido</th>
              <th style="width: 150px;">Fecha y Hora</th>
              <th style="width: 200px;">Cliente</th>
              <th style="width: 120px;">Teléfono</th>
              <th style="width: 160px;">Ubicación / Condominio</th>
              <th style="width: 120px;">Torre / Depto</th>
              <th style="width: 140px;">Modalidad</th>
              <th style="width: 140px;">Método de Pago</th>
              <th style="width: 110px;">Total (${currency})</th>
              <th style="width: 140px;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #ecfdf5; border-top: 2px solid #059669; font-weight: bold;">
              <td colspan="9" style="border: 1px solid #cbd5e1; padding: 10px; text-align: right; color: #065f46; font-size: 12px;">TOTAL RECAUDADO:</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right; color: #047857; font-size: 13px; font-weight: 800; mso-number-format: '\\#\\,\\#\\#0\\.00';">${summary.totalAmountFormatted}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; color: #065f46; font-size: 11px;">${summary.totalCount} operaciones</td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanStoreName = storeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cleanSuffix = titleSuffix ? `_${titleSuffix.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
  link.download = `reporte_ventas_${cleanStoreName}${cleanSuffix}_${Date.now()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta a CSV optimizado con separador de punto y coma (;) y BOM UTF-8 para Excel en español
 */
export const exportSalesToCSV = (orders, storeConfig, formatBoliviaDateTime, titleSuffix = '') => {
  const { rows } = prepareSalesData(orders, formatBoliviaDateTime);
  const storeName = storeConfig?.name || 'Mi Tienda';
  const currency = storeConfig?.currencySymbol || 'Bs.';

  const headers = [
    "ID Pedido",
    "Fecha y Hora",
    "Cliente",
    "Telefono",
    "Ubicacion / Condominio",
    "Torre / Depto",
    "Modalidad",
    "Metodo Pago",
    `Total (${currency})`,
    "Estado"
  ];

  const csvRows = rows.map(r => [
    `"${r.id}"`,
    `"${r.date}"`,
    `"${r.customer.replace(/"/g, '""')}"`,
    `"${r.phone}"`,
    `"${r.location.replace(/"/g, '""')}"`,
    `"${r.details.replace(/"/g, '""')}"`,
    `"${r.deliveryType}"`,
    `"${r.paymentMethod}"`,
    r.totalFormatted,
    `"${r.status}"`
  ]);

  // 'sep=;\r\n' fuerza a Microsoft Excel en cualquier idioma a separar automáticamente por columnas
  const sep = ';';
  const csvContent = "\uFEFFsep=;\r\n" + [headers.join(sep), ...csvRows.map(e => e.join(sep))].join("\r\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanStoreName = storeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const cleanSuffix = titleSuffix ? `_${titleSuffix.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : '';
  link.download = `reporte_ventas_${cleanStoreName}${cleanSuffix}_${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Genera una vista imprimible de alta fidelidad para descargar como PDF
 */
export const exportSalesToPDF = (orders, storeConfig, formatBoliviaDateTime, titleSuffix = '') => {
  const { rows, summary } = prepareSalesData(orders, formatBoliviaDateTime);
  const storeName = storeConfig?.name || 'Mi Tienda';
  const currency = storeConfig?.currencySymbol || 'Bs.';

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return;

  const rowsHtml = rows.map((r, i) => `
    <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
      <td class="cell-center text-slate-400 font-mono text-xs">${r.index}</td>
      <td class="cell font-mono font-bold text-emerald-700 text-xs">${r.id}</td>
      <td class="cell-center text-slate-600 text-xs">${r.date}</td>
      <td class="cell font-semibold text-slate-900 text-xs">${r.customer}</td>
      <td class="cell text-slate-600 text-xs">${r.phone}</td>
      <td class="cell text-slate-700 text-xs">${r.location} <span class="text-slate-400 text-[10px]">(${r.details})</span></td>
      <td class="cell-center text-xs text-slate-700 font-medium">${r.deliveryType}</td>
      <td class="cell-center text-xs font-semibold text-slate-800">${r.paymentMethod}</td>
      <td class="cell-right font-black text-slate-900 text-xs">${currency} ${r.totalFormatted}</td>
      <td class="cell-center text-xs">
        <span class="badge ${r.status.includes('Entregado') ? 'badge-success' : 'badge-warning'}">
          ${r.status}
        </span>
      </td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte de Ventas - ${storeName} ${titleSuffix ? `(${titleSuffix})` : ''}</title>
        <style>
          @page {
            size: letter landscape;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 16px;
            font-size: 12px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .store-title {
            font-size: 22px;
            font-weight: 900;
            color: #064e3b;
            letter-spacing: -0.5px;
          }
          .store-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 18px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 14px;
            background: #f8fafc;
          }
          .kpi-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
          }
          .kpi-val {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 3px;
          }
          .kpi-emerald {
            color: #047857;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background-color: #059669;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border: 1px solid #047857;
            text-align: left;
          }
          th.center { text-align: center; }
          th.right { text-align: right; }
          .cell {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
          }
          .cell-center {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .cell-right {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            text-align: right;
          }
          .bg-slate-50 { background-color: #f8fafc; }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-success {
            background-color: #d1fae5;
            color: #065f46;
          }
          .badge-warning {
            background-color: #fef3c7;
            color: #92400e;
          }
          .footer-summary {
            border-top: 2px solid #059669;
            background: #ecfdf5;
            font-weight: bold;
          }
          .print-actions {
            margin-bottom: 16px;
            display: flex;
            gap: 8px;
          }
          .btn-print {
            background: #059669;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
          }
          .btn-close {
            background: #f1f5f9;
            color: #334155;
            border: 1px solid #cbd5e1;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
          }
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print print-actions">
          <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
          <button class="btn-close" onclick="window.close()">Cerrar Vista</button>
          <span style="font-size: 11px; color: #64748b; margin-left: 10px; align-self: center;">
            💡 En la ventana de impresión, selecciona destino: <b>"Guardar como PDF"</b>
          </span>
        </div>

        <div class="header">
          <div>
            <h1 class="store-title">${storeName} ${titleSuffix ? `<span style="font-size: 16px; font-weight: bold; color: #047857;">(${titleSuffix})</span>` : ''}</h1>
            <p class="store-subtitle">Reporte Oficial de Ventas &bull; MarketSaaS Comercio Hiperlocal ${titleSuffix ? `&bull; <b>Filtro:</b> ${titleSuffix}` : ''}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 11px; font-weight: 700; color: #334155;">Emisión: ${new Date().toLocaleString('es-BO')}</p>
            <p style="font-size: 10px; color: #64748b;">Zona Horaria: Bolivia (UTC-04:00)</p>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Recaudación Total</div>
            <div class="kpi-val kpi-emerald">${currency} ${summary.totalAmountFormatted}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ventas Registradas</div>
            <div class="kpi-val">${summary.totalCount}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cobros por QR Simple</div>
            <div class="kpi-val">${currency} ${summary.qrTotal}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cobros en Efectivo</div>
            <div class="kpi-val">${currency} ${summary.cashTotal}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="center" style="width: 30px;">#</th>
              <th style="width: 120px;">ID Pedido</th>
              <th class="center" style="width: 130px;">Fecha y Hora</th>
              <th style="width: 160px;">Cliente</th>
              <th style="width: 100px;">Teléfono</th>
              <th style="width: 160px;">Ubicación</th>
              <th class="center" style="width: 110px;">Modalidad</th>
              <th class="center" style="width: 110px;">Método Pago</th>
              <th class="right" style="width: 90px;">Total (${currency})</th>
              <th class="center" style="width: 100px;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr class="footer-summary">
              <td colspan="8" class="cell-right" style="padding: 10px; font-size: 11px; color: #065f46;">TOTAL GENERAL RECAUDADO:</td>
              <td class="cell-right font-black" style="padding: 10px; font-size: 13px; color: #047857;">${currency} ${summary.totalAmountFormatted}</td>
              <td class="cell-center" style="padding: 10px; font-size: 10px; color: #065f46;">${summary.totalCount} ventas</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
          <span>MarketSaaS &bull; Software para Minimarkets y Comercios de Barrio</span>
          <span>Página 1 de 1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
