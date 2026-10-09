// =============================================================================
// scheduleUtils.js - Gestión Integral de Horarios de Atención y Estado del Local
// =============================================================================

export const DEFAULT_WEEKLY_SCHEDULE = [
  { day: 'monday', label: 'Lunes', open: true, enabled: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'tuesday', label: 'Martes', open: true, enabled: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'wednesday', label: 'Miércoles', open: true, enabled: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'thursday', label: 'Jueves', open: true, enabled: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'friday', label: 'Viernes', open: true, enabled: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'saturday', label: 'Sábado', open: true, enabled: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'sunday', label: 'Domingo', open: true, enabled: true, openTime: '09:00', closeTime: '20:00' }
];

// Asignar claves individuales a DEFAULT_WEEKLY_SCHEDULE para compatibilidad de acceso por objeto
DEFAULT_WEEKLY_SCHEDULE.forEach(item => {
  DEFAULT_WEEKLY_SCHEDULE[item.day] = item;
});

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

/**
 * Normaliza cualquier formato previo de schedule (string, array, objeto por días o semanal)
 * a una estructura completa y robusta con acceso tanto por array como por clave de día.
 */
export const normalizeStoreSchedule = (rawSchedule) => {
  const result = {
    mode: 'auto', // 'auto' | 'manual_open' | 'manual_closed'
    weekly: [],
    customNote: ''
  };

  if (!rawSchedule) {
    result.weekly = DEFAULT_WEEKLY_SCHEDULE.map(d => ({ ...d }));
    DAY_ORDER.forEach((dayKey, i) => {
      result[dayKey] = result.weekly[i];
    });
    return result;
  }

  // Si era un string antiguo (ej: "Horarios de Atención según cada Tienda")
  if (typeof rawSchedule === 'string') {
    result.weekly = DEFAULT_WEEKLY_SCHEDULE.map(d => ({ ...d }));
    result.customNote = rawSchedule === 'Horarios de Atención según cada Tienda' ? '' : rawSchedule;
    DAY_ORDER.forEach((dayKey, i) => {
      result[dayKey] = result.weekly[i];
    });
    return result;
  }

  result.mode = ['auto', 'manual_open', 'manual_closed'].includes(rawSchedule.mode)
    ? rawSchedule.mode
    : 'auto';

  result.customNote = typeof rawSchedule.customNote === 'string' 
    ? rawSchedule.customNote 
    : (typeof rawSchedule.scheduleClosedMessage === 'string' ? rawSchedule.scheduleClosedMessage : '');

  // CRÍTICO: Primero verificar si rawSchedule tiene claves directas de días (ej: rawSchedule.monday)
  // porque es la propiedad directa que se modifica en el formulario. Si no, buscar en rawSchedule.weekly.
  result.weekly = DAY_ORDER.map(dayKey => {
    let dayData = null;
    if (rawSchedule[dayKey] && typeof rawSchedule[dayKey] === 'object') {
      dayData = rawSchedule[dayKey];
    } else if (Array.isArray(rawSchedule.weekly)) {
      dayData = rawSchedule.weekly.find(w => w && (w.day === dayKey || w.id === dayKey));
    }

    const defaultDay = DEFAULT_WEEKLY_SCHEDULE.find(d => d.day === dayKey);
    let isOpen = defaultDay.open;

    if (dayData) {
      if (dayData.enabled !== undefined) {
        isOpen = dayData.enabled !== false;
      } else if (dayData.open !== undefined) {
        isOpen = dayData.open !== false;
      }
    }

    const normalizedDay = {
      day: dayKey,
      label: dayData?.label || DAY_LABELS[dayKey] || defaultDay.label,
      open: isOpen,
      enabled: isOpen,
      openTime: dayData?.openTime || defaultDay.openTime,
      closeTime: dayData?.closeTime || defaultDay.closeTime
    };

    result[dayKey] = normalizedDay;
    return normalizedDay;
  });

  return result;
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
  const bolivia = getBoliviaTime();

  if (!storeConfig) {
    return {
      isOpen: true,
      statusBadge: 'Abierto Ahora',
      badgeText: 'Abierto Ahora',
      statusText: 'Abierto Ahora',
      nextStatusChangeText: 'Abierto',
      reason: 'default',
      mode: 'auto',
      currentBoliviaTime: bolivia.timeStr,
      currentDayName: DAY_LABELS[bolivia.dayKey] || 'Hoy',
      summary: 'Atención según horario habitual'
    };
  }

  const schedule = normalizeStoreSchedule(storeConfig.schedule);
  const explicitIsOpen = storeConfig.isOpen;
  const storeMode = storeConfig.storeOpenMode || schedule.mode || 'auto';
  const summary = formatScheduleSummary(schedule);

  // 1. Overrides manuales forzados
  if (storeMode === 'manual_open') {
    return {
      isOpen: true,
      statusBadge: 'Abierto Ahora',
      badgeText: 'Abierto Ahora',
      statusText: 'Abierto Manualmente (Atendiendo)',
      nextStatusChangeText: 'Abierto Continuo (Manual)',
      reason: 'manual_open',
      mode: 'manual_open',
      currentBoliviaTime: bolivia.timeStr,
      currentDayName: DAY_LABELS[bolivia.dayKey] || 'Hoy',
      summary
    };
  }

  if (storeMode === 'manual_closed') {
    return {
      isOpen: false,
      statusBadge: 'Cerrado Temporalmente',
      badgeText: 'Cerrado Temporalmente',
      statusText: 'Cerrado Manualmente por el Dueño',
      nextStatusChangeText: 'Cerrado Manualmente',
      reason: 'manual_closed',
      mode: 'manual_closed',
      currentBoliviaTime: bolivia.timeStr,
      currentDayName: DAY_LABELS[bolivia.dayKey] || 'Hoy',
      summary
    };
  }

  // 2. Modo automático: Evaluar día y hora en Bolivia
  const todaySchedule = schedule.weekly.find(d => d.day === bolivia.dayKey) || schedule[bolivia.dayKey];

  if (!todaySchedule || (todaySchedule.open === false && todaySchedule.enabled === false)) {
    return {
      isOpen: false,
      statusBadge: 'Cerrado Hoy',
      badgeText: 'Cerrado Hoy',
      statusText: `Cerrado hoy (${todaySchedule?.label || 'Día de descanso'})`,
      nextStatusChangeText: `Cerrado por descanso (${todaySchedule?.label || 'Hoy'})`,
      reason: 'closed_today',
      mode: 'auto',
      todaySchedule,
      currentBoliviaTime: bolivia.timeStr,
      currentDayName: todaySchedule?.label || DAY_LABELS[bolivia.dayKey] || 'Hoy',
      summary
    };
  }

  const { openTime, closeTime } = todaySchedule;
  const current = bolivia.timeStr;

  // Soporte para horario estándar y turno nocturno extendido (ej. 20:00 a 02:00)
  const isOvernight = closeTime < openTime;
  const isWithinHours = isOvernight
    ? (current >= openTime || current < closeTime)
    : (current >= openTime && current < closeTime);

  if (isWithinHours) {
    return {
      isOpen: true,
      statusBadge: 'Abierto Ahora',
      badgeText: 'Abierto Ahora',
      statusText: `Abierto (Atención hasta las ${closeTime})`,
      nextStatusChangeText: `Cierra hoy a las ${closeTime}`,
      reason: 'open_schedule',
      mode: 'auto',
      todaySchedule,
      nextTransition: closeTime,
      currentBoliviaTime: bolivia.timeStr,
      currentDayName: todaySchedule?.label || DAY_LABELS[bolivia.dayKey] || 'Hoy',
      summary
    };
  }

  if (current < openTime) {
    return {
      isOpen: false,
      statusBadge: 'Cerrado Ahora',
      badgeText: 'Cerrado Ahora',
      statusText: `Cerrado (Abre hoy a las ${openTime})`,
      nextStatusChangeText: `Abre hoy a las ${openTime}`,
      reason: 'before_open',
      mode: 'auto',
      todaySchedule,
      nextTransition: openTime,
      currentBoliviaTime: bolivia.timeStr,
      currentDayName: todaySchedule?.label || DAY_LABELS[bolivia.dayKey] || 'Hoy',
      summary
    };
  }

  return {
    isOpen: false,
    statusBadge: 'Cerrado por Hoy',
    badgeText: 'Cerrado por Hoy',
    statusText: `Cerrado (Cerró a las ${closeTime})`,
    nextStatusChangeText: `Cerró hoy a las ${closeTime}`,
    reason: 'after_close',
    mode: 'auto',
    todaySchedule,
    currentBoliviaTime: bolivia.timeStr,
    currentDayName: todaySchedule?.label || DAY_LABELS[bolivia.dayKey] || 'Hoy',
    summary
  };
};

