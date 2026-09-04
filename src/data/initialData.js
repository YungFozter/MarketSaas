// Catálogo inicial realista para tiendas de barrio, minimarkets y condominios
export const initialProducts = [
  {
    id: 'prod-1',
    code: '78012345001',
    name: 'Leche Entera Selección 1L',
    category: 'Lácteos & Huevos',
    price: 1.25,
    originalPrice: 1.45,
    costPrice: 0.85,
    stock: 24,
    minStock: 6,
    unit: 'Botella 1 Litro',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    description: 'Leche fresca entera pasteurizada, enriquecida con vitaminas A y D. Ideal para desayunos familiares.',
    badge: 'Ahorro Pack',
    isPopular: true
  },
  {
    id: 'prod-2',
    code: '78012345002',
    name: 'Huevos de Campo Grado A (Bandeja 12u)',
    category: 'Lácteos & Huevos',
    price: 3.40,
    originalPrice: 3.90,
    costPrice: 2.30,
    stock: 18,
    minStock: 5,
    unit: 'Bandeja 12 unidades',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
    description: 'Huevos frescos de gallinas libres de jaula, tamaño grande con yema dorada natural.',
    badge: 'Frescura Garantizada',
    isPopular: true
  },
  {
    id: 'prod-3',
    code: '78012345003',
    name: 'Pan Marraqueta / Francés Tradicional (1 Kg)',
    category: 'Panadería & Desayuno',
    price: 1.95,
    originalPrice: 2.20,
    costPrice: 1.10,
    stock: 35,
    minStock: 10,
    unit: 'Bolsa 1 Kg',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    description: 'Horneado dos veces al día en la panadería local del barrio. Crujiente por fuera y suave por dentro.',
    badge: 'Horneado Hoy',
    isPopular: true
  },
  {
    id: 'prod-4',
    code: '78012345004',
    name: 'Café Tostado & Molido Gourmet 250g',
    category: 'Panadería & Desayuno',
    price: 4.80,
    originalPrice: 5.50,
    costPrice: 3.20,
    stock: 12,
    minStock: 4,
    unit: 'Paquete 250g',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
    description: 'Mezcla 100% Arábica de tostado medio con notas a chocolate y avellana.',
    badge: 'Oferta Especial',
    isPopular: false
  },
  {
    id: 'prod-5',
    code: '78012345005',
    name: 'Arroz Grano Largo Selección 1 Kg',
    category: 'Abarrotes',
    price: 1.60,
    originalPrice: 1.85,
    costPrice: 1.05,
    stock: 40,
    minStock: 8,
    unit: 'Bolsa 1 Kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    description: 'Arroz de calidad extra, no se pasa y queda siempre graneado. Indispensable en la alacena.',
    badge: 'Más Vendido',
    isPopular: true
  },
  {
    id: 'prod-6',
    code: '78012345006',
    name: 'Aceite de Girasol Puro 900ml',
    category: 'Abarrotes',
    price: 2.75,
    originalPrice: 3.10,
    costPrice: 1.90,
    stock: 22,
    minStock: 6,
    unit: 'Botella 900ml',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    description: 'Aceite vegetal refinado, ideal para cocinar y freír con sabor neutro.',
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
    name: 'Plátanos / Bananas Cavendish (1 Kg)',
    category: 'Frutas & Verduras',
    price: 1.50,
    originalPrice: 1.80,
    costPrice: 0.90,
    stock: 20,
    minStock: 5,
    unit: 'Racimo aprox. 1 Kg',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    description: 'Fruta dulce y fresca, seleccionada en el punto óptimo de maduración.',
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
    name: 'Agua Vital 500 ml',
    category: 'Bebidas & Licores',
    price: 0.80,
    originalPrice: 1.00,
    costPrice: 0.45,
    stock: 36,
    minStock: 10,
    unit: 'Botella 500 ml',
    image: '/products/agua-vital.jpg',
    description: 'Agua mineral pura Vital 500 ml sin gas, hidratación fresca y pura para el día.',
    badge: 'Hidratación',
    isPopular: true
  },
  {
    id: 'prod-11',
    code: '78012345011',
    name: 'Gaseosa Cola Clásica 1.5L',
    category: 'Bebidas & Licores',
    price: 2.20,
    originalPrice: 2.50,
    costPrice: 1.40,
    stock: 28,
    minStock: 8,
    unit: 'Botella 1.5L',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    description: 'La bebida favorita para compartir en familia y reuniones.',
    badge: 'Bien Helada',
    isPopular: true
  },
  {
    id: 'prod-12',
    code: '78012345012',
    name: 'Papas Fritas Artesanales Corte Ondulado 180g',
    category: 'Snacks & Golosinas',
    price: 2.30,
    originalPrice: 2.70,
    costPrice: 1.35,
    stock: 25,
    minStock: 6,
    unit: 'Bolsa 180g',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
    description: 'Crujientes papas fritas con sal de mar, libres de grasas trans.',
    badge: 'Favorito Vecinos',
    isPopular: true
  },
  {
    id: 'prod-13',
    code: '78012345013',
    name: 'Detergente Líquido Concentrado Multiacción 1L',
    category: 'Limpieza & Hogar',
    price: 4.50,
    originalPrice: 5.20,
    costPrice: 2.90,
    stock: 14,
    minStock: 4,
    unit: 'Botella 1L (25 Lavados)',
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80',
    description: 'Remueve manchas difíciles y deja un aroma a brisa floral duradero.',
    badge: 'Máximo Ahorro',
    isPopular: false
  },
  {
    id: 'prod-14',
    code: '78012345014',
    name: 'Papel Higiénico Doble Hoja Suave (Pack 4 Rollos)',
    category: 'Limpieza & Hogar',
    price: 2.80,
    originalPrice: 3.20,
    costPrice: 1.75,
    stock: 32,
    minStock: 8,
    unit: 'Pack 4 rollos x 30m',
    image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&auto=format&fit=crop&q=80',
    description: 'Máxima suavidad y absorción con tecnología acolchada.',
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
