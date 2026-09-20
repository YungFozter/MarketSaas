/**
 * Servicio Centralizado de Alertas Sonoras y Notificaciones Push
 * para pedidos entrantes en MarketSaaS (Dispositivos Móviles y Escritorio).
 */

let sharedAudioContext = null;
let isAudioUnlocked = false;

// Desbloquear el contexto de audio en la primera interacción del usuario
export const unlockAudioContext = () => {
  if (isAudioUnlocked) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!sharedAudioContext) {
        sharedAudioContext = new AudioCtx();
      }
      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume();
      }
      isAudioUnlocked = true;
    }
  } catch (e) {
    // Ignorar si el navegador restringe
  }
};

if (typeof window !== 'undefined') {
  const handleFirstInteraction = () => {
    unlockAudioContext();
    window.removeEventListener('click', handleFirstInteraction);
    window.removeEventListener('touchstart', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
  };
  window.addEventListener('click', handleFirstInteraction, { passive: true });
  window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
  window.addEventListener('keydown', handleFirstInteraction, { passive: true });
}

/**
 * Verifica si el navegador y dispositivo soportan la Notification API
 */
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Obtiene el estado actual del permiso de notificaciones ('granted', 'denied', 'default')
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Solicita permisos de notificación nativos al usuario/dispositivo
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    // Solicitar permiso nativo
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('Error al solicitar permiso de notificación:', error);
    return Notification.permission;
  }
};

/**
 * Sintetizador armónico de campanas polifónicas de alta fidelidad vía Web Audio API
 * Funciona incluso cuando el archivo MP3 está bloqueado o en caché restringida
 */
const playHarmonicChimeFallback = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!sharedAudioContext) {
      sharedAudioContext = new AudioCtx();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume();
    }

    const ctx = sharedAudioContext;
    const now = ctx.currentTime;

    const playTone = (freq, delay, dur, gainLevel = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.exponentialRampToValueAtTime(gainLevel, now + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur);
    };

    // Arpegio armónico ascendente distintivo de pedido comercial (F5 -> A5 -> C6 -> F6)
    playTone(698.46, 0.0, 0.35, 0.3); // F5
    playTone(880.00, 0.12, 0.35, 0.35); // A5
    playTone(1046.50, 0.24, 0.45, 0.4); // C6
    playTone(1396.91, 0.38, 0.7, 0.45); // F6
  } catch (err) {
    console.warn('Error en sintetizador armónico fallback:', err);
  }
};

/**
 * Reproduce el sonido acústico de alerta de nuevo pedido y vibra en el teléfono
 */
export const playOrderNotificationSound = () => {
  unlockAudioContext();

  // Vibración háptica en celulares
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([400, 150, 400, 150, 600]);
    } catch (e) {}
  }

  try {
    const audio = new Audio('/mp3/Notificacion de orden de compra.mp3');
    audio.volume = 1.0;
    
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // Si el navegador bloqueó la reproducción automática del MP3, ejecutar fallback con Web Audio
        playHarmonicChimeFallback();
      });
    }
  } catch (e) {
    playHarmonicChimeFallback();
  }
};

/**
 * Envía una notificación push nativa al dispositivo (móvil / PC)
 */
export const sendOrderNotification = async (order, storeConfig = {}) => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const storeName = storeConfig?.name || 'Mi Tienda';
  const orderId = order?.id || 'Nuevo';
  const customerName = order?.customer?.name || 'Vecino';
  const deliveryTypeStr = (order?.deliveryType === 'delivery' || order?.delivery_type === 'delivery')
    ? 'Delivery a Domicilio'
    : 'Retiro en Tienda';
  const totalStr = Number(order?.total || 0).toFixed(2);
  const condoStr = order?.customer?.condominium || order?.customer?.apartment ? ` • ${order.customer.condominium || ''} ${order.customer.apartment || ''}` : '';

  const title = `🔔 ¡Nuevo Pedido #${orderId}! - ${storeName}`;
  const body = `${customerName} (${deliveryTypeStr}${condoStr})\nTotal: Bs. ${totalStr} • Toca para abrir y despachar.`;
  const icon = '/iconoPestana.png';
  const targetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?view=admin`
    : '/?view=admin';

  // Vibración directa al disparar notificación
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([400, 150, 400, 150, 600]);
    } catch (e) {}
  }

  // Opción 1: Notificación mediante Service Worker con timeout de seguridad (ideal para celulares Android y segundo plano)
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 1200))
      ]);
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          tag: `order-${orderId}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [400, 150, 400, 150, 600],
          data: { url: targetUrl }
        });
        return true;
      }
    } catch (swErr) {
      // Fallback inmediato a Notification de ventana
    }
  }

  // Opción 2: Notification API nativa de ventana
  try {
    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: `order-${orderId}`,
      renotify: true,
      requireInteraction: true,
      data: { url: targetUrl }
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('No se pudo enviar notificación nativa:', err);
    return false;
  }
};

/**
 * Prueba conjunta de Sonido + Notificación en el dispositivo
 */
export const testDeviceOrderAlert = async (storeConfig = {}) => {
  // 1. Reproducir sonido
  playOrderNotificationSound();

  // 2. Si el permiso no está otorgado, solicitarlo
  if (isNotificationSupported()) {
    if (Notification.permission === 'default') {
      const res = await requestNotificationPermission();
      if (res !== 'granted') return false;
    }

    if (Notification.permission === 'granted') {
      const mockOrder = {
        id: 'DEMO-' + Math.floor(1000 + Math.random() * 9000),
        customer: {
          name: 'Vecino de Prueba',
          condominium: 'Torre A - Depto 402'
        },
        deliveryType: 'delivery',
        total: 45.50
      };
      await sendOrderNotification(mockOrder, storeConfig);
      return true;
    }
  }

  return false;
};
