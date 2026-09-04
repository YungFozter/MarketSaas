import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Store, 
  MapPin, 
  MessageCircle, 
  Sparkles, 
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './OrderTrackingModal.css';

export const OrderTrackingModal = ({ orderId, onClose }) => {
  const { orders, storeConfig } = useStore();

  const order = orders.find(o => o.id === orderId);

  if (!order) return null;

  const currency = storeConfig?.currencySymbol || 'Bs.';

  // Estados: pending -> preparing -> on_the_way -> delivered
  const stages = [
    { key: 'pending', title: 'Recibido', desc: 'Tu tienda ya recibió el pedido', icon: Store },
    { key: 'preparing', title: 'En Preparación', desc: 'Empacando tus productos frescos', icon: PackageCheck },
    { key: 'on_the_way', title: order.deliveryType === 'delivery' ? 'En Camino' : 'Listo para Retiro', desc: order.deliveryType === 'delivery' ? 'Repartidor rumbo a tu puerta' : 'Puedes pasar al local', icon: Truck },
    { key: 'delivered', title: 'Entregado', desc: '¡Disfruta tus productos!', icon: CheckCircle2 }
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'preparing': return 1;
      case 'on_the_way': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  // Generar link de WhatsApp directo para hablar con el dueño sobre este pedido
  const waMessage = encodeURIComponent(
    `¡Hola ${storeConfig?.name || 'Tienda'}! Consulta sobre pedido #${order.id} (Modo Demo) a nombre de ${order.customer?.name || 'Vecino'}.`
  );
  const cleanWa = storeConfig?.whatsapp ? storeConfig.whatsapp.replace(/[^0-9]/g, '') : '59172125280';
  const waUrl = `https://wa.me/${cleanWa}?text=${waMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Estado */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
              <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Pedido #{order.id}
              </span>
              <span className="text-[11px] text-emerald-100 font-medium">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Seguimiento en Vivo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Informativo de Demostración */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-500/20 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-emerald-950 font-medium shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Simulación de Seguimiento en Tiempo Real (Modo Demostración)
          </span>
          <span className="text-[10px] font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md uppercase">
            Sin cobro real
          </span>
        </div>

        <div className="p-4 sm:p-8 space-y-5 overflow-y-auto flex-1">
          {/* Alerta de Cancelado si aplica */}
          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-extrabold">Este pedido fue cancelado.</p>
                <p className="font-normal text-rose-600">Comunícate con la tienda si hubo algún inconveniente.</p>
              </div>
            </div>
          ) : (
            /* Barra de Progreso de 4 Pasos */
            <div className="space-y-4">
              <div className="relative flex justify-between items-center">
                {/* Línea de fondo */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
                {/* Línea activa */}
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-700"
                  style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
                ></div>

                {stages.map((st, idx) => {
                  const Icon = st.icon;
                  const isDone = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;

                  return (
                    <div key={st.key} className="relative z-10 flex flex-col items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                          isDone
                            ? isCurrent
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110'
                              : 'bg-emerald-500 text-white'
                            : 'bg-white text-slate-400 border-2 border-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[11px] mt-2 font-bold whitespace-nowrap ${isCurrent ? 'text-emerald-800' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                        {st.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mensaje descriptivo del estado actual */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <div>
                    <p className="font-extrabold text-xs sm:text-sm">{stages[currentIndex].desc}</p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Destino: {order.customer.condominium} - {order.customer.tower}, {order.customer.apartment}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-white px-2.5 py-1 rounded-xl shadow-2xs">
                  {order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro'}
                </span>
              </div>
            </div>
          )}

          {/* Resumen de Productos Pedidos */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Detalle del Pedido
            </h4>
            <div className="divide-y divide-slate-200/70 text-xs space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-slate-800">
                    <span className="font-extrabold text-emerald-700">{it.quantity}x</span> {it.name}
                  </span>
                  <span className="font-bold text-slate-900">{currency} {(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{currency} {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>{order.deliveryFee === 0 ? 'GRATIS' : `${currency} ${order.deliveryFee.toFixed(2)}`}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Descuento:</span>
                  <span>-{currency} {order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Total:</span>
                <span className="text-emerald-700">{currency} {order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Puntos Ganados */}
            {order.pointsEarned > 0 && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  VeciPuntos acumulados con esta compra:
                </span>
                <span>+{order.pointsEarned} pts</span>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar a la Tienda por WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="px-5 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
