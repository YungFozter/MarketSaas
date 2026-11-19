import { roundMoney } from './paymentUtils.js';

export const DEFAULT_PRODUCT_IMAGE = '/products/producto-sin-imagen.png';

/**
 * Construye el payload canónico snake_case aceptado por la tabla `public.products` en Supabase.
 * Evita errores PGRST204 descartando propiedades camelCase incompatibles.
 */
export const buildSupabaseProductRecord = (productData = {}, tenantId = 'default', fallbackIndex = 0) => {
  const cleanImage = productData.image && String(productData.image).trim()
    ? String(productData.image).trim()
    : DEFAULT_PRODUCT_IMAGE;

  const prodId = productData.id ? String(productData.id) : `${tenantId}-prod-${Date.now()}-${fallbackIndex}`;
  const resolvedCode = productData.code && String(productData.code).trim()
    ? String(productData.code).trim()
    : `COD-${String(fallbackIndex + 1).padStart(3, '0')}`;

  const rawPrice = productData.price;
  const numPrice = typeof rawPrice === 'number' ? rawPrice : (parseFloat(rawPrice) || 0);
  const safePrice = roundMoney(Math.max(0, numPrice));

  const rawOrigPrice = productData.originalPrice ?? productData.original_price;
  const parsedOrig = rawOrigPrice != null && rawOrigPrice !== '' && rawOrigPrice !== 'Sin definir'
    ? (typeof rawOrigPrice === 'number' ? rawOrigPrice : parseFloat(rawOrigPrice))
    : NaN;
  const origPrice = !isNaN(parsedOrig) && parsedOrig > 0 ? roundMoney(parsedOrig) : safePrice;

  const rawCost = productData.costPrice ?? productData.cost_price;
  const costVal = rawCost !== undefined && rawCost !== null && rawCost !== '' && rawCost !== 'Sin definir'
    ? String(rawCost)
    : 'Sin definir';

  const rawStock = productData.stock;
  const stockVal = rawStock !== undefined && rawStock !== null && rawStock !== '' && rawStock !== 'Sin definir'
    ? String(rawStock)
    : 'Sin definir';

  const rawMinStock = productData.minStock ?? productData.min_stock;
  const minStockVal = rawMinStock !== undefined && rawMinStock !== null && rawMinStock !== '' && rawMinStock !== 'Sin definir'
    ? String(rawMinStock)
    : 'Sin definir';

  const isPop = Boolean(productData.isPopular ?? productData.is_popular);
  const isAct = productData.isActive !== undefined
    ? Boolean(productData.isActive)
    : (productData.is_active !== undefined ? Boolean(productData.is_active) : true);

  const record = {
    id: prodId,
    tenant_id: tenantId,
    name: productData.name?.trim() || 'Producto Sin Nombre',
    category: productData.category?.trim() || 'Sin definir',
    price: safePrice,
    original_price: origPrice,
    cost_price: costVal,
    unit: productData.unit?.trim() || 'Sin definir',
    stock: stockVal,
    min_stock: minStockVal,
    image: cleanImage,
    badge: productData.badge?.trim() || '',
    code: resolvedCode,
    description: productData.description?.trim() || 'Sin definir',
    is_popular: isPop,
    is_active: isAct,
    updated_at: new Date().toISOString()
  };

  if (productData.supplierId || productData.supplier_id) {
    record.supplier_id = String(productData.supplierId || productData.supplier_id);
  }

  return record;
};

/**
 * Busca si un código/SKU ya está asignado a otro producto distinto del que se edita.
 */
export const findDuplicateProductCode = (products = [], candidateCode = '', currentProductId = null) => {
  const clean = String(candidateCode || '').trim().toLowerCase();
  if (!clean || clean === 'sin definir') return null;

  return (products || []).find((p) => {
    if (!p || (currentProductId != null && String(p.id) === String(currentProductId))) return false;
    const pCode = String(p.code || '').trim().toLowerCase();
    return Boolean(pCode && pCode === clean);
  }) || null;
};

/**
 * Resuelve la lista activa de categorías respetando eliminaciones explícitas en `storeConfig.categories`.
 * Solo usa `baseDefaults` si el comercio nunca definió un arreglo explícito de categorías.
 */
export const resolveActiveCategories = (storeConfigCategories, products = [], baseDefaults = []) => {
  const hasExplicitList = Array.isArray(storeConfigCategories);
  const configured = hasExplicitList ? storeConfigCategories : baseDefaults;
  const fromProds = (products || [])
    .map(p => (p?.category || '').trim())
    .filter(c => c && c !== 'Sin definir' && c !== 'all');

  return Array.from(new Set([...configured, ...fromProds].map(c => String(c).trim()).filter(Boolean)));
};

/**
 * Calcula porcentaje de margen neto sobre precio de venta.
 */
export const computeMarginPercent = (price, costPrice) => {
  const numPrice = typeof price === 'number' ? price : parseFloat(price);
  const numCost = typeof costPrice === 'number' ? costPrice : parseFloat(costPrice);
  if (!Number.isFinite(numPrice) || numPrice <= 0 || !Number.isFinite(numCost)) {
    return null;
  }
  return Number((((numPrice - numCost) / numPrice) * 100).toFixed(1));
};

/**
 * Genera el objeto inicial limpio para registrar un nuevo producto sin datos ficticios inyectados.
 */
export const buildCleanNewProduct = (activeCategories = []) => ({
  name: '',
  code: '',
  category: activeCategories[0] || '',
  supplierId: '',
  supplierName: '',
  price: '',
  originalPrice: '',
  costPrice: 'Sin definir',
  stock: 'Sin definir',
  minStock: 'Sin definir',
  unit: '',
  image: DEFAULT_PRODUCT_IMAGE,
  description: '',
  badge: '',
  isPopular: false,
  isActive: true
});
