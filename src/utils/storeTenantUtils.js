/**
 * Utilidades canónicas para identificación y aislamiento de Tiendas Semilla vs. Tiendas de Comerciantes
 *
 * REGLA DEL SISTEMA:
 * - Únicas dos tiendas reales con datos de prueba/demostración autorizados:
 *   1. Matías TiendaTodo ('matias-tiendatodo' / 'default')
 *   2. Tiendita Fernando ('minimarket-ian' / 'tiendita-fernando' / 'fernando')
 * - TODAS las demás tiendas de comerciantes creadas o registradas inician 100% limpias.
 */

import { PREDEFINED_MAP_STORE_SLUGS } from '../data/storeInventories.js';

export const isFernandoSeedStore = (slug) => {
  if (!slug) return false;
  const s = String(slug).toLowerCase().trim();
  return s === 'minimarket-ian' || s === 'tiendita-fernando' || s === 'fernando';
};

export const isMatiasSeedStore = (slug) => {
  if (!slug) return false;
  const s = String(slug).toLowerCase().trim();
  return s === 'matias-tiendatodo' || s === 'default';
};

export const isOfficialSeedStore = (slug) => {
  return isMatiasSeedStore(slug) || isFernandoSeedStore(slug);
};

export const isPredefinedMapStore = (slug) => {
  if (!slug) return false;
  const s = String(slug).toLowerCase().trim();
  const resolved = (s === 'tiendita-fernando' || s === 'fernando') ? 'minimarket-ian' : s;
  return PREDEFINED_MAP_STORE_SLUGS.has(resolved);
};

export const hasPredefinedCatalog = (slug) => {
  if (!slug) return false;
  if (slug === 'default') return true;
  return isPredefinedMapStore(slug);
};

/**
 * Normaliza un slug o ID de tienda sin mezclar valores vacíos/undefined.
 */
export const normalizeTenantId = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase();
};

/**
 * Verifica de forma estricta si un registro de tienda pertenece al tenant indicado.
 * Previene falsos positivos por undefined === undefined o comparaciones vacías.
 */
export const isSameTenantStore = (storeObj, targetSlug) => {
  const target = normalizeTenantId(targetSlug);
  if (!storeObj || !target) return false;

  const candidates = [
    storeObj.id,
    storeObj.slug,
    storeObj.tenant_id,
    storeObj.config?.id,
    storeObj.config?.tenant_id,
    storeObj.config?.slug,
    ...(Array.isArray(storeObj.aliases) ? storeObj.aliases : [])
  ]
    .map(normalizeTenantId)
    .filter(Boolean);

  if (candidates.includes(target)) return true;

  // Equivalencias canónicas de las 2 tiendas semilla oficiales únicamente
  if (isMatiasSeedStore(target) && candidates.some(isMatiasSeedStore)) return true;
  if (isFernandoSeedStore(target) && candidates.some(isFernandoSeedStore)) return true;

  return false;
};

/**
 * Verifica de forma estricta si un registro remoto de Supabase store_config
 * pertenece al comerciante autenticado actual sin riesgo de undefined === undefined.
 */
export const isOwnedRemoteStoreRecord = (remoteRecord, currentUser, merchantStore) => {
  if (!remoteRecord || !currentUser) return false;
  const userId = normalizeTenantId(currentUser.id);
  const conf = remoteRecord.config || {};

  if (userId) {
    if (normalizeTenantId(remoteRecord.owner_id) === userId) return true;
    if (normalizeTenantId(conf.owner_id) === userId) return true;
  }

  const rsIds = [
    normalizeTenantId(remoteRecord.id),
    normalizeTenantId(remoteRecord.tenant_id)
  ].filter(Boolean);

  if (rsIds.length === 0) return false;

  const merchantIds = [
    normalizeTenantId(merchantStore?.id),
    normalizeTenantId(merchantStore?.tenant_id),
    normalizeTenantId(merchantStore?.slug)
  ].filter(Boolean);

  return merchantIds.some(mId => rsIds.includes(mId));
};

