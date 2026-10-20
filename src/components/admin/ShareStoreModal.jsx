import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  MapPin, 
  Store, 
  Smartphone, 
  MessageCircle, 
  Send, 
  Sparkles,
  Navigation,
  Crown,
  Flame,
  Zap,
  Coffee,
  Package,
  Megaphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ShareStoreModal = ({ isOpen, onClose }) => {
  const { storeConfig, tenantSlug, showToast, isProPlan } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState('weekend');
  const [customPromo, setCustomPromo] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Control del carrusel deslizante de opciones de campaña (1 o 2 visibles a la vez)
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
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
      icon: Flame,
      badge: 'PRO',
      description: 'Ofertas para estados y grupos vecinales (viernes a domingo)',
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
      icon: Package,
      badge: 'PRO',
      description: 'Aviso de llegada de productos frescos o reposición',
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
      icon: Zap,
      badge: 'PRO',
      description: 'Enfocado en comodidad, ahorro de tiempo y entregas',
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
      icon: Coffee,
      badge: 'PRO',
      description: 'Mensaje matutino para estados de WhatsApp (pan fresco y desayuno)',
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
      icon: Store,
      badge: null,
      description: 'Mensaje institucional estándar para nuevos clientes',
      buildText: (promo) => 
        `🏪 *${storeName}*\n\n` +
        `🛒 Haz tus pedidos en línea desde nuestro catálogo virtual:\n${storeUrl}\n` +
        (promo ? `\n⭐ ${promo}\n` : '') +
        `\n📍 *Ubicación:* ${addressText}\n` +
        `🗺️ *Cómo llegar (Google Maps):*\n${mapsUrl}\n\n` +
        `¡Te esperamos con los brazos abiertos! ✨`
    }
  ], [storeName, storeUrl, addressText, mapsUrl]);

  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplate) || templates[0];
  }, [templates, selectedTemplate]);

  // Mensaje actual generado
  const currentShareMessage = useMemo(() => {
    return activeTemplate.buildText(customPromo.trim());
  }, [activeTemplate, customPromo]);

  const activeTemplateIndex = useMemo(() => {
    const idx = templates.findIndex(t => t.id === selectedTemplate);
    return idx >= 0 ? idx : 0;
  }, [templates, selectedTemplate]);

  // Manejadores de navegación del carrusel de plantillas (1 o 2 visibles a la vez)
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm overscroll-contain select-none animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-6 text-slate-900 animate-scale-up max-h-[94vh] sm:max-h-[90vh] flex flex-col overscroll-contain select-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado con Botón Cerrar */}
        <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Megaphone className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Marketing & Difusión Vecinal
                </h3>
                {isProPlan ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                    <Crown className="w-3 h-3 text-amber-600 fill-amber-400" />
                    <span>Pack PRO Activo</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    Difusión
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Plantillas optimizadas para compartir en estados y grupos de WhatsApp de <strong className="text-slate-800 font-bold">{storeName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenedor con Scroll */}
        <div className="overflow-y-auto overscroll-contain custom-sidebar-scroll space-y-3.5 pr-0.5 sm:pr-1 flex-1">
          {/* Selector de Plantillas / Campañas en Carrusel Deslizante (1 o 2 opciones visibles) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="flex items-center gap-2">
                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500">
                  1. Selecciona la Campaña o Plantilla:
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {activeTemplateIndex + 1} de {templates.length}
                </span>
              </div>

              {/* Botones Flechas de Desplazamiento */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!canScrollLeft}
                  className={`w-7 h-7 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    canScrollLeft 
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs hover:scale-105 active:scale-95' 
                      : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-40'
                  }`}
                  title="Ver opciones anteriores"
                  aria-label="Opción anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canScrollRight}
                  className={`w-7 h-7 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                    canScrollRight 
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs hover:scale-105 active:scale-95' 
                      : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-40'
                  }`}
                  title="Ver siguientes opciones"
                  aria-label="Siguiente opción"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fila Desplazable de Plantillas (1 visible en móvil con peek, 2 visibles en PC) */}
            <div
              ref={carouselRef}
              onScroll={checkScrollability}
              className="flex items-stretch gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 scrollbar-none touch-pan-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {templates.map((tpl, idx) => {
                const IconComponent = tpl.icon;
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(tpl.id);
                      scrollToTemplateIndex(idx);
                    }}
                    className={`snap-start shrink-0 w-[84%] sm:w-[calc(50%-5px)] relative p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 select-none group ${
                      isSelected 
                        ? 'border-amber-500 bg-linear-to-br from-amber-50/95 via-amber-100/40 to-white shadow-md ring-2 ring-amber-400/40 scale-[1.005]' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          isSelected ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs sm:text-sm font-black tracking-tight truncate block ${
                            isSelected ? 'text-amber-950' : 'text-slate-800'
                          }`}>
                            {tpl.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {tpl.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/80 flex items-center gap-0.5 shadow-2xs">
                            <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-400" />
                            <span>{tpl.badge}</span>
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Seleccionada"></span>
                        )}
                      </div>
                    </div>

                    <p className={`text-[11px] leading-snug line-clamp-1 ${
                      isSelected ? 'text-amber-900/80 font-medium' : 'text-slate-500'
                    }`}>
                      {tpl.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Puntos interactivos de navegación rápida */}
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
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
                    className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'w-6 bg-amber-500 shadow-2xs' 
                        : 'w-1.5 bg-slate-200 hover:bg-slate-400'
                    }`}
                    title={`Ver ${tpl.title}`}
                    aria-label={`Ver ${tpl.title}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Campo Opcional: Detalle de Oferta / Destacado */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <label htmlFor="customPromoInput" className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Agregar Oferta o Nota Especial (Opcional):</span>
              </label>
              {customPromo && (
                <button
                  type="button"
                  onClick={() => setCustomPromo('')}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
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
              placeholder="Ej: Coca-Cola 2L a Bs. 12 / Pan caliente a las 5pm / Envío gratis hoy"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Tarjeta de Previsualización del Mensaje */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-4 relative space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Previsualización de WhatsApp
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  • {activeTemplate.description}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyFullMessage}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
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

            <div className="bg-emerald-950/5 border border-emerald-900/10 p-3 sm:p-3.5 rounded-xl font-mono text-[11px] sm:text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto selection:bg-emerald-200">
              {currentShareMessage}
            </div>
          </div>

          {/* Botones de Envío Rápido */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full p-3 sm:p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Enviar a WhatsApp (Grupos o Estados)</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Abrir menú nativo del celular para compartir en otras apps"
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                <span className="truncate">Otras Apps</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Compartir por Telegram"
              >
                <Send className="w-3.5 h-3.5 text-blue-500" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleCopyUrlOnly}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                title="Copiar únicamente el enlace de la tienda"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-600" />}
                <span className="truncate">{copiedUrl ? '¡Copiado!' : 'Solo Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-slate-100 text-xs text-slate-400 shrink-0">
          <span className="text-[10px] sm:text-[11px] text-slate-400 truncate pr-2">
            💡 Tip: Publica la plantilla en tu estado de WhatsApp cada mañana para activar ventas.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
