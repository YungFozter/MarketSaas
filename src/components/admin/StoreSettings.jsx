import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Settings, 
  Save, 
  Plus, 
  Minus,
  Trash2, 
  Edit3,
  QrCode, 
  DollarSign,
  Power,
  Image as ImageIcon,
  Palette,
  AlertTriangle,
  Lock,
  ShieldCheck,
  MapPin,
  Navigation,
  Compass,
  ExternalLink,
  Crosshair,
  CheckCircle2,
  Map,
  Sparkles,
  X,
  Check,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { presetBanners } from '../../data/initialData';
import './StoreSettings.css';

// Proveedor de mapas de alta fidelidad sin marcas de agua (Esri World Street Map & Esri Satellite)
const STREET_MAP_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const STREET_MAP_ATTRIBUTION = '&copy; Esri &mdash; Street Map';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = '&copy; Esri World Imagery';

// Helper para obtener coordenadas geográficas de precisión milimétrica en cualquier dispositivo (PC y móvil)
const getExactLatLng = (mapInstance, containerEl, e) => {
  if (!mapInstance || !containerEl) return e.latlng;
  const orig = e.originalEvent;
  if (!orig) return e.latlng;

  let clientX = null;
  let clientY = null;

  if (orig.touches && orig.touches.length > 0) {
    clientX = orig.touches[0].clientX;
    clientY = orig.touches[0].clientY;
  } else if (orig.changedTouches && orig.changedTouches.length > 0) {
    clientX = orig.changedTouches[0].clientX;
    clientY = orig.changedTouches[0].clientY;
  } else if (typeof orig.clientX === 'number') {
    clientX = orig.clientX;
    clientY = orig.clientY;
  }

  if (typeof clientX === 'number' && typeof clientY === 'number') {
    const rect = containerEl.getBoundingClientRect();
    const containerX = clientX - rect.left;
    const containerY = clientY - rect.top;
    return mapInstance.containerPointToLatLng(L.point(containerX, containerY));
  }

  return e.latlng;
};

