import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Store, 
  MapPin, 
  Plus, 
  Minus, 
  Navigation, 
  ExternalLink,
  ShoppingBag,
  X,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './NeighborhoodMap.css';
import { escapeHtml } from '../../utils/formatters';

// Proveedor de mapas de alta fidelidad sin marcas de agua (Esri World Street Map & Esri Satellite)
const STREET_MAP_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const STREET_MAP_ATTRIBUTION = '&copy; Esri &mdash; Street Map';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = '&copy; Esri World Imagery';

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
  activeFilters = null,
  onToggleFilter = null,
  onSelectStore = null,
  onEnterStore = null,
  onUserLocationChange = null,
  userLocation = null,
  userCoordinates = null,
  hasUserGps = false
}) => {
  const { showToast } = useStore();

  const showFeedback = (msg, type = 'info') => {
    if (showToast) {
      showToast(msg, type);
    }
  };

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
  const [isLocating, setIsLocating] = useState(false);
  const [isGpsCardCollapsed, setIsGpsCardCollapsed] = useState(false);

  // Tiendas que se deben graficar con marcadores según los filtros activos
  const storesToPlot = useMemo(() => {
    return masterStores.filter((store) => {
      // 1. Filtro "Abiertas Ahora": Si está activado, ocultar tiendas cerradas
      if (activeFilters?.openNow && store.isOpen === false) {
        return false;
      }
      // 2. Filtro "Tiendas Registradas": Mostrar solo tiendas oficiales
      if (activeFilters?.registeredOnly && !store.isRegisteredStore) {
        return false;
      }
      // 3. Filtro "Aceptan QR"
      if (activeFilters?.acceptsQr && !store.acceptsQr) {
        return false;
      }
      return true;
    });
  }, [masterStores, activeFilters]);

  // Crear DivIcon HTML personalizado para cada tienda (con punta de aguja de precisión milimétrica 1:1)
  const createStoreDivIcon = (store, isSelected) => {
    const isRegistered = Boolean(store.isRegisteredStore);
    const isOwner = Boolean(store.isCurrentOwnerStore);
    const isOpen = store.isOpen !== false;

    // Anillo de pulso dinámico (SOLO para tiendas abiertas)
    const ringClass = isOpen
      ? (isOwner ? 'owner-pulse-ring' : isRegistered ? 'registered-pulse-ring' : '')
      : '';

    let pinColor;
    let strokeColor;
    let badgeText = '';
    let badgeBg = '';
    let badgeColor = '';
    let badgeBorder = '';
    let dotHtml = '';
    let statusPillHtml = '';

    if (!isOpen) {
      pinColor = '#475569';
      strokeColor = '#334155';
      dotHtml = '<span style="color:#ef4444; font-size: 8px;">●</span>';
      statusPillHtml = '<span style="font-size: 8px; font-weight: 900; background: #fee2e2; color: #b91c1c; padding: 0.5px 4px; border-radius: 4px; margin-left: 3px; border: 0.5px solid #fca5a5;">CERRADO</span>';
    } else if (isOwner) {
      pinColor = '#059669';
      strokeColor = '#047857';
      badgeText = '⭐ Tu Tienda';
      badgeBg = '#fef3c7';
      badgeColor = '#92400e';
      badgeBorder = '#fde68a';
      dotHtml = '<span style="color:#f59e0b; font-size: 8px;">●</span>';
    } else if (isRegistered) {
      pinColor = '#059669';
      strokeColor = '#047857';
      badgeText = 'Oficial';
      badgeBg = '#d1fae5';
      badgeColor = '#065f46';
      badgeBorder = '#a7f3d0';
      dotHtml = '<span style="color:#059669; font-size: 8px;">●</span>';
    } else {
      pinColor = '#334155';
      strokeColor = '#1e293b';
    }

    // Icono SVG: Candado si está cerrada, casita de tienda si está abierta
    const iconSvg = !isOpen ? `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${pinColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ` : `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${pinColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    `;

    const html = `
      <div class="custom-leaflet-pin ${isSelected ? 'is-active' : ''} ${!isOpen ? 'is-closed' : ''}">
        ${ringClass ? `<div class="${ringClass}"></div>` : ''}

        <!-- Rótulo flotante superior (desacoplado de la altura de la aguja para no desfasar el anclaje) -->
        <div style="position: absolute; bottom: 46px; left: 50%; transform: translateX(-50%); white-space: nowrap; pointer-events: none; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(4px); padding: 2px 8px; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.2); font-size: 10px; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 3px; max-width: 170px; overflow: hidden; text-overflow: ellipsis;">
            ${dotHtml}
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(store.name)}</span>
            ${statusPillHtml}
          </div>
          ${badgeText ? `<span style="font-size: 8px; font-weight: 900; text-transform: uppercase; background: ${badgeBg}; color: ${badgeColor}; padding: 0.5px 6px; border-radius: 9999px; border: 0.5px solid ${badgeBorder}; box-shadow: 0 1px 4px rgba(0,0,0,0.15);">${badgeText}</span>` : ''}
        </div>

        <!-- SVG Pin de alta fidelidad con punta de contacto exactamente en (18, 44) -->
        <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; overflow: visible;">
          <!-- Sombra de contacto en el suelo centrada en (18, 44) -->
          <ellipse cx="18" cy="44" rx="6" ry="2.2" fill="rgba(15, 23, 42, 0.45)"/>
          <!-- Diana de precisión en el suelo (18, 44) -->
          <circle cx="18" cy="44" r="2.2" fill="${strokeColor}"/>
          <circle cx="18" cy="44" r="0.9" fill="#ffffff"/>
          <!-- Aguja cónica que apunta exactamente al suelo (18, 43.5) -->
          <path d="M18 43.5C18 43.5 32 28 32 16.5C32 8.5 25.7 2 18 2C10.3 2 4 8.5 4 16.5C4 28 18 43.5 18 43.5Z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="1.8"/>
          <!-- Centro blanco -->
          <circle cx="18" cy="16.5" r="10" fill="#FFFFFF"/>
        </svg>

        <!-- Icono dentro del centro del pin -->
        <div style="position: absolute; top: 8.5px; left: 10.5px; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 3;">
          ${iconSvg}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-pin-wrapper',
      html,
      iconSize: [36, 44],
      iconAnchor: [18, 44]
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

  // Limpiar cualquier residuo previo de accesos rápidos en localStorage del navegador
  useEffect(() => {
    try {
      localStorage.removeItem('marketsaas_pinned_store_slugs');
    } catch {
      // Ignorar
    }
  }, []);

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

    const streetLayer = L.tileLayer(STREET_MAP_URL, {
      attribution: STREET_MAP_ATTRIBUTION,
      maxNativeZoom: 18,
      maxZoom: 19
    }).addTo(map);

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
      tileLayerRef.current = L.tileLayer(SATELLITE_URL, {
        attribution: SATELLITE_ATTRIBUTION,
        maxNativeZoom: 18,
        maxZoom: 19
      }).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(STREET_MAP_URL, {
        attribution: STREET_MAP_ATTRIBUTION,
        maxNativeZoom: 18,
        maxZoom: 19
      }).addTo(map);
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
        safeFlyOrPanTo(map, coords.lat, coords.lng, Math.max(map.getZoom(), 15));
        showFeedback(`📍 Seleccionado: ${store.name}`);
      });

      marker.addTo(markersLayer);
      validLatLngs.push([coords.lat, coords.lng]);
    });
  }, [storesToPlot, selectedStore]);

  // Movimiento seguro que evita el bug de división por cero / NaN de flyTo en distancias cortas
  const safeFlyOrPanTo = (map, targetLat, targetLng, targetZoom = 15) => {
    if (!map || typeof targetLat !== 'number' || typeof targetLng !== 'number' || isNaN(targetLat) || isNaN(targetLng)) return;

    try {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      const distanceMeters = currentCenter.distanceTo(L.latLng(targetLat, targetLng));

      // Si la distancia es corta (< 300m), usamos panTo o setView directo
      // para evitar que flyTo entre en cálculo parabólico con delta cero y deje el mapa en blanco
      if (distanceMeters < 300) {
        if (currentZoom === targetZoom) {
          map.panTo([targetLat, targetLng], { animate: true, duration: 0.5 });
        } else {
          map.setView([targetLat, targetLng], targetZoom, { animate: true, duration: 0.5 });
        }
      } else {
        map.flyTo([targetLat, targetLng], targetZoom, { duration: 0.8 });
      }

      // Asegurar redibujado de teselas tras completar la animación
      map.once('moveend', () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 850);
    } catch (err) {
      console.warn('Error en animación de mapa, fallback a setView:', err);
      map.setView([targetLat, targetLng], targetZoom);
      map.invalidateSize();
    }
  };

  // 4. CENTRAR CUANDO CAMBIE LA TIENDA SELECCIONADA ESPECÍFICA
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStore?.googleMapsCoordinates) return;
    const { lat, lng } = selectedStore.googleMapsCoordinates;
    safeFlyOrPanTo(map, lat, lng, 16);
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
    setIsGpsCardCollapsed(false);
    // Si ya tenemos coordenadas GPS válidas en memoria o props, centrar inmediatamente
    if (userCoordinates?.lat && userCoordinates?.lng && hasUserGps) {
      const map = mapInstanceRef.current;
      if (map) {
        safeFlyOrPanTo(map, userCoordinates.lat, userCoordinates.lng, 15);
      }
      setActiveLocationType('user');
      setCurrentCoords(userCoordinates);
      showFeedback('📍 Centrado en tu ubicación GPS', 'success');
      return;
    }

    if (!navigator.geolocation) {
      showFeedback('Tu navegador o dispositivo no soporta geolocalización GPS.', 'warning');
      return;
    }

    // Advertencia si no es contexto seguro HTTPS (requerido por navegadores móviles)
    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      showFeedback('La geolocalización GPS en teléfonos móviles requiere conexión segura HTTPS.', 'warning');
      return;
    }

    setIsLocating(true);

    const onLocationSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
        setIsLocating(false);
        showFeedback('Coordenadas GPS no válidas.', 'warning');
        return;
      }

      const userCoords = {
        lat: latitude,
        lng: longitude,
        name: 'Mi Ubicación GPS'
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
        safeFlyOrPanTo(map, latitude, longitude, 15);
      }

      setIsLocating(false);
      setActiveLocationType('user');
      setIsGpsCardCollapsed(false);
      setCurrentCoords(userCoords);
      showFeedback('📍 Ubicación GPS detectada con éxito', 'success');
      if (onUserLocationChange) {
        onUserLocationChange(userCoords);
      }
    };

    const onLocationError = (error) => {
      console.warn('GPS de alta precisión no disponible, intentando red celular/wifi:', error);
      // Fallback a baja precisión (enableHighAccuracy: false) ideal para interiores y teléfonos
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        (fallbackErr) => {
          console.warn('Fallo final de geolocalización:', fallbackErr);
          setIsLocating(false);
          let errorMsg = 'No se pudo obtener tu ubicación GPS.';
          if (fallbackErr.code === 1) {
            errorMsg = 'Permiso de ubicación denegado. Permite el acceso al GPS en los ajustes de tu teléfono/navegador.';
          } else if (fallbackErr.code === 2) {
            errorMsg = 'Señal GPS no disponible en este momento.';
          } else if (fallbackErr.code === 3) {
            errorMsg = 'Tiempo de espera agotado al conectar con el GPS.';
          }
          showFeedback(errorMsg, 'warning');
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
        maximumAge: 30000
      }
    );
  };

  // Selección de tienda desde menú o chips
  const handleSelectStoreTarget = (store) => {
    if (onSelectStore) onSelectStore(store.slug);
    if (mapInstanceRef.current && store.googleMapsCoordinates) {
      safeFlyOrPanTo(
        mapInstanceRef.current,
        store.googleMapsCoordinates.lat,
        store.googleMapsCoordinates.lng,
        16
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
        className="w-full h-full" 
      />

      {/* 1.1 BOTONES FLOTANTES SUPERIORES: MI UBICACIÓN Y TIENDAS REGISTRADAS */}
      <div className="absolute top-3 left-3 sm:left-4 z-[1001] map-floating-control pointer-events-auto flex items-center gap-2 flex-wrap">
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
      </div>



      {/* 3. CARD FLOTANTE INTERACTIVA DE LA TIENDA SELECCIONADA */}
      {activeStore && (
        <div className="absolute left-3 sm:left-4 bottom-14 sm:bottom-16 z-[1001] map-floating-control max-w-[280px] sm:max-w-[320px] w-full pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-xl border border-slate-200/90 flex flex-col gap-2 transition-all transform hover:scale-[1.02]">
            
            {/* Cabecera de la Tienda */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
                  activeStore.isOpen !== false ? 'bg-emerald-600' : 'bg-slate-700 border border-rose-400/60'
                }`}>
                  {activeStore.isOpen !== false ? (
                    <Store className="w-5 h-5" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                    {activeStore.name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                    <span>
                      {activeStore.isOpen !== false ? (activeStore.deliveryTime || '10-15 min') : 'Cerrado temporalmente'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeStore.isOpen !== false ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Abierto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Cerrado
                  </span>
                )}

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

            {/* Aviso de Local Cerrado si corresponde */}
            {activeStore.isOpen === false && (
              <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-2 flex items-center gap-2 text-rose-800 text-[10.5px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>Tienda cerrada en este momento. No recibe pedidos en vivo.</span>
              </div>
            )}

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
                className={`w-full py-2 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeStore.isOpen !== false 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95' 
                    : 'bg-slate-700 hover:bg-slate-800 text-white active:scale-95'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{activeStore.isOpen !== false ? 'Ver Catálogo' : 'Ver Catálogo (Cerrado)'}</span>
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

      {/* 3.1 CARD FLOTANTE INTERACTIVA: UBICACIÓN GPS DEL USUARIO (COLAPSADA) */}
      {activeLocationType === 'user' && !activeStore && isGpsCardCollapsed && (
        <div className="absolute left-3 sm:left-4 bottom-12 sm:bottom-14 z-[1001] map-floating-control pointer-events-auto animate-fade-in">
          <button
            type="button"
            onClick={() => setIsGpsCardCollapsed(false)}
            className="bg-slate-900/95 hover:bg-slate-900 active:scale-95 backdrop-blur-md text-white pl-2.5 pr-2 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer group"
            title="Revelar información de tu ubicación GPS (>)"
            aria-label="Revelar tarjeta de GPS"
          >
            <div className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Navigation className="w-3 h-3" />
            </div>
            <span className="text-slate-200 group-hover:text-white">Tu GPS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-slate-800 text-emerald-400 rounded-md border border-slate-700 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors flex items-center justify-center">
              &gt;
            </span>
          </button>
        </div>
      )}

      {/* 3.1 CARD FLOTANTE INTERACTIVA: UBICACIÓN GPS DEL USUARIO (EXPANDIDA) */}
      {activeLocationType === 'user' && !activeStore && !isGpsCardCollapsed && (
        <div className="absolute left-3 sm:left-4 bottom-12 sm:bottom-14 z-[1001] map-floating-control max-w-[245px] xs:max-w-[270px] sm:max-w-[310px] w-full pointer-events-auto transition-all animate-fade-in">
          <div className="bg-slate-900/95 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-700/80 text-white flex flex-col gap-2 transition-all">
            {/* Cabecera compacta con Toggle >/< y Cerrar */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-xs">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-white leading-tight flex items-center gap-1">
                    <span className="truncate">Tu GPS</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-300 font-mono truncate">
                    {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="hidden xs:inline-block text-[9px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  En vivo
                </span>
                {/* Botón > / < para ocultar */}
                <button
                  type="button"
                  onClick={() => setIsGpsCardCollapsed(true)}
                  className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-[11px] font-black transition-colors cursor-pointer border border-slate-700"
                  title="Ocultar tarjeta (<)"
                  aria-label="Ocultar tarjeta de GPS"
                >
                  &lt;
                </button>
                {/* Botón X para descartar */}
                <button
                  type="button"
                  onClick={() => setActiveLocationType('plaza')}
                  className="w-5 h-5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
                  title="Cerrar tarjeta"
                  aria-label="Cerrar tarjeta de GPS"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Texto informativo breve adaptado a móvil */}
            <p className="text-[10px] sm:text-[11px] text-slate-300 leading-snug line-clamp-2">
              Distancias calculadas en tiempo real a tus minimarkets cercanos.
            </p>

            {/* Botón de acción estilizado y compacto */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('stores-grid-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] sm:text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="truncate">Ver tiendas abajo</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
          </div>
        </div>
      )}



      {/* 4. CONTROLES INFERIORES: TOGGLE SATÉLITE Y ZOOM */}
      {/* Lado Derecho: Toggle Satélite y Zoom */}
      <div className="absolute bottom-3 right-3 sm:right-4 z-[1001] map-floating-control flex items-center gap-2 pointer-events-auto">
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
