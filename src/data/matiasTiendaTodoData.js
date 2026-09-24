// Datos representativos, realistas y coherentes para "Matías TiendaTodo"
// Ubicación: Av. Las Palmas, Radial 17 y medio (entre 4to y 5to Anillo, Santa Cruz)
// Condominio: Condominio Las Palmas

export const MATIAS_TENANT_ID = 'matias-tiendatodo';

export const matiasSuppliers = [
  {
    id: 'sup-matias-coca-cola',
    tenant_id: 'matias-tiendatodo',
    name: 'Embol S.A. / Coca-Cola',
    contactName: 'Carlos Preventista (Radial 17 1/2)',
    phone: '77398120',
    category: 'Bebidas & Gaseosas',
    visitDays: ['Martes', 'Viernes'],
    notes: 'Pasa entre 08:30 y 10:30 AM. Pedido mínimo 3 fardos surtidos.',
    orderItems: [
      { id: 'item-cc-1', productName: 'Coca-Cola Original 2L', name: 'Coca-Cola Original 2L', quantity: '4 fardos', unit: 'Fardos x6u', status: 'pending', estimatedCost: 256.00 },
      { id: 'item-cc-2', productName: 'Agua Vital Sin Gas 2L', name: 'Agua Vital Sin Gas 2L', quantity: '3 fardos', unit: 'Fardos x6u', status: 'pending', estimatedCost: 93.60 }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sup-matias-pil',
    tenant_id: 'matias-tiendatodo',
    name: 'PIL Andina S.A.',
    contactName: 'Fernando Preventista Oficial',
    phone: '76012345',
    category: 'Lácteos & Refrigerados',
    visitDays: ['Lunes', 'Jueves'],
    notes: 'Llega los lunes y jueves temprano. Trae factura y boleta de canje.',
    orderItems: [
      { id: 'item-pil-1', productName: 'Leche Pil Entera Bolsa 1L', name: 'Leche Pil Entera Bolsa 1L', quantity: '24 bolsas', unit: 'Bolsas x1L', status: 'pending', estimatedCost: 132.00 },
      { id: 'item-pil-2', productName: 'Mantequilla con Sal Pil 200g', name: 'Mantequilla con Sal Pil 200g', quantity: '10 potes', unit: 'Panes x200g', status: 'pending', estimatedCost: 85.00 }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sup-matias-cbn',
    tenant_id: 'matias-tiendatodo',
    name: 'Cervecería Boliviana Nacional (CBN)',
    contactName: 'Roberto Ventas Zona Oeste',
    phone: '78044122',
    category: 'Bebidas & Gaseosas',
    visitDays: ['Miércoles', 'Sábado'],
    notes: 'Tener listos los envases retornables vacíos antes de las 11:00 AM.',
    orderItems: [
      { id: 'item-cbn-1', productName: 'Cerveza Paceña Pilsener Lata 440ml', name: 'Cerveza Paceña Pilsener Lata 440ml', quantity: '4 packs', unit: 'Packs x24u', status: 'pending', estimatedCost: 528.00 }
    ],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sup-matias-sofia',
    tenant_id: 'matias-tiendatodo',
    name: 'Sofía Ltda. (Carnes & Embutidos)',
    contactName: 'Patricia Ribera (Preventista)',
    phone: '71355900',
    category: 'Carnes & Embutidos',
    visitDays: ['Miércoles'],
    notes: 'Entrega en conservadora con hielo. Control de fecha de vencimiento.',
    orderItems: [
      { id: 'item-sof-1', productName: 'Chorizo Parrillero Sofia 1kg', name: 'Chorizo Parrillero Sofia 1kg', quantity: '8 paquetes', unit: 'Packs x1kg', status: 'pending', estimatedCost: 240.00 }
    ],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const matiasCreditCustomers = [
  {
    id: 'cred-matias-1',
    tenant_id: 'matias-tiendatodo',
    name: 'Ing. Carlos Mendoza',
    phone: '77215480',
    apartment: 'Torre B - Depto 402',
    condominium: 'Condominio Las Palmas',
    notes: 'Vecino de confianza de la Torre B. Paga puntualmente a fin de mes.',
    balance: 62.50,
    creditLimit: 300.00,
    credit_limit: 300.00,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-m1',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 38.00,
        concept: '2x Leche Pil 1L, 1x Maple Huevos, 5x Pan Marraqueta',
        balanceAfter: 38.00,
        items: [
          { name: 'Leche Pil 1L', quantity: 2, price: 8.00 },
          { name: 'Huevos de 2da (15u)', quantity: 1, price: 15.00 },
          { name: 'Pan Marraqueta', quantity: 7, price: 1.00 }
        ]
      },
      {
        id: 'tx-m2',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 24.50,
        concept: '1x Coca-Cola 2L, 1x Galletas Mabel\'s',
        balanceAfter: 62.50,
        items: [
          { name: 'Coca-Cola 2L', quantity: 1, price: 14.50 },
          { name: 'Galletas Mabel\'s', quantity: 1, price: 10.00 }
        ]
      }
    ]
  },
  {
    id: 'cred-matias-2',
    tenant_id: 'matias-tiendatodo',
    name: 'Sra. Carmen Villarroel',
    phone: '71049211',
    apartment: 'Torre A - Depto 105',
    condominium: 'Condominio Las Palmas',
    notes: 'Vecina de planta baja. Mandó a su sobrino por el desayuno.',
    balance: 21.00,
    creditLimit: 150.00,
    credit_limit: 150.00,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-m3',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 21.00,
        concept: '1x Yogurt Pil Frutilla 1L, 1x Mantequilla con Sal',
        balanceAfter: 21.00,
        items: [
          { name: 'Yogurt Pil Frutilla 1L', quantity: 1, price: 13.00 },
          { name: 'Mantequilla con Sal Pil 200g', quantity: 1, price: 8.00 }
        ]
      }
    ]
  },
  {
    id: 'cred-matias-3',
    tenant_id: 'matias-tiendatodo',
    name: 'Diego Flores',
    phone: '78500129',
    apartment: 'Depto 201',
    condominium: 'Edificio Vista Sol',
    notes: 'Abona por QR Simple semanalmente.',
    balance: 45.00,
    creditLimit: 200.00,
    credit_limit: 200.00,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-m4',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 45.00,
        concept: '2x Coca-Cola 2L, 2x Papas Lays Clásicas',
        balanceAfter: 45.00,
        items: [
          { name: 'Coca-Cola 2L', quantity: 2, price: 13.50 },
          { name: 'Papas Lays Clásicas', quantity: 2, price: 9.00 }
        ]
      }
    ]
  }
];

