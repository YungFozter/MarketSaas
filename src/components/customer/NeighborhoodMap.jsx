import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles
} from 'lucide-react';
import './NeighborhoodMap.css';

// Coordenadas fijas y precisas para garantizar centrado perfecto en Google Maps
const DEFAULT_NEIGHBORHOOD_COORDS = {
  lat: -17.7942,
  lng: -63.2031,
  name: 'Condominio Las Palmas'
};

const ZONE_COORDINATES = {
  'Condominio Las Palmas': { lat: -17.7942, lng: -63.2031, name: 'Condominio Las Palmas' },
  'Condominio Altos del Valle': { lat: -17.7885, lng: -63.1978, name: 'Condominio Altos del Valle' },
  'Barrio Central (Casas)': { lat: -17.7995, lng: -63.2085, name: 'Barrio Central' },
  'all': DEFAULT_NEIGHBORHOOD_COORDS
};

export const NeighborhoodMap = ({
  stores = [],
  selectedStore,
  selectedZone = 'all',
  onSelectStore,
  onEnterStore,
  userLocation = { condominium: 'Condominio Las Palmas', tower: 'Torre A', apartment: '302' }
}) => {
  const [mapType, setMapType] = useState('map'); // 'map' | 'satellite'
  const [zoomLevel, setZoomLevel] = useState(16);
  const [isRecentering, setIsRecentering] = useState(false);

  // Tienda Don Vecino como fallback
  const donVecino = stores.find((s) => s.slug === 'don-vecino') || stores[0];
  const activeStore = selectedStore || donVecino;

  // Estado de coordenadas activas para centrar Google Maps
  const [currentCoords, setCurrentCoords] = useState(() => {
    if (activeStore?.googleMapsCoordinates) {
      return activeStore.googleMapsCoordinates;
    }
    return DEFAULT_NEIGHBORHOOD_COORDS;
  });

  const [activeLocationType, setActiveLocationType] = useState('store'); // 'store' | 'user' | 'zone'

  // Si cambia la tienda seleccionada desde el directorio
  useEffect(() => {
    if (selectedStore?.googleMapsCoordinates) {
      setCurrentCoords(selectedStore.googleMapsCoordinates);
      setActiveLocationType('store');
    }
  }, [selectedStore]);

  // Si cambia el filtro de zona desde el selector "Todas las Zonas"
  useEffect(() => {
    if (selectedZone && ZONE_COORDINATES[selectedZone]) {
      setCurrentCoords(ZONE_COORDINATES[selectedZone]);
      setActiveLocationType(selectedZone === 'all' ? 'store' : 'zone');
      setZoomLevel(16);
    }
  }, [selectedZone]);

  // Controles de Zoom
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 19));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 13));
  };

  // Re-centrar en la torre del usuario
  const handleRecenter = () => {
    setIsRecentering(true);
    setZoomLevel(17);
    setCurrentCoords(DEFAULT_NEIGHBORHOOD_COORDS);
    setActiveLocationType('user');
    setTimeout(() => setIsRecentering(false), 500);
  };

  // Selección de tienda desde los chips del mapa
  const handleSelectStoreTarget = (store) => {
    onSelectStore && onSelectStore(store.slug);
    if (store.googleMapsCoordinates) {
      setCurrentCoords(store.googleMapsCoordinates);
    } else {
      setCurrentCoords(DEFAULT_NEIGHBORHOOD_COORDS);
    }
    setActiveLocationType('store');
  };

  // Enlace directo para navegación en la App oficial de Google Maps
  const externalGoogleMapsUrl = useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`;
  }, [currentCoords]);

  // Construcción de la URL de Google Maps Embed interactivo con coordenadas precisas
  const googleMapsEmbedUrl = useMemo(() => {
    const mapTypeCode = mapType === 'satellite' ? 'k' : 'm';
    // Utilizar coordenadas exactas garantiza centrado perfecto sin ambigüedades
    return `https://maps.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}&t=${mapTypeCode}&z=${zoomLevel}&hl=es&ie=UTF8&iwloc=&output=embed`;
  }, [currentCoords, mapType, zoomLevel]);

  return (
    <div className="google-map-component-container relative w-full h-[440px] sm:h-[480px] md:h-[520px] bg-slate-100 rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 select-none">
      
      {/* 1. MOTOR INTERACTIVO GOOGLE MAPS CENTRADO EXACTO */}
      <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isRecentering ? 'opacity-70' : 'opacity-100'}`}>
        <iframe
          key={`${currentCoords.lat}-${currentCoords.lng}-${mapType}-${zoomLevel}`}
          title="Google Maps Hiperlocal MarketSaaS"
          src={googleMapsEmbedUrl}
          className="w-full h-full border-0 pointer-events-auto"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* 2. CHIPS FLOTANTES SUPERIORES: ACCESO RÁPIDO A TIENDAS Y TORRE DEL VECINO */}
      <div className="absolute top-3 left-3 sm:left-4 right-3 sm:right-4 z-20 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pointer-events-auto">
        {/* Chip Mi Ubicación */}
        <button
          type="button"
          onClick={handleRecenter}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md transition-all cursor-pointer shrink-0 border ${
            activeLocationType === 'user'
              ? 'bg-slate-900 text-white border-slate-700 shadow-slate-900/30 ring-2 ring-emerald-400'
              : 'bg-white/95 text-slate-800 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span>Mi Torre ({userLocation.tower})</span>
        </button>

        {/* Chips de Minimarkets */}
        {stores.map((s) => {
          const isSelected = activeStore?.slug === s.slug && activeLocationType === 'store';
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectStoreTarget(s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md transition-all cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30 ring-2 ring-white'
                  : 'bg-white/95 text-slate-800 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <Store className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
              <span className="truncate max-w-[140px] sm:max-w-none">{s.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {s.distanceMeters ? `${s.distanceMeters}m` : 'Cerca'}
              </span>
            </button>
          );
        })}
      </div>

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

              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En vivo
              </span>
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

      {/* 4. CONTROLES INFERIORES: GPS, SATÉLITE Y ZOOM */}
      {/* Lado Izquierdo: Estado de Cobertura */}
      <div className="absolute bottom-3 left-3 sm:left-4 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-slate-800 text-[11px] font-semibold border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-700">Google Maps Centrado</span>
          <span className="text-slate-400">•</span>
          <span>Radio 600m</span>
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
