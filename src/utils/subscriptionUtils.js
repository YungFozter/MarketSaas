/**
 * Módulo Canónico de Gestión de Suscripciones y Período de Prueba (MarketSaaS)
 * 
 * Reglas de negocio:
 * 1. El período de prueba gratuito al registrar/crear una tienda es de 15 DÍAS (21,600 minutos).
 * 2. Zona horaria canónica oficial: Bolivia (America/La_Paz, UTC-04:00).
 * 3. Permanencia y consistencia: Se preserva la fecha exacta de creación y vencimiento sin reiniciar días indebidos.
 * 4. Blindaje contra fugas: Las tiendas expiradas se resuelven a 'expired' y los planes de pago ('basic' / 'pro') no se degradan.
 */

// Duración oficial del período de prueba gratuito: 15 días = 21,600 minutos
export const TRIAL_DURATION_MINUTES = 21600; // 15 días (21,600 minutos)

// Offset oficial para La Paz - Bolivia (UTC -04:00)
export const BOLIVIA_TIMEZONE_OFFSET_HOURS = -4;

// Formateador canónico en zona horaria de Bolivia (America/La_Paz, UTC-4)
export const formatBoliviaDateTime = (isoString) => {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';
    return new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return String(isoString);
  }
};

// Cálculo de tiempo restante en vivo (días, horas, minutos, segundos)
export const calculateSubscriptionTimeRemaining = (expiresAtIso, currentTimestamp = Date.now()) => {
  if (!expiresAtIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true, formatted: 'Expirado' };
  }
  const now = currentTimestamp;
  const target = new Date(expiresAtIso).getTime();
  const diffMs = target - now;

  if (diffMs <= 0 || isNaN(diffMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true, formatted: 'Expirado' };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    formatted = `${minutes}m ${seconds}s`;
  }

  return { days, hours, minutes, seconds, totalSeconds, isExpired: false, formatted };
};

// Generador de códigos de activación limpios MS-XXXX-XXXX sin caracteres ambiguos (excluyendo 0, O, 1, I, L)
export const generateCleanCode = () => {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MS-${p1}-${p2}`;
};

// Creador de objeto inicial de suscripción
export const createDefaultSubscription = (durationMinutes = TRIAL_DURATION_MINUTES) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
  return {
    status: 'trial', // 'trial' | 'active' | 'expired'
    trialStartedAt: now.toISOString(),
    trialEndsAt: expiresAt.toISOString(),
    subscriptionExpiresAt: expiresAt.toISOString(),
    plan: 'trial_free',
    history: []
  };
};

// Normalizador seguro y blindado de suscripción (evita regalar tiempo indebido o quitar vigencia ganada)
export const normalizeSubscription = (sub, fallbackCreatedAt = null) => {
  const now = Date.now();

  // Si no existe objeto de suscripción previo:
  if (!sub || typeof sub !== 'object') {
    // Si conocemos la fecha real de creación de la tienda en Supabase, calculamos los 15 días gratis a partir de dicha fecha
    if (fallbackCreatedAt) {
      const createdTime = new Date(fallbackCreatedAt).getTime();
      if (!isNaN(createdTime)) {
        const trialEnd = new Date(createdTime + TRIAL_DURATION_MINUTES * 60 * 1000);
        const isExpired = trialEnd.getTime() <= now;
        return {
          status: isExpired ? 'expired' : 'trial',
          trialStartedAt: new Date(createdTime).toISOString(),
          trialEndsAt: trialEnd.toISOString(),
          subscriptionExpiresAt: trialEnd.toISOString(),
          plan: 'trial_free',
          history: []
        };
      }
    }
    return createDefaultSubscription();
  }

  // 1. Determinar fecha de inicio del período de prueba (15 días)
  const trialStartIso = sub.trialStartedAt || sub.trialStarted || fallbackCreatedAt || new Date().toISOString();
  const trialStartTime = new Date(trialStartIso).getTime();

  // 2. Determinar fecha de expiración con máxima fidelidad
  let expiresAt = sub.subscriptionExpiresAt || sub.trialEndsAt || sub.trialEnds;
  
  // Si no tiene fecha de expiración explícita pero tiene fecha de inicio de prueba
  if (!expiresAt && !isNaN(trialStartTime)) {
    expiresAt = new Date(trialStartTime + TRIAL_DURATION_MINUTES * 60 * 1000).toISOString();
  } else if (!expiresAt && fallbackCreatedAt) {
    const createdTime = new Date(fallbackCreatedAt).getTime();
    if (!isNaN(createdTime)) {
      expiresAt = new Date(createdTime + TRIAL_DURATION_MINUTES * 60 * 1000).toISOString();
    }
  }

  if (!expiresAt) {
    expiresAt = new Date().toISOString();
  }

  const isExpired = new Date(expiresAt).getTime() <= now;
  let resolvedStatus = sub.status || (isExpired ? 'expired' : (sub.plan === 'trial_free' ? 'trial' : 'active'));
  if (isExpired) {
    resolvedStatus = 'expired';
  } else if (!isExpired && resolvedStatus === 'expired') {
    resolvedStatus = (sub.plan && sub.plan !== 'trial_free') ? 'active' : 'trial';
  }

  const trialEndsIso = sub.trialEndsAt || sub.trialEnds || (!isNaN(trialStartTime) ? new Date(trialStartTime + TRIAL_DURATION_MINUTES * 60 * 1000).toISOString() : expiresAt);

  return {
    status: resolvedStatus,
    trialStartedAt: trialStartIso,
    trialEndsAt: trialEndsIso,
    subscriptionExpiresAt: expiresAt,
    plan: sub.plan || 'trial_free',
    history: Array.isArray(sub.history) ? sub.history : []
  };
};
