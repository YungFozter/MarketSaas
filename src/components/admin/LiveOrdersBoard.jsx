import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Store, 
  MessageCircle, 
  MapPin, 
  Banknote, 
  QrCode, 
  CreditCard, 
  AlertCircle, 
  Search,
  Filter,
  ArrowRight,
  Phone
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const LiveOrdersBoard = () => {
  const { orders, updateOrderStatus, cancelOrder, storeConfig } = useStore();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'delivery' | 'pickup'
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileColumn, setMobileColumn] = useState('pending'); // 'pending' | 'preparing' | 'on_the_way' | 'delivered'

  const filteredOrders = orders.filter((o) => {
    const matchesType = filterType === 'all' || o.deliveryType === filterType;
    const matchesSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer.condominium.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer.tower.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending');
  const preparingOrders = filteredOrders.filter(o => o.status === 'preparing');
  const onTheWayOrders = filteredOrders.filter(o => o.status === 'on_the_way');
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');

  // Enviar mensaje de WhatsApp al cliente informando el estado
  const handleNotifyWhatsApp = (order) => {
    let text = '';
    if (order.status === 'preparing') {
      text = `¡Hola ${order.customer.name}! Te avisamos que tu pedido #${order.id} ya está en preparación en ${storeConfig.name}. Total: $${order.total.toFixed(2)}. Pronto saldrá en reparto hacia ${order.customer.condominium} - ${order.customer.tower}.`;
    } else if (order.status === 'on_the_way') {
      text = `¡Hola ${order.customer.name}! 🛵 Tu pedido #${order.id} YA VA EN CAMINO a tu puerta en ${order.customer.condominium} - ${order.customer.tower}, ${order.customer.apartment}. ¡Por favor atento al citófono/timbre!`;
    } else if (order.status === 'delivered') {
      text = `¡Hola ${order.customer.name}! Tu pedido #${order.id} figura como ENTREGADO. ¡Muchas gracias por preferir tu negocio de barrio ${storeConfig.name}! Acumulaste ${order.pointsEarned} VeciPuntos.`;
    } else {
      text = `¡Hola ${order.customer.name}! Hemos recibido tu pedido #${order.id} por un total de $${order.total.toFixed(2)}. Ya lo estamos gestionando.`;
    }

    const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header y Filtros */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Tablero de Pedidos en Vivo (Live Dispatch)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestiona los pedidos entrantes y despachos hacia los condominios en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, cliente..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-hidden focus:border-emerald-500 sm:w-56"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('delivery')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                filterType === 'delivery' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛵 Delivery
            </button>
            <button
              onClick={() => setFilterType('pickup')}
              className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                filterType === 'pickup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛍️ Retiro
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Estado para Móviles */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
        <button
          onClick={() => setMobileColumn('pending')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 border ${
            mobileColumn === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          Nuevos ({pendingOrders.length})
        </button>
        <button
          onClick={() => setMobileColumn('preparing')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 border ${
            mobileColumn === 'preparing'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          En Preparación ({preparingOrders.length})
        </button>
        <button
          onClick={() => setMobileColumn('on_the_way')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 border ${
            mobileColumn === 'on_the_way'
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          En Camino ({onTheWayOrders.length})
        </button>
        <button
          onClick={() => setMobileColumn('delivered')}
          className={`px-3 py-2 rounded-xl font-bold text-xs shrink-0 border ${
            mobileColumn === 'delivered'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          Entregados ({deliveredOrders.length})
        </button>
      </div>

      {/* Columnas Kanban (Multicolumna en Desktop / Pestaña en Móvil) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
        
        {/* COLUMNA 1: NUEVOS / PENDIENTES */}
        <div className={`bg-slate-100/80 p-4 rounded-3xl border border-slate-200/80 flex flex-col min-h-96 ${mobileColumn === 'pending' ? 'block' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h3 className="font-extrabold text-sm text-slate-900">Nuevos / Pendientes</h3>
            </div>
            <span className="bg-amber-200/80 text-amber-950 font-black text-xs px-2 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {pendingOrders.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium">
                Sin pedidos pendientes
              </div>
            ) : (
              pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onCancel={cancelOrder}
                  onNotifyWA={handleNotifyWhatsApp}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 2: EN PREPARACIÓN */}
        <div className={`bg-slate-100/80 p-4 rounded-3xl border border-slate-200/80 flex flex-col min-h-96 ${mobileColumn === 'preparing' ? 'block' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <h3 className="font-extrabold text-sm text-slate-900">En Preparación</h3>
            </div>
            <span className="bg-blue-200/80 text-blue-950 font-black text-xs px-2 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {preparingOrders.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium">
                No hay pedidos preparándose
              </div>
            ) : (
              preparingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onCancel={cancelOrder}
                  onNotifyWA={handleNotifyWhatsApp}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 3: EN CAMINO / LISTO */}
        <div className={`bg-slate-100/80 p-4 rounded-3xl border border-slate-200/80 flex flex-col min-h-96 ${mobileColumn === 'on_the_way' ? 'block' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <h3 className="font-extrabold text-sm text-slate-900">En Camino / Listo</h3>
            </div>
            <span className="bg-purple-200/80 text-purple-950 font-black text-xs px-2 py-0.5 rounded-full">
              {onTheWayOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {onTheWayOrders.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium">
                Sin pedidos en despacho
              </div>
            ) : (
              onTheWayOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onCancel={cancelOrder}
                  onNotifyWA={handleNotifyWhatsApp}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMNA 4: ENTREGADOS */}
        <div className={`bg-slate-100/80 p-4 rounded-3xl border border-slate-200/80 flex flex-col min-h-96 ${mobileColumn === 'delivered' ? 'block' : 'hidden md:flex'}`}>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h3 className="font-extrabold text-sm text-slate-900">Entregados con Éxito</h3>
            </div>
            <span className="bg-emerald-200/80 text-emerald-950 font-black text-xs px-2 py-0.5 rounded-full">
              {deliveredOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
            {deliveredOrders.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium">
                Sin entregas registradas hoy
              </div>
            ) : (
              deliveredOrders.slice(0, 10).map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onCancel={cancelOrder}
                  onNotifyWA={handleNotifyWhatsApp}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Tarjeta individual de Pedido para el Kanban
const OrderCard = ({ order, onStatusChange, onCancel, onNotifyWA }) => {
  const isDelivery = order.deliveryType === 'delivery';

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3">
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-center justify-between">
        <span className="font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
          #{order.id}
        </span>
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Datos del Cliente y Ubicación */}
      <div>
        <h4 className="font-extrabold text-sm text-slate-900">{order.customer.name}</h4>
        <p className="text-xs text-emerald-800 font-bold flex items-center gap-1 mt-0.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{order.customer.condominium} - {order.customer.tower}, {order.customer.apartment}</span>
        </p>
        {order.customer.notes && (
          <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-md mt-1.5 font-medium">
            Nota: {order.customer.notes}
          </p>
        )}
      </div>

      {/* Lista de Ítems */}
      <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-slate-700">
            <span className="font-medium">
              <span className="font-extrabold text-emerald-700">{item.quantity}x</span> {item.name}
            </span>
            <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Totales y Método de Pago */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">
            {order.paymentMethod === 'cash' ? '💵 Efectivo' : order.paymentMethod === 'qr' ? '📱 Transferencia / QR' : '💳 Tarjeta POS'}
            {order.cashChangeFor && ` (Paga con $${order.cashChangeFor})`}
          </span>
          <span className="text-sm font-black text-slate-900">${order.total.toFixed(2)}</span>
        </div>

        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isDelivery ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-700'}`}>
          {isDelivery ? 'Delivery' : 'Retiro'}
        </span>
      </div>

      {/* Acciones Rápidas de Cambio de Estado y WhatsApp */}
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
        {order.status === 'pending' && (
          <button
            onClick={() => onStatusChange(order.id, 'preparing')}
            className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
          >
            <span>Empezar a Preparar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {order.status === 'preparing' && (
          <button
            onClick={() => onStatusChange(order.id, 'on_the_way')}
            className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
          >
            <span>{isDelivery ? 'Despachar (En Camino)' : 'Listo para Retiro'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {order.status === 'on_the_way' && (
          <button
            onClick={() => onStatusChange(order.id, 'delivered')}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Marcar como Entregado</span>
          </button>
        )}

        {/* Botón de Notificar por WhatsApp */}
        <div className="flex items-center gap-2">
          {order.customer.phone && (
            <button
              onClick={() => onNotifyWA(order)}
              className="flex-1 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors flex items-center justify-center gap-1"
              title="Avisar al cliente por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Avisar al Cliente</span>
            </button>
          )}

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button
              onClick={() => onCancel(order.id)}
              className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
