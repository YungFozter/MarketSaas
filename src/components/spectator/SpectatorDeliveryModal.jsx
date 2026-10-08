import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bike,
  Navigation,
  ShieldCheck,
  CloudRain,
  Store,
  Sparkles,
  MessageCircle,
  X
} from 'lucide-react';
import { DELIVERY_RATES, RAIN_SURCHARGE_BS } from '../../utils/deliveryFeeUtils';
import './SpectatorDeliveryModal.css';

export const SpectatorDeliveryModal = ({ isOpen, onClose, whatsappNumber = '59172125280' }) => {
  const deliveryWaMessage = '¡Hola MarketSaaS! 🛵 Me gustaría recibir información sobre el sistema de tarifas por distancia y delivery para mi comercio.';
  const deliveryWaUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(deliveryWaMessage)}`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="spectator-delivery-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="spectator-delivery-modal-card relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[88vh] flex flex-col my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-200 shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                Tarifario Oficial de Delivery & Distancia
              </h3>
              <p className="text-xs text-emerald-100">
                Cálculo justo por GPS en tiempo real hasta 18 Km
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* Card explicativo */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wide">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>Transparencia y Precisión por GPS</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              El sistema calcula la distancia exacta en línea recta entre el comercio y el cliente. La tarifa se asigna automáticamente según la tabla oficial de motodelivery, evitando cobros arbitrarios o desacuerdos.
            </p>
          </div>

          {/* Tabla de tarifas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Escala de Tarifas (0 a 18 Km)
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                14 tramos escalonados
              </span>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-56 overflow-y-auto">
              <div className="grid grid-cols-2 bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-600">
                <span>Distancia (Km)</span>
                <span className="text-right">Tarifa Regular</span>
              </div>
              {DELIVERY_RATES.map((rate, idx) => (
                <div 
                  key={idx}
                  className={`grid grid-cols-2 px-3 py-2 text-xs font-semibold ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  <span className="text-slate-700">
                    {rate.min === 0 ? 'Hasta 1 km' : `${rate.min} a ${rate.max} km`}
                  </span>
                  <span className="text-right font-extrabold text-emerald-700">
                    Bs. {rate.fee.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3 Pilares */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Retiro en Tienda</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Siempre <strong>Bs. 0.00</strong> si el cliente pasa a recoger su pedido por el mostrador.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <CloudRain className="w-4 h-4 text-blue-600" />
                <span>Modo Lluvia</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Recargo opcional de <strong>+Bs. {RAIN_SURCHARGE_BS.toFixed(2)}</strong> activable por el comercio en clima adverso.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Pedido Mínimo</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Cada tienda define el monto mínimo en bolivianos para habilitar envíos a domicilio.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            ¿Tienes dudas sobre logística o integración para tu local?
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
            >
              Cerrar
            </button>
            <a
              href={deliveryWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md text-xs cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
