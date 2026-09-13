import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Store, 
  ShoppingBag, 
  Zap, 
  MessageCircle, 
  History, 
  Calendar,
  Lock,
  Unlock,
  HelpCircle
} from 'lucide-react';

export const SubscriptionManager = () => {
  const { 
    storeConfig, 
    isSubscriptionActive, 
    subscriptionTimeRemaining, 
    redeemSubscriptionCode, 
    formatBoliviaDateTime,
    TRIAL_DURATION_MINUTES 
  } = useStore();

  const [inputCode, setInputCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  const sub = storeConfig?.subscription || {};
  const isTrial = sub.plan === 'trial_free' || (!sub.plan && isSubscriptionActive);
  const history = Array.isArray(sub.history) ? sub.history : [];

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setRedeemError('Por favor ingresa un código de activación.');
      return;
    }

    setIsSubmitting(true);
    setRedeemError('');
    setRedeemSuccess('');

    try {
      const res = await redeemSubscriptionCode(inputCode);
      if (res.success) {
        setRedeemSuccess(`¡Código activado con éxito! Se sumaron ${res.durationText}.`);
        setInputCode('');
      } else {
        setRedeemError(res.message || 'Código no válido o ya utilizado.');
      }
    } catch (err) {
      setRedeemError('Error al procesar el código. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const storePhone = storeConfig?.whatsapp || storeConfig?.phone || '59178901234';
  const cleanPhone = String(storePhone).replace(/\D/g, '');
  const supportWhatsappUrl = `https://wa.me/${cleanPhone || '59178901234'}?text=${encodeURIComponent(
    `Hola, deseo adquirir o renovar una licencia para mi tienda "${storeConfig?.name || 'Mi Tienda'}" en MarketSaaS.`
  )}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in text-slate-100">
      {/* 1. CABECERA Y RESUMEN PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
            !isSubscriptionActive 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
              : isTrial 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {!isSubscriptionActive ? (
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            ) : isTrial ? (
              <Clock className="w-8 h-8" />
            ) : (
              <ShieldCheck className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Estado de Mi Suscripción
              </h2>
              <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                !isSubscriptionActive 
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                  : isTrial 
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {!isSubscriptionActive 
                  ? 'Expirada / Vencida' 
                  : isTrial 
                    ? 'Período de Prueba' 
                    : 'Licencia Activa (Premium)'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Control de vigencia y activación de funcionalidades para <strong className="text-slate-200">{storeConfig?.name || 'Mi Tienda'}</strong>
            </p>
          </div>
        </div>

        <a
          href={supportWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Solicitar Licencia por WhatsApp</span>
        </a>
      </div>

      {/* 2. TARJETA DEL RELOJ REGRESIVO EN VIVO (UTC -04:00 LA PAZ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contador / Reloj */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Tiempo Restante de Servicio
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                Zona: Bolivia (UTC-04:00)
              </span>
            </div>

            {isSubscriptionActive ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-4 my-6">
                <div className="bg-slate-950/80 border border-slate-800/90 p-3 sm:p-4 rounded-2xl text-center shadow-inner">
                  <span className="block text-2xl sm:text-4xl font-black text-white font-mono">
                    {String(subscriptionTimeRemaining.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                    Días
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/90 p-3 sm:p-4 rounded-2xl text-center shadow-inner">
                  <span className="block text-2xl sm:text-4xl font-black text-white font-mono">
                    {String(subscriptionTimeRemaining.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                    Horas
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/90 p-3 sm:p-4 rounded-2xl text-center shadow-inner">
                  <span className="block text-2xl sm:text-4xl font-black text-emerald-400 font-mono">
                    {String(subscriptionTimeRemaining.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                    Minutos
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800/90 p-3 sm:p-4 rounded-2xl text-center shadow-inner">
                  <span className="block text-2xl sm:text-4xl font-black text-emerald-400 font-mono animate-pulse">
                    {String(subscriptionTimeRemaining.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                    Segundos
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-6 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <Lock className="w-10 h-10 text-rose-400 mx-auto mb-2" />
                <h4 className="text-lg font-black text-rose-300">¡Tu suscripción ha finalizado!</h4>
                <p className="text-xs text-rose-200/80 mt-1">
                  Ingresa un código de activación abajo para renovar el servicio y rehabilitar el Punto de Venta (POS).
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              Fecha y Hora de Expiración:
            </span>
            <span className="font-mono font-bold text-white bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
              {formatBoliviaDateTime(sub.subscriptionExpiresAt)}
            </span>
          </div>
        </div>

        {/* Formulario de Canje de Códigos */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Canjear Código</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa el código alfanumérico provisto por el administrador para extender tu vigencia.
            </p>

            <form onSubmit={handleRedeemSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    if (redeemError) setRedeemError('');
                    if (redeemSuccess) setRedeemSuccess('');
                  }}
                  placeholder="MS-XXXX-XXXX"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-white font-mono text-center tracking-widest uppercase text-sm placeholder:text-slate-600 outline-none transition-all"
                />
              </div>

              {redeemError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{redeemError}</span>
                </div>
              )}

              {redeemSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{redeemSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !inputCode.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Aplicar Código</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            * Cada código es de un solo uso y sumará automáticamente el tiempo correspondiente de forma acumulativa a tu fecha de vencimiento actual.
          </p>
        </div>
      </div>

      {/* 3. MATRIZ DE ACCESO A FUNCIONALIDADES */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Disponibilidad de Módulos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Módulo 1: Catálogo Digital */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Catálogo & Pedidos Web</h4>
                <p className="text-[11px] text-slate-400">Recepción de compras de vecinos</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-lg shrink-0">
              Siempre Activo
            </span>
          </div>

          {/* Módulo 2: Venta Rápida */}
          <div className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
            isSubscriptionActive 
              ? 'bg-slate-950/60 border-slate-800' 
              : 'bg-rose-950/20 border-rose-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSubscriptionActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {isSubscriptionActive ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Venta Rápida de Mostrador</h4>
                <p className="text-[11px] text-slate-400">Cobro express para clientes en local</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg shrink-0 border ${
              isSubscriptionActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {isSubscriptionActive ? '✅ Habilitado' : '🔒 Bloqueado'}
            </span>
          </div>

          {/* Módulo 3: Punto de Venta POS */}
          <div className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
            isSubscriptionActive 
              ? 'bg-slate-950/60 border-slate-800' 
              : 'bg-rose-950/20 border-rose-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSubscriptionActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Terminal POS & Caja</h4>
                <p className="text-[11px] text-slate-400">Emisión de recibos y arqueo diario</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-[10px] font-bold rounded-lg shrink-0 border ${
              isSubscriptionActive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {isSubscriptionActive ? '✅ Habilitado' : '🔒 Bloqueado'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. HISTORIAL DE CÓDIGOS CANJEADOS POR ESTA TIENDA */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          Historial de Canjes Realizados
        </h3>

        {history.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 text-xs">
            Aún no has canjeado ningún código promocional o de suscripción en esta tienda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 uppercase text-[10px] tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Duración Otorgada</th>
                  <th className="p-3">Fecha de Activación (UTC-4)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {item.code}
                    </td>
                    <td className="p-3 font-medium">
                      {item.planName || 'Premium'}
                    </td>
                    <td className="p-3">
                      {item.durationDays > 0 
                        ? `${item.durationDays} día(s)` 
                        : `${item.durationMinutes} minuto(s)`}
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {formatBoliviaDateTime(item.redeemedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
