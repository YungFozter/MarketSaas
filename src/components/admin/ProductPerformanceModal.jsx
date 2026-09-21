import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  Calendar, 
  Clock, 
  DollarSign, 
  Truck, 
  Plus, 
  Check, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ShoppingBag, 
  Receipt,
  Edit3,
  ChevronRight
} from 'lucide-react';
import { useStore, filterOutDemoSuppliers } from '../../context/StoreContext';
import { normalizeSearchText } from '../../utils/formatters';
import './ProductPerformanceModal.css';

// Helper de fechas exactas en zona horaria boliviana (America/La_Paz UTC-4)
const getBoliviaDateParts = (dateInput) => {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return null;

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.format(d).split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10),
      day: parseInt(parts[2], 10),
      rawDate: d
    };
  } catch {
    return null;
  }
};

// Calcula si dos fechas caen en la misma semana (Lunes a Domingo en hora de Bolivia)
const isSameBoliviaWeek = (d1, d2) => {
  try {
    const time1 = new Date(d1).getTime();
    const time2 = new Date(d2).getTime();
    const diffDays = Math.abs(time1 - time2) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) return false;

    // Obtener el día de la semana (1 = lunes, 7 = domingo)
    const dayOfWeek = (new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', weekday: 'narrow' }).format(new Date(d2)));
    // Margen seguro de 7 días hacia atrás desde hoy
    return (time2 - time1) <= (7 * 24 * 60 * 60 * 1000) && (time2 >= time1);
  } catch {
    return false;
  }
};

