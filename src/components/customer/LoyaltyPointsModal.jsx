import React from 'react';
import { X, Sparkles, Gift, Award, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const LoyaltyPointsModal = ({ isOpen, onClose }) => {
  const { veciPoints, redeemPoints, appliedCoupon } = useStore();

  if (!isOpen) return null;

  const couponTiers = [
    {
      code: 'VECI-1OFF',
      points: 150,
      discount: 1.00,
      title: 'Cupón $1.00 OFF',
      desc: 'Descuento directo en tu canasta del día'
    },
    {
      code: 'VECI-250OFF',
      points: 300,
      discount: 2.50,
      title: 'Cupón $2.50 OFF',
      desc: '¡Ahorro ideal para tus compras de la semana!'
    },
    {
      code: 'VECI-DELIVERY-FREE',
      points: 200,
      discount: 1.50,
      title: 'Cupón Delivery Gratis',
      desc: 'Cubre el costo de entrega a tu torre o casa'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Saldo de Puntos */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 text-xs font-black">
              <Award className="w-4 h-4" />
              <span>Programa VeciPuntos & Ahorro</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold text-amber-950/80">Tu saldo acumulado:</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">{veciPoints}</span>
              <span className="text-lg font-extrabold text-amber-950/80">Puntos</span>
            </div>
            <p className="text-xs font-medium text-amber-950/90 mt-1">
              Ganas 10 puntos por cada $1 gastado en compras a la tienda.
            </p>
          </div>
        </div>

        {/* Cupones Canjeables */}
        <div className="p-4 sm:p-8 space-y-4 overflow-y-auto flex-1">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span>Canjea tus puntos por descuentos inmediatos:</span>
          </h3>

          <div className="space-y-3">
            {couponTiers.map((tier) => {
              const canAfford = veciPoints >= tier.points;
              const isApplied = appliedCoupon?.code === tier.code;

              return (
                <div
                  key={tier.code}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isApplied
                      ? 'border-emerald-500 bg-emerald-50/70'
                      : canAfford
                        ? 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-md'
                        : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {tier.title}
                      </span>
                      <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                        {tier.points} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{tier.desc}</p>
                  </div>

                  <div>
                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-300">
                        <Check className="w-3.5 h-3.5" />
                        Aplicado
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const success = redeemPoints(tier.points, tier.discount, tier.code);
                          if (success) onClose();
                        }}
                        disabled={!canAfford}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs shadow-md transition-all whitespace-nowrap"
                      >
                        Canjear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Los cupones canjeados se aplican automáticamente a tu canasta activa.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
