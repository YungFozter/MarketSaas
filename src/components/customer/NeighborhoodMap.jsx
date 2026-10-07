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
  const markersMapRef = useRef(new Map());
  const syncVisibleMarkersRef = useRef(null);
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

  // Crear DivIcon HTML personalizado para cada tienda (ultra-ligero, sin backdrop-filter para 60 FPS en móvil)
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

        <!-- Rótulo flotante superior (sin backdrop-filter, clase pin-label para ocultarse en zoom alejado) -->
        <div class="pin-label" style="position: absolute; bottom: 46px; left: 50%; transform: translateX(-50%); white-space: nowrap; pointer-events: none; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <div style="background: #0f172a; padding: 2px 8px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.25); font-size: 10px; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 3px; max-width: 170px; overflow: hidden; text-overflow: ellipsis;">
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

  // 1. INICIALIZAR EL MAPA LEAFLET UNA SOLA VEZ CON ACELERACIÓN MÓVIL A 60 FPS
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // En PANTALLA VECINO el mapa SIEMPRE debe iniciar centrado en la Plaza 24 de Septiembre (sin marcador)
    const initialLat = DEFAULT_CITY_CENTER_COORDS.lat;
    const initialLng = DEFAULT_CITY_CENTER_COORDS.lng;

    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints > 0));

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      tap: false,
      touchZoom: true,
      bounceAtZoomLimits: false,
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: isTouchDevice ? 2000 : 2500,
      inertiaMaxSpeed: 2800,
      easeLinearity: 0.1,
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 100
    });

    const streetLayer = L.tileLayer(STREET_MAP_URL, {
      attribution: STREET_MAP_ATTRIBUTION,
      maxNativeZoom: 18,
      maxZoom: 19,
      updateWhenIdle: isTouchDevice, // En móvil no descarga mientras se desliza para no competir por la CPU
      updateWhenZooming: false,
      keepBuffer: 2, // Buffer óptimo y ligero (evita saturar la memoria GPU)
      crossOrigin: true
    }).addTo(map);

    tileLayerRef.current = streetLayer;

    // Pausar animaciones pesadas durante el deslizamiento táctil
    const handleMoveStart = () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.classList.add('is-panning');
      }
    };
    const handleMoveEnd = () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.classList.remove('is-panning');
      }
      syncVisibleMarkersRef.current?.();
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', () => {
      syncVisibleMarkersRef.current?.();
    });

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    // Ejecutar primera sincronización de visibilidad una vez cargado el mapa
    setTimeout(() => {
      map.invalidateSize();
      syncVisibleMarkersRef.current?.();
    }, 150);

    const markersMap = markersMapRef.current;
    return () => {
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapInstanceRef.current = null;
      markersMap.clear();
    };
  }, []);

  // 2. CAMBIAR ENTRE TIPO DE MAPA (CALLES / SATÉLITE)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints > 0));

    if (mapType === 'satellite') {
      tileLayerRef.current = L.tileLayer(SATELLITE_URL, {
        attribution: SATELLITE_ATTRIBUTION,
        maxNativeZoom: 18,
        maxZoom: 19,
        updateWhenIdle: isTouchDevice,
        updateWhenZooming: false,
        keepBuffer: 2,
        crossOrigin: true
      }).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer(STREET_MAP_URL, {
        attribution: STREET_MAP_ATTRIBUTION,
        maxNativeZoom: 18,
        maxZoom: 19,
        updateWhenIdle: isTouchDevice,
        updateWhenZooming: false,
        keepBuffer: 2,
        crossOrigin: true
      }).addTo(map);
    }
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

  // 3. SINCRONIZACIÓN INTELIGENTE DE MARCADORES SEGÚN EL ÁREA VISIBLE (VIEWPORT CULLING)
  // Oculta/destruye marcadores fuera del encuadre para no sobrecargar el DOM ni la GPU en móviles
  const syncVisibleMarkers = () => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Con zoom lejano (< 14), ocultar rótulos pesados mediante clase CSS
    const currentZoom = map.getZoom();
    if (mapContainerRef.current) {
      if (currentZoom < 14) {
        mapContainerRef.current.classList.add('map-labels-hidden');
      } else {
        mapContainerRef.current.classList.remove('map-labels-hidden');
      }
    }

    // Calcular encuadre visible con un 15% de margen de seguridad (pad)
    // para que los marcadores no aparezcan/desaparezcan abruptamente en los bordes
    const bounds = map.getBounds().pad(0.15);
    const visibleSlugs = new Set();

    storesToPlot.forEach((store) => {
      const coords = store.googleMapsCoordinates;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
      if (isNaN(coords.lat) || isNaN(coords.lng)) return;

      const isSelected = activeStore?.slug === store.slug;
      const isInside = bounds.contains([coords.lat, coords.lng]);

      // Si no está en el área visible y tampoco es la tienda seleccionada, ignorar
      if (!isInside && !isSelected) {
        return;
      }

      visibleSlugs.add(store.slug);
      const existing = markersMapRef.current.get(store.slug);

      if (existing) {
        // Marcador ya en pantalla: actualizar únicamente si cambió su estado (ej. seleccionado o cerrado)
        if (existing.isSelected !== isSelected || existing.isOpen !== store.isOpen) {
          const newIcon = createStoreDivIcon(store, isSelected);
          existing.marker.setIcon(newIcon);
          existing.isSelected = isSelected;
          existing.isOpen = store.isOpen;
        }
      } else {
        // Marcador entra a la zona visible: crear y montar en la capa
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
        markersMapRef.current.set(store.slug, {
          marker,
          isSelected,
          isOpen: store.isOpen
        });
      }
    });

    // Eliminar del mapa y de memoria los marcadores que quedaron fuera de la zona visible (Culling)
    markersMapRef.current.forEach((item, slug) => {
      if (!visibleSlugs.has(slug)) {
        markersLayer.removeLayer(item.marker);
        markersMapRef.current.delete(slug);
      }
    });
  };

  // Mantener la referencia actualizada para los listeners de Leaflet y ejecutar sincronización
  useEffect(() => {
    syncVisibleMarkersRef.current = syncVisibleMarkers;
    syncVisibleMarkers();
  }, [storesToPlot, activeStore]);



  // 4. CENTRAR CUANDO CAMBIE LA TIENDA SELECCIONADA ESPECÍFICA
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStore?.googleMapsCoordinates) return;
    const { lat, lng } = selectedStore.googleMapsCoordinates;
    safeFlyOrPanTo(map, lat, lng, 16);
  }, [selectedStore]);

  // 4.1 SINCRONIZAR MARCADOR GPS DEL USUARIO Y VOLAR A SU UBICACIÓN
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
