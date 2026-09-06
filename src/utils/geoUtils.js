/**
 * Utilidades geográficas y cálculo de distancias hiperlocales
 * Utiliza la fórmula de Haversine para calcular distancias en línea recta sobre la superficie terrestre.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Convierte grados a radianes
 */
const toRad = (value) => (value * Math.PI) / 180;

/**
 * Calcula la distancia en metros entre dos coordenadas geográficas
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distancia en metros (entero redondeado)
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return 999999;
  }

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;

  return Math.round(distance);
};

/**
 * Formatea una distancia en metros a texto legible y amigable
 * @param {number} meters 
 * @returns {string} ej. "A 180 m de ti", "A 1.4 km de ti"
 */
export const formatDistance = (meters) => {
  if (meters === undefined || meters === null || isNaN(meters)) {
    return 'Cerca de ti';
  }

  if (meters < 1000) {
    return `A ${meters} m de ti`;
  }

  const km = (meters / 1000).toFixed(1);
  return `A ${km} km de ti`;
};
