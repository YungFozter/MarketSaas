// ==============================================================================
// CONFIGURACIÓN OFICIAL BLINDADA DE CONTACTO, PLANES Y PAGOS DE MARKETSAAS
// Protegido contra manipulación en modo desarrollador / DevTools
// ==============================================================================

export const OFFICIAL_PLATFORM_CONTACT = Object.freeze({
  phone: '+591 72125280',
  whatsappDigits: '59172125280',
  brandName: 'MarketSaaS Oficial',
  supportEmail: 'soporte@marketsaas.com',
  country: 'Bolivia',
  plans: Object.freeze({
    basic: Object.freeze({
      id: 'basic',
      name: 'Plan Básico',
      priceBs: 75,
      period: 'mes',
      currency: 'Bs.'
    }),
    pro: Object.freeze({
      id: 'pro',
      name: 'Plan PRO ⭐',
      priceBs: 129,
      period: 'mes',
      currency: 'Bs.'
    }),
    custom: Object.freeze({
      id: 'custom',
      name: 'Plan Mejora',
      priceBs: null,
      period: 'cotización / a medida',
      currency: 'Bs.'
    })
  })
});

/**
 * Genera la URL oficial blindada de WhatsApp para solicitudes de suscripción.
 * Garantiza que SIEMPRE se use el número oficial 59172125280.
 */
export const getOfficialSubscriptionWhatsappUrl = (planName = null, storeName = '') => {
  const cleanStore = (storeName || 'Mi Tienda').trim();
  const text = planName
    ? `Hola, deseo adquirir o activar el *${planName}* para mi tienda "${cleanStore}" en MarketSaaS.`
    : `Hola, deseo adquirir o renovar una licencia para mi tienda "${cleanStore}" en MarketSaaS.`;
  return `https://wa.me/${OFFICIAL_PLATFORM_CONTACT.whatsappDigits}?text=${encodeURIComponent(text)}`;
};

/**
 * Ejecutor blindado de redirección a WhatsApp oficial.
 * Neutraliza cualquier alteración maliciosa del atributo 'href' realizada en DevTools
 * asegurando que la navegación siempre se ejecute con el destino oficial inmutable.
 */
export const openOfficialSubscriptionWhatsapp = (e, planName = null, storeName = '') => {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const url = getOfficialSubscriptionWhatsappUrl(planName, storeName);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
