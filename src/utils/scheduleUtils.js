// =============================================================================
// scheduleUtils.js - Gestión Integral de Horarios de Atención y Estado del Local
// =============================================================================

export const DEFAULT_WEEKLY_SCHEDULE = [
  { day: 'monday', label: 'Lunes', open: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'tuesday', label: 'Martes', open: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'wednesday', label: 'Miércoles', open: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'thursday', label: 'Jueves', open: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'friday', label: 'Viernes', open: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'saturday', label: 'Sábado', open: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'sunday', label: 'Domingo', open: true, openTime: '09:00', closeTime: '20:00' }
];

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Normaliza cualquier formato previo de schedule (string, objeto parcial, undefined)
 * a una estructura completa y robusta.
 */
export const normalizeStoreSchedule = (rawSchedule) => {
  if (!rawSchedule) {
    return {
      mode: 'auto', // 'auto' | 'manual_open' | 'manual_closed'
      weekly: DEFAULT_WEEKLY_SCHEDULE.map(d => ({ ...d })),
      customNote: ''
    };
  }

  // Si era un string antiguo (ej: "Horarios de Atención según cada Tienda")
  if (typeof rawSchedule === 'string') {
    return {
      mode: 'auto',
      weekly: DEFAULT_WEEKLY_SCHEDULE.map(d => ({ ...d })),
      customNote: rawSchedule === 'Horarios de Atención según cada Tienda' ? '' : rawSchedule
    };
  }

  const mode = ['auto', 'manual_open', 'manual_closed'].includes(rawSchedule.mode)
    ? rawSchedule.mode
    : 'auto';

  let weekly = [];
  if (Array.isArray(rawSchedule.weekly) && rawSchedule.weekly.length > 0) {
    weekly = DAY_ORDER.map(dayKey => {
      const existing = rawSchedule.weekly.find(w => w.day === dayKey);
      const defaultDay = DEFAULT_WEEKLY_SCHEDULE.find(d => d.day === dayKey);
      if (existing) {
        return {
          day: dayKey,
          label: existing.label || defaultDay.label,
          open: existing.open !== false,
          openTime: existing.openTime || defaultDay.openTime,
          closeTime: existing.closeTime || defaultDay.closeTime
        };
      }
      return { ...defaultDay };
    });
  } else {
    weekly = DEFAULT_WEEKLY_SCHEDULE.map(d => ({ ...d }));
  }

  return {
    mode,
    weekly,
    customNote: typeof rawSchedule.customNote === 'string' ? rawSchedule.customNote : ''
  };
};

/**
 * Obtiene el día actual de la semana y hora HH:mm en la zona horaria oficial de Bolivia (America/La_Paz, UTC-04:00)
 */
export const getBoliviaTime = () => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/La_Paz',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const weekdayStr = (parts.find(p => p.type === 'weekday')?.value || '').toLowerCase();
    const hour = parts.find(p => p.type === 'hour')?.value || '00';
    const minute = parts.find(p => p.type === 'minute')?.value || '00';
    const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    const dayMap = {
      monday: 'monday',
      tuesday: 'tuesday',
      wednesday: 'wednesday',
      thursday: 'thursday',
      friday: 'friday',
      saturday: 'saturday',
      sunday: 'sunday'
    };

    return {
      dayKey: dayMap[weekdayStr] || 'monday',
      timeStr,
      hour: parseInt(hour, 10),
      minute: parseInt(minute, 10)
    };
  } catch {
    const d = new Date();
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return {
      dayKey: dayKeys[d.getDay()] || 'monday',
      timeStr: `${hh}:${mm}`,
      hour: d.getHours(),
      minute: d.getMinutes()
    };
  }
};

/**
 * Determina en tiempo real si una tienda está abierta o cerrada,
 * evaluando los overrides manuales y el horario semanal de atención.
 */
