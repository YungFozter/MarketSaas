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
  MapPin
} from 'lucide-react';
import { 
  normalizeStoreSchedule, 
  calculateStoreOpenStatus, 
  getBoliviaTime, 
  formatScheduleSummary 
} from '../../utils/scheduleUtils';

export const CustomerStoreSchedule = ({ storeConfig, initialExpanded = false, id = "store-schedule-section" }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

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

  return (
    <section 
      id={id}
      aria-label="Horario de atención de la tienda"
      className="mb-6 w-full animate-fadeIn"
    >
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-xs ${
        openStatus.isOpen 
          ? 'bg-white border-emerald-200/90 shadow-emerald-500/5' 
          : 'bg-white border-amber-300/90 shadow-amber-500/10'
      }`}>
        {/* Barra superior de acento con gradiente sutil */}
        <div className={`h-1.5 w-full ${
          openStatus.isOpen 
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600' 
            : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
        }`} />

        {/* ========================================================================= */}
        {/* 1. VISTA PREVIA COMPACTA DEL DÍA ACTUAL (Siempre visible al entrar)       */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          {/* Bloque Izquierdo: Icono + Estado de Hoy + Horas */}
          <div className="flex items-start gap-3.5 min-w-0">
            {/* Ícono de reloj con pulso visual */}
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs relative mt-0.5 sm:mt-0 ${
              openStatus.isOpen 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                : 'bg-amber-50 text-amber-800 border border-amber-300/80'
            }`}>
              <Clock className="w-5 h-5 shrink-0" />
              {/* Luz de pulso en vivo */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  openStatus.isOpen ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white ${
                  openStatus.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </span>
            </div>

            {/* Textos descriptivos */}
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  Horario de Hoy ({openStatus.currentDayName})
                </span>

                {/* Badge de estado en tiempo real */}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide border shadow-2xs ${
                  openStatus.isOpen
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  {openStatus.badgeText}
                </span>

                {/* Chip con la hora de apertura/cierre de hoy */}
                {isTodayOpen && todayItem ? (
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    {todayItem.openTime} - {todayItem.closeTime}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    Descanso
                  </span>
                )}
              </div>

              {/* Subtítulo dinámico con hora estimada de cambio de estado */}
              <p className="text-xs text-slate-600 font-medium leading-relaxed truncate max-w-xl">
                {openStatus.statusText}
                {customMessage && !openStatus.isOpen && (
                  <span className="text-amber-900 font-bold block sm:inline sm:ml-1">
                    • {customMessage}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Bloque Derecho: Reloj Oficial Bolivia + Botón para Desplegar Horario Semanal */}
          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
            {/* Reloj Digital Bolivia */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-2xs font-mono text-xs font-bold" title="Hora oficial de Bolivia (UTC-4)">
              <span className="text-amber-400 font-black">🇧🇴 {openStatus.currentBoliviaTime}</span>
              <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">UTC-4</span>
            </div>

            {/* Botón Interactivo para Desplegar/Ocultar Horario Semanal */}
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                isExpanded
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/90'
              }`}
              title={isExpanded ? 'Ocultar cronograma semanal' : 'Ver todos los días y horas de la semana'}
              aria-expanded={isExpanded}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isExpanded ? 'Ocultar Horarios' : 'Horario Semanal'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DESGLOSE COMPLETO DE LA SEMANA (Lunes a Domingo - Elegante y Fluido)   */}
        {/* ========================================================================= */}
        {isExpanded && (
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

            {/* Cuadrícula de 7 Días de la Semana (Responsive: 1 col en móviles chicos, 2 en tablets, 7 en desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
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
                ¿Tienes alguna consulta sobre pedidos especiales o entregas en tu condominio?
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
    </section>
  );
};
