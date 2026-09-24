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
      { id: 'item-pil-1', productName: 'Leche Pil Entera Bolsa 1L', name: 'Leche Pil Entera Bolsa 1L', quantity: '24 bolsas', unit: 'Bolsas x1L', status: 'pending', estimatedCost: 132.00 },
      { id: 'item-pil-2', productName: 'Yogurt Frutilla Bebible 1L', name: 'Yogurt Frutilla Bebible 1L', quantity: '12 botellas', unit: 'Botellas x1L', status: 'pending', estimatedCost: 114.00 },
      { id: 'item-pil-3', productName: 'Mantequilla con Sal Pil 200g', name: 'Mantequilla con Sal Pil 200g', quantity: '10 panes', unit: 'Panes x200g', status: 'pending', estimatedCost: 85.00 }
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
      { id: 'item-cc-1', productName: 'Coca-Cola Original 2L Descartable', name: 'Coca-Cola Original 2L Descartable', quantity: '4 fardos', unit: 'Fardos x6u', status: 'pending', estimatedCost: 256.00 },
      { id: 'item-cc-2', productName: 'Agua Vital Sin Gas 2L', name: 'Agua Vital Sin Gas 2L', quantity: '3 fardos', unit: 'Fardos x6u', status: 'pending', estimatedCost: 93.60 },
      { id: 'item-cc-3', productName: 'Coca-Cola Personal 500ml', name: 'Coca-Cola Personal 500ml', quantity: '2 fardos', unit: 'Fardos x12u', status: 'pending', estimatedCost: 112.00 }
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
      { id: 'item-cbn-1', productName: 'Paceña Huari 710ml Retornable', name: 'Paceña Huari 710ml Retornable', quantity: '2 cajas', unit: 'Cajas x12u', status: 'pending', estimatedCost: 280.00 },
      { id: 'item-cbn-2', productName: 'Cerveza Paceña Pilsener Lata 440ml', name: 'Cerveza Paceña Pilsener Lata 440ml', quantity: '3 packs', unit: 'Packs x24u', status: 'pending', estimatedCost: 396.00 }
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
      { id: 'item-sof-1', productName: 'Nuggets de Pollo Crocantes Sofía 400g', name: 'Nuggets de Pollo Crocantes Sofía 400g', quantity: '8 paquetes', unit: 'Paquetes', status: 'pending', estimatedCost: 136.00 },
      { id: 'item-sof-2', productName: 'Chorizo Parrillero Tradicional Sofía kg', name: 'Chorizo Parrillero Tradicional Sofía kg', quantity: '5 kg', unit: 'Kilos', status: 'pending', estimatedCost: 195.00 },
      { id: 'item-sof-3', productName: 'Hamburguesas de Carne Sofía Caja 4u', name: 'Hamburguesas de Carne Sofía Caja 4u', quantity: '6 cajas', unit: 'Cajas', status: 'pending', estimatedCost: 114.00 }
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

