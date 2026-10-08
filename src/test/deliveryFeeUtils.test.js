import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  calculateDeliveryFee,
  validateDeliveryEligibility,
  DELIVERY_RATES,
  MAX_DELIVERY_DISTANCE_KM,
  RAIN_SURCHARGE_BS
} from '../utils/deliveryFeeUtils.js';

test('calculateDistanceKm calcula correctamente distancias reales con Haversine', () => {
  // Plaza 24 de Septiembre (-17.7833, -63.1821) a Ventura Mall (-17.7554, -63.1979) ~ 3.5 km
  const distance = calculateDistanceKm(-17.7833, -63.1821, -17.7554, -63.1979);
  assert.ok(distance !== null);
  assert.ok(distance > 3.0 && distance < 4.0, `Distancia calculada: ${distance}`);

  // Misma coordenada = 0 km
  const same = calculateDistanceKm(-17.78, -63.18, -17.78, -63.18);
  assert.equal(same, 0);

  // Coordenadas inválidas
  assert.equal(calculateDistanceKm(null, -63.18, -17.78, -63.18), null);
  assert.equal(calculateDistanceKm(undefined, null, 'abc', 10), null);
});

test('calculateDeliveryFee mapea exactamente la tabla de motodelivery', () => {
  // 0 a 1 Km -> Bs. 10
  assert.equal(calculateDeliveryFee(0.5).fee, 10.0);
  assert.equal(calculateDeliveryFee(1.0).fee, 10.0);

  // 1.1 a 3 Km -> Bs. 13
  assert.equal(calculateDeliveryFee(1.1).fee, 13.0);
  assert.equal(calculateDeliveryFee(2.5).fee, 13.0);
  assert.equal(calculateDeliveryFee(3.0).fee, 13.0);

  // 3.1 a 4 Km -> Bs. 15
  assert.equal(calculateDeliveryFee(3.5).fee, 15.0);
  assert.equal(calculateDeliveryFee(4.0).fee, 15.0);

  // 4.1 a 5 Km -> Bs. 17
  assert.equal(calculateDeliveryFee(4.5).fee, 17.0);

  // 5.1 a 6 Km -> Bs. 19
  assert.equal(calculateDeliveryFee(5.8).fee, 19.0);

  // 6.1 a 7 Km -> Bs. 21
  assert.equal(calculateDeliveryFee(6.2).fee, 21.0);

  // 7.1 a 8 Km -> Bs. 23
  assert.equal(calculateDeliveryFee(7.5).fee, 23.0);

  // 8.1 a 9 Km -> Bs. 25
  assert.equal(calculateDeliveryFee(8.9).fee, 25.0);

  // 9.1 a 9.9 Km -> Bs. 27
  assert.equal(calculateDeliveryFee(9.5).fee, 27.0);

  // 10 Km -> Bs. 30
  assert.equal(calculateDeliveryFee(10.2).fee, 30.0);

  // 11 Km -> Bs. 32
  assert.equal(calculateDeliveryFee(11.0).fee, 32.0);

  // 12 Km -> Bs. 34
  assert.equal(calculateDeliveryFee(12.5).fee, 34.0);

  // 13 Km -> Bs. 36
  assert.equal(calculateDeliveryFee(13.1).fee, 36.0);

  // 14 Km -> Bs. 38
  assert.equal(calculateDeliveryFee(14.0).fee, 38.0);

  // 15 Km -> Bs. 40
  assert.equal(calculateDeliveryFee(15.5).fee, 40.0);

  // 16 Km -> Bs. 42
  assert.equal(calculateDeliveryFee(16.2).fee, 42.0);

  // 17 Km -> Bs. 44
  assert.equal(calculateDeliveryFee(17.8).fee, 44.0);

  // 18 Km -> Bs. 46
  assert.equal(calculateDeliveryFee(18.0).fee, 46.0);
});

test('calculateDeliveryFee aplica recargo por lluvia de +Bs. 5', () => {
  const normal = calculateDeliveryFee(2.5, { isRaining: false });
  assert.equal(normal.fee, 13.0);
  assert.equal(normal.rainSurcharge, 0);

  const rainy = calculateDeliveryFee(2.5, { isRaining: true });
  assert.equal(rainy.fee, 18.0);
  assert.equal(rainy.baseFee, 13.0);
  assert.equal(rainy.rainSurcharge, 5.0);
});

test('calculateDeliveryFee rechaza pedidos mayores a 18 Km', () => {
  const res = calculateDeliveryFee(18.5);
  assert.equal(res.isWithinRange, false);
  assert.equal(res.fee, 0);
  assert.match(res.message, /máximo de 18 km/i);
});

test('validateDeliveryEligibility valida pedido mínimo y cobertura', () => {
  // Delivery desactivado
  const disabled = validateDeliveryEligibility({ isDeliveryEnabled: false });
  assert.equal(disabled.allowed, false);
  assert.equal(disabled.reason, 'DELIVERY_DISABLED');

  // Subtotal menor al pedido mínimo
  const belowMin = validateDeliveryEligibility({
    cartSubtotal: 15.0,
    minDeliveryOrder: 25.0,
    distanceKm: 2.0,
    isDeliveryEnabled: true
  });
  assert.equal(belowMin.allowed, false);
  assert.equal(belowMin.reason, 'BELOW_MIN_ORDER');
  assert.equal(belowMin.missingAmount, 10.0);

  // Sin coordenadas
  const noCoords = validateDeliveryEligibility({
    cartSubtotal: 30.0,
    minDeliveryOrder: 20.0,
    distanceKm: null,
    isDeliveryEnabled: true
  });
  assert.equal(noCoords.allowed, false);
  assert.equal(noCoords.reason, 'NO_COORDINATES');

  // Distancia mayor a 18 Km
  const far = validateDeliveryEligibility({
    cartSubtotal: 50.0,
    minDeliveryOrder: 20.0,
    distanceKm: 22.0,
    isDeliveryEnabled: true
  });
  assert.equal(far.allowed, false);
  assert.equal(far.reason, 'OUT_OF_RANGE');

  // Todo válido
  const valid = validateDeliveryEligibility({
    cartSubtotal: 50.0,
    minDeliveryOrder: 20.0,
    distanceKm: 4.5,
    isDeliveryEnabled: true
  });
  assert.equal(valid.allowed, true);
  assert.equal(valid.missingAmount, 0);
});
