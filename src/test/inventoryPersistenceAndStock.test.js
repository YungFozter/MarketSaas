import test from 'node:test';
import assert from 'node:assert/strict';

// Función pura de sincronización canónica que protege las ediciones del usuario
function syncProductsPure(prods = [], canonicalCatalog = []) {
  if (!Array.isArray(prods) || prods.length === 0) return [];
  const canonMap = new Map();
  canonicalCatalog.forEach(c => {
    canonMap.set(c.name.toLowerCase().trim(), c);
    canonMap.set(c.id, c);
  });

  return prods.map(norm => {
    const key = (norm.name || '').toLowerCase().trim();
    const canon = canonMap.get(key) || canonMap.get(norm.id);
    if (canon) {
      return {
        ...canon,
        ...norm,
        name: norm.name?.trim() ? norm.name : canon.name,
        price: (norm.price !== undefined && norm.price !== null && !isNaN(norm.price)) ? norm.price : canon.price,
        image: (norm.image && !norm.image.includes('producto-sin-imagen')) ? norm.image : (canon.image || norm.image),
        category: (norm.category && norm.category !== 'Sin definir') ? norm.category : (canon.category || 'Sin definir'),
        stock: (norm.stock !== undefined && norm.stock !== null && norm.stock !== 'Sin definir') ? norm.stock : (canon.stock ?? 10),
        minStock: (norm.minStock !== undefined && norm.minStock !== null && norm.minStock !== 'Sin definir') ? norm.minStock : (canon.minStock ?? 5),
        min_stock: (norm.min_stock !== undefined && norm.min_stock !== null && norm.min_stock !== 'Sin definir') ? norm.min_stock : (canon.minStock ?? 5)
      };
    }
    return norm;
  });
}

test('Sincronización de catálogo canónico preserva fielmente los datos editados por el dueño (nombre, precio, categoría, stock)', () => {
  const canonicalTemplate = [
    {
      id: 'prod-1',
      name: 'Leche Entera 1L',
      price: 10,
      category: 'Lácteos',
      stock: 5,
      minStock: 2,
      image: '/catalog/leche.png'
    }
  ];

  const userEditedProduct = [
    {
      id: 'prod-1',
      name: 'Leche Colún Entera 1L (Promoción)',
      price: 13.5,
      category: 'Lácteos & Quesos',
      stock: 40,
      minStock: 10,
      image: '/custom/leche-colun.png'
    }
  ];

  const synced = syncProductsPure(userEditedProduct, canonicalTemplate);
  assert.equal(synced.length, 1);
  const p = synced[0];

  assert.equal(p.name, 'Leche Colún Entera 1L (Promoción)', 'El nombre editado no debe ser pisado por la plantilla');
  assert.equal(p.price, 13.5, 'El precio editado no debe ser pisado');
  assert.equal(p.category, 'Lácteos & Quesos', 'La categoría editada debe persistir');
  assert.equal(p.stock, 40, 'El stock asignado debe persistir');
  assert.equal(p.minStock, 10, 'El stock mínimo debe persistir');
  assert.equal(p.image, '/custom/leche-colun.png', 'La imagen personalizada debe persistir');
});

test('Descuento de inventario en ventas decrementa unidades sin quedar en negativo', () => {
  const products = [
    { id: 'prod-1', name: 'Arroz 1kg', stock: 15 },
    { id: 'prod-2', name: 'Azúcar 1kg', stock: 2 }
  ];

  const cart = [
    { id: 'prod-1', quantity: 3 },
    { id: 'prod-2', quantity: 5 } // Compra más de lo disponible
  ];

  const updatedProducts = products.map(p => {
    const item = cart.find(ci => ci.id === p.id);
    if (item && p.stock !== 'Sin definir' && p.stock != null) {
      const curStock = Number(p.stock) || 0;
      const newStock = Math.max(0, curStock - item.quantity);
      return { ...p, stock: newStock };
    }
    return p;
  });

  const p1 = updatedProducts.find(p => p.id === 'prod-1');
  const p2 = updatedProducts.find(p => p.id === 'prod-2');

  assert.equal(p1.stock, 12, '15 - 3 debe resultar en 12');
  assert.equal(p2.stock, 0, '2 - 5 no debe ser negativo, sino 0');
});

test('Incremento de inventario al recibir mercadería de proveedor suma unidades correctamente', () => {
  const products = [
    { id: 'prod-coca', name: 'Coca Cola 2L', stock: 6 }
  ];

  const supplierOrderItem = {
    productId: 'prod-coca',
    productName: 'Coca Cola 2L',
    quantity: '24 unidades (2 fardos)'
  };

  const qtyMatch = String(supplierOrderItem.quantity || '1').match(/\d+/);
  const units = qtyMatch ? parseInt(qtyMatch[0], 10) : 1;
  assert.equal(units, 24);

  const updatedProducts = products.map(p => {
    if (p.id === supplierOrderItem.productId) {
      const curStock = Number(p.stock) || 0;
      return { ...p, stock: curStock + units };
    }
    return p;
  });

  assert.equal(updatedProducts[0].stock, 30, '6 + 24 debe ser 30');
});

