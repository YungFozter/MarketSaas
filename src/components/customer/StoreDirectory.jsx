import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreSearchBar } from './StoreSearchBar';
import { NeighborhoodMap } from './NeighborhoodMap';
import { StoreCard } from './StoreCard';
import { 
  Store, 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  PlusCircle, 
  Building2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import './StoreDirectory.css';

export const StoreDirectory = ({ onSelectStore, onOpenAuthModal }) => {
  const { stores, selectedLocation, goToStore } = useStore();

  // Estados de búsqueda, filtros y ordenación
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [activeFilters, setActiveFilters] = useState({
    openNow: true,
    freeDelivery: false,
    fastPickup: false,
    acceptsQr: false,
    topRated: false,
    hasPoints: false
  });
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'rating' | 'fastest'
  const [selectedStoreSlug, setSelectedStoreSlug] = useState('don-vecino');

  // Alternar filtro rápido
  const handleToggleFilter = (filterId) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterId]: !prev[filterId]
    }));
  };

  // Opciones de condominios / zonas extraídas dinámicamente de las tiendas
  const zoneOptions = useMemo(() => {
    const zones = new Set();
    stores.forEach((s) => {
      if (s.condominium) zones.add(s.condominium);
    });
    return Array.from(zones);
  }, [stores]);

  // Filtrado reactivo de tiendas
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      // 1. Filtro de Texto (Búsqueda por nombre, dirección, productos destacados o categoría)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = store.name.toLowerCase().includes(query);
        const matchesAddress = store.address.toLowerCase().includes(query);
        const matchesCategory = store.category?.toLowerCase().includes(query);
        const matchesProducts = store.featuredProducts?.some((fp) =>
          fp.name.toLowerCase().includes(query)
        );

        if (!matchesName && !matchesAddress && !matchesCategory && !matchesProducts) {
          return false;
        }
      }

      // 2. Filtro de Zona / Condominio
      if (selectedZone !== 'all' && store.condominium !== selectedZone) {
        return false;
      }

      // 3. Filtros Rápidos (Pills)
      if (activeFilters.openNow && !store.isOpen) return false;
      if (activeFilters.freeDelivery && !store.hasFreeDelivery) return false;
      if (activeFilters.fastPickup && !store.hasPickup) return false;
      if (activeFilters.acceptsQr && !store.acceptsQr) return false;
      if (activeFilters.topRated && (store.rating || 0) < 4.8) return false;
      if (activeFilters.hasPoints && !store.pointsReward) return false;

      return true;
    });
  }, [stores, searchQuery, selectedZone, activeFilters]);

  // Ordenación de tiendas
  const sortedStores = useMemo(() => {
    const list = [...filteredStores];
    if (sortBy === 'nearest') {
      list.sort((a, b) => (a.distanceMeters || 999) - (b.distanceMeters || 999));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'fastest') {
      list.sort((a, b) => (parseInt(a.deliveryTime) || 99) - (parseInt(b.deliveryTime) || 99));
    }
    return list;
  }, [filteredStores, sortBy]);

  // Separación para la cuadrícula Bento: Tienda destacada (primera) vs Secundarias
  const featuredStore = sortedStores.find((s) => s.isFeatured) || sortedStores[0];
  const secondaryStores = sortedStores.filter((s) => s.id !== featuredStore?.id);

  const handleStoreNavigation = (slug) => {
    if (onSelectStore) {
      onSelectStore(slug);
    } else if (goToStore) {
      goToStore(slug);
    }
  };

  return (
    <main className="store-directory-wrapper w-full bg-slate-50 min-h-screen text-slate-800 antialiased">
      {/* 1. SECCIÓN SUPERIOR: TÍTULO Y SUBTÍTULO */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Red Hiperlocal Activa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-headline">
            Encuentra tu minimarket más cercano en tiempo real
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-3xl">
            Compara precios, verifica disponibilidad y pide directo a tu puerta o retira en local sin comisiones.
          </p>
        </div>
      </section>

      {/* 2. SECCIÓN HERO: MAPA VECTORIAL CON BARRA FLOTANTE DE BÚSQUEDA Y CONTROLES */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white">
          {/* Barra de Búsqueda y Filtros Flotantes Sobre el Mapa */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-6 right-3 sm:right-6 z-30 pointer-events-auto">
            <StoreSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              activeFilters={activeFilters}
              onToggleFilter={handleToggleFilter}
              zoneOptions={zoneOptions}
            />
          </div>

          {/* Canvas Interactivo del Mapa */}
          <div className="pt-24 sm:pt-28 md:pt-24">
            <NeighborhoodMap
              stores={stores}
              selectedStore={stores.find((s) => s.slug === selectedStoreSlug)}
              onSelectStore={(slug) => setSelectedStoreSlug(slug)}
              onEnterStore={handleStoreNavigation}
              userLocation={selectedLocation}
            />
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN DIRECTO: CUADRÍCULA MULTICOLUMNA BENTO */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Cabecera de Conteo y Ordenación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-headline">
              {sortedStores.length} {sortedStores.length === 1 ? 'minimarket disponible' : 'minimarkets disponibles'} en tu sector
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl shadow-xs border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="nearest">Más Cercanos</option>
              <option value="rating">Mejor Valorados</option>
              <option value="fastest">Delivery Más Rápido</option>
            </select>
          </div>
        </div>

        {/* Cuadrícula Bento */}
        {sortedStores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center my-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No se encontraron minimarkets con los filtros actuales
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Prueba cambiando la zona seleccionada o desactivando algunos de los filtros rápidos.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedZone('all');
                setActiveFilters({
                  openNow: false,
                  freeDelivery: false,
                  fastPickup: false,
                  acceptsQr: false,
                  topRated: false,
                  hasPoints: false
                });
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
            {/* TARJETA DESTACADA HORIZONTAL (8 Columnas en Desktop) */}
            {featuredStore && (
              <div className="lg:col-span-8 flex flex-col">
                <StoreCard
                  store={featuredStore}
                  variant="featured"
                  onSelect={handleStoreNavigation}
                />
              </div>
            )}

            {/* COLUMNA SECUNDARIA (4 Columnas en Desktop, apiladas) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {secondaryStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  variant="compact"
                  onSelect={handleStoreNavigation}
                />
              ))}

              {secondaryStores.length === 0 && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                  <Building2 className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">
                    Mostrando la tienda con mayor cobertura en este sector.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. BANNER COMUNITARIO DE CONVERSIÓN / REGISTRO DE DUEÑOS */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-16">
        <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 rounded-2xl sm:rounded-3xl shadow-xs border border-emerald-200/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-start gap-4 z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
              <Store className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug font-headline">
                ¿Tienes una tienda de barrio o minimarket en este condominio?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Publica tu tienda gratis en MarketSaaS y empieza a recibir pedidos directos por WhatsApp de tus vecinos con 0% de comisiones por transacción.
              </p>
            </div>
          </div>

          <div className="z-10 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal()}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar mi Tienda Gratis</span>
            </button>
          </div>

          {/* Acento de resplandor decorativo */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-400/10 pointer-events-none blur-2xl" />
        </div>
      </section>
    </main>
  );
};
