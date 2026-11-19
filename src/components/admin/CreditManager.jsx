import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Phone,
  Home,
  Send,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  History,
  Banknote,
  UserCheck,
  Lock
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { roundMoney } from '../../utils/paymentUtils';
import { CustomerFormModal } from './credits/CustomerFormModal';
import { ChargeModal } from './credits/ChargeModal';
import { PaymentModal } from './credits/PaymentModal';
import { HistoryModal } from './credits/HistoryModal';
import { DeleteDebtorModal } from './credits/DeleteDebtorModal';
import './CreditManager.css';

const PAGE_SIZE = 24;
const ABOVE_THE_FOLD_CARDS = 6;

const getBoliviaYearMonth = (dateInput = new Date()) => {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit'
    }).format(d);
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
};

export const CreditManager = () => {
  const {
    creditCustomers = [],
    addCreditCustomer,
    updateCreditCustomer,
    deleteCreditCustomer,
    addCustomerCharge,
    addCustomerPayment,
    storeConfig,
    formatBoliviaDateTime,
    showToast,
    isSubscriptionActive
  } = useStore();

  const currency = storeConfig?.currencySymbol || 'Bs.';
  const storeName = storeConfig?.name || 'Mi Tienda';
  const isReadOnlyCredits = isSubscriptionActive === false;

  // Filtros, búsqueda y paginación progresiva
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'debt' | 'clean'
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  // Modales
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    apartment: '',
    notes: '',
    creditLimit: '',
    initialBalance: '',
    initialConcept: '',
    debtMode: 'counter'
  });

  const [activeCustomerForHistory, setActiveCustomerForHistory] = useState(null);
  const [activeCustomerForCharge, setActiveCustomerForCharge] = useState(null);
  const [chargeForm, setChargeForm] = useState({
    amount: '',
    concept: ''
  });

  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash', // 'cash' | 'qr'
    note: ''
  });

  // Métricas Clave
  const totalDebt = useMemo(() => {
    return roundMoney(creditCustomers.reduce((acc, c) => acc + (Number(c.balance) || 0), 0));
  }, [creditCustomers]);

  const customersWithDebtCount = useMemo(() => {
    return creditCustomers.filter(c => (Number(c.balance) || 0) > 0).length;
  }, [creditCustomers]);

  const totalCollectedThisMonth = useMemo(() => {
    const currentBoliviaYM = getBoliviaYearMonth(new Date());
    if (!currentBoliviaYM) return 0;

    return roundMoney(
      creditCustomers.reduce((total, c) => {
        const txs = Array.isArray(c.transactions) ? c.transactions : [];
        const monthPayments = txs.filter(tx => {
          if (tx.type !== 'payment') return false;
          return getBoliviaYearMonth(tx.date) === currentBoliviaYM;
        });
        return total + monthPayments.reduce((sub, tx) => sub + (Number(tx.amount) || 0), 0);
      }, 0)
    );
  }, [creditCustomers]);

  // Lista Filtrada
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return creditCustomers.filter(c => {
      const matchSearch =
        (c.name || '').toLowerCase().includes(q) ||
        (c.apartment || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(searchTerm);

      if (!matchSearch) return false;

      if (filterStatus === 'debt') return (c.balance || 0) > 0;
      if (filterStatus === 'clean') return (c.balance || 0) === 0;
      return true;
    });
  }, [creditCustomers, searchTerm, filterStatus]);

  const visibleCustomers = useMemo(() => {
    return filteredCustomers.slice(0, visibleLimit);
  }, [filteredCustomers, visibleLimit]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setVisibleLimit(PAGE_SIZE);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setVisibleLimit(PAGE_SIZE);
  };

  // Manejo de Formulario de Cliente
  const handleOpenNewCustomer = () => {
    if (isReadOnlyCredits) {
      showToast('Tu suscripción venció. Renueva tu plan en "Mi Suscripción" para registrar nuevos deudores o fiar compras.', 'warning');
      return;
    }
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      phone: '',
      apartment: '',
      notes: '',
      creditLimit: '',
      initialBalance: '',
      initialConcept: '',
      debtMode: 'counter'
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
      initialConcept: '',
      debtMode: 'none'
    });
    setIsCustomerModalOpen(true);
  };

  const handleQuickAddInitialBalance = (amountToAdd) => {
    const current = parseFloat(customerForm.initialBalance) || 0;
    const nextVal = roundMoney(current + amountToAdd).toFixed(2);
    setCustomerForm(prev => ({
      ...prev,
      initialBalance: nextVal.endsWith('.00') ? String(parseInt(nextVal, 10)) : nextVal
    }));
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (isSubmittingCredit) return;
    if (!customerForm.name.trim()) {
      showToast('Por favor escribe el nombre del vecino.', 'warning');
      return;
    }

    if (!editingCustomer && isReadOnlyCredits) {
      showToast('Tu suscripción venció. Renueva tu plan para registrar nuevos deudores.', 'warning');
      return;
    }

    setIsSubmittingCredit(true);
    try {
      const parsedLimit = roundMoney(Math.max(0, parseFloat(customerForm.creditLimit) || 0));

      if (editingCustomer) {
        await updateCreditCustomer(editingCustomer.id, {
          name: customerForm.name.trim(),
          phone: customerForm.phone.trim(),
          apartment: customerForm.apartment.trim(),
          notes: customerForm.notes.trim(),
          creditLimit: parsedLimit
        });
      } else {
        const isWithoutDebt = customerForm.debtMode === 'none';
        const initAmount = isWithoutDebt ? 0 : roundMoney(Math.max(0, parseFloat(customerForm.initialBalance) || 0));

        let concept = '';
        if (initAmount > 0) {
          if (customerForm.debtMode === 'counter') {
            concept = customerForm.initialConcept.trim()
              ? `Compra fiada en mostrador: ${customerForm.initialConcept.trim()}`
              : 'Compra fiada en mostrador (Al registrarse)';
          } else {
            concept = customerForm.initialConcept.trim()
              ? `Saldo previo de libreta: ${customerForm.initialConcept.trim()}`
              : 'Saldo inicial / Deuda previa de libreta';
          }
        }

        const created = await addCreditCustomer({
          name: customerForm.name.trim(),
          phone: customerForm.phone.trim(),
          apartment: customerForm.apartment.trim(),
          notes: customerForm.notes.trim(),
          creditLimit: parsedLimit,
          initialBalance: initAmount,
          initialConcept: concept
        });
        if (!created) return;
      }

      setIsCustomerModalOpen(false);
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  // Referencias reactivas a los clientes activos en modales para evitar snapshots obsoletos
  const currentCustomerForHistory = useMemo(() => {
    if (!activeCustomerForHistory) return null;
    return creditCustomers.find(c => c.id === activeCustomerForHistory.id) || activeCustomerForHistory;
  }, [creditCustomers, activeCustomerForHistory]);

  const currentCustomerForPayment = useMemo(() => {
    if (!activeCustomerForPayment) return null;
    return creditCustomers.find(c => c.id === activeCustomerForPayment.id) || activeCustomerForPayment;
  }, [creditCustomers, activeCustomerForPayment]);

  const currentCustomerForCharge = useMemo(() => {
    if (!activeCustomerForCharge) return null;
    return creditCustomers.find(c => c.id === activeCustomerForCharge.id) || activeCustomerForCharge;
  }, [creditCustomers, activeCustomerForCharge]);

  // Manejo de Cargo Manual
  const handleOpenChargeModal = (customer) => {
    if (isReadOnlyCredits) {
      showToast('Tu suscripción venció. Solo puedes consultar cuentas y registrar abonos mientras renuevas tu plan.', 'warning');
      return;
    }
    setActiveCustomerForCharge(customer);
    setChargeForm({ amount: '', concept: '' });
  };

  const handleConfirmCharge = async (e) => {
    e.preventDefault();
    if (isSubmittingCredit) return;
    if (isReadOnlyCredits) {
      showToast('Tu suscripción venció. Renueva tu plan para anotar nuevos fiados.', 'warning');
      return;
    }
    const amt = roundMoney(parseFloat(chargeForm.amount));
    if (!amt || amt <= 0) {
      showToast('Ingresa un monto válido mayor a 0.', 'warning');
      return;
    }

    const targetCustomer = currentCustomerForCharge || activeCustomerForCharge;
    if (!targetCustomer) return;

    setIsSubmittingCredit(true);
    try {
      await addCustomerCharge(
        targetCustomer.id,
        amt,
        chargeForm.concept.trim() || 'Compra anotada a cuenta'
      );
      setActiveCustomerForCharge(null);
    } finally {
      setIsSubmittingCredit(false);
    }
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

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (isSubmittingCredit) return;
    const amt = roundMoney(parseFloat(paymentForm.amount));
    if (!amt || amt <= 0) {
      showToast('Ingresa un monto válido a abonar.', 'warning');
      return;
    }

    const targetCustomer = currentCustomerForPayment || activeCustomerForPayment;
    if (!targetCustomer) return;
    if ((Number(targetCustomer.balance) || 0) <= 0) {
      showToast(`${targetCustomer.name} ya está al día sin deuda pendiente.`, 'info');
      return;
    }

    setIsSubmittingCredit(true);
    try {
      const res = await addCustomerPayment(
        targetCustomer.id,
        amt,
        paymentForm.paymentMethod,
        paymentForm.note.trim() || (amt >= targetCustomer.balance ? 'Liquidación total' : 'Abono parcial')
      );
      if (res?.ok !== false) {
        setActiveCustomerForPayment(null);
      }
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  const handleConfirmDeleteCustomer = async (customerId) => {
    if (isSubmittingCredit) return;
    setIsSubmittingCredit(true);
    try {
      await deleteCreditCustomer(customerId);
      setCustomerToDelete(null);
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  // Enviar Recordatorio Educado por WhatsApp
  const handleSendWhatsAppReminder = (customer) => {
    if (!customer.phone) {
      showToast('Este vecino no tiene número de teléfono registrado.', 'warning');
      return;
    }

    const cleanPhone = customer.phone.replace(/[^\d]/g, '').replace(/^0+/, '');
    if (cleanPhone.length < 8) {
      showToast('El número de teléfono del vecino es incompleto o inválido para WhatsApp.', 'warning');
      return;
    }
    const phoneWithCountry = cleanPhone.length === 8 ? `591${cleanPhone}` : cleanPhone;

    const recentCharges = (customer.transactions || [])
      .filter(tx => tx.type === 'charge')
      .slice(0, 3)
      .map(tx => `  • ${tx.concept} (${currency} ${Number(tx.amount || 0).toFixed(2)})`)
      .join('\n');

    const text =
      `Hola *${customer.name}*! 👋 Le saludamos cordialmente de *${storeName}*.\n\n` +
      `Le compartimos el resumen de su cuenta de confianza en la tienda a la fecha:\n\n` +
      `💰 *Saldo pendiente actual:* ${currency} ${Number(customer.balance || 0).toFixed(2)}\n\n` +
      (recentCharges ? `📌 *Últimos consumos anotados:*\n${recentCharges}\n\n` : '') +
      `Puede pasar por el minimarket a abonar cuando guste o si prefiere pagar por QR digital, avísenos y con gusto se lo enviamos.\n\n` +
      `¡Muchísimas gracias por su confianza y preferencia de siempre! 😊`;

    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="credit-manager-container p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
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
          title={isReadOnlyCredits ? 'Suscripción vencida: renueva tu plan para registrar nuevos deudores' : 'Registrar nuevo vecino en la libreta'}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shrink-0 ${
            isReadOnlyCredits
              ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:shadow-lg active:scale-95'
          }`}
        >
          {isReadOnlyCredits ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isReadOnlyCredits ? 'Nuevo Deudor (Bloqueado)' : '+ Nuevo Deudor'}</span>
        </button>
      </div>

      {isReadOnlyCredits && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-black block sm:inline">Modo Cobranza (Suscripción Vencida): </strong>
            <span>
              Puedes consultar cuentas pendientes, enviar recordatorios por WhatsApp y <strong>registrar abonos</strong> para cobrar tu dinero. Para añadir nuevos deudores o anotar nuevos fiados, renueva tu plan en <strong>Mi Suscripción</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Tarjetas KPI de Estado de Cuentas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-600">Total que te Deben</span>
              <p className="text-[11px] text-slate-500 font-medium">Dinero fiado pendiente por cobrar</p>
            </div>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {currency} {totalDebt.toFixed(2)}
          </p>
          <p className="text-xs font-bold mt-1">
            {customersWithDebtCount === 0 ? (
              <span className="text-slate-400 font-medium">Nadie te debe dinero actualmente</span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1">
                ⚠️ {customersWithDebtCount} {customersWithDebtCount === 1 ? 'persona tiene saldo pendiente' : 'personas tienen saldo pendiente'}
              </span>
            )}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Deudores en Libreta</span>
              <p className="text-[11px] text-slate-500 font-medium">Cuentas activas de vecinos</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {creditCustomers.length}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {creditCustomers.length === 0 ? (
              <span>Aún no has registrado clientes fiados</span>
            ) : (
              <span>
                <strong className="text-rose-600">{customersWithDebtCount} deben</strong>
                {' • '}
                <strong className="text-emerald-600">{creditCustomers.length - customersWithDebtCount} al día</strong>
              </span>
            )}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600">Cobrado Este Mes</span>
              <p className="text-[11px] text-slate-500 font-medium">Dinero recuperado de fiados</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {currency} {totalCollectedThisMonth.toFixed(2)}
          </p>
          <p className="text-xs text-emerald-600 font-bold mt-1">
            {totalCollectedThisMonth === 0 ? (
              <span className="text-slate-400 font-normal">Sin pagos de fiados registrados este mes</span>
            ) : (
              <span>Total recibido en abonos y cancelaciones</span>
            )}
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="Buscar vecino en libreta de deudas"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, departamento o teléfono..."
            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
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
            onClick={() => handleFilterChange('debt')}
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
            onClick={() => handleFilterChange('clean')}
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
            Registra a tus clientes habituales para anotarles compras &ldquo;al fiao&rdquo;, registrar abonos de dinero y recordarles sus cuentas por WhatsApp de forma organizada.
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
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCustomers.map((customer, idx) => {
              const hasDebt = (customer.balance || 0) > 0;
              const limitPercentage = customer.creditLimit > 0
                ? Math.min(100, Math.round((customer.balance / customer.creditLimit) * 100))
                : null;
              const isBelowFold = idx >= ABOVE_THE_FOLD_CARDS;

              return (
                <div
                  key={customer.id}
                  className={`${isBelowFold ? 'credit-card-deferred ' : ''}bg-white rounded-2xl border transition-colors duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                    hasDebt ? 'border-rose-200/80 hover:border-rose-300' : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug truncate">
                          {customer.name}
                        </h3>
                        {customer.apartment && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium truncate">
                            <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{customer.apartment}</span>
                          </p>
                        )}
                        {customer.phone && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{customer.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCustomer(customer)}
                          aria-label={`Editar datos de ${customer.name}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar datos"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(customer)}
                          aria-label={`Eliminar cuenta de ${customer.name}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar cuenta de deudor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {customer.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl italic border border-slate-100 line-clamp-2">
                        &ldquo;{customer.notes}&rdquo;
                      </p>
                    )}

                    <div className={`p-3 rounded-xl border ${hasDebt ? 'bg-rose-50/70 border-rose-100' : 'bg-emerald-50/70 border-emerald-100'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black uppercase tracking-wider ${hasDebt ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {hasDebt ? 'Saldo Pendiente' : 'Estado'}
                        </span>
                        <span className={`font-black text-base sm:text-lg ${hasDebt ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {currency} {Number(customer.balance || 0).toFixed(2)}
                        </span>
                      </div>

                      {customer.creditLimit > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                            <span>Límite de crédito: {currency} {Number(customer.creditLimit).toFixed(2)}</span>
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

                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-2">
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

                    <button
                      type="button"
                      onClick={() => handleOpenPaymentModal(customer)}
                      className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Abonar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenChargeModal(customer)}
                      title={isReadOnlyCredits ? 'Suscripción vencida: no se pueden anotar nuevos fiados' : 'Anotar nueva compra fiada'}
                      className={`px-2.5 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isReadOnlyCredits
                          ? 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200/70'
                          : 'bg-indigo-50 border-indigo-200/70 hover:bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {isReadOnlyCredits ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Anotar Fiao</span>
                    </button>

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

          {filteredCustomers.length > visibleLimit && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setVisibleLimit(prev => prev + PAGE_SIZE)}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs cursor-pointer transition-colors"
              >
                Mostrar {Math.min(PAGE_SIZE, filteredCustomers.length - visibleLimit)} vecinos más (quedan {filteredCustomers.length - visibleLimit})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modales Nativos Modulares (<dialog>) */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        editingCustomer={editingCustomer}
        customerForm={customerForm}
        setCustomerForm={setCustomerForm}
        handleQuickAddInitialBalance={handleQuickAddInitialBalance}
        onSubmit={handleSaveCustomer}
        isSubmitting={isSubmittingCredit}
        currency={currency}
      />

      <ChargeModal
        customer={currentCustomerForCharge}
        onClose={() => setActiveCustomerForCharge(null)}
        chargeForm={chargeForm}
        setChargeForm={setChargeForm}
        onSubmit={handleConfirmCharge}
        isSubmitting={isSubmittingCredit}
        currency={currency}
      />

      <PaymentModal
        customer={currentCustomerForPayment}
        onClose={() => setActiveCustomerForPayment(null)}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        onSubmit={handleConfirmPayment}
        isSubmitting={isSubmittingCredit}
        currency={currency}
      />

      <HistoryModal
        customer={currentCustomerForHistory}
        onClose={() => setActiveCustomerForHistory(null)}
        onOpenCharge={(cust) => {
          if (isReadOnlyCredits) {
            showToast('Tu suscripción venció. Renueva tu plan para anotar nuevos fiados.', 'warning');
            return;
          }
          setActiveCustomerForHistory(null);
          handleOpenChargeModal(cust);
        }}
        onOpenPayment={(cust) => {
          setActiveCustomerForHistory(null);
          handleOpenPaymentModal(cust);
        }}
        isReadOnlyCredits={isReadOnlyCredits}
        formatBoliviaDateTime={formatBoliviaDateTime}
        currency={currency}
      />

      <DeleteDebtorModal
        customer={customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirmDelete={handleConfirmDeleteCustomer}
        isSubmitting={isSubmittingCredit}
        currency={currency}
      />
    </div>
  );
};
