import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateSplitPortions, 
  formatPaymentBreakdownText, 
  normalizeSplitPayment,
  validateSplitPayment 
} from '../utils/paymentUtils.js';
import { prepareSalesData } from '../utils/salesExportUtils.js';

test('calculateSplitPortions extrae porciones de pago combinado sin distorsión a 100% efectivo', () => {
  // Orden con desglose combinado estándar (Efectivo Bs. 20 + QR Bs. 19 = Total Bs. 39)
  const orderWithSplit = {
    id: 'POS-TEST-1',
    total: 39.0,
    paymentMethod: 'combined',
    splitPayment: {
      cash: 20.0,
      qr: 19.0,
      card: 0
    }
  };

  const portions = calculateSplitPortions(orderWithSplit);
  assert.equal(portions.cash, 20.0);
  assert.equal(portions.qr, 19.0);
  assert.equal(portions.card, 0);
  assert.equal(portions.total, 39.0);
  assert.equal(portions.isSplit, true);

  const breakdownText = formatPaymentBreakdownText(orderWithSplit, 'Bs.');
  assert.equal(breakdownText, 'Bs. 20.00 Efec. + Bs. 19.00 QR');
});

test('calculateSplitPortions recupera el desglose si splitPayment viene dentro de payment_method o customer', () => {
  // Simulación de orden proveniente de Supabase donde payment_method es objeto o split_payment está en customer
  const orderFromSupabase = {
    id: 'ORD-TEST-2',
    total: 75.0,
    payment_method: {
      method: 'combined',
      splitPayment: {
        cash: 40.0,
        qr: 35.0,
        card: 0
      }
    },
    customer: {
      name: 'Cliente Prueba',
      split_payment: {
        cash: 40.0,
        qr: 35.0,
        card: 0
      }
    }
  };

  const portions = calculateSplitPortions(orderFromSupabase);
  assert.equal(portions.cash, 40.0);
  assert.equal(portions.qr, 35.0);
  assert.equal(portions.isSplit, true);

  const breakdownText = formatPaymentBreakdownText(orderFromSupabase, 'Bs.');
  assert.equal(breakdownText, 'Bs. 40.00 Efec. + Bs. 35.00 QR');
});

test('prepareSalesData genera en la celda de Método de Pago ambos métodos seleccionados (Efectivo + QR)', () => {
  const orders = [
    {
      id: 'POS-TEST-39',
      total: 39.0,
      status: 'delivered',
      deliveryType: 'pickup',
      customer: { name: 'Cliente Mostrador' },
      items: [{ id: 'p1', name: 'Producto A', price: 39, quantity: 1 }],
      paymentMethod: 'combined',
      splitPayment: {
        cash: 20.0,
        qr: 19.0,
        card: 0
      },
      createdAt: new Date().toISOString()
    }
  ];

  const { rows, summary } = prepareSalesData(orders, (d) => d);
  assert.equal(rows.length, 1);
  const row = rows[0];

  assert.equal(row.isCombined, true);
  assert.equal(row.splitDetails, 'Bs. 20.00 Efec. + Bs. 19.00 QR');
  assert.equal(row.paymentMethod, 'Pago Combinado (Bs. 20.00 Efec. + Bs. 19.00 QR)');

  // Verificación de totales contables
  assert.equal(summary.cashTotal, '20.00');
  assert.equal(summary.qrTotal, '19.00');
  assert.equal(summary.combinedCount, 1);
  assert.equal(summary.combinedTotal, '39.00');
});

test('Pago Combinado con 3 métodos (Efectivo + QR + Tarjeta) se refleja íntegramente en la celda', () => {
  const orders = [
    {
      id: 'POS-TEST-3WAY',
      total: 150.0,
      status: 'delivered',
      deliveryType: 'pickup',
      customer: { name: 'Cliente Complejo' },
      items: [{ id: 'p1', name: 'Pack Parrillero', price: 150, quantity: 1 }],
      paymentMethod: 'combined',
      splitPayment: {
        cash: 50.0,
        qr: 70.0,
        card: 30.0
      },
      createdAt: new Date().toISOString()
    }
  ];

  const { rows, summary } = prepareSalesData(orders, (d) => d);
  assert.equal(rows[0].paymentMethod, 'Pago Combinado (Bs. 50.00 Efec. + Bs. 70.00 QR + Bs. 30.00 Tarjeta)');
  assert.equal(summary.cashTotal, '50.00');
  assert.equal(summary.qrTotal, '70.00');
  assert.equal(summary.cardTotal, '30.00');
});
