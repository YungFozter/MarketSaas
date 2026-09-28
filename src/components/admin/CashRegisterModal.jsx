import React, { useState, useMemo, useEffect } from 'react';
import { 
  Banknote, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Plus, 
  Trash2, 
  Calculator, 
  Clock, 
  Calendar, 
  DollarSign, 
  Lock, 
  Unlock, 
  History, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getBoliviaTime } from '../../utils/scheduleUtils';
import { escapeHtml } from '../../utils/formatters';

export const CashRegisterModal = ({ isOpen, onClose }) => {
  const { orders = [], storeConfig, tenantSlug, currentUser, showToast } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';
  const tenantKey = tenantSlug || storeConfig?.id || 'default';

  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const [openingCash, setOpeningCash] = useState(100);
  const [isRegisterOpen, setIsRegisterOpen] = useState(true);
  const [registerOpenedAt, setRegisterOpenedAt] = useState(() => new Date().toISOString());
  const [expenses, setExpenses] = useState([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [physicalCashCounted, setPhysicalCashCounted] = useState('');
  const [showDenominationCalc, setShowDenominationCalc] = useState(false);
  const [closureNotes, setClosureNotes] = useState('');

  // Calculadora de Billetes Bolivianos
  const [denominations, setDenominations] = useState({
    b200: 0,
    b100: 0,
    b50: 0,
    b20: 0,
    b10: 0,
    coins: 0
  });

  // Historial de Cierres
  const [closuresHistory, setClosuresHistory] = useState([]);

  // Cargar estado guardado de la caja
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantKey}_cash_register`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isOpen !== undefined) setIsRegisterOpen(parsed.isOpen);
        if (parsed.openingCash !== undefined) setOpeningCash(Number(parsed.openingCash) || 0);
        if (parsed.openedAt) setRegisterOpenedAt(parsed.openedAt);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
      }

      const savedHistory = localStorage.getItem(`marketsaas_${tenantKey}_cash_closures`);
      if (savedHistory) {
        setClosuresHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.warn('Error cargando estado de caja:', e);
    }
  }, [isOpen, tenantKey]);

  // Guardar estado actual de caja
  const saveRegisterState = (updated) => {
    try {
      localStorage.setItem(`marketsaas_${tenantKey}_cash_register`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Calcular ventas en efectivo desde la apertura de caja
  const cashStats = useMemo(() => {
    const openedTime = new Date(registerOpenedAt).getTime();
    const validOrders = (orders || []).filter(o => {
      if (!o || o.status === 'cancelled') return false;
      const orderTime = new Date(o.createdAt || o.created_at).getTime();
      return isNaN(orderTime) ? true : orderTime >= openedTime;
    });

    let cashTotal = 0;
    let qrTotal = 0;
    let cardTotal = 0;
    let cashCount = 0;

    validOrders.forEach(o => {
      const total = Number(o.total) || 0;
      const method = (o.paymentMethod || o.payment_method || 'cash').toLowerCase();
      if (method === 'cash' || method === 'efectivo') {
        cashTotal += total;
        cashCount++;
      } else if (method === 'qr' || method === 'transfer') {
        qrTotal += total;
      } else if (method === 'card' || method === 'pos') {
        cardTotal += total;
      } else {
        cashTotal += total;
        cashCount++;
      }
    });

    const totalExpenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const expectedCashInDrawer = (Number(openingCash) || 0) + cashTotal - totalExpenses;

    return {
      cashTotal,
      qrTotal,
      cardTotal,
      cashCount,
      totalOrders: validOrders.length,
      totalExpenses,
      expectedCashInDrawer
    };
  }, [orders, registerOpenedAt, expenses, openingCash]);

  // Actualizar conteo físico cuando se usa la calculadora de billetes
  const calculatedDenominationsTotal = useMemo(() => {
    return (
      (denominations.b200 * 200) +
      (denominations.b100 * 100) +
      (denominations.b50 * 50) +
      (denominations.b20 * 20) +
      (denominations.b10 * 10) +
      (Number(denominations.coins) || 0)
    );
  }, [denominations]);

  const effectiveCounted = physicalCashCounted !== '' ? Number(physicalCashCounted) : calculatedDenominationsTotal;
  const difference = physicalCashCounted !== '' || showDenominationCalc
    ? effectiveCounted - cashStats.expectedCashInDrawer
    : 0;

  // Registrar un gasto menor
  const handleAddExpense = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(newExpenseAmount);
    if (!newExpenseDesc.trim() || isNaN(amountNum) || amountNum <= 0) {
      if (typeof showToast === 'function') showToast('Ingresa descripción y monto válido.', 'error');
      return;
    }

    const newExp = {
      id: `exp-${Date.now()}`,
      desc: newExpenseDesc.trim(),
      amount: amountNum,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextExpenses = [newExp, ...expenses];
    setExpenses(nextExpenses);
    setNewExpenseDesc('');
    setNewExpenseAmount('');
    saveRegisterState({
      isOpen: isRegisterOpen,
      openingCash,
      openedAt: registerOpenedAt,
      expenses: nextExpenses
    });

    if (typeof showToast === 'function') showToast(`Salida registrada: -${currency} ${amountNum.toFixed(2)}`, 'info');
  };

  const handleRemoveExpense = (id) => {
    const nextExpenses = expenses.filter(e => e.id !== id);
    setExpenses(nextExpenses);
    saveRegisterState({
      isOpen: isRegisterOpen,
      openingCash,
      openedAt: registerOpenedAt,
      expenses: nextExpenses
    });
  };

  // Abrir la caja con fondo inicial
  const handleOpenRegister = () => {
    const initial = parseFloat(openingCash) || 0;
    const nowIso = new Date().toISOString();
    setIsRegisterOpen(true);
    setRegisterOpenedAt(nowIso);
    setExpenses([]);
    setPhysicalCashCounted('');
    saveRegisterState({
      isOpen: true,
      openingCash: initial,
      openedAt: nowIso,
      expenses: []
    });
    if (typeof showToast === 'function') showToast(`Caja abierta con fondo inicial de ${currency} ${initial.toFixed(2)}`, 'success');
  };

  // Realizar Cierre de Caja
  const handleCloseRegister = () => {
    if (physicalCashCounted === '' && calculatedDenominationsTotal === 0) {
      if (typeof showToast === 'function') showToast('Ingresa el dinero físico contado en el cajón.', 'warning');
      return;
    }

    const closureRecord = {
      id: `closure-${Date.now()}`,
      closedAt: new Date().toISOString(),
      openedAt: registerOpenedAt,
      openingCash: Number(openingCash) || 0,
      cashSales: cashStats.cashTotal,
      cashSalesCount: cashStats.cashCount,
      qrSales: cashStats.qrTotal,
      expenses: expenses,
      totalExpenses: cashStats.totalExpenses,
      expectedCash: cashStats.expectedCashInDrawer,
      physicalCash: effectiveCounted,
      difference: difference,
      notes: closureNotes.trim(),
      user: currentUser?.email || 'Comerciante'
    };

    const nextHistory = [closureRecord, ...closuresHistory];
    setClosuresHistory(nextHistory);
    try {
      localStorage.setItem(`marketsaas_${tenantKey}_cash_closures`, JSON.stringify(nextHistory));
    } catch (e) {}

    setIsRegisterOpen(false);
    saveRegisterState({
      isOpen: false,
      openingCash: 0,
      openedAt: null,
      expenses: []
    });

    if (typeof showToast === 'function') {
      showToast('¡Cierre de caja completado y guardado!', 'success');
    }
    handlePrintClosureReceipt(closureRecord);
  };

  // Imprimir Ticket Térmico de Cierre de Caja
  const handlePrintClosureReceipt = (record) => {
    const printWindow = window.open('', '', 'width=420,height=700');
    if (!printWindow) return;

    const diffText = record.difference === 0 
      ? 'CAJA CUADRADA (0.00)' 
      : record.difference > 0 
        ? `SOBRANTE: +${currency} ${record.difference.toFixed(2)}` 
        : `FALTANTE: -${currency} ${Math.abs(record.difference).toFixed(2)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cierre de Caja - ${escapeHtml(storeConfig?.name || 'Tienda')}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 10px; color: #000; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .highlight { background: #eee; padding: 4px; font-size: 13px; }
            .signature { margin-top: 30px; border-top: 1px solid #000; width: 60%; margin-left: auto; margin-right: auto; text-align: center; padding-top: 4px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:2px 0;">${escapeHtml(storeConfig?.name || 'MARKETSAAS')}</h2>
            <p style="margin:2px 0; font-weight:bold;">COMPROBANTE DE CIERRE DE CAJA</p>
            <p style="margin:2px 0; font-size:11px;">${new Date(record.closedAt).toLocaleString('es-BO')}</p>
          </div>
          <div class="divider"></div>
          <div class="row">
            <span>Fondo Inicial:</span>
            <span>${currency} ${record.openingCash.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>(+) Ventas Efectivo (${record.cashSalesCount}):</span>
            <span class="bold">${currency} ${record.cashSales.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>(-) Salidas / Gastos (${record.expenses?.length || 0}):</span>
            <span>${currency} ${record.totalExpenses.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div class="row highlight bold">
            <span>EFECTIVO ESPERADO:</span>
            <span>${currency} ${record.expectedCash.toFixed(2)}</span>
          </div>
          <div class="row bold" style="margin-top: 4px;">
            <span>EFECTIVO CONTADO:</span>
            <span>${currency} ${record.physicalCash.toFixed(2)}</span>
          </div>
          <div class="row bold" style="color: ${record.difference < 0 ? '#b91c1c' : '#047857'}; margin-top: 4px;">
            <span>RESULTADO:</span>
            <span>${diffText}</span>
          </div>
          <div class="divider"></div>
          <div class="row" style="font-size:11px;">
            <span>Ventas QR (Banco):</span>
            <span>${currency} ${record.qrSales.toFixed(2)}</span>
          </div>
          ${record.notes ? `<div style="font-size:11px; margin-top:6px;">Nota: ${escapeHtml(record.notes)}</div>` : ''}
          <div class="signature">
            Firma Cajero / Responsable
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/25">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Arqueo y Cierre de Caja</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isRegisterOpen ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {isRegisterOpen ? 'Caja Abierta' : 'Caja Cerrada'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Control diario de dinero en efectivo, gastos del turno y cuadratura de caja.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas: Caja Actual vs Historial */}
        <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'current'
                ? 'border-emerald-600 text-emerald-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Turno Actual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-800 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Cierres ({closuresHistory.length})</span>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'current' ? (
            !isRegisterOpen ? (
              /* ESTADO 1: CAJA CERRADA -> ABRIR TURNO */
              <div className="space-y-5 py-4 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-slate-900">
                    La caja se encuentra cerrada
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Para comenzar a registrar ventas en efectivo y salidas, define el fondo inicial con el que abres el cajón hoy.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-left">
                  <label className="text-xs font-black text-slate-700 block">
                    Fondo Inicial de Cambio / Vuelto ({currency}):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      {currency}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={openingCash}
                      onChange={(e) => setOpeningCash(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 font-mono font-black text-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                      placeholder="100.00"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[50, 100, 150, 200].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setOpeningCash(val)}
                        className="flex-1 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        {currency} {val}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenRegister}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Abrir Caja y Comenzar Turno</span>
                </button>
              </div>
            ) : (
              /* ESTADO 2: CAJA ABIERTA -> MONITOREO Y ARQUEO */
              <div className="space-y-6">
                {/* 1. Bento Resumen de Efectivo Teórico */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">Fondo Inicial</span>
                    <span className="font-mono text-base sm:text-lg font-black text-slate-900 block">
                      {currency} {Number(openingCash).toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 block">(+) Ventas Efectivo</span>
                    <span className="font-mono text-base sm:text-lg font-black text-emerald-950 block">
                      {currency} {cashStats.cashTotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      {cashStats.cashCount} operaciones
                    </span>
                  </div>

                  <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 space-y-1">
                    <span className="text-[11px] font-bold text-rose-800 block">(-) Gastos / Salidas</span>
                    <span className="font-mono text-base sm:text-lg font-black text-rose-950 block">
                      {currency} {cashStats.totalExpenses.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-rose-700 font-semibold block">
                      {expenses.length} salidas
                    </span>
                  </div>

                  <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 block">Efectivo Esperado</span>
                    <span className="font-mono text-base sm:text-lg font-black text-white block">
                      {currency} {cashStats.expectedCashInDrawer.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Debe haber en cajón
                    </span>
                  </div>
                </div>

                {/* 2. Registro de Salidas / Gastos Menores */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-rose-600" />
                      <span>Registrar Gasto o Retiro de Efectivo</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      (Hielo, pan, bolsas, etc.)
                    </span>
                  </div>

                  <form onSubmit={handleAddExpense} className="flex gap-2">
                    <input
                      type="text"
                      value={newExpenseDesc}
                      onChange={(e) => setNewExpenseDesc(e.target.value)}
                      placeholder="Motivo (ej. Compra de hielo)"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                    />
                    <div className="relative w-28 sm:w-32">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {currency}
                      </span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value)}
                        placeholder="Monto"
                        className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Añadir
                    </button>
                  </form>

                  {/* Lista de gastos del turno */}
                  {expenses.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {expenses.map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between p-2 rounded-xl bg-rose-50/60 border border-rose-100 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{exp.desc}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({exp.time})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-rose-700">
                              -{currency} {Number(exp.amount).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExpense(exp.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Eliminar gasto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Arqueo: Conteo Físico Real */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <Calculator className="w-4 h-4 text-emerald-600" />
                        <span>Arqueo Físico (¿Cuánto dinero contaste en el cajón?)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Ingresa el monto total contado o desglósalo por billetes bolivianos.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDenominationCalc(prev => !prev)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      {showDenominationCalc ? 'Ocultar Desglose' : 'Desglosar Billetes'}
                    </button>
                  </div>

                  {/* Entrada directa del monto contado */}
                  {!showDenominationCalc ? (
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                        {currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={physicalCashCounted}
                        onChange={(e) => setPhysicalCashCounted(e.target.value)}
                        placeholder={cashStats.expectedCashInDrawer.toFixed(2)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 font-mono font-black text-xl text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  ) : (
                    /* Desglose por Billetes Bolivianos */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-3.5 rounded-xl border border-slate-200">
                      {[
                        { key: 'b200', val: 200, label: 'Bs. 200' },
                        { key: 'b100', val: 100, label: 'Bs. 100' },
                        { key: 'b50', val: 50, label: 'Bs. 50' },
                        { key: 'b20', val: 20, label: 'Bs. 20' },
                        { key: 'b10', val: 10, label: 'Bs. 10' }
                      ].map(b => (
                        <div key={b.key} className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">{b.label}</label>
                          <input
                            type="number"
                            min="0"
                            value={denominations[b.key] || ''}
                            onChange={(e) => setDenominations(prev => ({ ...prev, [b.key]: parseInt(e.target.value, 10) || 0 }))}
                            placeholder="0 cant."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                          />
                        </div>
                      ))}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">Monedas (Total Bs.)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={denominations.coins || ''}
                          onChange={(e) => setDenominations(prev => ({ ...prev, coins: parseFloat(e.target.value) || 0 }))}
                          placeholder="Bs. 0"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-3 pt-2 text-right text-xs font-extrabold text-slate-900 border-t border-slate-100">
                        Total Billetes y Monedas: {currency} {calculatedDenominationsTotal.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* 4. Resultado de la Cuadratura (Diferencia) */}
                  {(physicalCashCounted !== '' || showDenominationCalc) && (
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                      difference === 0 
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                        : difference > 0 
                          ? 'bg-sky-50 text-sky-950 border-sky-300'
                          : 'bg-rose-50 text-rose-950 border-rose-300'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        {difference === 0 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className={`w-5 h-5 shrink-0 ${difference > 0 ? 'text-sky-600' : 'text-rose-600'}`} />
                        )}
                        <div>
                          <span className="font-extrabold text-xs sm:text-sm block">
                            {difference === 0 
                              ? '¡Caja Cuadrada Perfecta!' 
                              : difference > 0 
                                ? 'Sobrante en Caja' 
                                : 'Faltante en Caja'}
                          </span>
                          <span className="text-xs opacity-85 block">
                            {difference === 0 
                              ? 'El dinero físico coincide con lo esperado.' 
                              : difference > 0 
                                ? 'Hay más dinero físico del que registró el sistema.' 
                                : 'Falta dinero respecto al registro del sistema.'}
                          </span>
                        </div>
                      </div>

                      <div className="font-mono text-base sm:text-lg font-black text-right shrink-0">
                        {difference > 0 ? `+${currency} ${difference.toFixed(2)}` : `${currency} ${difference.toFixed(2)}`}
                      </div>
                    </div>
                  )}

                  {/* Notas de Cierre */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Observaciones / Notas del Cierre (Opcional):
                    </label>
                    <input
                      type="text"
                      value={closureNotes}
                      onChange={(e) => setClosureNotes(e.target.value)}
                      placeholder="Ej. Se pagó adelanto a distribuidor, faltante justificado, etc."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Botón de Cierre de Caja */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    Guardar y Seguir Atendiendo
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseRegister}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Realizar Cierre de Turno e Imprimir</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            /* PESTAÑA: HISTORIAL DE CIERRES ANTERIORES */
            <div className="space-y-3">
              {closuresHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto opacity-40" />
                  <p className="font-bold text-slate-700">Aún no hay cierres de caja registrados</p>
                  <p className="text-xs">Los cierres que realices al final del turno se guardarán aquí.</p>
                </div>
              ) : (
                closuresHistory.map((cl) => (
                  <div key={cl.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900">
                          {new Date(cl.closedAt).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(cl.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${
                          cl.difference === 0 ? 'bg-emerald-100 text-emerald-800' :
                          cl.difference > 0 ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {cl.difference === 0 ? 'Cuadrada' : cl.difference > 0 ? `+${currency}${cl.difference.toFixed(2)}` : `-${currency}${Math.abs(cl.difference).toFixed(2)}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Ventas Efectivo: <strong className="text-slate-800">{currency} {cl.cashSales?.toFixed(2)}</strong> • Salidas: {currency} {cl.totalExpenses?.toFixed(2)}
                      </p>
                      {cl.notes && <p className="text-[11px] text-slate-500 italic">"{cl.notes}"</p>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePrintClosureReceipt(cl)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reimprimir</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
