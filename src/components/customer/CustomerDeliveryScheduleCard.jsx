import React, { useState } from 'react';
import { Bike, Clock, Sparkles, CheckCircle2, AlertCircle, Info, Calendar, ChevronDown } from 'lucide-react';
import { calculateDeliveryScheduleStatus, normalizeDeliverySchedule } from '../../utils/scheduleUtils';
import './CustomerDeliveryScheduleCard.css';

export const CustomerDeliveryScheduleCard = ({ 
  storeConfig, 
  variant = 'card', // 'card' | 'banner' | 'checkout' | 'compact'
  className = '',
  initialExpanded = false
}) => {
  const [isCardExpanded, setIsCardExpanded] = useState(initialExpanded);
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

  // Variante: 'card' (acordeón nativo compacto dentro de CustomerHome / Vista Vecino)
  return (
    <details
      open={isCardExpanded}
      onToggle={(e) => setIsCardExpanded(e.currentTarget.open)}
      className={`customer-delivery-details relative overflow-hidden rounded-2xl border transition-colors duration-200 shadow-2xs w-full min-w-0 ${
        status.isCurrentlyDelivering 
          ? 'bg-gradient-to-r from-emerald-50/85 via-teal-50/50 to-white border-emerald-200/90' 
          : 'bg-gradient-to-r from-amber-50/85 via-orange-50/50 to-white border-amber-200/90'
      } ${className}`}
    >
      {/* Acento superior sutil */}
      <div className={`h-1 w-full ${
        status.isCurrentlyDelivering
          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
          : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
      }`} />

      {/* Encabezado compacto (<summary> nativo accesible, sin headings internos) */}
      <summary className="px-3 py-2.5 sm:px-3.5 flex items-center justify-between gap-2.5 select-none hover:bg-white/50 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative ${
            status.isCurrentlyDelivering 
              ? 'bg-emerald-600 text-white' 
              : 'bg-amber-500 text-white'
          }`}>
            <Bike className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
              status.isCurrentlyDelivering ? 'bg-emerald-400' : 'bg-amber-300'
            }`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs sm:text-[13px] font-black text-slate-900 truncate">
                Envíos a Domicilio
              </span>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                status.isCurrentlyDelivering 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {status.badgeText}
              </span>

              {minDelivery > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hidden sm:inline">
                  Mín. {currency} {minDelivery.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
            {isCardExpanded ? 'Ocultar' : 'Turnos'}
          </span>
          <span 
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
              isCardExpanded 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-600 border-slate-200/90'
            }`}
            aria-hidden="true"
          >
            <ChevronDown className="delivery-chevron w-3.5 h-3.5" />
          </span>
        </div>
      </summary>

      {/* Contenido expandible (::details-content nativo) */}
      <div className="px-3.5 pb-4 sm:px-4 pt-2 border-t border-slate-200/60 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-700">
              <span className="font-extrabold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>{status.daysText}:</span>
              </span>
              <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200/80 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                <span>{status.timeText}</span>
              </span>
            </div>

            {status.nextDeliveryHint && (
              <p className="text-[11px] text-slate-600 font-semibold">
                🛵 {status.nextDeliveryHint}
              </p>
            )}

            {status.note && (
              <p className="text-[11px] text-slate-500 italic">
                * {status.note}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
            <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>0 a 18 Km en Moto</span>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
};
