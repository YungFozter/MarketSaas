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
  SlidersHorizontal
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { normalizeSearchText, escapeHtml } from '../../utils/formatters';
import './SalesHistory.css';

export const SalesHistory = () => {
  const { orders = [], storeConfig, currentUser } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';

  // Filtros de búsqueda y estado
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'today' | 'yesterday' | 'week' | 'month' | 'all'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all'); // 'all' | 'cash' | 'qr' | 'card'
  const [selectedChannel, setSelectedChannel] = useState('all'); // 'all' | 'pos' | 'delivery' | 'pickup'

  // Modal de Detalle / Comanda de Venta
  const [selectedSale, setSelectedSale] = useState(null);

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
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (period) {
      case 'today':
        return saleDate >= startOfToday;
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
      (order.customer?.name && order.customer.name.includes('Presencial')) ||
      (order.customer?.name && order.customer.name.includes('Mostrador'));

    if (isPos) return 'pos';
    if (order.deliveryType === 'delivery') return 'delivery';
    return 'pickup';
  };

  // Filtrado reactivo de ventas
  const filteredSales = useMemo(() => {
    return orders
      .filter((order) => {
        // Filtro por Período
        const dateMatch = matchesPeriod(order.createdAt || order.created_at, selectedPeriod);
        if (!dateMatch) return false;

        // Filtro por Método de Pago
        const paymentMatch = 
          selectedPaymentMethod === 'all' || 
          order.paymentMethod === selectedPaymentMethod;
        if (!paymentMatch) return false;

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
        const customerAddress = `${order.customer?.tower || ''} ${order.customer?.apartment || ''} ${order.customer?.condominium || ''}`;

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
  }, [orders, selectedPeriod, selectedPaymentMethod, selectedChannel, searchTerm]);

  // Cálculos de métricas del conjunto filtrado
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, order) => acc + (Number(order.total) || 0), 0);
  }, [filteredSales]);

  const totalSalesCount = filteredSales.length;
  const averageTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  // Desglose por método de pago del filtro actual
  const cashTotal = useMemo(() => {
    return filteredSales
      .filter(o => o.paymentMethod === 'cash')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [filteredSales]);

  const qrTotal = useMemo(() => {
    return filteredSales
      .filter(o => o.paymentMethod === 'qr')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [filteredSales]);

  const cardTotal = useMemo(() => {
    return filteredSales
      .filter(o => o.paymentMethod === 'card')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [filteredSales]);

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
            ${sale.customer?.condominium && sale.customer.condominium !== 'En Tienda' ? `
              <p style="margin:2px 0; font-size:11px;"><strong>Destino:</strong> ${escapeHtml(sale.customer.tower || '')} • ${escapeHtml(sale.customer.apartment || '')}</p>
            ` : ''}
            <p style="margin:2px 0; font-size:11px;"><strong>Tipo:</strong> ${sale.deliveryType === 'delivery' ? 'Delivery Vecino' : 'Venta Mostrador'}</p>
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
            <span class="bold">${paymentLabel}</span>
          </div>

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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{totalSalesCount} operaciones registradas</span>
          </span>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Recaudado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Recaudación Total</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {currency} {totalRevenue.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {selectedPeriod === 'today' ? 'Ventas de hoy' : 
             selectedPeriod === 'yesterday' ? 'Ventas de ayer' : 
             selectedPeriod === 'week' ? 'Últimos 7 días' : 
             selectedPeriod === 'month' ? 'Este mes' : 'Todo el período filtrado'}
          </p>
        </div>

        {/* Efectivo Cobrado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Efectivo 💵</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
            {currency} {cashTotal.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            Cobrado en billetes / monedas
          </p>
        </div>

        {/* QR Simple Cobrado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-800">QR Simple 📲</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-cyan-950 mt-1">
            {currency} {qrTotal.toFixed(2)}
          </p>
          <p className="text-[11px] text-cyan-700 mt-0.5 font-medium">
            Transferencias electrónicas
          </p>
        </div>

        {/* Tarjeta POS / Ticket Promedio */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Tarjeta POS 💳</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
            {currency} {cardTotal.toFixed(2)}
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
            Ticket prom: {currency} {averageTicket.toFixed(2)}
          </p>
        </div>
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedChannel === c.id ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
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
                { id: 'card', label: 'Tarjeta' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPaymentMethod === m.id ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
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
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-emerald-700 shadow-2xs font-black'
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
                        {sale.paymentMethod === 'qr' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 font-extrabold text-[11px]">
                            <QrCode className="w-3 h-3 text-cyan-600" />
                            <span>QR Simple</span>
                          </span>
                        ) : sale.paymentMethod === 'card' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-extrabold text-[11px]">
                            <CreditCard className="w-3 h-3 text-amber-600" />
                            <span>Tarjeta POS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-extrabold text-[11px]">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            <span>Efectivo</span>
                          </span>
                        )}
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
                      {[selectedSale.customer?.condominium, selectedSale.customer?.tower, selectedSale.customer?.apartment].filter(Boolean).join(' • ') || 'A Domicilio'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Tipo de Entrega:</span>
                  <span className="font-bold text-emerald-800">
                    {selectedSale.deliveryType === 'delivery' ? '🛵 Delivery Vecino' : '🏪 Retiro en Tienda / Mostrador'}
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
                    {selectedSale.paymentMethod === 'qr' ? '📲 QR Simple' :
                     selectedSale.paymentMethod === 'card' ? '💳 Tarjeta POS' : '💵 Efectivo'}
                  </span>
                </div>
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
    </div>
  );
};
