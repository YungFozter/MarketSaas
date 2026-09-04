// Catálogo inicial realista para tiendas de barrio, minimarkets y condominios
export const initialProducts = [
  {
    id: 'prod-1',
    code: '78012345001',
    name: 'Pil Leche Fresca Natural 946 ml',
    category: 'Lácteos & Huevos',
    price: 8.00,
    originalPrice: 8.50,
    costPrice: 6.50,
    stock: 24,
    minStock: 6,
    unit: 'Bolsa 946 ml',
    image: '/products/leche-pil.png',
    description: 'Leche fluida ultrapasteurizada y homogeneizada Pil, con 2.7% de materia grasa natural. Nutritiva y fresca, ideal para el desayuno familiar y recetas diarias.',
    badge: 'Ahorro Pack',
    isPopular: true
  },
  {
    id: 'prod-2',
    code: '78012345002',
    name: 'Huevos de 2da (Medio Maple 12u)',
    category: 'Lácteos & Huevos',
    price: 15.00,
    originalPrice: 16.50,
    costPrice: 11.50,
    stock: 18,
    minStock: 5,
    unit: 'Medio Maple 12 unidades',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
    description: 'Huevos frescos seleccionados de granja, tamaño mediano con yema dorada natural garantizada.',
    badge: 'Frescura Garantizada',
    isPopular: true
  },
  {
    id: 'prod-3',
    code: '78012345003',
    name: 'Pan Marraqueta',
    category: 'Panadería & Desayuno',
    price: 1.00,
    originalPrice: 1.50,
    costPrice: 0.60,
    stock: 50,
    minStock: 10,
    unit: 'Por Unidad',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    description: 'Pan marraqueta tradicional crujiente y caliente, horneado dos veces al día. Miga suave y esponjosa con corteza dorada perfecta para el desayuno y la merienda.',
    badge: 'Horneado Hoy',
    isPopular: true
  },
  {
    id: 'prod-4',
    code: '78012345004',
    name: 'Café Nescafé',
    category: 'Panadería & Desayuno',
    price: 90.00,
    originalPrice: 90.00,
    costPrice: 72.00,
    stock: 12,
    minStock: 4,
    unit: 'Frasco',
    image: '/products/cafe-nescafe-160g.png',
    description: 'Disfrutá de un café instantáneo de sabor intenso y aroma envolvente. Presentación: frasco de 160 gramos con tapa roja práctico y fácil de abrir.',
    badge: 'Favorito Vecinos',
    isPopular: false
  },
  {
    id: 'prod-5',
    code: '78012345005',
    name: 'Arroz Grano Largo Selección 1 Kg',
    category: 'Abarrotes',
    price: 13.00,
    originalPrice: 14.50,
    costPrice: 9.50,
    stock: 40,
    minStock: 8,
    unit: 'Bolsa 1 Kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    description: 'Arroz de grano largo seleccionado de máxima calidad. No se pega y tampoco se rompe durante la cocción. Perfecto para un arroz suelto, graneado y delicioso en todas tus comidas diarias.',
    badge: 'Más Vendido',
    isPopular: true
  },
  {
    id: 'prod-6',
    code: '78012345006',
    name: 'Aceite Fino Girasol 1800ml',
    category: 'Abarrotes',
    price: 36.00,
    originalPrice: 36.00,
    costPrice: 29.00,
    stock: 22,
    minStock: 6,
    unit: 'Botella',
    image: '/products/aceite-fino-1800ml.png',
    description: 'Aceite 100% puro de girasol Fino en rendidora botella de 1800 ml. Libre de colesterol, con sabor suave y neutro ideal para freír, saltear y cuidar la salud de tu familia.',
    badge: 'Precio Bajo',
    isPopular: true
  },
  {
    id: 'prod-7',
    code: '78012345007',
    name: 'Fideos Lazzaroni Cortos 1 Kg',
    category: 'Abarrotes',
    price: 1.15,
    originalPrice: 1.30,
    costPrice: 0.70,
    stock: 30,
    minStock: 8,
    unit: 'Bolsa 1 Kg',
    image: '/products/fideos-lazzaroni.png',
    description: 'Pasta corta de sémola de trigo seleccionada Lazzaroni, ideal para sopas y guisos.',
    badge: 'Básico Diario',
    isPopular: false
  },
  {
    id: 'prod-8',
    code: '78012345008',
    name: 'Plátanos / Bananas Verde-Maduro (Docena)',
    category: 'Frutas & Verduras',
    price: 15.00,
    originalPrice: 15.00,
    costPrice: 10.00,
    stock: 20,
    minStock: 5,
    unit: '1/2 docena',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    description: 'Plátanos seleccionados en punto óptimo verde-maduro. Elegidos cuidadosamente para una satisfacción total del cliente, dulces, frescos y llenos de energía natural.',
    badge: 'Fruta Fresca',
    isPopular: true
  },
  {
    id: 'prod-9',
    code: '78012345009',
    name: 'Tomates Larga Vida Frescos (1 Kg)',
    category: 'Frutas & Verduras',
    price: 2.10,
    originalPrice: 2.50,
    costPrice: 1.30,
    stock: 15,
    minStock: 4,
    unit: 'Bolsa 1 Kg',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    description: 'Tomates jugosos ideales para ensaladas frescas o salsas caseras.',
    badge: 'Directo del Campo',
    isPopular: false
  },
  {
    id: 'prod-10',
    code: '78012345010',
    name: 'Agua Vital sin Gas 600 ml',
    category: 'Bebidas & Licores',
    price: 0.80,
    originalPrice: 1.00,
    costPrice: 0.45,
    stock: 36,
    minStock: 10,
    unit: 'Botella 600 ml',
    image: '/products/agua-vital-600ml.png',
    description: 'Agua purificada de mesa Vital sin gas en botella de 600 ml. Hidratación pura, ligera y refrescante para cualquier momento del día.',
    badge: 'Hidratación',
    isPopular: true
  },
  {
    id: 'prod-11',
    code: '78012345011',
    name: 'Soda Coca-Cola 2 L',
    category: 'Bebidas & Licores',
    price: 2.50,
    originalPrice: 2.80,
    costPrice: 1.70,
    stock: 28,
    minStock: 8,
    unit: 'Botella 2L',
    image: '/products/coca-cola-2l.png',
    description: 'Bebida gaseosa Coca-Cola Sabor Original en botella familiar de 2 Litros. El refresco ideal para acompañar tus comidas y compartir en familia.',
    badge: 'Bien Helada',
    isPopular: true
  },
  {
    id: 'prod-12',
    code: '78012345012',
    name: 'Papas Lays Clásicas Bolsa Pequeña',
    category: 'Snacks & Golosinas',
    price: 1.50,
    originalPrice: 1.80,
    costPrice: 0.95,
    stock: 25,
    minStock: 6,
    unit: 'Bolsa 70g',
    image: '/products/lays-clasicas.png',
    description: 'Papas fritas Lay\'s Clásicas crocantes con el toque justo de sal en práctica bolsa de 70g. El snack perfecto para disfrutar a cualquier hora.',
    badge: 'Favorito Vecinos',
    isPopular: true
  },
  {
    id: 'prod-13',
    code: '78012345013',
    name: 'Detergente Omo Limon Con Jabón 1.8K',
    category: 'Limpieza & Hogar',
    price: 4.90,
    originalPrice: 5.60,
    costPrice: 3.20,
    stock: 14,
    minStock: 4,
    unit: 'Bolsa 1.8 Kg',
    image: '/products/omo-limon-1.8k.png',
    description: 'Detergente en polvo Omo Limón con bicarbonato y fórmula con el poder del jabón en bolsa de 1.8 kg. Remueve las manchas más difíciles en el primer lavado dejando un aroma fresco.',
    badge: 'Máximo Ahorro',
    isPopular: false
  },
  {
    id: 'prod-14',
    code: '78012345014',
    name: 'Nacional Selecto Papel Higienico Th 3D X 6 Unidades',
    category: 'Limpieza & Hogar',
    price: 3.50,
    originalPrice: 4.00,
    costPrice: 2.20,
    stock: 32,
    minStock: 8,
    unit: 'Pack 6 rollos x 30m',
    image: '/products/papel-nacional-selecto-6u.jpg',
    description: 'Papel higiénico Nacional Selecto Triple Hoja con tecnología 3D acolchonada en pack de 6 unidades x 30 metros. Máxima suavidad, resistencia y rendimiento para el hogar.',
    badge: 'Básico del Hogar',
    isPopular: true
  }
];

