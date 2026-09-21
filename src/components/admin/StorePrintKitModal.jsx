import React, { useState, useMemo, useRef } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn print-kit-modal-overlay">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden print-kit-modal-content">
        
        {/* Cabecera Interactiva (Se oculta al imprimir) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Kit Imprimible de Mostrador & QR</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Listo en A4
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pega este cartel en tu vitrina o caja para que tus vecinos escaneen y pidan desde sus casas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Cartel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Formatos & Acciones Secundarias (no-print) */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 no-print">
          {/* Selector de formato */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Formato:</span>
            <button
              type="button"
              onClick={() => setSelectedFormat('poster_a4')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFormat === 'poster_a4'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📄 Cartel de Vitrina (A4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('counter_tent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFormat === 'flyers_pocket'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🎟️ Volantes Vecinos (4 en 1 hoja)
            </button>
          </div>

          {/* Botones de enlace y descarga directa del QR */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Descargar Imagen QR</span>
            </button>
          </div>
        </div>

        {/* Área Visual Previa / Impresión (print-canvas-area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 flex justify-center items-start print-page-wrapper">
          
          {/* ================================================================= */}
          {/* FORMATO 1: PÓSTER DE VITRINA A4 (Vertical) */}
          {/* ================================================================= */}
          {selectedFormat === 'poster_a4' && (
            <div 
              ref={printAreaRef}
              className="print-page print-poster-a4 bg-white w-full max-w-[620px] aspect-[1/1.414] rounded-2xl shadow-xl border border-slate-200/90 p-8 sm:p-12 flex flex-col justify-between text-center relative overflow-hidden"
            >
              {/* Marco de diseño elegante superior */}
              <div className="space-y-4">
                {/* Logo o Icono de la Tienda */}
                <div className="flex items-center justify-center gap-3">
                  {storeLogo ? (
                    <img 
                      src={storeLogo} 
                      alt={storeName} 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl border border-slate-100 p-1 shadow-xs" 
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <Store className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                  )}
                  <div className="text-left">
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 block">
                      Catálogo Online & Delivery
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                      {storeName}
                    </h1>
                  </div>
                </div>

                {/* Frase Gancho / Titular */}
                <div className="bg-slate-900 text-white py-3.5 px-6 rounded-2xl shadow-md">
                  <p className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
                    {activeTagline}
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-400 font-extrabold mt-0.5">
                    ¡Abre la cámara de tu celular y escanea este código!
                  </p>
                </div>
              </div>

              {/* Código QR Central con Marco Nítido */}
              <div className="my-6 flex flex-col items-center justify-center">
                <div className="p-4 sm:p-5 bg-white rounded-3xl border-4 border-emerald-600 shadow-xl relative">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR de ${storeName}`} 
                    className="w-52 h-52 sm:w-64 sm:h-64 object-contain"
                  />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
                    ESCANEA CON TU CELULAR
                  </div>
                </div>
              </div>

              {/* 3 Pasos Rápidos para el Vecino */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 my-2 text-left">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-xs font-black text-slate-900 block leading-tight">Apunta tu cámara</strong>
                    <span className="text-[10px] text-slate-500 leading-tight block">Sin descargar apps, abre en el navegador.</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-xs font-black text-slate-900 block leading-tight">Elige tus cosas</strong>
                    <span className="text-[10px] text-slate-500 leading-tight block">Leche, pan, bebidas, abarrotes y snacks.</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-xs font-black text-slate-900 block leading-tight">¡Listo!</strong>
                    <span className="text-[10px] text-slate-500 leading-tight block">Tu orden lista para recoger o enviar segun disponibilidad.</span>
                  </div>
                </div>
              </div>

              {/* Pie de Página con Datos del Local */}
              <div className="border-t border-slate-200/80 pt-4 flex items-center justify-between text-xs text-slate-600 font-semibold">
                {storePhone ? (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Pedidos: <strong>{storePhone}</strong></span>
                  </div>
                ) : (
                  <span>Atención rápida a todo el condominio</span>
                )}

                {storeAddress ? (
                  <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{storeAddress}</span>
                  </div>
                ) : (
                  <span>Tu minimarket de confianza</span>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* FORMATO 2: CARPA PARA MOSTRADOR / CAJA (A5 Apaisado) */}
          {/* ================================================================= */}
          {selectedFormat === 'counter_tent' && (
            <div 
              ref={printAreaRef}
              className="print-page print-counter-tent bg-white w-full max-w-[700px] rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-8 flex items-center gap-6 text-left relative overflow-hidden"
            >
              {/* Código QR a la Izquierda */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border-4 border-slate-900 shadow-md">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR de ${storeName}`} 
                    className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                  />
                </div>
                <span className="text-[11px] font-black uppercase text-emerald-700 mt-2 block tracking-wider">
                  ¡Haz tu pedido online!
                </span>
              </div>

              {/* Contenido a la Derecha */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {storeName}
                    </h2>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Tienda Digital & Pedidos Rápidos
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-white rounded-xl">
                  <p className="text-sm sm:text-base font-extrabold leading-snug">
                    ¿Mucho frío o sin tiempo para bajar?
                  </p>
                  <p className="text-xs text-emerald-400 font-bold mt-0.5">
                    Escanea este QR y te lo llevamos directamente a tu departamento.
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Catálogo completo con precios actualizados.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Pagas por QR o en efectivo cuando lo recibas.</span>
                  </p>
                  {storePhone && (
                    <p className="flex items-center gap-2 font-bold text-slate-800">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>WhatsApp: {storePhone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* FORMATO 3: 4 VOLANTES EN 1 HOJA A4 (Para recortar y repartir) */}
          {/* ================================================================= */}
          {selectedFormat === 'flyers_pocket' && (
            <div 
              ref={printAreaRef}
              className="print-page print-flyers-pocket bg-white w-full max-w-[620px] aspect-[1/1.414] rounded-2xl shadow-xl border border-slate-200/90 p-4 sm:p-6 grid grid-cols-2 gap-4 text-center"
            >
              {[1, 2, 3, 4].map(idx => (
                <div 
                  key={idx} 
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col justify-between items-center bg-slate-50/50"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block">
                      {storeName}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                      ¡Pide desde tu casa!
                    </h3>
                  </div>

                  <div className="my-2 p-2 bg-white rounded-xl border-2 border-emerald-600 shadow-xs">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR" 
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                    />
                  </div>

                  <div className="space-y-0.5 text-[10px] text-slate-600 font-semibold">
                    <p className="text-emerald-700 font-black">Escanea con tu celular</p>
                    <p>Listo para recoger o enviar</p>
                    {storePhone && <p className="font-bold text-slate-800">WhatsApp: {storePhone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
