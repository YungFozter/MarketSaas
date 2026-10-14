/* ==============================================================================
   NeighborhoodMap.config.js
   ------------------------------------------------------------------------------
   Configuración centralizada del mapa de VISTA VECINO: proveedores de teselas,
   coordenadas base, umbrales de Nivel de Detalle (LOD) y opciones de Leaflet
   ajustadas según el tipo de dispositivo (táctil vs. escritorio).
   ============================================================================== */

// Proveedor de mapas de alta fidelidad sin marcas de agua (Esri World Street Map & Esri Satellite)
export const TILE_PROVIDERS = {
  map: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Street Map'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  }
};

// Coordenadas fijas y precisas: Plaza Metropolitana 24 de Septiembre (Centro de la Ciudad, Santa Cruz de la Sierra)
export const DEFAULT_CITY_CENTER_COORDS = {
  lat: -17.78335,
  lng: -63.18214,
  name: 'Plaza Metropolitana 24 de Septiembre'
};

export const ZONE_COORDINATES = {
  'Zona Las Palmas': { lat: -17.7942, lng: -63.2031, name: 'Zona Las Palmas' },
  'Zona Equipetrol': { lat: -17.7885, lng: -63.1978, name: 'Zona Equipetrol' },
  'Barrio Central': { lat: -17.7995, lng: -63.2085, name: 'Barrio Central' },
  all: DEFAULT_CITY_CENTER_COORDS
};

export const DEFAULT_ZOOM = 15;

// Detección única del tipo de dispositivo (evita recalcularlo en cada efecto)
export const IS_TOUCH_DEVICE =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

/**
 * Umbrales de Nivel de Detalle (LOD).
 * - zoom >= pinMinZoom   → pines DOM completos (SVG + icono + rótulo).
 * - zoom <  pinMinZoom   → puntos ligeros dibujados en un único <canvas>.
 * - zoom <  labelMinZoom → se ocultan rótulos y pulsos secundarios.
 *
 * En móvil el umbral es más estricto: cada pin DOM es una capa de composición
 * que Leaflet reposiciona en CADA frame del gesto de pellizco (evento `zoom`),
 * algo que la GPU/CPU de un teléfono no sostiene con decenas de marcadores.
 */
export const MAP_LOD = IS_TOUCH_DEVICE
  ? { pinMinZoom: 14, labelMinZoom: 15 }
  : { pinMinZoom: 13, labelMinZoom: 14 };

// Margen (en proporción del viewport) para el culling de pines DOM
export const VIEWPORT_CULLING_PAD = 0.15;

// Opciones del motor Leaflet
export const MAP_OPTIONS = {
  zoom: DEFAULT_ZOOM,
  zoomControl: false,
  attributionControl: true,
  preferCanvas: true,
  tap: false,
  touchZoom: true,
  bounceAtZoomLimits: false,
  zoomAnimation: true,
  zoomAnimationThreshold: 4,
  // El fundido de teselas ejecuta un bucle requestAnimationFrame que cambia la
  // opacidad de cada tesela nueva: muy costoso en móvil al alejar (carga de nivel completo)
  fadeAnimation: !IS_TOUCH_DEVICE,
  markerZoomAnimation: true,
  inertia: true,
  inertiaDeceleration: IS_TOUCH_DEVICE ? 2000 : 2500,
  inertiaMaxSpeed: 2800,
  easeLinearity: 0.1,
  wheelDebounceTime: 40,
  wheelPxPerZoomLevel: 100
};

// Opciones del renderizador canvas para los puntos de tiendas (modo LOD lejano)
export const DOTS_RENDERER_OPTIONS = {
  padding: 0.3,
  // Área táctil ampliada para poder tocar puntos pequeños con el dedo
  tolerance: IS_TOUCH_DEVICE ? 10 : 3
};

/**
 * Construye las opciones de la capa de teselas para el tipo de mapa indicado.
 * @param {'map' | 'satellite'} mapType
 */
export const buildTileLayerOptions = (mapType) => ({
  attribution: (TILE_PROVIDERS[mapType] || TILE_PROVIDERS.map).attribution,
  maxNativeZoom: 18,
  maxZoom: 19,
  updateWhenIdle: IS_TOUCH_DEVICE, // En móvil no descarga mientras se desliza para no competir por la CPU
  updateWhenZooming: false,
  keepBuffer: IS_TOUCH_DEVICE ? 1 : 2, // Menos teselas retenidas = menos memoria GPU en móvil
  crossOrigin: true
});

export const getTileUrl = (mapType) => (TILE_PROVIDERS[mapType] || TILE_PROVIDERS.map).url;
