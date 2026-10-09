import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  Sun, 
  Moon, 
  Power, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Check,
  Store,
  Bike
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { 
  normalizeStoreSchedule, 
  DEFAULT_WEEKLY_SCHEDULE, 
  calculateStoreOpenStatus, 
  formatScheduleSummary 
} from '../../utils/scheduleUtils';

export const StoreScheduleManager = () => {
  const { storeConfig, setStoreConfig, showToast, toggleStoreOpenStatus } = useStore();

  const [saving, setSaving] = useState(false);
  const initialSyncRef = useRef(false);
  const lastStoreIdRef = useRef(storeConfig?.id || storeConfig?.tenant_id || null);

  const [scheduleState, setScheduleState] = useState(() => {
    return normalizeStoreSchedule(storeConfig?.schedule);
  });

  const [operatingMode, setOperatingMode] = useState(() => {
    return storeConfig?.storeOpenMode || storeConfig?.schedule?.mode || 'auto';
  });

  const [closedMessage, setClosedMessage] = useState(() => {
    return storeConfig?.scheduleClosedMessage || storeConfig?.schedule?.customNote || '';
  });

  // Sincronizar únicamente cuando cargue la tienda por primera vez o cambie de tienda
  useEffect(() => {
    if (!storeConfig) return;
    const currentId = storeConfig.id || storeConfig.tenant_id;
    if (!initialSyncRef.current || (currentId && currentId !== lastStoreIdRef.current)) {
      initialSyncRef.current = true;
      lastStoreIdRef.current = currentId;

      setScheduleState(normalizeStoreSchedule(storeConfig.schedule));
      setOperatingMode(storeConfig.storeOpenMode || storeConfig.schedule?.mode || 'auto');
      setClosedMessage(storeConfig.scheduleClosedMessage || storeConfig.schedule?.customNote || '');
    }
  }, [storeConfig]);

  // Cálculo en vivo del estado con las ediciones actuales
  const liveFormConfig = useMemo(() => ({
    ...storeConfig,
    schedule: scheduleState,
    storeOpenMode: operatingMode,
    scheduleClosedMessage: closedMessage
  }), [storeConfig, scheduleState, operatingMode, closedMessage]);

  const liveStatus = useMemo(() => calculateStoreOpenStatus(liveFormConfig), [liveFormConfig]);

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Toggle de apertura de un día individual (bidireccional y robusto)
  const handleDayToggle = (dayKey) => {
    setScheduleState(prev => {
      const current = normalizeStoreSchedule(prev);
      const day = current[dayKey] || current.weekly.find(d => d.day === dayKey) || DEFAULT_WEEKLY_SCHEDULE.find(d => d.day === dayKey);
      const isCurrentlyOpen = day.open !== false && day.enabled !== false;
      const nextIsOpen = !isCurrentlyOpen;

      const updatedDay = {
        ...day,
        open: nextIsOpen,
        enabled: nextIsOpen
      };

      const updatedWeekly = current.weekly.map(d =>
        d.day === dayKey ? updatedDay : { ...d }
      );

      return {
        ...current,
        [dayKey]: updatedDay,
        weekly: updatedWeekly
      };
    });
  };

  // Cambio de hora apertura / cierre
  const handleTimeChange = (dayKey, field, value) => {
    setScheduleState(prev => {
      const current = normalizeStoreSchedule(prev);
      const day = current[dayKey] || current.weekly.find(d => d.day === dayKey) || DEFAULT_WEEKLY_SCHEDULE.find(d => d.day === dayKey);
      
      const updatedDay = {
        ...day,
        [field]: value
      };

      const updatedWeekly = current.weekly.map(d =>
        d.day === dayKey ? updatedDay : { ...d }
      );

      return {
        ...current,
        [dayKey]: updatedDay,
        weekly: updatedWeekly
      };
    });
  };


  // Cambio de modo de funcionamiento (Automático, Forzar Abierto, Forzar Cerrado)
  const handleSetOperatingMode = async (mode) => {
    setOperatingMode(mode);
    setScheduleState(prev => ({
      ...prev,
      mode
    }));

    // Sincronizar inmediatamente si toggleStoreOpenStatus está disponible
    if (toggleStoreOpenStatus) {
      await toggleStoreOpenStatus(mode);
    }
  };

  // Toggle rápido 1 clic de Abierto / Cerrado
  const handleQuickToggleNow = async () => {
    const nextMode = liveStatus.isOpen ? 'manual_closed' : 'manual_open';
    await handleSetOperatingMode(nextMode);
  };

  // Guardar configuración completa en Supabase y localmente
  const handleSaveSchedule = async (e) => {
    if (e) e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const normalized = normalizeStoreSchedule({
        ...scheduleState,
        mode: operatingMode,
        customNote: closedMessage
      });

      const updatedConfig = {
        ...storeConfig,
        schedule: normalized,
        storeOpenMode: operatingMode,
        scheduleClosedMessage: closedMessage,
        isOpen: operatingMode === 'manual_open' 
          ? true 
          : (operatingMode === 'manual_closed' ? false : liveStatus.isOpen)
      };

      const res = await setStoreConfig(updatedConfig);
      if (res?.error) {
        showToast('Horarios guardados en este dispositivo.', 'info');
      } else {
        showToast('¡Horarios de atención semanales guardados exitosamente!', 'success');
      }
    } catch (err) {
      console.error('Error guardando horario:', err);
      showToast('Error al guardar horario de atención.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn pb-24">
      {/* Bento Hero Card: Control en Vivo y Hora Oficial */}
      <div className={`bg-white rounded-3xl border shadow-xs p-5 sm:p-6 space-y-4 transition-all ${
        liveStatus.isOpen
          ? 'border-emerald-300 ring-2 ring-emerald-500/10'
          : 'border-rose-300 ring-2 ring-rose-500/10'
      }`}>
        {/* Fila Superior: Estado en Vivo a la izquierda + Reloj Oficial Bolivia a la derecha */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Badge Estado */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {liveStatus.isOpen ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              )}
            </span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Control en Vivo
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide border ${
              liveStatus.isOpen 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              {liveStatus.badgeText}
            </span>
          </div>

          {/* Reloj Oficial Bolivia (Elegante y Compacto) */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-2xl shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="font-black text-white text-sm">
                {liveStatus.currentBoliviaTime || '--:--'}
              </span>
              <span className="text-[10px] text-slate-300 font-sans font-bold capitalize">
                ({liveStatus.currentDayName})
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/15 text-emerald-300 font-bold ml-0.5">
                UTC-4
              </span>
            </div>
          </div>
        </div>

        {/* Fila Central: Título + Subtítulo y Botón de Apertura Rápida */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-0.5">
          <div className="space-y-1">
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              liveStatus.isOpen ? 'text-emerald-950' : 'text-rose-950'
            }`}>
              {liveStatus.isOpen ? 'Tienda Abierta' : 'Tienda Cerrada'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              {liveStatus.nextStatusChangeText || (liveStatus.isOpen ? 'Tu catálogo está activo y recibiendo pedidos de clientes.' : 'Tu tienda no recibe pedidos en este momento.')}
            </p>
          </div>

          {/* Botón de Alternancia Rápida */}
          <button
            type="button"
            onClick={handleQuickToggleNow}
            className={`h-11 px-5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
              liveStatus.isOpen
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 ring-2 ring-rose-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-500/20'
            }`}
            title="Alternar estado de apertura de inmediato"
          >
            <Power className="w-4 h-4 shrink-0" />
            <span>{liveStatus.isOpen ? 'Cerrar Tienda Ahora' : 'Abrir Tienda Ahora'}</span>
          </button>
        </div>

        {/* Fila Inferior: Modo Operativo + Resumen Semanal */}
        <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Modo operativo:</span>
            <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
              {operatingMode === 'auto' ? 'Automático por Horario' : operatingMode === 'manual_open' ? 'Siempre Abierto (Manual)' : 'Siempre Cerrado (Manual)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="font-mono text-emerald-900 font-bold bg-emerald-50/80 px-3 py-1 rounded-xl border border-emerald-200/80 text-[11px] sm:text-xs">
              📅 {liveStatus.summary}
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Modo de Apertura (3 modos) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <label className="text-xs font-extrabold text-slate-900 block">
          Elige cómo debe funcionar el local:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Opción 1: Automático por Horario */}
          <button
            type="button"
            onClick={() => handleSetOperatingMode('auto')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              operatingMode === 'auto'
                ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Automático (Programado)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Recomendado
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              La tienda abre y cierra sola de forma puntual según los días y rangos horarios que configures abajo.
            </p>
          </button>

          {/* Opción 2: Siempre Abierto (Manual) */}
          <button
            type="button"
            onClick={() => handleSetOperatingMode('manual_open')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              operatingMode === 'manual_open'
                ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Siempre ABIERTO (Manual)</span>
              </span>
              {operatingMode === 'manual_open' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                  Activo
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Fuerza a la tienda a figurar abierta de manera ininterrumpida hasta que decidas cerrarla tú mismo.
            </p>
          </button>

          {/* Opción 3: Siempre Cerrado (Manual) */}
          <button
            type="button"
            onClick={() => handleSetOperatingMode('manual_closed')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              operatingMode === 'manual_closed'
                ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-rose-500" />
                <span>Siempre CERRADO (Manual)</span>
              </span>
              {operatingMode === 'manual_closed' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white">
                  Activo
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cierra temporalmente la tienda (ideal para inventarios, vacaciones, emergencias o feriados).
            </p>
          </button>
        </div>
      </div>


      {/* Cuadrícula Interactiva de 7 Días (Lunes a Domingo) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Programación Día por Día (Lunes a Domingo)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Presiona en cada día para alternar entre ABRE o CERRADO y define tus horas de atención.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Hoy es: <strong className="text-emerald-700 capitalize">{liveStatus.currentDayName}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {daysOrder.map((dayKey) => {
            const dayConfig = (scheduleState && scheduleState[dayKey]) || DEFAULT_WEEKLY_SCHEDULE.find(d => d.day === dayKey);
            const isEnabled = dayConfig?.enabled !== false && dayConfig?.open !== false;
            const isToday = liveStatus.currentDayName?.toLowerCase() === dayConfig?.label?.toLowerCase();

            return (
              <div
                key={dayKey}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3.5 ${
                  isToday
                    ? 'ring-2 ring-emerald-500/50 bg-emerald-50/40 border-emerald-300 shadow-xs'
                    : isEnabled
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-90'
                }`}
              >
                {/* Header del Día */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">
                      {dayConfig?.label}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-600 text-white">
                        HOY
                      </span>
                    )}
                  </div>

                  {/* Toggle Switch Día Abierto / Cerrado */}
                  <button
                    type="button"
                    onClick={() => handleDayToggle(dayKey)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-2xs active:scale-95 ${
                      isEnabled
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                    }`}
                    title={isEnabled ? 'Marcar día como cerrado (descanso)' : 'Marcar día como abierto (atención)'}
                  >
                    {isEnabled ? '● ABRE' : '○ CERRADO'}
                  </button>
                </div>

                {/* Inputs de Horas si está abierto */}
                {isEnabled ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Abre a las:</label>
                      <input
                        type="time"
                        value={dayConfig?.openTime || '08:00'}
                        onChange={(e) => handleTimeChange(dayKey, 'openTime', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white focus:outline-hidden focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Cierra a las:</label>
                      <input
                        type="time"
                        value={dayConfig?.closeTime || '22:00'}
                        onChange={(e) => handleTimeChange(dayKey, 'closeTime', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white focus:outline-hidden focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                    {dayConfig?.closeTime < dayConfig?.openTime && (
                      <span className="text-[9px] text-amber-700 font-bold block leading-tight">
                        🌙 Turno noche (cruza medianoche)
                      </span>
                    )}
                  </div>
                ) : (
                  <div 
                    onClick={() => handleDayToggle(dayKey)}
                    className="py-5 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50/70 rounded-xl transition-all border border-dashed border-rose-200/90 group p-2"
                    title="Haz clic aquí para abrir este día"
                  >
                    <span className="text-xl mb-1 group-hover:scale-110 transition-transform">😴</span>
                    <span className="text-[11px] font-black text-rose-700">Día de Descanso</span>
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-emerald-700 group-hover:underline mt-0.5">
                      Toca para Abrir
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen para Clientes & Mensaje Opcional de Cierre */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Resumen de Horarios para Clientes */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200/70">
                📋
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                Resumen de Horarios para Clientes
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 pl-9">
              Aparece en la portada y tarjetas del catálogo del cliente
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-emerald-950 font-mono tracking-tight">
              {formatScheduleSummary(scheduleState)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Se actualiza automáticamente al modificar los días y horas arriba.</span>
          </div>
        </div>

        {/* Card 2: Aviso Personalizado para Tienda Cerrada */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200/70">
                💬
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                Aviso para Clientes cuando la Tienda esté Cerrada
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 pl-9">
              Mensaje visible para los clientes cuando la tienda se encuentre fuera de horario
            </p>
          </div>

          <div>
            <input
              type="text"
              placeholder="Ej. ¡Volvemos mañana a primera hora! Puedes dejarnos tu pedido programado."
              value={closedMessage}
              onChange={(e) => setClosedMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium bg-slate-50/60 hover:bg-white focus:bg-white focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="text-[11px] text-slate-400">
            {closedMessage ? (
              <span className="text-emerald-700 font-medium">✓ Aviso personalizado activo.</span>
            ) : (
              <span>Opcional. Si lo dejas en blanco, se mostrará el horario habitual.</span>
            )}
          </div>
        </div>
      </div>

      {/* Banner Informativo sobre Horarios de Delivery */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
              ¿Manejas turnos específicos para Envíos a Domicilio (Motodelivery)?
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
              Puedes fijar las horas de salida de tus repartidores en <strong>Configuración de la Tienda → Servicio de Envíos a Domicilio</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Save Button on Scroll */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 animate-fadeIn">
        <button
          type="button"
          onClick={handleSaveSchedule}
          disabled={saving}
          className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-80 text-white font-black text-xs sm:text-sm shadow-2xl shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border border-emerald-400/40 ring-4 ring-emerald-500/20"
          title="Guardar Cambios de Horario"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Guardar Horarios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