/**
 * Resuelve de forma aislada los datos de ubicación, contacto y Google Maps
 * de una tienda específica, evitando filtrar datos de selectedStore u otro dueño.
 */
export const resolveIsolatedStoreShareData = ({
  tenant,
  storeConfig,
  merchantStore,
  selectedStore,
  stores = []
}) => {
  const cleanTenant = normalizeTenantId(tenant) || 'default';

  const configIdentifier = storeConfig?.id || storeConfig?.tenant_id || storeConfig?.slug;
  const scopedConfig = !configIdentifier || isSameTenantStore(storeConfig, cleanTenant)
    ? (storeConfig || {})
    : {};

  const scopedMerchant = isSameTenantStore(merchantStore, cleanTenant) ? merchantStore : null;
  const scopedSelected = isSameTenantStore(selectedStore, cleanTenant) ? selectedStore : null;
  const matchedDirectoryStore = (stores || []).find(s => isSameTenantStore(s, cleanTenant)) || null;

  const storeName = (
    scopedConfig.name ||
    scopedMerchant?.name ||
    matchedDirectoryStore?.name ||
    'Mi Minimarket'
  ).trim() || 'Mi Minimarket';

  const addressText = (
    scopedConfig.address?.trim() ||
    scopedConfig.zone?.trim() ||
    scopedMerchant?.address?.trim() ||
    matchedDirectoryStore?.address?.trim() ||
    'Dirección de la tienda'
  );

  const storePhone = (
    scopedConfig.whatsapp ||
    scopedConfig.phone ||
    scopedMerchant?.whatsapp ||
    scopedMerchant?.phone ||
    matchedDirectoryStore?.whatsapp ||
    matchedDirectoryStore?.phone ||
    ''
  ).trim();

  const isValidCoord = (val) => val !== '' && val != null && !isNaN(Number(val)) && Number(val) !== 0;

  const candidateLat = [
    scopedConfig.latitude,
    scopedConfig.googleMapsCoordinates?.lat,
    scopedMerchant?.latitude,
    scopedMerchant?.googleMapsCoordinates?.lat,
    scopedMerchant?.config?.latitude,
    scopedMerchant?.config?.googleMapsCoordinates?.lat,
    scopedSelected?.latitude,
    scopedSelected?.googleMapsCoordinates?.lat,
    matchedDirectoryStore?.latitude,
    matchedDirectoryStore?.googleMapsCoordinates?.lat
  ].find(isValidCoord);

  const candidateLng = [
    scopedConfig.longitude,
    scopedConfig.googleMapsCoordinates?.lng,
    scopedMerchant?.longitude,
    scopedMerchant?.googleMapsCoordinates?.lng,
    scopedMerchant?.config?.longitude,
    scopedMerchant?.config?.googleMapsCoordinates?.lng,
    scopedSelected?.longitude,
    scopedSelected?.googleMapsCoordinates?.lng,
    matchedDirectoryStore?.longitude,
    matchedDirectoryStore?.googleMapsCoordinates?.lng
  ].find(isValidCoord);

  const numLat = candidateLat != null ? Number(candidateLat) : null;
  const numLng = candidateLng != null ? Number(candidateLng) : null;

  if (numLat != null && numLng != null) {
    const cleanLat = Number(numLat.toFixed(6));
    const cleanLng = Number(numLng.toFixed(6));
    return {
      scopedConfig,
      storeName,
      addressText,
      storePhone,
      mapsUrl: `https://maps.google.com/?q=${cleanLat},${cleanLng}`,
      hasExactCoordinates: true,
      resolvedLat: cleanLat,
      resolvedLng: cleanLng
    };
  }

  const cleanQuery = [
    addressText !== 'Dirección de la tienda' ? addressText : storeName,
    'Santa Cruz de la Sierra, Bolivia'
  ].filter(Boolean).join(', ');

  return {
    scopedConfig,
    storeName,
    addressText,
    storePhone,
    mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(cleanQuery)}`,
    hasExactCoordinates: false,
    resolvedLat: null,
    resolvedLng: null
  };
};


