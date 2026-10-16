import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  TRIAL_DURATION_MINUTES, 
  createDefaultSubscription, 
  normalizeSubscription, 
  calculateSubscriptionTimeRemaining 
} from '../utils/subscriptionUtils.js';

test('TRIAL_DURATION_MINUTES debe ser exactamente 21,600 minutos (15 días)', () => {
  const expectedMinutes = 15 * 24 * 60; // 21600
  assert.equal(TRIAL_DURATION_MINUTES, expectedMinutes, 'Debe equivaler exactamente a 15 días en minutos');
  assert.equal(TRIAL_DURATION_MINUTES, 21600);
});

test('createDefaultSubscription genera suscripción inicial en estado trial por 15 días', () => {
  const beforeMs = Date.now();
  const sub = createDefaultSubscription();
  const afterMs = Date.now();

  assert.equal(sub.status, 'trial');
  assert.equal(sub.plan, 'trial_free');
  assert.ok(Array.isArray(sub.history));

  const startMs = new Date(sub.trialStartedAt).getTime();
  const endMs = new Date(sub.trialEndsAt).getTime();
  const expMs = new Date(sub.subscriptionExpiresAt).getTime();

  assert.ok(startMs >= beforeMs && startMs <= afterMs, 'La fecha de inicio debe ser la actual');
  assert.equal(endMs, expMs, 'trialEndsAt y subscriptionExpiresAt deben coincidir');

  const diffMinutes = Math.round((endMs - startMs) / (60 * 1000));
  assert.equal(diffMinutes, 21600, 'La duración entre inicio y fin debe ser de 21600 minutos (15 días)');
});

test('normalizeSubscription asigna exactamente 15 días desde la fecha de creación en base de datos si no tiene suscripción previa', () => {
  // Tienda creada hace 3 días
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const normalized = normalizeSubscription(null, threeDaysAgo);

  assert.equal(normalized.status, 'trial');
  assert.equal(normalized.plan, 'trial_free');

  const startMs = new Date(normalized.trialStartedAt).getTime();
  const endMs = new Date(normalized.trialEndsAt).getTime();
  const diffMinutes = Math.round((endMs - startMs) / (60 * 1000));

  assert.equal(diffMinutes, 21600, 'Debe calcular exactamente 15 días');
  
  // Tiempo restante debe ser de 11d 23h o 12d
  const remaining = calculateSubscriptionTimeRemaining(normalized.subscriptionExpiresAt);
  assert.ok(remaining.days === 11 || remaining.days === 12, 'Deben restar 11 o 12 días completos');
  assert.equal(remaining.isExpired, false);
});

test('normalizeSubscription marca expirada una tienda creada hace más de 15 días', () => {
  // Tienda creada hace 16 días
  const sixteenDaysAgo = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString();
  const normalized = normalizeSubscription(null, sixteenDaysAgo);

  assert.equal(normalized.status, 'expired', 'Una tienda creada hace 16 días debe estar expirada');
  const remaining = calculateSubscriptionTimeRemaining(normalized.subscriptionExpiresAt);
  assert.equal(remaining.isExpired, true);
  assert.equal(remaining.days, 0);
});

test('normalizeSubscription preserva la permanencia de una tienda existente sin reiniciar los 15 días', () => {
  // Simular tienda existente en Supabase creada hace 5 días con fecha de expiración fijada
  const creationIso = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const existingExpiresIso = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

  const existingSub = {
    status: 'trial',
    trialStartedAt: creationIso,
    trialEndsAt: existingExpiresIso,
    subscriptionExpiresAt: existingExpiresIso,
    plan: 'trial_free',
    history: []
  };

  const reloaded = normalizeSubscription(existingSub, creationIso);

  assert.equal(reloaded.trialEndsAt, existingExpiresIso, 'No debe reiniciar la fecha de vencimiento');
  assert.equal(reloaded.subscriptionExpiresAt, existingExpiresIso);
  assert.equal(reloaded.status, 'trial');
});

test('normalizeSubscription preserva suscripción activa de pago (Plan Básico o Pro)', () => {
  const futureExp = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
  const paidSub = {
    status: 'active',
    plan: 'Plan Pro (Bs. 129)',
    subscriptionExpiresAt: futureExp,
    history: [{ code: 'MS-TEST-CODE', durationDays: 30 }]
  };

  const normalized = normalizeSubscription(paidSub);
  assert.equal(normalized.status, 'active');
  assert.equal(normalized.plan, 'Plan Pro (Bs. 129)');
  assert.equal(normalized.subscriptionExpiresAt, futureExp);
});