const createStoreMarkerIcon = (storeName) => {
  const label = storeName ? storeName : 'Tu Tienda';
  return L.divIcon({
    className: 'custom-location-picker-pin',
    html: `
      <div style="position: relative; width: 36px; height: 48px; pointer-events: auto; cursor: grab;">
        <div style="position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(4px); color: white; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; white-space: nowrap; max-width: 180px; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.2); pointer-events: none; text-align: center; line-height: 1.2;">
          ${label}
        </div>
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; overflow: visible;">
          <!-- Sombra de suelo milimétrica en el punto de contacto exacto (18, 48) -->
          <ellipse cx="18" cy="48" rx="6" ry="2.2" fill="rgba(15, 23, 42, 0.45)"/>
          <!-- Punto de contacto / diana exacto en (18, 48) -->
          <circle cx="18" cy="48" r="2.2" fill="#047857"/>
          <circle cx="18" cy="48" r="0.9" fill="#ffffff"/>
          <!-- Aguja del pin que apunta directamente a (18, 47.5) -->
          <path d="M18 47.5C18 47.5 33 30 33 17.5C33 9.2 26.3 2.5 18 2.5C9.7 2.5 3 9.2 3 17.5C3 30 18 47.5 18 47.5Z" fill="#059669" stroke="#047857" stroke-width="1.8"/>
          <!-- Centro del pin -->
          <circle cx="18" cy="17.5" r="10" fill="#FFFFFF"/>
          <!-- Icono de tienda -->
          <path d="M13 13.5h10l1 3.5H12L13 13.5z M12 17v5.5a1 1 0 001 1h10a1 1 0 001-1V17 M16 23.5v-3h4v3" stroke="#059669" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48]
  });
};

const StoreLocationPickerMap = ({ latitude, longitude, storeName, onChange }) => {
  const { showToast } = useStore();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapType, setMapType] = useState('map');
  const [isLocating, setIsLocating] = useState(false);

  const hasCoords = typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0 &&
                    typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0;

  const [hasMarker, setHasMarker] = useState(hasCoords);

  const activeLat = hasCoords ? latitude : -17.78335;
  const activeLng = hasCoords ? longitude : -63.18214;

  // 1. Inicializar mapa Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [activeLat, activeLng],
      zoom: hasCoords ? 16 : 14,
      zoomControl: false,
      attributionControl: true,
      tap: false // Desactivar emulación legacy de tap para máxima precisión en móviles táctiles
    });

    const streetLayer = L.tileLayer(STREET_MAP_URL, {
      attribution: STREET_MAP_ATTRIBUTION,
      maxNativeZoom: 18,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = streetLayer;

    // Solo crear marcador inicial si la tienda YA TIENE coordenadas guardadas
    if (hasCoords) {
      const icon = createStoreMarkerIcon(storeName);
      const marker = L.marker([latitude, longitude], {
        icon,
        draggable: true,
        autoPan: true
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        const newLat = parseFloat(pos.lat.toFixed(6));
        const newLng = parseFloat(pos.lng.toFixed(6));
        if (onChange) onChange(newLat, newLng);
      });

      markerRef.current = marker;
      setHasMarker(true);
    }

    // Evento clic / toque en cualquier punto del mapa (PC mouse y teléfono táctil)
    map.on('click', (e) => {
      // Ignorar clics si se pulsó en un control interactivo
      if (e.originalEvent?.target?.closest?.('.leaflet-control, button, a')) {
        return;
      }

      const exactLatLng = getExactLatLng(map, containerRef.current, e);
      const newLat = parseFloat(exactLatLng.lat.toFixed(6));
      const newLng = parseFloat(exactLatLng.lng.toFixed(6));

      if (!markerRef.current) {
        // Crear el marcador dinámicamente en el primer toque/clic
        const icon = createStoreMarkerIcon(storeName);
        const marker = L.marker([newLat, newLng], {
          icon,
          draggable: true,
          autoPan: true
        }).addTo(map);

        marker.on('dragend', (de) => {
          const pos = de.target.getLatLng();
          const dragLat = parseFloat(pos.lat.toFixed(6));
          const dragLng = parseFloat(pos.lng.toFixed(6));
          if (onChange) onChange(dragLat, dragLng);
        });

        markerRef.current = marker;
        setHasMarker(true);
      } else {
        markerRef.current.setLatLng([newLat, newLng]);
      }

      if (onChange) onChange(newLat, newLng);
    });

    mapRef.current = map;

    // Observar cambios de tamaño del contenedor para mantener alineación perfecta
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ debounceMoveEnd: true });
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // 2. Conmutar satélite / mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newLayer = mapType === 'satellite'
      ? L.tileLayer(SATELLITE_URL, { attribution: SATELLITE_ATTRIBUTION, maxNativeZoom: 18, maxZoom: 19 })
      : L.tileLayer(STREET_MAP_URL, { attribution: STREET_MAP_ATTRIBUTION, maxNativeZoom: 18, maxZoom: 19 });
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  }, [mapType]);

  // 3. Sincronizar marcador si cambian las coordenadas externas (GPS o entrada manual)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hasCoords) {
      if (!markerRef.current) {
        const icon = createStoreMarkerIcon(storeName);
        const marker = L.marker([latitude, longitude], {
          icon,
          draggable: true,
          autoPan: true
        }).addTo(map);

        marker.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          const newLat = parseFloat(pos.lat.toFixed(6));
          const newLng = parseFloat(pos.lng.toFixed(6));
          if (onChange) onChange(newLat, newLng);
        });

        markerRef.current = marker;
        setHasMarker(true);
        map.setView([latitude, longitude], 16);
      } else {
        const currentPos = markerRef.current.getLatLng();
        const diffLat = Math.abs(currentPos.lat - latitude);
        const diffLng = Math.abs(currentPos.lng - longitude);

        if (diffLat > 0.00001 || diffLng > 0.00001) {
          markerRef.current.setLatLng([latitude, longitude]);
          map.panTo([latitude, longitude]);
        }
      }
    }
  }, [latitude, longitude, hasCoords]);

  // 4. Actualizar etiqueta del marcador si cambia el nombre de la tienda
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createStoreMarkerIcon(storeName));
    }
  }, [storeName]);

  // 5. Geolocalización directa del dispositivo (Botón Mi Ubicación)
  const handleGetDeviceLocation = (e) => {
    if (e) e.stopPropagation();

    if (!navigator.geolocation) {
      if (showToast) showToast('Tu dispositivo no admite geolocalización GPS.', 'warning');
      return;
    }

    setIsLocating(true);

    const onLocationSuccess = (position) => {
      setIsLocating(false);
      const { latitude: posLat, longitude: posLng } = position.coords;
      if (typeof posLat !== 'number' || typeof posLng !== 'number' || isNaN(posLat) || isNaN(posLng)) {
        if (showToast) showToast('Coordenadas GPS no válidas.', 'warning');
        return;
      }

      const newLat = parseFloat(posLat.toFixed(6));
      const newLng = parseFloat(posLng.toFixed(6));

      const map = mapRef.current;
      if (map) {
        if (!markerRef.current) {
          const icon = createStoreMarkerIcon(storeName);
          const marker = L.marker([newLat, newLng], {
            icon,
            draggable: true,
            autoPan: true
          }).addTo(map);

          marker.on('dragend', (de) => {
            const pos = de.target.getLatLng();
            const dragLat = parseFloat(pos.lat.toFixed(6));
            const dragLng = parseFloat(pos.lng.toFixed(6));
            if (onChange) onChange(dragLat, dragLng);
          });

          markerRef.current = marker;
          setHasMarker(true);
        } else {
          markerRef.current.setLatLng([newLat, newLng]);
        }

        map.setView([newLat, newLng], 16);
      }

      if (onChange) onChange(newLat, newLng);
      if (showToast) showToast(`📍 Ubicación GPS detectada con éxito (${newLat}, ${newLng})`, 'success');
    };

    const onLocationError = (error) => {
      // Fallback con baja precisión para interiores o conexiones celulares
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        (fallbackErr) => {
          setIsLocating(false);
          let errorMsg = 'No se pudo obtener la ubicación GPS.';
          if (fallbackErr.code === 1) {
            errorMsg = 'Permiso denegado. Permite el acceso a la ubicación en tu navegador.';
          } else if (fallbackErr.code === 2) {
            errorMsg = 'Señal GPS no disponible.';
          } else if (fallbackErr.code === 3) {
            errorMsg = 'Tiempo de espera agotado al conectar con el GPS.';
          }
          if (showToast) showToast(errorMsg, 'warning');
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
    );
  };

  const handleCenterOnMarker = () => {
    if (mapRef.current && markerRef.current) {
      const pos = markerRef.current.getLatLng();
      mapRef.current.setView(pos, 16);
    } else if (mapRef.current) {
      mapRef.current.setView([activeLat, activeLng], 14);
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  return (
    <div className="relative w-full h-80 sm:h-96 md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 select-none">
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* 1. Botón "Mi Ubicación" (Superior Izquierda, idéntico al mapa de Vista Vecino) */}
      <div className="absolute top-3 left-3 z-[1000] pointer-events-auto">
        <button
          type="button"
          onClick={handleGetDeviceLocation}
          disabled={isLocating}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold shadow-md backdrop-blur-md transition-all cursor-pointer border ${
            isLocating
              ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/50 shadow-blue-600/25'
              : hasMarker && hasCoords
                ? 'bg-white/95 hover:bg-white text-blue-900 border-blue-300 hover:shadow-lg ring-1 ring-blue-400/30 active:scale-95'
                : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 hover:border-blue-400 hover:shadow-lg active:scale-95'
          }`}
          title="Detectar mi ubicación GPS actual y colocar el marcador de la tienda"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-white' : hasMarker && hasCoords ? 'text-blue-600' : 'text-slate-600'}`} />
          <span>{isLocating ? 'Obteniendo GPS...' : 'Mi Ubicación'}</span>
          {hasMarker && hasCoords && !isLocating && (
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* 3. Controles de mapa, satélite y zoom (Inferior Derecha) */}
      <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
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

        <button
          type="button"
          onClick={handleCenterOnMarker}
          className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-600 backdrop-blur-md flex items-center justify-center shadow-md border border-slate-200 transition-colors cursor-pointer"
          title={hasMarker ? "Centrar en el marcador de la tienda" : "Centrar mapa"}
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-slate-200">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-800 font-bold text-sm cursor-pointer active:bg-slate-200 transition-colors"
            title="Acercar mapa"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-[1px] bg-slate-200" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-800 font-bold text-sm cursor-pointer active:bg-slate-200 transition-colors"
            title="Alejar mapa"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper de compresión de imágenes con Canvas optimizado y blindado contra errores
const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error de lectura del archivo de imagen.'));
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen.'));
      img.src = event.target.result;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo inicializar el contexto de imagen.'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          reject(err);
        }
      };
    };
  });
};

