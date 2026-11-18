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
  CheckCheck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './ShareStoreModal.css';

const QUICK_PROMO_SUGGESTIONS = [
  'Coca-Cola 2L a Bs. 12',
  'Pan caliente recién horneado',
  'Delivery gratis hoy en compras > Bs. 60',
  'Leche y huevos frescos del día'
];

export const ShareStoreModal = ({ isOpen, onClose }) => {
  const { storeConfig, tenantSlug, showToast, isProPlan } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState('weekend');
  const [customPromo, setCustomPromo] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Control del carrusel deslizante en móvil / tablet (< lg) con rAF throttling sin re-renders innecesarios
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

  const storeName = storeConfig?.name || 'Mi Minimarket';
  const tenant = tenantSlug || 'default';

  // 1. Enlace directo a la tienda
  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?view=customer&store=${tenant}`
    : `https://marketsaas.com/?view=customer&store=${tenant}`;

  // 2. Ubicación en texto
  const addressText = storeConfig?.address?.trim() || storeConfig?.zone?.trim() || 'Dirección de la tienda';

  // 3. Enlace oficial de Google Maps
  const lat = storeConfig?.latitude !== '' && storeConfig?.latitude != null
    ? storeConfig.latitude
    : storeConfig?.googleMapsCoordinates?.lat;
  const lng = storeConfig?.longitude !== '' && storeConfig?.longitude != null
    ? storeConfig.longitude
    : storeConfig?.googleMapsCoordinates?.lng;

  const mapsUrl = (lat && lng)
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([storeName, addressText, 'Bolivia'].filter(Boolean).join(', '))}`;

  // 4. Catálogo de Plantillas de Marketing Vecinal
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
    }
  ], [storeName, storeUrl, addressText, mapsUrl]);

  const activeTemplateIndex = useMemo(() => {
    const idx = templates.findIndex(t => t.id === selectedTemplate);
    return idx >= 0 ? idx : 0;
  }, [templates, selectedTemplate]);

  const activeTemplate = templates[activeTemplateIndex] || templates[0];

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
  }, [selectedTemplate, customPromo]);

  // Manejadores de navegación del carrusel en móvil/tablet
  const handlePrev = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const card = container.firstElementChild;
    const scrollAmount = card ? (card.offsetWidth + 12) : (container.clientWidth * 0.5);
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    setTimeout(checkScrollability, 300);
  };

  const handleNext = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const card = container.firstElementChild;
    const scrollAmount = card ? (card.offsetWidth + 12) : (container.clientWidth * 0.5);
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
      className="share-store-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/70 select-none"
      onClick={onClose}
    >
      <div
        className="share-store-modal-card relative w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl bg-white border border-slate-200/90 rounded-3xl overflow-hidden text-slate-900 max-h-[94dvh] sm:max-h-[92vh] flex flex-col select-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-store-modal-title"
      >
        {/* =============================================================== */}
        {/* 1. CABECERA FIJA (Sticky Header)                                */}
        {/* =============================================================== */}
        <header className="px-4 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 border-b border-slate-200/80 flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0 mt-0.5 sm:mt-0">
              <Megaphone className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="share-store-modal-title"
                  className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight leading-snug"
                >
                  Marketing & Difusión Vecinal
                </h2>

                {isProPlan ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs shrink-0">
                    <Crown className="w-3 h-3 text-amber-600 fill-amber-400" />
                    <span>Pack PRO Activo</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Difusión Digital</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2 sm:line-clamp-1">
                Plantillas listas para estados y grupos de WhatsApp de{' '}
                <strong className="text-slate-900 font-extrabold">{storeName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
            title="Cerrar ventana (Esc)"
            aria-label="Cerrar modal de marketing"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* =============================================================== */}
        {/* 2. CUERPO PRINCIPAL (Stack en Móvil/Tablet | 2 Columnas en PC)  */}
        {/* =============================================================== */}
        <div className="share-store-modal-body overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-5 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">

            {/* =========================================================== */}
            {/* COLUMNA IZQUIERDA (PC: 7 cols): Plantillas + Nota de Oferta */}
            {/* =========================================================== */}
            <div className="lg:col-span-7 space-y-4 min-w-0">

              {/* PASO 1: SELECTOR DE PLANTILLA (Carrusel en Móvil/Tablet | Grid completo en PC) */}
              <section className="space-y-2.5" aria-label="Selector de plantilla de campaña">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                      1
                    </span>
                    <label className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-slate-800 truncate">
                      Selecciona la Campaña o Plantilla
                    </label>
                  </div>

                  {/* En PC se ven las 5 plantillas al mismo tiempo; en móvil/tablet se muestran flechas de carrusel */}
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/80">
                    <span>{templates.length} plantillas disponibles</span>
                  </span>

                  <div className="flex lg:hidden items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
                      {activeTemplateIndex + 1} / {templates.length}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!canScrollLeft}
                        className={`w-8 h-8 rounded-xl border transition-all flex items-center justify-center ${
                          canScrollLeft
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs cursor-pointer active:scale-95'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                        }`}
                        title="Ver plantillas anteriores"
                        aria-label="Plantilla anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canScrollRight}
                        className={`w-8 h-8 rounded-xl border transition-all flex items-center justify-center ${
                          canScrollRight
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs cursor-pointer active:scale-95'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                        }`}
                        title="Ver siguientes plantillas"
                        aria-label="Siguiente plantilla"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contenedor Híbrido: Carrusel horizontal en móvil/tablet (`flex overflow-x-auto`) y Cuadrícula completa en PC (`lg:grid lg:grid-cols-2`) */}
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  className="share-store-carousel flex lg:grid lg:grid-cols-2 items-stretch gap-2.5 sm:gap-3 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none py-1 px-0.5 touch-pan-x"
                >
                  {templates.map((tpl, idx) => {
                    const IconComponent = tpl.icon;
                    const isSelected = selectedTemplate === tpl.id;
                    const isLastOdd = idx === templates.length - 1 && templates.length % 2 !== 0;

                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tpl.id);
                          scrollToTemplateIndex(idx);
                        }}
                        className={`share-template-card snap-start shrink-0 w-[85%] sm:w-[calc(50%-6px)] lg:w-auto ${
                          isLastOdd ? 'lg:col-span-2' : ''
                        } min-h-[100px] lg:min-h-[88px] relative p-3 sm:p-3.5 rounded-2xl border text-left cursor-pointer flex flex-col justify-between gap-2 select-none group ${
                          isSelected
                            ? 'share-template-card--active border-amber-500 bg-gradient-to-br from-amber-50/95 via-amber-50/40 to-white ring-2 ring-amber-400/35'
                            : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                              }`}
                            >
                              <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs sm:text-sm font-black tracking-tight block truncate ${
                                  isSelected ? 'text-amber-950' : 'text-slate-900'
                                }`}
                              >
                                {tpl.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold block truncate ${
                                  isSelected ? 'text-amber-700' : 'text-slate-400'
                                }`}
                              >
                                {tpl.tag}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {tpl.badge && (
                              <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/80 flex items-center gap-0.5 shadow-2xs">
                                <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-400" />
                                <span>{tpl.badge}</span>
                              </span>
                            )}
                            {isSelected && (
                              <span
                                className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0"
                                title="Plantilla activa"
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                        </div>

                        <p
                          className={`text-[11px] sm:text-xs leading-snug line-clamp-2 ${
                            isSelected ? 'text-amber-950/90 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          {tpl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Puntos interactivos de navegación rápida (Solo en móvil/tablet donde hay carrusel) */}
                <div className="flex lg:hidden items-center justify-center gap-1.5 pt-0.5">
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
                        className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'w-7 bg-amber-500 shadow-2xs'
                            : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                        title={`Seleccionar ${tpl.title}`}
                        aria-label={`Seleccionar plantilla ${tpl.title}`}
                      />
                    );
                  })}
                </div>
              </section>

              {/* PASO 2: CAMPO OPCIONAL DE OFERTA / DESTACADO DEL DÍA */}
              <section className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="customPromoInput"
                    className="text-xs sm:text-[13px] font-extrabold text-slate-800 flex items-center gap-1.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-black flex items-center justify-center shrink-0">
                      2
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Oferta o Nota Destacada de Hoy</span>
                    <span className="text-[10px] font-semibold text-slate-400">(Opcional)</span>
                  </label>

                  {customPromo && (
                    <button
                      type="button"
                      onClick={() => setCustomPromo('')}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer px-2 py-0.5 rounded-md hover:bg-rose-50 transition-colors"
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
                  placeholder="Ej: Coca-Cola 2L a Bs. 12 / Pan caliente a las 17:00 / Delivery gratis hoy"
                  className="w-full text-xs sm:text-[13px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-2xs"
                />

                {/* Chips de sugerencias rápidas con 1 toque (Wrap completo en PC, scroll en móvil) */}
                <div className="share-store-chips-row flex lg:flex-wrap items-center gap-1.5 overflow-x-auto lg:overflow-visible pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0 mr-0.5">Ideas rápidas:</span>
                  {QUICK_PROMO_SUGGESTIONS.map((suggestion) => {
                    const isApplied = customPromo.trim() === suggestion;
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setCustomPromo(isApplied ? '' : suggestion)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isApplied
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-900 border-slate-200'
                        }`}
                      >
                        + {suggestion}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* =========================================================== */}
            {/* COLUMNA DERECHA (PC: 5 cols): Vista Previa + Envío Directo  */}
            {/* =========================================================== */}
            <div className="lg:col-span-5 flex flex-col gap-3.5 min-w-0">

              {/* SECCIÓN 3: PREVISUALIZACIÓN REALISTA DE WHATSAPP */}
              <section className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs flex flex-col">
                {/* Cabecera limpia de la vista previa */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-800 truncate">
                      Vista Previa WhatsApp
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                      {activeTemplate.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyFullMessage}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0 border shadow-2xs active:scale-95 ${
                      copiedMessage
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Ventana simulada de conversación de WhatsApp (En PC es más alta para ver todo el mensaje sin scroll interno apretado) */}
                <div className="share-wa-chat-viewport p-3 sm:p-4 max-h-52 sm:max-h-60 lg:max-h-[320px] overflow-y-auto">
                  <div className="share-wa-bubble p-3 sm:p-3.5 text-xs sm:text-[13px] leading-relaxed font-sans max-w-[96%] ml-auto">
                    <div className="whitespace-pre-line text-slate-900 selection:bg-emerald-200">
                      {currentShareMessage}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1.5 pt-1 border-t border-emerald-900/10 text-[10px] font-semibold text-slate-500 select-none">
                      <span>{currentTimeFormatted}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    </div>
                  </div>
                </div>
              </section>

              {/* BOTONES DE ENVÍO RÁPIDO (En PC quedan integrados en la columna derecha debajo de la vista previa) */}
              <div className="hidden lg:flex flex-col gap-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <span>Enviar a WhatsApp (Grupos o Estados)</span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="min-h-[40px] px-2.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors active:scale-95"
                    title="Abrir menú nativo del dispositivo para compartir en otras aplicaciones"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">Otras Apps</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareTelegram}
                    className="min-h-[40px] px-2.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors active:scale-95"
                    title="Compartir mensaje en Telegram"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="truncate">Telegram</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyUrlOnly}
                    className={`min-h-[40px] px-2.5 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors active:scale-95 ${
                      copiedUrl
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
        {/* 3. PIE DE MODAL FIJO (Sticky Footer)                            */}
        {/* =============================================================== */}
        <footer className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-50/95 border-t border-slate-200/80 space-y-2.5 shrink-0">
          {/* En Móvil y Tablet (< lg) los botones de envío viven fijos en el footer para acceso con el pulgar */}
          <div className="lg:hidden space-y-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <MessageCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" />
              <span>Enviar a WhatsApp (Grupos o Estados)</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="min-h-[40px] px-2.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors active:scale-95"
                title="Abrir menú nativo del dispositivo para compartir en otras aplicaciones"
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">Otras Apps</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="min-h-[40px] px-2.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-900 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors active:scale-95"
                title="Compartir mensaje en Telegram"
              >
                <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrlOnly}
                className={`min-h-[40px] px-2.5 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors active:scale-95 ${
                  copiedUrl
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

          {/* Barra inferior con Tip completo y botón Cerrar */}
          <div className="flex items-center justify-between gap-3 pt-1.5 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
            <div className="flex items-start sm:items-center gap-1.5 min-w-0 flex-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <p className="text-[10px] sm:text-xs text-slate-500 leading-snug">
                <strong className="text-slate-700 font-bold">Tip:</strong> Publica una plantilla cada mañana en tu estado de WhatsApp para activar pedidos del barrio.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shrink-0 active:scale-95"
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