export const matiasProductRequests = [
  {
    id: 'REQ-101',
    tenant_id: 'matias-tiendatodo',
    customerName: 'Valeria Soto (Torre C - Depto 102)',
    productName: 'Leche de Almendras Sin Azúcar (Silk)',
    notes: 'Por favor si pueden traer marca Silk o Nature Heart.',
    votes: 8,
    status: 'approved',
    date: '2026-08-20'
  },
  {
    id: 'REQ-102',
    tenant_id: 'matias-tiendatodo',
    customerName: 'Felipe Correa (Torre A - Depto 504)',
    productName: 'Alimento Premium para Gatos Adultos (1.5 kg)',
    notes: 'Nos salvaría la vida cuando se acaba el fin de semana.',
    votes: 14,
    status: 'pending',
    date: '2026-08-21'
  },
  {
    id: 'REQ-103',
    tenant_id: 'matias-tiendatodo',
    customerName: 'Sra. Carmen Villarroel (Torre A - Depto 105)',
    productName: 'Café Instantáneo Descafeinado Nescafé',
    notes: 'Para las personas mayores que no podemos tomar cafeína por la noche.',
    votes: 6,
    status: 'stocked',
    date: '2026-08-22'
  }
];

// Generador de órdenes dinámicas en tiempo real para Matías TiendaTodo
export const getMatiasOrders = () => {
  const now = Date.now();
  const mins = (m) => new Date(now - m * 60 * 1000).toISOString();
  const hours = (h) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const days = (d) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'ORD-9822',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Valeria Soto',
        phone: '+591 76045122',
        condominium: 'Condominio Las Palmas',
        tower: 'Torre C',
        apartment: 'Depto 102',
        notes: 'Timbre Torre C, pagaré con billete de Bs. 100'
      },
      items: [
        { id: 'matias-tiendatodo-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.0, quantity: 2 },
        { id: 'matias-tiendatodo-prod-12', name: 'Papas Fritas Lays Clásicas', price: 7.5, quantity: 3 }
      ],
      subtotal: 48.5,
      total: 48.5,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'pending',
      payment_method: 'cash',
      paymentMethod: 'cash',
      cash_change_for: 100,
      cashChangeFor: 100,
      created_at: mins(12),
      createdAt: mins(12)
    },
    {
      id: 'ORD-9823',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Felipe Correa',
        phone: '+591 71089234',
        condominium: 'Condominio Las Palmas',
        tower: 'Torre A',
        apartment: 'Depto 504',
        notes: 'Paso a recoger en mostrador'
      },
      items: [
        { id: 'matias-tiendatodo-prod-2', name: 'Leche Pil Natural Entera 1L', price: 6.5, quantity: 2 },
        { id: 'matias-tiendatodo-prod-4', name: 'Pan Marraqueta Tradicional (x5 unidades)', price: 5.0, quantity: 1 },
        { id: 'matias-tiendatodo-prod-3', name: 'Huevos Frescos de Granja (Docena)', price: 12.0, quantity: 1 }
      ],
      subtotal: 30.0,
      total: 30.0,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'pending',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: mins(25),
      createdAt: mins(25)
    },
    {
      id: 'ORD-9821',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Camila Rojas',
        phone: '+591 71234567',
        condominium: 'Condominio Las Palmas',
        tower: 'Torre B',
        apartment: 'Depto 402',
        notes: 'Tocar el timbre 402, el ascensor está operativo.'
      },
      items: [
        { id: 'matias-tiendatodo-prod-2', name: 'Leche Pil Natural Entera 1L', price: 6.5, quantity: 2 },
        { id: 'matias-tiendatodo-prod-4', name: 'Pan Marraqueta Tradicional (x5 unidades)', price: 5.0, quantity: 2 },
        { id: 'matias-tiendatodo-prod-3', name: 'Huevos Frescos de Granja (Docena)', price: 12.0, quantity: 1 }
      ],
      subtotal: 35.0,
      total: 35.0,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      payment_method: 'cash',
      paymentMethod: 'cash',
      cash_change_for: 50.0,
      cashChangeFor: 50.0,
      status: 'preparing',
      created_at: mins(40),
      createdAt: mins(40)
    },
    {
      id: 'ORD-9824',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Ing. Carlos Mendoza',
        phone: '+591 77215480',
        condominium: 'Condominio Las Palmas',
        tower: 'Torre B',
        apartment: 'Depto 402',
        notes: 'Por favor entregar con empaque sellado'
      },
      items: [
        { id: 'matias-tiendatodo-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.0, quantity: 2 },
        { id: 'matias-tiendatodo-prod-10', name: 'Mantequilla con Sal Pil 200g', price: 10.0, quantity: 1 },
        { id: 'matias-tiendatodo-prod-2', name: 'Leche Pil Natural Entera 1L', price: 6.5, quantity: 1 }
      ],
      subtotal: 42.5,
      total: 42.5,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'preparing',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: mins(55),
      createdAt: mins(55)
    },
    {
      id: 'ORD-9820',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Ignacio Fuentes',
        phone: '+591 76543219',
        condominium: 'Condominio Las Palmas',
        tower: 'Torre A',
        apartment: 'Depto 701',
        notes: 'Dejar en conserjería si no contesto el citófono.'
      },
      items: [
        { id: 'matias-tiendatodo-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.0, quantity: 2 },
        { id: 'matias-tiendatodo-prod-12', name: 'Papas Fritas Lays Clásicas', price: 7.5, quantity: 2 }
      ],
      subtotal: 41.0,
      total: 41.0,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      payment_method: 'qr',
      paymentMethod: 'qr',
      status: 'on_the_way',
      created_at: hours(1.5),
      createdAt: hours(1.5)
    },
    {
      id: 'ORD-9819',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Matías Silva',
        phone: '+591 78877665',
        condominium: 'Edificio Vista Sol',
        tower: 'Piso 1-12',
        apartment: 'Depto 305',
        notes: 'Retiro presencial en mostrador'
      },
      items: [
        { id: 'matias-tiendatodo-prod-25', name: 'Vino Tinto Campos de Solana Malbec 750ml', price: 42.0, quantity: 1 },
        { id: 'matias-tiendatodo-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.0, quantity: 1 },
        { id: 'matias-tiendatodo-prod-13', name: 'Maple de Huevos Frescos (30 unidades)', price: 28.0, quantity: 1 }
      ],
      subtotal: 83.0,
      total: 83.0,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      payment_method: 'card',
      paymentMethod: 'card',
      status: 'delivered',
      created_at: hours(2.5),
      createdAt: hours(2.5)
    },
    {
      id: 'ORD-9818',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Sra. Carmen Villarroel',
        phone: '+591 71049211',
        condominium: 'Condominio Las Palmas',
        tower: 'Torre A',
        apartment: 'Depto 105',
        notes: 'Desayuno entregado a su sobrino'
      },
      items: [
        { id: 'matias-tiendatodo-prod-16', name: 'Yogurt Bebible Frutilla Pil 1L', price: 14.0, quantity: 1 },
        { id: 'matias-tiendatodo-prod-10', name: 'Mantequilla con Sal Pil 200g', price: 10.0, quantity: 1 }
      ],
      subtotal: 24.0,
      total: 24.0,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'delivered',
      payment_method: 'cash',
      paymentMethod: 'cash',
      created_at: hours(3.5),
      createdAt: hours(3.5)
    },
    {
      id: 'ORD-9817',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Andrés Suárez',
        phone: '+591 78512033',
        condominium: 'Barrio Central',
        tower: 'Sector Norte',
        apartment: 'Casa 14',
        notes: 'Pago QR simple verificado'
      },
      items: [
        { id: 'matias-tiendatodo-prod-6', name: 'Aceite Vegetal Fino Clásico 900ml', price: 13.5, quantity: 1 },
        { id: 'matias-tiendatodo-prod-7', name: 'Azúcar Blanca Refinada Guabirá 1kg', price: 6.5, quantity: 2 }
      ],
      subtotal: 26.5,
      total: 26.5,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'delivered',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: hours(5.0),
      createdAt: hours(5.0)
    },
    {
      id: 'ORD-9815',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Fabiola Paz',
        phone: '+591 75098112',
        condominium: 'Condominio Altos del Valle',
        tower: 'Torre 2',
        apartment: 'Depto 301',
        notes: 'Abarrotes para la semana'
      },
      items: [
        { id: 'matias-tiendatodo-prod-8', name: 'Arroz Grano de Oro Grano Largo 1kg', price: 8.5, quantity: 3 },
        { id: 'matias-tiendatodo-prod-11', name: 'Harina de Trigo 000 Blancaflor 1kg', price: 7.5, quantity: 2 },
        { id: 'matias-tiendatodo-prod-6', name: 'Aceite Vegetal Fino Clásico 900ml', price: 13.5, quantity: 1 }
      ],
      subtotal: 54.0,
      total: 54.0,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'delivered',
      payment_method: 'cash',
      paymentMethod: 'cash',
      created_at: days(1.2),
      createdAt: days(1.2)
    },
    {
      id: 'ORD-9814',
      tenant_id: 'matias-tiendatodo',
      customer: {
        name: 'Diego Flores',
        phone: '+591 78500129',
        condominium: 'Edificio Vista Sol',
        tower: 'Piso 1-12',
        apartment: 'Depto 201',
        notes: 'Transferencia confirmada'
      },
      items: [
        { id: 'matias-tiendatodo-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.0, quantity: 2 },
        { id: 'matias-tiendatodo-prod-9', name: 'Galletas Mabel’s Cremositas Vainilla', price: 4.0, quantity: 3 }
      ],
      subtotal: 38.0,
      total: 38.0,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'delivered',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: days(2.0),
      createdAt: days(2.0)
    }
  ];
};
