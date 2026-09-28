import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  Share2, 
  PlusSquare, 
  Sparkles, 
  CheckCircle2, 
  Monitor, 
  Compass, 
  Info,
  ExternalLink
} from 'lucide-react';

export const PwaInstallBanner = ({ storeName = 'tu tienda de barrio' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [selectedDeviceTab, setSelectedDeviceTab] = useState('auto'); // 'android' | 'ios' | 'desktop'

  useEffect(() => {
    // 1. Detectar si ya está en modo standalone (instalada y abierta como app)
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (standaloneMode) {
      setIsStandalone(true);
      setShowBanner(false);
      return;
    }

    // 2. Detectar tipo de dispositivo para la pestaña sugerida
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isIos) {
      setSelectedDeviceTab('ios');
    } else if (isAndroid) {
      setSelectedDeviceTab('android');
    } else {
      setSelectedDeviceTab('desktop');
    }

    // 3. Capturar el evento nativo beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Escuchar evento global 'open-pwa-install' para abrir desde cualquier botón de la interfaz
    const handleOpenPwaModal = () => {
      setIsInstallModalOpen(true);
      setShowBanner(true);
    };

    window.addEventListener('open-pwa-install', handleOpenPwaModal);

    // 5. Verificar si fue descartada recientemente (solo para ocultar el banner flotante automático, no los botones fijos)
    try {
      const dismissed = localStorage.getItem('marketsaas_pwa_dismissed');
      if (dismissed && Date.now() - parseInt(dismissed, 10) < 24 * 60 * 60 * 1000) {
        setShowBanner(false);
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenPwaModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowBanner(false);
          setIsInstallModalOpen(false);
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        setIsInstallModalOpen(true);
      }
    } else {
      // Si el navegador no soporta prompt automático (ej. iOS o Chrome ya instalado o PC)
      setIsInstallModalOpen(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    try {
      localStorage.setItem('marketsaas_pwa_dismissed', Date.now().toString());
    } catch (e) {}
  };

  if (isStandalone) return null;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. BANNER FLOTANTE (Visible en Móvil y Desktop)                          */}
      {/* ========================================================================= */}
      {showBanner && (
        <aside 
          aria-label="Instalación de la aplicación"
          className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slideUp"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
                <Smartphone className="w-5 h-5 text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-white truncate">
                    Instalar App de {storeName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider hidden sm:inline">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium truncate">
                  Pide en 1 toque desde tu pantalla de inicio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="h-9 px-3 sm:px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>

              <button
                type="button"
                onClick={handleDismissBanner}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL GUÍA DE INSTALACIÓN MULTI-DISPOSITIVO                           */}
      {/* ========================================================================= */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 text-slate-900 shadow-2xl border border-slate-200 animate-slideUp">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    Instalar la App de {storeName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Acceso directo sin descargas de tiendas de apps
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selector de Dispositivo (Android, iPhone, PC) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedDeviceTab('android')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedDeviceTab === 'android'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeviceTab('ios')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedDeviceTab === 'ios'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>iPhone</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDeviceTab('desktop')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedDeviceTab === 'desktop'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Mac</span>
              </button>
            </div>

            {/* Contenido según dispositivo seleccionado */}
            {selectedDeviceTab === 'android' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                {deferredPrompt ? (
                  <div className="space-y-3 text-center py-2">
                    <p className="text-slate-700 font-medium">
                      Tu navegador está listo para instalar la aplicación con 1 clic:
                    </p>
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Instalar Ahora Directamente</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-slate-700 font-medium">
                        Toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha de tu navegador Chrome.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-slate-700 font-medium">
                        Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedDeviceTab === 'ios' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-slate-700 font-medium">
                    En Safari, toca el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 text-blue-600 inline ml-1" /> en la barra inferior.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-slate-700 font-medium">
                    Desplázate hacia abajo y selecciona <strong>"Agregar a Inicio"</strong> <PlusSquare className="w-3.5 h-3.5 text-slate-800 inline ml-1" />.
                  </p>
                </div>
              </div>
            )}

            {selectedDeviceTab === 'desktop' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                {deferredPrompt ? (
                  <div className="space-y-3 text-center py-2">
                    <p className="text-slate-700 font-medium">
                      Puedes instalar MarketSaaS como aplicación de escritorio:
                    </p>
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Instalar en esta Computadora</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-slate-700 font-medium">
                        En la barra de direcciones de Chrome o Edge, busca el ícono de <strong>Instalar</strong> (una pantallita con flecha) a la derecha.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-slate-700 font-medium">
                        Haz clic en <strong>"Instalar"</strong> para abrirla en una ventana independiente ultra rápida.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Ventajas */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Carga ultra rápida</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>No ocupa memoria</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsInstallModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors cursor-pointer"
            >
              ¡Entendido, gracias!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
