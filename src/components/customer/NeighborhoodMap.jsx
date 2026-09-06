import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Store, 
  MapPin, 
  Star, 
  Plus, 
  Minus, 
  Navigation, 
  ExternalLink,
  Compass,
  ShoppingBag,
  Sparkles,
  Pin,
  Settings2,
  X,
  Check,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import './NeighborhoodMap.css';

// Coordenadas fijas y precisas: Plaza Metropolitana 24 de Septiembre (Centro de la Ciudad, Santa Cruz de la Sierra)
const DEFAULT_CITY_CENTER_COORDS = {
  lat: -17.78335,
  lng: -63.18214,
  name: 'Plaza Metropolitana 24 de Septiembre'
};

const ZONE_COORDINATES = {
  'Condominio Las Palmas': { lat: -17.7942, lng: -63.2031, name: 'Condominio Las Palmas' },
  'Condominio Altos del Valle': { lat: -17.7885, lng: -63.1978, name: 'Condominio Altos del Valle' },
  'Barrio Central (Casas)': { lat: -17.7995, lng: -63.2085, name: 'Barrio Central' },
  'all': DEFAULT_CITY_CENTER_COORDS
};

export const NeighborhoodMap = ({
  allStores = [],
  stores = [],
  selectedStore = null,
  selectedZone = 'all',
  searchQuery = '',
  onSelectStore,
  onEnterStore,
  onUserLocationChange,
  userLocation = { condominium: 'Condominio Las Palmas', tower: 'Torre A', apartment: '302' }
}) => {
  // masterStores garantiza acceso al catálogo completo incluso si se aplican filtros de búsqueda
  const masterStores = useMemo(() => {
    return allStores.length > 0 ? allStores : stores;
  }, [allStores, stores]);

  const [mapType, setMapType] = useState('map'); // 'map' | 'satellite'
  const [zoomLevel, setZoomLevel] = useState(15); // Ligero zoom (15) para ver con claridad la Plaza 24 de Septiembre
  const [isRecentering, setIsRecentering] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const isFirstZoneEffect = useRef(true);

  // La tienda activa se define cuando el usuario hace clic en una tienda
  const activeStore = selectedStore;

  // Estado de coordenadas activas: arranca por defecto en la Plaza 24 de Septiembre
  const [currentCoords, setCurrentCoords] = useState(() => {
    if (activeStore?.googleMapsCoordinates) {
      return activeStore.googleMapsCoordinates;
    }
    return DEFAULT_CITY_CENTER_COORDS;
  });

  const [activeLocationType, setActiveLocationType] = useState(() => {
    return activeStore ? 'store' : 'plaza';
  });

  // Manejo de tiendas fijadas (Favoritas) guardadas en localStorage (máximo 3)
  const [pinnedSlugs, setPinnedSlugs] = useState(() => {
    try {
      const saved = localStorage.getItem('marketsaas_pinned_store_slugs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3);
        }
      }
    } catch (e) {
      console.error('Error al leer tiendas fijadas:', e);
    }
    // Por defecto fijamos hasta las 3 primeras tiendas
    const initialList = allStores.length > 0 ? allStores : stores;
    return initialList.slice(0, 3).map((s) => s.slug);
  });

  // Sincronizar pinnedSlugs por defecto si la lista de tiendas llega de forma asíncrona
  useEffect(() => {
    if (pinnedSlugs.length === 0 && masterStores.length > 0) {
      const defaultPins = masterStores.slice(0, 3).map((s) => s.slug);
      setPinnedSlugs(defaultPins);
      try {
        localStorage.setItem('marketsaas_pinned_store_slugs', JSON.stringify(defaultPins));
      } catch (e) {
        console.error(e);
      }
    }
  }, [masterStores, pinnedSlugs.length]);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false); // Por defecto oculto
  const quickMenuRef = useRef(null);
  const [pinFeedbackMessage, setPinFeedbackMessage] = useState(null);

  // Cerrar el menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target)) {
        setIsQuickMenuOpen(false);
      }
    };
    if (isQuickMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isQuickMenuOpen]);

  const showFeedback = (msg) => {
    setPinFeedbackMessage(msg);
    setTimeout(() => {
      setPinFeedbackMessage(null);
    }, 3200);
  };

  const togglePinStore = (storeSlug) => {
    setPinnedSlugs((prev) => {
      let updated;
      if (prev.includes(storeSlug)) {
        if (prev.length <= 1) {
          showFeedback('Debes mantener al menos 1 tienda fijada en accesos rápidos.');
          return prev;
        }
        updated = prev.filter((slug) => slug !== storeSlug);
        showFeedback('Tienda retirada de tus accesos rápidos fijados.');
      } else {
        if (prev.length >= 3) {
          showFeedback('Límite de 3 alcanzado. Desmarca una tienda primero.');
          return prev;
        }
        updated = [...prev, storeSlug];
        showFeedback('¡Tienda fijada con éxito en tu mapa!');
      }
      try {
        localStorage.setItem('marketsaas_pinned_store_slugs', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Tiendas actualmente fijadas para los chips superiores (siempre basadas en masterStores)
  const pinnedStores = useMemo(() => {
    const list = pinnedSlugs
      .map((slug) => masterStores.find((s) => s.slug === slug))
      .filter(Boolean);
    if (list.length > 0) return list;
    return masterStores.slice(0, 3);
  }, [masterStores, pinnedSlugs]);

  // Si cambia la tienda seleccionada desde el directorio o los chips
  useEffect(() => {
    if (selectedStore?.googleMapsCoordinates) {
      setCurrentCoords(selectedStore.googleMapsCoordinates);
      setActiveLocationType('store');
      setZoomLevel(16);
    }
  }, [selectedStore]);

  // Si el usuario escribe en el buscador general, activamos modo búsqueda para mostrar todas las ubicaciones en el mapa
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      setActiveLocationType('search');
    }
  }, [searchQuery]);

  // Controles de Zoom
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 19));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 3));
  };

  // Obtener la ubicación GPS real del usuario desde el navegador y centrar el mapa
  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      showFeedback('Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setIsLocating(true);
    setIsRecentering(true);
    if (onSelectStore) onSelectStore(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userCoords = {
          lat: latitude,
          lng: longitude,
          name: 'Mi Ubicacion'
        };
        setCurrentCoords(userCoords);
        setZoomLevel(17); // Zoom a nivel de calle para la ubicación real del usuario
        setActiveLocationType('user');
        setIsLocating(false);
        setIsRecentering(false);
        showFeedback('📍 Ubicación GPS detectada en tiempo real');
        if (onUserLocationChange) {
          onUserLocationChange(userCoords);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        setIsRecentering(false);
        let errorMsg = 'No se pudo obtener tu ubicación GPS.';
        if (error.code === 1) {
          errorMsg = 'Permiso de ubicación denegado por el navegador.';
        } else if (error.code === 2) {
          errorMsg = 'Señal GPS no disponible actualmente.';
        } else if (error.code === 3) {
          errorMsg = 'Tiempo de espera agotado al obtener ubicación.';
        }
        showFeedback(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Selección de tienda desde los chips del mapa
  const handleSelectStoreTarget = (store) => {
    onSelectStore && onSelectStore(store.slug);
    if (store.googleMapsCoordinates) {
      setCurrentCoords(store.googleMapsCoordinates);
    } else {
      setCurrentCoords(DEFAULT_CITY_CENTER_COORDS);
    }
    setZoomLevel(16);
    setActiveLocationType('store');
  };

  // Enlace directo para navegación en la App oficial de Google Maps
  const externalGoogleMapsUrl = useMemo(() => {
    if (searchQuery && searchQuery.trim().length >= 2 && activeLocationType !== 'store') {
      const qText = searchQuery.trim();
      const queryParam = qText.toLowerCase().includes('santa cruz') ? qText : `${qText} Santa Cruz de la Sierra`;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParam)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`;
  }, [currentCoords, searchQuery, activeLocationType]);

  // Construcción de la URL de Google Maps Embed interactivo con soporte de búsqueda multi-marcador
  const googleMapsEmbedUrl = useMemo(() => {
    const mapTypeCode = mapType === 'satellite' ? 'k' : 'm';

    // 1. Si el usuario activó "Mi Ubicación": Prioridad absoluta para centrar y colocar pin de su GPS
    if (activeLocationType === 'user') {
      return `https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}+(Tu+Ubicaci%C3%B3n+GPS)&t=${mapTypeCode}&z=${zoomLevel}&hl=es&ie=UTF8&output=embed`;
    }

    // 2. Si hay una tienda seleccionada específicamente
    if (activeStore?.googleMapsCoordinates && activeLocationType === 'store') {
      const storeLabel = encodeURIComponent(activeStore.name);
      return `https://maps.google.com/maps?q=${activeStore.googleMapsCoordinates.lat},${activeStore.googleMapsCoordinates.lng}+(${storeLabel})&t=${mapTypeCode}&z=${zoomLevel}&hl=es&ie=UTF8&output=embed`;
    }

    // 3. Si hay una búsqueda activa (ej. "Supermercado Tía", "Amarket", etc.)
    if (searchQuery && searchQuery.trim().length >= 2) {
      const qText = searchQuery.trim();
      const queryParam = qText.toLowerCase().includes('santa cruz')
        ? qText
        : `${qText} Santa Cruz de la Sierra`;
      return `https://maps.google.com/maps?q=${encodeURIComponent(queryParam)}&t=${mapTypeCode}&z=13&hl=es&ie=UTF8&output=embed`;
    }

    // 4. Ubicación por defecto (Centro de Santa Cruz)
    return `https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}+(Centro+Santa+Cruz)&t=${mapTypeCode}&z=${zoomLevel}&hl=es&ie=UTF8&output=embed`;
  }, [currentCoords, mapType, zoomLevel, searchQuery, activeStore, activeLocationType]);

  return (
    <div className="google-map-component-container relative w-full h-[440px] sm:h-[480px] md:h-[520px] bg-slate-100 rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 select-none">
      
      {/* 1. MOTOR INTERACTIVO GOOGLE MAPS CENTRADO EXACTO CON MARCADORES MÚLTIPLES */}
      <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isRecentering ? 'opacity-70' : 'opacity-100'}`}>
        <iframe
          key={`${searchQuery}-${activeLocationType}-${currentCoords.lat}-${currentCoords.lng}-${mapType}-${zoomLevel}`}
          title="Google Maps Hiperlocal MarketSaaS"
          src={googleMapsEmbedUrl}
          className="w-full h-full border-0 pointer-events-auto"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* 2. MENÚ DESPLEGABLE FLOTANTE: ACCESO RÁPIDO A MI UBICACIÓN Y TIENDAS FIJADAS (OCULTO POR DEFECTO) */}
      <div ref={quickMenuRef} className="absolute top-3 right-3 sm:right-4 z-30 pointer-events-auto">
        {/* Botón Disparador del Menú Desplegable */}
        <button
          type="button"
          onClick={() => setIsQuickMenuOpen((prev) => !prev)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md backdrop-blur-md transition-all cursor-pointer border ${
            isQuickMenuOpen
              ? 'bg-slate-900 text-white border-slate-800 shadow-slate-900/25 ring-2 ring-emerald-400/50'
              : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 hover:shadow-lg'
          }`}
          aria-expanded={isQuickMenuOpen}
          title="Ver mi ubicación GPS y tiendas favoritas fijadas"
        >
          <Navigation className={`w-3.5 h-3.5 ${activeLocationType === 'user' ? 'text-sky-400' : 'text-emerald-600'}`} />
          <span>Ubicaciones Rápidas</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
            isQuickMenuOpen ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {pinnedSlugs.length}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQuickMenuOpen ? 'rotate-180' : 'text-slate-400'}`} />
        </button>

        {/* Panel Desplegable Flotante */}
        {isQuickMenuOpen && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-40 transition-all">
            {/* Cabecera del desplegable */}
            <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>Accesos Directos</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {pinnedSlugs.length}/3 fijadas
              </span>
            </div>

            {/* 1. SECCIÓN: MI UBICACIÓN GPS */}
            <div className="p-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleGetUserLocation();
                  setIsQuickMenuOpen(false);
                }}
                disabled={isLocating}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeLocationType === 'user'
                    ? 'bg-slate-900 text-white border-slate-800 shadow-xs ring-1 ring-emerald-400/40'
                    : 'bg-slate-50/60 hover:bg-slate-100/80 text-slate-800 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    activeLocationType === 'user' ? 'bg-white/20 text-sky-300' : 'bg-sky-50 text-sky-600 border border-sky-200/80'
                  }`}>
                    {isLocating ? (
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="leading-tight">Mi Ubicación</div>
                    <div className={`text-[10px] font-normal mt-0.5 ${activeLocationType === 'user' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {isLocating ? 'Obteniendo señal GPS...' : 'Centrar mapa con tu GPS'}
                    </div>
                  </div>
                </div>
                {activeLocationType === 'user' && (
                  <span className="text-[10px] font-bold bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                    En mapa
                  </span>
                )}
              </button>
            </div>

            {/* 2. SECCIÓN: TIENDAS FIJADAS */}
            <div className="p-2">
              <div className="px-1.5 pb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
                <div className="flex items-center gap-1">
                  <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>Minimarkets Fijados</span>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {pinnedStores.map((s) => {
                  const isSelected = activeStore?.slug === s.slug && activeLocationType === 'store';
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        handleSelectStoreTarget(s);
                        setIsQuickMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs ring-1 ring-white/40'
                          : 'bg-white hover:bg-emerald-50/60 text-slate-800 border-slate-200 hover:border-emerald-200'
                      }`}
                      title={`Ver ${s.name} en el mapa`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Store className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                        <span className="truncate text-left leading-tight font-medium">{s.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.distanceMeters ? `${s.distanceMeters}m` : 'Cerca'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. SECCIÓN: GESTIONAR TIENDAS FIJADAS (FIJADAS 3/3) */}
            <div className="p-2 border-t border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => {
                  setIsQuickMenuOpen(false);
                  setIsPinModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gestionar fijadas ({pinnedSlugs.length}/3)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notificación de Feedback sutil sobre el mapa */}
      {pinFeedbackMessage && !isPinModalOpen && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg border border-slate-700/80 flex items-center gap-1.5 pointer-events-none transition-all">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{pinFeedbackMessage}</span>
        </div>
      )}

      {/* 3. CARD FLOTANTE INTERACTIVA DE LA TIENDA SELECCIONADA */}
      {activeStore && (
        <div className="absolute left-3 sm:left-4 bottom-14 sm:bottom-16 z-20 max-w-[280px] sm:max-w-[320px] w-full pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl border border-slate-200/90 flex flex-col gap-2 transition-all transform hover:scale-[1.02]">
            
            {/* Cabecera de la Tienda */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                    {activeStore.name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{activeStore.rating || 4.8}</span>
                    <span className="text-slate-400 font-normal">• {activeStore.deliveryTime || '10-15 min'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Botón directo de Fijar/Desfijar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinStore(activeStore.slug);
                  }}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                    pinnedSlugs.includes(activeStore.slug)
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={pinnedSlugs.includes(activeStore.slug) ? 'Quitar de accesos rápidos fijados' : 'Fijar en accesos rápidos del mapa (máx. 3)'}
                >
                  <Pin className={`w-2.5 h-2.5 ${pinnedSlugs.includes(activeStore.slug) ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                  <span>{pinnedSlugs.includes(activeStore.slug) ? 'Fijada' : 'Fijar'}</span>
                </button>

                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En vivo
                </span>
              </div>
            </div>

            {/* Dirección y Distancia */}
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
              <span className="truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                {activeStore.address}
              </span>
              <span className="font-bold text-slate-900 shrink-0 ml-1">
                {activeStore.distanceMeters ? `a ${activeStore.distanceMeters}m` : 'Cerca'}
              </span>
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => onEnterStore && onEnterStore(activeStore.slug)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ver Catálogo</span>
              </button>

              <a
                href={externalGoogleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                title="Abrir ubicación en la aplicación de Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                <span>Cómo llegar</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* 3.1 CARD FLOTANTE INTERACTIVA: UBICACIÓN GPS DEL USUARIO */}
      {activeLocationType === 'user' && !activeStore && (
        <div className="absolute left-3 sm:left-4 bottom-14 sm:bottom-16 z-20 max-w-[290px] sm:max-w-[340px] w-full pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-white flex flex-col gap-2.5 transition-all transform hover:scale-[1.02]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-xs">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-white leading-tight flex items-center gap-1.5">
                    <span>Tu Ubicación GPS</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h4>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                En vivo
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              El mapa y el listado inferior se han actualizado con las distancias reales a tus minimarkets más cercanos.
            </p>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('stores-grid-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ver tiendas más cercanas abajo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. MODAL GESTIONAR TIENDAS FIJADAS (MÁXIMO 3) */}
      {isPinModalOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col">
            {/* Cabecera del modal */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Pin className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Tiendas Fijadas en tu Mapa</h3>
                  <p className="text-[11px] text-slate-500">Hasta 3 minimarkets favoritos rápidos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  pinnedSlugs.length === 3 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {pinnedSlugs.length} de 3
                </span>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Aviso dinámico si existe feedback */}
            {pinFeedbackMessage && (
              <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-3.5 py-2 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{pinFeedbackMessage}</span>
              </div>
            )}

            {/* Lista de minimarkets */}
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {masterStores.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No hay minimarkets disponibles en el catálogo.
                </div>
              ) : (
                masterStores.map((store) => {
                  const isPinned = pinnedSlugs.includes(store.slug);
                  const isLimitReached = !isPinned && pinnedSlugs.length >= 3;

                return (
                  <div 
                    key={store.id} 
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                      isPinned 
                        ? 'bg-amber-50/40 border-amber-200 shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                        <img 
                          src={store.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'} 
                          alt={store.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{store.name}</h4>
                          {isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                          <span>{store.condominium || store.address}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">{store.distanceMeters ? `a ${store.distanceMeters}m` : 'Cerca'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePinStore(store.slug)}
                      disabled={isLimitReached}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                        isPinned
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs active:scale-95'
                          : isLimitReached
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95'
                      }`}
                      title={isLimitReached ? 'Límite de 3 tiendas alcanzado. Desmarca otra primero.' : ''}
                    >
                      {isPinned ? '✓ Fijada' : isLimitReached ? 'Límite' : '+ Fijar'}
                    </button>
                  </div>
                );
              })
            )}
            </div>

            {/* Pie del modal */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] text-slate-500">
                Se guarda en tu navegador automáticamente.
              </span>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTROLES INFERIORES: GPS, SATÉLITE Y ZOOM */}
      {/* Lado Izquierdo: Estado de Cobertura */}
      <div className="absolute bottom-3 left-3 sm:left-4 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-slate-800 text-[11px] font-semibold border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-700">
            {activeLocationType === 'plaza' ? 'Plaza 24 de Septiembre' : 'Google Maps Centrado'}
          </span>
          <span className="text-slate-400">•</span>
          <span>{activeLocationType === 'plaza' ? 'Vista Panorámica Centro' : 'Radio 600m'}</span>
        </div>
      </div>

      {/* Lado Derecho: Toggle Satélite y Zoom */}
      <div className="absolute bottom-3 right-3 sm:right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {/* Toggle Mapa / Satélite */}
        <div className="flex items-center bg-white/95 backdrop-blur-md p-0.5 rounded-xl shadow-md border border-slate-200">
          <button 
            type="button"
            onClick={() => setMapType('map')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              mapType === 'map' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ Mapa
          </button>
          <button 
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              mapType === 'satellite' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛰️ Satélite
          </button>
        </div>

        {/* Controles de Zoom */}
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-slate-200">
          <button 
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-800 font-bold text-sm cursor-pointer active:bg-slate-200 transition-colors"
            title="Acercar mapa"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="h-[1px] bg-slate-200" />
          <button 
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-800 font-bold text-sm cursor-pointer active:bg-slate-200 transition-colors"
            title="Alejar mapa"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
