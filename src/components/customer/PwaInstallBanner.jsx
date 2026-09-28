import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';

export const PwaInstallBanner = ({ storeName = 'tu tienda de barrio' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalada o ejecutándose en modo standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Verificar si el usuario ya descartó el banner recientemente (en los últimos 3 días)
    try {
      const dismissed = localStorage.getItem('marketsaas_pwa_dismissed');
      if (dismissed && Date.now() - parseInt(dismissed, 10) < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    } catch (e) {}

    // 3. Capturar el evento nativo en navegadores Chromium (Chrome, Edge, Samsung Internet, Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Detectar si es iOS (iPhone/iPad) para mostrar guía visual alternativa
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos && !isStandalone) {
      // Mostrar en iOS si no ha sido descartado
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Si estamos en iOS o no hay prompt nativo
      setIsIosModalOpen(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem('marketsaas_pwa_dismissed', Date.now().toString());
    } catch (e) {}
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Banner Flotante Suave y Elegante al Pie de la Pantalla */}
      <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slideUp">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
              <Smartphone className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white truncate">
                  Instala la App de {storeName}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase hidden sm:inline">
                  Acceso Rápido
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
              className="h-9 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Guía para iPhone / iPad (iOS Safari) */}
      {isIosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-slate-900 shadow-2xl border border-slate-200 animate-slideUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-black text-base text-slate-900">
                  Instalar en tu iPhone
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIosModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Para agregar <strong>{storeName}</strong> a la pantalla de inicio de tu celular Apple, sigue estos 2 sencillos pasos:
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    Toca el botón Compartir <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  </span>
                  <span className="text-slate-500 block">
                    Está ubicado en la barra inferior de tu navegador Safari.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    Selecciona "Agregar a Inicio" <PlusSquare className="w-3.5 h-3.5 text-slate-800" />
                  </span>
                  <span className="text-slate-500 block">
                    Baja un poco en el menú y toca "Agregar a pantalla de inicio".
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsIosModalOpen(false);
                handleDismiss();
              }}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
