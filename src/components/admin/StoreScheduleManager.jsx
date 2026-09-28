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
  Store
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

  // Atajo: Copiar lunes a martes-viernes
  const handleCopyMondayToWeekdays = () => {
    setScheduleState(prev => {
      const current = normalizeStoreSchedule(prev);
      const mon = current.monday || current.weekly.find(d => d.day === 'monday') || DEFAULT_WEEKLY_SCHEDULE.find(d => d.day === 'monday');
      const monIsOpen = mon.open !== false && mon.enabled !== false;

      const newSched = { ...current };
      ['tuesday', 'wednesday', 'thursday', 'friday'].forEach(dKey => {
        newSched[dKey] = {
          ...newSched[dKey],
          open: monIsOpen,
          enabled: monIsOpen,
          openTime: mon.openTime,
          closeTime: mon.closeTime
        };
      });

      newSched.weekly = current.weekly.map(d => {
        if (['tuesday', 'wednesday', 'thursday', 'friday'].includes(d.day)) {
          return newSched[d.day];
        }
        return { ...d };
      });

      return newSched;
    });
    showToast('Horario del Lunes copiado a Martes, Miércoles, Jueves y Viernes.', 'info');
  };

  // Atajo: Horario estándar 08:00 - 22:00
  const handleSetStandardSchedule = () => {
    setScheduleState(prev => {
      const current = normalizeStoreSchedule(prev);
      const newSched = { ...current };
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day => {
        newSched[day] = { ...newSched[day], open: true, enabled: true, openTime: '08:00', closeTime: '22:00' };
      });
      newSched.sunday = { ...newSched.sunday, open: true, enabled: true, openTime: '09:00', closeTime: '20:00' };
      newSched.weekly = daysOrder.map(dKey => newSched[dKey]);
      return newSched;
    });
    showToast('Horario comercial estándar (08:00 - 22:00) aplicado.', 'info');
  };

  // Atajo: Conmutar Domingos
  const handleToggleSunday = () => {
    setScheduleState(prev => {
      const current = normalizeStoreSchedule(prev);
      const isSunOpen = current.sunday?.open !== false && current.sunday?.enabled !== false;
      const nextIsOpen = !isSunOpen;

      const updatedSun = {
        ...current.sunday,
        open: nextIsOpen,
        enabled: nextIsOpen
      };

      const updatedWeekly = current.weekly.map(d =>
        d.day === 'sunday' ? updatedSun : { ...d }
      );

      return {
        ...current,
        sunday: updatedSun,
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
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>Horario de Atención Semanal & Control del Local</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Establece los días y horas que abres tu tienda, y controla manualmente si está ABIERTA o CERRADA en tiempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSchedule}
          disabled={saving}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-80 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Horarios</span>
            </>
          )}
        </button>
      </div>

      {/* Bento Card: Estado Actual en Tiempo Real & Reloj Oficial de Bolivia */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sub-Card 1: Estado del Local & Botón 1 Clic */}
        <div className={`p-6 rounded-3xl border shadow-2xs flex flex-col justify-between gap-4 lg:col-span-2 ${
          liveStatus.isOpen
            ? 'bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border-emerald-300'
            : 'bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 border-rose-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Estado Actual del Local
              </span>
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  {liveStatus.isOpen ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                  )}
                </span>
                <h3 className={`text-2xl font-black tracking-tight ${
                  liveStatus.isOpen ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {liveStatus.isOpen ? 'TIENDA ABIERTA' : 'TIENDA CERRADA'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  liveStatus.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {liveStatus.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                {liveStatus.nextStatusChangeText || (liveStatus.isOpen ? 'Tu catálogo recibe pedidos de clientes normalmente.' : 'Tu tienda figura cerrada.')}
              </p>
            </div>

            {/* Botón Acción Rápida */}
            <button
              type="button"
              onClick={handleQuickToggleNow}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                liveStatus.isOpen
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 ring-4 ring-rose-500/10'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-4 ring-emerald-500/10'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{liveStatus.isOpen ? 'Cerrar Tienda Ahora' : 'Abrir Tienda Ahora'}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
            <span>
              Modo operativo actual: <strong className="text-slate-800 uppercase">{operatingMode === 'auto' ? 'Automático por Horario' : operatingMode}</strong>
            </span>
            <span className="font-mono text-emerald-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              📅 {liveStatus.summary}
            </span>
          </div>
        </div>

        {/* Sub-Card 2: Reloj Oficial de Bolivia UTC-4 */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Hora Oficial Bolivia</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-emerald-300 font-bold">
                UTC-04:00
              </span>
            </div>

            <div className="mt-4">
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {liveStatus.currentBoliviaTime || '--:--'}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Día en curso: <strong className="text-white capitalize">{liveStatus.currentDayName}</strong>
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            El sistema evalúa apertura y cierre de forma exacta según este huso horario oficial.
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

      {/* Barra de Atajos Rápidos */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-extrabold text-slate-800">Atajos rápidos de configuración:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMondayToWeekdays}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Copiar las horas del Lunes a Martes, Miércoles, Jueves y Viernes"
          >
            ⚡ Copiar Lunes a Lun-Vie
          </button>
          <button
            type="button"
            onClick={handleSetStandardSchedule}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Establecer 08:00 - 22:00 de Lunes a Sábado"
          >
            🕒 Horario Estándar (08:00 - 22:00)
          </button>
          <button
            type="button"
            onClick={handleToggleSunday}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            {scheduleState?.sunday?.open !== false && scheduleState?.sunday?.enabled !== false ? '🏖️ Cerrar Domingos' : '✅ Abrir Domingos'}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
          <span className="text-xs font-black text-slate-900 block">
            📋 Resumen que verán los clientes en la tienda:
          </span>
          <p className="text-xs font-bold text-emerald-800 font-mono bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/70">
            {formatScheduleSummary(scheduleState)}
          </p>
          <p className="text-[11px] text-slate-400">
            Este texto se genera automáticamente y aparece en la portada oficial y en las tarjetas del directorio.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
          <label className="text-xs font-black text-slate-900 block">
            Aviso Personalizado (Visible cuando la tienda esté cerrada):
          </label>
          <input
            type="text"
            placeholder="Ej. ¡Volvemos mañana a primera hora! Puedes dejarnos tu pedido programado."
            value={closedMessage}
            onChange={(e) => setClosedMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium bg-white focus:outline-hidden focus:border-emerald-500"
          />
          <p className="text-[11px] text-slate-400">
            Si dejas este campo vacío, se mostrará el horario estándar automáticamente.
          </p>
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
