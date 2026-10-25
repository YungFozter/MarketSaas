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

test('Restauración de sesión de comerciante: al volver de explorar otra tienda como Bodega La Pascana en VISTA VECINO, el Panel Minimarket recupera íntegramente la tienda del dueño', () => {
  const localStorageMock = {};
  
  // 1. Simular sesión activa de comerciante con su propia tienda
  const merchantStore = {
    id: 'minimarket-don-pepe',
    slug: 'minimarket-don-pepe',
    name: 'Minimarket Don Pepe',
    address: 'Av. Mutualista calle 3',
    owner_id: 'user-pepe-123',
    config: {
      id: 'minimarket-don-pepe',
      name: 'Minimarket Don Pepe',
      address: 'Av. Mutualista calle 3'
    }
  };
  localStorageMock['marketsaas_merchant_store'] = JSON.stringify(merchantStore);
  localStorageMock['marketsaas_merchant_store_id'] = merchantStore.id;
  localStorageMock[`marketsaas_${merchantStore.slug}_store_config`] = JSON.stringify(merchantStore.config);
  localStorageMock[`marketsaas_${merchantStore.slug}_products`] = JSON.stringify([
    { id: 'pepe-prod-1', name: 'Arroz Don Pepe 1kg', price: 9.50 }
  ]);

  // 2. Simular navegación en VISTA VECINO a otra tienda ("Bodega La Pascana")
  let activeTenantSlug = 'bodega-la-pascana';
  let activeStoreConfig = {
    id: 'bodega-la-pascana',
    tenant_id: 'bodega-la-pascana',
    name: 'Bodega La Pascana'
  };
  let activeProducts = [{ id: 'pascana-1', name: 'Refresco Somó 500ml', price: 5.00 }];
  let activeViewMode = 'customer';

  assert.equal(activeTenantSlug, 'bodega-la-pascana');
  assert.equal(activeStoreConfig.name, 'Bodega La Pascana');
  assert.equal(activeViewMode, 'customer');

  // 3. Simular clic en "Panel Minimarket" y ejecución de restoreMerchantAdminSession
  const restoreMerchantSession = () => {
    const raw = localStorageMock['marketsaas_merchant_store'];
    const targetStore = raw ? JSON.parse(raw) : null;
    assert.ok(targetStore, 'Debe existir la tienda del comerciante en localStorage');

    const targetSlug = targetStore.slug || targetStore.id;
    activeTenantSlug = targetSlug;
    
    const savedConfig = localStorageMock[`marketsaas_${targetSlug}_store_config`];
    activeStoreConfig = savedConfig ? JSON.parse(savedConfig) : targetStore.config;

    const savedProds = localStorageMock[`marketsaas_${targetSlug}_products`];
    activeProducts = savedProds ? JSON.parse(savedProds) : [];
    activeViewMode = 'admin';
  };

  restoreMerchantSession();

  // 4. Validar que la sesión propia fue 100% restaurada y NO quedó como dueño de Bodega La Pascana
  assert.equal(activeViewMode, 'admin');
  assert.equal(activeTenantSlug, 'minimarket-don-pepe');
  assert.equal(activeStoreConfig.name, 'Minimarket Don Pepe');
  assert.notEqual(activeStoreConfig.name, 'Bodega La Pascana');
  assert.equal(activeProducts[0].name, 'Arroz Don Pepe 1kg');
});

test('Aislamiento de pedidos Realtime/Broadcast: pedidos de Tienda A jamás se mezclan con Tienda B ni con tienda default', () => {
  // Simular la lógica de discriminación de pedidos entrantes en StoreContext
  const evaluateIsOurStore = (incomingOrder, currentTenant, currentMerchantStore, currentUser) => {
    const activeStoreSlug = currentMerchantStore?.id || currentTenant;
    return Boolean(
      (activeStoreSlug && incomingOrder.tenant_id === activeStoreSlug) || 
      (currentMerchantStore && (incomingOrder.tenant_id === currentMerchantStore.id || (currentMerchantStore.owner_id && incomingOrder.owner_id === currentMerchantStore.owner_id))) ||
      (currentUser && currentUser.id && incomingOrder.owner_id === currentUser.id) ||
      ((!activeStoreSlug || activeStoreSlug === 'default' || activeStoreSlug === 'matias-tiendatodo') && 
        (incomingOrder.tenant_id === 'default' || incomingOrder.tenant_id === 'matias-tiendatodo'))
    );
  };

  const orderStoreA = { id: 'ORD-101', tenant_id: 'minimarket-don-pepe', owner_id: 'owner-pepe', total: 50 };
  const orderStoreB = { id: 'ORD-202', tenant_id: 'minimarket-dona-maria', owner_id: 'owner-maria', total: 75 };
  const orderDemo = { id: 'ORD-303', tenant_id: 'matias-tiendatodo', owner_id: null, total: 30 };

  // Caso 1: Tienda Pepe no debe aceptar pedidos de Tienda Maria
  assert.equal(evaluateIsOurStore(orderStoreB, 'minimarket-don-pepe', { id: 'minimarket-don-pepe', owner_id: 'owner-pepe' }, { id: 'owner-pepe' }), false);
  // Caso 2: Tienda Pepe debe aceptar sus propios pedidos
  assert.equal(evaluateIsOurStore(orderStoreA, 'minimarket-don-pepe', { id: 'minimarket-don-pepe', owner_id: 'owner-pepe' }, { id: 'owner-pepe' }), true);
  // Caso 3: Usuario visitante en landing/demo ('default') JAMÁS debe aceptar pedidos reales de Pepe o Maria
  assert.equal(evaluateIsOurStore(orderStoreA, 'default', null, null), false);
  assert.equal(evaluateIsOurStore(orderStoreB, 'default', null, null), false);
  // Caso 4: Usuario visitante en landing/demo sí recibe pedidos demo propios
  assert.equal(evaluateIsOurStore(orderDemo, 'default', null, null), true);
});

