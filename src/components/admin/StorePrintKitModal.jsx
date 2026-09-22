import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  X, 
  QrCode, 
  Download, 
  Sparkles, 
  ShoppingBag, 
  Smartphone, 
  CheckCircle2, 
  Share2, 
  Copy,
  Store,
  MapPin,
  Phone
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './StorePrintKitModal.css';

export const StorePrintKitModal = ({ isOpen, onClose }) => {
  const { storeConfig, tenantSlug, showToast } = useStore();
  const [selectedFormat, setSelectedFormat] = useState('poster_a4'); // 'poster_a4' | 'counter_tent' | 'flyers_pocket'
  const [customTagline, setCustomTagline] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const printAreaRef = useRef(null);

  // Bloquear el scroll del fondo (tablero Kanban / body) mientras el modal esté abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const storeName = storeConfig?.name || 'Mi Minimarket';
  const defaultTagline = storeConfig?.tagline || '¡Pide desde tu casa sin hacer filas ni esperar!';
  const activeTagline = customTagline.trim() || defaultTagline;
  const storePhone = storeConfig?.whatsapp || storeConfig?.phone || '';
  const storeAddress = storeConfig?.address || '';
  const storeLogo = storeConfig?.logoUrl || storeConfig?.logo || '';

  // URL canónica para el código QR
  const storeUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.origin);
      if (tenantSlug && tenantSlug !== 'default') {
        url.searchParams.set('store', tenantSlug);
      }
      return url.toString();
    }
    return `https://marketsaas.shop/?store=${tenantSlug}`;
  }, [tenantSlug]);

  // Generador de QR en alta definición (600x600 px)
  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(storeUrl)}&margin=12&format=png`;
  }, [storeUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopiedLink(true);
      showToast('Enlace de tu tienda copiado al portapapeles.', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {
      showToast('No se pudo copiar el enlace.', 'warning');
    });
  };

  const handleDownloadQR = async () => {
    try {
      showToast('Preparando descarga de imagen QR...', 'info');
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR-Tienda-${tenantSlug || 'MarketSaaS'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('¡Imagen del código QR descargada con éxito!', 'success');
    } catch (e) {
      window.open(qrCodeUrl, '_blank');
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn print-kit-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[92dvh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden print-kit-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera Interactiva (Se oculta al imprimir) */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0 no-print">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">Kit Imprimible de Mostrador & QR</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-black uppercase shrink-0">
                  Listo en Carta / A4
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                Pega este cartel en tu vitrina o caja para que tus vecinos escaneen y pidan desde sus casas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Imprimir Cartel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Formatos & Acciones Secundarias (no-print) */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0 no-print">
          {/* Selector de formato */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 scrollbar-none">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Formato:</span>
            <button
              type="button"
              onClick={() => setSelectedFormat('poster_a4')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedFormat === 'poster_a4'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📄 Cartel de Vitrina (Carta / A4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('counter_tent')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedFormat === 'counter_tent'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📐 Carpa para Mostrador / Caja
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('flyers_pocket')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedFormat === 'flyers_pocket'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🎟️ Volantes Vecinos (4 en 1 hoja)
            </button>
          </div>

          {/* Botones de enlace y descarga directa del QR */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Descargar Imagen QR</span>
            </button>
          </div>
        </div>

        {/* Área Visual Previa / Impresión (print-canvas-area) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-8 bg-slate-100/80 flex justify-center items-start print-page-wrapper">
          
          {/* ================================================================= */}
          {/* FORMATO 1: PÓSTER DE VITRINA (Carta / A4 Vertical 1 Sola Hoja)   */}
          {/* ================================================================= */}
          {selectedFormat === 'poster_a4' && (
            <div 
              ref={printAreaRef}
              className="print-page print-poster-a4 bg-white w-full max-w-[600px] aspect-auto sm:aspect-[1/1.38] rounded-2xl shadow-xl border border-slate-200/90 p-4 sm:p-8 flex flex-col justify-between text-center relative"
            >
              {/* Marco de diseño elegante superior */}
              <div className="space-y-2.5 sm:space-y-3.5 print:space-y-2">
                {/* Logo o Icono de la Tienda */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-3 print:gap-2.5">
                  {storeLogo ? (
                    <img 
                      src={storeLogo} 
                      alt={storeName} 
                      className="w-12 h-12 sm:w-16 sm:h-16 print:w-12 print:h-12 object-contain rounded-2xl border border-slate-100 p-1 shadow-xs" 
                    />
                  ) : (
                    <div className="w-11 h-11 sm:w-14 sm:h-14 print:w-12 print:h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <Store className="w-6 h-6 sm:w-8 sm:h-8 print:w-7 print:h-7" />
                    </div>
                  )}
                  <div className="text-left">
                    <span className="text-[10px] sm:text-[11px] print:text-[10px] font-black uppercase tracking-widest text-emerald-600 block">
                      Catálogo Online & Delivery
                    </span>
                    <h1 className="text-xl sm:text-3xl print:text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {storeName}
                    </h1>
                  </div>
                </div>

                {/* Frase Gancho / Titular */}
                <div className="bg-slate-900 text-white py-2 sm:py-3 print:py-2 px-4 sm:px-6 print:px-4 rounded-2xl shadow-md">
                  <p className="text-sm sm:text-xl print:text-base font-black tracking-tight leading-snug">
                    {activeTagline}
                  </p>
                  <p className="text-[11px] sm:text-xs print:text-[10px] text-emerald-400 font-extrabold mt-0.5">
                    ¡Abre la cámara de tu celular y escanea este código!
                  </p>
                </div>
              </div>

              {/* Código QR Central con Marco Nítido */}
              <div className="my-2 sm:my-4 print:my-2 flex flex-col items-center justify-center">
                <div className="p-2.5 sm:p-4 print:p-3 bg-white rounded-3xl border-4 border-emerald-600 shadow-xl relative">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR de ${storeName}`} 
                    className="w-40 h-40 sm:w-52 sm:h-52 print:w-44 print:h-44 object-contain"
                  />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] sm:text-[11px] print:text-[10px] font-black uppercase tracking-wider px-3 py-0.5 sm:py-1 rounded-full shadow-md whitespace-nowrap">
                    ESCANEA CON TU CELULAR
                  </div>
                </div>
              </div>

              {/* 3 Pasos Rápidos para el Vecino */}
              <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2 sm:gap-3 print:gap-2 my-2 print:my-1.5 text-left">
                <div className="bg-slate-50 p-2 sm:p-2.5 print:p-2 rounded-2xl border border-slate-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-xs print:text-[11px] font-black text-slate-900 block leading-tight">Apunta tu cámara</strong>
                    <span className="text-[10px] print:text-[9px] text-slate-500 leading-tight block">Sin apps, abre en el navegador.</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 sm:p-2.5 print:p-2 rounded-2xl border border-slate-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-xs print:text-[11px] font-black text-slate-900 block leading-tight">Elige tus cosas</strong>
                    <span className="text-[10px] print:text-[9px] text-slate-500 leading-tight block">Leche, pan, bebidas, abarrotes y snacks.</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2 sm:p-2.5 print:p-2 rounded-2xl border border-slate-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-xs print:text-[11px] font-black text-slate-900 block leading-tight">¡Listo!</strong>
                    <span className="text-[10px] print:text-[9px] text-slate-500 leading-tight block">Orden lista para recoger o delivery.</span>
                  </div>
                </div>
              </div>

              {/* Pie de Página con Datos del Local */}
              <div className="border-t border-slate-200/80 pt-2 sm:pt-3 print:pt-2 mt-1 print:mt-1 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-1.5 text-xs print:text-[10px] text-slate-600 font-semibold">
                {storePhone ? (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 print:w-3 print:h-3 text-emerald-600 shrink-0" />
                    <span>WhatsApp Pedidos: <strong>{storePhone}</strong></span>
                  </div>
                ) : (
                  <span>Atención rápida a todo el condominio</span>
                )}

                {storeAddress ? (
                  <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                    <MapPin className="w-3.5 h-3.5 print:w-3 print:h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{storeAddress}</span>
                  </div>
                ) : (
                  <span>Tu minimarket de confianza</span>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* FORMATO 2: CARPA PARA MOSTRADOR / CAJA (A5 Apaisado)              */}
          {/* ================================================================= */}
          {selectedFormat === 'counter_tent' && (
            <div 
              ref={printAreaRef}
              className="print-page print-counter-tent bg-white w-full max-w-[700px] rounded-2xl shadow-xl border border-slate-200/90 p-4 sm:p-7 flex flex-col sm:flex-row print:flex-row items-center gap-4 sm:gap-6 text-left relative"
            >
              {/* Código QR a la Izquierda */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="p-2.5 sm:p-3 bg-white rounded-2xl border-4 border-slate-900 shadow-md">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR de ${storeName}`} 
                    className="w-36 h-36 sm:w-48 sm:h-48 print:w-40 print:h-40 object-contain"
                  />
                </div>
                <span className="text-[11px] print:text-[10px] font-black uppercase text-emerald-700 mt-2 block tracking-wider">
                  ¡Haz tu pedido online!
                </span>
              </div>

              {/* Contenido a la Derecha */}
              <div className="flex-1 space-y-2.5 print:space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl print:text-xl font-black text-slate-900 leading-tight">
                      {storeName}
                    </h2>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Tienda Digital & Pedidos Rápidos
                    </span>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 print:p-2.5 bg-slate-900 text-white rounded-xl">
                  <p className="text-sm sm:text-base print:text-sm font-extrabold leading-snug">
                    ¿Mucho frío o sin tiempo para bajar?
                  </p>
                  <p className="text-xs print:text-[11px] text-emerald-400 font-bold mt-0.5">
                    Escanea este QR y te lo llevamos directamente a tu departamento.
                  </p>
                </div>

                <div className="space-y-1 text-xs print:text-[11px] text-slate-600 font-medium">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Catálogo completo con precios actualizados.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Pagas por QR o en efectivo cuando lo recibas.</span>
                  </p>
                  {storePhone && (
                    <p className="flex items-center gap-2 font-bold text-slate-800">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>WhatsApp: {storePhone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* FORMATO 3: 4 VOLANTES EN 1 HOJA (Para recortar y repartir)       */}
          {/* ================================================================= */}
          {selectedFormat === 'flyers_pocket' && (
            <div 
              ref={printAreaRef}
              className="print-page print-flyers-pocket bg-white w-full max-w-[600px] aspect-auto sm:aspect-[1/1.38] rounded-2xl shadow-xl border border-slate-200/90 p-3 sm:p-5 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 sm:gap-3.5 text-center"
            >
              {[1, 2, 3, 4].map(idx => (
                <div 
                  key={idx} 
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-2.5 sm:p-3.5 flex flex-col justify-between items-center bg-slate-50/50 print:bg-white"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block">
                      {storeName}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                      ¡Pide desde tu casa!
                    </h3>
                  </div>

                  <div className="my-1.5 p-1.5 bg-white rounded-xl border-2 border-emerald-600 shadow-xs">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR" 
                      className="w-20 h-20 sm:w-24 sm:h-24 print:w-20 print:h-20 object-contain"
                    />
                  </div>

                  <div className="space-y-0.5 text-[10px] print:text-[9px] text-slate-600 font-semibold leading-tight">
                    <p className="text-emerald-700 font-black">Escanea con tu celular</p>
                    <p>Listo para recoger o enviar</p>
                    {storePhone && <p className="font-bold text-slate-800 truncate max-w-[140px]">Tel: {storePhone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
