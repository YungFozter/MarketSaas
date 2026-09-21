import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Phone, 
  Home, 
  Send, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  History, 
  CreditCard, 
  Banknote, 
  QrCode, 
  X, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  FileText,
  UserCheck,
  Percent
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './CreditManager.css';

export const CreditManager = () => {
  const { 
    creditCustomers = [], 
    addCreditCustomer, 
    updateCreditCustomer, 
    deleteCreditCustomer, 
    addCustomerCharge, 
    addCustomerPayment, 
    clearCustomerBalance,
    storeConfig,
    formatBoliviaDateTime,
    showToast,
    triggerConfetti
  } = useStore();

  const currency = storeConfig?.currencySymbol || 'Bs.';
  const storeName = storeConfig?.name || 'Mi Tienda';
  const storePhone = storeConfig?.whatsapp || storeConfig?.phone || '';

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'debt' | 'clean'

  // Modales
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null); // null = nuevo
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    apartment: '',
    notes: '',
    creditLimit: '',
    initialBalance: '',
    initialConcept: ''
  });

  const [activeCustomerForHistory, setActiveCustomerForHistory] = useState(null);
  const [activeCustomerForCharge, setActiveCustomerForCharge] = useState(null);
  const [chargeForm, setChargeForm] = useState({
    amount: '',
    concept: ''
  });

  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash', // 'cash' | 'qr'
    note: ''
  });

  // Métricas Clave
  const totalDebt = useMemo(() => {
    return creditCustomers.reduce((acc, c) => acc + (c.balance || 0), 0);
  }, [creditCustomers]);

  const customersWithDebtCount = useMemo(() => {
    return creditCustomers.filter(c => (c.balance || 0) > 0).length;
  }, [creditCustomers]);

  const totalCollectedThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return creditCustomers.reduce((total, c) => {
      const txs = Array.isArray(c.transactions) ? c.transactions : [];
      const monthPayments = txs.filter(tx => {
        if (tx.type !== 'payment') return false;
        const d = new Date(tx.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      return total + monthPayments.reduce((sub, tx) => sub + (tx.amount || 0), 0);
    }, 0);
  }, [creditCustomers]);

  // Lista Filtrada
  const filteredCustomers = useMemo(() => {
    return creditCustomers.filter(c => {
      const matchSearch = 
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.apartment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm);

      if (!matchSearch) return false;

      if (filterStatus === 'debt') return (c.balance || 0) > 0;
      if (filterStatus === 'clean') return (c.balance || 0) === 0;
      return true;
    });
  }, [creditCustomers, searchTerm, filterStatus]);

  // Manejo de Formulario de Cliente
  const handleOpenNewCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      phone: '',
      apartment: '',
      notes: '',
      creditLimit: '',
      initialBalance: '',
      initialConcept: ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name || '',
      phone: customer.phone || '',
      apartment: customer.apartment || '',
      notes: customer.notes || '',
      creditLimit: customer.creditLimit ? String(customer.creditLimit) : '',
      initialBalance: '',
      initialConcept: ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      showToast('Por favor escribe el nombre del vecino.', 'warning');
      return;
    }

    if (editingCustomer) {
      updateCreditCustomer(editingCustomer.id, {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        apartment: customerForm.apartment.trim(),
        notes: customerForm.notes.trim(),
        creditLimit: parseFloat(customerForm.creditLimit) || 0
      });
    } else {
      addCreditCustomer({
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        apartment: customerForm.apartment.trim(),
        notes: customerForm.notes.trim(),
        creditLimit: parseFloat(customerForm.creditLimit) || 0,
        initialBalance: parseFloat(customerForm.initialBalance) || 0,
        initialConcept: customerForm.initialConcept.trim()
      });
    }

    setIsCustomerModalOpen(false);
  };

  // Manejo de Cargo Manual
  const handleOpenChargeModal = (customer) => {
    setActiveCustomerForCharge(customer);
    setChargeForm({ amount: '', concept: '' });
  };

  const handleConfirmCharge = (e) => {
    e.preventDefault();
    const amt = parseFloat(chargeForm.amount);
    if (!amt || amt <= 0) {
      showToast('Ingresa un monto válido mayor a 0.', 'warning');
      return;
    }

    addCustomerCharge(
      activeCustomerForCharge.id, 
      amt, 
      chargeForm.concept.trim() || 'Compra anotada a cuenta'
    );
    setActiveCustomerForCharge(null);
  };

  // Manejo de Abono / Pago
  const handleOpenPaymentModal = (customer) => {
    setActiveCustomerForPayment(customer);
    setPaymentForm({
      amount: customer.balance > 0 ? String(customer.balance) : '',
      paymentMethod: 'cash',
      note: ''
    });
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) {
      showToast('Ingresa un monto válido a abonar.', 'warning');
      return;
    }

    addCustomerPayment(
      activeCustomerForPayment.id,
      amt,
      paymentForm.paymentMethod,
      paymentForm.note.trim() || (amt >= activeCustomerForPayment.balance ? 'Liquidación total' : 'Abono parcial')
    );
    setActiveCustomerForPayment(null);
  };

  // Enviar Recordatorio Educado por WhatsApp
  const handleSendWhatsAppReminder = (customer) => {
    if (!customer.phone) {
      showToast('Este vecino no tiene número de teléfono registrado.', 'warning');
      return;
    }

    const cleanPhone = customer.phone.replace(/[^\d]/g, '');
    const phoneWithCountry = cleanPhone.length === 8 ? `591${cleanPhone}` : cleanPhone;

    // Obtener los últimos consumos que sumen la deuda
    const recentCharges = (customer.transactions || [])
      .filter(tx => tx.type === 'charge')
      .slice(0, 3)
      .map(tx => `  • ${tx.concept} (${currency} ${tx.amount.toFixed(2)})`)
      .join('\n');

    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const text = 
      `Hola *${customer.name}*! 👋 Le saludamos cordialmente de *${storeName}*.\n\n` +
      `Le compartimos el resumen de su cuenta de confianza en la tienda a la fecha:\n\n` +
      `💰 *Saldo pendiente actual:* ${currency} ${customer.balance.toFixed(2)}\n\n` +
      (recentCharges ? `📌 *Últimos consumos anotados:*\n${recentCharges}\n\n` : '') +
      `Puede pasar por el minimarket a abonar cuando guste o si prefiere pagar por QR digital, avísenos y con gusto se lo enviamos.\n\n` +
      `¡Muchísimas gracias por su confianza y preferencia de siempre! 😊`;

    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="credit-manager-container p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Libreta de Cuentas & Fiao Vecinal
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Control de créditos, compras a cuenta de vecinos y cobranza en 1 clic a WhatsApp
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenNewCustomer}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Deudor</span>
        </button>
      </div>

      {/* Tarjetas KPI de Estado de Cuentas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total por Cobrar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-600">Total por Cobrar</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {currency} {totalDebt.toFixed(2)}
          </p>
          <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
            <span>{customersWithDebtCount} {customersWithDebtCount === 1 ? 'vecino con saldo pendiente' : 'vecinos con saldo pendiente'}</span>
          </p>
        </div>

        {/* Vecinos Registrados */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600">Vecinos con Libreta</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {creditCustomers.length}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1">
            {creditCustomers.length - customersWithDebtCount} al día sin deuda
          </p>
        </div>

        {/* Total Cobrado en el Mes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Cobrado Este Mes</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {currency} {totalCollectedThisMonth.toFixed(2)}
          </p>
          <p className="text-xs text-emerald-600 font-bold mt-1">
            Recaudado en abonos y liquidaciones
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Input Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, departamento o teléfono..."
            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Filtros Píldora */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({creditCustomers.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('debt')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'debt'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            ⚠️ Con Deuda ({customersWithDebtCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('clean')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'clean'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            ✅ Al Día ({creditCustomers.length - customersWithDebtCount})
          </button>
        </div>
      </div>

      {/* Lista de Vecinos en Libreta */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-800">
            {searchTerm ? 'No se encontraron vecinos con ese filtro' : 'Aún no tienes vecinos en tu libreta de cuentas'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Registra a tus clientes habituales para anotarles compras "al fiao", registrar abonos de dinero y recordarles sus cuentas por WhatsApp de forma organizada.
          </p>
          <button
            type="button"
            onClick={handleOpenNewCustomer}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Primer Deudor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const hasDebt = (customer.balance || 0) > 0;
            const limitPercentage = customer.creditLimit > 0 
              ? Math.min(100, Math.round((customer.balance / customer.creditLimit) * 100))
              : null;

            return (
              <div 
                key={customer.id} 
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  hasDebt ? 'border-rose-200/80 hover:border-rose-300' : 'border-slate-200 hover:border-indigo-200'
                }`}
              >
                {/* Parte Superior de la Tarjeta */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug">
                        {customer.name}
                      </h3>
                      {customer.apartment && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{customer.apartment}</span>
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{customer.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Botones rápidos de editar y borrar */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCustomer(customer)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar datos"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas eliminar la cuenta de ${customer.name}?`)) {
                            deleteCreditCustomer(customer.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notas Especiales */}
                  {customer.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl italic border border-slate-100 line-clamp-2">
                      "{customer.notes}"
                    </p>
                  )}

                  {/* Saldo y Barra de Límite */}
                  <div className={`p-3 rounded-xl border ${hasDebt ? 'bg-rose-50/70 border-rose-100' : 'bg-emerald-50/70 border-emerald-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${hasDebt ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {hasDebt ? 'Saldo Pendiente' : 'Estado'}
                      </span>
                      <span className={`font-black text-base sm:text-lg ${hasDebt ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {currency} {customer.balance.toFixed(2)}
                      </span>
                    </div>

                    {/* Barra de progreso de límite de crédito */}
                    {customer.creditLimit > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                          <span>Límite de crédito: {currency} {customer.creditLimit.toFixed(2)}</span>
                          <span className={limitPercentage >= 90 ? 'text-rose-600 font-black' : ''}>{limitPercentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              limitPercentage >= 90 ? 'bg-rose-600' : limitPercentage >= 60 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${limitPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-2">
                  {/* Botón Cobrar WhatsApp */}
                  {hasDebt && customer.phone ? (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReminder(customer)}
                      className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 col-span-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Cobrar por WhatsApp</span>
                    </button>
                  ) : null}

                  {/* Botón Abonar */}
                  <button
                    type="button"
                    onClick={() => handleOpenPaymentModal(customer)}
                    className={`px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !hasDebt ? 'col-span-1' : ''
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Abonar</span>
                  </button>

                  {/* Botón Anotar Cargo / Fiao */}
                  <button
                    type="button"
                    onClick={() => handleOpenChargeModal(customer)}
                    className="px-2.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200/70 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Anotar Fiao</span>
                  </button>

                  {/* Botón Ver Libreta / Historial */}
                  <button
                    type="button"
                    onClick={() => setActiveCustomerForHistory(customer)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer col-span-2 mt-0.5"
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver libreta ({customer.transactions?.length || 0} movimientos)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO / EDITAR VECINO A CRÉDITO */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-slate-900">
                  {editingCustomer ? 'Editar Datos del Deudor' : 'Registrar Nuevo Deudor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Don Carlos Mendoza, Lic. Carla Ortiz..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ej. 77123456"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Torre / Depto / Casa
                  </label>
                  <input
                    type="text"
                    value={customerForm.apartment}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, apartment: e.target.value }))}
                    placeholder="Ej. Torre B - 402"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ¿Hasta cuánto le permites fiar? (Límite máximo en {currency} - Opcional)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={customerForm.creditLimit}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, creditLimit: e.target.value }))}
                  placeholder="Ej. 300 (déjalo vacío o en 0 si no tiene tope)"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  💡 El sistema te avisará automáticamente cuando sus compras fiadas alcancen este monto.
                </span>
              </div>

              {/* Si es nuevo deudor: Saldo pendiente anterior opcional */}
              {!editingCustomer && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2.5">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      ¿Ya te debía dinero de antes? (Deuda inicial opcional)
                    </span>
                    <p className="text-[11px] text-amber-700 leading-tight mt-0.5">
                      Si viene de tu libreta de papel o días anteriores, anota aquí lo que ya debe para que empiece con esa cuenta.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-amber-900 block mb-1">
                        Monto que ya debe ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={customerForm.initialBalance}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, initialBalance: e.target.value }))}
                        placeholder="Ej. 120.00"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 focus:outline-none focus:border-amber-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-amber-900 block mb-1">
                        Motivo o detalle (Opcional)
                      </label>
                      <input
                        type="text"
                        value={customerForm.initialConcept}
                        onChange={(e) => setCustomerForm(prev => ({ ...prev, initialConcept: e.target.value }))}
                        placeholder="Ej. Libreta vieja, víveres..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notas Especiales
                </label>
                <textarea
                  rows="2"
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ej. Paga cada quincena, cobra el sueldo los días 30..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Deudor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ANOTAR CARGO MANUAL / FIAO */}
      {/* ========================================================================= */}
      {activeCustomerForCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Anotar Compra a Cuenta
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Vecino: <strong className="text-indigo-700">{activeCustomerForCharge.name}</strong> (Saldo actual: {currency} {activeCustomerForCharge.balance.toFixed(2)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomerForCharge(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCharge} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Monto a Anotar ({currency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0.10"
                    required
                    autoFocus
                    value={chargeForm.amount}
                    onChange={(e) => setChargeForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 text-lg font-black rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Detalle de Productos / Concepto *
                </label>
                <input
                  type="text"
                  required
                  value={chargeForm.concept}
                  onChange={(e) => setChargeForm(prev => ({ ...prev, concept: e.target.value }))}
                  placeholder="Ej. 2 leches Pil, 1 maple de huevos, 5 panes..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Nuevo saldo resultante:</span>
                <span className="font-black text-rose-600 text-sm">
                  {currency} {(activeCustomerForCharge.balance + (parseFloat(chargeForm.amount) || 0)).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCustomerForCharge(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  + Anotar a su Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR ABONO / PAGO */}
      {/* ========================================================================= */}
      {activeCustomerForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Registrar Abono de Dinero
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Vecino: <strong className="text-emerald-700">{activeCustomerForPayment.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomerForPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-5 space-y-4">
              {/* Deuda Actual Destacada */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Deuda Pendiente</span>
                  <span className="text-xl font-black text-rose-400">
                    {currency} {activeCustomerForPayment.balance.toFixed(2)}
                  </span>
                </div>
                {activeCustomerForPayment.balance > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, amount: String(activeCustomerForPayment.balance) }))}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] cursor-pointer shadow-xs"
                  >
                    Saldar Total
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Monto que está Abonando ({currency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    min="0.50"
                    required
                    autoFocus
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 text-lg font-black rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Método de Cobro */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  ¿Cómo te está pagando el vecino?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'cash' }))}
                    className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentForm.paymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>En Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'qr' }))}
                    className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentForm.paymentMethod === 'qr'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-800 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-cyan-600" />
                    <span>Por QR Digital</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nota / Observación (Opcional)
                </label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Ej. Dejó 50 Bs en billete, transferido por BCP..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Saldo Restante */}
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">Saldo restante tras abono:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {currency} {Math.max(0, activeCustomerForPayment.balance - (parseFloat(paymentForm.amount) || 0)).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveCustomerForPayment(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  ✓ Confirmar Abono Recibido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HISTORIAL Y LIBRETA COMPLETA DE CUENTAS */}
      {/* ========================================================================= */}
      {activeCustomerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            {/* Header del Historial */}
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Libreta de Cuentas: {activeCustomerForHistory.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeCustomerForHistory.apartment || 'Vecino'} {activeCustomerForHistory.phone && `• Tel: ${activeCustomerForHistory.phone}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Actual</span>
                  <span className={`text-base font-black ${activeCustomerForHistory.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {currency} {activeCustomerForHistory.balance.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCustomerForHistory(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista Cronológica de Movimientos */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {(!activeCustomerForHistory.transactions || activeCustomerForHistory.transactions.length === 0) ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-xs">No hay movimientos registrados en la libreta todavía.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeCustomerForHistory.transactions.map((tx, idx) => {
                    const isCharge = tx.type === 'charge';

                    return (
                      <div
                        key={tx.id || idx}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCharge 
                            ? 'bg-rose-50/40 border-rose-100' 
                            : 'bg-emerald-50/40 border-emerald-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl shrink-0 ${isCharge ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isCharge ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          </div>

                          <div className="space-y-0.5">
                            <p className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                              {tx.concept}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                              <span>{formatBoliviaDateTime(tx.date)}</span>
                              {!isCharge && (
                                <span className="px-1.5 py-0.5 bg-white rounded border text-[10px] font-bold text-slate-600">
                                  {tx.paymentMethod === 'qr' ? 'QR' : 'Efectivo'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-black text-sm sm:text-base block ${isCharge ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {isCharge ? `+${currency} ${tx.amount.toFixed(2)}` : `-${currency} ${tx.amount.toFixed(2)}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            Saldo: {currency} {tx.balanceAfter.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveCustomerForHistory(null);
                  handleOpenChargeModal(activeCustomerForHistory);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-indigo-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Anotar Compra</span>
              </button>

              <div className="flex items-center gap-2">
                {activeCustomerForHistory.balance > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCustomerForHistory(null);
                      handleOpenPaymentModal(activeCustomerForHistory);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Abonar Dinero</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveCustomerForHistory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
