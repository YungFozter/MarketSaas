import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Banknote, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Sparkles, 
  Barcode,
  Printer,
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  X,
  Check,
  RotateCcw,
  Receipt,
  Download,
  Maximize2,
  BookOpen,
  Send,
  UserCheck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { normalizeSearchText, escapeHtml } from '../../utils/formatters';
import './PosTerminal.css';

export const PosTerminal = ({ onClose, onSaleCompleted }) => {
  const { 
    products, 
    categories, 
    completePosSale, 
    showToast, 
    storeConfig, 
    currentUser,
    creditCustomers = [],
    addCreditCustomer 
  } = useStore();
  const currency = storeConfig?.currencySymbol || 'Bs.';

  // Flujo por pasos: 'catalog' -> 'payment' -> 'success'
  const [step, setStep] = useState('catalog');

  // Vista en móvil/pantallas pequeñas: 'catalog' | 'ticket'
  const [mobileView, setMobileView] = useState('catalog');

  const [posCart, setPosCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'qr' | 'card' | 'credit'
  const [cashReceived, setCashReceived] = useState('');
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [isQrZoomOpen, setIsQrZoomOpen] = useState(false);
  const [selectedCreditCustomerId, setSelectedCreditCustomerId] = useState('');
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({ name: '', phone: '', apartment: '' });

  const filteredProducts = products.filter((p) => {
    const matchCat = 
      selectedCat === 'all' || 
      p.category === selectedCat || 
      (p.category && selectedCat && p.category.toLowerCase().trim() === selectedCat.toLowerCase().trim());
    const cleanQuery = normalizeSearchText(searchTerm);
    if (!cleanQuery) return matchCat;

    const matchSearch = 
      normalizeSearchText(p.name).includes(cleanQuery) ||
      normalizeSearchText(p.barcode).includes(cleanQuery) ||
      normalizeSearchText(p.code).includes(cleanQuery) ||
      normalizeSearchText(p.category).includes(cleanQuery);

    return matchCat && matchSearch;
  });

  const addToPosCart = (product) => {
    const isDefined = product.stock !== 'Sin definir' && product.stock != null;
    const numStock = isDefined ? Number(product.stock) : null;

    if (isDefined && numStock <= 0) {
      showToast(`¡Sin stock de ${product.name}!`, 'warning');
      return;
    }

    setPosCart((prev) => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (isDefined && existing.quantity >= numStock) {
          showToast(`No hay más stock disponible de ${product.name}`, 'warning');
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.price) || 0, quantity: 1, stock: product.stock, image: product.image }];
    });
  };

  const updatePosQuantity = (id, newQty) => {
    if (newQty <= 0) {
      setPosCart(prev => prev.filter(i => i.id !== id));
      return;
    }
    setPosCart(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const removePosItem = (id) => {
    setPosCart(prev => prev.filter(i => i.id !== id));
  };

  const clearPosCart = () => {
    setPosCart([]);
    setCashReceived('');
  };

  const subtotal = posCart.reduce((acc, item) => acc + (Number(item.price) || 0) * item.quantity, 0);
  const totalQty = posCart.reduce((acc, item) => acc + item.quantity, 0);
  const parsedCash = parseFloat(cashReceived) || 0;
  const changeToReturn = parsedCash > subtotal ? (parsedCash - subtotal).toFixed(2) : '0.00';

  const handleFinishSale = () => {
    if (posCart.length === 0) {
      showToast('Agrega al menos un producto al ticket de venta', 'warning');
      return;
    }

    let creditOptions = {};
    if (paymentType === 'credit') {
      if (!selectedCreditCustomerId) {
        showToast('Selecciona a qué vecino se le anotará la cuenta.', 'warning');
        return;
      }
      const targetCust = creditCustomers.find(c => c.id === selectedCreditCustomerId);
      if (!targetCust) {
        showToast('El vecino seleccionado no es válido.', 'warning');
        return;
      }
      creditOptions = {
        customerId: targetCust.id,
        customerName: targetCust.name,
        customerPhone: targetCust.phone,
        customerApartment: targetCust.apartment
      };
    }

    const createdOrder = completePosSale(posCart, paymentType, creditOptions);
    const effectiveOrder = createdOrder || {
      id: `${storeConfig?.id || 'POS'}-${Date.now().toString().slice(-4)}`,
      items: posCart,
      subtotal,
      total: subtotal,
      paymentMethod: paymentType,
      customer: paymentType === 'credit' ? { name: creditOptions.customerName, phone: creditOptions.customerPhone } : undefined,
      createdAt: new Date().toISOString()
    };

    setLastCompletedSale(effectiveOrder);
    setStep('success');

    if (onSaleCompleted) {
      onSaleCompleted(effectiveOrder);
    }
  };

  const handleNewSale = () => {
    setPosCart([]);
    setCashReceived('');
    setLastCompletedSale(null);
    setPaymentType('cash');
    setSelectedCreditCustomerId('');
    setStep('catalog');
    setMobileView('catalog');
  };

  // Impresión de comanda térmica de venta presencial
  const handlePrintReceipt = (sale) => {
    if (!sale) return;
    const printWindow = window.open('', '', 'width=420,height=650');
    if (!printWindow) {
      showToast('Por favor permite ventanas emergentes para imprimir la comanda.', 'warning');
      return;
    }

    const d = new Date(sale.createdAt || Date.now());
    const fullDate = d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const items = Array.isArray(sale.items) ? sale.items : [];
    const paymentLabel = 
      sale.paymentMethod === 'credit' ? 'A Cuenta / Fiao' :
      sale.paymentMethod === 'qr' ? 'QR Simple (Digital)' :
      sale.paymentMethod === 'card' ? 'Tarjeta POS' : 'Efectivo';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda - ${sale.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 13px; 
              padding: 14px; 
              width: 280px; 
              color: #000; 
              margin: 0 auto;
            }
            .center { text-align: center; }
            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 12px; }
            .bold { font-weight: bold; }
            .item-title { font-weight: bold; margin-top: 4px; }
            .item-detail { display: flex; justify-content: space-between; font-size: 11px; padding-left: 8px; color: #333; }
          </style>
        </head>
        <body>
          <div class="center">
            <h3 style="margin:0; font-size:16px;">${escapeHtml(storeConfig?.name || 'MarketSaaS')}</h3>
            <p style="margin:2px 0; font-size:11px;">COMPROBANTE DE VENTA DE CAJA</p>
            <div class="divider"></div>
            <p style="margin:2px 0; font-size:12px; font-weight:bold;">TICKET #${escapeHtml(sale.id)}</p>
            <p style="margin:2px 0; font-size:11px;">Fecha: ${escapeHtml(fullDate)} - ${escapeHtml(time)}</p>
            <p style="margin:2px 0; font-size:11px;">Atendido por: ${escapeHtml(currentUser?.user_metadata?.full_name || currentUser?.email || 'Caja')}</p>
            <div class="divider"></div>
          </div>
          
          <div style="margin-bottom:6px;">
            <p style="margin:2px 0; font-size:11px;"><strong>Cliente:</strong> Mostrador Presencial</p>
            <p style="margin:2px 0; font-size:11px;"><strong>Modalidad:</strong> Venta Mostrador (POS)</p>
          </div>
          
          <div class="divider"></div>
          <p class="bold" style="margin:4px 0;">ARTÍCULOS:</p>

          ${items.map(item => `
            <div style="margin-bottom:4px;">
              <div class="item-title">${escapeHtml(item.name)}</div>
              <div class="item-detail">
                <span>${escapeHtml(item.quantity)} x ${currency} ${(Number(item.price) || 0).toFixed(2)}</span>
                <span class="bold">${currency} ${((Number(item.quantity) || 1) * (Number(item.price) || 0)).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}

          <div class="divider"></div>

          <div class="row"><span>Subtotal:</span><span>${currency} ${(Number(sale.subtotal) || Number(sale.total) || 0).toFixed(2)}</span></div>
          
          <div class="divider"></div>
          <div class="row bold" style="font-size:15px; margin:6px 0;">
            <span>TOTAL PAGADO:</span>
            <span>${currency} ${(Number(sale.total) || 0).toFixed(2)}</span>
          </div>
          <div class="row" style="font-size:11px;">
            <span>Método de Cobro:</span>
            <span class="bold">${paymentLabel}</span>
          </div>

          <div class="divider"></div>
          <div class="center" style="margin-top: 16px;">
            <p style="font-size:11px; margin:2px 0;">¡Gracias por su compra!</p>
            <p style="font-size:10px; margin:2px 0; color:#666;">MarketSaaS • Punto de Venta</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // =========================================================================
  // PASO 3: PANTALLA DE VENTA COMPLETADA CON ÉXITO
  // =========================================================================
  if (step === 'success' && lastCompletedSale) {
    return (
      <div className="max-w-xl mx-auto py-6 sm:py-10 px-4 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-black uppercase tracking-wider">
            Venta Registrada Exitosamente
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {currency} {(Number(lastCompletedSale.total) || 0).toFixed(2)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Ticket #{lastCompletedSale.id} • Cobrado en {
              lastCompletedSale.paymentMethod === 'qr' ? 'QR Simple' :
              lastCompletedSale.paymentMethod === 'card' ? 'Tarjeta POS' : 'Efectivo'
            }
          </p>
          {lastCompletedSale.paymentMethod === 'cash' && parsedCash > subtotal && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-lg inline-block mt-2">
              Vuelto entregado al cliente: {currency} {changeToReturn}
            </p>
          )}
        </div>

        {/* Resumen de Artículos Vendidos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px] block">
            Detalle del Ticket ({lastCompletedSale.items?.length || 0} productos)
          </span>
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {lastCompletedSale.items?.map((it, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <span className="font-bold text-slate-800 truncate pr-2">
                  {it.quantity}x {it.name}
                </span>
                <span className="font-black text-slate-900 shrink-0">
                  {currency} {((Number(it.price) || 0) * it.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {lastCompletedSale?.paymentMethod === 'credit' && lastCompletedSale.customer?.phone && lastCompletedSale.customer.phone !== 'Presencial' && (
            <button
              type="button"
              onClick={() => {
                const phone = lastCompletedSale.customer.phone.replace(/[^\d]/g, '');
                const cleanPhone = phone.length === 8 ? `591${phone}` : phone;
                const itemsSummary = lastCompletedSale.items?.map(i => `  • ${i.quantity}x ${i.name} (${currency} ${((Number(i.price) || 0) * i.quantity).toFixed(2)})`).join('\n') || '';
                const msg = `Hola *${lastCompletedSale.customer.name}*! 👋 Le saludamos de *${storeConfig?.name || 'la tienda'}*.\n\n` +
                  `Registramos su compra a cuenta (#${lastCompletedSale.id}) por *${currency} ${lastCompletedSale.total?.toFixed(2)}*:\n\n` +
                  `${itemsSummary}\n\n` +
                  `¡Muchas gracias por su preferencia! 😊`;
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Notificar por WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handlePrintReceipt(lastCompletedSale)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir Comanda Térmica</span>
          </button>

          <button
            type="button"
            onClick={handleNewSale}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Venta</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // PASO 2: SELECCIÓN DE MÉTODO DE PAGO Y COBRO
  // =========================================================================
  if (step === 'payment') {
    const qrImage = storeConfig?.qrImageUrl;

    return (
      <div className="max-w-xl mx-auto py-4 px-2 sm:px-4 space-y-5 animate-fadeIn">
        {/* Cabecera del Cobro con botón Volver */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setStep('catalog')}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </button>

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Paso 2 de 2: Cobro
          </span>
        </div>

        {/* Resumen Destacado de Total */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total a Cobrar</span>
            <p className="text-3xl font-black text-emerald-400 tracking-tight mt-0.5">
              {currency} {subtotal.toFixed(2)}
            </p>
          </div>
          <div className="text-right text-xs text-slate-300">
            <span className="font-extrabold block text-sm text-white">{totalQty} {totalQty === 1 ? 'artículo' : 'artículos'}</span>
            <span className="text-slate-400">{posCart.length} productos distintos</span>
          </div>
        </div>

        {/* Selección de Forma de Cobro */}
        <div className="space-y-3">
          <label className="text-xs font-extrabold text-slate-800 block">
            Selecciona la forma de pago del cliente:
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {/* Efectivo */}
            <button
              type="button"
              onClick={() => setPaymentType('cash')}
              className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                paymentType === 'cash'
                  ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl ${paymentType === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="font-extrabold text-xs sm:text-sm text-slate-900">Efectivo</p>
                <p className="text-[10px] text-slate-400">Billetes</p>
              </div>
            </button>

            {/* QR Digital */}
            <button
              type="button"
              onClick={() => setPaymentType('qr')}
              className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                paymentType === 'qr'
                  ? 'border-cyan-500 bg-cyan-50/80 shadow-xs ring-2 ring-cyan-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl ${paymentType === 'qr' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="font-extrabold text-xs sm:text-sm text-slate-900">QR Simple</p>
                <p className="text-[10px] text-slate-400">Transferencia</p>
              </div>
            </button>

            {/* Tarjeta POS */}
            <button
              type="button"
              onClick={() => setPaymentType('card')}
              className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                paymentType === 'card'
                  ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl ${paymentType === 'card' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="font-extrabold text-xs sm:text-sm text-slate-900">Tarjeta POS</p>
                <p className="text-[10px] text-slate-400">POS físico</p>
              </div>
            </button>

            {/* A Cuenta / Fiao */}
            <button
              type="button"
              onClick={() => setPaymentType('credit')}
              className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center ${
                paymentType === 'credit'
                  ? 'border-indigo-500 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl ${paymentType === 'credit' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="font-extrabold text-xs sm:text-sm text-slate-900">A Cuenta</p>
                <p className="text-[10px] text-slate-400">Fiao Vecinal</p>
              </div>
            </button>
          </div>

          {/* Panel Específico según Método de Pago */}
          {paymentType === 'cash' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                ¿Con cuánto paga el cliente? (Cálculo de cambio):
              </label>

              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-500">{currency}</span>
                <input
                  type="number"
                  step="any"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={subtotal.toFixed(2)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-black text-base text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Botones de Monto Rápido */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 mr-1">Rápido:</span>
                <button
                  type="button"
                  onClick={() => setCashReceived(subtotal.toString())}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Exacto ({currency} {subtotal.toFixed(2)})
                </button>
                {[10, 20, 50, 100, 200].filter(amount => amount >= subtotal).map((amt) => (
                  <button
                    key={`cash-fast-${amt}`}
                    type="button"
                    onClick={() => setCashReceived(amt.toString())}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    {currency} {amt}
                  </button>
                ))}
              </div>

              {/* Resultado del Cambio / Vuelto */}
              {parsedCash > 0 && (
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  parsedCash >= subtotal
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <span>{parsedCash >= subtotal ? 'Vuelto a entregar al cliente:' : 'Faltan para completar el pago:'}</span>
                  <span className="text-sm font-black">
                    {currency} {parsedCash >= subtotal ? changeToReturn : (subtotal - parsedCash).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentType === 'qr' && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center space-y-3.5 shadow-xs">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-extrabold text-slate-800">
                  Muestra este código QR al cliente para que lo escanee desde su celular:
                </p>
                <p className="text-[11px] text-slate-400">
                  Puedes hacer clic sobre el código para abrirlo a tamaño completo
                </p>
              </div>

              {qrImage ? (
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => setIsQrZoomOpen(true)}
                    className="relative group cursor-pointer rounded-2xl overflow-hidden border-2 border-cyan-400 p-2 bg-white shadow-md hover:shadow-xl transition-all hover:scale-[1.01]"
                    title="Haz clic para abrir el QR en tamaño grande"
                  >
                    <img
                      src={qrImage}
                      alt="Código QR de la tienda"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl bg-white transition-transform"
                    />
                    <div className="absolute inset-0 bg-cyan-950/25 group-hover:bg-cyan-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white font-black text-xs rounded-xl backdrop-blur-2xs">
                      <div className="p-2.5 rounded-full bg-white/30 backdrop-blur-md shadow-lg">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                      <span className="bg-slate-900/80 px-3 py-1 rounded-full text-[11px] font-bold shadow-md">
                        Toca para Ampliar
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQrZoomOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold border border-cyan-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Ver QR en Grande</span>
                    </button>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-bold">
                      {storeConfig?.name || 'QR Oficial'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <p className="font-bold">Aún no has cargado tu imagen QR en la configuración de la tienda.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Puedes registrar la venta con QR y verificar el pago en tu aplicación bancaria.</p>
                </div>
              )}
            </div>
          )}

          {paymentType === 'card' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Procesa el cobro de <strong className="text-emerald-700">{currency} {subtotal.toFixed(2)}</strong> en tu terminal inalámbrico POS.
              </p>
              <p className="text-[11px] text-slate-400">
                Una vez impreso el comprobante del banco, presiona el botón inferior para sellar la venta.
              </p>
            </div>
          )}

          {paymentType === 'credit' && (
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-indigo-200 space-y-3.5 shadow-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 block">
                  Selecciona al vecino a cuya cuenta se cargará:
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomerOpen(true)}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nuevo Vecino</span>
                </button>
              </div>

              {creditCustomers.length === 0 ? (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center space-y-2">
                  <p className="text-xs text-slate-600 font-medium">Aún no tienes vecinos registrados en tu libreta.</p>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddCustomerOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Registrar vecino ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <select
                    value={selectedCreditCustomerId}
                    onChange={(e) => setSelectedCreditCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">-- Elige un vecino ({creditCustomers.length} en libreta) --</option>
                    {creditCustomers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.apartment ? `(${c.apartment})` : ''} - Saldo actual: {currency} {c.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>

                  {/* Detalle del Vecino Seleccionado */}
                  {selectedCreditCustomerId && (() => {
                    const cust = creditCustomers.find(c => c.id === selectedCreditCustomerId);
                    if (!cust) return null;
                    const newBal = (cust.balance || 0) + subtotal;
                    const exceedsLimit = cust.creditLimit > 0 && newBal > cust.creditLimit;

                    return (
                      <div className={`p-3.5 rounded-2xl border space-y-1.5 ${exceedsLimit ? 'bg-rose-50 border-rose-200' : 'bg-indigo-50/60 border-indigo-100'}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Saldo actual del vecino:</span>
                          <span className="font-bold text-slate-800">{currency} {cust.balance.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">+ Esta compra a cuenta:</span>
                          <span className="font-bold text-indigo-700">+{currency} {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-200/80 pt-1.5 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Nuevo saldo acumulado:</span>
                          <span className="font-black text-rose-600 text-sm">{currency} {newBal.toFixed(2)}</span>
                        </div>
                        {exceedsLimit && (
                          <p className="text-[11px] font-bold text-rose-600 pt-1">
                            ⚠️ Aviso: Esta compra superará el límite de crédito fijado ({currency} {cust.creditLimit.toFixed(2)}).
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón de Confirmación Definitiva */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleFinishSale}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            <span>Confirmar y Finalizar Venta ({currency} {subtotal.toFixed(2)})</span>
          </button>
        </div>

        {/* MODAL LIGHTBOX: QR AMPLIADO A TAMAÑO COMPLETO */}
        {isQrZoomOpen && qrImage && (
          <div 
            className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
            onClick={() => setIsQrZoomOpen(false)}
          >
            <div 
              className="relative max-w-lg sm:max-w-xl w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-fadeIn overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header con botón cerrar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-left">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>Escanear Código QR</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                      QR Simple
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {storeConfig?.name || 'Tienda Oficial'} • Pago en Mostrador
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrZoomOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Cerrar ampliación"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Monto destacado para que el cliente lo vea claramente */}
              <div className="bg-cyan-50 border border-cyan-200/80 p-3 rounded-2xl flex items-center justify-between px-4">
                <span className="text-xs sm:text-sm font-bold text-cyan-900">Total a pagar:</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-950">{currency} {subtotal.toFixed(2)}</span>
              </div>

              {/* Imagen QR Ampliada */}
              <div className="flex items-center justify-center p-2 sm:p-3 bg-slate-50 rounded-2xl border-2 border-cyan-300 overflow-hidden">
                <img
                  src={qrImage}
                  alt="Código QR Ampliado de la tienda"
                  className="max-w-full max-h-[58vh] sm:max-h-[64vh] w-auto h-auto object-contain rounded-xl shadow-xs"
                />
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-500 font-medium">
                  El cliente puede enfocar la cámara desde cualquier app bancaria o billetera digital para transferir.
                </p>
                <button
                  type="button"
                  onClick={() => setIsQrZoomOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer"
                >
                  ✓ Listo / Cerrar Ampliación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PASO 1: CATÁLOGO Y TICKET DE VENTA (VISTA PRINCIPAL)
  // =========================================================================
  return (
    <div className="relative pb-16 lg:pb-0 animate-fadeIn">
      {/* Selector de Pestaña Móvil (Catálogo vs Ticket) */}
      <div className="flex lg:hidden items-center p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs mb-3">
        <button
          type="button"
          onClick={() => setMobileView('catalog')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileView === 'catalog'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Catálogo ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView('ticket')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mobileView === 'ticket'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Ticket {posCart.length > 0 ? `(${totalQty}) • ${currency} ${subtotal.toFixed(2)}` : '(0)'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Panel Izquierdo: Catálogo y Búsqueda de Productos (7 columnas en desktop) */}
        <div className={`lg:col-span-7 xl:col-span-8 space-y-3.5 ${mobileView === 'ticket' ? 'hidden lg:block' : 'block'}`}>
          {/* Barra Superior de Búsqueda y Categorías */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, código de barras o categoría..."
                className="w-full pl-9 pr-8 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500 font-medium bg-slate-50 focus:bg-white"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCat('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCat === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({products.length})
              </button>
              {categories.filter(c => c.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCat === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cuadrícula de Productos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 max-h-[62vh] overflow-y-auto p-1 scrollbar-thin">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <Store className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No se encontraron productos coincidentes</p>
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setSelectedCat('all'); }}
                  className="text-xs font-extrabold text-emerald-600 hover:underline cursor-pointer"
                >
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCart = posCart.find(i => i.id === p.id);
                const isOutOfStock = p.stock !== 'Sin definir' && p.stock != null && Number(p.stock) <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToPosCart(p)}
                    className={`group bg-white p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden select-none active:scale-[0.98] ${
                      inCart 
                        ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/10' 
                        : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500/50'
                    } ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    <div className="aspect-square w-full rounded-xl bg-slate-50 mb-2 overflow-hidden relative flex items-center justify-center p-2">
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/products/producto-sin-imagen.png';
                        }}
                      />
                      {inCart && (
                        <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-tight mb-1" title={p.name}>
                        {p.name}
                      </h4>
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="font-black text-xs sm:text-sm text-emerald-700">
                          {currency} {(Number(p.price) || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {p.stock === 'Sin definir' || p.stock == null ? 'Ilimitado' : `${p.stock} u.`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel Derecho: Ticket de Mostrador (5 columnas en desktop) */}
        <div className={`lg:col-span-5 xl:col-span-4 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5 sticky top-4 ${
          mobileView === 'catalog' ? 'hidden lg:block' : 'block'
        }`}>
          {/* Header del Ticket */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Ticket de Mostrador</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Venta rápida en caja física</p>
            </div>
            {posCart.length > 0 && (
              <button
                type="button"
                onClick={clearPosCart}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold cursor-pointer"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Lista de Ítems en el Ticket */}
          <div className="space-y-2 max-h-[46vh] overflow-y-auto divide-y divide-slate-100 pr-1 scrollbar-thin">
            {posCart.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1.5">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">El ticket está vacío</p>
                <p className="text-[11px]">Toca cualquier producto del catálogo para agregarlo.</p>
              </div>
            ) : (
              posCart.map((item) => (
                <div key={item.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate" title={item.name}>{item.name}</p>
                    <p className="text-[11px] text-slate-400">{currency} {(Number(item.price) || 0).toFixed(2)} c/u</p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => updatePosQuantity(item.id, item.quantity - 1)}
                      className="w-5 h-5 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-xs px-1.5 min-w-5 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updatePosQuantity(item.id, item.quantity + 1)}
                      className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-14">
                    <span className="font-black text-slate-900 block">
                      {currency} {((Number(item.price) || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePosItem(item.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Resumen del Ticket y Botón Continuar */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Artículos ({totalQty}):</span>
                <span className="font-bold text-slate-800">{currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                <span className="text-sm font-extrabold text-slate-900">Total a Pagar:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={posCart.length === 0}
              onClick={() => setStep('payment')}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Continuar al Cobro ({currency} {subtotal.toFixed(2)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra Flotante Inferior en Móvil (Visible si hay ítems y estamos en vista catálogo) */}
      {posCart.length > 0 && mobileView === 'catalog' && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-30 shadow-2xl animate-slideUp">
          <div>
            <span className="text-white font-black text-sm block">
              {currency} {subtotal.toFixed(2)}
            </span>
            <span className="text-slate-400 text-xs">
              {totalQty} {totalQty === 1 ? 'producto' : 'productos'} en ticket
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileView('ticket')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95"
          >
            <span>Ver Ticket / Cobrar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODAL RÁPIDO: REGISTRAR NUEVO VECINO DESDE EL POS */}
      {isQuickAddCustomerOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="font-black text-sm text-slate-900">Registrar Vecino a Cuenta</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddCustomerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  autoFocus
                  value={quickCustomerForm.name}
                  onChange={(e) => setQuickCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Don Carlos Mendoza"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={quickCustomerForm.phone}
                  onChange={(e) => setQuickCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej. 77123456"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Torre / Depto / Casa</label>
                <input
                  type="text"
                  value={quickCustomerForm.apartment}
                  onChange={(e) => setQuickCustomerForm(prev => ({ ...prev, apartment: e.target.value }))}
                  placeholder="Ej. Torre B - 402"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuickAddCustomerOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!quickCustomerForm.name.trim()) {
                    showToast('Escribe el nombre del vecino.', 'warning');
                    return;
                  }
                  const created = addCreditCustomer({
                    name: quickCustomerForm.name.trim(),
                    phone: quickCustomerForm.phone.trim(),
                    apartment: quickCustomerForm.apartment.trim()
                  });
                  if (created) {
                    setSelectedCreditCustomerId(created.id);
                  }
                  setQuickCustomerForm({ name: '', phone: '', apartment: '' });
                  setIsQuickAddCustomerOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs cursor-pointer"
              >
                Guardar y Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
