import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  Printer,
  Calendar,
  DollarSign,
  QrCode,
  CreditCard,
  BookOpen,
  Store,
  ShoppingBag,
  Filter
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { 
  exportSalesToPDF, 
  exportSalesToStyledExcel, 
  prepareSalesData 
} from '../../utils/salesExportUtils';

export const ExportSalesReportModal = ({ isOpen, onClose, customOrders = null, titleSuffix = '' }) => {
  const { orders: storeOrders = [], storeConfig, formatBoliviaDateTime, showToast } = useStore();

  // Estados de filtrado interactivo
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today' | 'yesterday' | '7days' | 'month' | 'all'
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'cash' | 'qr' | 'card' | 'credit'
  const [channelFilter, setChannelFilter] = useState('all'); // 'all' | 'pos' | 'online'

  const baseOrders = customOrders !== null ? customOrders : storeOrders;
  const storeName = storeConfig?.name || 'Mi Tienda';
  const currency = storeConfig?.currencySymbol || 'Bs.';

  // Función de normalización de fecha en zona horaria de Bolivia (America/La_Paz, UTC-4)
  const getBoliviaDateParts = (isoDateStr) => {
    if (!isoDateStr) return null;
    try {
      const d = new Date(isoDateStr);
      if (isNaN(d.getTime())) return null;
      // Formato YYYY-MM-DD
      const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(d);
      return {
        timestamp: d.getTime(),
        dateKey, // '2026-09-24'
        monthKey: dateKey.slice(0, 7) // '2026-09'
      };
    } catch {
      return null;
    }
  };

  const todayBoliviaKey = (() => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  })();

  const yesterdayBoliviaKey = (() => {
    try {
      const y = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(y);
    } catch {
      return '';
    }
  })();

  const currentMonthBoliviaKey = todayBoliviaKey.slice(0, 7);

  // Normalización de método de pago de una orden
  const getOrderPaymentCategory = (order) => {
    const raw = typeof order.paymentMethod === 'object' ? order.paymentMethod?.method : order.paymentMethod;
    const p = String(raw || '').toLowerCase();
    if (p === 'cash' || p.includes('efectivo')) return 'cash';
    if (p === 'qr' || p.includes('qr')) return 'qr';
    if (p === 'card' || p.includes('tarjeta') || p.includes('pos')) return 'card';
    if (p === 'credit' || p.includes('cuenta') || p.includes('fiao') || p.includes('deudor')) return 'credit';
    return 'cash';
  };

  // Filtrado reactivo en vivo
  const filteredOrders = useMemo(() => {
    return baseOrders.filter(order => {
      // 1. Filtro por Método de Pago
      if (paymentFilter !== 'all') {
        const cat = getOrderPaymentCategory(order);
        if (cat !== paymentFilter) return false;
      }

      // 2. Filtro por Canal de Venta
      const isPos = String(order.id || '').includes('POS');
      if (channelFilter === 'pos' && !isPos) return false;
      if (channelFilter === 'online' && isPos) return false;

      // 3. Filtro por Período de Tiempo
      if (periodFilter !== 'all') {
        const parts = getBoliviaDateParts(order.createdAt || order.created_at);
        if (!parts) return true;

        if (periodFilter === 'today') {
          if (parts.dateKey !== todayBoliviaKey) return false;
        } else if (periodFilter === 'yesterday') {
          if (parts.dateKey !== yesterdayBoliviaKey) return false;
        } else if (periodFilter === '7days') {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          if (parts.timestamp < sevenDaysAgo) return false;
        } else if (periodFilter === 'month') {
          if (parts.monthKey !== currentMonthBoliviaKey) return false;
        }
      }

      return true;
    });
  }, [baseOrders, paymentFilter, channelFilter, periodFilter, todayBoliviaKey, yesterdayBoliviaKey, currentMonthBoliviaKey]);

  // Conteo de órdenes por método de pago para badges de los chips
  const paymentCounts = useMemo(() => {
    let cash = 0, qr = 0, card = 0, credit = 0;
    baseOrders.forEach(o => {
      const cat = getOrderPaymentCategory(o);
      if (cat === 'cash') cash++;
      else if (cat === 'qr') qr++;
      else if (cat === 'card') card++;
      else if (cat === 'credit') credit++;
    });
    return { all: baseOrders.length, cash, qr, card, credit };
  }, [baseOrders]);

  // Cálculos contables de la selección activa
  const { summary } = useMemo(() => {
    return prepareSalesData(filteredOrders, formatBoliviaDateTime);
  }, [filteredOrders, formatBoliviaDateTime]);

  // Generar título descriptivo dinámico para el encabezado del archivo descargado
  const effectiveTitleSuffix = useMemo(() => {
    const parts = [];
    if (paymentFilter === 'cash') parts.push('Solo Efectivo');
    else if (paymentFilter === 'qr') parts.push('Solo QR Simple');
    else if (paymentFilter === 'card') parts.push('Solo Tarjetas');
    else if (paymentFilter === 'credit') parts.push('Solo A Cuenta');

    if (periodFilter === 'today') parts.push('Hoy');
    else if (periodFilter === 'yesterday') parts.push('Ayer');
    else if (periodFilter === '7days') parts.push('Últimos 7 días');
    else if (periodFilter === 'month') parts.push('Este Mes');

    if (channelFilter === 'pos') parts.push('Mostrador');
    else if (channelFilter === 'online') parts.push('Online');

    if (titleSuffix && !parts.includes(titleSuffix)) {
      parts.unshift(titleSuffix);
    }
    return parts.join(' • ');
  }, [paymentFilter, periodFilter, channelFilter, titleSuffix]);

  const handleExportPDF = () => {
    if (filteredOrders.length === 0) {
      showToast('No hay ventas registradas con los filtros seleccionados.', 'warning');
      return;
    }
    exportSalesToPDF(filteredOrders, storeConfig, formatBoliviaDateTime, effectiveTitleSuffix);
    showToast('Generando vista de reporte PDF...', 'success');
  };

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      showToast('No hay ventas registradas con los filtros seleccionados.', 'warning');
      return;
    }
    exportSalesToStyledExcel(filteredOrders, storeConfig, formatBoliviaDateTime, effectiveTitleSuffix);
    showToast('Planilla Excel descargada con éxito.', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] my-auto text-slate-900 animate-scaleUp"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón Cerrar (Con espacio holgado garantizado, sin solaparse con el título) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 z-10 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado con padding derecho holgado */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 shrink-0 pr-12">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                  Exportar Reporte de Ventas
                </h3>
                {effectiveTitleSuffix && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0">
                    {effectiveTitleSuffix}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Historial contable para <strong className="text-slate-800 font-bold">{storeName}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable con filtros interactivos */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          
          {/* ========================================================================= */}
          {/* 1. FILTRO: MÉTODO DE PAGO (ARQUEO DE CAJA / CUADRE BANCARIO)             */}
          {/* ========================================================================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Método de Pago (Cuadre de Caja)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {paymentFilter === 'cash' ? '💵 Solo Efectivo en mano' :
                 paymentFilter === 'qr' ? '📱 Solo transferencias QR' :
                 paymentFilter === 'card' ? '💳 Solo datáfono POS' :
                 paymentFilter === 'credit' ? '📒 Solo ventas a cuenta' : 'Todos los métodos'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentFilter('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                  paymentFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🪙 Todos</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${paymentFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                  {paymentCounts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentFilter('cash')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                  paymentFilter === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50/50 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100/60'
                }`}
                title="Para arqueo de caja física y billetes"
              >
                <span className="truncate">💵 Efectivo</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${paymentFilter === 'cash' ? 'bg-emerald-700 text-white' : 'bg-emerald-200/80 text-emerald-900'}`}>
                  {paymentCounts.cash}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentFilter('qr')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                  paymentFilter === 'qr'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-50/50 text-blue-900 border-blue-200/80 hover:bg-blue-100/60'
                }`}
                title="Para conciliar con banca móvil (BNB, BCP, Unión, etc.)"
              >
                <span className="truncate">📱 QR Simple</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${paymentFilter === 'qr' ? 'bg-blue-700 text-white' : 'bg-blue-200/80 text-blue-900'}`}>
                  {paymentCounts.qr}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentFilter('card')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                  paymentFilter === 'card'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-purple-50/50 text-purple-900 border-purple-200/80 hover:bg-purple-100/60'
                }`}
                title="Para verificar voucher de datáfono físico"
              >
                <span className="truncate">💳 Tarjetas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${paymentFilter === 'card' ? 'bg-purple-700 text-white' : 'bg-purple-200/80 text-purple-900'}`}>
                  {paymentCounts.card}
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. FILTRO: PERÍODO DE TIEMPO (FECHA)                                      */}
          {/* ========================================================================= */}
          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Período de Ventas</span>
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'today', label: 'Hoy (Cierre diario)' },
                { id: 'yesterday', label: 'Ayer' },
                { id: '7days', label: 'Últimos 7 días' },
                { id: 'month', label: 'Este Mes' },
                { id: 'all', label: 'Todo el Historial' }
              ].map(period => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setPeriodFilter(period.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    periodFilter === period.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. FILTRO: CANAL DE VENTA (MOSTRADOR VS ONLINE)                          */}
          {/* ========================================================================= */}
          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Canal / Modalidad de Venta</span>
            </span>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center truncate ${
                  channelFilter === 'all'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todos los Canales
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('pos')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center truncate ${
                  channelFilter === 'pos'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50/50 text-amber-900 border-amber-200/80 hover:bg-amber-100/60'
                }`}
                title="Ventas presenciales en caja de la tienda"
              >
                ⚡ Mostrador (POS)
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('online')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center truncate ${
                  channelFilter === 'online'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-blue-50/50 text-blue-900 border-blue-200/80 hover:bg-blue-100/60'
                }`}
                title="Pedidos realizados por vecinos en el catálogo web"
              >
                🛵 Pedidos Online
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. RESUMEN KPI REACTIVO EN TIEMPO REAL                                    */}
          {/* ========================================================================= */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ventas Seleccionadas
                </span>
                <span className="text-lg font-black text-slate-900">
                  {summary.totalCount} {summary.totalCount === 1 ? 'orden' : 'órdenes'}
                </span>
              </div>
              <div className="text-center border-l border-slate-200 pl-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Subtotal a Exportar
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {currency} {summary.totalAmountFormatted}
                </span>
              </div>
            </div>

            {/* Sub-indicadores por método de pago si está en modo "Todos" */}
            {paymentFilter === 'all' && summary.totalCount > 0 && (
              <div className="flex items-center justify-around pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-slate-600 flex-wrap gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Efectivo: <strong>{currency} {summary.cashTotal}</strong></span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>QR: <strong>{currency} {summary.qrTotal}</strong></span>
                </span>
                {Number(summary.cardTotal) > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Tarjetas: <strong>{currency} {summary.cardTotal}</strong></span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Aviso si no hay resultados con el filtro actual */}
          {filteredOrders.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
              <p className="text-xs font-bold text-amber-900">
                No se encontraron ventas para este criterio de filtro.
              </p>
              <p className="text-[11px] text-amber-700">
                Prueba seleccionando "Todos los métodos" o ampliando el período a "Todo el Historial".
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. OPCIONES DE EXPORTACIÓN (PDF / EXCEL)                                   */}
          {/* ========================================================================= */}
          <div className="space-y-2.5 pt-1">
            {/* Opción 1: PDF */}
            <div className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500/60 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Documento PDF Oficial</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Imprimible</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Membrete formal, KPIs de arqueo y tabla formateada listo para imprimir o archivar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={filteredOrders.length === 0}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Generar PDF</span>
              </button>
            </div>

            {/* Opción 2: Excel con Diseño */}
            <div className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500/60 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Planilla Excel con Diseño (.XLS)</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Recomendado</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Columnas separadas, encabezados esmeralda, bordes y formatos de moneda contable.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={filteredOrders.length === 0}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Descargar Excel</span>
              </button>
            </div>
          </div>

        </div>

        {/* Pie de modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1 text-[11px] sm:text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Compatible con Excel, Sheets y PDF</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
