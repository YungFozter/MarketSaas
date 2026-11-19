import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  revertTransactionFromCustomer,
  sortCreditCustomers,
  buildCreditSummaryCsv,
  calculateCreditPaymentsInShift
} from '../utils/creditUtils.js';

test('revertTransactionFromCustomer anula un cargo erróneo y recalcula balanceAfter y saldo final', () => {
  const customer = {
    id: 'cred-1',
    name: 'Carlos Mendoza',
    balance: 45,
    transactions: [
      { id: 'tx-3', date: '2026-11-18T12:00:00Z', type: 'payment', amount: 15, concept: 'Abono', balanceAfter: 45 },
      { id: 'tx-2', date: '2026-11-17T12:00:00Z', type: 'charge', amount: 40, concept: 'Fiao erróneo', balanceAfter: 60 },
      { id: 'tx-1', date: '2026-11-16T12:00:00Z', type: 'charge', amount: 20, concept: 'Pan y leche', balanceAfter: 20 }
    ]
  };

  const res = revertTransactionFromCustomer(customer, 'tx-2');
  assert.ok(res);
  assert.equal(res.removedTx.id, 'tx-2');
  assert.equal(res.previousBalance, 45);
  assert.equal(res.newBalance, 5);
  assert.equal(res.updatedCustomer.balance, 5);
  assert.equal(res.updatedCustomer.transactions.length, 2);
  // Orden descendente recalculado: tx-3 queda con balanceAfter = 20 - 15 = 5, tx-1 con 20
  assert.equal(res.updatedCustomer.transactions[0].id, 'tx-3');
  assert.equal(res.updatedCustomer.transactions[0].balanceAfter, 5);
  assert.equal(res.updatedCustomer.transactions[1].id, 'tx-1');
  assert.equal(res.updatedCustomer.transactions[1].balanceAfter, 20);
});

test('revertTransactionFromCustomer anula un abono duplicado y restaura la deuda correctamente', () => {
  const customer = {
    id: 'cred-2',
    name: 'María Pérez',
    balance: 0,
    transactions: [
      { id: 'tx-p1', date: '2026-11-18T15:00:00Z', type: 'payment', amount: 30, concept: 'Abono doble', balanceAfter: 0 },
      { id: 'tx-c1', date: '2026-11-18T10:00:00Z', type: 'charge', amount: 30, concept: 'Víveres', balanceAfter: 30 }
    ]
  };

  const res = revertTransactionFromCustomer(customer, 'tx-p1');
  assert.ok(res);
  assert.equal(res.newBalance, 30);
  assert.equal(res.updatedCustomer.balance, 30);
  assert.equal(res.updatedCustomer.transactions.length, 1);
  assert.equal(res.updatedCustomer.transactions[0].balanceAfter, 30);
});

test('revertTransactionFromCustomer devuelve null si la transacción no existe', () => {
  const customer = { id: 'cred-3', balance: 10, transactions: [{ id: 'tx-1', type: 'charge', amount: 10 }] };
  assert.equal(revertTransactionFromCustomer(customer, 'tx-missing'), null);
});

test('sortCreditCustomers ordena correctamente por deuda, nombre y último movimiento', () => {
  const list = [
    { id: '1', name: 'Zulema', balance: 10, updatedAt: '2026-11-10T10:00:00Z', transactions: [] },
    { id: '2', name: 'Ana', balance: 85, updatedAt: '2026-11-11T10:00:00Z', transactions: [] },
    { id: '3', name: 'Bruno', balance: 0, updatedAt: '2026-11-19T10:00:00Z', transactions: [] }
  ];

  assert.deepEqual(sortCreditCustomers(list, 'highest_debt').map(c => c.id), ['2', '1', '3']);
  assert.deepEqual(sortCreditCustomers(list, 'lowest_debt').map(c => c.id), ['3', '1', '2']);
  assert.deepEqual(sortCreditCustomers(list, 'name_asc').map(c => c.id), ['2', '3', '1']);
  assert.deepEqual(sortCreditCustomers(list, 'recent').map(c => c.id), ['3', '2', '1']);
});

test('buildCreditSummaryCsv incluye BOM UTF-8 y neutraliza fórmulas CSV potencialmente peligrosas', () => {
  const csv = buildCreditSummaryCsv([
    {
      id: 'c1',
      name: '=CMD|calc',
      phone: '+59177123456',
      apartment: 'Casa 1',
      balance: 25.5,
      creditLimit: 100,
      notes: 'Nota normal',
      transactions: []
    }
  ], 'Bs.');

  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=CMD|calc"'));
  assert.ok(csv.includes('"\'+59177123456"'));
  assert.ok(csv.includes('"25.50"'));
});

test('calculateCreditPaymentsInShift separa abonos Efectivo vs QR dentro del turno y excluye cargos o turnos previos', () => {
  const openedAt = '2026-11-19T08:00:00Z';
  const customers = [
    {
      id: 'c1',
      transactions: [
        { id: 't1', type: 'payment', paymentMethod: 'cash', amount: 35.5, date: '2026-11-19T09:15:00Z' },
        { id: 't2', type: 'payment', paymentMethod: 'qr', amount: 24.5, date: '2026-11-19T10:30:00Z' },
        { id: 't3', type: 'charge', amount: 100, date: '2026-11-19T11:00:00Z' },
        { id: 't4', type: 'payment', paymentMethod: 'cash', amount: 50, date: '2026-11-18T22:00:00Z' }
      ]
    },
    {
      id: 'c2',
      transactions: [
        { id: 't5', type: 'payment', paymentMethod: 'cash', amount: 14.5, date: '2026-11-19T14:00:00Z' }
      ]
    }
  ];

  const stats = calculateCreditPaymentsInShift(customers, openedAt);
  assert.equal(stats.cashTotal, 50);
  assert.equal(stats.cashCount, 2);
  assert.equal(stats.qrTotal, 24.5);
  assert.equal(stats.qrCount, 1);
  assert.equal(stats.total, 74.5);
  assert.equal(stats.totalCount, 3);
});
