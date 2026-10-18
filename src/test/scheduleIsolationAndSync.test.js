import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  normalizeStoreSchedule, 
  DEFAULT_WEEKLY_SCHEDULE, 
  calculateStoreOpenStatus,
  formatScheduleSummary,
  getBoliviaTime
} from '../utils/scheduleUtils.js';

test('normalizeStoreSchedule normaliza correctamente la estructura semanal Día por Día (Lunes a Domingo)', () => {
  const normalized = normalizeStoreSchedule();
  assert.equal(normalized.mode, 'auto');
  assert.equal(normalized.weekly.length, 7);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  days.forEach(d => {
    assert.ok(normalized[d], `Debe existir la propiedad directa para ${d}`);
    assert.equal(typeof normalized[d].open, 'boolean');
    assert.equal(typeof normalized[d].openTime, 'string');
    assert.equal(typeof normalized[d].closeTime, 'string');
  });
});

test('Ajuste de horario en Tienda A no afecta a Tienda B (Aislamiento Multi-Tenant estricto)', () => {
  // Simular mock de localStorage por tenant
  const storageMock = {};

  const saveTenantSchedule = (tenantSlug, scheduleObj) => {
    const normalized = normalizeStoreSchedule(scheduleObj);
    storageMock[`marketsaas_${tenantSlug}_store_config`] = JSON.stringify({
      id: tenantSlug,
      tenant_id: tenantSlug,
      schedule: normalized
    });
  };

  const loadTenantSchedule = (tenantSlug) => {
    const raw = storageMock[`marketsaas_${tenantSlug}_store_config`];
    if (!raw) return normalizeStoreSchedule();
    return normalizeStoreSchedule(JSON.parse(raw).schedule);
  };

  // Tienda A: "minimarket-ian" cierra los domingos y abre de 07:00 a 23:00 los lunes
  const scheduleStoreA = normalizeStoreSchedule({
    mode: 'auto',
    monday: { open: true, enabled: true, openTime: '07:00', closeTime: '23:00' },
    sunday: { open: false, enabled: false, openTime: '09:00', closeTime: '15:00' }
  });
  saveTenantSchedule('minimarket-ian', scheduleStoreA);

  // Tienda B: "dona-elena" abre los domingos de 08:00 a 20:00 y lunes normal 08:30 a 21:00
  const scheduleStoreB = normalizeStoreSchedule({
    mode: 'auto',
    monday: { open: true, enabled: true, openTime: '08:30', closeTime: '21:00' },
    sunday: { open: true, enabled: true, openTime: '08:00', closeTime: '20:00' }
  });
  saveTenantSchedule('dona-elena', scheduleStoreB);

  // Verificar que al leer Tienda A, sus horarios son los propios y no fueron contaminados por Tienda B
  const loadedA = loadTenantSchedule('minimarket-ian');
  assert.equal(loadedA.sunday.open, false, 'Tienda A debe permanecer CERRADA los domingos');
  assert.equal(loadedA.monday.openTime, '07:00', 'Tienda A abre 07:00 los lunes');
  assert.equal(loadedA.monday.closeTime, '23:00', 'Tienda A cierra 23:00 los lunes');

  // Verificar que Tienda B tiene sus propios horarios intactos
  const loadedB = loadTenantSchedule('dona-elena');
  assert.equal(loadedB.sunday.open, true, 'Tienda B debe permanecer ABIERTA los domingos');
  assert.equal(loadedB.sunday.openTime, '08:00');
  assert.equal(loadedB.monday.openTime, '08:30');

  // Modificar Tienda A nuevamente
  const updatedA = {
    ...loadedA,
    sunday: { ...loadedA.sunday, open: true, enabled: true, openTime: '10:00', closeTime: '14:00' }
  };
  saveTenantSchedule('minimarket-ian', updatedA);

  // Verificar que Tienda B no cambió tras actualizar Tienda A
  const reloadedB = loadTenantSchedule('dona-elena');
  assert.equal(reloadedB.sunday.openTime, '08:00', 'Tienda B conserva su hora de domingo');
  assert.equal(reloadedB.sunday.closeTime, '20:00', 'Tienda B conserva su hora de cierre de domingo');
});

test('Horario de Programación Día por Día se sincroniza exactamente entre VISTA DUEÑO y VISTA VECINO', () => {
  // Simular configuración guardada por el dueño
  const ownerConfig = {
    id: 'tienda-test',
    tenant_id: 'tienda-test',
    name: 'Tienda Vecinal',
    storeOpenMode: 'auto',
    scheduleClosedMessage: 'Volvemos mañana a las 8 AM',
    schedule: normalizeStoreSchedule({
      monday: { open: true, enabled: true, openTime: '08:00', closeTime: '21:00' },
      tuesday: { open: true, enabled: true, openTime: '08:00', closeTime: '21:00' },
      wednesday: { open: true, enabled: true, openTime: '08:00', closeTime: '21:00' },
      thursday: { open: true, enabled: true, openTime: '08:00', closeTime: '21:00' },
      friday: { open: true, enabled: true, openTime: '08:00', closeTime: '22:00' },
      saturday: { open: true, enabled: true, openTime: '09:00', closeTime: '22:00' },
      sunday: { open: false, enabled: false, openTime: '09:00', closeTime: '14:00' }
    })
  };

  // 1. Evaluación en VISTA DUEÑO
  const ownerStatus = calculateStoreOpenStatus(ownerConfig);

  // 2. Evaluación en VISTA VECINO (recibe exactamente storeConfig)
  const customerSchedule = normalizeStoreSchedule(ownerConfig.schedule);
  const customerStatus = calculateStoreOpenStatus({
    ...ownerConfig,
    schedule: customerSchedule
  });

  // Ambos deben coincidir exactamente
  assert.equal(customerStatus.isOpen, ownerStatus.isOpen, 'Estado isOpen debe ser idéntico en dueño y vecino');
  assert.equal(customerStatus.statusBadge, ownerStatus.statusBadge, 'Badge debe ser idéntico');
  assert.equal(customerStatus.currentDayName, ownerStatus.currentDayName, 'El día actual debe ser idéntico');

  // Verificar que la lista semanal de VISTA VECINO refleja fielmente el domingo cerrado definido por el dueño
  const sundayCustomer = customerSchedule.weekly.find(d => d.day === 'sunday');
  assert.ok(sundayCustomer);
  assert.equal(sundayCustomer.open, false, 'El vecino debe ver domingo como cerrado');
  assert.equal(sundayCustomer.enabled, false);

  // Verificar que el viernes el horario sea hasta las 22:00
  const fridayCustomer = customerSchedule.weekly.find(d => d.day === 'friday');
  assert.equal(fridayCustomer.closeTime, '22:00', 'El vecino debe ver el viernes hasta las 22:00');
});

test('Modo manual Forzar Abierto / Forzar Cerrado sincroniza de inmediato a VISTA VECINO con mensaje personalizado', () => {
  const storeConfigManualClosed = {
    id: 'tienda-test',
    storeOpenMode: 'manual_closed',
    scheduleClosedMessage: 'Cerrado por inventario general',
    schedule: normalizeStoreSchedule({ mode: 'manual_closed' })
  };

  const status = calculateStoreOpenStatus(storeConfigManualClosed);
  assert.equal(status.isOpen, false, 'Debe reportar cerrado en vivo cuando el dueño fuerza el cierre');
  assert.equal(status.statusBadge, 'Cerrado Temporalmente');
  assert.equal(status.mode, 'manual_closed');
});