export const initialCategories = [
  { id: 'all', name: 'Todos', icon: 'Sparkles', count: 14 },
  { id: 'Lácteos & Huevos', name: 'Lácteos & Huevos', icon: 'Milk', count: 2 },
  { id: 'Panadería & Desayuno', name: 'Panadería & Café', icon: 'Croissant', count: 2 },
  { id: 'Abarrotes', name: 'Abarrotes', icon: 'Package', count: 3 },
  { id: 'Frutas & Verduras', name: 'Frutas & Verduras', icon: 'Apple', count: 2 },
  { id: 'Bebidas & Licores', name: 'Bebidas & Jugos', icon: 'Coffee', count: 2 },
  { id: 'Snacks & Golosinas', name: 'Snacks & Antojos', icon: 'Cookie', count: 1 },
  { id: 'Limpieza & Hogar', name: 'Limpieza & Hogar', icon: 'Sparkle', count: 2 }
];

export const presetBanners = [
  { id: 'b1', name: 'Minimarket & Abarrotes Frescos', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80' },
  { id: 'b2', name: 'Supermercado & Granel', url: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=1200&auto=format&fit=crop&q=80' },
  { id: 'b3', name: 'Panadería & Desayunos Tradicionales', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80' },
  { id: 'b4', name: 'Frutas & Verduras del Día', url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=1200&auto=format&fit=crop&q=80' },
  { id: 'b5', name: 'Bebidas, Licores & Snacks', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80' }
];

export const initialStoreConfig = {
  name: 'Minimarket Saas',
  tagline: 'Tu tienda de confianza a pasos de tu puerta',
  address: 'Calle Los Sauces #420 (Junto al acceso principal)',
  themeColor: 'emerald', // 'emerald' | 'teal' | 'indigo' | 'rose' | 'amber' | 'purple'
  currencySymbol: 'Bs.',
  adminEmail: 'admin@tienda.com',
  adminPassword: 'admin',
  logoUrl: '',
  bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  qrImageUrl: '',
  condominiums: [
    { id: 'c1', name: 'Condominio Las Palmas', towers: ['Torre A', 'Torre B', 'Torre C', 'Casas 1-50'], deliveryFee: 0.00, estTime: '10-15 min' },
    { id: 'c2', name: 'Condominio Altos del Valle', towers: ['Torre 1', 'Torre 2', 'Torre 3'], deliveryFee: 0.00, estTime: '12-18 min' },
    { id: 'c3', name: 'Edificio Vista Sol', towers: ['Piso 1-12'], deliveryFee: 0.00, estTime: '8-12 min' },
    { id: 'c4', name: 'Barrio Central (Casas)', towers: ['Sector Norte', 'Sector Sur'], deliveryFee: 0.00, estTime: '15-20 min' }
  ],
  categories: [
    'Lácteos & Huevos',
    'Panadería & Desayuno',
    'Abarrotes',
    'Frutas & Verduras',
    'Bebidas & Licores',
    'Snacks & Golosinas',
    'Limpieza & Hogar'
  ],
  coupons: [
    { id: 'coup-1', code: 'VECINO10', discount: 10.00, minSubtotal: 50.00, description: 'Descuento 10 Bs. para vecinos en compras mayores a 50 Bs.' }
  ],
  defaultDeliveryFee: 0.00,
  freeDeliveryThreshold: 80.00,
  phone: '+591 72125280',
  whatsapp: '59172125280',
  schedule: 'Lunes a Domingo: 08:00 AM - 10:30 PM',
  isOpen: true,
  enableDelivery: false,
  enablePoints: true,
  pointsRatio: 10, // 10 puntos por cada 1 Bs. gastado
  paymentMethods: [
    { id: 'cash', name: 'Efectivo contra entrega', desc: 'Indica con cuánto pagarás para tu vuelto', icon: 'Banknote', enabled: true },
    { id: 'qr', name: 'Transferencia / QR Digital', desc: 'Pago rápido directo al código QR de la tienda', icon: 'QrCode', enabled: true },
    { id: 'card', name: 'Tarjeta (POS Móvil)', desc: 'Llevamos el lector de tarjeta a tu puerta', icon: 'CreditCard', enabled: true }
  ],
  bankDetails: {
    bank: 'Banco Unión / Billetera Simple QR',
    accountNumber: '1000-2495-8120',
    holder: 'Minimarket Saas S.R.L.',
    aliasQR: 'MINIMARKET-SAAS.PAGO'
  }
};

export const initialOrders = [
  {
    id: 'ORD-9821',
    customer: {
      name: 'Camila Rojas',
      phone: '+56 9 7123 4567',
      condominium: 'Condominio Las Palmas',
      tower: 'Torre B',
      apartment: 'Depto 402',
      notes: 'Tocar el timbre 402, el ascensor está operativo.'
    },
    items: [
      { id: 'prod-1', name: 'Leche Entera Selección 1L', quantity: 2, price: 1.25 },
      { id: 'prod-3', name: 'Pan Marraqueta Tradicional (1 Kg)', quantity: 1, price: 1.95 },
      { id: 'prod-2', name: 'Huevos de Campo Grado A', quantity: 1, price: 3.40 }
    ],
    subtotal: 7.85,
    deliveryFee: 1.00,
    discount: 0.00,
    total: 8.85,
    deliveryType: 'delivery', // 'delivery' | 'pickup'
    paymentMethod: 'cash',
    cashChangeFor: 10.00,
    status: 'preparing', // 'pending' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled'
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    pointsEarned: 78
  },
  {
    id: 'ORD-9820',
    customer: {
      name: 'Ignacio Fuentes',
      phone: '+56 9 6543 2198',
      condominium: 'Condominio Las Palmas',
      tower: 'Torre A',
      apartment: 'Depto 701',
      notes: 'Dejar en conserjería si no contesto el citófono.'
    },
    items: [
      { id: 'prod-11', name: 'Gaseosa Cola Clásica 1.5L', quantity: 2, price: 2.20 },
      { id: 'prod-12', name: 'Papas Fritas Artesanales 180g', quantity: 2, price: 2.30 }
    ],
    subtotal: 9.00,
    deliveryFee: 1.00,
    discount: 1.00,
    total: 9.00,
    deliveryType: 'delivery',
    paymentMethod: 'qr',
    status: 'on_the_way',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    pointsEarned: 90
  },
  {
    id: 'ORD-9819',
    customer: {
      name: 'Matías Silva',
      phone: '+56 9 8877 6655',
      condominium: 'Edificio Vista Sol',
      tower: 'Piso 1-12',
      apartment: 'Depto 305',
      notes: 'Paso a retirar en 5 minutos'
    },
    items: [
      { id: 'prod-4', name: 'Café Tostado Gourmet 250g', quantity: 1, price: 4.80 }
    ],
    subtotal: 4.80,
    deliveryFee: 0.00,
    discount: 0.00,
    total: 4.80,
    deliveryType: 'pickup',
    paymentMethod: 'card',
    status: 'delivered',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    pointsEarned: 48
  }
];

export const initialProductRequests = [
  {
    id: 'REQ-101',
    customerName: 'Valeria Soto (Torre C - Depto 102)',
    productName: 'Leche de Almendras Sin Azúcar',
    notes: 'Por favor si pueden traer marca Silk o Nature Heart.',
    votes: 8,
    status: 'approved', // 'pending' | 'approved' | 'stocked'
    date: '2026-08-20'
  },
  {
    id: 'REQ-102',
    customerName: 'Felipe Correa (Torre A - Depto 504)',
    productName: 'Alimento Premium para Gatos Adultos (1.5 kg)',
    notes: 'Nos salvaría la vida cuando se acaba el fin de semana.',
    votes: 14,
    status: 'pending',
    date: '2026-08-21'
  }
];
