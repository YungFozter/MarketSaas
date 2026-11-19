import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  MessageCircle, 
  Info, 
  Store,
  MapPin,
  Bike
} from 'lucide-react';
import { 
  normalizeStoreSchedule, 
  calculateStoreOpenStatus, 
  getBoliviaTime, 
  formatScheduleSummary,
  calculateDeliveryScheduleStatus
} from '../../utils/scheduleUtils';
import './CustomerStoreSchedule.css';

export const CustomerStoreSchedule = ({ storeConfig, initialExpanded = false, id = "store-schedule-section" }) => {
  const [isCardExpanded, setIsCardExpanded] = useState(initialExpanded);
  const [isWeeklyExpanded, setIsWeeklyExpanded] = useState(true);

  // Normalizar el horario semanal y calcular el estado en vivo
  const schedule = useMemo(() => {
    return normalizeStoreSchedule(storeConfig?.schedule);
  }, [storeConfig?.schedule]);

  const openStatus = useMemo(() => {
    return calculateStoreOpenStatus(storeConfig);
  }, [storeConfig]);

  const boliviaTime = useMemo(() => {
    return getBoliviaTime();
  }, []);

  const summary = useMemo(() => {
    return formatScheduleSummary(schedule);
  }, [schedule]);

  // Encontrar el horario de hoy
  const todayItem = useMemo(() => {
    return schedule.weekly.find(d => d.day === boliviaTime.dayKey) || schedule[boliviaTime.dayKey];
  }, [schedule, boliviaTime.dayKey]);

  const isTodayOpen = todayItem ? (todayItem.open !== false && todayItem.enabled !== false) : true;
  const storeName = storeConfig?.name || 'Tienda';
  const customMessage = storeConfig?.scheduleClosedMessage || schedule.customNote || '';

  const deliveryStatus = useMemo(() => {
    return calculateDeliveryScheduleStatus(storeConfig?.deliverySchedule, storeConfig);
  }, [storeConfig]);

  return (
    <section 
      id={id}
      aria-label="Horario de atención de la tienda"
      className="w-full min-w-0"
    >
      <details
        open={isCardExpanded}
        onToggle={(e) => setIsCardExpanded(e.currentTarget.open)}
        className={`customer-schedule-details relative overflow-hidden rounded-2xl border transition-colors duration-200 shadow-2xs ${
          openStatus.isOpen 
            ? 'bg-white border-emerald-200/90' 
            : 'bg-white border-amber-300/90'
        }`}
      >
        {/* Barra superior de acento */}
        <div className={`h-1 w-full ${
          openStatus.isOpen 
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600' 
            : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
        }`} />

        {/* ========================================================================= */}
        {/* 1. RESUMEN COMPACTO (<summary> nativo accesible, sin headings internos)   */}
        {/* ========================================================================= */}
        <summary className="px-3 py-2.5 sm:px-3.5 flex items-center justify-between gap-2.5 select-none hover:bg-slate-50/80 transition-colors">
          {/* Bloque Izquierdo: Icono + Título + Badge + Horas */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative ${
              openStatus.isOpen 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                : 'bg-amber-50 text-amber-800 border border-amber-300/80'
            }`}>
              <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                openStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs sm:text-[13px] font-black text-slate-900 truncate">
                  Hoy ({openStatus.currentDayName})
                </span>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                  openStatus.isOpen
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {openStatus.badgeText}
                </span>

                {isTodayOpen && todayItem ? (
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                    {todayItem.openTime} - {todayItem.closeTime}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                    Descanso
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bloque Derecho: Etiqueta compacta + Chevron */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
              {isCardExpanded ? 'Ocultar' : 'Horario semanal'}
            </span>
            <span 
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                isCardExpanded 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-slate-100 text-slate-600 border-slate-200/90'
              }`}
              aria-hidden="true"
            >
              <ChevronDown className="schedule-chevron w-3.5 h-3.5" />
            </span>
          </div>
        </summary>

        {/* ========================================================================= */}
        {/* 2. CONTENIDO EXPANDIBLE (::details-content nativo)                        */}
        {/* ========================================================================= */}
        <div className="px-3.5 pb-4 sm:px-4 pt-2 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {openStatus.statusText}
              {customMessage && !openStatus.isOpen && (
                <span className="text-amber-900 font-bold block sm:inline sm:ml-1">
                  • {customMessage}
                </span>
              )}
            </p>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-[11px] font-bold" title="Hora oficial de Bolivia (UTC-4)">
                <span className="text-amber-400 font-black">🇧🇴 {openStatus.currentBoliviaTime}</span>
                <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">UTC-4</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWeeklyExpanded(prev => !prev);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer flex items-center gap-1 border ${
                  isWeeklyExpanded
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200/90'
                }`}
                aria-expanded={isWeeklyExpanded}
              >
                <Calendar className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                <span>{isWeeklyExpanded ? 'Ocultar semana' : 'Ver semana'}</span>
              </button>
            </div>
          </div>

        {/* ========================================================================= */}
        {/* 2. DESGLOSE COMPLETO DE LA SEMANA (Lunes a Domingo - Elegante y Fluido)   */}
        {/* ========================================================================= */}
        {isWeeklyExpanded && (
          <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-1 border-t border-slate-100/90 animate-fadeIn space-y-4">
            {/* Header del Desglose */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-extrabold text-slate-900">
                  Horarios de Atención de {storeName}:
                </span>
                <span className="text-slate-500 font-medium hidden md:inline">
                  (Sincronizado con la hora de Bolivia)
                </span>
              </div>

              <div className="text-slate-600 font-semibold bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/70 text-[11px] sm:text-xs">
                📅 Resumen: <strong className="text-slate-800 font-mono font-bold">{summary}</strong>
              </div>
            </div>

            {/* Cuadrícula de 7 Días de la Semana adaptativa al ancho disponible */}
            <div className="customer-weekly-schedule-grid">
              {schedule.weekly.map((dayItem) => {
                const isToday = dayItem.day === boliviaTime.dayKey;
                const isOpen = dayItem.open !== false && dayItem.enabled !== false;

                return (
                  <div
                    key={dayItem.day}
                    className={`rounded-2xl p-3 border transition-all relative flex flex-col justify-between space-y-2 ${
                      isToday
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                        : isOpen
                          ? 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
                          : 'bg-slate-100/60 border-slate-200/60 opacity-70'
                    }`}
                  >
                    {/* Encabezado del Día */}
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-black capitalize ${
                        isToday ? 'text-emerald-950 font-extrabold' : 'text-slate-800'
                      }`}>
                        {dayItem.label}
                      </span>

                      {/* Badge "HOY" */}
                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider shadow-2xs">
                          Hoy
                        </span>
                      )}
                    </div>

                    {/* Estado e Horas */}
                    <div>
                      {isOpen ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Abierto</span>
                          </div>
                          <div className="font-mono text-xs font-black text-slate-900 tracking-tight">
                            {dayItem.openTime} - {dayItem.closeTime}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700">
                            <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>Cerrado</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Descanso
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Línea indicadora de hoy */}
                    {isToday && (
                      <div className="text-[10px] font-bold text-emerald-700 pt-1 border-t border-emerald-200/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{openStatus.isOpen ? 'Atendiendo ahora' : 'Cerrado ahora'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Sección de Horarios de Delivery & Envíos si está activo */}
            {storeConfig?.enableDelivery !== false && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block leading-tight">
                      Horarios de Envíos a Domicilio (Motodelivery):
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {deliveryStatus.daysText} • {deliveryStatus.timeText}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0 border self-start sm:self-center ${
                  deliveryStatus.isCurrentlyDelivering 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {deliveryStatus.badgeText}
                </span>
              </div>
            )}

            {/* Nota o Mensaje Especial de la Tienda si existe */}
            {customMessage && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-amber-900 block">
                    Nota del Comerciante:
                  </span>
                  <p className="text-amber-800 font-medium leading-relaxed">
                    {customMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Footer con opción de consulta directa */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <span className="font-medium">
                ¿Tienes alguna consulta sobre pedidos especiales o envíos a domicilio?
              </span>

              {(storeConfig?.whatsapp || storeConfig?.phone) && (
                <a
                  href={`https://wa.me/${(storeConfig.whatsapp || storeConfig.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola ${storeName}! Quería consultar sobre los horarios de atención y entregas.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Preguntar por WhatsApp</span>
                </a>
              )}
            </div>
              </div>
            )}
          </div>
        </details>
      </section>
    );
  };
