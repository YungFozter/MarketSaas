import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSupabaseProductRecord,
  findDuplicateProductCode,
  resolveActiveCategories,
  computeMarginPercent,
  buildCleanNewProduct,
  DEFAULT_PRODUCT_IMAGE
} from '../utils/inventoryUtils.js';

test('buildSupabaseProductRecord emite exclusivamente columnas snake_case compatibles con Supabase', () => {
  const record = buildSupabaseProductRecord({
    id: 'prod-100',
    name: '  Leche Pil 1L  ',
    category: 'Lácteos',
    price: '8.5',
    originalPrice: 10,
    costPrice: 6.8,
    stock: 15,
    minStock: 4,
    unit: 'Bolsa 1L',
    code: '780111222',
    isPopular: true,
    isActive: false,
    supplierId: 'sup-1'
  }, 'tienda-prueba', 0);

  assert.equal(record.id, 'prod-100');
  assert.equal(record.tenant_id, 'tienda-prueba');
  assert.equal(record.name, 'Leche Pil 1L');
  assert.equal(record.price, 8.5);
  assert.equal(record.original_price, 10);
  assert.equal(record.cost_price, '6.8');
  assert.equal(record.min_stock, '4');
  assert.equal(record.is_popular, true);
  assert.equal(record.is_active, false);
  assert.equal(record.supplier_id, 'sup-1');

  // Ninguna columna camelCase debe ir al upsert de Supabase
  assert.equal('originalPrice' in record, false);
  assert.equal('costPrice' in record, false);
  assert.equal('minStock' in record, false);
  assert.equal('isPopular' in record, false);
  assert.equal('isActive' in record, false);
  assert.equal('supplierId' in record, false);
});

test('findDuplicateProductCode detecta códigos repetidos ignorando el producto actual', () => {
  const catalog = [
    { id: 'p1', name: 'Coca-Cola', code: '78012345' },
    { id: 'p2', name: 'Pan', code: 'COD-002' }
  ];

  assert.equal(findDuplicateProductCode(catalog, '78012345', 'p1'), null);
  assert.equal(findDuplicateProductCode(catalog, '78012345', 'p2')?.id, 'p1');
  assert.equal(findDuplicateProductCode(catalog, '  cod-002  ', null)?.id, 'p2');
  assert.equal(findDuplicateProductCode(catalog, '', null), null);
});

test('resolveActiveCategories respeta eliminación de categorías base cuando storeConfig.categories existe', () => {
  const defaults = ['Lácteos & Huevos', 'Abarrotes', 'Limpieza & Hogar'];
  // Si el dueño eliminó "Abarrotes", storeConfigCategories queda ['Lácteos & Huevos', 'Limpieza & Hogar']
  const afterDelete = resolveActiveCategories(['Lácteos & Huevos', 'Limpieza & Hogar'], [], defaults);
  assert.deepEqual(afterDelete, ['Lácteos & Huevos', 'Limpieza & Hogar']);

  // Si nunca hubo storeConfigCategories (undefined), inicializa con defaults
  const uninitialized = resolveActiveCategories(undefined, [{ category: 'Mascotas' }], defaults);
  assert.deepEqual(uninitialized, ['Lácteos & Huevos', 'Abarrotes', 'Limpieza & Hogar', 'Mascotas']);
});

test('buildCleanNewProduct inicia sin precios, costos, stock ni descripciones ficticias', () => {
  const clean = buildCleanNewProduct(['Abarrotes']);
  assert.equal(clean.name, '');
  assert.equal(clean.price, '');
  assert.equal(clean.originalPrice, '');
  assert.equal(clean.costPrice, 'Sin definir');
  assert.equal(clean.stock, 'Sin definir');
  assert.equal(clean.minStock, 'Sin definir');
  assert.equal(clean.unit, '');
  assert.equal(clean.description, '');
  assert.equal(clean.image, DEFAULT_PRODUCT_IMAGE);
  assert.equal(clean.isActive, true);
});

test('computeMarginPercent calcula margen neto y devuelve null ante datos incompletos o inválidos', () => {
  assert.equal(computeMarginPercent(10, 7), 30);
  assert.equal(computeMarginPercent(0, 5), null);
  assert.equal(computeMarginPercent(10, 'Sin definir'), null);
});
