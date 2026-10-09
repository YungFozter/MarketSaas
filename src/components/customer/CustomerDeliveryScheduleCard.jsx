import React from 'react';
import { Bike, Clock, Sparkles, CheckCircle2, AlertCircle, Info, Calendar } from 'lucide-react';
import { calculateDeliveryScheduleStatus, normalizeDeliverySchedule } from '../../utils/scheduleUtils';

export const CustomerDeliveryScheduleCard = ({ 
  storeConfig, 
  variant = 'card', // 'card' | 'banner' | 'checkout' | 'compact'
  className = '' 
}) => {
  const isDeliveryEnabled = storeConfig?.enableDelivery !== false;
  if (!isDeliveryEnabled) return null;

  const status = calculateDeliveryScheduleStatus(storeConfig?.deliverySchedule, storeConfig);
  const minDelivery = Number(storeConfig?.minDeliveryOrder ?? storeConfig?.minOrder ?? 0);
  const currency = storeConfig?.currencySymbol || 'Bs.';

  // Variante: 'checkout' (diseñada especialmente para el modal de Checkout cuando el cliente selecciona Delivery)
  if (variant === 'checkout') {
    return (
      <div className={`p-4 rounded-2xl border transition-all animate-fadeIn ${
        status.isCurrentlyDelivering 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
          : 'bg-amber-50/70 border-amber-200 text-amber-950'
      } ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-current/10">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              status.isCurrentlyDelivering ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm leading-tight">
                Horario de Envíos a Domicilio
              </h4>
              <p className="text-[11px] opacity-80 font-medium">
                {status.daysText}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase shrink-0 border ${
            status.isCurrentlyDelivering 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              status.isCurrentlyDelivering ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
            }`} />
            <span>{status.badgeText}</span>
          </span>
        </div>

        <div className="pt-2.5 space-y-2 text-xs">
          <div className="flex items-start sm:items-center gap-2 font-bold">
            <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0 text-current opacity-80" />
            <span>Horas de entrega: <span className="underline decoration-current/30">{status.timeText}</span></span>
          </div>

          {status.nextDeliveryHint && (
            <p className="text-[11px] font-semibold opacity-90 pl-5">
              📢 {status.nextDeliveryHint}
            </p>
          )}

          {status.note && (
            <p className="text-[11px] opacity-75 leading-relaxed pl-5 italic">
              ℹ️ {status.note}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Variante: 'compact' (para dentro del drawer de carrito o barras estrechas)
  if (variant === 'compact') {
    return (
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-[11px] ${
        status.isCurrentlyDelivering 
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      } ${className}`}>
        <div className="flex items-center gap-2 min-w-0">
          <Bike className="w-3.5 h-3.5 shrink-0 text-current" />
          <span className="truncate">
            <strong>Envíos ({status.daysText}):</strong> {status.timeText}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 border ${
          status.isCurrentlyDelivering 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : 'bg-amber-100 text-amber-800 border-amber-300'
        }`}>
          {status.badgeText}
        </span>
      </div>
    );
  }

  // Variante: 'card' (tarjeta o banner dentro de CustomerHome / Vista Vecino)
  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-xs mb-6 ${
      status.isCurrentlyDelivering 
        ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-white border-emerald-200/90' 
        : 'bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-white border-amber-200/90'
    } ${className}`}>
      {/* Acento superior sutil */}
      <div className={`h-1 w-full ${
        status.isCurrentlyDelivering
          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
          : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
      }`} />

      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Lado izquierdo: Ícono + Título + Horario */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs relative mt-0.5 sm:mt-0 ${
            status.isCurrentlyDelivering 
              ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
              : 'bg-amber-500 text-white shadow-amber-500/20'
          }`}>
            <Bike className="w-5 h-5 shrink-0" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status.isCurrentlyDelivering ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${
                status.isCurrentlyDelivering ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>Horario de Envíos a Domicilio</span>
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                status.isCurrentlyDelivering 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {status.badgeText}
              </span>

              {minDelivery > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                  Mínimo: {currency} {minDelivery.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 pt-0.5">
              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{status.daysText}:</span>
              </span>
              <span className="font-black text-emerald-800 bg-white/90 px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>{status.timeText}</span>
              </span>
            </div>

            {status.nextDeliveryHint && (
              <p className="text-[11px] text-slate-600 font-semibold pt-0.5">
                🛵 {status.nextDeliveryHint}
              </p>
            )}

            {status.note && (
              <p className="text-[11px] text-slate-500 italic">
                * {status.note}
              </p>
            )}
          </div>
        </div>

        {/* Lado derecho: Píldora de cobertura rápida */}
        <div className="flex items-center gap-2 shrink-0 md:self-center border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-200/60">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Cobertura</span>
            <span className="text-xs font-black text-slate-800">0 a 18 Km en Moto</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Motodelivery Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
