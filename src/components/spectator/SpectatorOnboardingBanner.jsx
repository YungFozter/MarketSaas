import React from 'react';
import { Eye, Store, Sparkles } from 'lucide-react';
import './SpectatorOnboardingBanner.css';

export const SpectatorOnboardingBanner = ({ onExploreStore, onScrollToAuth }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
      <div className="spectator-cta-card p-6 sm:p-10 lg:p-12 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
        
        <div className="space-y-2 text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Pruébalo en 60 Segundos
          </div>

          <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            ¿Listo para conectar tu condominio o tu minimarket?
          </h3>

          <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">
            Explora la tienda demo con productos precargados o solicita el alta de tu almacén con tu propio catálogo sin costo inicial de instalación.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={onExploreStore}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-slate-200/90 hover:bg-slate-300/80 text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>Probar como Vecino</span>
          </button>

          <button
            onClick={onScrollToAuth}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Store className="w-4 h-4 text-emerald-100" />
            <span>Registrar mi Tienda (Paso 1)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
