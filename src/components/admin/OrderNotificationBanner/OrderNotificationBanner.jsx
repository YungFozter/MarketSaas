import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Radio, 
  Loader2 
} from 'lucide-react';
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  testDeviceOrderAlert,
  playOrderNotificationSound
} from '../../../services/orderNotificationService';
import './OrderNotificationBanner.css';

export const OrderNotificationBanner = ({ 
  storeConfig = {}, 
  soundAlertsActive = true, 
  onToggleSound, 
  showToast 
}) => {
  const [permission, setPermission] = useState('default');
  const [isTesting, setIsTesting] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === 'granted') {
        showToast?.('¡Notificaciones activadas! Tu dispositivo te avisará cuando llegue una orden.', 'success');
        // Ejecutar prueba corta para verificar
        await testDeviceOrderAlert(storeConfig);
      } else if (res === 'denied') {
        showToast?.('Permiso denegado. Puedes activarlo haciendo clic en el candado de la barra de dirección.', 'warning');
      }
    } catch (e) {
      console.warn('Error solicitando permisos:', e);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    try {
      if (permission === 'granted') {
        await testDeviceOrderAlert(storeConfig);
        showToast?.('Alerta de prueba enviada a tu dispositivo con sonido.', 'info');
      } else {
        playOrderNotificationSound();
        showToast?.('Reproduciendo sonido de prueba de nuevo pedido.', 'info');
      }
    } catch (e) {
      console.warn('Error en prueba de alerta:', e);
    } finally {
      setIsTesting(false);
    }
  };

  // Si las notificaciones ya están activas, mostrar una barra de estado compacta y profesional
  if (permission === 'granted') {
    return (
      <div className="order-notification-banner bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200/80 rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 mb-4 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                <span>Alertas en Vivo Activas</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Notificaciones Push y Sonido ON</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              Tu teléfono o PC sonará y mostrará una notificación al recibir una nueva orden.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTestAlert}
            disabled={isTesting}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Probar sonido y notificación en este dispositivo"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span>Probar Alerta</span>
          </button>

          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                soundAlertsActive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }`}
              title={soundAlertsActive ? 'Sonido activado' : 'Sonido silenciado'}
            >
              {soundAlertsActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Si no se han otorgado los permisos, mostrar tarjeta para activarlos
  return (
    <div className="order-notification-banner order-notification-glow bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-emerald-400/40 rounded-3xl p-3.5 sm:p-4 mb-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0 mt-0.5">
            <Smartphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                ¡Recibe Notificaciones de Nuevos Pedidos en tu Celular o PC!
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Recomendado</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-xl">
              Activa las notificaciones en este dispositivo para que <strong>suene y vibre inmediatamente</strong> cuando un vecino haga un pedido, incluso con la pantalla bloqueada o si estás en otra aplicación.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Habilitando...</span>
              </>
            ) : (
              <>
                <BellRing className="w-4 h-4" />
                <span>Activar Notificaciones</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTestAlert}
            disabled={isTesting}
            className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            title="Probar sonido acústico"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Probar Sonido</span>
          </button>
        </div>
      </div>

      {permission === 'denied' && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex items-center gap-2 text-[11px] text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Las notificaciones fueron bloqueadas en este navegador. Para recibirlas, haz clic en el <strong>icono de candado o ajustes</strong> a la izquierda de la barra de dirección web y selecciona <em>"Permitir notificaciones"</em>.
          </span>
        </div>
      )}
    </div>
  );
};