export const StoreSettings = () => {
  const { storeConfig, setStoreConfig, showToast } = useStore();

  const isInvalidAddress = (addr) => !addr || 
    addr === 'Direccion según cada Tienda' || 
    addr === 'Av. Principal entre 2do y 3er Anillo' || 
    addr === 'Calle 1, Casa 7';

  const cleanInitialAddress = isInvalidAddress(storeConfig?.address) ? '' : storeConfig.address;
  const initialLat = (storeConfig?.latitude !== undefined && storeConfig?.latitude !== null && storeConfig?.latitude !== '') 
    ? storeConfig.latitude 
    : (storeConfig?.googleMapsCoordinates?.lat ?? '');
  const initialLng = (storeConfig?.longitude !== undefined && storeConfig?.longitude !== null && storeConfig?.longitude !== '') 
    ? storeConfig.longitude 
    : (storeConfig?.googleMapsCoordinates?.lng ?? '');

  const [form, setForm] = useState({ 
    currencySymbol: 'Bs.',
    themeColor: 'emerald',
    logoUrl: '',
    bannerUrl: presetBanners[0].url,
    qrImageUrl: '',
    coupons: [],
    categories: [
      'Lácteos & Huevos',
      'Panadería & Desayuno',
      'Abarrotes',
      'Frutas & Verduras',
      'Bebidas & Licores',
      'Snacks & Golosinas',
      'Limpieza & Hogar'
    ],
    ...storeConfig,
    zone: storeConfig?.zone || storeConfig?.condominium || '',
    reference: storeConfig?.reference || '',
    latitude: initialLat,
    longitude: initialLng,
    coupons: Array.isArray(storeConfig?.coupons)
      ? storeConfig.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511')
      : [],
    address: cleanInitialAddress
  });

  // Sincronizar formulario reactivamente cuando storeConfig se cargue desde Supabase o localStorage
  useEffect(() => {
    if (storeConfig) {
      const isBadAddr = !storeConfig.address || 
        storeConfig.address === 'Direccion según cada Tienda' || 
        storeConfig.address === 'Av. Principal entre 2do y 3er Anillo' || 
        storeConfig.address === 'Calle 1, Casa 7';

      setForm(prev => ({
        ...prev,
        ...storeConfig,
        coupons: Array.isArray(storeConfig.coupons)
          ? storeConfig.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511')
          : [],
        address: isBadAddr ? '' : storeConfig.address,
        zone: storeConfig.zone || storeConfig.condominium || '',
        reference: storeConfig.reference || '',
        latitude: (storeConfig.latitude !== undefined && storeConfig.latitude !== null && storeConfig.latitude !== '')
          ? storeConfig.latitude
          : (storeConfig.googleMapsCoordinates?.lat ?? ''),
        longitude: (storeConfig.longitude !== undefined && storeConfig.longitude !== null && storeConfig.longitude !== '')
          ? storeConfig.longitude
          : (storeConfig.googleMapsCoordinates?.lng ?? '')
      }));
    }
  }, [storeConfig]);

  const headerCardRef = useRef(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (headerCardRef.current) {
      observer.observe(headerCardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const [detectingGps, setDetectingGps] = useState(false);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no admite geolocalización GPS.', 'error');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingGps(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          googleMapsCoordinates: { lat, lng }
        }));
        showToast(`¡Ubicación GPS detectada con éxito! (${lat}, ${lng})`, 'success');
      },
      (err) => {
        setDetectingGps(false);
        console.warn('Geolocation error:', err);
        showToast('No se pudo obtener la ubicación GPS. Verifica los permisos de tu navegador o ingresa las coordenadas manualmente.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10.00');
  const [editingCoupon, setEditingCoupon] = useState(null);

  const handleGenerateCouponCode = () => {
    const prefixes = ['PROMO', 'VECI', 'DESC', 'SUPER', 'OFERTA'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setNewCouponCode(`${prefix}-${randomNum}`);
  };

  const colorThemes = [
    { id: 'emerald', name: 'Verde Esmeralda', bg: 'bg-emerald-600', ring: 'ring-emerald-500' },
    { id: 'teal', name: 'Azul Turquesa', bg: 'bg-teal-600', ring: 'ring-teal-500' },
    { id: 'indigo', name: 'Índigo Marino', bg: 'bg-indigo-600', ring: 'ring-indigo-500' },
    { id: 'rose', name: 'Rosa Pasión', bg: 'bg-rose-600', ring: 'ring-rose-500' },
    { id: 'amber', name: 'Dorado Ámbar', bg: 'bg-amber-500', ring: 'ring-amber-500' },
    { id: 'purple', name: 'Púrpura Real', bg: 'bg-purple-600', ring: 'ring-purple-500' }
  ];

  const [savingConfig, setSavingConfig] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (savingConfig) return;
    setSavingConfig(true);

    try {
      const { adminPassword, admin_pin, ...safeConfig } = form;
      const hasValidCoords = form.latitude !== '' && form.latitude !== null && form.latitude !== undefined &&
        form.longitude !== '' && form.longitude !== null && form.longitude !== undefined &&
        !isNaN(parseFloat(form.latitude)) && !isNaN(parseFloat(form.longitude));

      const lat = hasValidCoords ? parseFloat(form.latitude) : null;
      const lng = hasValidCoords ? parseFloat(form.longitude) : null;
      const cleanCoupons = (form.coupons || []).filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511');
      const configToSave = {
        ...safeConfig,
        coupons: cleanCoupons,
        address: form.address || '',
        zone: form.zone || '',
        reference: form.reference || '',
        googleMapsCoordinates: hasValidCoords ? { lat, lng } : null,
        latitude: lat,
        longitude: lng,
        isRegisteredStore: true
      };

      const result = await setStoreConfig(configToSave);
      if (result?.error) {
        if (result.error.code === '42501' || result.error.message?.includes('row-level security')) {
          showToast('Guardado en este dispositivo. Para sincronizar en la nube, asegúrate de haber iniciado sesión como dueño.', 'warning');
        } else {
          showToast(`Guardado localmente (Aviso en nube: ${result.error.message || 'Sin conexión'})`, 'warning');
        }
      } else {
        showToast('¡Configuración, logo y ubicación guardados exitosamente!', 'success');
      }
    } catch (err) {
      console.error('Error en handleSave:', err);
      showToast('Error al procesar el guardado de configuración.', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const maxWidth = field === 'bannerUrl' ? 1200 : 400;
        const maxHeight = field === 'bannerUrl' ? 600 : 400;
        const compressedBase64 = await compressImage(file, maxWidth, maxHeight, 0.8);
        setForm(prev => ({ ...prev, [field]: compressedBase64 }));
        showToast('Imagen cargada y optimizada con éxito.', 'success');
      } catch (err) {
        console.error('Error al procesar la imagen:', err);
        showToast('Error al procesar la imagen: ' + (err.message || 'Formato no soportado'), 'error');
      }
    }
  };

  const handleAddCoupon = () => {
    if (!newCouponCode.trim()) {
      showToast('Ingresa o genera un código para el cupón.', 'warning');
      return;
    }
    const discountVal = parseFloat(newCouponDiscount);
    if (isNaN(discountVal) || discountVal <= 0) {
      showToast('Ingresa un monto de descuento válido mayor a 0.', 'warning');
      return;
    }
    const cleanCode = newCouponCode.toUpperCase().trim();
    if ((form.coupons || []).some(c => c.code === cleanCode)) {
      showToast('Ya existe un cupón con este código.', 'error');
      return;
    }
    const newCoupon = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      discount: discountVal,
      description: `Cupón de descuento por Bs. ${discountVal.toFixed(2)}`,
      isUsed: false,
      usedCount: 0,
      maxUses: 1, // REGLA: Cada cupón es de 1 solo uso
      createdAt: new Date().toISOString()
    };
    const updatedCoupons = [...(form.coupons || []).filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511'), newCoupon];
    setForm(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setStoreConfig(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setNewCouponCode('');
    setNewCouponDiscount('10.00');
    showToast(`Cupón "${newCoupon.code}" creado y guardado (Válido para 1 solo uso).`, 'success');
  };

  const handleStartEditCoupon = (coupon) => {
    setEditingCoupon({
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount,
      isUsed: !!coupon.isUsed,
      usedInOrder: coupon.usedInOrder || null
    });
  };

  const handleSaveEditCoupon = () => {
    if (!editingCoupon) return;
    const discountVal = parseFloat(editingCoupon.discount);
    if (isNaN(discountVal) || discountVal <= 0) {
      showToast('El monto de descuento debe ser mayor a 0.', 'warning');
      return;
    }
    const cleanCode = editingCoupon.code.toUpperCase().trim();
    const updatedCoupons = (form.coupons || []).map(c => 
      c.id === editingCoupon.id 
        ? { 
            ...c, 
            code: cleanCode, 
            discount: discountVal, 
            description: `Cupón de descuento por Bs. ${discountVal.toFixed(2)}`,
            isUsed: editingCoupon.isUsed,
            usedCount: editingCoupon.isUsed ? (c.usedCount || 1) : 0,
            usedInOrder: editingCoupon.isUsed ? c.usedInOrder : null
          }
        : c
    );
    setForm(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setStoreConfig(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setEditingCoupon(null);
    showToast('Cupón actualizado y guardado correctamente.', 'success');
  };

  const handleToggleCouponUsed = (couponId) => {
    const target = (form.coupons || []).find(c => c.id === couponId);
    if (!target) return;
    const willBeUsed = !target.isUsed;
    const updatedCoupons = (form.coupons || []).map(c => 
      c.id === couponId 
        ? { 
            ...c, 
            isUsed: willBeUsed, 
            usedCount: willBeUsed ? 1 : 0, 
            usedInOrder: willBeUsed ? (c.usedInOrder || 'MANUAL') : null,
            usedAt: willBeUsed ? (c.usedAt || new Date().toISOString()) : null
          }
        : c
    );
    setForm(prev => ({ ...prev, coupons: updatedCoupons }));
    setStoreConfig(prev => ({ ...prev, coupons: updatedCoupons }));
    showToast(willBeUsed ? `Cupón "${target.code}" marcado como CANJEADO/USADO.` : `Cupón "${target.code}" reactivado para 1 nuevo uso.`, 'info');
  };

  const handleRemoveCoupon = (id) => {
    const updatedCoupons = (form.coupons || []).filter(c => c.id !== id && c.code !== 'VECINO10' && c.code !== 'VECI-511');
    setForm(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    setStoreConfig(prev => ({
      ...prev,
      coupons: updatedCoupons
    }));
    showToast('Cupón eliminado correctamente.', 'info');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 w-full max-w-7xl mx-auto animate-fadeIn relative pb-24">
      {/* Floating Save Button on Scroll (Esquina inferior derecha para no solapar el menú superior) */}
      {!isHeaderVisible && (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 animate-fadeIn">
          <button
            type="submit"
            disabled={savingConfig}
            className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-80 text-white font-black text-xs sm:text-sm shadow-2xl shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer border border-emerald-400/40 ring-4 ring-emerald-500/20"
            title="Guardar Cambios de Configuración"
          >
            {savingConfig ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Header */}
      <div 
        ref={headerCardRef}
        className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Configuración de la Tienda & Marca Blanca</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza el logo, portada, color del tema, contraseña de dueño, QR de cobro y cupones.
          </p>
        </div>

        <button
          type="submit"
          disabled={savingConfig}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-80 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          {savingConfig ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      {/* FILA 1: Personalización Visual & Información Básica (Lado a lado en PC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Identidad Visual & Portadas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Personalización Visual (Logo & Imagen de Portada)</span>
            </h3>

        {/* Cargar Logotipo */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <label className="text-xs font-bold text-slate-800 block">Logotipo de la Tienda</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-slate-400 font-bold text-center px-1">Sin Logo</span>
              )}
            </div>
            <div className="flex-1 space-y-2 w-full">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'logoUrl')}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />
              <input
                type="url"
                placeholder="O pega el enlace de tu logo..."
                value={form.logoUrl || ''}
                onChange={(e) => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Selector de Tema de Color */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <label className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span>Color de Tema del Negocio</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {colorThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, themeColor: t.id }))}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  form.themeColor === t.id
                    ? 'border-slate-800 bg-white ring-2 ring-slate-800/20 shadow-xs'
                    : 'border-slate-200 bg-white/70 hover:bg-white'
                }`}
              >
                <span className={`w-4 h-4 rounded-full ${t.bg} shrink-0`} />
                <span className="truncate text-[11px] text-slate-800">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Galería de Portadas Predeterminadas */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-800 block">
            Imagen de Portada / Banner (Elige una opción predeterminada o sube la tuya)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {presetBanners.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, bannerUrl: b.url }))}
                className={`group relative rounded-2xl overflow-hidden border-2 transition-all text-left h-24 ${
                  form.bannerUrl === b.url ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-md' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img src={b.url} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-slate-900/40 p-2 flex items-end">
                  <span className="text-[10px] font-bold text-white leading-tight drop-shadow-md">{b.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'bannerUrl')}
              className="block w-full sm:w-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-900 cursor-pointer shrink-0"
            />
            <input
              type="url"
              placeholder="O escribe una URL personalizada para la portada..."
              value={form.bannerUrl || ''}
              onChange={(e) => setForm(prev => ({ ...prev, bannerUrl: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
            />
          </div>
        </div>
      </div>
    </div>

        {/* Card 2: Estado del Local & Datos Generales */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Power className="w-4 h-4 text-emerald-600" />
              <span>Información Básica & Autenticación de Dueño</span>
            </h3>

        {/* Switch Abierto / Cerrado */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-bold text-xs sm:text-sm text-slate-900">Estado de Recepción de Pedidos</p>
            <p className="text-[11px] text-slate-500">
              {form.isOpen ? 'Tu catálogo está abierto y recibiendo pedidos de clientes.' : 'Tu tienda figura cerrada temporalmente.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, isOpen: !prev.isOpen }))}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              form.isOpen ? 'bg-emerald-600 text-white shadow-md' : 'bg-rose-600 text-white'
            }`}
          >
            {form.isOpen ? '● ABIERTO' : '○ CERRADO'}
          </button>
        </div>

        {/* Switch Servicio de Delivery a Domicilio */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-bold text-xs sm:text-sm text-slate-900">Servicio de Envíos a Domicilio (Delivery)</p>
            <p className="text-[11px] text-slate-500">
              {form.enableDelivery !== false ? 'Tu tienda ofrece envíos a domicilio y muestra el banner promocional a los clientes.' : 'Tu tienda atiende únicamente para Retiro en Tienda (Delivery desactivado).' }
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, enableDelivery: prev.enableDelivery === false ? true : false }))}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              form.enableDelivery !== false ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-300 text-slate-700'
            }`}
          >
            {form.enableDelivery !== false ? '🛵 ACTIVADO' : '🛍️ DESACTIVADO'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Tienda / Local *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Eslogan / Subtítulo</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm(prev => ({ ...prev, tagline: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Moneda del Sistema</label>
            <input
              type="text"
              disabled
              value="Bolivianos (Bs.)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-100 text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono / WhatsApp de Pedidos</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value, whatsapp: e.target.value.replace(/[^0-9]/g, '') }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            />
          </div>

          <div className="sm:col-span-2 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Acceso y Credenciales Protegidas</h4>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                El acceso a tu panel de comerciante está blindado mediante <strong>Supabase Auth</strong> con encriptación de grado bancario. Para cambiar tu contraseña de acceso, utiliza el enlace seguro desde la pantalla de inicio de sesión.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

      {/* FILA 2: Ubicación Física & Geolocalización en el Mapa (Ancho Completo) */}
      <div className="w-full">
        {/* Card 3: Ubicación Física & Mapa */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Ubicación Física & Geolocalización en el Mapa</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Esta ubicación posicionará tu tienda en el mapa interactivo de la Vista Vecino.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detectingGps}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-xs font-extrabold border border-emerald-200 transition-all cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
            title="Usar el GPS de tu dispositivo para fijar las coordenadas exactas de la tienda"
          >
            <Crosshair className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
            <span>{detectingGps ? 'Detectando GPS...' : 'Detectar mi ubicación GPS'}</span>
          </button>
        </div>

        {/* Campos de Dirección */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Dirección exacta de la Tienda (Calle, Avenida y Número) *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Av. San Martín #450, entre 3er y 4to anillo"
              value={form.address || ''}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Zona, Barrio o Condominio *
            </label>
            <input
              type="text"
              placeholder="Ej. Barrio Las Palmas / Equipetrol / Condominio Vista Sol"
              value={form.zone || ''}
              onChange={(e) => setForm(prev => ({ ...prev, zone: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Punto de Referencia para el Vecino
            </label>
            <input
              type="text"
              placeholder="Ej. Frente a la plaza principal, portón verde al lado de la farmacia"
              value={form.reference || ''}
              onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Coordenadas GPS & Mini Mapa */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Coordenadas Geográficas (Latitud & Longitud)</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Puedes ajustarlas manualmente o usar el botón de GPS para precisión satelital.
              </p>
            </div>

            {form.latitude && form.longitude ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${form.latitude},${form.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <span>Abrir en Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 italic">
                Ubicación no fijada aún
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Latitud GPS</label>
              <input
                type="number"
                step="0.000001"
                placeholder="Ej. -17.783350"
                value={form.latitude ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setForm(prev => ({
                    ...prev,
                    latitude: val,
                    googleMapsCoordinates: val !== '' && prev.longitude !== '' ? { lat: Number(val), lng: Number(prev.longitude) } : null
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Longitud GPS</label>
              <input
                type="number"
                step="0.000001"
                placeholder="Ej. -63.182140"
                value={form.longitude ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                  setForm(prev => ({
                    ...prev,
                    longitude: val,
                    googleMapsCoordinates: prev.latitude !== '' && val !== '' ? { lat: Number(prev.latitude), lng: Number(val) } : null
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
              />
            </div>
          </div>

          {/* Mapa Interactivo con Marcador Colocable / Arrastrable */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${form.latitude && form.longitude ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Mapa Interactivo de Fijación de Ubicación:</span>
              </span>
              <span className="font-mono font-bold text-slate-700">
                {form.latitude && form.longitude ? `${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}` : 'Sin fijar'}
              </span>
            </div>

            <StoreLocationPickerMap
              latitude={form.latitude !== '' && form.latitude !== null && form.latitude !== undefined && !isNaN(Number(form.latitude)) ? Number(form.latitude) : null}
              longitude={form.longitude !== '' && form.longitude !== null && form.longitude !== undefined && !isNaN(Number(form.longitude)) ? Number(form.longitude) : null}
              storeName={form.name || 'Mi Tienda'}
              onChange={(newLat, newLng) => {
                setForm(prev => ({
                  ...prev,
                  latitude: newLat,
                  longitude: newLng,
                  googleMapsCoordinates: { lat: newLat, lng: newLng }
                }));
              }}
            />
          </div>
        </div>
      </div>
    </div>

      {/* FILA 3: Código QR de Cobro & Cupones de Descuento (Lado a lado en PC) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 4: Imagen del Código QR de Cobro */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Imagen del Código QR de Cobro</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sube la imagen de tu código QR (Simple QR o entidad bancaria). Tus clientes podrán escanearlo y transferir directamente al pagar su pedido.
            </p>
          </div>

          {/* Cargar Foto de QR con Compresión */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 rounded-2xl bg-white border-2 border-amber-300 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {form.qrImageUrl ? (
                  <img src={form.qrImageUrl} alt="QR Cobro" className="w-full h-full object-contain p-1.5" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <QrCode className="w-8 h-8 text-amber-400 mb-1" />
                    <span className="text-[10px] text-amber-700 font-bold">Sin Foto QR</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'qrImageUrl')}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                />
                <input
                  type="url"
                  placeholder="O pega una URL directa de la imagen del QR..."
                  value={form.qrImageUrl || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, qrImageUrl: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 text-xs bg-white font-medium focus:border-amber-400 focus:outline-hidden"
                />
                {form.qrImageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, qrImageUrl: '' }))}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Quitar imagen de QR
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Cupones de Descuento de la Tienda */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Gestión de Cupones de Descuento</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crea códigos de descuento automáticos o personalizados para incentivar pedidos en tu tienda.
            </p>
          </div>

        {/* Modal / Panel de Edición de Cupón (cuando se edita uno existente) */}
        {editingCoupon && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>Editar Cupón: <code className="text-emerald-700 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200">{editingCoupon.code}</code></span>
              </span>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title="Cerrar edición"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Código del Cupón</label>
                <input
                  type="text"
                  value={editingCoupon.code}
                  onChange={(e) => setEditingCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-mono font-black uppercase bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Monto de Descuento (Bs.)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0.50"
                  value={editingCoupon.discount}
                  onChange={(e) => setEditingCoupon(prev => ({ ...prev, discount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-bold bg-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Disponibilidad del Cupón (1 solo uso):</span>
                  <span className="text-[10px] text-slate-500">
                    {editingCoupon.isUsed ? 'Figura como ya utilizado/canjeado por un cliente.' : 'Listo y disponible para ser canjeado 1 sola vez.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCoupon(prev => ({ ...prev, isUsed: !prev.isUsed }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    editingCoupon.isUsed ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {editingCoupon.isUsed ? '✓ CANJEADO / USADO' : '● DISPONIBLE (1 USO)'}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditCoupon}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Cambios de Cupón</span>
              </button>
            </div>
          </div>
        )}

        {/* Lista de Cupones */}
        <div className="space-y-2">
          {(form.coupons || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium">
              No tienes cupones de descuento activos actualmente.
            </p>
          ) : (
            (form.coupons || []).map((c) => {
              const isUsed = !!c.isUsed || (c.usedCount && c.usedCount >= (c.maxUses || 1));
              return (
                <div 
                  key={c.id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border text-xs transition-all gap-3 ${
                    isUsed 
                      ? 'bg-slate-100/80 border-slate-200/90 text-slate-500' 
                      : 'bg-amber-50/50 border-amber-200/80 text-slate-800 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-black font-mono tracking-wider text-sm px-3 py-1 rounded-xl border shadow-2xs ${
                      isUsed 
                        ? 'bg-slate-200/90 text-slate-500 border-slate-300 line-through' 
                        : 'bg-white text-amber-950 border-amber-200'
                    }`}>
                      {c.code}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-xs ${isUsed ? 'text-slate-600 line-through' : 'text-slate-800'}`}>
                          {c.description || `Descuento directo de Bs. ${parseFloat(c.discount || 0).toFixed(2)}`}
                        </span>
                        {isUsed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px]">
                            ✓ CANJEADO / USADO {c.usedInOrder ? `(${c.usedInOrder})` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            ● DISPONIBLE (1 solo uso)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] mt-0.5">
                        <span className={isUsed ? 'text-slate-400 font-medium' : 'font-black text-emerald-700'}>
                          Ahorro al cliente: -Bs. {parseFloat(c.discount || 0).toFixed(2)}
                        </span>
                        {c.usedAt && (
                          <span className="text-slate-400 text-[10px]">
                            • Usado el: {new Date(c.usedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    {/* Botón para Reactivar o Marcar Usado */}
                    <button
                      type="button"
                      onClick={() => handleToggleCouponUsed(c.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 ${
                        isUsed 
                          ? 'text-emerald-700 hover:bg-emerald-100 bg-emerald-50' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isUsed ? 'Reactivar cupón para 1 nuevo uso' : 'Marcar manualmente como usado'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{isUsed ? 'Reactivar' : 'Marcar usado'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditCoupon(c)}
                      className="p-2 text-slate-500 hover:text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Editar código y monto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoupon(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar cupón"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Formulario para Crear Nuevo Cupón */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Crear Nuevo Cupón de Descuento:</p>
              <p className="text-[11px] text-slate-500">Por seguridad cada cupón es de <strong>1 solo uso</strong>. Al completarse un pedido se marcará automáticamente como CANJEADO.</p>
            </div>
            <button
              type="button"
              onClick={handleGenerateCouponCode}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300/80 transition-colors cursor-pointer shrink-0"
              title="Generar automáticamente un código al azar"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>⚡ Autogenerar Código</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Código del Cupón</label>
              <input
                type="text"
                placeholder="Ej. PROMO-742 o VECINO10"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Monto de Descuento en Bs.</label>
              <input
                type="number"
                step="0.50"
                min="0.50"
                placeholder="Ej. 10.00"
                value={newCouponDiscount}
                onChange={(e) => setNewCouponDiscount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCoupon}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Cupón</span>
          </button>
        </div>
      </div>
    </div>
</form>
  );
};
