import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  Store, 
  MapPin, 
  Banknote, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Clock,
  MessageCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './CheckoutModal.css';

export const CheckoutModal = ({ isOpen, onClose }) => {
  const { 
    cart, 
    cartSubtotal, 
    actualDeliveryFee, 
    cartTotal, 
    appliedCoupon, 
    selectedLocation, 
    setSelectedLocation, 
    storeConfig, 
    selectedStore,
    stores,
    createCustomerOrder, 
    showToast,
    customerPhone: storedCustomerPhone,
    customerName: storedCustomerName,
    tenantSlug
  } = useStore();

  const isOfficialStore = Boolean(
    (tenantSlug && tenantSlug !== 'default') ||
    (selectedStore && selectedStore.id && selectedStore.id !== 'default')
  );
  const storeDisplayName = storeConfig?.name || selectedStore?.name || 'Mi Tienda';

  const [step, setStep] = useState(1); // 1: Dirección y Entrega, 2: Método de Pago
  const isDeliveryEnabled = storeConfig?.enableDelivery !== false;
  const [deliveryType, setDeliveryType] = useState(isDeliveryEnabled ? 'delivery' : 'pickup'); // 'delivery' | 'pickup'

  const effectiveDeliveryType = isDeliveryEnabled ? deliveryType : 'pickup';

  const condominiums = storeConfig?.condominiums && storeConfig.condominiums.length > 0
    ? storeConfig.condominiums
    : [{ id: 'c1', name: 'Condominio Las Palmas', towers: ['Torre A', 'Torre B', 'Torre C'], deliveryFee: 0, estTime: '10-15 min' }];

  const [customerName, setCustomerName] = useState(storedCustomerName || '');
  const [customerPhone, setCustomerPhone] = useState(storedCustomerPhone || '');
  const [formErrors, setFormErrors] = useState({ name: false, phone: false });
  const [condoName, setCondoName] = useState(selectedLocation?.condominium || condominiums[0]?.name || 'Condominio Las Palmas');
  const [tower, setTower] = useState(selectedLocation?.tower || condominiums[0]?.towers?.[0] || 'Torre A');
  const [apartment, setApartment] = useState(selectedLocation?.apartment || 'Casa 27');
  const [notes, setNotes] = useState(selectedLocation?.notes || 'Dejar en conserjería o timbrar en el depto.');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qr' | 'card'
  const [cashAmount, setCashAmount] = useState('50.00');
  const [copiedBank, setCopiedBank] = useState(false);

  const minOrder = Number(storeConfig?.minOrder || 0);
  const isBelowMinOrder = effectiveDeliveryType === 'delivery' && minOrder > 0 && cartSubtotal < minOrder;
  const missingToMinOrder = Math.max(0, minOrder - cartSubtotal);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (storedCustomerName) setCustomerName(storedCustomerName);
      if (storedCustomerPhone) setCustomerPhone(storedCustomerPhone);
      setFormErrors({ name: false, phone: false });
    }
  }, [isOpen, storedCustomerName, storedCustomerPhone]);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    
    // Si borró todo o solo quedan partes del prefijo, dejamos vacío para que se vea el placeholder visual
    if (!val || ['+', '+5', '+59', '+591', '+591 '].includes(val.trim())) {
      setCustomerPhone('');
      return;
    }

    // Extraer solo dígitos ingresados
    let digits = val.replace(/[^0-9]/g, '');
    
    // Si los dígitos comienzan con el código de país 591, evitar duplicación
    if (digits.startsWith('591')) {
      digits = digits.slice(3);
    }

    // Máximo 8 dígitos habituales para celulares en Bolivia
    digits = digits.slice(0, 8);

    if (digits.length > 0) {
      setCustomerPhone(`+591 ${digits}`);
    } else {
      setCustomerPhone('');
    }
  };

  const handleProceedToPayment = () => {
    let hasError = false;
    const newErrors = { name: false, phone: false };

    if (!customerName.trim()) {
      newErrors.name = true;
      hasError = true;
      showToast('Por favor escribe tu nombre completo.', 'warning');
    }
    
    const rawDigits = customerPhone.replace(/[^0-9]/g, '').replace(/^591/, '');
    if (!customerPhone.trim() || rawDigits.length < 7) {
      newErrors.phone = true;
      hasError = true;
      if (!newErrors.name) {
        showToast('Por favor ingresa tu número de teléfono o WhatsApp.', 'warning');
      }
    }

    if (hasError) {
      setFormErrors(newErrors);
      return;
    }

    if (isBelowMinOrder) {
      const curr = storeConfig?.currencySymbol || 'Bs.';
      showToast(`El pedido mínimo para delivery en esta tienda es de ${curr} ${minOrder.toFixed(2)}. Agrega ${curr} ${missingToMinOrder.toFixed(2)} más o elige retiro en tienda.`, 'warning');
      return;
    }
    
    setFormErrors({ name: false, phone: false });
    setStep(2);
  };

  if (!isOpen || cart.length === 0) return null;

  const currentCondoObj = condominiums.find(c => c.name === condoName) || condominiums[0];
  const finalDeliveryFee = effectiveDeliveryType === 'delivery' ? actualDeliveryFee : 0;
  const currency = storeConfig?.currencySymbol || 'Bs.';
  const finalTotal = Math.max(0, cartSubtotal + finalDeliveryFee - (appliedCoupon ? appliedCoupon.discount : 0));
  const changeToReturn = parseFloat(cashAmount) > finalTotal ? (parseFloat(cashAmount) - finalTotal).toFixed(2) : '0.00';

  const bankDetails = storeConfig?.bankDetails || selectedStore?.bankDetails || {
    bank: 'Banco Unión / Billetera Simple QR',
    accountNumber: '1000-2495-8120',
    holder: 'Minimarket Saas S.R.L.',
    aliasQR: 'MINIMARKET-SAAS.PAGO'
  };

  const qrImage = storeConfig?.qrImageUrl || selectedStore?.qrImageUrl;

  const handleCopyBankInfo = () => {
    const text = `Banco: ${bankDetails.bank || 'Banco Unión'}\nCuenta: ${bankDetails.accountNumber || ''}\nTitular: ${bankDetails.holder || ''}\nAlias QR: ${bankDetails.aliasQR || ''}`;
    navigator.clipboard?.writeText(text);
    setCopiedBank(true);
    showToast('Datos bancarios copiados al portapapeles');
    setTimeout(() => setCopiedBank(false), 3000);
  };

  const handleDownloadQr = async () => {
    if (!qrImage) {
      showToast('No hay imagen QR disponible para descargar.', 'warning');
      return;
    }

    try {
      const storeNameClean = (storeConfig?.name || selectedStore?.name || 'Tienda').replace(/\s+/g, '-');
      const fileName = `QR-Pago-${storeNameClean}.png`;

      // Si es Data URL (Base64)
      if (qrImage.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = qrImage;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('¡Imagen QR descargada! Ya puedes subirla en tu app de banco.', 'success');
        return;
      }

      // Si es URL remota, convertir a Blob
      const response = await fetch(qrImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast('¡Imagen QR descargada! Ya puedes subirla en tu app de banco.', 'success');
    } catch (err) {
      console.warn('Descarga directa de QR no permitida por CORS, abriendo enlace:', err);
      const win = window.open(qrImage, '_blank');
      if (win) {
        showToast('Abriendo imagen QR. Mantén presionada la imagen para guardarla.', 'info');
      } else {
        showToast('No se pudo descargar automáticamente. Mantén presionada la imagen para guardarla.', 'warning');
      }
    }
  };

  const handleConfirmAndSendWhatsApp = () => {
    const rawDigits = customerPhone.replace(/[^0-9]/g, '').replace(/^591/, '');
    if (!customerName.trim() || !customerPhone.trim() || rawDigits.length < 7) {
      setStep(1);
      setFormErrors({
        name: !customerName.trim(),
        phone: !customerPhone.trim() || rawDigits.length < 7
      });
      showToast('Por favor completa tu nombre y un teléfono válido para coordinar la entrega.', 'warning');
      return;
    }

    // Actualizar ubicación persistente
    setSelectedLocation({
      condominium: condoName,
      tower,
      apartment,
      notes
    });

    // 1. Crear el pedido en el sistema (registra en Supabase/estado, actualiza inventario e inicia tracking)
    const newOrder = createCustomerOrder({
      name: customerName,
      phone: customerPhone,
      condominium: condoName,
      tower,
      apartment,
      notes,
      deliveryType: effectiveDeliveryType,
      paymentMethod,
      cashChangeFor: paymentMethod === 'cash' ? parseFloat(cashAmount) : null
    });

    // 2. Extraer número de WhatsApp / Teléfono del dueño de la tienda
    const foundStore = stores?.find(s => s.slug === tenantSlug || s.id === tenantSlug);
    const rawOwnerPhone = storeConfig?.whatsapp || storeConfig?.phone || selectedStore?.whatsapp || selectedStore?.phone || foundStore?.whatsapp || foundStore?.phone || '';
    let cleanWa = rawOwnerPhone.replace(/[^0-9]/g, '');

    // Si tiene 8 dígitos (celulares en Bolivia), anteponer código país 591
    if (cleanWa.length === 8) {
      cleanWa = `591${cleanWa}`;
    }

    if (cleanWa && cleanWa.length >= 8) {
      const orderNum = newOrder?.id || `PED-${Date.now().toString().slice(-4)}`;
      const storeDisplayName = storeConfig?.name || selectedStore?.name || foundStore?.name || 'la tienda';
      const itemsList = cart.map(i => `• ${i.quantity}x ${i.name} (${currency} ${(i.price * i.quantity).toFixed(2)})`).join('\n');
      
      const deliveryDetails = effectiveDeliveryType === 'delivery'
        ? `📍 *Modalidad:* Delivery a domicilio\n   *Condominio:* ${condoName}\n   *Sector/Torre:* ${tower}\n   *Nº/Depto:* ${apartment}${notes ? `\n   *Indicaciones:* ${notes}` : ''}`
        : `🛍️ *Modalidad:* Retiro en Tienda`;

      let waText = '';

      if (paymentMethod === 'cash') {
        const cashPayAmount = parseFloat(cashAmount) || 0;
        const paymentLines = [
          `💳 *Forma de Pago:* Efectivo (${effectiveDeliveryType === 'pickup' ? 'Pagar al Recoger en Caja' : 'Pagar contra entrega'})`
        ];
        if (cashPayAmount > 0) {
          paymentLines.push(`💵 *Pagaré con:* ${currency} ${cashPayAmount.toFixed(2)}`);
          if (cashPayAmount > finalTotal) {
            paymentLines.push(`🪙 *Vuelto a entregarme en caja:* ${currency} ${changeToReturn}`);
          }
        }

        waText = `¡Hola *${storeDisplayName}*! Quiero realizar el siguiente pedido para pagar en *Efectivo* al ${effectiveDeliveryType === 'pickup' ? 'recoger en el local' : 'recibir a domicilio'}:\n\n` +
          `📦 *PEDIDO #${orderNum}*\n` +
          `👤 *Cliente:* ${customerName}\n` +
          `📱 *Mi Teléfono:* ${customerPhone}\n` +
          `${deliveryDetails}\n` +
          `${paymentLines.join('\n')}\n` +
          (newOrder && newOrder.discount > 0 ? `🎟️ *Cupón Canjeado:* -${currency} ${newOrder.discount.toFixed(2)}\n` : '') +
          `\n` +
          `📋 *DETALLE DE LA LISTA DE COMPRA:*\n${itemsList}\n\n` +
          `💰 *TOTAL A PAGAR:* ${currency} ${(newOrder?.total || finalTotal).toFixed(2)}\n\n` +
          (effectiveDeliveryType === 'pickup'
            ? `🛒 _Por favor preparar mi lista de compra para pasar a recogerla y pagar en caja. ¡Muchas gracias!_`
            : `🛵 _Por favor confirmar mi pedido para enviarlo a mi domicilio. ¡Muchas gracias!_`);
      } else if (paymentMethod === 'card') {
        waText = `¡Hola *${storeDisplayName}*! Quiero realizar el siguiente pedido para pagar con *Tarjeta en Tienda (POS)*:\n\n` +
          `📦 *PEDIDO #${orderNum}*\n` +
          `👤 *Cliente:* ${customerName}\n` +
          `📱 *Mi Teléfono:* ${customerPhone}\n` +
          `${deliveryDetails}\n` +
          `💳 *Forma de Pago:* Tarjeta en Tienda (POS)\n` +
          (newOrder && newOrder.discount > 0 ? `🎟️ *Cupón Canjeado:* -${currency} ${newOrder.discount.toFixed(2)}\n` : '') +
          `\n` +
          `📋 *DETALLE DE LA LISTA DE COMPRA:*\n${itemsList}\n\n` +
          `💰 *TOTAL A PAGAR:* ${currency} ${(newOrder?.total || finalTotal).toFixed(2)}\n\n` +
          `💳 _Por favor preparar mi lista de compra para pasar a pagar con tarjeta y recogerla. ¡Muchas gracias!_`;
      } else {
        // QR Digital
        waText = `¡Hola *${storeDisplayName}*! Acabo de realizar el pago por *QR Digital* de mi pedido y adjunto mi comprobante para verificación:\n\n` +
          `📦 *PEDIDO #${orderNum}*\n` +
          `👤 *Cliente:* ${customerName}\n` +
          `📱 *Mi Teléfono:* ${customerPhone}\n` +
          `${deliveryDetails}\n` +
          `💳 *Forma de Pago:* Transferencia / QR Digital\n` +
          (newOrder && newOrder.discount > 0 ? `🎟️ *Cupón Canjeado:* -${currency} ${newOrder.discount.toFixed(2)}\n` : '') +
          `\n` +
          `📋 *DETALLE DEL PEDIDO:*\n${itemsList}\n\n` +
          `💰 *TOTAL PAGADO:* ${currency} ${(newOrder?.total || finalTotal).toFixed(2)}\n\n` +
          `📎 _(Adjunto imagen/captura de mi comprobante a continuación)_ 👇`;
      }

      const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waText)}`;
      
      showToast('¡Pedido registrado con éxito! Abriendo chat de WhatsApp...', 'success');
      window.open(waUrl, '_blank');
    } else {
      showToast('¡Pedido registrado en el sistema! (Aviso: La tienda aún no ha configurado su número de WhatsApp).', 'warning');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Indicador de Pasos */}
        <div className="p-4 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-700">
              Paso {step} de 2
            </span>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight">
              {step === 1 
                ? (effectiveDeliveryType === 'delivery' ? 'Dirección y Entrega' : 'Confirmar Pedido (Retiro en Tienda)') 
                : 'Método de Pago'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Informativo de Tienda Oficial o Demostración */}
        {!isOfficialStore ? (
          <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-b border-amber-500/25 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 text-amber-950 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span><strong className="font-bold text-amber-900">Modo Demostración:</strong> Estás probando la experiencia de compra de muestra.</span>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 font-black text-[10px] tracking-wide uppercase shrink-0">
              Simulador
            </span>
          </div>
        ) : (
          <div className="bg-emerald-50/90 border-b border-emerald-100 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Comprando en: <strong className="font-extrabold text-emerald-900">{storeDisplayName}</strong></span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black text-[10px] tracking-wide uppercase shrink-0">
              <Store className="w-3 h-3 text-emerald-700" />
              Tienda Oficial
            </span>
          </div>
        )}

        {/* Contenido del Checkout */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1">
          {step === 1 ? (
            /* PASO 1: ENTREGA Y DIRECCIÓN */
            <div className="space-y-6">
              {/* Selector de Tipo de Entrega */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2.5">
                  ¿Cómo deseas recibir tu pedido?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {isDeliveryEnabled ? (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        effectiveDeliveryType === 'delivery'
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${effectiveDeliveryType === 'delivery' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black text-emerald-700">
                          {finalDeliveryFee === 0 ? 'GRATIS' : `+${currency} ${actualDeliveryFee.toFixed(2)}`}
                        </span>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">Envío a Domicilio</p>
                        <p className="text-[11px] text-slate-500 font-medium">Llega a tu puerta en {currentCondoObj?.estTime || '15 min'}</p>
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 opacity-60 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-slate-200 text-slate-400">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">No disponible</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-500 text-sm">Envío a Domicilio</p>
                        <p className="text-[11px] text-slate-400 font-medium">Desactivado por la tienda</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      effectiveDeliveryType === 'pickup'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${effectiveDeliveryType === 'pickup' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-emerald-700">{currency} 0.00</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">Retiro en Tienda</p>
                      <p className="text-[11px] text-slate-500 font-medium">Listo en el local en 5-10 min</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Datos de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: false }));
                    }}
                    placeholder="Ej. Valeria Soto"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm focus:outline-hidden transition-all ${
                      formErrors.name 
                        ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20' 
                        : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      Por favor escribe tu nombre completo
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => {
                      handlePhoneChange(e);
                      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: false }));
                    }}
                    placeholder="+591 12345678"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm focus:outline-hidden transition-all ${
                      formErrors.phone 
                        ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20' 
                        : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      Ingresa tu número de teléfono o WhatsApp
                    </p>
                  )}
                </div>
              </div>

              {/* Campos de Ubicación Hiperlocal */}
              {deliveryType === 'delivery' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Ubicación exacta en el condominio o barrio:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Condominio / Sector</label>
                      <select
                        value={condoName}
                        onChange={(e) => {
                          setCondoName(e.target.value);
                          const condo = storeConfig.condominiums.find(c => c.name === e.target.value);
                          if (condo && condo.towers.length > 0) {
                            setTower(condo.towers[0]);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        {condominiums.map(c => (
                          <option key={c.id} value={c.name}>{c.name} ({currency} {c.deliveryFee.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Torre / Sector</label>
                      <select
                        value={tower}
                        onChange={(e) => setTower(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        {currentCondoObj?.towers.map((t, idx) => (
                          <option key={idx} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Número de Casa o Departamento</label>
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder="Ej. Depto 402 / Casa 15"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Indicaciones especiales (opcional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej. Dejar con conserje, o timbrar 2 veces."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Advertencia de Pedido Mínimo para Delivery */}
              {isBelowMinOrder && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Pedido mínimo de delivery: {currency} {minOrder.toFixed(2)}</span>
                    <span className="text-[11px] text-amber-800">
                      Tu subtotal actual es {currency} {cartSubtotal.toFixed(2)}. Te faltan <strong>{currency} {missingToMinOrder.toFixed(2)}</strong> para cumplir con la condición de entrega a domicilio, o puedes seleccionar arriba la opción <strong>"Retiro en Tienda"</strong> sin mínimo.
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToPayment}
                className={`w-full py-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isBelowMinOrder 
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' 
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                <span>Continuar al Pago ({currency} {finalTotal.toFixed(2)})</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            /* PASO 2: MÉTODO DE PAGO Y CONFIRMACIÓN */
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2.5">
                  Selecciona tu forma de pago favorita:
                </label>
                <div className="space-y-2.5">
                  
                  {/* Opción 1: Efectivo */}
                  <div 
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {effectiveDeliveryType === 'pickup' ? 'Efectivo en Caja' : 'Efectivo contra entrega'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {effectiveDeliveryType === 'pickup' ? 'Paga en caja al recoger en la tienda' : 'Paga al recibir en tu puerta'}
                        </p>
                      </div>
                    </div>

                    {paymentMethod === 'cash' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          {effectiveDeliveryType === 'pickup' ? '¿Con cuánto pagarás en caja? (Para tu vuelto listo):' : '¿Con cuánto pagarás? (Para tu vuelto exacto):'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-500">Bs.</span>
                          <input
                            type="number"
                            step="1.0"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            className="w-20 px-2 py-1 rounded-lg border border-slate-300 font-black text-right text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Opción 2: QR / Transferencia */}
                  <div 
                    onClick={() => setPaymentMethod('qr')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'qr'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${paymentMethod === 'qr' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">Transferencia / QR Digital</p>
                        <p className="text-[11px] text-slate-500">Transfiere de inmediato al código QR de la tienda</p>
                      </div>
                    </div>

                    {paymentMethod === 'qr' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs space-y-2.5 bg-white p-3.5 rounded-2xl border border-slate-200">
                        {qrImage ? (
                          <div className="flex flex-col items-center text-center pb-2.5 border-b border-slate-100">
                            <p className="text-[11px] font-bold text-slate-700 mb-1.5">Escanea este Código QR para Pagar:</p>
                            <img 
                              src={qrImage} 
                              alt="Código QR de Cobro" 
                              className="w-48 h-48 object-contain rounded-2xl border-2 border-amber-300 shadow-sm p-1.5 bg-white" 
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadQr();
                              }}
                              className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                              title="Descargar imagen QR en tu teléfono para subirla en tu app de banco"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Descargar Imagen QR</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                            <p className="text-[11px] font-bold text-amber-900">Escanea el código QR de cobro de la tienda o transfiere a la cuenta:</p>
                          </div>
                        )}
                        {(bankDetails.bank || bankDetails.accountNumber) && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800">{bankDetails.bank}</span>
                              <button
                                type="button"
                                onClick={handleCopyBankInfo}
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedBank ? '¡Copiado!' : 'Copiar Datos'}</span>
                              </button>
                            </div>
                            {bankDetails.accountNumber && <p className="text-slate-600 text-[11px]">Cuenta: <strong>{bankDetails.accountNumber}</strong></p>}
                            {bankDetails.holder && <p className="text-slate-600 text-[11px]">Titular: {bankDetails.holder}</p>}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Opción 3: Tarjeta POS */}
                  <div 
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${paymentMethod === 'card' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {effectiveDeliveryType === 'pickup' ? 'Tarjeta en Tienda (POS)' : 'Tarjeta (POS Inalámbrico)'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {effectiveDeliveryType === 'pickup' ? 'Paga al recoger de la tienda' : 'Llevamos el lector de tarjeta a tu puerta'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen Final de Compra */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Productos ({cart.reduce((a, b) => a + b.quantity, 0)} unidades):</span>
                  <span className="font-bold">{currency} {cartSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Entrega ({deliveryType === 'delivery' ? `Delivery en ${condoName}` : 'Retiro en Tienda'}):</span>
                  <span className="font-bold text-slate-900">
                    {finalDeliveryFee === 0 ? 'GRATIS' : `${currency} ${finalDeliveryFee.toFixed(2)}`}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Descuento VeciPuntos:</span>
                    <span>-{currency} {appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total Final:</span>
                  <span className="text-lg font-black text-emerald-700">{currency} {finalTotal.toFixed(2)}</span>
                </div>

                {paymentMethod === 'cash' && parseFloat(cashAmount) > finalTotal && (
                  <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg font-bold flex justify-between">
                    <span>{effectiveDeliveryType === 'pickup' ? 'Vuelto a entregarte en caja:' : 'Vuelto que llevará el repartidor:'}</span>
                    <span>{currency} {changeToReturn}</span>
                  </div>
                )}

                {storeConfig.enablePoints !== false && cartSubtotal > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>VeciPuntos que acumularás:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black">
                      +{Math.round(cartSubtotal * (storeConfig.pointsRatio || 1))} pts
                    </span>
                  </div>
                )}
              </div>

              {/* Botones de Navegación y Confirmación */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver</span>
                  </button>

                  {(() => {
                    let mainText = 'Ya pagué';
                    let subText = 'Enviar comprobante para verificación';
                    let buttonTitle = 'Registrar pedido y enviar comprobante a la tienda por WhatsApp';

                    if (paymentMethod === 'cash') {
                      mainText = effectiveDeliveryType === 'delivery' ? 'Pagar contra Entrega' : 'Pagar al Recoger';
                      subText = 'Enviar lista de compra';
                      buttonTitle = 'Registrar pedido y enviar lista de compra a la tienda por WhatsApp';
                    } else if (paymentMethod === 'card') {
                      mainText = effectiveDeliveryType === 'delivery' ? 'Pagar con Tarjeta al Recibir' : 'Pagar al Recoger';
                      subText = 'Enviar lista de compra';
                      buttonTitle = 'Registrar pedido y coordinar pago con tarjeta por WhatsApp';
                    }

                    return (
                      <button
                        type="button"
                        onClick={handleConfirmAndSendWhatsApp}
                        className="flex-1 py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black shadow-lg shadow-emerald-600/30 hover:scale-[1.01] active:scale-99 transition-all flex items-center justify-center cursor-pointer text-center"
                        title={buttonTitle}
                      >
                        <div className="flex items-center justify-center gap-2.5">
                          <MessageCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 text-white fill-white/20" />
                          <div className="text-left sm:text-center leading-tight">
                            <span className="block text-sm sm:text-base font-black tracking-wide">
                              {mainText}
                            </span>
                            <span className="block text-[10.5px] sm:text-xs font-semibold text-emerald-100 opacity-95 mt-0.5">
                              {subText}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
