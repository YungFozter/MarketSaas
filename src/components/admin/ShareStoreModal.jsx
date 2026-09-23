import React, { useState } from 'react';
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
  Navigation
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ShareStoreModal = ({ isOpen, onClose }) => {
  const { storeConfig, tenantSlug, showToast } = useStore();
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const storeName = storeConfig?.name || 'Mi Minimarket';
  const tenant = tenantSlug || 'default';

  // 1. Enlace directo a la tienda
  const storeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?view=customer&store=${tenant}`
    : `https://marketsaas.com/?view=customer&store=${tenant}`;

  // 2. Ubicación en texto
  const addressText = storeConfig?.address?.trim() || storeConfig?.zone?.trim() || 'Dirección de la tienda';

  // 3. Enlace oficial de Google Maps (coordenadas exactas o consulta de dirección)
  const lat = storeConfig?.latitude !== '' && storeConfig?.latitude != null 
    ? storeConfig.latitude 
    : storeConfig?.googleMapsCoordinates?.lat;
  const lng = storeConfig?.longitude !== '' && storeConfig?.longitude != null 
    ? storeConfig.longitude 
    : storeConfig?.googleMapsCoordinates?.lng;

  const mapsUrl = (lat && lng)
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([storeName, addressText, 'Bolivia'].filter(Boolean).join(', '))}`;

  // 4. Mensaje formateado completo
  const shareTitle = `¡Conoce ${storeName}!`;
  const shareMessage = `🏪 *${storeName}*\n\n🛒 Haz tus pedidos en línea desde nuestro catálogo virtual:\n${storeUrl}\n\n📍 *Ubicación:* ${addressText}\n🗺️ *Cómo llegar (Google Maps):*\n${mapsUrl}\n\n¡Te esperamos! ✨`;

  // Manejador del Web Share API (Elegir aplicación nativa del dispositivo: WhatsApp, Telegram, Gmail, etc.)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareMessage,
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
      showToast('Tu navegador no admite menú nativo. Mensaje copiado al portapapeles para pegar en tu app.', 'info');
    }
  };

  // Manejador Copiar Mensaje Completo
  const handleCopyFullMessage = () => {
    try {
      navigator.clipboard.writeText(shareMessage);
      setCopiedMessage(true);
      showToast('¡Mensaje completo copiado al portapapeles!', 'success');
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch (e) {
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
    } catch (e) {
      showToast('No se pudo copiar el enlace.', 'error');
    }
  };

  // Compartir en WhatsApp
  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(shareMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Compartir en Telegram
  const handleShareTelegram = () => {
    const encodedText = encodeURIComponent(shareMessage);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-6 text-slate-900 animate-scale-up max-h-[92vh] sm:max-h-[88vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado con Botón Cerrar */}
        <div className="flex items-center justify-between gap-3 mb-3.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
              <Share2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                  Compartir Tienda
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  Difusión
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Elige el medio o aplicación para enviar los datos de <strong className="text-slate-800 font-bold">{storeName}</strong>
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

        {/* Contenedor con Scroll para contenidos */}
        <div className="overflow-y-auto space-y-3.5 pr-0.5 sm:pr-1 flex-1">
          {/* Botón Principal: Abrir Selector Nativo del Dispositivo */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full p-3 sm:p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Elegir Medio / Aplicación del Dispositivo</span>
          </button>

          {/* Tarjeta de Previsualización del Mensaje */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:p-4 relative space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Mensaje a Compartir
              </span>
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
                    <span>Copiar Todo</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-2 font-sans bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {storeConfig?.logoUrl ? (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center p-0.5">
                    <img 
                      src={storeConfig.logoUrl} 
                      alt={storeName} 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Store className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm block truncate">{storeName}</span>
                  {storeConfig?.tagline && (
                    <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">{storeConfig.tagline}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 shrink-0 text-xs">🛒</span>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-800 block text-[11px]">Catálogo y Pedidos:</span>
                  <a 
                    href={storeUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-emerald-700 hover:underline break-all block text-[11px] font-mono font-semibold mt-0.5"
                  >
                    {storeUrl}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-800 block text-[11px]">Ubicación:</span>
                  <span className="text-slate-600 block text-[11px] leading-relaxed">{addressText}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-slate-800 block text-[11px]">Ver en Google Maps:</span>
                  <a 
                    href={mapsUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5"
                  >
                    <span>Abrir Ubicación en Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="pt-1.5 text-center text-emerald-800 font-extrabold text-xs">
                ✨ ¡Te esperamos! ✨
              </div>
            </div>
          </div>

          {/* Opciones Rápidas de Aplicación */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              O elige un canal directo
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer group shadow-2xs"
                title="Compartir por WhatsApp"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-700">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleShareTelegram}
                className="p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-500 hover:bg-blue-50/40 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer group shadow-2xs"
                title="Compartir por Telegram"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-700">Telegram</span>
              </button>

              {/* Copiar Texto */}
              <button
                type="button"
                onClick={handleCopyFullMessage}
                className="p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-400 hover:bg-slate-50 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer group shadow-2xs"
                title="Copiar texto completo"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-bold text-slate-700">
                  {copiedMessage ? '¡Copiado!' : 'Copiar Texto'}
                </span>
              </button>

              {/* Copiar Enlace */}
              <button
                type="button"
                onClick={handleCopyUrlOnly}
                className="p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-400 hover:bg-slate-50 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer group shadow-2xs"
                title="Copiar solo el enlace web"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-bold text-slate-700">
                  {copiedUrl ? '¡Copiado!' : 'Solo Enlace'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="flex items-center justify-between pt-3 mt-2.5 border-t border-slate-100 text-xs text-slate-400 shrink-0">
          <span className="text-[10px] sm:text-[11px] text-slate-400 truncate pr-2">
            Tus clientes abrirán el catálogo directamente en su navegador.
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
