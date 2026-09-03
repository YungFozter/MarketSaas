import React, { useState } from 'react';
import { X, MapPin, Building2, Check, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './LocationModal.css';

export const LocationModal = ({ isOpen, onClose }) => {
  const { storeConfig, selectedLocation, setSelectedLocation, showToast } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';

  const [condo, setCondo] = useState(selectedLocation.condominium);
  const [tower, setTower] = useState(selectedLocation.tower);
  const [apartment, setApartment] = useState(selectedLocation.apartment || 'Depto 302');

  if (!isOpen) return null;

  const currentCondoObj = storeConfig.condominiums.find(c => c.name === condo) || storeConfig.condominiums[0];

  const handleSave = () => {
    setSelectedLocation({
      condominium: condo,
      tower,
      apartment,
      notes: selectedLocation.notes || ''
    });
    showToast(`Ubicación fijada: ${condo} - ${tower}, ${apartment}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                {storeConfig.enableDelivery !== false ? '¿Dónde entregamos?' : 'Ubicación del Local'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {storeConfig.enableDelivery !== false ? 'Selecciona tu condominio' : 'Retiro en tienda local'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {storeConfig.enableDelivery === false ? (
            <div className="space-y-4 text-center py-2">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">Retiro en Tienda Habilitado</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Esta tienda atiende compras presenciales y pedidos para retirar directamente en el local:
                </p>
                <p className="font-bold text-xs text-emerald-800 bg-white p-2.5 rounded-xl border border-emerald-200">
                  📍 {storeConfig.address || 'Calle Los Sauces #420'}
                </p>
              </div>

              <p className="text-[11px] text-slate-400">
                * El servicio de envíos/delivery a otros condominios no está activado para esta tienda por el momento.
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                Entendido, Continuar Comprando
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Condominio / Conjunto Habitacional
                </label>
                <div className="space-y-2">
                  {storeConfig.condominiums.map((c) => {
                    const isSelected = condo === c.name;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCondo(c.name);
                          if (c.towers.length > 0) setTower(c.towers[0]);
                        }}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-xs sm:text-sm font-bold">{c.name}</p>
                            <p className="text-[11px] text-slate-500 font-normal">Entrega aprox. en {c.estTime} • Delivery {currency} {c.deliveryFee.toFixed(2)}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Torre o Sector</label>
                  <select
                    value={tower}
                    onChange={(e) => setTower(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  >
                    {currentCondoObj.towers.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Depto / Casa</label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Ej. 402"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full mt-4 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Guardar Ubicación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