export const getFernandoOrders = () => {
  const now = Date.now();
  const mins = (m) => new Date(now - m * 60 * 1000).toISOString();
  const hours = (h) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const days = (d) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'ORD-9601',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Andrea Claros',
        notes: 'Timbrar al Depto 204, por favor.',
        phone: '+591 76045122',
        tower: 'Torre B',
        apartment: 'Depto 204',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-2', name: 'Leche Pil Natural Entera 1L', price: 6.5, quantity: 2 },
        { id: 'minimarket-ian-prod-4', name: 'Pan Marraqueta Tradicional (x5 unidades)', price: 5, quantity: 1 },
        { id: 'minimarket-ian-prod-3', name: 'Huevos Frescos de Granja (Docena)', price: 12, quantity: 1 }
      ],
      subtotal: 30,
      total: 30,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'pending',
      payment_method: 'cash',
      paymentMethod: 'cash',
      cash_change_for: 50,
      created_at: mins(15),
      createdAt: mins(15)
    },
    {
      id: 'ORD-9602',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Rodrigo Banegas',
        notes: 'Paso a recoger en mostrador en 10 min.',
        phone: '+591 71089234',
        tower: 'Manzana 3',
        apartment: 'Casa 12',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.5, quantity: 1 },
        { id: 'minimarket-ian-prod-9', name: 'Galletas Mabel’s Cremositas Vainilla', price: 4, quantity: 2 }
      ],
      subtotal: 21.5,
      total: 21.5,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'pending',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: mins(30),
      createdAt: mins(30)
    },
    {
      id: 'ORD-9603',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Patricia Vaca',
        notes: 'Dejar en la reja delantera si el timbre no suena.',
        phone: '+591 77312450',
        tower: 'Calle 2',
        apartment: 'Casa 27',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-6', name: 'Aceite Vegetal Fino Clásico 900ml', price: 13.5, quantity: 1 },
        { id: 'minimarket-ian-prod-8', name: 'Arroz Grano de Oro Grano Largo 1kg', price: 8.5, quantity: 2 },
        { id: 'minimarket-ian-prod-7', name: 'Azúcar Blanca Refinada Guabirá 1kg', price: 6.5, quantity: 1 },
        { id: 'minimarket-ian-prod-12', name: 'Fideo Espagueti Famosa Paquete 400g', price: 4.5, quantity: 2 }
      ],
      subtotal: 46,
      total: 46,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'preparing',
      payment_method: 'cash',
      paymentMethod: 'cash',
      cash_change_for: 100,
      created_at: mins(48),
      createdAt: mins(48)
    },
    {
      id: 'ORD-9604',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Diego Morales',
        notes: 'Por favor las sodas bien frías.',
        phone: '+591 78566120',
        tower: 'Torre A',
        apartment: 'Depto 502',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.5, quantity: 2 },
        { id: 'minimarket-ian-prod-5', name: 'Agua Mineral Vital Sin Gas 2L', price: 7, quantity: 2 }
      ],
      subtotal: 41,
      total: 41,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'preparing',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: mins(70),
      createdAt: mins(70)
    },
    {
      id: 'ORD-9605',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Lic. Fernando Gutiérrez',
        notes: 'Paso a recoger en mostrador, ya voy en camino.',
        phone: '+591 72199840',
        tower: 'Manzana 4',
        apartment: 'Casa 35',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-13', name: 'Maple de Huevos Frescos (30 unidades)', price: 28, quantity: 1 },
        { id: 'minimarket-ian-prod-14', name: 'Mortadela Primavera Sofía 250g', price: 12, quantity: 1 },
        { id: 'minimarket-ian-prod-2', name: 'Leche Pil Natural Entera 1L', price: 6.5, quantity: 2 }
      ],
      subtotal: 53,
      total: 53,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'on_the_way',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: hours(2),
      createdAt: hours(2)
    },
    {
      id: 'ORD-9606',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Dra. Gabriela Soliz',
        notes: 'Entregado en portería',
        phone: '+591 71349012',
        tower: 'Torre A',
        apartment: 'Depto 301',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-2', name: 'Leche Pil Natural Entera 1L', price: 6.5, quantity: 2 },
        { id: 'minimarket-ian-prod-10', name: 'Mantequilla con Sal Pil 200g', price: 10, quantity: 1 },
        { id: 'minimarket-ian-prod-13', name: 'Maple de Huevos Frescos (30 unidades)', price: 28, quantity: 1 }
      ],
      subtotal: 41,
      total: 41,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'delivered',
      payment_method: 'cash',
      paymentMethod: 'cash',
      created_at: hours(2.5),
      createdAt: hours(2.5)
    },
    {
      id: 'ORD-9607',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Carlos Andrés Pinto',
        notes: 'Pagado por QR Simple',
        phone: '+591 77011492',
        tower: 'Manzana 2',
        apartment: 'Casa 8',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.5, quantity: 3 },
        { id: 'minimarket-ian-prod-15', name: 'Paceña Cerveza Pilsener Lata 473ml', price: 14, quantity: 3 }
      ],
      subtotal: 82.5,
      total: 82.5,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'delivered',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: hours(3.5),
      createdAt: hours(3.5)
    },
    {
      id: 'ORD-9608',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Mariana Céspedes',
        notes: 'Pedido de merienda entregado',
        phone: '+591 76322981',
        tower: 'Torre B',
        apartment: 'Depto 103',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-16', name: 'Yogurt Bebible Frutilla Pil 1L', price: 14, quantity: 2 },
        { id: 'minimarket-ian-prod-9', name: 'Galletas Mabel’s Cremositas Vainilla', price: 4, quantity: 2 },
        { id: 'minimarket-ian-prod-17', name: 'Chocolatada Chicolac Pil 200ml', price: 5, quantity: 2 }
      ],
      subtotal: 46,
      total: 46,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'delivered',
      payment_method: 'cash',
      paymentMethod: 'cash',
      created_at: hours(4.5),
      createdAt: hours(4.5)
    },
    {
      id: 'ORD-9609',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Mauricio Paz',
        notes: 'Retiro en mostrador matutino',
        phone: '+591 75098112',
        tower: 'Calle 1',
        apartment: 'Casa 19',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-24', name: 'Avena Tradicional en Hojuelas Quaker 400g', price: 9, quantity: 1 },
        { id: 'minimarket-ian-prod-2', name: 'Leche Pil Natural Entera 1L', price: 6.5, quantity: 2 },
        { id: 'minimarket-ian-prod-7', name: 'Azúcar Blanca Refinada Guabirá 1kg', price: 6.5, quantity: 1 }
      ],
      subtotal: 28.5,
      total: 28.5,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'delivered',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: hours(5.5),
      createdAt: hours(5.5)
    },
    {
      id: 'ORD-9610',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Sra. Elena Cuéllar',
        notes: 'Desayuno familiar pagado en efectivo exacto',
        phone: '+591 72033481',
        tower: 'Torre B',
        apartment: 'Depto 402',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-4', name: 'Pan Marraqueta Tradicional (x5 unidades)', price: 5, quantity: 2 },
        { id: 'minimarket-ian-prod-3', name: 'Huevos Frescos de Granja (Docena)', price: 12, quantity: 1 },
        { id: 'minimarket-ian-prod-2', name: 'Leche Pil Natural Entera 1L', price: 6.5, quantity: 2 }
      ],
      subtotal: 35,
      total: 35,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'delivery',
      deliveryType: 'delivery',
      status: 'delivered',
      payment_method: 'cash',
      paymentMethod: 'cash',
      created_at: hours(6.5),
      createdAt: hours(6.5)
    },
    {
      id: 'ORD-9611',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Lic. Javier Antelo',
        notes: 'Venta de ayer por la noche',
        phone: '+591 78512033',
        tower: 'Calle 3',
        apartment: 'Casa 40',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-25', name: 'Vino Tinto Campos de Solana Malbec 750ml', price: 42, quantity: 1 },
        { id: 'minimarket-ian-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.5, quantity: 1 }
      ],
      subtotal: 55.5,
      total: 55.5,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'delivered',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: days(1),
      createdAt: days(1)
    },
    {
      id: 'ORD-9612',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Lorena Mercado',
        notes: 'Abarrotes y limpieza entregados',
        phone: '+591 76098741',
        tower: 'Torre A',
        apartment: 'Depto 205',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-6', name: 'Aceite Vegetal Fino Clásico 900ml', price: 13.5, quantity: 1 },
        { id: 'minimarket-ian-prod-11', name: 'Harina de Trigo 000 Blancaflor 1kg', price: 7.5, quantity: 1 },
        { id: 'minimarket-ian-prod-8', name: 'Arroz Grano de Oro Grano Largo 1kg', price: 8.5, quantity: 2 },
        { id: 'minimarket-ian-prod-19', name: 'Jabón en Barra Bolívar Blanco Puro 200g', price: 5.5, quantity: 2 }
      ],
      subtotal: 49,
      total: 49,
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
      id: 'ORD-9613',
      tenant_id: 'minimarket-ian',
      customer: {
        name: 'Hernán Justiniano',
        notes: 'Transferencia QR confirmada',
        phone: '+591 77088912',
        tower: 'Manzana 1',
        apartment: 'Casa 5',
        condominium: 'Condominio Icaraí'
      },
      items: [
        { id: 'minimarket-ian-prod-1', name: 'Coca-Cola Sabor Original 2L', price: 13.5, quantity: 2 },
        { id: 'minimarket-ian-prod-9', name: 'Galletas Mabel’s Cremositas Vainilla', price: 4, quantity: 3 }
      ],
      subtotal: 39,
      total: 39,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      deliveryType: 'pickup',
      status: 'delivered',
      payment_method: 'qr',
      paymentMethod: 'qr',
      created_at: days(2),
      createdAt: days(2)
    }
  ];
};