/**
 * Genera un texto resumen elegante del horario semanal para mostrar al cliente
 */
export const formatScheduleSummary = (rawSchedule) => {
  const schedule = normalizeStoreSchedule(rawSchedule);
  if (schedule.customNote) return schedule.customNote;

  const openDays = schedule.weekly.filter(d => d.open !== false && d.enabled !== false);
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

  const weekdaysOpen = weekdays.filter(d => d.open !== false && d.enabled !== false);
  const weekendOpen = weekend.filter(d => d.open !== false && d.enabled !== false);

  const parts = [];
  if (weekdaysOpen.length > 0) {
    const wFirst = weekdaysOpen[0];
    parts.push(`Lun-Vie: ${wFirst.openTime}-${wFirst.closeTime}`);
  }
  if (weekendOpen.length > 0) {
    const sat = schedule.weekly.find(d => d.day === 'saturday');
    const sun = schedule.weekly.find(d => d.day === 'sunday');
    const satOpen = sat?.open !== false && sat?.enabled !== false;
    const sunOpen = sun?.open !== false && sun?.enabled !== false;
    if (satOpen && sunOpen && sat.openTime === sun.openTime && sat.closeTime === sun.closeTime) {
      parts.push(`Sáb-Dom: ${sat.openTime}-${sat.closeTime}`);
    } else {
      if (satOpen) parts.push(`Sáb: ${sat.openTime}-${sat.closeTime}`);
      if (sunOpen) parts.push(`Dom: ${sun.openTime}-${sun.closeTime}`);
    }
  }

  return parts.join(' | ') || 'Consultar horario en tienda';
};

