/**
 * Utilidades para cálculo de tarifas de envío a domicilio (Motodelivery).
 * Basado en la escala tarifaria oficial de servicios de motomandados (Bolivia).
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Convierte grados a radianes
 */
const toRad = (value) => (value * Math.PI) / 180;

/**
 * Calcula la distancia en kilómetros entre dos coordenadas geográficas utilizando la fórmula de Haversine.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number|null} Distancia en kilómetros redondeada a 2 decimales, o null si las coordenadas son inválidas.
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const numLat1 = parseFloat(lat1);
  const numLon1 = parseFloat(lon1);
  const numLat2 = parseFloat(lat2);
  const numLon2 = parseFloat(lon2);

  if (
    isNaN(numLat1) || isNaN(numLon1) ||
    isNaN(numLat2) || isNaN(numLon2)
  ) {
    return null;
  }

  const dLat = toRad(numLat2 - numLat1);
  const dLon = toRad(numLon2 - numLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(numLat1)) * Math.cos(toRad(numLat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = EARTH_RADIUS_METERS * c;

  return Math.round((distanceMeters / 1000) * 100) / 100;
};

/**
 * Tabla oficial de tarifas por kilometraje para motos de delivery (Bolivia).
 * 0 a 1 Km: Bs. 10
 * 1.1 a 3 Km: Bs. 13
 * 3.1 a 4 Km: Bs. 15
 * 4.1 a 5 Km: Bs. 17
 * 5.1 a 6 Km: Bs. 19
 * 6.1 a 7 Km: Bs. 21
 * 7.1 a 8 Km: Bs. 23
 * 8.1 a 9 Km: Bs. 25
 * 9.1 a 9.9 Km: Bs. 27
 * 10 Km (10.0 - 10.9): Bs. 30
 * 11 Km (11.0 - 11.9): Bs. 32
 * 12 Km (12.0 - 12.9): Bs. 34
 * 13 Km (13.0 - 13.9): Bs. 36
 * 14 Km (14.0 - 14.9): Bs. 38
 * 15 Km (15.0 - 15.9): Bs. 40
 * 16 Km (16.0 - 16.9): Bs. 42
 * 17 Km (17.0 - 17.9): Bs. 44
 * 18 Km (18.0): Bs. 46
 * Límite máximo: 18 Km
 */
export const DELIVERY_RATES = [
  { minKm: 0.0, maxKm: 1.0, fee: 10.0, label: '0 a 1 Km' },
  { minKm: 1.0001, maxKm: 3.0, fee: 13.0, label: '1.1 a 3 Km' },
  { minKm: 3.0001, maxKm: 4.0, fee: 15.0, label: '3.1 a 4 Km' },
  { minKm: 4.0001, maxKm: 5.0, fee: 17.0, label: '4.1 a 5 Km' },
  { minKm: 5.0001, maxKm: 6.0, fee: 19.0, label: '5.1 a 6 Km' },
  { minKm: 6.0001, maxKm: 7.0, fee: 21.0, label: '6.1 a 7 Km' },
  { minKm: 7.0001, maxKm: 8.0, fee: 23.0, label: '7.1 a 8 Km' },
  { minKm: 8.0001, maxKm: 9.0, fee: 25.0, label: '8.1 a 9 Km' },
  { minKm: 9.0001, maxKm: 9.9999, fee: 27.0, label: '9.1 a 9.9 Km' },
  { minKm: 10.0, maxKm: 10.9999, fee: 30.0, label: '10 Km' },
  { minKm: 11.0, maxKm: 11.9999, fee: 32.0, label: '11 Km' },
  { minKm: 12.0, maxKm: 12.9999, fee: 34.0, label: '12 Km' },
  { minKm: 13.0, maxKm: 13.9999, fee: 36.0, label: '13 Km' },
  { minKm: 14.0, maxKm: 14.9999, fee: 38.0, label: '14 Km' },
  { minKm: 15.0, maxKm: 15.9999, fee: 40.0, label: '15 Km' },
  { minKm: 16.0, maxKm: 16.9999, fee: 42.0, label: '16 Km' },
  { minKm: 17.0, maxKm: 17.9999, fee: 44.0, label: '17 Km' },
  { minKm: 18.0, maxKm: 18.05, fee: 46.0, label: '18 Km' }
];

export const MAX_DELIVERY_DISTANCE_KM = 18.0;
export const RAIN_SURCHARGE_BS = 5.0;

/**
 * Calcula la tarifa de envío en bolivianos según la distancia en kilómetros y el estado del clima.
 * @param {number|null} distanceKm Distancia en kilómetros
 * @param {Object} options Opciones adicionales
 * @param {boolean} [options.isRaining=false] Si hay recargo por lluvia activo
 * @returns {{
 *   fee: number,
 *   baseFee: number,
 *   rainSurcharge: number,
 *   distanceKm: number|null,
 *   isWithinRange: boolean,
 *   label: string,
 *   message?: string
 * }}
 */
