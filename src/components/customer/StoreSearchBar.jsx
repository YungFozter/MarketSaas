import React from 'react';
import { Search, ArrowRight } from 'lucide-react';
import './StoreSearchBar.css';

export const StoreSearchBar = ({
  searchQuery,
  setSearchQuery,
  onSearchSubmit
}) => {
  return (
    <div className="store-search-container w-full max-w-4xl mx-auto flex flex-col gap-3 relative z-20">
      {/* Barra de Búsqueda Flotante Glassmórfica */}
      <div className="store-search-glass-card bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 p-1.5 flex flex-col sm:flex-row items-center gap-2">
        {/* Input de búsqueda */}
        <div className="flex items-center gap-2.5 flex-1 w-full px-3 py-1.5 text-slate-800">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit && onSearchSubmit()}
            placeholder="¿Qué buscas hoy? (ej. Pan fresco, Leche, Bebidas, Don Pedro...)"
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
              title="Borrar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Botón Buscar Tiendas */}
        <button
          type="button"
          onClick={onSearchSubmit}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
        >
          <span>Buscar Tiendas</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
