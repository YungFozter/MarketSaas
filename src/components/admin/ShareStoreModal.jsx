import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Store,
  Smartphone,
  MessageCircle,
  Send,
  Sparkles,
  Crown,
  Flame,
  Zap,
  Coffee,
  Package,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CheckCheck,
  MapPin,
  PenTool,
  RotateCcw,
  Plus,
  ShoppingBag,
  Navigation,
  Phone,
  Truck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { resolveIsolatedStoreShareData } from '../../utils/storeTenantUtils';
import './ShareStoreModal.css';

const QUICK_PROMO_SUGGESTIONS = [
  'Coca-Cola 2L a Bs. 12',
  'Pan caliente recién horneado',
  'Delivery gratis hoy > Bs. 60',
  'Leche y huevos frescos del día'
];

export const ShareStoreModal = ({ isOpen, onClose }) => {
  const { storeConfig, setStoreConfig, stores = [], selectedStore, merchantStore, tenantSlug, showToast, isProPlan } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState('weekend');
  const [customPromo, setCustomPromo] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const tenant = tenantSlug || 'default';

  // 1. Enlace directo a la tienda (estrictamente del tenant activo)
  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?view=customer&store=${tenant}`
    : `https://marketsaas.com/?view=customer&store=${tenant}`;

  // 2 & 3. Datos de tienda, ubicación, contacto y Google Maps aislados por dueño/tenant
  const {
    scopedConfig,
    storeName,
    addressText,
    storePhone,
    mapsUrl,
    hasExactCoordinates,
    resolvedLat,
    resolvedLng
  } = useMemo(() => resolveIsolatedStoreShareData({
    tenant,
    storeConfig,
    merchantStore,
    selectedStore,
    stores
  }), [tenant, storeConfig, merchantStore, selectedStore, stores]);

  // Mensaje base predeterminado para la plantilla personalizada
  const buildDefaultCustomTemplate = () =>
    `📣 *¡Novedades en ${storeName}!* ✨\n\n` +
    `Hola vecinos, ya estamos atendiendo con productos frescos y ofertas especiales para hoy.\n\n` +
    `🛒 *Catálogo Virtual & Pedidos:*\n👉 ${storeUrl}\n\n` +
    `📍 *Dirección:* ${addressText}\n` +
    `🗺️ *Ubicación GPS (Google Maps):*\n${mapsUrl}`;

  // Estado persistido por tienda (localStorage + Supabase store_config + Realtime) para la Plantilla Personalizada
  const customStorageKey = `marketsaas_${tenant}_custom_marketing_tpl`;
  const [customTemplateText, setCustomTemplateText] = useState(() => {
    if (typeof scopedConfig?.customMarketingTemplate === 'string') {
      return scopedConfig.customMarketingTemplate;
    }
    try {
      const saved = localStorage.getItem(customStorageKey);
      if (saved !== null) return saved;
    } catch { }
    return '';
  });

  const syncTimerRef = useRef(null);
  const lastLocalEditTsRef = useRef(0);
  const lastLoadedTenantRef = useRef(tenant);
  const scopedConfigRef = useRef(scopedConfig);
  scopedConfigRef.current = scopedConfig;

  // Limpiar estados transitorios y cargar la plantilla aislada cuando cambia de tienda
  useEffect(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    const isTenantChange = lastLoadedTenantRef.current !== tenant;
    if (isTenantChange) {
      lastLoadedTenantRef.current = tenant;
      lastLocalEditTsRef.current = 0;
      setCustomPromo('');
      setCopiedMessage(false);
      setCopiedUrl(false);
    }

    const cloudTpl = typeof scopedConfig?.customMarketingTemplate === 'string'
      ? scopedConfig.customMarketingTemplate
      : null;

    let localTpl = null;
    try {
      localTpl = localStorage.getItem(customStorageKey);
    } catch { }

    if (cloudTpl !== null) {
      setCustomTemplateText(cloudTpl);
      try { localStorage.setItem(customStorageKey, cloudTpl); } catch { }
    } else if (localTpl !== null) {
      setCustomTemplateText(localTpl);
    } else {
      setCustomTemplateText(buildDefaultCustomTemplate());
    }
  }, [tenant]);

  // Sincronización en tiempo real desde la nube / otra pestaña sin interrumpir escritura activa
  useEffect(() => {
    const cloudTpl = scopedConfig?.customMarketingTemplate;
    if (typeof cloudTpl !== 'string') return;
    if (Date.now() - lastLocalEditTsRef.current < 1600) return;

    setCustomTemplateText(prev => (prev !== cloudTpl ? cloudTpl : prev));
    try {
      localStorage.setItem(customStorageKey, cloudTpl);
    } catch { }
  }, [scopedConfig?.customMarketingTemplate, customStorageKey]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  const handleUpdateCustomTemplateText = (newVal) => {
    const activeTenantAtEdit = tenant;
    lastLocalEditTsRef.current = Date.now();
    setCustomTemplateText(newVal);

    try {
      localStorage.setItem(`marketsaas_${activeTenantAtEdit}_custom_marketing_tpl`, newVal);
    } catch { }

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    if (typeof setStoreConfig === 'function') {
      syncTimerRef.current = setTimeout(() => {
        if (lastLoadedTenantRef.current !== activeTenantAtEdit) return;
        const latestCfg = scopedConfigRef.current || {};
        if (latestCfg.customMarketingTemplate === newVal) return;
        setStoreConfig({
          ...latestCfg,
          id: latestCfg.id || activeTenantAtEdit,
          tenant_id: latestCfg.tenant_id || activeTenantAtEdit,
          customMarketingTemplate: newVal
        });
      }, 650);
    }
  };

  const customTextareaRef = useRef(null);

  // Insertar bloque inteligente (enlace de tienda, ubicación GPS, dirección, etc.) en la posición del cursor
  const handleInsertSmartToken = (snippetText, label) => {
    const textarea = customTextareaRef.current;
    if (!textarea) {
      const next = customTemplateText
        ? `${customTemplateText.trimEnd()}\n${snippetText}`
        : snippetText;
      handleUpdateCustomTemplateText(next);
      showToast(`Insertado: ${label}`, 'info');
      return;
    }

    const start = textarea.selectionStart ?? customTemplateText.length;
    const end = textarea.selectionEnd ?? customTemplateText.length;
    const before = customTemplateText.slice(0, start);
    const after = customTemplateText.slice(end);
    const needsLeadingNewline = before.length > 0 && !before.endsWith('\n') && !before.endsWith(' ');
    const prefix = needsLeadingNewline ? '\n' : '';
    const nextText = `${before}${prefix}${snippetText}${after}`;

    handleUpdateCustomTemplateText(nextText);
    showToast(`+${label} agregado al mensaje`, 'info');

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + snippetText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 20);
  };

  // Bloques inteligentes ofrecidos por el sistema para armar la plantilla personalizada
  const smartInsertBlocks = useMemo(() => [
    {
      id: 'catalog_link',
      label: 'Link Catálogo Tienda',
      icon: ShoppingBag,
      colorClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300',
      snippet: `🛒 *Catálogo Virtual & Pedidos:*\n👉 ${storeUrl}`
    },
    {
      id: 'gps_maps',
      label: 'Ubicación GPS (Maps)',
      icon: Navigation,
      colorClass: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300',
      snippet: `🗺️ *Cómo llegar (Google Maps):*\n${mapsUrl}`
    },
    {
      id: 'store_address',
      label: 'Dirección Escrita',
      icon: MapPin,
      colorClass: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300',
      snippet: `📍 *Ubicación:* ${addressText}`
    },
    {
      id: 'store_title',
      label: 'Nombre Tienda',
      icon: Store,
      colorClass: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300',
      snippet: `🏪 *${storeName.toUpperCase()}*`
    },
    {
      id: 'delivery_info',
      label: 'Info Delivery & Pagos',
      icon: Truck,
      colorClass: 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300',
      snippet: `🛵 *Delivery vecinal rápido o retiro en mostrador (Efectivo y QR).*`
    },
    ...(storePhone ? [{
      id: 'whatsapp_phone',
      label: 'Teléfono / WhatsApp',
      icon: Phone,
      colorClass: 'bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-300',
      snippet: `📲 *Consultas y Pedidos:* ${storePhone}`
    }] : [])
  ], [storeUrl, mapsUrl, addressText, storeName, storePhone]);

  // Control del carrusel deslizante en móvil / tablet (< lg)
  const carouselRef = useRef(null);
  const scrollTickRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!carouselRef.current) return;
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    const nextLeft = scrollLeft > 6;
    const nextRight = scrollLeft + clientWidth < scrollWidth - 10;
    setCanScrollLeft(prev => (prev !== nextLeft ? nextLeft : prev));
    setCanScrollRight(prev => (prev !== nextRight ? nextRight : prev));
  };

  const handleCarouselScroll = () => {
    if (scrollTickRef.current) return;
    scrollTickRef.current = true;
    window.requestAnimationFrame(() => {
      checkScrollability();
      scrollTickRef.current = false;
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(checkScrollability, 120);
    window.addEventListener('resize', checkScrollability);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [isOpen]);

  // Bloquear el scroll de fondo en la página (PC y móvil) mientras el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'contain';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 4. Catálogo de 6 Plantillas de Marketing Vecinal (5 predefinidas + 1 Personalizada)
  const templates = useMemo(() => [
    {
      id: 'weekend',
      title: 'Fin de Semana',
      tag: 'Viernes a Domingo',
      icon: Flame,
      badge: 'PRO',
      description: 'Ofertas para estados y grupos vecinales de fin de semana',
      buildText: (promo) =>
        `🔥 *¡FIN DE SEMANA EN ${storeName.toUpperCase()}!* 🎉\n\n` +
        `Vecinos, prepárense para el fin de semana con las mejores ofertas en bebidas, snacks, carnes frías y abarrotes.\n` +
        (promo ? `\n⭐ *OFERTA ESPECIAL:* ${promo}\n` : '') +
        `\n📲 Haz tu pedido en línea desde el catálogo virtual:\n👉 ${storeUrl}\n\n` +
        `🛵 *¡Delivery vecinal rápido o retiro listo en mostrador!*\n` +
        `📍 *Ubicación:* ${addressText}\n` +
        `🗺️ *Cómo llegar:* ${mapsUrl}\n\n` +
        `¡Los esperamos con la mejor atención! ✨`
    },
    {
      id: 'stock',
      title: 'Nuevo Stock',
      tag: 'Reposición Fresca',
      icon: Package,
      badge: 'PRO',
      description: 'Aviso de llegada de productos frescos, lácteos o reposición',
      buildText: (promo) =>
        `📦 *¡ACABAMOS DE RENOVAR STOCK EN ${storeName.toUpperCase()}!* 🥦🥛\n\n` +
        `¡Ya llegaron productos frescos, lácteos, bebidas bien frías y todo para tu hogar!\n` +
        (promo ? `\n✨ *Destacado de hoy:* ${promo}\n` : '') +
        `\n👀 Revisa los precios y novedades disponibles ahora mismo:\n👉 ${storeUrl}\n\n` +
        `⚡ Haz tu pedido en línea y te lo tenemos listo para recoger sin filas.\n` +
        `📍 ${addressText}\n\n` +
        `¡Siempre a pasos de tu puerta!`
    },
    {
      id: 'express',
      title: 'Sin Filas & Delivery',
      tag: 'Ahorro de Tiempo',
      icon: Zap,
      badge: 'PRO',
      description: 'Enfocado en comodidad, rapidez y entregas a domicilio',
      buildText: (promo) =>
        `⚡ *¿Cansado de hacer filas? Pide en ${storeName} desde tu teléfono* 📱🛵\n\n` +
        `1️⃣ Abre nuestro catálogo: ${storeUrl}\n` +
        `2️⃣ Elige lo que necesitas con un toque.\n` +
        `3️⃣ ¡Te lo llevamos a casa o lo recoges listo en mostrador!\n` +
        (promo ? `\n💡 *Nota:* ${promo}\n` : '') +
        `\n💳 Pagos fáciles por QR o efectivo al recibir.\n` +
        `📍 *Dirección:* ${addressText}`
    },
    {
      id: 'morning',
      title: 'Buenos Días',
      tag: 'Turno Mañana',
      icon: Coffee,
      badge: 'PRO',
      description: 'Mensaje matutino para estados (pan fresco y desayuno)',
      buildText: (promo) =>
        `☀️ *¡Muy buenos días, queridos vecinos!* ☕🥖\n\n` +
        `En *${storeName}* ya tenemos todo listo para tu desayuno: pan fresco, leche, café y los abarrotes para el día.\n` +
        (promo ? `\n🥐 *Especial de la mañana:* ${promo}\n` : '') +
        `\n🛒 Haz tu pedido matutino aquí:\n👉 ${storeUrl}\n\n` +
        `📍 Te esperamos en ${addressText}\n` +
        `¡Que tengas un excelente y bendecido día! 🌟`
    },
    {
      id: 'general',
      title: 'Presentación',
      tag: 'Institucional',
      icon: Store,
      badge: null,
      description: 'Mensaje institucional estándar para nuevos clientes y vecinos',
      buildText: (promo) =>
        `🏪 *${storeName}*\n\n` +
        `🛒 Haz tus pedidos en línea desde nuestro catálogo virtual:\n${storeUrl}\n` +
        (promo ? `\n⭐ ${promo}\n` : '') +
        `\n📍 *Ubicación:* ${addressText}\n` +
        `🗺️ *Cómo llegar (Google Maps):*\n${mapsUrl}\n\n` +
        `¡Te esperamos con los brazos abiertos! ✨`
    },
    {
      id: 'custom',
      title: 'Personalizada',
      tag: 'Crea a tu Medida',
      icon: PenTool,
      badge: 'Libre',
      isCustomBuilder: true,
      description: 'Redacta tu propio mensaje e inserta enlaces de catálogo y GPS con 1 clic',
      buildText: () => customTemplateText.trim() || buildDefaultCustomTemplate()
    }
  ], [storeName, storeUrl, addressText, mapsUrl, customTemplateText]);

  const activeTemplateIndex = useMemo(() => {
    const idx = templates.findIndex(t => t.id === selectedTemplate);
    return idx >= 0 ? idx : 0;
  }, [templates, selectedTemplate]);

  const activeTemplate = templates[activeTemplateIndex] || templates[0];
  const isCustomMode = activeTemplate.id === 'custom';

  // Mensaje actual generado
  const currentShareMessage = useMemo(() => {
    return activeTemplate.buildText(customPromo.trim());
  }, [activeTemplate, customPromo]);

  const currentTimeFormatted = useMemo(() => {
    try {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '09:00';
    }
  }, [selectedTemplate, customPromo, customTemplateText]);

  // Manejadores de navegación del carrusel en móvil/tablet
  const handlePrev = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const card = container.firstElementChild;
    const scrollAmount = card ? (card.offsetWidth + 10) : (container.clientWidth * 0.5);
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    setTimeout(checkScrollability, 300);
  };

  const handleNext = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const card = container.firstElementChild;
    const scrollAmount = card ? (card.offsetWidth + 10) : (container.clientWidth * 0.5);
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScrollability, 300);
  };

  const scrollToTemplateIndex = (idx) => {
    if (!carouselRef.current) return;
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;
    const container = carouselRef.current;
    const targetElement = container.children[idx];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setTimeout(checkScrollability, 350);
    }
  };

  if (!isOpen) return null;

  // Manejador del Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `¡Visita ${storeName}!`,
          text: currentShareMessage,
          url: storeUrl
        });
        showToast('¡Compartido con éxito!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyFullMessage();
        }
      }
    } else {
      handleCopyFullMessage();
      showToast('Mensaje copiado al portapapeles para pegar en tu app.', 'info');
    }
  };

  // Manejador Copiar Mensaje Completo
  const handleCopyFullMessage = () => {
    try {
      navigator.clipboard.writeText(currentShareMessage);
      setCopiedMessage(true);
      showToast('¡Mensaje copiado listo para WhatsApp!', 'success');
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      showToast('No se pudo copiar el mensaje.', 'error');
    }
  };

  // Manejador Copiar Solo Enlace
  const handleCopyUrlOnly = () => {
    try {
      navigator.clipboard.writeText(storeUrl);
      setCopiedUrl(true);
      showToast('¡Enlace de la tienda copiado!', 'success');
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      showToast('No se pudo copiar el enlace.', 'error');
    }
  };

  // Compartir en WhatsApp
  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(currentShareMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Compartir en Telegram
  const handleShareTelegram = () => {
    const encodedText = encodeURIComponent(currentShareMessage);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodedText}`, '_blank');
  };

  return createPortal(
    <div
      className="share-store-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-1.5 sm:p-3 lg:p-5 bg-slate-950/75 select-none"
      onClick={onClose}
    >
      <div
        className="share-store-modal-card relative w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden text-slate-900 flex flex-col select-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-store-modal-title"
      >
        {/* =============================================================== */}
        {/* 1. CABECERA FIJA (Compacta en Móvil, Amplia en PC)              */}
        {/* =============================================================== */}
        <header className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 bg-slate-50/95 border-b border-slate-200/80 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2
                  id="share-store-modal-title"
                  className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-tight truncate"
                >
                  Marketing & Difusión Vecinal
                </h2>

                {isProPlan ? (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600 fill-amber-400" />
                    <span>Pack PRO</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Difusión Digital</span>
                  </span>
                )}
              </div>

              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-tight truncate">
                Plantillas listas y constructor personalizado con enlaces de{' '}
                <strong className="text-slate-800 font-extrabold">{storeName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
            title="Cerrar ventana (Esc)"
            aria-label="Cerrar modal de marketing"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </header>

        {/* =============================================================== */}
        {/* 2. CUERPO PRINCIPAL (min-h-0 flex-1 para encajar en cualquier móvil) */}
        {/* =============================================================== */}
        <div className="share-store-modal-body px-3 py-2.5 sm:px-6 sm:py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-4 lg:gap-5 items-stretch">

            {/* =========================================================== */}
            {/* COLUMNA IZQUIERDA (PC: 7 cols): Plantillas + Paso 2 Dinámico */}
            {/* =========================================================== */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-2.5 sm:gap-3.5 min-w-0">

              {/* PASO 1: SELECTOR DE PLANTILLA (6 tarjetas en grid 2x3 par en PC, carrusel en móvil) */}
              <section className="space-y-1.5 sm:space-y-2" aria-label="Selector de plantilla de campaña">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-white text-[10px] sm:text-[11px] font-black flex items-center justify-center shrink-0">
                      1
                    </span>
                    <label className="text-[11px] sm:text-[13px] font-black uppercase tracking-wider text-slate-800 truncate">
                      Selecciona la Campaña o Crea la Tuya
                    </label>
                  </div>

                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                    <span>5 plantillas + 1 personalizada</span>
                  </span>

                  <div className="flex lg:hidden items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/80">
                      {activeTemplateIndex + 1}/{templates.length}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!canScrollLeft}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border transition-colors flex items-center justify-center ${canScrollLeft
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 cursor-pointer active:scale-95'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                        title="Ver plantillas anteriores"
                        aria-label="Plantilla anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canScrollRight}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border transition-colors flex items-center justify-center ${canScrollRight
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 cursor-pointer active:scale-95'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                        title="Ver siguientes plantillas"
                        aria-label="Siguiente plantilla"
                      >
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contenedor Híbrido: Carrusel horizontal en móvil/tablet y Cuadrícula simétrica 2x3 en PC */}
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  className="share-store-carousel flex lg:grid lg:grid-cols-2 items-stretch gap-2 sm:gap-2.5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none py-0.5 px-0.5"
                >
                  {templates.map((tpl, idx) => {
                    const IconComponent = tpl.icon;
                    const isSelected = selectedTemplate === tpl.id;
                    const isCustomCard = Boolean(tpl.isCustomBuilder);

                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tpl.id);
                          scrollToTemplateIndex(idx);
                        }}
                        className={`share-template-card snap-start shrink-0 w-[82%] sm:w-[calc(50%-5px)] lg:w-auto relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left cursor-pointer flex flex-col justify-between gap-1 sm:gap-1.5 select-none group ${isSelected
                            ? isCustomCard
                              ? 'share-template-card--custom-active border-emerald-500 bg-emerald-50/75 ring-2 ring-emerald-400/35'
                              : 'share-template-card--active border-amber-500 bg-amber-50/75 ring-2 ring-amber-400/35'
                            : isCustomCard
                              ? 'border-emerald-200/90 bg-emerald-50/25 hover:border-emerald-300 hover:bg-emerald-50/50'
                              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                      >
                        <div className="flex items-start justify-between w-full gap-1.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${isSelected
                                  ? isCustomCard
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-500 text-white'
                                  : isCustomCard
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                                }`}
                            >
                              <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs sm:text-sm font-black tracking-tight block truncate ${isSelected
                                    ? isCustomCard
                                      ? 'text-emerald-950'
                                      : 'text-amber-950'
                                    : 'text-slate-900'
                                  }`}
                              >
                                {tpl.title}
                              </span>
                              <span
                                className={`text-[9.5px] sm:text-[10px] font-bold block truncate ${isSelected
                                    ? isCustomCard
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                    : isCustomCard
                                      ? 'text-emerald-600'
                                      : 'text-slate-400'
                                  }`}
                              >
                                {tpl.tag}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {tpl.badge && (
                              <span
                                className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 ${isCustomCard
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : 'bg-amber-100 text-amber-900 border-amber-300/80'
                                  }`}
                              >
                                {isCustomCard ? (
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-400" />
                                )}
                                <span>{tpl.badge}</span>
                              </span>
                            )}
                            {isSelected && (
                              <span
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-white flex items-center justify-center shrink-0 ${isCustomCard ? 'bg-emerald-600' : 'bg-amber-500'
                                  }`}
                                title="Plantilla activa"
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                        </div>

                        <p
                          className={`text-[10.5px] sm:text-[11px] leading-snug line-clamp-2 ${isSelected
                              ? isCustomCard
                                ? 'text-emerald-950/90 font-semibold'
                                : 'text-amber-950/90 font-semibold'
                              : 'text-slate-600'
                            }`}
                        >
                          {tpl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Puntos interactivos de navegación rápida (Solo en móvil/tablet donde hay carrusel) */}
                <div className="flex lg:hidden items-center justify-center gap-1.5">
                  {templates.map((tpl, idx) => {
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tpl.id);
                          scrollToTemplateIndex(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${isSelected
                            ? tpl.isCustomBuilder ? 'w-6 bg-emerald-600' : 'w-6 bg-amber-500'
                            : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                          }`}
                        title={`Seleccionar ${tpl.title}`}
                        aria-label={`Seleccionar plantilla ${tpl.title}`}
                      />
                    );
                  })}
                </div>
              </section>

              {/* PASO 2 DINÁMICO: Si es "Personalizada" muestra el Constructor con Botones de Enlaces del Sistema; si es estándar muestra Nota/Oferta */}
              {isCustomMode ? (
                <section className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50/40 p-2.5 sm:p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label
                      htmlFor="customTemplateTextarea"
                      className="text-[11px] sm:text-[13px] font-extrabold text-slate-800 flex items-center gap-1.5 min-w-0"
                    >
                      <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white text-[10px] sm:text-[11px] font-black flex items-center justify-center shrink-0">
                        2
                      </span>
                      <PenTool className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Diseña tu Plantilla Personalizada</span>
                    </label>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateCustomTemplateText(buildDefaultCustomTemplate());
                          showToast('Plantilla base restaurada con tus enlaces', 'info');
                        }}
                        className="text-[10px] sm:text-[11px] text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer px-2 py-0.5 rounded-md bg-white border border-emerald-200 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1"
                        title="Restaurar mensaje base con enlaces de tienda y ubicación"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Base con Links</span>
                      </button>
                      {customTemplateText && (
                        <button
                          type="button"
                          onClick={() => handleUpdateCustomTemplateText('')}
                          className="text-[10px] sm:text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors"
                        >
                          Vaciar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra de Enlaces y Datos de la Tienda ofrecidos por el Sistema para insertar con 1 clic */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Insertar enlaces y datos oficiales de tu tienda (1 clic):
                    </span>
                    <div className="share-store-chips-row flex lg:flex-wrap items-center gap-1.5 overflow-x-auto lg:overflow-visible py-0.5">
                      {smartInsertBlocks.map((block) => {
                        const BlockIcon = block.icon;
                        return (
                          <button
                            key={block.id}
                            type="button"
                            onClick={() => handleInsertSmartToken(block.snippet, block.label)}
                            className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1 active:scale-95 ${block.colorClass}`}
                            title={`Insertar ${block.label} en el mensaje`}
                          >
                            <Plus className="w-3 h-3 shrink-0" />
                            <BlockIcon className="w-3 h-3 shrink-0" />
                            <span>{block.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Editor de texto libre de la plantilla personalizada */}
                  <textarea
                    id="customTemplateTextarea"
                    ref={customTextareaRef}
                    rows={3}
                    value={customTemplateText}
                    onChange={(e) => handleUpdateCustomTemplateText(e.target.value)}
                    placeholder="Escribe aquí tu promoción o anuncio y toca los botones de arriba para insertar el link del catálogo, ubicación GPS o dirección..."
                    className="share-custom-textarea w-full text-xs sm:text-[12.5px] px-3 py-2 rounded-xl border border-emerald-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 leading-relaxed"
                  />
                </section>
              ) : (
                <section className="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-slate-50/70 p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="customPromoInput"
                      className="text-[11px] sm:text-[13px] font-extrabold text-slate-800 flex items-center gap-1.5 min-w-0"
                    >
                      <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] sm:text-[11px] font-black flex items-center justify-center shrink-0">
                        2
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Oferta o Nota de Hoy</span>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">(Opcional)</span>
                    </label>

                    {customPromo && (
                      <button
                        type="button"
                        onClick={() => setCustomPromo('')}
                        className="text-[10px] sm:text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-rose-50 transition-colors shrink-0"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <input
                    id="customPromoInput"
                    type="text"
                    value={customPromo}
                    onChange={(e) => setCustomPromo(e.target.value)}
                    placeholder="Ej: Coca-Cola 2L a Bs. 12 / Pan caliente 17:00 / Delivery gratis"
                    className="share-promo-input w-full text-xs sm:text-[13px] px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                  />

                  {/* Chips de sugerencias rápidas con 1 toque */}
                  <div className="share-store-chips-row flex lg:flex-wrap items-center gap-1.5 overflow-x-auto lg:overflow-visible pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">Ideas:</span>
                    {QUICK_PROMO_SUGGESTIONS.map((suggestion) => {
                      const isApplied = customPromo.trim() === suggestion;
                      return (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setCustomPromo(isApplied ? '' : suggestion)}
                          className={`text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${isApplied
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-900 border-slate-200'
                            }`}
                        >
                          + {suggestion}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* =========================================================== */}
            {/* COLUMNA DERECHA (PC: 5 cols): Vista Previa + Envío Directo  */}
            {/* =========================================================== */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-2.5 sm:gap-3 min-w-0">

              {/* SECCIÓN 3: PREVISUALIZACIÓN REALISTA DE WHATSAPP */}
              <section className="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white overflow-hidden flex flex-col flex-1">
                {/* Cabecera limpia de la vista previa */}
                <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-800 whitespace-nowrap">
                      Vista Previa
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/80 truncate">
                      {activeTemplate.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyFullMessage}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl font-extrabold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0 border active:scale-95 ${copiedMessage
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Ventana simulada de conversación de WhatsApp */}
                <div className="share-wa-chat-viewport p-2.5 sm:p-3.5 max-h-36 sm:max-h-52 lg:max-h-[260px] overflow-y-auto flex-1">
                  <div className="share-wa-bubble p-2.5 sm:p-3 text-[11.5px] sm:text-[12.5px] leading-relaxed font-sans max-w-[96%] ml-auto">
                    <div className="whitespace-pre-line text-slate-900 selection:bg-emerald-200">
                      {currentShareMessage}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-emerald-900/10 text-[9.5px] sm:text-[10px] font-semibold text-slate-500 select-none">
                      <span>{currentTimeFormatted}</span>
                      <CheckCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Barra de estado y prueba en vivo del marcador GPS en Google Maps */}
                <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${hasExactCoordinates ? 'text-emerald-600' : 'text-amber-500'}`} />
                    {hasExactCoordinates ? (
                      <span className="text-slate-600 font-semibold truncate">
                        Pin GPS exacto: <strong className="font-mono text-slate-800">{resolvedLat}, {resolvedLng}</strong>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold truncate">
                        Fija tu pin GPS en Configuración
                      </span>
                    )}
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
                    title="Abrir y verificar el marcador de la tienda en Google Maps"
                  >
                    <span>Probar Mapa</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </section>

              {/* BOTONES DE ENVÍO RÁPIDO (En PC quedan integrados en la columna derecha debajo de la vista previa) */}
              <div className="hidden lg:flex flex-col gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 shrink-0">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <span>Enviar a WhatsApp (Grupos o Estados)</span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="min-h-[38px] px-2.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                    title="Abrir menú nativo del dispositivo para compartir en otras aplicaciones"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">Otras Apps</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareTelegram}
                    className="min-h-[38px] px-2.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                    title="Compartir mensaje en Telegram"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="truncate">Telegram</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyUrlOnly}
                    className={`min-h-[38px] px-2.5 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 ${copiedUrl
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-slate-200/90 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    title="Copiar únicamente el enlace directo de la tienda"
                  >
                    {copiedUrl ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    <span className="truncate">{copiedUrl ? '¡Copiado!' : 'Solo Link'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 3. PIE DE MODAL FIJO (Compacto en Móvil con Safe Area)          */}
        {/* =============================================================== */}
        <footer className="px-3 py-2 sm:px-6 sm:py-3 bg-slate-50/95 border-t border-slate-200/80 space-y-1.5 sm:space-y-2 shrink-0">
          {/* En Móvil y Tablet (< lg) los botones de envío viven fijos en el footer */}
          <div className="lg:hidden space-y-1.5">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Enviar a WhatsApp (Grupos o Estados)</span>
            </button>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="min-h-[36px] sm:min-h-[40px] px-2 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                title="Abrir menú nativo del dispositivo para compartir en otras aplicaciones"
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">Otras Apps</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="min-h-[36px] sm:min-h-[40px] px-2 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-900 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                title="Compartir mensaje en Telegram"
              >
                <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrlOnly}
                className={`min-h-[36px] sm:min-h-[40px] px-2 py-1.5 rounded-xl border font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95 ${copiedUrl
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'border-slate-200/90 bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                title="Copiar únicamente el enlace directo de la tienda"
              >
                {copiedUrl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className="truncate">{copiedUrl ? '¡Copiado!' : 'Solo Link'}</span>
              </button>
            </div>
          </div>

          {/* Barra inferior con Tip y botón Cerrar */}
          <div className="flex items-center justify-between gap-2 pt-0.5 lg:pt-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-[10px] sm:text-xs text-slate-500 leading-tight truncate sm:whitespace-normal">
                <strong className="text-slate-700 font-bold">Tip:</strong> Publica cada mañana en tu estado de WhatsApp para activar ventas.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs transition-colors cursor-pointer shrink-0 active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};