export const calculateStoreOpenStatus = (storeConfig) => {
  if (!storeConfig) {
    return {
      isOpen: true,
      statusBadge: 'Abierto Ahora',
      statusText: 'Abierto Ahora',
      reason: 'default',
      mode: 'auto'
    };
  }

  const schedule = normalizeStoreSchedule(storeConfig.schedule);
  const explicitIsOpen = storeConfig.isOpen;

  // 1. Overrides manuales forzados
  if (schedule.mode === 'manual_closed' || explicitIsOpen === false) {
    return {
      isOpen: false,
      statusBadge: 'Cerrado Temporalmente',
      statusText: 'Cerrado Manualmente por el Dueño',
      reason: 'manual_closed',
      mode: schedule.mode === 'manual_closed' ? 'manual_closed' : 'manual'
    };
  }

  if (schedule.mode === 'manual_open') {
    return {
      isOpen: true,
      statusBadge: 'Abierto Ahora',
      statusText: 'Abierto Manualmente (Atendiendo)',
      reason: 'manual_open',
      mode: 'manual_open'
    };
  }

  // 2. Modo automático: Evaluar día y hora en Bolivia
  const bolivia = getBoliviaTime();
  const todaySchedule = schedule.weekly.find(d => d.day === bolivia.dayKey);

  if (!todaySchedule || !todaySchedule.open) {
    return {
      isOpen: false,
      statusBadge: 'Cerrado Hoy',
      statusText: `Cerrado hoy (${todaySchedule?.label || 'Día libre'})`,
      reason: 'closed_today',
      mode: 'auto',
      todaySchedule
    };
  }

  const { openTime, closeTime } = todaySchedule;
  const current = bolivia.timeStr;

  // Soporte para horario estándar y turno extendido tras medianoche (ej. 20:00 a 02:00)
  const isOvernight = closeTime < openTime;
  const isWithinHours = isOvernight
    ? (current >= openTime || current < closeTime)
    : (current >= openTime && current < closeTime);

  if (isWithinHours) {
    return {
      isOpen: true,
      statusBadge: 'Abierto Ahora',
      statusText: `Abierto (Atención hasta las ${closeTime})`,
      reason: 'open_schedule',
      mode: 'auto',
      todaySchedule,
      nextTransition: closeTime
    };
  }

  if (current < openTime) {
    return {
      isOpen: false,
      statusBadge: 'Cerrado Ahora',
      statusText: `Cerrado (Abre hoy a las ${openTime})`,
      reason: 'before_open',
      mode: 'auto',
      todaySchedule,
      nextTransition: openTime
    };
  }

  return {
    isOpen: false,
    statusBadge: 'Cerrado por Hoy',
    statusText: `Cerrado (Cerró a las ${closeTime})`,
    reason: 'after_close',
    mode: 'auto',
    todaySchedule
  };
};

/**
 * Genera un texto resumen elegante del horario semanal para mostrar al cliente
 */
export const formatScheduleSummary = (rawSchedule) => {
  const schedule = normalizeStoreSchedule(rawSchedule);
  if (schedule.customNote) return schedule.customNote;

  const openDays = schedule.weekly.filter(d => d.open);
  if (openDays.length === 0) return 'Cerrado temporalmente';

  // Si todos los días abiertos tienen el mismo horario
  const first = openDays[0];
  const allSameHours = openDays.every(d => d.openTime === first.openTime && d.closeTime === first.closeTime);

  if (allSameHours) {
    if (openDays.length === 7) {
      return `Lunes a Domingo: ${first.openTime} - ${first.closeTime}`;
    }
    if (openDays.length === 6 && !schedule.weekly.find(d => d.day === 'sunday')?.open) {
      return `Lunes a Sábado: ${first.openTime} - ${first.closeTime}`;
    }
    if (openDays.length === 5 && !schedule.weekly.find(d => d.day === 'saturday')?.open && !schedule.weekly.find(d => d.day === 'sunday')?.open) {
      return `Lunes a Viernes: ${first.openTime} - ${first.closeTime}`;
    }
  }

  // Resumen compacto por bloques
  const weekdays = schedule.weekly.filter(d => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d.day));
  const weekend = schedule.weekly.filter(d => ['saturday', 'sunday'].includes(d.day));

  const weekdaysOpen = weekdays.filter(d => d.open);
  const weekendOpen = weekend.filter(d => d.open);

  const parts = [];
  if (weekdaysOpen.length > 0) {
    const wFirst = weekdaysOpen[0];
    parts.push(`Lun-Vie: ${wFirst.openTime}-${wFirst.closeTime}`);
  }
  if (weekendOpen.length > 0) {
    const sat = schedule.weekly.find(d => d.day === 'saturday');
    const sun = schedule.weekly.find(d => d.day === 'sunday');
    if (sat?.open && sun?.open && sat.openTime === sun.openTime && sat.closeTime === sun.closeTime) {
      parts.push(`Sáb-Dom: ${sat.openTime}-${sat.closeTime}`);
    } else {
      if (sat?.open) parts.push(`Sáb: ${sat.openTime}-${sat.closeTime}`);
      if (sun?.open) parts.push(`Dom: ${sun.openTime}-${sun.closeTime}`);
    }
  }

  return parts.join(' | ') || 'Consultar horario en tienda';
};
