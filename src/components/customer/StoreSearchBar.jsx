import React from 'react';
import { 
  Search, 
  MapPin, 
  ArrowRight, 
  Bike, 
  Zap, 
  QrCode, 
  Star, 
  Gift,
  ChevronDown
} from 'lucide-react';
import './StoreSearchBar.css';

export const StoreSearchBar = ({
  searchQuery,
  setSearchQuery,
  selectedZone,
  setSelectedZone,
  activeFilters,
  onToggleFilter,
  onSearchSubmit,
  zoneOptions = []
}) => {
  const filterPills = [
    {
      id: 'openNow',
      label: 'Abiertas Ahora',
      icon: null,
      pulse: true,
      activeClass: 'filter-pill-active-emerald',
      baseClass: 'filter-pill-emerald'
    },
    {
      id: 'freeDelivery',
      label: 'Delivery Gratis',
      icon: <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />,
      activeClass: 'filter-pill-active',
      baseClass: 'filter-pill-glass'
    },
    {
      id: 'fastPickup',
      label: 'Retiro Inmediato (5-10 min)',
      icon: <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />,
      activeClass: 'filter-pill-active',
      baseClass: 'filter-pill-glass'
    },
    {
      id: 'acceptsQr',
      label: 'Aceptan QR / Simple',
      icon: <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />,
      activeClass: 'filter-pill-active',
      baseClass: 'filter-pill-glass'
    },
    {
      id: 'topRated',
      label: 'Mejor Calificadas (4.8+)',
      icon: <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />,
      activeClass: 'filter-pill-active',
      baseClass: 'filter-pill-glass'
    },
    {
      id: 'hasPoints',
      label: 'Club VeciPuntos',
      icon: <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />,
      activeClass: 'filter-pill-active-amber',
      baseClass: 'filter-pill-amber'
    }
  ];

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
              className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded-md hover:bg-slate-100"
              title="Borrar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        {/* Acciones: Selector de Condominio y Botón Buscar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Selector de Zona */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full sm:w-auto appearance-none flex items-center justify-between gap-1.5 px-3.5 py-2 pr-7 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-200/70 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">📍 Todas las Zonas ▾</option>
              {zoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  📍 {zone}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Botón Buscar Tiendas */}
          <button
            type="button"
            onClick={onSearchSubmit}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
          >
            <span>Buscar Tiendas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Riel Deslizable de Filtros Rápidos (Pills) */}
      <div className="store-filters-ribbon flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none justify-start sm:justify-center">
        {filterPills.map((pill) => {
          const isActive = !!activeFilters[pill.id];
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onToggleFilter(pill.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer select-none shadow-xs ${
                isActive
                  ? pill.activeClass
                  : pill.baseClass
              }`}
            >
              {pill.pulse && (
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'} animate-pulse`} />
              )}
              {pill.icon}
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
