import React from 'react';
import { Search, Sparkles, Truck, ShieldCheck, Zap, HeartHandshake, MapPin } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const HeroBanner = ({ searchQuery, setSearchQuery, onOpenLocationModal, onOpenPoints }) => {
  const { storeConfig, selectedLocation, cartSavings } = useStore();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white shadow-xl mb-8 p-6 sm:p-8 lg:p-10">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl">
        {/* Pill Promocional */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-100 mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
          <span>¡Delivery Express a tu puerta en {selectedLocation.condominium}!</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-3">
          Todo lo de tu despensa <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-200 to-teal-100">
            a precio justo y en tu puerta
          </span>
        </h1>

        <p className="text-sm sm:text-base text-emerald-100/90 mb-6 max-w-xl font-normal">
          Sin hacer filas ni cargar bolsas pesadas. Pide hoy y tu pedido llega directo a tu departamento o casa en minutos.
        </p>

        {/* Barra de Búsqueda Destacada */}
        <div className="relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca leche, pan marraqueta, huevos, bebidas, snacks, código SKU..."
              className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-medium text-sm sm:text-base shadow-lg border-2 border-transparent focus:border-amber-400 focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-24 text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={() => {}}
              className="absolute right-2 px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Buscar</span>
            </button>
          </div>
        </div>

        {/* Ventajas y Garantías Visuales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/15 text-xs text-emerald-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">Delivery Hiperlocal</p>
              <p className="text-[11px] text-emerald-200">Tarifa fija desde ${storeConfig.defaultDeliveryFee.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">Garantía de Ahorro</p>
              <p className="text-[11px] text-emerald-200">Precios de barrio sin sobrecostos</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">Apoyo a tu Vecindad</p>
              <p className="text-[11px] text-emerald-200">Comercio 100% de confianza</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
