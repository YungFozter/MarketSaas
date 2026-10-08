import React, { useState } from 'react';
import { X, MapPin, Store, Check, ArrowRight, Crosshair, Bike, CloudRain, AlertTriangle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { calculateDistanceKm, calculateDeliveryFee, MAX_DELIVERY_DISTANCE_KM } from '../../utils/deliveryFeeUtils';
import './LocationModal.css';

export const LocationModal = ({ isOpen, onClose }) => {
  const { storeConfig, selectedLocation, setSelectedLocation, showToast } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';

  const isDeliveryEnabled = storeConfig?.enableDelivery !== false;

  const [address, setAddress] = useState(selectedLocation?.address || '');
  const [reference, setReference] = useState(selectedLocation?.reference || '');
  const [notes, setNotes] = useState(selectedLocation?.notes || '');
  const [clientLat, setClientLat] = useState(selectedLocation?.latitude ?? null);
  const [clientLng, setClientLng] = useState(selectedLocation?.longitude ?? null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  if (!isOpen) return null;

  // Coordenadas de la tienda
  const storeLat = (storeConfig?.latitude !== '' && storeConfig?.latitude != null)
    ? parseFloat(storeConfig.latitude)
    : (storeConfig?.googleMapsCoordinates?.lat != null ? parseFloat(storeConfig.googleMapsCoordinates.lat) : null);
  const storeLng = (storeConfig?.longitude !== '' && storeConfig?.longitude != null)
    ? parseFloat(storeConfig.longitude)
    : (storeConfig?.googleMapsCoordinates?.lng != null ? parseFloat(storeConfig.googleMapsCoordinates.lng) : null);

  // Distancia calculada
  const distanceKm = (storeLat != null && storeLng != null && clientLat != null && clientLng != null)
    ? calculateDistanceKm(storeLat, storeLng, clientLat, clientLng)
    : (selectedLocation?.distanceKm != null ? parseFloat(selectedLocation.distanceKm) : null);

  const deliveryQuote = calculateDeliveryFee(distanceKm, {
    isRaining: Boolean(storeConfig?.isRainActive)
  });

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no admite geolocalización GPS.', 'error');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setClientLat(lat);
        setClientLng(lng);

        let calculatedKm = null;
        if (storeLat != null && storeLng != null) {
          calculatedKm = calculateDistanceKm(storeLat, storeLng, lat, lng);
        }

        if (calculatedKm != null) {
          if (calculatedKm > MAX_DELIVERY_DISTANCE_KM) {
            showToast(`Ubicación GPS fijada (${calculatedKm.toFixed(1)} km). Supera el radio máximo de 18 km para motos.`, 'warning');
          } else {
            showToast(`¡GPS detectado! Distancia a la tienda: ${calculatedKm.toFixed(1)} km`, 'success');
          }
        } else {
          showToast('Ubicación GPS registrada con éxito.', 'success');
        }
      },
      (err) => {
        setIsDetectingGps(false);
        console.warn('Geolocation error:', err);
        showToast('No se pudo detectar tu ubicación automática. Escribe tu dirección manualmente.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = () => {
    if (!address.trim() && isDeliveryEnabled) {
      showToast('Por favor escribe tu calle o dirección de entrega.', 'warning');
      return;
    }

    setSelectedLocation({
      address: address.trim(),
      reference: reference.trim(),
      latitude: clientLat,
      longitude: clientLng,
      distanceKm,
      notes: notes.trim()
    });

    showToast(`Ubicación guardada: ${address.trim() || 'Dirección fijada'}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                {isDeliveryEnabled ? '¿Dónde entregamos?' : 'Ubicación de la Tienda'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {isDeliveryEnabled ? 'Indica tu dirección para calcular el envío' : 'Retiro presencial en local'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {!isDeliveryEnabled ? (
            <div className="space-y-4 text-center py-2">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">Retiro en Tienda Habilitado</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Esta tienda atiende pedidos para recoger directamente en el local:
                </p>
                <p className="font-bold text-xs text-emerald-800 bg-white p-2.5 rounded-xl border border-emerald-200">
                  📍 {storeConfig.address || 'Dirección de la tienda en Santa Cruz'}
                </p>
                {storeConfig.reference && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Ref: {storeConfig.reference}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                * El servicio de envíos a domicilio está desactivado actualmente por la tienda.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                Entendido, Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Dirección Exacta de Entrega *
                </label>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={isDetectingGps}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50"
                  title="Detectar ubicación GPS para calcular distancia real"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'Detectando...' : 'Detectar mi GPS'}</span>
                </button>
              </div>

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Av. Las Palmas #240, entre 3er y 4to anillo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-emerald-500"
              />

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Punto de Referencia
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej. Portón negro frente a la plaza o negocio cercano"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Indicaciones Especiales (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Tocar el timbre o llamar al llegar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-emerald-500"
                />
              </div>

              {/* Badge Informativo de Tarifa por Kilometraje */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Bike className="w-4 h-4 text-emerald-600" />
                    <span>Cálculo de Envío por Moto:</span>
                  </span>
                  <span className="text-emerald-700 font-black">
                    {deliveryQuote.isWithinRange ? `${currency} ${deliveryQuote.fee.toFixed(2)}` : 'Por fijar'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>
                    {distanceKm != null ? `Distancia a la tienda: ~${distanceKm.toFixed(1)} km` : 'Fija tu GPS para cálculo exacto en ruta'}
                  </span>
                  {storeConfig?.isRainActive && (
                    <span className="text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      <CloudRain className="w-3 h-3" />
                      <span>+Bs. 5 lluvia</span>
                    </span>
                  )}
                </div>

                {distanceKm != null && distanceKm > MAX_DELIVERY_DISTANCE_KM && (
                  <div className="mt-1 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>Distancia ({distanceKm.toFixed(1)} km) excede los 18 km de cobertura. Deberás seleccionar Retiro en Tienda.</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Ubicación</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
