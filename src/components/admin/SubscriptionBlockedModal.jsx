import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, ShieldAlert, KeyRound, MessageCircle, X, CheckCircle2, ArrowRight } from 'lucide-react';

export const SubscriptionBlockedModal = ({ isOpen, onClose, onNavigateToSubscription }) => {
  const { redeemSubscriptionCode, storeConfig } = useStore();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('Por favor introduce un código de suscripción.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await redeemSubscriptionCode(code);
      if (result.success) {
        setCode('');
        onClose();
      } else {
        setErrorMessage(result.message || 'Código inválido o ya utilizado.');
      }
    } catch (err) {
      setErrorMessage('Error al verificar el código. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const storePhone = storeConfig?.whatsapp || storeConfig?.phone || '59178901234';
  const cleanPhone = String(storePhone).replace(/\D/g, '');
  const supportWhatsappUrl = `https://wa.me/${cleanPhone || '59178901234'}?text=${encodeURIComponent(
    `Hola, necesito un código de activación de suscripción para mi tienda "${storeConfig?.name || 'Mi Tienda'}" en MarketSaaS.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-white animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera con Icono de Bloqueo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Acceso Limitado
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Período de Prueba Vencido
          </h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm">
            Las funciones de <strong className="text-slate-200">Venta Rápida</strong> y <strong className="text-slate-200">Punto de Venta (POS)</strong> se encuentran pausadas hasta la activación de una licencia.
          </p>
        </div>

        {/* Formulario de Canje Directo */}
        <form onSubmit={handleRedeem} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Ingresa tu Código de Activación
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="MS-XXXX-XXXX"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-white font-mono text-center tracking-widest uppercase text-base placeholder:text-slate-600 outline-none transition-all"
                autoFocus
              />
            </div>
            {errorMessage && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                ⚠️ {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Canjear y Desbloquear Ahora</span>
              </>
            )}
          </button>
        </form>

        {/* Acciones Secundarias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToSubscription) onNavigateToSubscription();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Ver Mi Suscripción</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <a
            href={supportWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Solicitar Código WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
