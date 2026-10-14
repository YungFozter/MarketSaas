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
import {
  DEFAULT_CITY_CENTER_COORDS,
  DEFAULT_ZOOM,
  MAP_LOD,
  MAP_OPTIONS,
  DOTS_RENDERER_OPTIONS,
  VIEWPORT_CULLING_PAD,
  buildTileLayerOptions,
  getTileUrl
} from './NeighborhoodMap.config';
import {
  hasValidCoords,
  createStorePinIcon,
  getStoreDotStyle,
  createUserGpsIcon,
  reconcileMarkerLayer,
  clearMarkerLayer
} from './NeighborhoodMap.markers';

const SELECTED_PIN_Z_OFFSET = 1000;

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
  const userMarkerRef = useRef(null);

  // Capas de marcadores por Nivel de Detalle (LOD)
  const pinsLayerRef = useRef(null);       // Pines DOM (zoom cercano)
  const dotsLayerRef = useRef(null);       // Puntos canvas (zoom lejano)
  const dotsRendererRef = useRef(null);    // Único <canvas> compartido por todos los puntos
  const pinsRegistryRef = useRef(new Map());
  const dotsRegistryRef = useRef(new Map());

  // Referencias "siempre actuales" para los listeners de Leaflet (evita closures obsoletos)
  const syncMarkersRef = useRef(null);
  const markerClickRef = useRef(null);

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
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [isLocating, setIsLocating] = useState(false);
  const [isGpsCardCollapsed, setIsGpsCardCollapsed] = useState(false);

  // Tiendas que se deben graficar según los filtros activos (solo con coordenadas válidas)
  const storesToPlot = useMemo(() => {
    return masterStores.filter((store) => {
      if (!hasValidCoords(store)) {
        return false;
      }
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

  // La tienda activa: solo si el usuario seleccionó una tienda específica
  const activeStore = useMemo(() => {
    if (selectedStore) return selectedStore;
    return null;
  }, [selectedStore]);

  // Estado de coordenadas activas: arranca siempre en la Plaza 24 de Septiembre como punto de vista inicial
  const [currentCoords, setCurrentCoords] = useState(DEFAULT_CITY_CENTER_COORDS);

  const [activeLocationType, setActiveLocationType] = useState('plaza');

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

    // En PANTALLA VECINO el mapa SIEMPRE debe iniciar centrado en la Plaza 24 de Septiembre (sin marcador)
    const map = L.map(mapContainerRef.current, {
      ...MAP_OPTIONS,
      center: [DEFAULT_CITY_CENTER_COORDS.lat, DEFAULT_CITY_CENTER_COORDS.lng]
    });

    // La capa de teselas la monta el efecto de "tipo de mapa" (evita crearla dos veces)

    // Capas LOD: los puntos canvas van al overlayPane y los pines DOM al markerPane (siempre encima)
    dotsRendererRef.current = L.canvas(DOTS_RENDERER_OPTIONS);
    dotsLayerRef.current = L.layerGroup().addTo(map);
    pinsLayerRef.current = L.layerGroup().addTo(map);

    // Pausar animaciones de pulso durante el deslizamiento táctil
    const container = map.getContainer();
    const handleMoveStart = () => {
      container.classList.add('is-panning');
    };
    // `moveend` también se dispara al terminar un zoom: un único punto de sincronización
    const handleMoveEnd = () => {
      container.classList.remove('is-panning');
      syncMarkersRef.current?.();
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);

    mapInstanceRef.current = map;

    // Ejecutar primera sincronización de visibilidad una vez cargado el mapa
    const initTimer = setTimeout(() => {
      map.invalidateSize();
      syncMarkersRef.current?.();
    }, 150);

    const pinsRegistry = pinsRegistryRef.current;
    const dotsRegistry = dotsRegistryRef.current;
    return () => {
      clearTimeout(initTimer);
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      userMarkerRef.current = null;
      pinsLayerRef.current = null;
      dotsLayerRef.current = null;
      dotsRendererRef.current = null;
      pinsRegistry.clear();
      dotsRegistry.clear();
    };
  }, []);

  // 2. CAMBIAR ENTRE TIPO DE MAPA (CALLES / SATÉLITE)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(getTileUrl(mapType), buildTileLayerOptions(mapType)).addTo(map);
  }, [mapType]);

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
          map.panTo([targetLat, targetLng], { animate: true, duration: 0.35, easeLinearity: 0.08 });
        } else {
          map.setView([targetLat, targetLng], targetZoom, { animate: true, duration: 0.35 });
        }
      } else {
        map.flyTo([targetLat, targetLng], targetZoom, { duration: 0.65, easeLinearity: 0.08 });
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
      }, 600);
    } catch (err) {
      console.warn('Error en animación de mapa, fallback a setView:', err);
      map.setView([targetLat, targetLng], targetZoom);
      map.invalidateSize();
    }
  };

  // Clic en cualquier marcador (pin o punto): siempre usa los callbacks más recientes
  useEffect(() => {
    markerClickRef.current = (store) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const { lat, lng } = store.googleMapsCoordinates;
      if (onSelectStore) {
        onSelectStore(store.slug);
      }
      safeFlyOrPanTo(map, lat, lng, Math.max(map.getZoom(), DEFAULT_ZOOM));
      showFeedback(`📍 Seleccionado: ${store.name}`);
    };
  });

  // Fábricas estables de marcadores para el reconciliador
  const pinFactory = useMemo(() => ({
    create: (store, isSelected) => {
      const { lat, lng } = store.googleMapsCoordinates;
      return L.marker([lat, lng], {
        icon: createStorePinIcon(store, isSelected),
        zIndexOffset: isSelected ? SELECTED_PIN_Z_OFFSET : 0
      }).on('click', () => markerClickRef.current?.(store));
    },
    update: (marker, store, isSelected) => {
      marker.setIcon(createStorePinIcon(store, isSelected));
      marker.setZIndexOffset(isSelected ? SELECTED_PIN_Z_OFFSET : 0);
    }
  }), []);

  const dotFactory = useMemo(() => ({
    create: (store, isSelected) => {
      const { lat, lng } = store.googleMapsCoordinates;
      return L.circleMarker([lat, lng], {
        ...getStoreDotStyle(store, isSelected),
        renderer: dotsRendererRef.current
      }).on('click', () => markerClickRef.current?.(store));
    },
    update: (dot, store, isSelected) => {
      const style = getStoreDotStyle(store, isSelected);
      dot.setStyle(style);
      dot.setRadius(style.radius);
    }
  }), []);

  // 3. SINCRONIZACIÓN DE MARCADORES POR NIVEL DE DETALLE (LOD) + VIEWPORT CULLING
  //    - Zoom cercano: pines DOM solo dentro del encuadre visible.
  //    - Zoom lejano: todas las tiendas como puntos en un único <canvas> (costo de GPU constante),
  //      la tienda seleccionada conserva su pin DOM para destacar.
  const syncMarkers = () => {
    const map = mapInstanceRef.current;
    const pinsLayer = pinsLayerRef.current;
    const dotsLayer = dotsLayerRef.current;
    if (!map || !pinsLayer || !dotsLayer) return;

    const zoom = map.getZoom();
    const selectedSlug = activeStore?.slug ?? null;

    // Con zoom intermedio se ocultan rótulos y pulsos secundarios mediante clase CSS
    map.getContainer().classList.toggle('map-labels-hidden', zoom < MAP_LOD.labelMinZoom);

    if (zoom >= MAP_LOD.pinMinZoom) {
      // Margen de seguridad (pad) para que los pines no aparezcan/desaparezcan abruptamente en los bordes
      const bounds = map.getBounds().pad(VIEWPORT_CULLING_PAD);
      const pinEntries = storesToPlot
        .filter((store) => {
          const { lat, lng } = store.googleMapsCoordinates;
          return store.slug === selectedSlug || bounds.contains([lat, lng]);
        })
        .map((store) => ({ store, isSelected: store.slug === selectedSlug }));

      clearMarkerLayer(dotsRegistryRef.current, dotsLayer);
      reconcileMarkerLayer(pinsRegistryRef.current, pinsLayer, pinEntries, pinFactory);
      return;
    }

    const dotEntries = [];
    const pinEntries = [];
    storesToPlot.forEach((store) => {
      if (store.slug === selectedSlug) {
        pinEntries.push({ store, isSelected: true });
      } else {
        dotEntries.push({ store, isSelected: false });
      }
    });

    reconcileMarkerLayer(dotsRegistryRef.current, dotsLayer, dotEntries, dotFactory);
    reconcileMarkerLayer(pinsRegistryRef.current, pinsLayer, pinEntries, pinFactory);
  };

  // Mantener la referencia actualizada para los listeners de Leaflet y ejecutar sincronización
  useEffect(() => {
    syncMarkersRef.current = syncMarkers;
    syncMarkers();
  }, [storesToPlot, activeStore]);

  // 4. CENTRAR CUANDO CAMBIE LA TIENDA SELECCIONADA ESPECÍFICA
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStore?.googleMapsCoordinates) return;
    const { lat, lng } = selectedStore.googleMapsCoordinates;
    safeFlyOrPanTo(map, lat, lng, 16);
  }, [selectedStore]);

  // Coloca (o reemplaza) el marcador GPS del usuario en el mapa
  const placeUserMarker = (map, lat, lng) => {
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }
    userMarkerRef.current = L.marker([lat, lng], { icon: createUserGpsIcon() }).addTo(map);
  };

  // 4.1 SINCRONIZAR MARCADOR GPS DEL USUARIO Y VOLAR A SU UBICACIÓN
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userCoordinates || !hasUserGps) return;
    placeUserMarker(map, userCoordinates.lat, userCoordinates.lng);
    safeFlyOrPanTo(map, userCoordinates.lat, userCoordinates.lng, 15);
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
        placeUserMarker(map, latitude, longitude);
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
    <div className="google-map-component-container relative z-0 isolate w-full h-[390px] sm:h-[460px] md:h-[500px] bg-slate-100 rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 select-none">
      
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
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer border ${
            isLocating
              ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/50 shadow-blue-600/25'
              : hasUserGps
                ? 'bg-white hover:bg-slate-50 text-blue-900 border-blue-300 hover:shadow-lg ring-1 ring-blue-400/30'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 hover:border-blue-400 hover:shadow-lg'
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
          <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-2 transition-transform hover:scale-[1.01]">
            
            {/* Cabecera de la Tienda */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeStore.logoUrl ? (
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-xs p-0.5">
                    <img 
                      src={activeStore.logoUrl} 
                      alt={activeStore.name} 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
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
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                      {activeStore.name}
                    </h4>
                    {activeStore.isProStore && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded shadow-2xs">
                        👑 PRO
                      </span>
                    )}
                  </div>
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
              {hasUserGps && activeStore.distanceMeters ? (
                <span className="font-bold text-slate-900 shrink-0 ml-1">
                  {activeStore.distanceMeters < 1000
                    ? `a ${activeStore.distanceMeters}m`
                    : `a ${(activeStore.distanceMeters / 1000).toFixed(1)}km`}
                </span>
              ) : null}
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
            className="bg-slate-900 hover:bg-slate-950 active:scale-95 text-white pl-2.5 pr-2 py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer group"
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
          <div className="bg-slate-900 p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-700 text-white flex flex-col gap-2 transition-all">
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
        <div className="flex items-center bg-white p-0.5 rounded-xl shadow-md border border-slate-200">
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
        <div className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
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
