import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreSearchBar } from './StoreSearchBar';
import { NeighborhoodMap } from './NeighborhoodMap';
import { StoreCard } from './StoreCard';
import { calculateDistanceMeters, formatDistance } from '../../utils/geoUtils';
import { 
  Store, 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  PlusCircle, 
  Building2,
  SlidersHorizontal,
  ChevronDown,
  Navigation,
  Truck,
  Clock,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import './StoreDirectory.css';

// Punto de referencia inicial: Plaza Metropolitana 24 de Septiembre (Centro de Santa Cruz de la Sierra)
const DEFAULT_REFERENCE_COORDS = {
  lat: -17.78335,
  lng: -63.18214,
  name: 'Plaza 24 de Septiembre'
};

// Función auxiliar para normalizar texto (sin tildes, minúsculas y sin espacios extra)
const normalizeText = (str) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const StoreDirectory = ({ onSelectStore, onOpenAuthModal }) => {
  const { stores, selectedLocation, goToStore, showToast } = useStore();

  // Estados de geolocalización del usuario
  const [userCoords, setUserCoords] = useState(DEFAULT_REFERENCE_COORDS);
  const [hasUserGps, setHasUserGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'loading' | 'granted' | 'denied'
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');

  // Estados de búsqueda, filtros y ordenación
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    openNow: false,
    registeredOnly: false,
    acceptsQr: false,
    topRated: false
  });
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'rating' | 'fastest'
  const [selectedStoreSlug, setSelectedStoreSlug] = useState(null);

  // Solicitar ubicación GPS real del usuario
  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      setGpsErrorMsg('Tu navegador no admite geolocalización.');
      showToast?.('Tu navegador no admite geolocalización GPS.', 'warning');
      return;
    }

    setGpsStatus('loading');
    setGpsErrorMsg('');

    const onLocationSuccess = (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        name: 'Mi Ubicación GPS'
      };
      setUserCoords(coords);
      setHasUserGps(true);
      setGpsStatus('granted');
      setGpsErrorMsg('');
      setSortBy('nearest');
    };

    const onLocationError = (error) => {
      console.warn('Geolocation high accuracy failed on device, trying network fallback:', error);
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        (fallbackErr) => {
          console.warn('Geolocation fallback failed:', fallbackErr);
          setGpsStatus('denied');
          let msg = 'No se pudo obtener tu ubicación GPS.';
          if (fallbackErr.code === 1) {
            msg = 'Permiso de ubicación denegado en tu navegador/teléfono.';
          } else if (fallbackErr.code === 2) {
            msg = 'Señal GPS no disponible temporalmente.';
          } else {
            msg = 'Tiempo de espera agotado al conectar con el GPS.';
          }
          setGpsErrorMsg(msg);
          showToast?.(msg, 'warning');
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 60000
      }
    );
  }, [showToast]);

  // Solicitar automáticamente la ubicación al montar la pantalla vecino
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Notificación de nueva ubicación GPS detectada desde el mapa
  const handleUserLocationChange = (coords) => {
    if (coords && coords.lat && coords.lng) {
      setUserCoords(coords);
      setHasUserGps(true);
      setGpsStatus('granted');
      setSortBy('nearest');
    }
  };

  // Alternar filtro rápido
  const handleToggleFilter = (filterId) => {
    setActiveFilters((prev) => {
      const willBeActive = !prev[filterId];
      const updated = {
        ...prev,
        [filterId]: willBeActive
      };

      // Si se activa o desactiva "Tiendas Registradas" o "Abiertas Ahora", limpiamos la tienda seleccionada para ver la vista general
      if (filterId === 'registeredOnly' || filterId === 'openNow') {
        setSelectedStoreSlug(null);
      }

      return updated;
    });
  };

  const handleSearchSubmit = () => {
    const listElement = document.getElementById('stores-grid-section');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Enriquecer tiendas con cálculo de distancia real en base a userCoords
  const storesWithDistance = useMemo(() => {
    return stores.map((store) => {
      const coords = store.googleMapsCoordinates || DEFAULT_REFERENCE_COORDS;
      const meters = calculateDistanceMeters(
        userCoords.lat,
        userCoords.lng,
        coords.lat,
        coords.lng
      );
      return {
        ...store,
        distanceMeters: meters,
        distance: formatDistance(meters)
      };
    });
  }, [stores, userCoords]);

  // Filtrado reactivo de tiendas con normalización de acentos y búsqueda multi-palabra
  const filteredStores = useMemo(() => {
    return storesWithDistance.filter((store) => {
      // 1. Filtro de Texto (Búsqueda por nombre, dirección, productos destacados o categoría)
      if (searchQuery.trim()) {
        const queryNorm = normalizeText(searchQuery);
        const tokens = queryNorm.split(/\s+/).filter(Boolean);

        const storeContent = [
          store.name,
          store.address,
          store.condominium,
          store.category,
          ...(store.featuredProducts?.map((p) => p.name) || []),
          ...(store.perks?.map((p) => p.text) || [])
        ]
          .map(normalizeText)
          .join(' ');

        const matches = tokens.every((token) => storeContent.includes(token));
        if (!matches) {
          return false;
        }
      }

      // 2. Filtros Rápidos (Pills)
      if (activeFilters.openNow && !store.isOpen) return false;
      if (activeFilters.registeredOnly && !store.isRegisteredStore) return false;
      if (activeFilters.acceptsQr && !store.acceptsQr) return false;
      if (activeFilters.topRated && (store.rating || 0) < 4.8) return false;

      return true;
    });
  }, [storesWithDistance, searchQuery, activeFilters]);

  // Ordenación de tiendas por cercanía a la ubicación del cliente
  const sortedStores = useMemo(() => {
    const list = [...filteredStores];
    if (sortBy === 'nearest') {
      list.sort((a, b) => (a.distanceMeters ?? 999999) - (b.distanceMeters ?? 999999));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'fastest') {
      list.sort((a, b) => (parseInt(a.deliveryTime) || 99) - (parseInt(b.deliveryTime) || 99));
    }
    return list;
  }, [filteredStores, sortBy]);

  // Separación para la cuadrícula Bento:
  // Tarjeta Destacada Principal (a la izquierda): la tienda seleccionada en el mapa o la más cercana por defecto
  const featuredStore = useMemo(() => {
    if (selectedStoreSlug) {
      const selected = sortedStores.find((s) => s.slug === selectedStoreSlug) ||
                       storesWithDistance.find((s) => s.slug === selectedStoreSlug);
      if (selected) return selected;
    }
    return sortedStores[0] || null;
  }, [sortedStores, storesWithDistance, selectedStoreSlug]);

  // Tarjetas Secundarias con Mayor Cobertura (a la derecha):
  // Si hay más tiendas, ordenadas por cobertura/servicio de delivery y volumen (excluyendo a la destacada)
  const coverageStores = useMemo(() => {
    if (sortedStores.length <= 1) return [];
    const others = sortedStores.filter((s) => s.slug !== featuredStore?.slug);
    return others.sort((a, b) => {
      // Priorizar tiendas abiertas, con delivery y mayor número de pedidos
      const scoreA = (a.isOpen ? 100 : 0) + (a.hasFastDelivery ? 50 : 0) + (a.ordersCount || 0);
      const scoreB = (b.isOpen ? 100 : 0) + (b.hasFastDelivery ? 50 : 0) + (b.ordersCount || 0);
      return scoreB - scoreA;
    });
  }, [sortedStores, featuredStore]);

  const handleStoreNavigation = (slug) => {
    if (onSelectStore) {
      onSelectStore(slug);
    } else if (goToStore) {
      goToStore(slug);
    }
  };

  const handleViewStoreOnMap = (slug) => {
    setSelectedStoreSlug(slug);
    const mapElement = document.getElementById('map-directory-container');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Manejar selección de tienda desde el mapa para actualizar la tarjeta destacada principal
  const handleSelectStoreFromMap = (slug) => {
    setSelectedStoreSlug(slug);
    if (slug) {
      setTimeout(() => {
        const targetElement = document.getElementById('featured-store-target');
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  // Obtener la tienda seleccionada activa SOLO cuando el usuario hace clic en una tienda
  const activeSelectedStore = useMemo(() => {
    if (selectedStoreSlug) {
      const found = storesWithDistance.find((s) => s.slug === selectedStoreSlug);
      if (found) return found;
    }
    return null;
  }, [storesWithDistance, selectedStoreSlug]);

  return (
    <main className="store-directory-wrapper w-full bg-slate-50 min-h-screen text-slate-800 antialiased overflow-x-hidden">
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

      {/* 2. SECCIÓN HERO: BARRA DE BÚSQUEDA Y GOOGLE MAPS INTERACTIVO */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        {/* Barra de Búsqueda y Filtros Rápidos */}
        <div className="mb-4 sm:mb-5">
          <StoreSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            onSearchSubmit={handleSearchSubmit}
          />
        </div>

        {/* Canvas de Google Maps */}
        <div id="map-directory-container" className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white">
          <NeighborhoodMap
            allStores={storesWithDistance}
            stores={storesWithDistance}
            selectedStore={activeSelectedStore}
            selectedZone="all"
            searchQuery={searchQuery}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            onSelectStore={handleSelectStoreFromMap}
            onEnterStore={handleStoreNavigation}
            onUserLocationChange={handleUserLocationChange}
            userLocation={selectedLocation}
            userCoordinates={userCoords}
            hasUserGps={hasUserGps}
          />
        </div>
      </section>

      {/* 3. SECCIÓN DIRECTO: CUADRÍCULA MULTICOLUMNA BENTO */}
      <section id="stores-grid-section" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 overflow-x-hidden">
        {/* Cabecera de Conteo, Estado de GPS y Ordenación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200">
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping mt-1.5 sm:mt-0 shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-headline">
                {sortedStores.length} {sortedStores.length === 1 ? 'tienda cercana' : 'tiendas cercanas'} a tu ubicación
              </h2>
              <div className="text-xs text-slate-500 font-medium mt-1">
                {gpsStatus === 'loading' ? (
                  <span className="text-blue-700 font-semibold inline-flex items-center gap-1.5 animate-pulse">
                    <Navigation className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    Solicitando tu ubicación para calcular distancias exactas a los minimarkets...
                  </span>
                ) : hasUserGps ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-emerald-700 font-semibold inline-flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <Navigation className="w-3.5 h-3.5 text-emerald-600 inline" />
                      Distancias calculadas con tu ubicación GPS en tiempo real
                    </span>
                    <button
                      type="button"
                      onClick={requestUserLocation}
                      className="text-[11px] text-slate-500 hover:text-emerald-700 underline font-medium cursor-pointer"
                      title="Volver a calibrar ubicación GPS"
                    >
                      (Recalibrar)
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>
                      📍 Distancias calculadas desde Centro de Santa Cruz
                    </span>
                    <button
                      type="button"
                      onClick={requestUserLocation}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Usar mi ubicación GPS</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
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

        {/* Cuadrícula de Tiendas */}
        {sortedStores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center my-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No se encontraron minimarkets con los filtros actuales
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Prueba cambiando los términos de búsqueda o desactivando algunos de los filtros rápidos.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilters({
                  openNow: false,
                  registeredOnly: false,
                  acceptsQr: false,
                  topRated: false
                });
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : coverageStores.length === 0 ? (
          /* CASO 1: TIENDA ÚNICA EN EL VECINDARIO (Ancho completo, espaciosa y sin recortes ni scroll) */
          <div className="mt-6 w-full min-w-0">
            {featuredStore && (
              <div id="featured-store-target" className="w-full flex flex-col scroll-mt-6 min-w-0">
                <div className="flex items-center justify-between pb-2 mb-2 px-1 text-xs text-slate-500 font-semibold min-w-0">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Tienda Oficial en Tu Vecindario</span>
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold shrink-0">
                    {featuredStore.distance} de ti
                  </span>
                </div>

                <StoreCard
                  store={featuredStore}
                  variant="featured"
                  isNearest={true}
                  onSelect={handleStoreNavigation}
                  onViewOnMap={handleViewStoreOnMap}
                />
              </div>
            )}
          </div>
        ) : (
          /* CASO 2: MULTI-TIENDA (Bento Grid con Tarjeta Destacada y Tarjetas Secundarias Compactas) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start w-full min-w-0">
            {/* TARJETA DESTACADA PRINCIPAL (8 Columnas en Desktop) */}
            {featuredStore && (
              <div id="featured-store-target" className="lg:col-span-7 xl:col-span-8 flex flex-col scroll-mt-6 min-w-0">
                <div className="flex items-center justify-between pb-2 mb-2 px-1 text-xs text-slate-500 font-semibold min-w-0">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {selectedStoreSlug && featuredStore.slug === selectedStoreSlug ? (
                      <span className="flex items-center gap-1.5 truncate">
                        <span>Tienda Seleccionada:</span>
                        <span className="text-emerald-700 font-black truncate">{featuredStore.name}</span>
                      </span>
                    ) : (
                      'Tienda Más Cercana a Tu Ubicación'
                    )}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedStoreSlug && featuredStore.slug === selectedStoreSlug && (
                      <button
                        type="button"
                        onClick={() => setSelectedStoreSlug(null)}
                        className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 underline cursor-pointer"
                        title="Ver la tienda más cercana nuevamente"
                      >
                        (Ver más cercana)
                      </button>
                    )}
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                      {featuredStore.distance} de ti
                    </span>
                  </div>
                </div>

                <StoreCard
                  store={featuredStore}
                  variant="featured"
                  isNearest={featuredStore.slug === sortedStores[0]?.slug}
                  onSelect={handleStoreNavigation}
                  onViewOnMap={handleViewStoreOnMap}
                />
              </div>
            )}

            {/* COLUMNA SECUNDARIA: TARJETAS COMPACTAS (5/4 Columnas en Desktop) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-w-0">
              <div className="flex items-center justify-between pb-2 mb-2 px-1 text-xs text-slate-500 font-semibold min-w-0">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                  <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Otros Minimarkets Cercanos</span>
                </span>
                <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold shrink-0">
                  {coverageStores.length} {coverageStores.length === 1 ? 'tienda' : 'tiendas'}
                </span>
              </div>

              <div className="secondary-stores-scroller flex flex-col gap-3.5 max-h-[850px] overflow-y-auto pr-1 scroll-smooth min-w-0">
                {coverageStores.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    variant="compact"
                    badgeLabel={store.hasFastDelivery ? "🛵 Mayor Cobertura" : "🛍️ Retiro en Tienda"}
                    onSelect={handleStoreNavigation}
                    onViewOnMap={handleViewStoreOnMap}
                  />
                ))}
              </div>
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
                ¿Tienes una tienda de barrio o minimarket?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Únete a nuestra plataforma y da el salto digital. Te acompañamos paso a paso con asesoría inicial gratuita para configurar tu catálogo y conectar directamente con los vecinos de tu zona.
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
