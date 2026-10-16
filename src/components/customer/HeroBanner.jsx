import React from 'react';
import { Search, Store, Crown } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './HeroBanner.css';

export const HeroBanner = ({ searchQuery, setSearchQuery, onOpenLocationModal }) => {
  const { storeConfig, isProPlan } = useStore();
  const isProStore = Boolean(storeConfig?.isProStore || isProPlan || String(storeConfig?.plan || storeConfig?.subscription?.plan || '').toLowerCase().includes('pro'));

  return (
    <div 
      className={`relative overflow-hidden rounded-3xl text-white shadow-xl mb-6 sm:mb-8 p-4 sm:p-8 lg:p-10 ${
        !storeConfig?.bannerUrl ? 'bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900' : 'bg-slate-900'
      }`}
      style={storeConfig?.bannerUrl ? {
        backgroundImage: `linear-gradient(to bottom right, rgba(6, 78, 59, 0.88), rgba(15, 118, 110, 0.84), rgba(6, 78, 59, 0.94)), url("${storeConfig.bannerUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : undefined}
    >
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl pointer-events-none"></div>

      {/* Badge de Comercio Oficial PRO en la esquina superior */}
      {isProStore && (
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 flex items-center gap-1.5 px-3 py-1 rounded-full hero-banner-pro-chip text-amber-300 text-[10px] sm:text-xs font-black shadow-lg z-20">
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="tracking-wide">TIENDA PRO</span>
        </div>
      )}

      <div className="relative z-10 max-w-4xl">
        {/* Identidad y Título Principal: Logotipo de la tienda junto al texto principal */}
        <div className="flex items-center gap-3.5 sm:gap-6 mb-3 sm:mb-4">
          {storeConfig?.logoUrl ? (
            <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md p-1.5 sm:p-2.5 shadow-xl border-2 border-white/60 shrink-0 flex items-center justify-center">
              <img 
                src={storeConfig.logoUrl} 
                alt={storeConfig.name || 'Logotipo de la tienda'} 
                className="w-full h-full object-contain rounded-xl sm:rounded-2xl"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-md p-1.5 sm:p-2 shadow-xl border-2 border-white/40 shrink-0 flex items-center justify-center text-white">
              <Store className="w-8 h-8 sm:w-12 sm:h-12" />
            </div>
          )}

          <h1 className="text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-tight sm:leading-tight text-white min-w-0">
            Todo lo de tu despensa{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-200 to-teal-100 block sm:inline">
              a precio justo y productos de calidad
            </span>
          </h1>
        </div>

        <p className="text-xs sm:text-base text-emerald-100/90 mb-4 sm:mb-5 max-w-2xl font-normal leading-relaxed">
          Pide fácil desde tu celular y ahorra tiempo. Tu canasta lista para retiro rápido en local o entrega según la disponibilidad de tu tienda.
        </p>

        {/* Barra de Búsqueda Destacada */}
        <div className="relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const el = document.getElementById('products-catalog-section') || document.querySelector('section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              placeholder="Busca leche, pan, bebidas, snacks, SKU..."
              className="w-full pl-10 sm:pl-12 pr-20 sm:pr-28 py-2.5 sm:py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-medium text-xs sm:text-base shadow-lg border-2 border-transparent focus:border-amber-400 focus:outline-hidden transition-all"
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
              onClick={() => {
                const el = document.getElementById('products-catalog-section') || document.querySelector('section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="absolute right-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>Buscar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
