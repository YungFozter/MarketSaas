// Datos iniciales de demostración y normalizador para la Libreta de Créditos (Fiao Vecinal)

export const normalizeCreditCustomer = (customer) => {
  if (!customer || typeof customer !== 'object') return null;

  const rawBalance = customer.balance;
  const numBalance = typeof rawBalance === 'number' 
    ? rawBalance 
    : (parseFloat(rawBalance) || 0);

  const rawLimit = customer.creditLimit ?? customer.credit_limit;
  const numLimit = (rawLimit !== undefined && rawLimit !== null && rawLimit !== '') 
    ? (typeof rawLimit === 'number' ? rawLimit : parseFloat(rawLimit) || 0)
    : 0;

  const rawTransactions = Array.isArray(customer.transactions) 
    ? customer.transactions 
    : [];

  return {
    id: String(customer.id || `cred-${Date.now()}`),
    name: String(customer.name || 'Vecino Sin Nombre').trim(),
    phone: String(customer.phone || '').trim(),
    apartment: String(customer.apartment || customer.address || '').trim(),
    notes: String(customer.notes || '').trim(),
    balance: Math.max(0, Number(numBalance.toFixed(2))),
    creditLimit: numLimit > 0 ? Number(numLimit.toFixed(2)) : 0,
    transactions: rawTransactions.map(tx => ({
      id: String(tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`),
      date: tx.date || new Date().toISOString(),
      type: tx.type === 'payment' ? 'payment' : 'charge',
      amount: Number((parseFloat(tx.amount) || 0).toFixed(2)),
      concept: String(tx.concept || (tx.type === 'payment' ? 'Abono a cuenta' : 'Compra a crédito')).trim(),
      paymentMethod: tx.paymentMethod || 'cash',
      balanceAfter: Number((parseFloat(tx.balanceAfter) || 0).toFixed(2)),
      items: Array.isArray(tx.items) ? tx.items : []
    })),
    createdAt: customer.createdAt || customer.created_at || new Date().toISOString(),
    updatedAt: customer.updatedAt || customer.updated_at || new Date().toISOString()
  };
};

export const initialCreditCustomers = [
  {
    id: 'cred-sample-1',
    name: 'Ing. Carlos Mendoza',
    phone: '77215480',
    apartment: 'Torre B - Depto 402',
    notes: 'Vecino de confianza. Paga puntualmente cada fin de mes.',
    balance: 62.50,
    creditLimit: 300.00,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-s1',
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
        id: 'tx-s2',
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
    id: 'cred-sample-2',
    name: 'Sra. Carmen Villarroel',
    phone: '71049211',
    apartment: 'Torre A - Depto 105',
    notes: 'Mandó a su sobrino por el desayuno.',
    balance: 21.00,
    creditLimit: 150.00,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-s3',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 21.00,
        concept: '1x Yogurt Pil Frutilla 1L, 1x Mantequilla Regia',
        balanceAfter: 21.00,
        items: [
          { name: 'Yogurt Pil Frutilla 1L', quantity: 1, price: 12.00 },
          { name: 'Mantequilla Regia', quantity: 1, price: 9.00 }
        ]
      }
    ]
  },
  {
    id: 'cred-sample-3',
    name: 'Lic. Andrés Justiniano',
    phone: '78563219',
    apartment: 'Casa #14 (Cond. Los Ceibos)',
    notes: 'Cuenta saldada recientemente.',
    balance: 0.00,
    creditLimit: 500.00,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: [
      {
        id: 'tx-s4',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'charge',
        amount: 85.00,
        concept: 'Carbón vegetal, Chorizos Parrilleros y Cerveza Paceña',
        balanceAfter: 85.00
      },
      {
        id: 'tx-s5',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'payment',
        amount: 85.00,
        concept: 'Pago completo por transferencia QR',
        paymentMethod: 'qr',
        balanceAfter: 0.00
      }
    ]
  }
];
