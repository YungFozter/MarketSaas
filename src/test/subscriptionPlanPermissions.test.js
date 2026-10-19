import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  resolveActivePlanType, 
  isFeatureAllowedForPlan, 
  SUBSCRIPTION_PLANS, 
  SYSTEM_FEATURES,
  normalizeSubscription,
  createDefaultSubscription
} from '../utils/subscriptionUtils.js';

test('SUBSCRIPTION_PLANS y SYSTEM_FEATURES definen catálogo canónico de planes y precios en Bolivia', () => {
  assert.equal(SUBSCRIPTION_PLANS.BASIC.priceBolivianos, 75, 'Plan Básico debe ser Bs. 75');
  assert.equal(SUBSCRIPTION_PLANS.PRO.priceBolivianos, 129, 'Plan PRO debe ser Bs. 129');
  assert.equal(SUBSCRIPTION_PLANS.TRIAL.priceBolivianos, 0, 'Prueba gratuita debe ser Bs. 0');

  assert.ok(SYSTEM_FEATURES.POS_TERMINAL, 'Debe incluir Punto de Venta');
  assert.ok(SYSTEM_FEATURES.EXCEL_ADVANCED_EXPORT, 'Debe incluir Exportación Excel Avanzada');
  assert.ok(SYSTEM_FEATURES.PDF_EXPORT, 'Debe incluir PDF');
  assert.ok(SYSTEM_FEATURES.PRODUCT_PERFORMANCE, 'Debe incluir Analítica de Producto');

  assert.equal(SYSTEM_FEATURES.POS_TERMINAL.minPlan, 'basic');
  assert.equal(SYSTEM_FEATURES.PDF_EXPORT.minPlan, 'basic');
  assert.equal(SYSTEM_FEATURES.EXCEL_ADVANCED_EXPORT.minPlan, 'pro');
  assert.equal(SYSTEM_FEATURES.PRODUCT_PERFORMANCE.minPlan, 'pro');
});

test('resolveActivePlanType clasifica correctamente el estado de la suscripción', () => {
  const futureExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const pastExp = new Date(Date.now() - 1000).toISOString();

  // 1. Suscripción expirada
  assert.equal(resolveActivePlanType({ subscriptionExpiresAt: pastExp }), 'expired');
  assert.equal(resolveActivePlanType(null), 'expired');

  // 2. Período de prueba activo
  const trialSub = {
    trialEndsAt: futureExp,
    subscriptionExpiresAt: futureExp,
    plan: 'trial_free'
  };
  assert.equal(resolveActivePlanType(trialSub), 'trial');

  // 3. Plan Básico activo
  const basicSubExplicit = {
    subscriptionExpiresAt: futureExp,
    planType: 'basic',
    plan: 'Plan Básico (30 Días)'
  };
  assert.equal(resolveActivePlanType(basicSubExplicit), 'basic');

  const basicSubInferred = {
    subscriptionExpiresAt: futureExp,
    plan: 'Plan Mensual (30 Días)'
  };
  assert.equal(resolveActivePlanType(basicSubInferred), 'basic');

  // 4. Plan PRO activo
  const proSubExplicit = {
    subscriptionExpiresAt: futureExp,
    planType: 'pro',
    plan: 'Plan PRO ⭐ (30 Días)'
  };
  assert.equal(resolveActivePlanType(proSubExplicit), 'pro');

  const proSubInferred = {
    subscriptionExpiresAt: futureExp,
    plan: 'plan pro anual'
  };
  assert.equal(resolveActivePlanType(proSubInferred), 'pro');
});

