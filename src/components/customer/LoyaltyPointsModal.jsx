import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Gift, 
  Award, 
  Check, 
  ShieldCheck, 
  Info, 
  Truck, 
  Store, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './LoyaltyPointsModal.css';

export const LoyaltyPointsModal = ({ isOpen, onClose }) => {
  const { veciPoints, redeemPoints, appliedCoupon, storeConfig } = useStore();
  const [showFaq, setShowFaq] = useState(false);
  const currency = storeConfig?.currencySymbol || 'Bs.';
  const isDeliveryActive = storeConfig?.enableDelivery === true;

  if (!isOpen) return null;

  const couponTiers = [
    {
      code: 'VECI-1OFF',
      points: 150,
      discount: 1.00,
      title: `Cupón ${currency} 1.00 OFF`,
      desc: 'Descuento directo en tu canasta del día (Aplica en retiro y delivery)',
      type: 'discount',
      isAvailable: true
    },
    {
      code: 'VECI-250OFF',
      points: 300,
      discount: 2.50,
      title: `Cupón ${currency} 2.50 OFF`,
      desc: '¡Ahorro ideal para tus compras de la semana!',
      type: 'discount',
      isAvailable: true
    },
    {
      code: 'VECI-DELIVERY-FREE',
      points: 200,
      discount: 1.50,
      title: 'Cupón Delivery Gratis',
      desc: isDeliveryActive 
        ? 'Cubre el costo de entrega a tu torre o casa' 
        : 'Solo aplicable en comercios que tengan servicio de delivery activo',
      type: 'delivery',
      isAvailable: isDeliveryActive
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Saldo de Puntos y Modo Demostración */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 text-xs font-black text-amber-950">
                <Award className="w-4 h-4" />
                <span>Programa VeciPuntos</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wide bg-amber-900/20 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-950/20">
                Modo Demostración
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-amber-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10 space-y-1">
            <p className="text-xs font-bold text-amber-950/80">
              Saldo de muestra para experimentar:
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950">{veciPoints}</span>
              <span className="text-lg font-extrabold text-amber-950/80">Puntos</span>
            </div>
            <p className="text-xs font-medium text-amber-950/90 pt-0.5">
              En comercios afiliados, ganas <strong>10 puntos por cada 1 {currency}</strong> en tus compras acumuladas por tu número de WhatsApp.
            </p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Tarjeta de Aclaración de Condiciones y Autonomía de Tienda */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Condiciones y Autonomía de Cada Tienda:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-amber-900/90 pl-1 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Cada comercio es independiente:</strong> La tienda decide si activa el programa de VeciPuntos y si ofrece servicio de entrega a domicilio o solo retiro en local.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Cupón de Envío:</strong> El cupón de <em>"Delivery Gratis"</em> requiere que la tienda tenga activo el servicio de reparto. {isDeliveryActive ? 'Esta tienda tiene envíos activos.' : 'Actualmente esta tienda opera únicamente para Retiro en Tienda.'}</span>
              </li>
            </ul>
          </div>

          {/* Lista de Cupones Canjeables */}
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>Prueba canjeando tus puntos por cupones de descuento:</span>
            </h3>

            <div className="space-y-2.5">
              {couponTiers.map((tier) => {
                const canAfford = veciPoints >= tier.points;
                const isApplied = appliedCoupon?.code === tier.code;

                return (
                  <div
                    key={tier.code}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isApplied
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                        : canAfford && tier.isAvailable
                          ? 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-md'
                          : 'border-slate-200 bg-slate-50/70 opacity-70'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {tier.title}
                        </span>
                        <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                          {tier.points} pts
                        </span>
                        {!tier.isAvailable && (
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                            Solo tiendas con delivery
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
                        {tier.desc}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                          <Check className="w-3.5 h-3.5" />
                          Aplicado
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (!tier.isAvailable) return;
                            const success = redeemPoints(tier.points, tier.discount, tier.code);
                            if (success) onClose();
                          }}
                          disabled={!canAfford || !tier.isAvailable}
                          className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs shadow-md transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                        >
                          Canjear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acordeón de Preguntas Frecuentes / Cómo funciona en el mundo real */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setShowFaq(!showFaq)}
              className="w-full p-3 text-left flex items-center justify-between text-xs font-extrabold text-slate-700 hover:bg-slate-100/70 transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>¿Cómo funciona VeciPuntos en la vida real? (Preguntas frecuentes)</span>
              </span>
              {showFaq ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showFaq && (
              <div className="p-3.5 border-t border-slate-200 space-y-2.5 text-[11px] text-slate-600 bg-white leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-slate-800">1. ¿Por qué veo 340 puntos al entrar?</h4>
                  <p>Es un saldo de demostración incluido en esta vista modelo para que puedas probar cómo se descuentan los cupones en la canasta antes de comprar.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">2. ¿Cómo acumularé puntos como vecino real?</h4>
                  <p>Al hacer pedidos en un minimarket afiliado, tu número de WhatsApp queda registrado. Cada compra completada suma puntos a tu cuenta vecinal.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">3. ¿Todas las tiendas ofrecen los mismos puntos?</h4>
                  <p>No. Cada comerciante configura desde su panel de control si desea activar el programa de fidelización y la equivalencia de puntos (por ejemplo, 10 puntos por cada 1 Bs. de compra).</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">4. ¿Qué pasa si una tienda no tiene delivery?</h4>
                  <p>Si la tienda opera únicamente para retiro en local, los cupones de descuento directo en dinero siguen funcionando con normalidad para descontar en caja.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Al canjear un cupón, el descuento se refleja inmediatamente en tu canasta activa.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
