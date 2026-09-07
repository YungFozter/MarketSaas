import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import './NeighborhoodMap.css';
import { escapeHtml } from '../../utils/formatters';

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
  activeFilters = {},
  onToggleFilter,
  onSelectStore,
  onEnterStore,
  onUserLocationChange,
  userLocation = { condominium: 'Condominio Las Palmas', tower: 'Torre A', apartment: '302' },
  userCoordinates = null,
  hasUserGps = false
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  // masterStores garantiza acceso al catálogo completo incluso si se aplican filtros de búsqueda
  const masterStores = useMemo(() => {
    return allStores.length > 0 ? allStores : stores;
  }, [allStores, stores]);

  // Identificar tiendas registradas y la tienda del dueño actual
  const registeredStores = useMemo(() => {
    return masterStores.filter((s) => s.isRegisteredStore);
  }, [masterStores]);

  const ownerStore = useMemo(() => {
    return (
      masterStores.find((s) => s.isCurrentOwnerStore && s.isRegisteredStore) ||
      masterStores.find((s) => s.isRegisteredStore) ||
      null
    );
  }, [masterStores]);

  const [mapType, setMapType] = useState('map'); // 'map' | 'satellite'
  const [zoomLevel, setZoomLevel] = useState(15);
  const [isRecentering, setIsRecentering] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Tiendas que se deben graficar con marcadores según los filtros activos
  const storesToPlot = useMemo(() => {
    if (activeFilters?.registeredOnly) {
      return registeredStores;
    }
    return masterStores;
  }, [activeFilters?.registeredOnly, registeredStores, masterStores]);

  // Crear DivIcon HTML personalizado para cada tienda
  const createStoreDivIcon = (store, isSelected) => {
    const isRegistered = Boolean(store.isRegisteredStore);
    const isOwner = Boolean(store.isCurrentOwnerStore);
    const ringClass = isOwner ? 'owner-pulse-ring' : isRegistered ? 'registered-pulse-ring' : '';
    const badgeLabel = isOwner ? '⭐ Tu Tienda' : isRegistered ? 'Oficial' : '';
    const bgColor = isOwner ? '#f59e0b' : isRegistered ? '#059669' : '#334155';

    const html = `
      <div class="custom-leaflet-pin ${isSelected ? 'is-active' : ''}">
        ${ringClass ? `<div class="${ringClass}"></div>` : ''}
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: ${bgColor}; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid #ffffff; z-index: 2;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <div style="margin-top: 4px; display: flex; flex-direction: column; align-items: center; z-index: 3;">
          <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(4px); padding: 2px 8px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.18); border: 1px solid rgba(0,0,0,0.08); font-size: 10px; font-weight: 800; color: #0f172a; white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;">
            ${isRegistered ? '<span style="color:#059669; font-size: 8px;">●</span>' : ''}
            <span>${escapeHtml(store.name)}</span>
          </div>
          ${badgeLabel ? `<span style="font-size: 8px; font-weight: 900; text-transform: uppercase; background: ${isOwner ? '#fef3c7' : '#d1fae5'}; color: ${isOwner ? '#92400e' : '#065f46'}; padding: 1px 5px; border-radius: 9999px; margin-top: 1px; border: 0.5px solid ${isOwner ? '#fde68a' : '#a7f3d0'};">${badgeLabel}</span>` : ''}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-pin-wrapper',
      html,
      iconSize: [34, 56],
      iconAnchor: [17, 44]
    });
  };

  // La tienda activa: solo si el usuario seleccionó una tienda específica
  const activeStore = useMemo(() => {
    if (selectedStore) return selectedStore;
    return null;
  }, [selectedStore]);

  // Estado de coordenadas activas: arranca en la tienda activa si existe o en el centro de Santa Cruz
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

  // Asegurar que la tienda registrada del dueño esté siempre presente en accesos rápidos
  useEffect(() => {
    if (ownerStore && !pinnedSlugs.includes(ownerStore.slug)) {
      setPinnedSlugs((prev) => [ownerStore.slug, ...prev.filter((s) => s !== ownerStore.slug)].slice(0, 3));
    }
  }, [ownerStore]);

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

  // 1. INICIALIZAR EL MAPA LEAFLET UNA SOLA VEZ
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = activeStore?.googleMapsCoordinates?.lat || DEFAULT_CITY_CENTER_COORDS.lat;
    const initialLng = activeStore?.googleMapsCoordinates?.lng || DEFAULT_CITY_CENTER_COORDS.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: true
    });

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }
    ).addTo(map);

    tileLayerRef.current = streetLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. CAMBIAR ENTRE TIPO DE MAPA (CALLES / SATÉLITE)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (mapType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri World Imagery',
          maxZoom: 18
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }
      ).addTo(map);
    }
  }, [mapType]);

  // 3. DIBUJAR Y ACTUALIZAR TODOS LOS MARCADORES DE TIENDAS EN EL MAPA
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const validLatLngs = [];

    storesToPlot.forEach((store) => {
      const coords = store.googleMapsCoordinates;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
      if (isNaN(coords.lat) || isNaN(coords.lng)) return;

      const isSelected = activeStore?.slug === store.slug;
      const icon = createStoreDivIcon(store, isSelected);

      const marker = L.marker([coords.lat, coords.lng], { icon });

      marker.on('click', () => {
        if (onSelectStore) {
          onSelectStore(store.slug);
        }
        map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 15), {
          duration: 0.8
        });
        showFeedback(`📍 Seleccionado: ${store.name}`);
      });

      marker.addTo(markersLayer);
      validLatLngs.push([coords.lat, coords.lng]);
    });
  }, [storesToPlot, selectedStore]);

  // 4. CENTRAR CUANDO CAMBIE LA TIENDA SELECCIONADA ESPECÍFICA
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStore?.googleMapsCoordinates) return;
    const { lat, lng } = selectedStore.googleMapsCoordinates;
    map.flyTo([lat, lng], 16, { duration: 0.8 });
  }, [selectedStore]);

  // 4.1 SINCRONIZAR MARCADOR GPS DEL USUARIO
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userCoordinates || !hasUserGps) return;
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }
    const userIcon = L.divIcon({
      className: 'custom-leaflet-pin-wrapper',
      html: '<div class="user-gps-beacon" title="Tu Ubicación GPS"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    userMarkerRef.current = L.marker([userCoordinates.lat, userCoordinates.lng], { icon: userIcon }).addTo(map);
  }, [userCoordinates, hasUserGps]);

  // Controles de Zoom
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Obtener la ubicación GPS real del usuario desde el navegador y centrar el mapa
  const handleGetUserLocation = () => {
    // Si ya tenemos coordenadas GPS del usuario y el mapa está montado, centrar inmediatamente
    if (mapInstanceRef.current && userCoordinates?.lat && userCoordinates?.lng && hasUserGps) {
      mapInstanceRef.current.flyTo([userCoordinates.lat, userCoordinates.lng], 16, { duration: 0.8 });
    }

    if (!navigator.geolocation) {
      showFeedback('Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setIsLocating(true);
    setIsRecentering(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userCoords = {
          lat: latitude,
          lng: longitude,
          name: 'Mi Ubicación'
        };

        const map = mapInstanceRef.current;
        if (map) {
          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }

          const userIcon = L.divIcon({
            className: 'custom-leaflet-pin-wrapper',
            html: '<div class="user-gps-beacon" title="Tu Ubicación GPS"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
          map.flyTo([latitude, longitude], 16, { duration: 1 });
        }

        setIsLocating(false);
        setIsRecentering(false);
        setActiveLocationType('user');
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
        if (error.code === 1) errorMsg = 'Permiso de ubicación denegado.';
        else if (error.code === 2) errorMsg = 'Señal GPS no disponible.';
        else if (error.code === 3) errorMsg = 'Tiempo agotado al obtener GPS.';
        showFeedback(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Selección de tienda desde menú o chips
  const handleSelectStoreTarget = (store) => {
    if (onSelectStore) onSelectStore(store.slug);
    if (mapInstanceRef.current && store.googleMapsCoordinates) {
      mapInstanceRef.current.flyTo(
        [store.googleMapsCoordinates.lat, store.googleMapsCoordinates.lng],
        16,
        { duration: 0.8 }
      );
    }
  };

  // Enlace directo para navegación externa en Google Maps
  const externalGoogleMapsUrl = useMemo(() => {
    if (activeStore?.googleMapsCoordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${activeStore.googleMapsCoordinates.lat},${activeStore.googleMapsCoordinates.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=Santa+Cruz+de+la+Sierra`;
  }, [activeStore]);

  return (
    <div className="google-map-component-container relative w-full h-[440px] sm:h-[480px] md:h-[520px] bg-slate-100 rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 select-none">
      
      {/* 1. MOTOR INTERACTIVO MULTI-MARCADOR LEAFLET */}
      <div 
        ref={mapContainerRef} 
        className={`w-full h-full transition-opacity duration-300 ${isRecentering ? 'opacity-70' : 'opacity-100'}`} 
      />

      {/* 1.1 BOTONES FLOTANTES SUPERIORES: MI UBICACIÓN Y TIENDAS REGISTRADAS */}
      <div className="absolute top-3 left-3 sm:left-4 z-30 pointer-events-auto flex items-center gap-2 flex-wrap">
        {/* Botón Mi Ubicación */}
        <button
          type="button"
          onClick={handleGetUserLocation}
          disabled={isLocating}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md backdrop-blur-md transition-all cursor-pointer border ${
            isLocating
              ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/50 shadow-blue-600/25'
              : hasUserGps
                ? 'bg-white/95 hover:bg-white text-blue-900 border-blue-300 hover:shadow-lg ring-1 ring-blue-400/30'
                : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-blue-400 hover:shadow-lg'
          }`}
          title="Detectar mi ubicación GPS actual y centrar el mapa"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-white' : hasUserGps ? 'text-blue-600' : 'text-slate-600'}`} />
          <span>{isLocating ? 'Obteniendo GPS...' : 'Mi Ubicación'}</span>
          {hasUserGps && !isLocating && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>

        {/* Botón Tiendas Registradas */}
        {registeredStores.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (onToggleFilter) {
                onToggleFilter('registeredOnly');
              }
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md backdrop-blur-md transition-all cursor-pointer border ${
              activeFilters?.registeredOnly
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-emerald-300 hover:shadow-lg'
            }`}
            title="Mostrar todas las tiendas registradas en el mapa"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${activeFilters?.registeredOnly ? 'text-white' : 'text-emerald-600'}`} />
            <span>Tiendas Registradas</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              activeFilters?.registeredOnly
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {registeredStores.length}
            </span>
          </button>
        )}
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

            {/* 1.5 SECCIÓN: TIENDAS OFICIALES REGISTRADAS */}
            {registeredStores.length > 0 && (
              <div className="p-2 border-b border-slate-100 bg-emerald-50/40">
                <div className="px-1.5 pb-1 flex items-center justify-between text-[11px] font-bold text-emerald-900">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Tiendas Registradas ({registeredStores.length})</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700">Ver Pin</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {registeredStores.map((store) => {
                    const isSelected = activeStore?.slug === store.slug && activeLocationType === 'store';
                    return (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => {
                          handleSelectStoreTarget(store);
                          setIsQuickMenuOpen(false);
                          showFeedback(`📍 Mostrando ${store.name}`);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs ring-1 ring-white/40'
                            : 'bg-white hover:bg-emerald-50 text-slate-800 border-emerald-200/80 hover:border-emerald-300'
                        }`}
                        title={`Ver marcador de ${store.name} en el mapa`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Store className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                          <div className="text-left min-w-0 truncate">
                            <div className="truncate font-bold leading-tight flex items-center gap-1">
                              <span>{store.name}</span>
                              {store.isCurrentOwnerStore && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${isSelected ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                  Tu Tienda
                                </span>
                              )}
                            </div>
                            <div className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                              {store.address}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          📍 Pin
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

                {/* Botón para cerrar tarjeta y volver a la vista general */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectStore) onSelectStore(null);
                  }}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0 ml-0.5"
                  title="Cerrar vista de tienda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
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
