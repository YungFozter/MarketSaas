// Proveedores semilla iniciales adaptados a minimarkets y tiendas de barrio en Bolivia
export const initialSuppliers = [
  {
    id: 'sup-coca-cola',
    name: 'Embol S.A. (Coca-Cola / Fanta / Sprite / Vital)',
    contactName: 'Carlos Preventista',
    phone: '71234567',
    category: 'Bebidas & Gaseosas',
    visitDays: ['Martes', 'Viernes'],
    notes: 'Pasa temprano (8:00 a 10:00 am). Pedido mínimo 3 fardos surtidos.',
    orderItems: [
      {
        id: 'item-cc-1',
        productName: 'Coca-Cola Sabor Original 2L',
        quantity: '4 fardos (24 unidades)',
        status: 'pending',
        notes: 'Urgente, stock bajo en refrigerador'
      },
      {
        id: 'item-cc-2',
        productName: 'Coca-Cola Personal 500ml Fría',
        quantity: '2 fardos (24 unidades)',
        status: 'pending',
        notes: 'Para mostrador'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-pil-andina',
    name: 'PIL Andina S.A. (Lácteos y Bebidas)',
    contactName: 'Fernando Preventista',
    phone: '76543210',
    category: 'Lácteos & Refrigerados',
    visitDays: ['Lunes', 'Jueves'],
    notes: 'Trae factura electrónica. Pago con QR Simple o efectivo contra entrega.',
    orderItems: [
      {
        id: 'item-pil-1',
        productName: 'Leche Pil UHT Natural 1L',
        quantity: '3 cajas (36 unidades)',
        status: 'pending',
        notes: 'Rotación alta'
      },
      {
        id: 'item-pil-2',
        productName: 'Yogurt Bebible Pil Frutilla 1L',
        quantity: '1 caja (12 unidades)',
        status: 'received',
        notes: 'Recibido el último jueves'
      },
      {
        id: 'item-pil-3',
        productName: 'Mantequilla con Sal Pil 200 G',
        quantity: '10 potes',
        status: 'pending',
        notes: 'Pedir con fecha fresca'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-cbn-pacena',
    name: 'Cervecería Boliviana Nacional (CBN - Paceña / Huari / Taquiña)',
    contactName: 'Roberto Ventas',
    phone: '77889900',
    category: 'Bebidas Alcohólicas',
    visitDays: ['Jueves'],
    notes: 'Dejar cajones vacíos listos para cambio los jueves antes del mediodía.',
    orderItems: [
      {
        id: 'item-cbn-1',
        productName: 'Cerveza Paceña Pilsener Lata X 440Ml',
        quantity: '5 paquetes (60 latas)',
        status: 'pending',
        notes: 'Para fin de semana'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sup-sofia',
    name: 'Sofía Alimentos (Pollo, Embutidos y Congelados)',
    contactName: 'Mariana Preventista',
    phone: '73456789',
    category: 'Carnes & Embutidos',
    visitDays: ['Miércoles'],
    notes: 'Revisar cadena de frío al recibir. Entregar recibo firmado.',
    orderItems: [
      {
        id: 'item-sof-1',
        productName: 'Chorizo Parrillero Sofia kg',
        quantity: '10 paquetes',
        status: 'pending',
        notes: 'Churrasco fin de semana'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SUPPLIER_CATEGORIES = [
  'Bebidas & Gaseosas',
  'Lácteos & Refrigerados',
  'Abarrotes & Granos',
  'Carnes & Embutidos',
  'Panadería & Galletas',
  'Limpieza & Hogar',
  'Snacks & Golosinas',
  'Bebidas Alcohólicas',
  'Otros'
];

export const WEEK_DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];