test('isFeatureAllowedForPlan permite funciones según matriz de permisos de Plan Básico vs Plan PRO', () => {
  // Plan Básico
  assert.equal(isFeatureAllowedForPlan('POS_TERMINAL', 'basic'), true, 'POS debe permitirse en Plan Básico');
  assert.equal(isFeatureAllowedForPlan('INVENTORY_MANAGEMENT', 'basic'), true, 'Inventario debe permitirse en Plan Básico');
  assert.equal(isFeatureAllowedForPlan('DEBT_BOOK', 'basic'), true, 'Libreta de Deudas debe permitirse en Plan Básico');
  assert.equal(isFeatureAllowedForPlan('PDF_EXPORT', 'basic'), true, 'Exportar PDF debe permitirse en Plan Básico');
  assert.equal(isFeatureAllowedForPlan('SUPPLIERS_MANAGEMENT', 'basic'), true, 'Proveedores debe permitirse en Plan Básico');

  // Funciones exclusivas PRO deben estar denegadas en Plan Básico
  assert.equal(isFeatureAllowedForPlan('EXCEL_ADVANCED_EXPORT', 'basic'), false, 'Excel Avanzado debe negarse en Plan Básico');
  assert.equal(isFeatureAllowedForPlan('PRODUCT_PERFORMANCE', 'basic'), false, 'Analítica de producto debe negarse en Plan Básico');
  assert.equal(isFeatureAllowedForPlan('PRO_BADGE_MAP', 'basic'), false, 'Insignia PRO en mapa debe negarse en Plan Básico');
  assert.equal(isFeatureAllowedForPlan('MASS_EXCEL_IMPORT', 'basic'), false, 'Importar Excel debe negarse en Plan Básico');
  assert.equal(isFeatureAllowedForPlan('HEADER_ANNOUNCEMENT', 'basic'), false, 'Anuncio PRO debe negarse en Plan Básico');

  // Plan PRO: todo permitido
  assert.equal(isFeatureAllowedForPlan('POS_TERMINAL', 'pro'), true);
  assert.equal(isFeatureAllowedForPlan('PDF_EXPORT', 'pro'), true);
  assert.equal(isFeatureAllowedForPlan('EXCEL_ADVANCED_EXPORT', 'pro'), true, 'Excel Avanzado debe permitirse en Plan PRO');
  assert.equal(isFeatureAllowedForPlan('PRODUCT_PERFORMANCE', 'pro'), true, 'Analítica de producto debe permitirse en Plan PRO');
  assert.equal(isFeatureAllowedForPlan('PRO_BADGE_MAP', 'pro'), true);
  assert.equal(isFeatureAllowedForPlan('MASS_EXCEL_IMPORT', 'pro'), true);

  // Período de Prueba ('trial'): todo permitido para evaluación completa
  assert.equal(isFeatureAllowedForPlan('POS_TERMINAL', 'trial'), true);
  assert.equal(isFeatureAllowedForPlan('EXCEL_ADVANCED_EXPORT', 'trial'), true, 'Excel debe permitir evaluarse durante trial');
  assert.equal(isFeatureAllowedForPlan('PRODUCT_PERFORMANCE', 'trial'), true);

  // Suscripción Expirada ('expired'): todo denegado
  assert.equal(isFeatureAllowedForPlan('POS_TERMINAL', 'expired'), false);
  assert.equal(isFeatureAllowedForPlan('EXCEL_ADVANCED_EXPORT', 'expired'), false);
  assert.equal(isFeatureAllowedForPlan('PDF_EXPORT', 'expired'), false);
  assert.equal(isFeatureAllowedForPlan('INVENTORY_MANAGEMENT', 'expired'), false);
});

test('normalizeSubscription asigna y preserva correctamente planType', () => {
  const futureExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const proSub = {
    status: 'active',
    subscriptionExpiresAt: futureExp,
    plan: 'Plan PRO (30 Días)',
    planType: 'pro'
  };

  const normalizedPro = normalizeSubscription(proSub);
  assert.equal(normalizedPro.planType, 'pro');

  const basicSub = {
    status: 'active',
    subscriptionExpiresAt: futureExp,
    plan: 'Plan Básico (30 Días)',
    planType: 'basic'
  };

  const normalizedBasic = normalizeSubscription(basicSub);
  assert.equal(normalizedBasic.planType, 'basic');
});
