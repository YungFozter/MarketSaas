import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, ShieldAlert, KeyRound, MessageCircle, X, CheckCircle2, ArrowRight, Crown, Sparkles } from 'lucide-react';

export const SubscriptionBlockedModal = ({ 
  isOpen, 
  onClose, 
  onNavigateToSubscription, 
  featureName = '', 
  variant = 'expired', // 'expired' | 'pro_required'
  requiredPlan = 'basic' 
}) => {
  const { redeemSubscriptionCode, storeConfig, isSubscriptionActive, isProPlan } = useStore();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const isProRequired = variant === 'pro_required' || requiredPlan === 'pro';

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('Por favor introduce un código de activación.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await redeemSubscriptionCode(code);
      if (result.success) {
        setCode('');
        // Si la función requería Plan PRO y el código canjeado fue Básico, advertir
        if (isProRequired && result.planType !== 'pro') {
          setErrorMessage('Has canjeado un Plan Básico con éxito, pero esta función requiere un código de Plan PRO ⭐.');
        } else {
          onClose();
        }
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
  const whatsappMessage = isProRequired
    ? `Hola, deseo contratar o subir al *Plan PRO ⭐ (Bs. 129/mes)* para mi tienda "${storeConfig?.name || 'Mi Tienda'}" en MarketSaaS para habilitar la función de "${featureName || 'Analítica y Exportaciones'}".`
    : `Hola, necesito un código de activación de suscripción para mi tienda "${storeConfig?.name || 'Mi Tienda'}" en MarketSaaS.`;

  const supportWhatsappUrl = `https://wa.me/${cleanPhone || '59178901234'}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-900 animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera dinámica según variante */}
        <div className="flex flex-col items-center text-center mb-6">
          {isProRequired ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
                <Crown className="w-8 h-8 fill-amber-400" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Función Exclusiva del Plan PRO ⭐
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Desbloquea con Plan PRO (Bs. 129)
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-sm">
                {featureName ? (
                  <>
                    La herramienta de <strong className="text-slate-900 font-bold">{featureName}</strong> está reservada para tiendas con membresía activa <strong className="text-amber-700 font-bold">Plan PRO</strong>.
                  </>
                ) : (
                  <>
                    Esta herramienta está reservada exclusivamente para tiendas con <strong className="text-amber-700 font-bold">Plan PRO ⭐ (Bs. 129/mes)</strong>.
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                Acceso Limitado
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Suscripción Vencida
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                {featureName ? (
                  <>
                    La función de <strong className="text-slate-800 font-bold">{featureName}</strong> se encuentra pausada debido a que la suscripción de tu tienda ha expirado.
                  </>
                ) : (
                  <>
                    Las funciones del sistema se encuentran pausadas hasta la activación de una licencia válida (Plan Básico o Plan PRO).
                  </>
                )}
              </p>
            </>
          )}
        </div>

        {/* Formulario de Canje Directo */}
        <form onSubmit={handleRedeem} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {isProRequired ? '¿Tienes un Código de Plan PRO? Ingrésalo Aquí' : 'Ingresa tu Código de Activación'}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="MS-XXXX-XXXX"
                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border focus:bg-white rounded-xl text-slate-900 font-mono text-center tracking-widest uppercase text-base placeholder:text-slate-400 outline-none transition-all ${
                  isProRequired 
                    ? 'border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20' 
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
                autoFocus
              />
            </div>
            {errorMessage && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1">
                ⚠️ {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className={`w-full py-3 px-4 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all ${
              isProRequired 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{isProRequired ? 'Canjear Licencia PRO y Desbloquear' : 'Canjear y Desbloquear Ahora'}</span>
              </>
            )}
          </button>
        </form>

        {/* Acciones Secundarias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToSubscription) onNavigateToSubscription();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Ver Mi Suscripción</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <a
            href={supportWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors ${
              isProRequired
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{isProRequired ? 'Solicitar Plan PRO (Bs. 129)' : 'Solicitar Código WhatsApp'}</span>
          </a>
        </div>
      </div>
    </div>
  );
};

