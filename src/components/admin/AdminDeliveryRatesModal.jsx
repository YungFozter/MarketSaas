import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bike,
  Navigation,
  CloudRain,
  DollarSign,
  ShieldCheck,
  Store,
  Calculator,
  Search,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  DELIVERY_RATES,
  RAIN_SURCHARGE_BS,
  MAX_DELIVERY_DISTANCE_KM,
  calculateDeliveryFee
} from '../../utils/deliveryFeeUtils';
import './AdminDeliveryRatesModal.css';

export const AdminDeliveryRatesModal = ({
  isOpen,
  onClose,
  storeConfig = null
}) => {
  const [testKm, setTestKm] = useState('2.5');

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

  const numericTestKm = parseFloat(testKm) || 0;
  const isRainActive = Boolean(storeConfig?.isRainActive);
  const minDeliveryOrder = storeConfig?.minDeliveryOrder !== undefined ? storeConfig.minDeliveryOrder : 20.0;
  const isDeliveryEnabled = storeConfig?.enableDelivery !== false;

  const simResult = calculateDeliveryFee(numericTestKm, { isRainActive });

  return createPortal(
    <div
      className="admin-rates-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="admin-rates-modal-card relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-200 shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Tarifario Oficial de Motodelivery
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  0 a 18 Km
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Escala oficial de tarifas aplicadas automáticamente por distancia GPS en Santa Cruz
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

        {/* Resumen de Estado de la Tienda */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Servicio Delivery</span>
            <span className={`font-black text-xs ${isDeliveryEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isDeliveryEnabled ? '🛵 Activo' : '🛍️ Pausado'}
            </span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Pedido Mínimo</span>
            <span className="font-black text-xs text-emerald-700">
              Bs. {parseFloat(minDeliveryOrder || 0).toFixed(2)}
            </span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Modo Lluvia</span>
            <span className={`font-black text-xs ${isRainActive ? 'text-blue-700' : 'text-slate-600'}`}>
              {isRainActive ? '🌧️ +Bs. 5 Activo' : '☀️ Tarifa Normal'}
            </span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Retiro en Local</span>
            <span className="font-black text-xs text-emerald-800">
              🏪 Bs. 0.00
            </span>
          </div>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm">
          {/* Simulador Interactivo Rápido */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>Simulador de Cotización Rápida</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800">
                Ingresa los Km para cotizar
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={testKm}
                  onChange={(e) => setTestKm(e.target.value)}
                  placeholder="Ej. 3.5"
                  className="w-full pl-3 pr-10 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-bold text-slate-900 focus:outline-emerald-600 shadow-2xs"
                />
                <span className="absolute right-3 top-2.5 text-xs font-black text-slate-400">Km</span>
              </div>

              <div className="px-4 py-2 bg-white rounded-xl border border-emerald-200 flex items-center gap-3 shadow-2xs shrink-0">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Tarifa Calculada:</span>
                  {simResult.isWithinLimit ? (
                    <span className="text-sm font-black text-emerald-700">
                      Bs. {simResult.fee.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-600">
                      Fuera de cobertura (&gt; 18 Km)
                    </span>
                  )}
                </div>
                {isRainActive && simResult.isWithinLimit && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    +Bs. 5 Lluvia inc.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabla Oficial de 14 Tramos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Tabla Oficial de 14 Tramos (0 a 18 Km)
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Tarifas estándar acordadas con repartidores
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-4 bg-slate-100 px-3 py-2 text-[11px] font-black text-slate-700 sticky top-0 z-10 shadow-xs">
                <span>Distancia (Km)</span>
                <span className="text-center">Tarifa Normal</span>
                <span className="text-center">Con Lluvia (+Bs. 5)</span>
                <span className="text-right">Tiempo Estimado</span>
              </div>

              {DELIVERY_RATES.map((rate, idx) => {
                const isSelected = numericTestKm >= rate.min && numericTestKm <= rate.max;
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-4 px-3 py-2 text-xs font-semibold items-center transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/90 font-bold border-l-4 border-l-emerald-600'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/50'
                    }`}
                  >
                    <span className="text-slate-800">
                      {rate.min === 0 ? 'Hasta 1 km' : `${rate.min} a ${rate.max} km`}
                    </span>
                    <span className="text-center font-extrabold text-emerald-700">
                      Bs. {rate.fee.toFixed(2)}
                    </span>
                    <span className="text-center font-extrabold text-blue-700">
                      Bs. {(rate.fee + RAIN_SURCHARGE_BS).toFixed(2)}
                    </span>
                    <span className="text-right text-[11px] text-slate-500 font-normal">
                      {rate.max <= 3 ? '10-15 min' : rate.max <= 7 ? '15-25 min' : rate.max <= 12 ? '25-35 min' : '35-45 min'}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-500 italic mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              <span>
                Para distancias mayores a 18.0 Km, el sistema rechaza automáticamente el envío a domicilio y solicita al cliente pasar a retirar por la tienda física.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500">
            Tarifario integrado con el cotizador de Google Maps y WhatsApp
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