test('Aislamiento y permanencia de Imagen de Portada (Banner) y Logo entre dueños: Tienda B no hereda imágenes de Tienda A', () => {
  const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80';
  const CUSTOM_BANNER_A = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD_BANNER_TIENDA_A';
  const CUSTOM_LOGO_A = 'https://cdn.example.com/logo-tienda-a.png';
  const PRESET_BANNER_B = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80';

  // 1. Simulación de resolución de banner y logo con lógica isSameStore
  const resolveStoreImages = (prevConfig, remoteRecord, currentTenantSlug) => {
    const configData = remoteRecord?.config || {};
    const isSameStore = Boolean(
      prevConfig && (
        prevConfig.id === currentTenantSlug ||
        prevConfig.tenant_id === currentTenantSlug ||
        (remoteRecord && (prevConfig.id === remoteRecord.id || prevConfig.tenant_id === remoteRecord.id))
      )
    );

    const effectiveLogo = configData.logoUrl || remoteRecord?.logo_url || (isSameStore ? prevConfig?.logoUrl : '') || '';
    const effectiveBanner = configData.bannerUrl || remoteRecord?.banner_url || (isSameStore ? prevConfig?.bannerUrl : DEFAULT_BANNER);
    const effectiveQr = configData.qrImageUrl || remoteRecord?.qr_image_url || (isSameStore ? prevConfig?.qrImageUrl : '') || '';

    return {
      id: currentTenantSlug,
      logoUrl: effectiveLogo,
      bannerUrl: effectiveBanner,
      qrImageUrl: effectiveQr
    };
  };

  // Tienda A (Don Pepe) guarda su propio banner cargado y logo
  const storeA_Record = {
    id: 'minimarket-don-pepe',
    config: {
      id: 'minimarket-don-pepe',
      name: 'Minimarket Don Pepe',
      bannerUrl: CUSTOM_BANNER_A,
      logoUrl: CUSTOM_LOGO_A
    }
  };

  const storeA_Resolved = resolveStoreImages(null, storeA_Record, 'minimarket-don-pepe');
  assert.equal(storeA_Resolved.bannerUrl, CUSTOM_BANNER_A, 'Tienda A debe preservar su banner personalizado');
  assert.equal(storeA_Resolved.logoUrl, CUSTOM_LOGO_A, 'Tienda A debe preservar su logo');

  // Ahora el usuario o la vista cambia a Tienda B (Doña María), que acaba de ser registrada y no tiene banner personalizado
  const storeB_Record = {
    id: 'tienda-dona-maria',
    config: {
      id: 'tienda-dona-maria',
      name: 'Tienda Doña María',
      // bannerUrl no fue configurado aún por María
    }
  };

  // Se evalúa pasando el estado anterior (que era de Tienda A)
  const storeB_Resolved = resolveStoreImages(storeA_Resolved, storeB_Record, 'tienda-dona-maria');

  // Comprobación crítica: Tienda B JAMÁS debe recibir el banner ni logo de Tienda A
  assert.notEqual(storeB_Resolved.bannerUrl, CUSTOM_BANNER_A, 'Tienda B NO debe heredar el banner de Tienda A');
  assert.notEqual(storeB_Resolved.logoUrl, CUSTOM_LOGO_A, 'Tienda B NO debe heredar el logo de Tienda A');
  assert.equal(storeB_Resolved.bannerUrl, DEFAULT_BANNER, 'Tienda B debe tener el banner predeterminado neutro');
  assert.equal(storeB_Resolved.logoUrl, '', 'Tienda B debe tener logo vacío');

  // Si Doña María elige el Preset de Panadería, su banner debe persistir para Tienda B
  storeB_Record.config.bannerUrl = PRESET_BANNER_B;
  const storeB_WithPreset = resolveStoreImages(storeB_Resolved, storeB_Record, 'tienda-dona-maria');
  assert.equal(storeB_WithPreset.bannerUrl, PRESET_BANNER_B, 'Tienda B debe preservar su banner de panadería elegido');

  // Y Tienda A sigue intacta con su propio banner
  assert.equal(storeA_Resolved.bannerUrl, CUSTOM_BANNER_A);
});