// =============================================================================
// GESTIÓN DE HORARIOS ESPECÍFICOS DE DESPACHO Y ENVÍOS (DELIVERY)
// =============================================================================

export const DEFAULT_DELIVERY_SCHEDULE = {
  enabled: true,
  mode: 'custom', // 'custom' | 'same_as_store'
  daysText: 'Lunes a Sábado',
  timeText: '11:30 - 14:00 y 18:30 - 22:00',
  slot1Start: '11:30',
  slot1End: '14:00',
  hasSecondSlot: true,
  slot2Start: '18:30',
  slot2End: '22:00',
  note: 'Los pedidos fuera de horario se programarán para el siguiente turno de entrega.'
};

/**
 * Normaliza la configuración de horario de delivery de la tienda
 */
export const normalizeDeliverySchedule = (raw, storeConfig = null) => {
  if (!raw || typeof raw !== 'object') {
    if (storeConfig?.deliveryHours || storeConfig?.deliveryTimeText) {
      return {
        ...DEFAULT_DELIVERY_SCHEDULE,
        timeText: storeConfig.deliveryHours || storeConfig.deliveryTimeText,
        daysText: storeConfig.deliveryDaysText || DEFAULT_DELIVERY_SCHEDULE.daysText,
        note: storeConfig.deliveryScheduleNote || DEFAULT_DELIVERY_SCHEDULE.note
      };
    }
    return { ...DEFAULT_DELIVERY_SCHEDULE };
  }

  const mode = raw.mode || 'custom';
  let timeText = raw.timeText || DEFAULT_DELIVERY_SCHEDULE.timeText;
  let daysText = raw.daysText || DEFAULT_DELIVERY_SCHEDULE.daysText;

  if (mode === 'same_as_store' && storeConfig?.schedule) {
    timeText = formatScheduleSummary(storeConfig.schedule);
    daysText = 'Mismo horario de atención';
  }

  return {
    enabled: raw.enabled !== false,
    mode,
    timeText,
    daysText,
    slot1Start: raw.slot1Start || '11:30',
    slot1End: raw.slot1End || '14:00',
    hasSecondSlot: raw.hasSecondSlot !== false,
    slot2Start: raw.slot2Start || '18:30',
    slot2End: raw.slot2End || '22:00',
    note: raw.note !== undefined ? raw.note : DEFAULT_DELIVERY_SCHEDULE.note
  };
};