export const calculateDeliveryFee = (distanceKm, options = {}) => {
  const isRaining = Boolean(options.isRaining);

  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return {
      fee: 0,
      baseFee: 0,
      rainSurcharge: 0,
      distanceKm: null,
      isWithinRange: false,
      label: 'Sin ubicación fijada',
      message: 'Fija tu ubicación en el mapa o GPS para calcular el costo de envío.'
    };
  }

  const d = Math.max(0, parseFloat(distanceKm));

  if (d > MAX_DELIVERY_DISTANCE_KM) {
    return {
      fee: 0,
      baseFee: 0,
      rainSurcharge: 0,
      distanceKm: d,
      isWithinRange: false,
      label: `Excede ${MAX_DELIVERY_DISTANCE_KM} Km`,
      message: `Tu ubicación está a ${d.toFixed(1)} km. El servicio de motodelivery atiende hasta un máximo de ${MAX_DELIVERY_DISTANCE_KM} km.`
    };
  }

  // Buscar tramo en la tabla
  let matchedRate = DELIVERY_RATES.find(r => d >= r.minKm && d <= r.maxKm);

  // Casos límite intermedios (ej. 9.95 km) se asocian al tramo más cercano
  if (!matchedRate) {
    if (d < 1.0) matchedRate = DELIVERY_RATES[0];
    else if (d <= 18.0) {
      matchedRate = DELIVERY_RATES.find(r => d <= r.maxKm) || DELIVERY_RATES[DELIVERY_RATES.length - 1];
    }
  }

  const baseFee = matchedRate ? matchedRate.fee : 10.0;
  const rainSurcharge = isRaining ? RAIN_SURCHARGE_BS : 0;
  const totalFee = baseFee + rainSurcharge;

  return {
    fee: totalFee,
    baseFee,
    rainSurcharge,
    distanceKm: d,
    isWithinRange: true,
    label: matchedRate ? matchedRate.label : `${d.toFixed(1)} Km`
  };
};

/**
 * Valida si un pedido cumple los requisitos para usar el servicio de Delivery.
 * @param {Object} params
 * @param {number} params.cartSubtotal Subtotal del carrito
 * @param {number} [params.minDeliveryOrder=0] Monto mínimo fijado por el dueño
 * @param {number|null} params.distanceKm Distancia en Km
 * @param {boolean} [params.isDeliveryEnabled=true] Si la tienda tiene habilitado el delivery
 * @returns {{
 *   allowed: boolean,
 *   reason?: 'DELIVERY_DISABLED' | 'BELOW_MIN_ORDER' | 'OUT_OF_RANGE' | 'NO_COORDINATES',
 *   missingAmount: number,
 *   message: string
 * }}
 */
export const validateDeliveryEligibility = ({
  cartSubtotal = 0,
  minDeliveryOrder = 0,
  distanceKm = null,
  isDeliveryEnabled = true
}) => {
  if (!isDeliveryEnabled) {
    return {
      allowed: false,
      reason: 'DELIVERY_DISABLED',
      missingAmount: 0,
      message: 'Esta tienda atiende actualmente solo con Retiro en Tienda.'
    };
  }

  const minOrder = Math.max(0, parseFloat(minDeliveryOrder) || 0);
  const subtotal = Math.max(0, parseFloat(cartSubtotal) || 0);

  if (minOrder > 0 && subtotal < minOrder) {
    const missing = Math.round((minOrder - subtotal) * 100) / 100;
    return {
      allowed: false,
      reason: 'BELOW_MIN_ORDER',
      missingAmount: missing,
      message: `El pedido mínimo para delivery es de Bs. ${minOrder.toFixed(2)}. Agrega Bs. ${missing.toFixed(2)} más o elige Retiro en Tienda.`
    };
  }

  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return {
      allowed: false,
      reason: 'NO_COORDINATES',
      missingAmount: 0,
      message: 'Debes fijar tu dirección o ubicación en el mapa para calcular el envío.'
    };
  }

  if (distanceKm > MAX_DELIVERY_DISTANCE_KM) {
    return {
      allowed: false,
      reason: 'OUT_OF_RANGE',
      missingAmount: 0,
      message: `La distancia (${distanceKm.toFixed(1)} km) supera el radio máximo de cobertura (${MAX_DELIVERY_DISTANCE_KM} km).`
    };
  }

  return {
    allowed: true,
    missingAmount: 0,
    message: 'Pedido apto para envío a domicilio.'
  };
};
