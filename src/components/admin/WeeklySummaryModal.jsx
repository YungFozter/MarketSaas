import React, { useState, useMemo } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  TrendingUp, 
  ShoppingBag, 
  Sparkles, 
  Calendar, 
  Clock, 
  Printer,
  Award,
  DollarSign,
  QrCode,
  Banknote,
  ArrowUpRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { escapeHtml } from '../../utils/formatters';

export const WeeklySummaryModal = ({ isOpen, onClose }) => {
  const { orders = [], storeConfig, showToast } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';
  const storeName = storeConfig?.name || 'Mi Tienda';
  const ownerPhone = (storeConfig?.whatsapp || storeConfig?.phone || '').replace(/[^0-9]/g, '');

  const [copied, setCopied] = useState(false);

  // Análisis estadístico de los últimos 7 días
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const validOrders = (orders || []).filter(o => {
      if (!o || o.status === 'cancelled') return false;
      const orderDate = new Date(o.createdAt || o.created_at);
      return !isNaN(orderDate.getTime()) && orderDate >= sevenDaysAgo;
    });

    let totalRevenue = 0;
    let cashRevenue = 0;
    let qrRevenue = 0;
    const productCounts = {};

    // Agrupación por día de la semana
    const dayTotals = {
      0: { label: 'Dom', total: 0, orders: 0 },
      1: { label: 'Lun', total: 0, orders: 0 },
      2: { label: 'Mar', total: 0, orders: 0 },
      3: { label: 'Mié', total: 0, orders: 0 },
      4: { label: 'Jue', total: 0, orders: 0 },
      5: { label: 'Vie', total: 0, orders: 0 },
      6: { label: 'Sáb', total: 0, orders: 0 }
    };

    validOrders.forEach(o => {
      const total = Number(o.total) || 0;
      totalRevenue += total;

      const method = (o.paymentMethod || o.payment_method || 'cash').toLowerCase();
      if (method === 'qr' || method === 'transfer') {
        qrRevenue += total;
      } else {
        cashRevenue += total;
      }

      // Conteo de productos
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const name = item.name || 'Producto';
          const qty = Number(item.quantity) || 1;
          productCounts[name] = (productCounts[name] || 0) + qty;
        });
      }

      // Asignar al día
      const d = new Date(o.createdAt || o.created_at);
      if (!isNaN(d.getTime())) {
        const dayIdx = d.getDay();
        if (dayTotals[dayIdx]) {
          dayTotals[dayIdx].total += total;
          dayTotals[dayIdx].orders += 1;
        }
      }
    });

    // Producto estrella más vendido
    const sortedProducts = Object.entries(productCounts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const topProduct = sortedProducts[0] || { name: 'Ventas Generales', qty: validOrders.length };
    const avgTicket = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // Calcular día de mayor venta
    const bestDay = Object.values(dayTotals).sort((a, b) => b.total - a.total)[0];

    const maxDayTotal = Math.max(...Object.values(dayTotals).map(d => d.total), 1);

    const fromDateStr = sevenDaysAgo.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' });
    const toDateStr = now.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return {
      totalRevenue,
      cashRevenue,
      qrRevenue,
      orderCount: validOrders.length,
      avgTicket,
      topProduct,
      topThreeProducts: sortedProducts.slice(0, 3),
      bestDay,
      dayTotals: Object.values(dayTotals),
      maxDayTotal,
      fromDateStr,
      toDateStr
    };
  }, [orders]);

  // Mensaje formateado para WhatsApp
  const whatsappReportMessage = useMemo(() => {
    const cashPct = weeklyStats.totalRevenue > 0 ? Math.round((weeklyStats.cashRevenue / weeklyStats.totalRevenue) * 100) : 0;
    const qrPct = weeklyStats.totalRevenue > 0 ? Math.round((weeklyStats.qrRevenue / weeklyStats.totalRevenue) * 100) : 0;

    return `📊 *RESUMEN SEMANAL DE VENTAS*
🏪 *${storeName.toUpperCase()}*
🗓️ _Período: ${weeklyStats.fromDateStr} al ${weeklyStats.toDateStr}_

💰 *Facturación Total:* ${currency} ${weeklyStats.totalRevenue.toFixed(2)}
💵 *Efectivo:* ${currency} ${weeklyStats.cashRevenue.toFixed(2)} (${cashPct}%)
📱 *QR / Digital:* ${currency} ${weeklyStats.qrRevenue.toFixed(2)} (${qrPct}%)

📦 *Pedidos Atendidos:* ${weeklyStats.orderCount} compras
🎯 *Ticket Promedio:* ${currency} ${weeklyStats.avgTicket.toFixed(2)} por compra
⭐ *Producto Estrella:* ${weeklyStats.topProduct.name} (${weeklyStats.topProduct.qty} unidades)
🏆 *Día Más Fuerte:* ${weeklyStats.bestDay?.label || 'Fin de semana'} (${currency} ${(weeklyStats.bestDay?.total || 0).toFixed(2)})

✅ _Reporte generado automáticamente por MarketSaaS_`;
  }, [weeklyStats, storeName, currency]);

  // Copiar al portapapeles
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappReportMessage);
      setCopied(true);
      if (typeof showToast === 'function') showToast('¡Texto copiado al portapapeles!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      if (typeof showToast === 'function') showToast('No se pudo copiar el texto.', 'error');
    }
  };

  // Abrir WhatsApp con el reporte
  const handleSendToWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappReportMessage);
    const targetUrl = ownerPhone 
      ? `https://wa.me/${ownerPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(targetUrl, '_blank');
  };

  // Imprimir reporte semanal
  const handlePrintWeeklyReport = () => {
    const printWindow = window.open('', '', 'width=420,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resumen Semanal - ${escapeHtml(storeName)}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 10px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .highlight { background: #eee; padding: 4px; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:2px 0;">${escapeHtml(storeName)}</h2>
            <p style="margin:2px 0; font-weight:bold;">REPORTE SEMANAL DE RENDIMIENTO</p>
            <p style="margin:2px 0; font-size:11px;">Del ${weeklyStats.fromDateStr} al ${weeklyStats.toDateStr}</p>
          </div>
          <div class="divider"></div>
          <div class="row highlight bold">
            <span>FACTURACIÓN TOTAL:</span>
            <span>${currency} ${weeklyStats.totalRevenue.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Ventas en Efectivo:</span>
            <span>${currency} ${weeklyStats.cashRevenue.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Ventas por QR / Banco:</span>
            <span>${currency} ${weeklyStats.qrRevenue.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div class="row">
            <span>Total Pedidos:</span>
            <span class="bold">${weeklyStats.orderCount} compras</span>
          </div>
          <div class="row">
            <span>Ticket Promedio:</span>
            <span>${currency} ${weeklyStats.avgTicket.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Producto Más Vendido:</span>
            <span class="bold">${escapeHtml(weeklyStats.topProduct.name)} (${weeklyStats.topProduct.qty} u.)</span>
          </div>
          <div class="divider"></div>
          <div class="center" style="margin-top: 15px; font-size: 10px; color: #555;">
            <p>Generado por MarketSaaS</p>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Resumen Semanal de tu Tienda</span>
              </h3>
              <p className="text-xs text-slate-400">
                Del {weeklyStats.fromDateStr} al {weeklyStats.toDateStr} • Rendimiento de los últimos 7 días
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Tarjeta Bento Hero: Facturación Total */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                Ventas de los Últimos 7 Días
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono text-xs font-bold backdrop-blur-xs">
                {weeklyStats.orderCount} pedidos
              </span>
            </div>

            <div>
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {currency} {weeklyStats.totalRevenue.toFixed(2)}
              </span>
              <p className="text-xs text-emerald-100/90 mt-1">
                Promedio de <strong>{currency} {weeklyStats.avgTicket.toFixed(2)}</strong> por cada cliente atendido.
              </p>
            </div>

            {/* Desglose Efectivo vs QR */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
              <div className="bg-black/15 p-2.5 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs text-emerald-200">
                  <Banknote className="w-3.5 h-3.5 text-amber-300" />
                  <span>Efectivo</span>
                </div>
                <div className="font-mono text-sm sm:text-base font-black text-white mt-0.5">
                  {currency} {weeklyStats.cashRevenue.toFixed(2)}
                </div>
              </div>

              <div className="bg-black/15 p-2.5 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs text-emerald-200">
                  <QrCode className="w-3.5 h-3.5 text-sky-300" />
                  <span>QR / Banco</span>
                </div>
                <div className="font-mono text-sm sm:text-base font-black text-white mt-0.5">
                  {currency} {weeklyStats.qrRevenue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Producto Estrella & Día Más Fuerte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-black uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Producto Más Vendido</span>
              </div>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                {weeklyStats.topProduct.name}
              </div>
              <p className="text-xs text-amber-900 font-bold">
                {weeklyStats.topProduct.qty} unidades vendidas
              </p>
            </div>

            <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-200/80 space-y-1">
              <div className="flex items-center gap-2 text-sky-800 text-xs font-black uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                <span>Día con Mayor Venta</span>
              </div>
              <div className="font-extrabold text-sm sm:text-base text-slate-900">
                {weeklyStats.bestDay?.label || 'Sábado'}
              </div>
              <p className="text-xs text-sky-900 font-bold font-mono">
                {currency} {(weeklyStats.bestDay?.total || 0).toFixed(2)} facturados
              </p>
            </div>
          </div>

          {/* 3. Mini Gráfico de Barras: Actividad Diaria */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Ventas por Día de la Semana
            </span>
            <div className="grid grid-cols-7 gap-1.5 items-end h-20 pt-2">
              {weeklyStats.dayTotals.map((d, idx) => {
                const heightPct = Math.max(12, Math.round((d.total / weeklyStats.maxDayTotal) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div 
                      className={`w-full rounded-md transition-all ${
                        d.total > 0 ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-200'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${d.label}: ${currency} ${d.total.toFixed(2)} (${d.orders} pedidos)`}
                    />
                    <span className="text-[10px] font-bold text-slate-600">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Vista Previa del Mensaje para WhatsApp */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 block">
              Mensaje listo para enviar por WhatsApp:
            </span>
            <div className="p-3.5 bg-slate-900 text-emerald-300 rounded-2xl font-mono text-xs leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
              {whatsappReportMessage}
            </div>
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintWeeklyReport}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSendToWhatsApp}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar a mi WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