export const ProductPerformanceModal = ({ product, isOpen, onClose, onEditProduct }) => {
  const { 
    orders = [], 
    suppliers = [], 
    addSupplierOrderItem, 
    storeConfig, 
    showToast 
  } = useStore();

  const currency = storeConfig?.currencySymbol || 'Bs.';
  const [timePeriod, setTimePeriod] = useState('month'); // 'today' | 'week' | 'month' | 'all'
  
  // Estado para la sección de reposición / Añadir al Proveedor
  const activeSuppliers = useMemo(() => {
    return filterOutDemoSuppliers(suppliers || []).filter(Boolean);
  }, [suppliers]);

  // Preseleccionar proveedor si el producto ya tiene un proveedor asignado, o si coincide con la categoría
  const resolveInitialSupplierId = () => {
    if (!product || activeSuppliers.length === 0) return '';
    const assignedId = product.supplierId || product.supplier_id;
    if (assignedId) {
      const match = activeSuppliers.find(s => s.id === assignedId);
      if (match) return match.id;
    }
    const catMatch = activeSuppliers.find(s => 
      s.category && product.category && 
      s.category.toLowerCase() === product.category.toLowerCase()
    );
    return catMatch ? catMatch.id : (activeSuppliers[0]?.id || '');
  };

  const [selectedSupplierId, setSelectedSupplierId] = useState(resolveInitialSupplierId);

  useEffect(() => {
    setSelectedSupplierId(resolveInitialSupplierId());
    setIsAddedSuccess(false);
  }, [product, activeSuppliers]);

  const [orderQuantity, setOrderQuantity] = useState('12');
  const [orderNote, setOrderNote] = useState('Reponer stock para tienda');
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  // Cálculos de Ventas del Producto en Tiempo Real según el período seleccionado
  const salesMetrics = useMemo(() => {
    if (!product) {
      return {
        today: { units: 0, revenue: 0, ordersCount: 0 },
        week: { units: 0, revenue: 0, ordersCount: 0 },
        month: { units: 0, revenue: 0, ordersCount: 0 },
        all: { units: 0, revenue: 0, ordersCount: 0 }
      };
    }

    const nowParts = getBoliviaDateParts(new Date());
    const validOrders = (orders || []).filter(o => o && o.status !== 'cancelled' && Array.isArray(o.items));

    const result = {
      today: { units: 0, revenue: 0, ordersCount: 0 },
      week: { units: 0, revenue: 0, ordersCount: 0 },
      month: { units: 0, revenue: 0, ordersCount: 0 },
      all: { units: 0, revenue: 0, ordersCount: 0 }
    };

    const prodNameNormalized = normalizeSearchText(product.name || '');

    validOrders.forEach(order => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : null;
      const orderParts = orderDate ? getBoliviaDateParts(orderDate) : null;
      if (!orderParts || !nowParts) return;

      // Buscar si el producto estuvo en los ítems de esta orden
      let productQtyInOrder = 0;
      let productRevenueInOrder = 0;

      order.items.forEach(item => {
        const isMatch = (item.id && item.id === product.id) || 
          (item.name && normalizeSearchText(item.name) === prodNameNormalized);

        if (isMatch) {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || Number(product.price) || 0;
          productQtyInOrder += qty;
          productRevenueInOrder += (qty * price);
        }
      });

      if (productQtyInOrder > 0) {
        // 1. Histórico Todo
        result.all.units += productQtyInOrder;
        result.all.revenue += productRevenueInOrder;
        result.all.ordersCount += 1;

        // 2. Hoy (Mismo día, mes y año)
        if (orderParts.year === nowParts.year && orderParts.month === nowParts.month && orderParts.day === nowParts.day) {
          result.today.units += productQtyInOrder;
          result.today.revenue += productRevenueInOrder;
          result.today.ordersCount += 1;
        }

        // 3. Esta Semana (últimos 7 días)
        if (isSameBoliviaWeek(orderDate, new Date())) {
          result.week.units += productQtyInOrder;
          result.week.revenue += productRevenueInOrder;
          result.week.ordersCount += 1;
        }

        // 4. Este Mes (Mismo mes y año)
        if (orderParts.year === nowParts.year && orderParts.month === nowParts.month) {
          result.month.units += productQtyInOrder;
          result.month.revenue += productRevenueInOrder;
          result.month.ordersCount += 1;
        }
      }
    });

    return result;
  }, [product, orders]);

  if (!isOpen || !product) return null;

  const currentStats = salesMetrics[timePeriod] || salesMetrics.month;

  const handleAddOrderToSupplier = (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast('Selecciona un proveedor de la lista.', 'warning');
      return;
    }

    const cleanQty = orderQuantity.trim() || '1 unidad';
    addSupplierOrderItem(selectedSupplierId, {
      productName: product.name,
      quantity: cleanQty.includes('unidad') || cleanQty.includes('fardo') || cleanQty.includes('docena') || cleanQty.includes('caja')
        ? cleanQty
        : `${cleanQty} unidades`,
      notes: orderNote.trim()
    });

    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 3000);
  };

  const isStockDefined = typeof product.stock === 'number' && !isNaN(product.stock);
  const isMinStockDefined = typeof product.minStock === 'number' && !isNaN(product.minStock);
  const isLowStock = isStockDefined && isMinStockDefined && product.stock <= product.minStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabecera de la Ficha */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-850 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 border border-white/10 shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src={product.image || '/products/producto-sin-imagen.png'} 
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/products/producto-sin-imagen.png';
                }}
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                Ficha del Producto • Estadísticas
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate leading-snug">
                {product.name}
              </h3>
              <p className="text-xs text-slate-300 font-medium truncate">
                {product.category || 'Sin categoría'} • {currency} {Number(product.price || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">

          {/* ========================================================================= */}
          {/* SECCIÓN 1: TOTAL DE VENTAS (DÍA / SEMANA / MES / HISTÓRICO)              */}
          {/* ========================================================================= */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900">Total de Ventas</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Rendimiento y salida en mostrador y delivery</p>
                </div>
              </div>
            </div>

            {/* Selector de Período (Tabs) */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setTimePeriod('today')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timePeriod === 'today'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('week')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timePeriod === 'week'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('month')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timePeriod === 'month'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Este Mes
              </button>
              <button
                type="button"
                onClick={() => setTimePeriod('all')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timePeriod === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todo
              </button>
            </div>

            {/* Tarjetas de Métricas del Período */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Métrica: Unidades Vendidas */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Unidades Vendidas
                </span>
                <p className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentStats.units}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  {currentStats.units === 1 ? 'unidad despachada' : 'unidades despachadas'}
                </span>
              </div>

              {/* Métrica: Recaudación Monetaria */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Total Recaudado
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-700">
                  {currency} {currentStats.revenue.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Ingreso generado
                </span>
              </div>

              {/* Métrica: Stock Actual & Alerta */}
              <div className="col-span-2 sm:col-span-1 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Stock en Tienda
                </span>
                <p className={`text-xl sm:text-2xl font-black ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                  {isStockDefined ? `${product.stock} u.` : 'Sin definir'}
                </p>
                <span className="text-[10px] font-bold block">
                  {isLowStock ? (
                    <span className="text-rose-600 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Bajo stock
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium">Disponible</span>
                  )}
                </span>
              </div>
            </div>

            {/* Subtexto resumen */}
            <p className="text-[11px] text-slate-500 text-center pt-1 font-medium">
              Presente en <strong>{currentStats.ordersCount}</strong> {currentStats.ordersCount === 1 ? 'pedido o venta' : 'pedidos o ventas'} en este período.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN 2: AÑADIR A LA LISTA DE COMPRAS DEL PROVEEDOR                    */}
          {/* ========================================================================= */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-900">Añadir al Proveedor (Repedido)</h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Agrega este producto a tu lista de compras para el día de visita
                </p>
              </div>
            </div>

            {activeSuppliers.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-bold">Aún no tienes proveedores registrados en tu tienda.</p>
                <p className="text-[11px] text-amber-700">
                  Ve a la sección «Proveedores» del menú para registrar a los distribuidores de tus marcas.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddOrderToSupplier} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Seleccionar Proveedor
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {activeSuppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category || 'General'}) {s.phone ? `• ${s.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Cantidad a pedir
                    </label>
                    <input
                      type="text"
                      required
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      placeholder="Ej. 12 unidades, 1 fardo..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-indigo-500"
                    />
                    {/* Botones rápidos de cantidad */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setOrderQuantity('6 unidades')}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        +6 u.
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderQuantity('12 unidades')}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        +12 (Docena)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderQuantity('24 unidades')}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        +24 (Fardo)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nota o detalle (Opcional)
                    </label>
                    <input
                      type="text"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Ej. Reponer urgente..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                    isAddedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                  }`}
                >
                  {isAddedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Agregado a la Lista de Pedido!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Añadir a Lista de Compras del Proveedor</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Footer con Acciones */}
        <div className="p-3.5 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          {onEditProduct ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditProduct(product);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Abrir formulario completo para cambiar precio, foto o stock"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar Producto Completo</span>
            </button>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