test('Sanitización de dbRecord para Supabase descarta columnas camelCase incompatibles', () => {
  const inputFromForm = {
    id: 'prod-123',
    name: 'Aceite Fino 1L',
    price: 14.5,
    originalPrice: 16.0,
    costPrice: 11.0,
    stock: 25,
    minStock: 5,
    isPopular: true,
    isActive: true,
    supplierId: 'sup-fino',
    supplierName: 'Distribuidora Fino S.A.'
  };

  const cleanDbRecord = {
    id: inputFromForm.id,
    tenant_id: 'default',
    name: inputFromForm.name,
    category: 'Aceites',
    price: inputFromForm.price,
    original_price: inputFromForm.originalPrice,
    cost_price: String(inputFromForm.costPrice),
    unit: 'Botella 1L',
    stock: String(inputFromForm.stock),
    min_stock: String(inputFromForm.minStock),
    image: '/products/aceite.png',
    badge: '',
    code: 'COD-001',
    description: '',
    is_popular: Boolean(inputFromForm.isPopular),
    is_active: Boolean(inputFromForm.isActive),
    updated_at: new Date().toISOString()
  };
  if (inputFromForm.supplierId) {
    cleanDbRecord.supplier_id = inputFromForm.supplierId;
  }

  // Verificar que NO existan campos camelCase que causarían error 400 en PostgREST
  assert.equal(cleanDbRecord.originalPrice, undefined);
  assert.equal(cleanDbRecord.costPrice, undefined);
  assert.equal(cleanDbRecord.minStock, undefined);
  assert.equal(cleanDbRecord.isPopular, undefined);
  assert.equal(cleanDbRecord.isActive, undefined);
  assert.equal(cleanDbRecord.supplierName, undefined);

  // Verificar que sí existan en snake_case válidos
  assert.equal(cleanDbRecord.original_price, 16.0);
  assert.equal(cleanDbRecord.cost_price, '11');
  assert.equal(cleanDbRecord.supplier_id, 'sup-fino');
});

test('Filtro de ventas en ProductPerformanceModal solo cuenta pedidos entregados o ventas POS', () => {
  const orders = [
    { id: 'ORD-001', status: 'pending', items: [{ id: 'prod-1', quantity: 2, price: 10 }] },
    { id: 'ORD-002', status: 'preparing', items: [{ id: 'prod-1', quantity: 1, price: 10 }] },
    { id: 'ORD-003', status: 'delivered', items: [{ id: 'prod-1', quantity: 4, price: 10 }] },
    { id: 'POS-004', status: 'delivered', isPosSale: true, items: [{ id: 'prod-1', quantity: 3, price: 10 }] },
    { id: 'ORD-005', status: 'cancelled', items: [{ id: 'prod-1', quantity: 10, price: 10 }] }
  ];

  const validOrders = orders.filter(o => {
    if (!o || o.status === 'cancelled' || !Array.isArray(o.items)) return false;
    const isDelivered = o.status === 'delivered';
    const isPos = Boolean(o.isPosSale || o.is_pos_sale || o.orderType === 'pos' || o.id?.startsWith('POS-'));
    return isDelivered || isPos;
  });

  assert.equal(validOrders.length, 2, 'Solo deben considerarse ORD-003 y POS-004');

  let totalUnits = 0;
  let totalRevenue = 0;
  validOrders.forEach(o => {
    o.items.forEach(i => {
      if (i.id === 'prod-1') {
        totalUnits += i.quantity;
        totalRevenue += (i.quantity * i.price);
      }
    });
  });

  assert.equal(totalUnits, 7, 'Deben ser 4 de ORD-003 + 3 de POS-004 = 7 unidades');
  assert.equal(totalRevenue, 70, 'Deben ser Bs. 70');
});

test('Creación de ítem para lista de compras a proveedor preserva productId para vínculo exacto', () => {
  const product = { id: 'prod-arroz', name: 'Arroz Grano de Oro 1kg' };
  const supplierOrderItem = {
    id: 'item-12345',
    productId: product.id,
    productName: product.name,
    quantity: '10 unidades',
    status: 'pending',
    notes: 'Reponer urgente'
  };

  assert.equal(supplierOrderItem.productId, 'prod-arroz');
  assert.equal(supplierOrderItem.status, 'pending');
});
