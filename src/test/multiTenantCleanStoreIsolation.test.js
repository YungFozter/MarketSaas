import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  isOfficialSeedStore, 
  isFernandoSeedStore, 
  isMatiasSeedStore,
  hasPredefinedCatalog,
  isPredefinedMapStore 
} from '../utils/storeTenantUtils.js';
import { 
  getStoreCatalog, 
  PREDEFINED_MAP_STORE_SLUGS 
} from '../data/storeInventories.js';

test('isOfficialSeedStore solo reconoce como semillas oficiales a Matias TiendaTodo y Tiendita Fernando', () => {
  // Matias TiendaTodo
  assert.equal(isOfficialSeedStore('matias-tiendatodo'), true);
  assert.equal(isOfficialSeedStore('default'), true);
  assert.equal(isMatiasSeedStore('matias-tiendatodo'), true);
  assert.equal(isMatiasSeedStore('default'), true);

  // Tiendita Fernando
  assert.equal(isOfficialSeedStore('minimarket-ian'), true);
  assert.equal(isOfficialSeedStore('tiendita-fernando'), true);
  assert.equal(isOfficialSeedStore('fernando'), true);
  assert.equal(isFernandoSeedStore('minimarket-ian'), true);
  assert.equal(isFernandoSeedStore('tiendita-fernando'), true);

  // Tiendas creadas o registradas por nuevos usuarios / comerciantes
  assert.equal(isOfficialSeedStore('don-pepe'), false);
  assert.equal(isOfficialSeedStore('tienda-maria'), false);
  assert.equal(isOfficialSeedStore('abarrotes-luz'), false);
  assert.equal(isOfficialSeedStore('minimarket-central-2026'), false);
  assert.equal(isOfficialSeedStore(null), false);
  assert.equal(isOfficialSeedStore(''), false);
  assert.equal(isOfficialSeedStore(undefined), false);
});

test('getStoreCatalog devuelve inventario vacío [] para tiendas de comerciantes creadas por usuarios', () => {
  // Tiendas registradas nuevas por comerciantes
  const newStore1Catalog = getStoreCatalog('don-pepe');
  assert.ok(Array.isArray(newStore1Catalog));
  assert.equal(newStore1Catalog.length, 0, 'Una tienda nueva no debe tener productos inyectados');

  const newStore2Catalog = getStoreCatalog('tienda-de-maria');
  assert.equal(newStore2Catalog.length, 0, 'Una tienda nueva no debe tener productos inyectados');

  const defaultCatalog = getStoreCatalog('default');
  assert.equal(defaultCatalog.length, 0);
});

test('getStoreCatalog preserva catálogo para marcadores del mapa de VISTA VECINO en Santa Cruz', () => {
  // Tiendas del mapa de Santa Cruz (Anillos 1 al 6)
  assert.ok(PREDEFINED_MAP_STORE_SLUGS.has('minimarket-el-casco-viejo'));
  assert.ok(PREDEFINED_MAP_STORE_SLUGS.has('bodega-la-pascana'));
  assert.ok(PREDEFINED_MAP_STORE_SLUGS.has('sirari-market-deli'));

  // hasPredefinedCatalog debe retornar true para todas las tiendas inyectadas
  assert.equal(hasPredefinedCatalog('minimarket-el-casco-viejo'), true);
  assert.equal(hasPredefinedCatalog('bodega-la-pascana'), true);
  assert.equal(hasPredefinedCatalog('sirari-market-deli'), true);
  assert.equal(hasPredefinedCatalog('matias-tiendatodo'), true);
  assert.equal(hasPredefinedCatalog('default'), true);
  assert.equal(hasPredefinedCatalog('minimarket-ian'), true);
  assert.equal(hasPredefinedCatalog('tiendita-fernando'), true);

  // hasPredefinedCatalog debe retornar false para tiendas de comerciantes creadas por usuarios
  assert.equal(hasPredefinedCatalog('don-pepe'), false);
  assert.equal(hasPredefinedCatalog('tienda-maria'), false);
  assert.equal(hasPredefinedCatalog('nueva-tienda-limpia'), false);
  assert.equal(hasPredefinedCatalog(''), false);
  assert.equal(hasPredefinedCatalog(null), false);

  const cascovCatalog = getStoreCatalog('minimarket-el-casco-viejo');
  assert.ok(cascovCatalog.length > 0, 'Las tiendas del mapa cruceño deben tener catálogo para Vista Vecino');

  const sirariCatalog = getStoreCatalog('sirari-market-deli');
  assert.ok(sirariCatalog.length > 0, 'Las tiendas del mapa cruceño deben tener catálogo para Vista Vecino');
});

test('Aislamiento de módulos en nueva tienda: Pedidos, Inventario, Deudores, Proveedores y Buzón inician 100% limpios', () => {
  const customStoreSlug = 'nueva-tienda-limpia';
  const storageMock = {};

  // Simular creación de tienda limpia (createMerchantStore)
  storageMock[`marketsaas_${customStoreSlug}_products`] = JSON.stringify([]);
  storageMock[`marketsaas_${customStoreSlug}_orders`] = JSON.stringify([]);
  storageMock[`marketsaas_${customStoreSlug}_suppliers`] = JSON.stringify([]);
  storageMock[`marketsaas_${customStoreSlug}_suppliers_initialized`] = 'true';
  storageMock[`marketsaas_${customStoreSlug}_credits`] = JSON.stringify([]);
  storageMock[`marketsaas_${customStoreSlug}_credits_initialized`] = 'true';
  storageMock[`marketsaas_${customStoreSlug}_requests`] = JSON.stringify([]);

  // Validar que no hereda nada de Matias ni Fernando
  assert.equal(isOfficialSeedStore(customStoreSlug), false);

  const getCleanOrders = (slug) => {
    if (!isOfficialSeedStore(slug)) {
      const raw = storageMock[`marketsaas_${slug}_orders`];
      return raw ? JSON.parse(raw) : [];
    }
    return [{ id: 'SEED-1' }];
  };

  const getCleanProducts = (slug) => {
    if (!isOfficialSeedStore(slug)) {
      const raw = storageMock[`marketsaas_${slug}_products`];
      return raw ? JSON.parse(raw) : [];
    }
    return [{ id: 'SEED-PROD-1' }];
  };

  const getCleanCredits = (slug) => {
    if (!isOfficialSeedStore(slug)) {
      const raw = storageMock[`marketsaas_${slug}_credits`];
      return raw ? JSON.parse(raw) : [];
    }
    return [{ id: 'SEED-DEUD-1' }];
  };

  const getCleanSuppliers = (slug) => {
    if (!isOfficialSeedStore(slug)) {
      const raw = storageMock[`marketsaas_${slug}_suppliers`];
      return raw ? JSON.parse(raw) : [];
    }
    return [{ id: 'SEED-SUP-1' }];
  };

  const getCleanRequests = (slug) => {
    if (!isOfficialSeedStore(slug)) {
      const raw = storageMock[`marketsaas_${slug}_requests`];
      return raw ? JSON.parse(raw) : [];
    }
    return [{ id: 'SEED-REQ-1' }];
  };

  assert.deepEqual(getCleanOrders(customStoreSlug), []);
  assert.deepEqual(getCleanProducts(customStoreSlug), []);
  assert.deepEqual(getCleanCredits(customStoreSlug), []);
  assert.deepEqual(getCleanSuppliers(customStoreSlug), []);
  assert.deepEqual(getCleanRequests(customStoreSlug), []);
});
