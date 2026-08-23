import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  Users, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2,
  Sparkles,
  Store,
  Layers
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const AdminDashboard = ({ onNavigateTab }) => {
  const { orders, products, storeConfig, productRequests, exportSalesCSV } = useStore();
  const currency = storeConfig.currencySymbol || '$';

  // Cálculos de métricas
  const totalSales = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const totalDeliveryCollected = orders
    .filter(o => o.status !== 'cancelled' && o.deliveryType === 'delivery')
    .reduce((acc, o) => acc + o.deliveryFee, 0);

  // Ganancia estimada (Venta - Costo)
  const estimatedProfit = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => {
      const orderCost = o.items.reduce((itemAcc, item) => {
        const prod = products.find(p => p.id === item.id);
        const unitCost = prod?.costPrice || (item.price * 0.65);
        return itemAcc + unitCost * item.quantity;
      }, 0);
      return acc + (o.subtotal - orderCost) + o.deliveryFee;
    }, 0);

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way');
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const pendingRequests = productRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Sistema en Vivo</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Panel de Control: {storeConfig.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de ventas, pedidos activos en condominios y control de inventario.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportSalesCSV}
            className="px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
            title="Descargar reporte de ventas en archivo CSV"
          >
            <TrendingUp className="w-4 h-4 text-amber-700" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => onNavigateTab('pos')}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <Store className="w-4 h-4" />
            <span>Punto de Venta (POS)</span>
          </button>
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ver Pedidos ({activeOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Vendido */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas Totales</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            ${totalSales.toFixed(2)}
          </div>
          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {orders.length} transacciones registradas
          </p>
        </div>

        {/* Ganancia Neta Estimada */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margen Neto Estimado</span>
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 mb-1">
            ${estimatedProfit.toFixed(2)}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            (Ventas - Costos de Proveedor)
          </p>
        </div>

        {/* Ingreso por Delivery de Condominio */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recaudación Delivery</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 mb-1">
            ${totalDeliveryCollected.toFixed(2)}
          </div>
          <p className="text-xs text-amber-700 font-bold">
            Cobro por envíos a puerta
          </p>
        </div>

        {/* Pedidos Activos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pedidos en Curso</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            {activeOrders.length}
          </div>
          <p className="text-xs text-rose-600 font-bold">
            {activeOrders.filter(o => o.status === 'pending').length} nuevos por atender
          </p>
        </div>
      </div>

      {/* Alertas Rápidas y Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerta de Stock Crítico */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Alertas de Stock ({lowStockProducts.length})
                </h3>
              </div>
              <button 
                onClick={() => onNavigateTab('inventory')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Gestionar
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Todos tus productos tienen inventario suficiente.
              </p>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <p className="text-[10px] text-slate-500">Mínimo sugerido: {p.minStock} u.</p>
                    </div>
                    <span className="font-black text-rose-700 bg-white px-2 py-0.5 rounded-md border border-rose-300">
                      {p.stock} u.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('inventory')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Ver Todo el Inventario
          </button>
        </div>

        {/* Pedidos Recientes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <span>Últimos Pedidos de los Condominios</span>
            </h3>
            <button 
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Ver Tablero Kanban →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Pedido</th>
                  <th className="pb-3">Cliente / Ubicación</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((ord) => {
                  const statusColors = {
                    pending: 'bg-amber-100 text-amber-900 border-amber-300',
                    preparing: 'bg-blue-100 text-blue-900 border-blue-300',
                    on_the_way: 'bg-purple-100 text-purple-900 border-purple-300',
                    delivered: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    cancelled: 'bg-rose-100 text-rose-900 border-rose-300'
                  };

                  const statusLabels = {
                    pending: 'Nuevo',
                    preparing: 'Preparando',
                    on_the_way: 'En Camino',
                    delivered: 'Entregado',
                    cancelled: 'Cancelado'
                  };

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-900">{ord.id}</td>
                      <td className="py-3">
                        <p className="font-bold text-slate-800">{ord.customer.name}</p>
                        <p className="text-[11px] text-slate-400">{ord.customer.condominium} - {ord.customer.tower}</p>
                      </td>
                      <td className="py-3 font-medium text-slate-600">
                        {ord.deliveryType === 'delivery' ? '🛵 Delivery' : '🛍️ Retiro'}
                      </td>
                      <td className="py-3 font-black text-emerald-700">${ord.total.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-lg border font-extrabold text-[10px] ${statusColors[ord.status] || 'bg-slate-100 text-slate-700'}`}>
                          {statusLabels[ord.status] || ord.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
