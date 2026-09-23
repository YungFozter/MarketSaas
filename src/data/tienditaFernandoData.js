// Datos representativos, realistas y coherentes para "Tiendita Fernando"
// Ubicación: Condominio Icaraí, Calle 3 - Casa 43 (Radial 17 y medio al 5to Anillo, Santa Cruz)
// Diseñado para demostración comercial completa a dueños de tiendas de barrio y minimarkets.

export const FERNANDO_TENANT_ID = 'minimarket-ian';

export const fernandoSuppliers = [
  {
    id: 'sup-fernando-pil',
    tenant_id: 'minimarket-ian',
    name: 'Pil Andina S.A.',
    contactName: 'Lic. Marco Arteaga (Preventista Oficial)',
    phone: '76012345',
    category: 'Lácteos & Refrigerados',
    visitDays: ['Lunes', 'Jueves'],
    notes: 'Llega entre 08:30 y 10:00 AM. Traer factura con NIT y boleta de canje de productos próximos a vencer.',
    orderItems: [
      { id: 'item-pil-1', name: 'Leche Pil Entera Bolsa 1L', quantity: 24, unit: 'Bolsas x1L', estimatedCost: 132.00 },
      { id: 'item-pil-2', name: 'Yogurt Frutilla Bebible 1L', quantity: 12, unit: 'Botellas x1L', estimatedCost: 114.00 },
      { id: 'item-pil-3', name: 'Mantequilla con Sal Pil 200g', quantity: 10, unit: 'Panes x200g', estimatedCost: 85.00 }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sup-fernando-coca-cola',
    tenant_id: 'minimarket-ian',
    name: 'Embol S.A. / Coca-Cola',
    contactName: 'Carlos Banegas (Preventista Radial 17 1/2)',
    phone: '77398120',
    category: 'Bebidas & Gaseosas',
    visitDays: ['Miércoles', 'Viernes'],
    notes: 'Tomar pedido hasta las 18:00 del día anterior. Camión repartidor entrega al mediodía. Pedir afiches para heladera.',
    orderItems: [
      { id: 'item-cc-1', name: 'Coca-Cola Original 2L Descartable', quantity: 4, unit: 'Fardos x6u', estimatedCost: 256.00 },
      { id: 'item-cc-2', name: 'Agua Vital Sin Gas 2L', quantity: 3, unit: 'Fardos x6u', estimatedCost: 93.60 },
      { id: 'item-cc-3', name: 'Coca-Cola Personal 500ml', quantity: 2, unit: 'Fardos x12u', estimatedCost: 112.00 }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sup-fernando-cbn',
    tenant_id: 'minimarket-ian',
    name: 'Cervecería Boliviana Nacional (CBN)',
    contactName: 'Ing. Jorge Aguilera (Preventista Canal Tradicional)',
    phone: '78044122',
    category: 'Bebidas & Gaseosas',
    visitDays: ['Miércoles', 'Sábado'],
    notes: 'Recepción de envases retornables vacíos obligatoria para recambio. Pago por transferencia QR o cheque.',
    orderItems: [
      { id: 'item-cbn-1', name: 'Paceña Huari 710ml Retornable', quantity: 2, unit: 'Cajas x12u', estimatedCost: 280.00 },
      { id: 'item-cbn-2', name: 'Cerveza Paceña Pilsener Lata 440ml', quantity: 3, unit: 'Packs x24u', estimatedCost: 396.00 }
    ],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'sup-fernando-sofia',
    tenant_id: 'minimarket-ian',
    name: 'Sofía Ltda. (Embutidos & Congelados)',
    contactName: 'Patricia Ribera (Preventista Zona Sur)',
    phone: '71355900',
    category: 'Carnes & Embutidos',
    visitDays: ['Martes', 'Viernes'],
    notes: 'Revisar cadena de frío al descargar directo al congelador vertical. Promoción de 1 pack gratis por 10 cajas de hamburguesas.',
    orderItems: [
      { id: 'item-sof-1', name: 'Nuggets de Pollo Crocantes Sofía 400g', quantity: 8, unit: 'Paquetes', estimatedCost: 136.00 },
      { id: 'item-sof-2', name: 'Chorizo Parrillero Tradicional Sofía kg', quantity: 5, unit: 'Kilos', estimatedCost: 195.00 },
      { id: 'item-sof-3', name: 'Hamburguesas de Carne Sofía Caja 4u', quantity: 6, unit: 'Cajas', estimatedCost: 114.00 }
    ],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const fernandoCreditCustomers = [
  {
    id: 'cred-fernando-1',
    name: 'Don Rolando Justiniano',
    phone: '77019842',
    apartment: 'Condominio Icaraí - Casa 14',
    notes: 'Vecino fundador del condominio. Paga sagradamente cada quincena. Muy buena paga.',
    balance: 145.00,
    creditLimit: 350.00,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    transactions: [
      {
        id: 'tx-f1-1',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 85.00,
        concept: 'Compra familiar de fin de semana',
        paymentMethod: 'cash',
        balanceAfter: 85.00,
        items: [
          { name: 'Aceite Fino 900ml', quantity: 1, price: 13.50 },
          { name: 'Arroz Grano de Oro 1kg', quantity: 2, price: 8.50 },
          { name: 'Chorizo Parrillero kg', quantity: 1, price: 49.90 },
          { name: 'Pan Marraqueta x5', quantity: 1, price: 4.60 }
        ]
      },
      {
        id: 'tx-f1-2',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 60.00,
        concept: 'Desayuno y merienda mandó a su nieta',
        paymentMethod: 'cash',
        balanceAfter: 145.00,
        items: [
          { name: 'Leche Pil Entera 1L', quantity: 3, price: 6.50 },
          { name: 'Huevos de Granja (Docena)', quantity: 2, price: 12.00 },
          { name: 'Galletas Mabel\'s Cremositas', quantity: 2, price: 4.00 },
          { name: 'Queso Criollo 500g', quantity: 1, price: 8.50 }
        ]
      }
    ]
  },
  {
    id: 'cred-fernando-2',
    name: 'Sra. Claudia Méndez',
    phone: '71234901',
    apartment: 'Torre B - Depto 301',
    notes: 'Mamá de familia. Pide que le anoten el pan y la leche diaria de sus hijos.',
    balance: 82.50,
    creditLimit: 200.00,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    transactions: [
      {
        id: 'tx-f2-1',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 45.00,
        concept: 'Desayunos de la semana escolar',
        paymentMethod: 'cash',
        balanceAfter: 45.00,
        items: [
          { name: 'Leche Pil Entera 1L', quantity: 4, price: 6.50 },
          { name: 'Pan Marraqueta x5', quantity: 3, price: 5.00 },
          { name: 'Mantequilla Pil 200g', quantity: 1, price: 4.00 }
        ]
      },
      {
        id: 'tx-f2-2',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 37.50,
        concept: 'Yogurts y cereales merienda',
        paymentMethod: 'cash',
        balanceAfter: 82.50,
        items: [
          { name: 'Yogurt Frutado Fresa 1L', quantity: 2, price: 15.00 },
          { name: 'Avena Quaker 400g', quantity: 1, price: 7.50 }
        ]
      }
    ]
  },
  {
    id: 'cred-fernando-3',
    name: 'Ing. Gary Suárez',
    phone: '78055419',
    apartment: 'Condominio Icaraí - Casa 8',
    notes: 'Vecino del frente. Paga por transferencia QR cada vez que llega a Bs. 200.',
    balance: 210.00,
    creditLimit: 400.00,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    transactions: [
      {
        id: 'tx-f3-1',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 125.00,
        concept: 'Churrasco domingo: Carbón, sodas y carne',
        paymentMethod: 'cash',
        balanceAfter: 125.00,
        items: [
          { name: 'Carbón Curupau 4kg', quantity: 2, price: 29.00 },
          { name: 'Coca-Cola Original 2L', quantity: 3, price: 13.50 },
          { name: 'Hamburguesas Sofía Caja 4u', quantity: 1, price: 26.50 }
        ]
      },
      {
        id: 'tx-f3-2',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 85.00,
        concept: 'Cervezas y piqueos reunión de amigos',
        paymentMethod: 'cash',
        balanceAfter: 210.00,
        items: [
          { name: 'Paceña Huari 710ml', quantity: 4, price: 18.00 },
          { name: 'Papas Lays Clásicas', quantity: 2, price: 6.50 }
        ]
      }
    ]
  },
  {
    id: 'cred-fernando-4',
    name: 'Dra. Valeria Pinto',
    phone: '76399120',
    apartment: 'Torre A - Depto 102',
    notes: 'Excelente clienta. Cuenta saldada en su totalidad por QR hace 2 días.',
    balance: 0.00,
    creditLimit: 300.00,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    transactions: [
      {
        id: 'tx-f4-1',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 95.00,
        concept: 'Víveres y productos de despensa semanal',
        paymentMethod: 'cash',
        balanceAfter: 95.00
      },
      {
        id: 'tx-f4-2',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'payment',
        amount: 95.00,
        concept: 'Pago total por Transferencia QR Simple Banco Unión',
        paymentMethod: 'qr',
        balanceAfter: 0.00
      }
    ]
  }
];

export const getFernandoCriticalProducts = () => [
  { id: 'minimarket-ian-prod-2', name: 'Leche Pil Natural Entera 1L', stock: 2, minStock: 6 },
  { id: 'minimarket-ian-prod-3', name: 'Huevos Frescos de Granja (Docena)', stock: 3, minStock: 8 },
  { id: 'minimarket-ian-prod-4', name: 'Pan Marraqueta Tradicional (x5 unidades)', stock: 4, minStock: 10 },
  { id: 'minimarket-ian-prod-6', name: 'Aceite Vegetal Fino Clásico 900ml', stock: 1, minStock: 5 }
];
