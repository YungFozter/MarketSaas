import React, { useState } from 'react';
import { 
  Store, 
  ShoppingCart, 
  MapPin, 
  Star, 
  Layers, 
  Plus, 
  Minus, 
  Navigation,
  Wine,
  ShoppingBag,
  Compass
} from 'lucide-react';
import './NeighborhoodMap.css';

export const NeighborhoodMap = ({
  stores = [],
  selectedStore,
  onSelectStore,
  onEnterStore,
  userLocation = { condominium: 'Condominio Las Palmas', tower: 'Torre A', apartment: '302' }
}) => {
  const [mapType, setMapType] = useState('map'); // 'map' | 'satellite'
  const [zoomScale, setZoomScale] = useState(1);
  const [isRecentering, setIsRecentering] = useState(false);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.15, 1.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.15, 0.85));
  };

  const handleRecenter = () => {
    setIsRecentering(true);
    setZoomScale(1);
    setTimeout(() => setIsRecentering(false), 500);
  };

  // Identificar tiendas principales
  const donVecino = stores.find((s) => s.slug === 'don-vecino') || stores[0];
  const laPradera = stores.find((s) => s.slug === 'la-pradera');
  const expressStore = stores.find((s) => s.slug === 'express-24-7');

  const activeStore = selectedStore || donVecino;

  return (
    <div className="neighborhood-map-container relative w-full h-[400px] sm:h-[460px] md:h-[480px] bg-slate-100 rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 select-none">
      {/* Contenedor del Mapa con Zoom y Pan */}
      <div 
        className={`map-canvas-wrapper absolute inset-0 transition-transform duration-300 ${
          isRecentering ? 'map-recenter-anim' : ''
        }`}
        style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
      >
        {/* SVG Vector Canvas */}
        <div className={`absolute inset-0 pointer-events-none ${mapType === 'satellite' ? 'opacity-85 filter contrast-125' : 'opacity-95'}`}>
          <svg 
            className="w-full h-full object-cover" 
            viewBox="0 0 1200 480" 
            fill="none" 
            preserveAspectRatio="xMidYMid slice" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Terreno Base */}
            <rect width="1200" height="480" fill={mapType === 'satellite' ? '#1E293B' : '#EAEFF5'} />

            {/* Áreas Verdes y Parques */}
            <path 
              d="M 80 30 Q 200 20 320 60 T 480 140 L 390 230 L 140 210 Z" 
              fill={mapType === 'satellite' ? '#14532D' : '#D2E8D8'} 
              opacity="0.85" 
            />
            <path 
              d="M 820 180 Q 980 150 1100 200 L 1120 380 L 890 350 Z" 
              fill={mapType === 'satellite' ? '#14532D' : '#D2E8D8'} 
              opacity="0.75" 
            />
            <circle 
              cx="240" 
              cy="110" 
              r="42" 
              fill={mapType === 'satellite' ? '#166534' : '#C1E0CA'} 
              opacity="0.9" 
            />
            <text 
              x="200" 
              y="115" 
              fill={mapType === 'satellite' ? '#BBF7D0' : '#005236'} 
              fontFamily="Outfit, sans-serif" 
              fontSize="11" 
              fontWeight="700"
            >
              Parque Central
            </text>

            {/* Polígono del Condominio Las Palmas */}
            <rect 
              x="420" 
              y="140" 
              width="460" 
              height="230" 
              rx="16" 
              fill={mapType === 'satellite' ? '#0F172A' : '#F4F7FA'} 
              stroke={mapType === 'satellite' ? '#334155' : '#CBD5E1'} 
              strokeWidth="2" 
              strokeDasharray="6 4" 
            />
            <text 
              x="440" 
              y="165" 
              fill={mapType === 'satellite' ? '#94A3B8' : '#334155'} 
              fontFamily="Outfit, sans-serif" 
              fontSize="12" 
              fontWeight="800" 
              letterSpacing="0.5"
            >
              CONDOMINIO LAS PALMAS
            </text>

            {/* Torres Residenciales */}
            {/* Torre A */}
            <g id="map-torre-a">
              <rect x="450" y="185" width="60" height="60" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
              <rect x="457" y="192" width="46" height="46" rx="4" fill="#E2E8F0" />
              <text x="462" y="219" fill="#1E293B" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fontWeight="700">Torre A</text>
            </g>

            {/* Torre B */}
            <g id="map-torre-b">
              <rect x="550" y="185" width="60" height="60" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
              <rect x="557" y="192" width="46" height="46" rx="4" fill="#E2E8F0" />
              <text x="562" y="219" fill="#1E293B" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fontWeight="700">Torre B</text>
            </g>

            {/* Torre C */}
            <g id="map-torre-c">
              <rect x="650" y="185" width="60" height="60" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.5" />
              <rect x="657" y="192" width="46" height="46" rx="4" fill="#E2E8F0" />
              <text x="662" y="219" fill="#1E293B" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="11" fontWeight="700">Torre C</text>
            </g>

            {/* Piscina y Club Social */}
            <rect x="745" y="190" width="85" height="50" rx="10" fill="#BAE6FD" opacity="0.85" />
            <text x="758" y="220" fill="#0369A1" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fontWeight="700">Club Social</text>

            {/* Calles y Avenidas */}
            <path d="M 0 410 L 1200 390" stroke={mapType === 'satellite' ? '#334155' : '#FFFFFF'} strokeWidth="32" strokeLinecap="round" />
            <path d="M 0 410 L 1200 390" stroke={mapType === 'satellite' ? '#64748B' : '#CBD5E1'} strokeWidth="2" strokeDasharray="8 8" />
            <text 
              x="50" 
              y="412" 
              fill={mapType === 'satellite' ? '#94A3B8' : '#64748B'} 
              fontFamily="Outfit, sans-serif" 
              fontSize="12" 
              fontWeight="700" 
              transform="rotate(-1, 50, 412)"
            >
              AV. LAS PALMERAS
            </text>

            <path d="M 360 0 L 370 480" stroke={mapType === 'satellite' ? '#334155' : '#FFFFFF'} strokeWidth="24" />
            <text 
              x="380" 
              y="70" 
              fill={mapType === 'satellite' ? '#94A3B8' : '#64748B'} 
              fontFamily="Outfit, sans-serif" 
              fontSize="11" 
              fontWeight="600" 
              transform="rotate(89, 380, 70)"
            >
              CALLE LOS SAUCES
            </text>

            <path d="M 940 0 L 930 480" stroke={mapType === 'satellite' ? '#334155' : '#FFFFFF'} strokeWidth="20" />

            {/* Trayecto peatonal sugerido */}
            <path d="M 480 250 C 480 300, 580 320, 680 300" stroke="#10B981" strokeWidth="2" strokeDasharray="4 4" opacity="0.75" />
          </svg>
        </div>

        {/* PIN 1: Minimarket Don Vecino (Activo con Popover Emergente) */}
        {donVecino && (
          <div 
            className="absolute left-[24%] md:left-[28%] bottom-[42px] z-30 -translate-x-1/2 pointer-events-auto cursor-pointer"
            onClick={() => {
              onSelectStore && onSelectStore(donVecino.slug);
            }}
          >
            {/* Popover Card Expandido */}
            <div 
              className={`w-60 bg-white/95 backdrop-blur-xl p-2.5 rounded-xl shadow-xl mb-2 border border-slate-200/80 flex flex-col gap-1.5 transition-all duration-200 transform hover:scale-105 ${
                activeStore?.slug === donVecino.slug ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">
                    {donVecino.name}
                  </span>
                  <div className="flex items-center gap-1 text-amber-600 text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{donVecino.rating}</span>
                    <span className="text-slate-400 font-normal">• {donVecino.deliveryTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                <span>📍 A 120m • Acera Oeste</span>
                <span className="text-emerald-700 font-bold">Stock Live</span>
              </div>
              {onEnterStore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterStore(donVecino.slug);
                  }}
                  className="w-full mt-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Ver Catálogo</span>
                </button>
              )}
            </div>

            {/* Marcador Pin con Pulso */}
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="absolute w-7 h-7 rounded-full bg-emerald-500/40 animate-ping" />
                <div className="relative w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="w-1.5 h-2 bg-emerald-600 rounded-b-full" />
            </div>
          </div>
        )}

        {/* PIN 2: Ubicación del Vecino (Torre A) */}
        <div className="absolute left-[46%] top-[56%] z-25 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-10 h-10 rounded-full bg-sky-500/30 animate-pulse" />
            <div className="w-4 h-4 rounded-full bg-sky-600 ring-4 ring-white shadow-md" />
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1 border border-slate-700">
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span>Tú estás aquí ({userLocation.tower} - {userLocation.apartment})</span>
          </div>
        </div>

        {/* PIN 3: Abarrotes La Pradera */}
        {laPradera && (
          <div 
            className="absolute left-[72%] top-[50%] z-25 -translate-x-1/2 -translate-y-full pointer-events-auto cursor-pointer"
            onClick={() => onSelectStore && onSelectStore(laPradera.slug)}
          >
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg mb-1 hover:bg-emerald-50 transition-colors border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">La Pradera • 350m</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                <Store className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        {/* PIN 4: Licorería & Express 24/7 */}
        {expressStore && (
          <div 
            className="absolute left-[88%] bottom-[30px] z-25 -translate-x-1/2 pointer-events-auto cursor-pointer"
            onClick={() => onSelectStore && onSelectStore(expressStore.slug)}
          >
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg mb-1 hover:bg-amber-50 transition-colors border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">Express 24/7 • 500m</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                <Wine className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLES FLOTANTES DEL MAPA */}
      {/* Indicador GPS & Botón Re-centrar */}
      <div className="absolute bottom-3 left-3 sm:left-4 z-35 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-slate-800 text-[11px] font-semibold border border-slate-200/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GPS Activo • Radio 600m</span>
        </div>
        <button 
          type="button"
          onClick={handleRecenter}
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 text-[11px] font-bold rounded-full shadow-md transition-all cursor-pointer border border-slate-200/80 active:scale-95"
          title="Re-centrar vista en tu condominio"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>Re-centrar en mi torre</span>
        </button>
      </div>

      {/* Switcher Satélite & Controles Zoom */}
      <div className="absolute bottom-3 right-3 sm:right-4 z-35 flex items-center gap-2">
        <div className="hidden sm:flex items-center bg-white/90 backdrop-blur-md p-0.5 rounded-xl shadow-md border border-slate-200/80">
          <button 
            type="button"
            onClick={() => setMapType('map')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              mapType === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🗺️ Mapa
          </button>
          <button 
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
              mapType === 'satellite' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🛰️ Satélite
          </button>
        </div>

        {/* Botones Zoom +/- */}
        <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-xl shadow-md overflow-hidden border border-slate-200/80">
          <button 
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-800 font-bold text-sm cursor-pointer active:bg-slate-200"
            title="Acercar mapa"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="h-[1px] bg-slate-200" />
          <button 
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 text-slate-800 font-bold text-sm cursor-pointer active:bg-slate-200"
            title="Alejar mapa"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
