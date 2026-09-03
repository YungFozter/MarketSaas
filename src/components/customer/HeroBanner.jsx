import React from 'react';
import { Search, Sparkles, Truck, ShieldCheck, Zap, HeartHandshake, MapPin } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './HeroBanner.css';

export const HeroBanner = ({ searchQuery, setSearchQuery, onOpenLocationModal, onOpenPoints }) => {
  const { storeConfig, selectedLocation, cartSavings } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white shadow-xl mb-6 sm:mb-8 p-5 sm:p-8 lg:p-10">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl">
        {/* Pill Promocional */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold text-emerald-100 mb-3.5 shadow-xs max-w-full">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-spin" />
          <span className="truncate">
            {storeConfig.enableDelivery !== false
              ? `¡Delivery Express a tu puerta en ${selectedLocation.condominium}!`
              : '🛍️ Atención y Retiro en Tienda Local'}
          </span>
        </div>

        {/* Título Principal */}
        <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-2.5">
          Todo lo de tu despensa <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-200 to-teal-100">
            a precio justo y en tu puerta
          </span>
        </h1>

        <p className="text-xs sm:text-base text-emerald-100/90 mb-5 max-w-xl font-normal leading-relaxed">
          Sin hacer filas ni cargar bolsas pesadas. Pide hoy y tu pedido llega directo a tu departamento o casa en minutos.
        </p>

        {/* Barra de Búsqueda Destacada */}
        <div className="relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca leche, pan, bebidas, snacks, SKU..."
              className="w-full pl-10 sm:pl-12 pr-20 sm:pr-28 py-3 sm:py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-medium text-xs sm:text-base shadow-lg border-2 border-transparent focus:border-amber-400 focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-16 sm:right-24 text-[11px] sm:text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={() => {}}
              className="absolute right-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1"
            >
              <span>Buscar</span>
            </button>
          </div>
        </div>

        {/* Ventajas y Garantías Visuales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 mt-5 pt-5 border-t border-white/15 text-xs text-emerald-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white leading-tight truncate text-[11px] sm:text-xs">
                {storeConfig.enableDelivery !== false ? 'Delivery Express' : 'Retiro en Local'}
              </p>
              <p className="text-[10px] sm:text-[11px] text-emerald-200 truncate">
                {storeConfig.enableDelivery !== false
                  ? `Desde ${currency} ${storeConfig.defaultDeliveryFee.toFixed(2)}`
                  : 'Sin costo de envío'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 shrink-0">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white leading-tight truncate text-[11px] sm:text-xs">Precios Justos</p>
              <p className="text-[10px] sm:text-[11px] text-emerald-200 truncate">Sin recargos extras</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white leading-tight text-xs">Apoyo Vecinal</p>
              <p className="text-[11px] text-emerald-200">100% Confianza</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
