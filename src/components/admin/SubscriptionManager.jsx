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
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in text-slate-800">
      {/* 1. CABECERA Y RESUMEN PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
            !isSubscriptionActive 
              ? 'bg-rose-50 border-rose-200 text-rose-600' 
              : isTrial 
                ? 'bg-amber-50 border-amber-200 text-amber-600' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
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
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Estado de Mi Suscripción
              </h2>
              <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                !isSubscriptionActive 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : isTrial 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {!isSubscriptionActive 
                  ? 'Expirada / Vencida' 
                  : isTrial 
                    ? 'Período de Prueba' 
                    : 'Licencia Activa (Premium)'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Control de vigencia y activación de funcionalidades para <strong className="text-slate-800 font-bold">{storeConfig?.name || 'Mi Tienda'}</strong>
            </p>
          </div>
        </div>

        <a
          href={supportWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Solicitar Licencia por WhatsApp</span>
        </a>
      </div>

      {/* 2. TARJETA DEL RELOJ REGRESIVO EN VIVO (UTC -04:00 LA PAZ) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contador / Reloj */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 p-6 sm:p-8 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Tiempo Restante de Servicio
              </span>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                Zona: Bolivia (UTC-04:00)
              </span>
            </div>

            {isSubscriptionActive ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-4 my-6">
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-2xl text-center shadow-xs">
                  <span className="block text-2xl sm:text-4xl font-black text-slate-900 font-mono">
                    {String(subscriptionTimeRemaining.days).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-1 block">
                    Días
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-2xl text-center shadow-xs">
                  <span className="block text-2xl sm:text-4xl font-black text-slate-900 font-mono">
                    {String(subscriptionTimeRemaining.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-1 block">
                    Horas
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-2xl text-center shadow-xs">
                  <span className="block text-2xl sm:text-4xl font-black text-emerald-600 font-mono">
                    {String(subscriptionTimeRemaining.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-1 block">
                    Minutos
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-2xl text-center shadow-xs">
                  <span className="block text-2xl sm:text-4xl font-black text-emerald-600 font-mono animate-pulse">
                    {String(subscriptionTimeRemaining.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-1 block">
                    Segundos
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-6 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <Lock className="w-10 h-10 text-rose-600 mx-auto mb-2" />
                <h4 className="text-lg font-black text-rose-800">¡Tu suscripción ha finalizado!</h4>
                <p className="text-xs text-rose-700 mt-1">
                  Ingresa un código de activación al lado para renovar el servicio y rehabilitar el Punto de Venta (POS).
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Fecha y Hora de Expiración:
            </span>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              {formatBoliviaDateTime(sub.subscriptionExpiresAt)}
            </span>
          </div>
        </div>

        {/* Formulario de Canje de Códigos */}
        <div className="bg-white border border-slate-200/90 p-6 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Canjear Código</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-slate-900 font-mono text-center tracking-widest uppercase text-sm placeholder:text-slate-400 outline-none transition-all"
                />
              </div>

              {redeemError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{redeemError}</span>
                </div>
              )}

              {redeemSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{redeemSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !inputCode.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all"
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

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            * Cada código es de un solo uso y sumará automáticamente el tiempo correspondiente de forma acumulativa a tu fecha de vencimiento actual.
          </p>
        </div>
      </div>

      {/* 3. MATRIZ DE ACCESO A FUNCIONALIDADES */}
      <div className="bg-white border border-slate-200/90 p-6 rounded-3xl shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          Disponibilidad de Módulos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Módulo 1: Catálogo Digital */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Catálogo & Pedidos Web</h4>
                <p className="text-[11px] text-slate-500">Recepción de compras de vecinos</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-lg shrink-0">
              Siempre Activo
            </span>
          </div>

          {/* Módulo 2: Venta Rápida */}
          <div className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
            isSubscriptionActive 
              ? 'bg-slate-50 border-slate-200/80' 
              : 'bg-rose-50/50 border-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSubscriptionActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
              }`}>
                {isSubscriptionActive ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Venta Rápida de Mostrador</h4>
                <p className="text-[11px] text-slate-500">Cobro express para clientes en local</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 border ${
              isSubscriptionActive 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                : 'bg-rose-100 text-rose-700 border-rose-200'
            }`}>
              {isSubscriptionActive ? '✅ Habilitado' : '🔒 Bloqueado'}
            </span>
          </div>

          {/* Módulo 3: Punto de Venta POS */}
          <div className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
            isSubscriptionActive 
              ? 'bg-slate-50 border-slate-200/80' 
              : 'bg-rose-50/50 border-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSubscriptionActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
              }`}>
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Terminal POS & Caja</h4>
                <p className="text-[11px] text-slate-500">Emisión de recibos y arqueo diario</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 border ${
              isSubscriptionActive 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                : 'bg-rose-100 text-rose-700 border-rose-200'
            }`}>
              {isSubscriptionActive ? '✅ Habilitado' : '🔒 Bloqueado'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. HISTORIAL DE CÓDIGOS CANJEADOS POR ESTA TIENDA */}
      <div className="bg-white border border-slate-200/90 p-6 rounded-3xl shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600" />
          Historial de Canjes Realizados
        </h3>

        {history.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs">
            Aún no has canjeado ningún código promocional o de suscripción en esta tienda.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Código</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Duración Otorgada</th>
                  <th className="p-3.5">Fecha de Activación (UTC-4)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {history.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 inline-block">
                        {item.code}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {item.planName || 'Premium'}
                    </td>
                    <td className="p-3.5 font-medium text-slate-600">
                      {item.durationDays > 0 
                        ? `${item.durationDays} día(s)` 
                        : `${item.durationMinutes} minuto(s)`}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
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