/**
 * Calcula en tiempo real (UTC-4 Bolivia) el estado operativo del servicio de envíos
 */
export const calculateDeliveryScheduleStatus = (rawDeliverySchedule, storeConfig = null) => {
  const isDeliveryGloballyEnabled = storeConfig ? storeConfig.enableDelivery !== false : true;
  const schedule = normalizeDeliverySchedule(rawDeliverySchedule, storeConfig);

  if (!isDeliveryGloballyEnabled || !schedule.enabled) {
    return {
      isDeliveryActive: false,
      isCurrentlyDelivering: false,
      badgeText: 'Delivery Pausado',
      badgeColor: 'slate',
      timeText: schedule.timeText,
      daysText: schedule.daysText,
      note: 'Servicio de entrega a domicilio no disponible actualmente (solo retiro en tienda).',
      summaryText: 'Solo retiro en local'
    };
  }

  const bolivia = getBoliviaTime();
  const currentMinutes = bolivia.totalMinutes;

  const toMins = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const s1Start = toMins(schedule.slot1Start);
  const s1End = toMins(schedule.slot1End);
  const s2Start = schedule.hasSecondSlot ? toMins(schedule.slot2Start) : null;
  const s2End = schedule.hasSecondSlot ? toMins(schedule.slot2End) : null;

  const isSunday = bolivia.dayKey === 'sunday';
  const lowerDays = (schedule.daysText || '').toLowerCase();
  const excludesSunday = (lowerDays.includes('sábado') || lowerDays.includes('sabado') || lowerDays.includes('viernes')) && 
    !lowerDays.includes('domingo') && 
    !lowerDays.includes('todos') && 
    !lowerDays.includes('diario');
  const isTodayDeliveryDay = !(isSunday && excludesSunday);

  let isCurrentlyDelivering = false;
  let nextDeliveryHint = '';

  if (schedule.mode === 'same_as_store') {
    const storeStatus = calculateStoreOpenStatus(storeConfig);
    isCurrentlyDelivering = storeStatus.isOpen;
    nextDeliveryHint = storeStatus.isOpen ? 'Envíos en curso' : storeStatus.nextStatusChangeText;
  } else if (isTodayDeliveryDay) {
    if (currentMinutes >= s1Start && currentMinutes <= s1End) {
      isCurrentlyDelivering = true;
      nextDeliveryHint = `Envíos en curso hasta las ${schedule.slot1End}`;
    } else if (schedule.hasSecondSlot && s2Start !== null && s2End !== null && currentMinutes >= s2Start && currentMinutes <= s2End) {
      isCurrentlyDelivering = true;
      nextDeliveryHint = `Envíos en curso hasta las ${schedule.slot2End}`;
    } else if (currentMinutes < s1Start) {
      nextDeliveryHint = `Primer turno de envíos inicia hoy a las ${schedule.slot1Start}`;
    } else if (schedule.hasSecondSlot && s2Start !== null && currentMinutes < s2Start) {
      nextDeliveryHint = `Segundo turno de envíos inicia hoy a las ${schedule.slot2Start}`;
    } else {
      nextDeliveryHint = `Envíos de hoy concluidos • Próximo turno mañana a las ${schedule.slot1Start}`;
    }
  } else {
    nextDeliveryHint = `Hoy no hay despacho a domicilio • Próximo turno inicia el lunes a las ${schedule.slot1Start}`;
  }

  return {
    isDeliveryActive: true,
    isCurrentlyDelivering,
    badgeText: isCurrentlyDelivering ? '● Despachos en curso' : '⏳ Despacho programado',
    badgeColor: isCurrentlyDelivering ? 'emerald' : 'amber',
    nextDeliveryHint,
    timeText: schedule.timeText,
    daysText: schedule.daysText,
    note: schedule.note,
    summaryText: `${schedule.daysText}: ${schedule.timeText}`
  };
};
