import React, { useState, useMemo, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  Clock, 
  Printer, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag, 
  Store, 
  Truck, 
  Banknote, 
  QrCode, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  Download, 
  Package,
  User,
  SlidersHorizontal,
  MessageCircle,
  Lock,
  Layers
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { normalizeSearchText, escapeHtml } from '../../utils/formatters';
import { 
  roundMoney, 
  calculateSplitPortions, 
  formatPaymentBreakdownText, 
  PAYMENT_METHODS 
} from '../../utils/paymentUtils';
import { ExportSalesReportModal } from './ExportSalesReportModal';
import { CashRegisterModal } from './CashRegisterModal';
import { WeeklySummaryModal } from './WeeklySummaryModal';
import { SubscriptionBlockedModal } from './SubscriptionBlockedModal';
import './SalesHistory.css';

export const SalesHistory = () => {
  const { orders = [], storeConfig, currentUser, isSubscriptionActive, injectSplitPaymentTestOrders } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';

  // Filtros de búsqueda y estado
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all'); // 'all' | 'cash' | 'qr' | 'card'
  const [selectedChannel, setSelectedChannel] = useState('all'); // 'all' | 'pos' | 'delivery' | 'pickup'

  // Modal de Detalle / Comanda de Venta
  const [selectedSale, setSelectedSale] = useState(null);

  // Modal de Exportación de Reporte
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Modales de Cierre de Caja y Resumen Semanal
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);
  const [isWeeklySummaryModalOpen, setIsWeeklySummaryModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState('');

  // Paginación
  const [itemsPerPage, setItemsPerPage] = useState(10); // 10, 25, 50, 'all'
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear a página 1 al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPeriod, selectedPaymentMethod, selectedChannel, itemsPerPage]);

  // Función para determinar si una fecha coincide con el período seleccionado
  const matchesPeriod = (dateString, period) => {
    if (!dateString || period === 'all') return true;
    const saleDate = new Date(dateString);
    if (isNaN(saleDate.getTime())) return true;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (period) {
      case 'today':
        return saleDate >= startOfToday;
      case '24h':
        return saleDate >= twentyFourHoursAgo;
      case 'yesterday':
        return saleDate >= startOfYesterday && saleDate <= endOfYesterday;
      case 'week':
        return saleDate >= sevenDaysAgo;
      case 'month':
        return saleDate >= startOfMonth;
      default:
        return true;
    }
  };

  // Helper para clasificar canal de venta
  const getSaleChannel = (order) => {
    const isPos = 
      (order.id && String(order.id).includes('POS')) ||
      (order.customer?.name && (order.customer.name.includes('Presencial') || order.customer.name.includes('Mostrador') || order.customer.name.includes('Cliente Mostrador'))) ||
      order.customer?.address === 'En Tienda (POS)' ||
      order.customer?.reference === 'Mostrador';

    if (isPos) return 'pos';
    if (order.deliveryType === 'delivery') return 'delivery';
    return 'pickup';
  };

  // Helper para identificar ventas concretadas en Punto de Venta (POS)
  const isPosSale = (order) => {
    if (!order) return false;
    const id = String(order.id || '');
    if (id.includes('POS-') || id.startsWith('POS-') || id.includes('POS')) return true;
    const cName = order.customer?.name || '';
    if (cName.includes('Presencial') || cName.includes('Mostrador') || cName.includes('Cliente Mostrador')) return true;
    const address = order.customer?.address || '';
    const ref = order.customer?.reference || '';
    if (address === 'En Tienda (POS)' || ref === 'Mostrador') return true;
    return false;
  };

  // Helper para identificar pedidos entregados/cobrados
  const isDeliveredOrder = (order) => {
    if (!order) return false;
    const s = String(order.status || '').toLowerCase().trim();
    return s === 'delivered' || s === 'completed' || s === 'paid';
  };

  // Helper para excluir pedidos omitidos, cancelados o eliminados
  const isOmittedOrCancelled = (order) => {
    if (!order) return true;
    const s = String(order.status || '').toLowerCase().trim();
    return s === 'cancelled' || s === 'omitted' || s === 'deleted' || Boolean(order.is_deleted || order.isDeleted);
  };

  // Toggle interactivo para los filtros de método de pago (desde tarjetas KPI o selector)
  const handleTogglePaymentMethod = (method) => {
    setCurrentPage(1);
    if (method === 'all') {
      setSelectedPaymentMethod('all');
    } else {
      setSelectedPaymentMethod(prev => (prev === method ? 'all' : method));
    }
  };

  // 1. Filtrado base de ventas (período, canal, búsqueda) - SIN filtrar aún por método de pago
  // Solo pedidos ENTREGADOS o ventas realizadas mediante PUNTO DE VENTA
  const baseSales = useMemo(() => {
    return orders
      .filter((order) => {
        // Excluir pedidos cancelados, omitidos o eliminados
        if (isOmittedOrCancelled(order)) return false;

        // Requerimiento: Solo mostrar un pedido cuando se ENTREGÓ, o cuando es venta por PUNTO DE VENTA
        const isPos = isPosSale(order);
        const isDelivered = isDeliveredOrder(order);
        if (!isPos && !isDelivered) {
          return false;
        }

        // Filtro por Período
        const dateMatch = matchesPeriod(order.createdAt || order.created_at, selectedPeriod);
        if (!dateMatch) return false;

        // Filtro por Canal / Tipo de Venta
        const channel = getSaleChannel(order);
        const channelMatch = 
          selectedChannel === 'all' || 
          channel === selectedChannel;
        if (!channelMatch) return false;

        // Búsqueda insensible a mayúsculas y acentos
        const cleanQuery = normalizeSearchText(searchTerm);
        if (!cleanQuery) return true;

        const itemsString = Array.isArray(order.items) 
          ? order.items.map(i => i.name).join(' ') 
          : '';

        const customerName = order.customer?.name || '';
        const customerPhone = order.customer?.phone || '';
        const customerAddress = `${order.customer?.address || ''} ${order.customer?.reference || ''}`;

        return (
          normalizeSearchText(order.id).includes(cleanQuery) ||
          normalizeSearchText(customerName).includes(cleanQuery) ||
          normalizeSearchText(customerPhone).includes(cleanQuery) ||
          normalizeSearchText(customerAddress).includes(cleanQuery) ||
          normalizeSearchText(itemsString).includes(cleanQuery)
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        return timeB - timeA;
      });
  }, [orders, selectedPeriod, selectedChannel, searchTerm]);

  // Totales de las tarjetas basados en baseSales
  const totalRevenue = useMemo(() => {
    return baseSales.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
  }, [baseSales]);

  const getOrderPaymentMethod = (o) => {
    const raw = typeof o?.paymentMethod === 'object' ? o?.paymentMethod?.method : o?.paymentMethod;
    const m = String(raw || o?.payment_method || 'cash').toLowerCase();
    if (m === 'combined' || m === 'split' || o?.splitPayment || o?.split_payment) return 'combined';
    if (m === 'qr' || m === 'transfer') return 'qr';
    if (m === 'card' || m === 'pos') return 'card';
    if (m === 'credit' || m === 'fiao' || m === 'cuenta') return 'credit';
    return 'cash';
  };

  const paymentTotals = useMemo(() => {
    let cash = 0;
    let qr = 0;
    let card = 0;
    let credit = 0;
    let combined = 0;
    let combinedCount = 0;

    baseSales.forEach(order => {
      const p = calculateSplitPortions(order);
      cash += p.cash;
      qr += p.qr;
      card += p.card;
      credit += p.credit;

      const m = getOrderPaymentMethod(order);
      if (m === 'combined') {
        combined += (Number(order.total) || 0);
        combinedCount++;
      }
    });

    return {
      cash: roundMoney(cash),
      qr: roundMoney(qr),
      card: roundMoney(card),
      credit: roundMoney(credit),
      combined: roundMoney(combined),
      combinedCount
    };
  }, [baseSales]);

  const cashTotal = paymentTotals.cash;
  const qrTotal = paymentTotals.qr;
  const cardTotal = paymentTotals.card;
  const combinedTotal = paymentTotals.combined;
  const combinedOrdersCount = paymentTotals.combinedCount;

  // 2. Ventas filtradas específicamente por el Método de Pago seleccionado (para la tabla/lista de ventas)
  const filteredSales = useMemo(() => {
    if (selectedPaymentMethod === 'all') return baseSales;
    return baseSales.filter(o => getOrderPaymentMethod(o) === selectedPaymentMethod);
  }, [baseSales, selectedPaymentMethod]);

  const totalSalesCount = filteredSales.length;
  const filteredRevenue = useMemo(() => {
    return filteredSales.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
  }, [filteredSales]);
  const averageTicket = totalSalesCount > 0 ? filteredRevenue / totalSalesCount : 0;

  // Etiqueta legible para la exportación de acuerdo al filtro activo
  const exportTitleSuffix = useMemo(() => {
    switch (selectedPaymentMethod) {
      case 'cash':
        return 'Efectivo';
      case 'qr':
        return 'QR Simple';
      case 'card':
        return 'Tarjeta POS';
      case 'combined':
        return 'Pago Combinado';
      default:
        return 'Recaudación Total';
    }
  }, [selectedPaymentMethod]);

  // Paginación
  const totalPages = itemsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(totalSalesCount / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedSales = useMemo(() => {
    if (itemsPerPage === 'all') return filteredSales;
    const start = (safePage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, safePage, itemsPerPage]);

  const startIndex = totalSalesCount === 0 ? 0 : (safePage - 1) * (itemsPerPage === 'all' ? totalSalesCount : itemsPerPage) + 1;
  const endIndex = itemsPerPage === 'all' ? totalSalesCount : Math.min(safePage * itemsPerPage, totalSalesCount);

  // Helper para generar números de página con elipsis
  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Helper para formatear fecha y hora
  const formatSaleDateTime = (dateStr) => {
    if (!dateStr) return { date: 'Sin fecha', time: '--:--', isToday: false };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: 'Sin fecha', time: '--:--', isToday: false };

    const now = new Date();
    const isToday = now.toDateString() === d.toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === d.toDateString();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let dateLabel = d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (isToday) dateLabel = 'Hoy';
    else if (isYesterday) dateLabel = 'Ayer';

    return { 
      date: dateLabel, 
      time: timeStr, 
      isToday,
      fullDate: d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };
  };

  // Impresión de Comanda Térmica Individual
  const handlePrintSaleReceipt = (sale) => {
    if (!sale) return;
    const printWindow = window.open('', '', 'width=420,height=650');
    if (!printWindow) return;

    const formatted = formatSaleDateTime(sale.createdAt || sale.created_at);
    const items = Array.isArray(sale.items) ? sale.items : [];
    const paymentLabel = 
      sale.paymentMethod === 'qr' ? 'QR Simple (Digital)' :
      sale.paymentMethod === 'card' ? 'Tarjeta POS' : 'Efectivo';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda - ${sale.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 13px; 
              padding: 14px; 
              width: 280px; 
              color: #000; 
              margin: 0 auto;
            }
            .center { text-align: center; }
            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 12px; }
            .bold { font-weight: bold; }
            .item-title { font-weight: bold; margin-top: 4px; }
            .item-detail { display: flex; justify-content: space-between; font-size: 11px; padding-left: 8px; color: #333; }
          </style>
        </head>
        <body>
          <div class="center">
            <h3 style="margin:0; font-size:16px;">${escapeHtml(storeConfig?.name || 'MarketSaaS')}</h3>
            <p style="margin:2px 0; font-size:11px;">COMPROBANTE DE VENTA</p>
            <div class="divider"></div>
            <p style="margin:2px 0; font-size:12px; font-weight:bold;">TICKET #${escapeHtml(sale.id)}</p>
            <p style="margin:2px 0; font-size:11px;">Fecha: ${escapeHtml(formatted.fullDate)} - ${escapeHtml(formatted.time)}</p>
            <p style="margin:2px 0; font-size:11px;">Atendido por: ${escapeHtml(currentUser?.user_metadata?.full_name || currentUser?.email || 'Caja')}</p>
            <div class="divider"></div>
          </div>
          
          <div style="margin-bottom:6px;">
            <p style="margin:2px 0; font-size:11px;"><strong>Cliente:</strong> ${escapeHtml(sale.customer?.name || 'Cliente Presencial')}</p>
            ${sale.deliveryType === 'delivery' && sale.customer?.address ? `
              <p style="margin:2px 0; font-size:11px;"><strong>Destino:</strong> ${escapeHtml(sale.customer.address)}${sale.customer.reference ? ` (${escapeHtml(sale.customer.reference)})` : ''}</p>
            ` : ''}
            <p style="margin:2px 0; font-size:11px;"><strong>Tipo:</strong> ${sale.deliveryType === 'delivery' ? 'Envío a Domicilio' : 'Venta Mostrador'}</p>
          </div>
          
          <div class="divider"></div>
          <p class="bold" style="margin:4px 0;">ARTÍCULOS:</p>

          ${items.map(item => `
            <div style="margin-bottom:4px;">
              <div class="item-title">${escapeHtml(item.name)}</div>
              <div class="item-detail">
                <span>${escapeHtml(item.quantity)} x ${currency} ${(Number(item.price) || 0).toFixed(2)}</span>
                <span class="bold">${currency} ${((Number(item.quantity) || 1) * (Number(item.price) || 0)).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}

          <div class="divider"></div>

          <div class="row"><span>Subtotal:</span><span>${currency} ${(Number(sale.subtotal) || Number(sale.total) || 0).toFixed(2)}</span></div>
          ${Number(sale.discount) > 0 ? `<div class="row"><span>Descuento:</span><span>-${currency} ${Number(sale.discount).toFixed(2)}</span></div>` : ''}
          ${Number(sale.deliveryFee) > 0 ? `<div class="row"><span>Envío Delivery:</span><span>${currency} ${Number(sale.deliveryFee).toFixed(2)}</span></div>` : ''}
          
          <div class="divider"></div>
          <div class="row bold" style="font-size:15px; margin:6px 0;">
            <span>TOTAL PAGADO:</span>
            <span>${currency} ${(Number(sale.total) || 0).toFixed(2)}</span>
          </div>
          <div class="row" style="font-size:11px;">
            <span>Método de Cobro:</span>
            <span class="bold">${
              getOrderPaymentMethod(sale) === 'combined'
                ? 'PAGO COMBINADO'
                : sale.paymentMethod === 'qr' ? 'QR SIMPLE (DIGITAL)' :
                  sale.paymentMethod === 'card' ? 'TARJETA POS' : 'EFECTIVO'
            }</span>
          </div>
          ${(() => {
            if (getOrderPaymentMethod(sale) === 'combined') {
              const sp = calculateSplitPortions(sale);
              const splitObj = sale.splitPayment || sale.split_payment;
              let html = '';
              if (sp.cash > 0) html += `<div class="row" style="font-size:11px;"><span>• Efectivo:</span><span>${currency} ${sp.cash.toFixed(2)}</span></div>`;
              if (sp.qr > 0) html += `<div class="row" style="font-size:11px;"><span>• QR Simple:</span><span>${currency} ${sp.qr.toFixed(2)}</span></div>`;
              if (sp.card > 0) html += `<div class="row" style="font-size:11px;"><span>• Tarjeta POS:</span><span>${currency} ${sp.card.toFixed(2)}</span></div>`;
              if (Number(splitObj?.change) > 0) html += `<div class="row bold" style="font-size:11px;"><span>Cambio Efectivo:</span><span>${currency} ${Number(splitObj.change).toFixed(2)}</span></div>`;
              return html;
            }
            return '';
          })()}

          <div class="divider"></div>
          <div class="center" style="margin-top: 16px;">
            <p style="font-size:11px; margin:2px 0;">¡Gracias por tu preferencia!</p>
            <p style="font-size:10px; margin:2px 0; color:#666;">MarketSaaS • Comercio de Barrio</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* 1. Header de Sección */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Historial de Ventas & Facturación</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico de ventas en mostrador (POS) y pedidos de vecinos con desglose de productos y horas.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Botón Arqueo y Cierre de Caja (Con bloqueo por suscripción) */}
          <button
            type="button"
            onClick={() => {
              if (!isSubscriptionActive) {
                setBlockedFeature('Cierre de Caja y Arqueo Diario');
                setIsBlockedModalOpen(true);
              } else {
                setIsCashRegisterModalOpen(true);
              }
            }}
            className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
              !isSubscriptionActive
                ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Arqueo y Cierre de Caja Diario (Control de Efectivo)"}
          >
            {!isSubscriptionActive ? <Lock className="w-4 h-4 text-amber-500" /> : <Banknote className="w-4 h-4 text-white" />}
            <span>Cierre de Caja</span>
          </button>

          {/* Botón Resumen Semanal para WhatsApp */}
          <button
            type="button"
            onClick={() => setIsWeeklySummaryModalOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            title="Ver y enviar resumen semanal de rendimiento a WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Resumen WhatsApp</span>
          </button>

          {/* Botón de Inyección Rápida de Ventas de Prueba con Pago Combinado */}
          {injectSplitPaymentTestOrders && (
            <button
              type="button"
              onClick={injectSplitPaymentTestOrders}
              className="h-9 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 hover:border-purple-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Inyectar 5 ventas de prueba con Pago Combinado para verificar Historial, Reportes y Arqueo"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Inyectar Ventas Mixtas</span>
            </button>
          )}

          {/* Botón Exportar Reporte Filtrado (Con bloqueo por suscripción) */}
          <button
            type="button"
            onClick={() => {
              if (!isSubscriptionActive) {
                setBlockedFeature('Exportación de Reportes Financieros');
                setIsBlockedModalOpen(true);
              } else {
                setIsExportModalOpen(true);
              }
            }}
            className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
              !isSubscriptionActive
                ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Exportar reporte contable de ventas con los filtros actuales (PDF, Excel)"}
          >
            {!isSubscriptionActive ? <Lock className="w-4 h-4 text-amber-500" /> : <Download className="w-4 h-4 text-emerald-400" />}
            <span>Exportar Reporte</span>
            {isSubscriptionActive && selectedPaymentMethod !== 'all' && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
                {selectedPaymentMethod === 'cash' ? 'Efectivo' : selectedPaymentMethod === 'qr' ? 'QR' : selectedPaymentMethod === 'card' ? 'POS' : 'Combinado'}
              </span>
            )}
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalSalesCount} {totalSalesCount === 1 ? 'operación' : 'operaciones'}</span>
          </span>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen KPI (Interactivas: Clic para filtrar/desfiltrar por Método de Pago) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Recaudado (Muestra todas las ventas) */}
        <button
          type="button"
          onClick={() => handleTogglePaymentMethod('all')}
          className={`sales-kpi-card p-4 rounded-2xl border-2 text-left transition-none cursor-pointer relative group ${
            selectedPaymentMethod === 'all'
              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
              : 'bg-slate-50/90 border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
          title="Ver todas las ventas sin filtrar por forma de pago"
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${selectedPaymentMethod === 'all' ? 'text-slate-100 font-bold' : 'text-slate-600'}`}>
              Recaudación Total
            </span>
            <div className="flex items-center gap-1.5">
              {selectedPaymentMethod === 'all' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 shadow-2xs">
                  Todas
                </span>
              )}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                selectedPaymentMethod === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black mt-1 ${selectedPaymentMethod === 'all' ? 'text-white' : 'text-slate-900'}`}>
            {currency} {totalRevenue.toFixed(2)}
          </p>
          <div className={`text-[11px] mt-0.5 font-medium flex items-center justify-between ${selectedPaymentMethod === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            <span>
              {selectedPeriod === 'today' ? 'Ventas de hoy' : 
               selectedPeriod === '24h' ? 'Últimas 24 horas' :
               selectedPeriod === 'yesterday' ? 'Ventas de ayer' : 
               selectedPeriod === 'week' ? 'Últimos 7 días' : 
               selectedPeriod === 'month' ? 'Este mes' : 'Todo el período'}
            </span>
            <span className={`text-[10px] font-bold ${selectedPaymentMethod === 'all' ? 'text-emerald-400' : 'text-slate-500'}`}>
              {selectedPaymentMethod === 'all' ? '● Mostrando todas' : 'Ver todas'}
            </span>
          </div>
        </button>

        {/* Efectivo Cobrado */}
        <button
          type="button"
          onClick={() => handleTogglePaymentMethod('cash')}
          className={`sales-kpi-card p-4 rounded-2xl border-2 text-left transition-none cursor-pointer relative group ${
            selectedPaymentMethod === 'cash'
              ? 'bg-emerald-100 border-emerald-600 shadow-sm'
              : 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
          }`}
          title={selectedPaymentMethod === 'cash' ? 'Clic para quitar filtro de efectivo' : 'Clic para filtrar solo ventas en efectivo'}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${selectedPaymentMethod === 'cash' ? 'text-emerald-950 font-bold' : 'text-emerald-800'}`}>
              Efectivo 💵
            </span>
            <div className="flex items-center gap-1.5">
              {selectedPaymentMethod === 'cash' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                  Filtrando
                </span>
              )}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                selectedPaymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-emerald-100/80 text-emerald-700'
              }`}>
                <Banknote className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
            {currency} {cashTotal.toFixed(2)}
          </p>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium flex items-center justify-between">
            <span>Billetes / monedas</span>
            <span className="text-[10px] font-bold">
              {selectedPaymentMethod === 'cash' ? '✕ Quitar filtro' : 'Filtrar'}
            </span>
          </div>
        </button>

        {/* QR Simple Cobrado */}
        <button
          type="button"
          onClick={() => handleTogglePaymentMethod('qr')}
          className={`sales-kpi-card p-4 rounded-2xl border-2 text-left transition-none cursor-pointer relative group ${
            selectedPaymentMethod === 'qr'
              ? 'bg-cyan-100 border-cyan-600 shadow-sm'
              : 'bg-cyan-50/40 border-cyan-200/80 hover:border-cyan-300'
          }`}
          title={selectedPaymentMethod === 'qr' ? 'Clic para quitar filtro de QR' : 'Clic para filtrar solo ventas por QR Simple'}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${selectedPaymentMethod === 'qr' ? 'text-cyan-950 font-bold' : 'text-cyan-800'}`}>
              QR Digital / Simple 📲
            </span>
            <div className="flex items-center gap-1.5">
              {selectedPaymentMethod === 'qr' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-600 text-white shadow-2xs">
                  Filtrando
                </span>
              )}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                selectedPaymentMethod === 'qr' ? 'bg-cyan-600 text-white' : 'bg-cyan-100/80 text-cyan-700'
              }`}>
                <QrCode className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-cyan-950 mt-1">
            {currency} {qrTotal.toFixed(2)}
          </p>
          <div className="text-[11px] text-cyan-700 mt-0.5 font-medium flex items-center justify-between">
            <span>Transferencias digitales</span>
            <span className="text-[10px] font-bold">
              {selectedPaymentMethod === 'qr' ? '✕ Quitar filtro' : 'Filtrar'}
            </span>
          </div>
        </button>

        {/* Tarjeta POS */}
        <button
          type="button"
          onClick={() => handleTogglePaymentMethod('card')}
          className={`sales-kpi-card p-4 rounded-2xl border-2 text-left transition-none cursor-pointer relative group ${
            selectedPaymentMethod === 'card'
              ? 'bg-amber-100 border-amber-600 shadow-sm'
              : 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
          }`}
          title={selectedPaymentMethod === 'card' ? 'Clic para quitar filtro de Tarjeta POS' : 'Clic para filtrar solo ventas con Tarjeta POS'}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${selectedPaymentMethod === 'card' ? 'text-amber-950 font-bold' : 'text-amber-800'}`}>
              Tarjeta POS 💳
            </span>
            <div className="flex items-center gap-1.5">
              {selectedPaymentMethod === 'card' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white shadow-2xs">
                  Filtrando
                </span>
              )}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                selectedPaymentMethod === 'card' ? 'bg-amber-600 text-white' : 'bg-amber-100/80 text-amber-700'
              }`}>
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
            {currency} {cardTotal.toFixed(2)}
          </p>
          <div className="text-[11px] text-amber-700 mt-0.5 font-medium flex items-center justify-between">
            <span>Terminal POS</span>
            <span className="text-[10px] font-bold">
              {selectedPaymentMethod === 'card' ? '✕ Quitar filtro' : 'Filtrar'}
            </span>
          </div>
        </button>

        {/* Pago Combinado (Nuevo Método) */}
        <button
          type="button"
          onClick={() => handleTogglePaymentMethod('combined')}
          className={`sales-kpi-card p-4 rounded-2xl border-2 text-left transition-none cursor-pointer relative group ${
            selectedPaymentMethod === 'combined'
              ? 'bg-violet-100 border-violet-600 shadow-sm'
              : 'bg-violet-50/40 border-violet-200/80 hover:border-violet-300'
          }`}
          title={selectedPaymentMethod === 'combined' ? 'Clic para quitar filtro de Pago Combinado' : 'Clic para filtrar solo ventas con Pago Combinado'}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${selectedPaymentMethod === 'combined' ? 'text-violet-950 font-bold' : 'text-violet-800'}`}>
              Combinado 🔀
            </span>
            <div className="flex items-center gap-1.5">
              {selectedPaymentMethod === 'combined' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-600 text-white shadow-2xs">
                  Filtrando
                </span>
              )}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                selectedPaymentMethod === 'combined' ? 'bg-violet-600 text-white' : 'bg-violet-100/80 text-violet-700'
              }`}>
                <Layers className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-violet-950 mt-1">
            {currency} {combinedTotal.toFixed(2)}
          </p>
          <div className="text-[11px] text-violet-700 mt-0.5 font-medium flex items-center justify-between">
            <span>Efe + QR + POS ({combinedOrdersCount})</span>
            <span className="text-[10px] font-bold">
              {selectedPaymentMethod === 'combined' ? '✕ Quitar filtro' : 'Filtrar'}
            </span>
          </div>
        </button>
      </div>

      {/* 3. Barra de Búsqueda y Filtros Rápidos */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col gap-3">
        {/* Fila Superior de Filtros */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Buscador de Ventas */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ticket #, cliente o producto..."
              className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Filtro por Período */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
              Período:
            </span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'today', label: 'Hoy' },
              { id: '24h', label: '24 Horas' },
              { id: 'yesterday', label: 'Ayer' },
              { id: 'week', label: '7 Días' },
              { id: 'month', label: 'Este Mes' }
            ].map((p) => {
              const isActive = selectedPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila Inferior de Sub-Filtros (Canal y Método de Pago) */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Filtro Canal */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Canal:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pos', label: 'Mostrador POS' },
                { id: 'delivery', label: 'Delivery' }
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedChannel(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-none cursor-pointer ${
                    selectedChannel === c.id ? 'bg-emerald-600 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Método de Pago */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pago:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'cash', label: 'Efectivo' },
                { id: 'qr', label: 'QR' },
                { id: 'card', label: 'Tarjeta' },
                { id: 'combined', label: 'Combinado' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleTogglePaymentMethod(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-none cursor-pointer ${
                    selectedPaymentMethod === m.id ? 'bg-emerald-600 text-white shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Barra Superior de Paginación y Control de Límite */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1.5 flex-wrap">
            <span>Mostrando</span>
            <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
              {totalSalesCount === 0 ? 0 : `${startIndex} - ${endIndex}`}
            </span>
            <span>de <strong className="font-extrabold text-slate-800">{totalSalesCount}</strong> ventas</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 sm:gap-1.5 select-none overflow-x-auto py-0.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="h-8 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs text-xs shrink-0"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                {getPageNumbers(safePage, totalPages).map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`sales-top-ellipsis-${idx}`} className="px-1.5 py-1 text-slate-400 font-bold text-xs">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = page === safePage;
                  return (
                    <button
                      key={`sales-top-p-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="h-8 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs text-xs shrink-0"
                title="Página siguiente"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2.5 lg:pt-0 border-t border-slate-100 lg:border-t-0">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Mostrar:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            {[10, 25, 50, 'all'].map((limit) => {
              const isSelected = itemsPerPage === limit;
              return (
                <button
                  key={`sales-limit-${limit}`}
                  type="button"
                  onClick={() => setItemsPerPage(limit)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-extrabold transition-none cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {limit === 'all' ? 'Todos' : limit}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Tabla de Ventas (Con vista adaptada para móvil) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px] sm:min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Ticket / Hora</th>
                <th className="py-3.5 px-4">Canal / Origen</th>
                <th className="py-3.5 px-4">Cliente / Ubicación</th>
                <th className="py-3.5 px-4">Artículos Vendidos</th>
                <th className="py-3.5 px-4">Método de Cobro</th>
                <th className="py-3.5 px-4 text-right">Total Cobrado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-bold text-sm text-slate-600">No se encontraron ventas registradas</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando el período o los términos de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => {
                  const formatted = formatSaleDateTime(sale.createdAt || sale.created_at);
                  const channel = getSaleChannel(sale);
                  const items = Array.isArray(sale.items) ? sale.items : [];
                  const totalItemsCount = items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

                  return (
                    <tr 
                      key={sale.id}
                      className="transition-colors hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => setSelectedSale(sale)}
                    >
                      {/* Ticket / Hora */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                            <Clock className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 leading-snug">
                              #{sale.id}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className={`font-bold ${formatted.isToday ? 'text-emerald-700' : 'text-slate-600'}`}>
                                {formatted.date}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span>{formatted.time}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Canal / Origen */}
                      <td className="py-3 px-4">
                        {channel === 'pos' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]">
                            <Store className="w-3 h-3 text-teal-600" />
                            <span>Mostrador POS</span>
                          </span>
                        ) : channel === 'delivery' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px]">
                            <Truck className="w-3 h-3 text-purple-600" />
                            <span>Delivery Vecino</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[11px]">
                            <ShoppingBag className="w-3 h-3 text-blue-600" />
                            <span>Retiro en Local</span>
                          </span>
                        )}
                      </td>

                      {/* Cliente / Ubicación */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">
                          {sale.customer?.name || 'Cliente de Mostrador'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {sale.customer?.tower || sale.customer?.apartment
                            ? `${sale.customer.tower || ''} • ${sale.customer.apartment || ''}`
                            : (sale.customer?.phone || 'Presencial en tienda')}
                        </p>
                      </td>

                      {/* Artículos Vendidos */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-700 text-xs">
                            {totalItemsCount} {totalItemsCount === 1 ? 'ítem' : 'ítems'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                            {items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            {items.length > 2 && ` +${items.length - 2} más`}
                          </span>
                        </div>
                      </td>

                      {/* Método de Cobro */}
                      <td className="py-3 px-4">
                        {(() => {
                          const m = getOrderPaymentMethod(sale);
                          if (m === 'combined') {
                            const breakdown = formatPaymentBreakdownText(sale, currency);
                            return (
                              <div className="flex flex-col items-start gap-0.5">
                                <span 
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-violet-100 text-violet-900 font-extrabold text-[11px] border border-violet-300/80 shadow-2xs"
                                  title={`Pago Combinado: ${breakdown}`}
                                >
                                  <span className="text-[11px]">🔀</span>
                                  <span>Combinado</span>
                                </span>
                                <span className="text-[10px] text-violet-700 font-bold pl-0.5 whitespace-nowrap">
                                  {breakdown}
                                </span>
                              </div>
                            );
                          }
                          if (m === 'qr') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 font-extrabold text-[11px] border border-cyan-200">
                                <QrCode className="w-3.5 h-3.5 text-cyan-600" />
                                <span>QR Simple</span>
                              </span>
                            );
                          }
                          if (m === 'card') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-extrabold text-[11px] border border-amber-200">
                                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                                <span>Tarjeta POS</span>
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-extrabold text-[11px] border border-emerald-200">
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Efectivo</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Total Cobrado */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-sm text-slate-900">
                          {currency} {(Number(sale.total) || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Ver detalle de comanda"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintSaleReceipt(sale)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Reimprimir comanda térmica"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra Inferior de Paginación */}
        <div className="px-3.5 sm:px-4 py-3 sm:py-3.5 bg-slate-50/80 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="font-medium text-slate-500 text-center sm:text-left">
            Página <span className="font-extrabold text-slate-800">{safePage}</span> de{' '}
            <span className="font-extrabold text-slate-800">{totalPages}</span>
            {itemsPerPage !== 'all' && (
              <span className="text-slate-400 ml-1.5">({itemsPerPage} por página)</span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 sm:gap-1.5 select-none overflow-x-auto max-w-full py-0.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="h-8 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0 text-xs"
                title="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                {getPageNumbers(safePage, totalPages).map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`sales-bottom-ellipsis-${idx}`} className="px-1.5 py-1 text-slate-400 font-bold text-xs">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = page === safePage;
                  return (
                    <button
                      key={`sales-bottom-p-${page}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="h-8 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0 text-xs"
                title="Página siguiente"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL DETALLE / COMANDA DE VENTA                                       */}
      {/* ========================================================================= */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div 
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white leading-snug">
                    Comanda #{selectedSale.id}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {formatSaleDateTime(selectedSale.createdAt || selectedSale.created_at).fullDate} • {formatSaleDateTime(selectedSale.createdAt || selectedSale.created_at).time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido desplazable estilo Comanda */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Tarjeta de Información de Cliente & Canal */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Cliente</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedSale.customer?.name || 'Cliente Presencial'}
                  </span>
                </div>
                {selectedSale.customer?.phone && selectedSale.customer.phone !== 'Presencial' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Teléfono:</span>
                    <span className="font-semibold text-slate-700">{selectedSale.customer.phone}</span>
                  </div>
                )}
                {selectedSale.deliveryType === 'delivery' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Destino:</span>
                    <span className="font-semibold text-slate-700">
                      {[selectedSale.customer?.address, selectedSale.customer?.reference].filter(Boolean).join(' • ') || 'A Domicilio'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Tipo de Entrega:</span>
                  <span className="font-bold text-emerald-800">
                    {selectedSale.deliveryType === 'delivery' ? '🛵 Envío a Domicilio' : '🏪 Retiro en Tienda / Mostrador'}
                  </span>
                </div>
              </div>

              {/* Lista de Artículos */}
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs mb-2 uppercase tracking-wider">
                  Detalle de Artículos ({(selectedSale.items || []).length}):
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {(selectedSale.items || []).map((item, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.quantity} x {currency} {(Number(item.price) || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs shrink-0">
                        {currency} {((Number(item.quantity) || 1) * (Number(item.price) || 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales y Liquidación */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-slate-300 text-xs">
                  <span>Subtotal:</span>
                  <span>{currency} {(Number(selectedSale.subtotal) || Number(selectedSale.total) || 0).toFixed(2)}</span>
                </div>
                {Number(selectedSale.discount) > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
                    <span>Descuento Cupón:</span>
                    <span>-{currency} {Number(selectedSale.discount).toFixed(2)}</span>
                  </div>
                )}
                {Number(selectedSale.deliveryFee) > 0 && (
                  <div className="flex items-center justify-between text-slate-300 text-xs">
                    <span>Costo de Envío:</span>
                    <span>{currency} {Number(selectedSale.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">TOTAL PAGADO:</span>
                  <span className="text-xl font-black text-emerald-400">
                    {currency} {(Number(selectedSale.total) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Forma de Pago:</span>
                  <span className="font-bold text-slate-200 uppercase">
                    {getOrderPaymentMethod(selectedSale) === 'combined' ? '🔀 Pago Combinado' :
                     selectedSale.paymentMethod === 'qr' ? '📲 QR Simple' :
                     selectedSale.paymentMethod === 'card' ? '💳 Tarjeta POS' : '💵 Efectivo'}
                  </span>
                </div>
                {getOrderPaymentMethod(selectedSale) === 'combined' && (() => {
                  const sp = calculateSplitPortions(selectedSale);
                  const splitObj = selectedSale.splitPayment || selectedSale.split_payment;
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1 mt-1">
                      <span className="text-[10px] text-violet-300 font-extrabold uppercase tracking-wider block">
                        Desglose de Cobro Combinado:
                      </span>
                      {sp.cash > 0 && (
                        <div className="flex justify-between text-emerald-300">
                          <span>• Efectivo:</span>
                          <span className="font-bold">{currency} {sp.cash.toFixed(2)}</span>
                        </div>
                      )}
                      {sp.qr > 0 && (
                        <div className="flex justify-between text-cyan-300">
                          <span>• QR Simple:</span>
                          <span className="font-bold">{currency} {sp.qr.toFixed(2)}</span>
                        </div>
                      )}
                      {sp.card > 0 && (
                        <div className="flex justify-between text-amber-300">
                          <span>• Tarjeta POS:</span>
                          <span className="font-bold">{currency} {sp.card.toFixed(2)}</span>
                        </div>
                      )}
                      {Number(splitObj?.change) > 0 && (
                        <div className="flex justify-between text-slate-300 border-t border-slate-700 pt-1">
                          <span>Cambio entregado:</span>
                          <span className="font-bold text-emerald-400">{currency} {Number(splitObj.change).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer shadow-2xs"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => handlePrintSaleReceipt(selectedSale)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comanda</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportación de Reporte de Ventas (Filtrado según selección activa) */}
      <ExportSalesReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        customOrders={filteredSales}
        titleSuffix={exportTitleSuffix}
      />

      {/* Modal de Arqueo y Cierre de Caja Diario (Control de Efectivo) */}
      <CashRegisterModal
        isOpen={isCashRegisterModalOpen}
        onClose={() => setIsCashRegisterModalOpen(false)}
      />

      {/* Modal de Resumen Semanal para WhatsApp */}
      <WeeklySummaryModal
        isOpen={isWeeklySummaryModalOpen}
        onClose={() => setIsWeeklySummaryModalOpen(false)}
      />

      {/* Modal de Bloqueo de Suscripción */}
      <SubscriptionBlockedModal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        featureName={blockedFeature}
      />
    </div>
  );
};
