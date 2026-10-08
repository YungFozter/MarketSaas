import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  Crosshair,
  Navigation,
  CloudRain,
  Bike,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { calculateDistanceKm, calculateDeliveryFee, MAX_DELIVERY_DISTANCE_KM, RAIN_SURCHARGE_BS } from '../../utils/deliveryFeeUtils';
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
    tenantSlug,
    storeOpenStatus
  } = useStore();

  const isOfficialStore = Boolean(
    (tenantSlug && tenantSlug !== 'default') ||
    (selectedStore && selectedStore.id && selectedStore.id !== 'default')
  );
  const storeDisplayName = storeConfig?.name || selectedStore?.name || 'Mi Tienda';
  const currency = storeConfig?.currencySymbol || 'Bs.';

  const [step, setStep] = useState(1); // 1: Dirección y Entrega, 2: Método de Pago
  const isDeliveryEnabled = storeConfig?.enableDelivery !== false;
  const [deliveryType, setDeliveryType] = useState(isDeliveryEnabled ? 'delivery' : 'pickup'); // 'delivery' | 'pickup'

  const effectiveDeliveryType = isDeliveryEnabled ? deliveryType : 'pickup';

  // Datos del cliente
  const [customerName, setCustomerName] = useState(storedCustomerName || '');
  const [customerPhone, setCustomerPhone] = useState(storedCustomerPhone || '');
  const [formErrors, setFormErrors] = useState({ name: false, phone: false, address: false });

  // Ubicación y dirección de entrega
  const [address, setAddress] = useState(selectedLocation?.address || '');
  const [reference, setReference] = useState(selectedLocation?.reference || '');
  const [notes, setNotes] = useState(selectedLocation?.notes || '');
  const [clientLat, setClientLat] = useState(selectedLocation?.latitude ?? null);
  const [clientLng, setClientLng] = useState(selectedLocation?.longitude ?? null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Método de pago
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qr' | 'card'
  const [cashAmount, setCashAmount] = useState('50.00');
  const [copiedBank, setCopiedBank] = useState(false);

  // Coordenadas de la tienda
  const storeLat = (storeConfig?.latitude !== '' && storeConfig?.latitude != null)
    ? parseFloat(storeConfig.latitude)
    : (storeConfig?.googleMapsCoordinates?.lat != null ? parseFloat(storeConfig.googleMapsCoordinates.lat) : null);
  const storeLng = (storeConfig?.longitude !== '' && storeConfig?.longitude != null)
    ? parseFloat(storeConfig.longitude)
    : (storeConfig?.googleMapsCoordinates?.lng != null ? parseFloat(storeConfig.googleMapsCoordinates.lng) : null);

  // Distancia calculada en Km
  const distanceKm = useMemo(() => {
    if (storeLat != null && storeLng != null && clientLat != null && clientLng != null) {
      return calculateDistanceKm(storeLat, storeLng, clientLat, clientLng);
    }
    if (selectedLocation?.distanceKm != null) {
      return parseFloat(selectedLocation.distanceKm);
    }
    return null;
  }, [storeLat, storeLng, clientLat, clientLng, selectedLocation?.distanceKm]);

  // Cotización de motodelivery
  const deliveryQuote = useMemo(() => {
    return calculateDeliveryFee(distanceKm, {
      isRaining: Boolean(storeConfig?.isRainActive)
    });
  }, [distanceKm, storeConfig?.isRainActive]);

  // Pedido Mínimo para Delivery
  const minOrder = Number(storeConfig?.minDeliveryOrder ?? storeConfig?.minOrder ?? 0);
  const isBelowMinOrder = effectiveDeliveryType === 'delivery' && minOrder > 0 && cartSubtotal < minOrder;
  const missingToMinOrder = Math.max(0, Math.round((minOrder - cartSubtotal) * 100) / 100);

  // Envío Gratuito por umbral de compra
  const isFreeDelivery = !isDeliveryEnabled || (storeConfig?.freeDeliveryThreshold > 0 && cartSubtotal >= storeConfig.freeDeliveryThreshold);

  // Tarifa final efectiva aplicada
  const finalDeliveryFee = effectiveDeliveryType === 'delivery'
    ? (isFreeDelivery ? 0 : (deliveryQuote.isWithinRange ? deliveryQuote.fee : (actualDeliveryFee || 10.0)))
    : 0;

  const finalTotal = Math.max(0, cartSubtotal + finalDeliveryFee - (appliedCoupon ? appliedCoupon.discount : 0));
  const changeToReturn = parseFloat(cashAmount) > finalTotal ? (parseFloat(cashAmount) - finalTotal).toFixed(2) : '0.00';

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (storedCustomerName) setCustomerName(storedCustomerName);
      if (storedCustomerPhone) setCustomerPhone(storedCustomerPhone);
      if (selectedLocation?.address) setAddress(selectedLocation.address);
      if (selectedLocation?.reference) setReference(selectedLocation.reference);
      if (selectedLocation?.notes) setNotes(selectedLocation.notes);
      if (selectedLocation?.latitude) setClientLat(selectedLocation.latitude);
      if (selectedLocation?.longitude) setClientLng(selectedLocation.longitude);
      setFormErrors({ name: false, phone: false, address: false });
    }
  }, [isOpen, storedCustomerName, storedCustomerPhone, selectedLocation]);

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (!val || ['+', '+5', '+59', '+591', '+591 '].includes(val.trim())) {
      setCustomerPhone('');
      return;
    }
    let digits = val.replace(/[^0-9]/g, '');
    if (digits.startsWith('591')) {
      digits = digits.slice(3);
    }
    digits = digits.slice(0, 8);
    if (digits.length > 0) {
      setCustomerPhone(`+591 ${digits}`);
    } else {
      setCustomerPhone('');
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador o dispositivo no admite geolocalización GPS.', 'error');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setClientLat(lat);
        setClientLng(lng);

        let calculatedKm = null;
        if (storeLat != null && storeLng != null) {
          calculatedKm = calculateDistanceKm(storeLat, storeLng, lat, lng);
        }

        setSelectedLocation(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          distanceKm: calculatedKm
        }));

        if (calculatedKm != null) {
          if (calculatedKm > MAX_DELIVERY_DISTANCE_KM) {
            showToast(`Ubicación GPS detectada (${calculatedKm.toFixed(1)} km). Excede el radio de 18 km para motos.`, 'warning');
          } else {
            showToast(`¡Ubicación detectada! Distancia a la tienda: ${calculatedKm.toFixed(1)} km`, 'success');
          }
        } else {
          showToast('Ubicación GPS guardada correctamente.', 'success');
        }
      },
      (err) => {
        setIsDetectingGps(false);
        console.warn('Geolocation error:', err);
        showToast('No se pudo obtener la ubicación GPS automática. Por favor escribe tu dirección en el campo de texto.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleProceedToPayment = () => {
    let hasError = false;
    const newErrors = { name: false, phone: false, address: false };

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

    if (effectiveDeliveryType === 'delivery') {
      if (!address.trim()) {
        newErrors.address = true;
        hasError = true;
        showToast('Por favor escribe tu dirección exacta de entrega.', 'warning');
      }

      if (isBelowMinOrder) {
        showToast(`El pedido mínimo para delivery es de ${currency} ${minOrder.toFixed(2)}. Agrega ${currency} ${missingToMinOrder.toFixed(2)} más o elige retiro en tienda.`, 'warning');
        return;
      }

      if (distanceKm != null && distanceKm > MAX_DELIVERY_DISTANCE_KM) {
        showToast(`Tu ubicación (${distanceKm.toFixed(1)} km) supera el radio máximo de 18 km para motodelivery. Por favor elige Retiro en Tienda.`, 'warning');
        return;
      }
    }

    if (hasError) {
      setFormErrors(newErrors);
      return;
    }

    setFormErrors({ name: false, phone: false, address: false });
    setStep(2);
  };

  if (!isOpen || cart.length === 0) return null;

  const qrImage = storeConfig?.qrImageUrl || selectedStore?.qrImageUrl || '';
  const rawBank = storeConfig?.bankDetails || selectedStore?.bankDetails;
  const hasValidBankDetails = Boolean(
    rawBank &&
    rawBank.accountNumber &&
    rawBank.accountNumber !== '1000-2495-8120' &&
    rawBank.holder !== 'Minimarket Saas S.R.L.'
  );
  const bankDetails = hasValidBankDetails ? rawBank : null;

  const handleCopyBankAccount = () => {
    if (!bankDetails?.accountNumber) return;
    navigator.clipboard.writeText(bankDetails.accountNumber);
    setCopiedBank(true);
    showToast('Número de cuenta copiado al portapapeles', 'success');
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleDownloadQr = async () => {
    if (!qrImage) return;
    try {
      const response = await fetch(qrImage, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `QR_Cobro_${storeDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
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
        phone: !customerPhone.trim() || rawDigits.length < 7,
        address: effectiveDeliveryType === 'delivery' && !address.trim()
      });
      showToast('Por favor completa tu nombre y un teléfono válido para coordinar la entrega.', 'warning');
      return;
    }

    if (effectiveDeliveryType === 'delivery' && !address.trim()) {
      setStep(1);
      setFormErrors(prev => ({ ...prev, address: true }));
      showToast('Por favor escribe tu dirección exacta de entrega.', 'warning');
      return;
    }

    // Actualizar ubicación persistente
    setSelectedLocation({
      address: address.trim(),
      reference: reference.trim(),
      latitude: clientLat,
      longitude: clientLng,
      distanceKm,
      notes: notes.trim()
    });

    const isPickup = effectiveDeliveryType === 'pickup';

    // 1. Crear el pedido en el sistema
    const newOrder = createCustomerOrder({
      name: customerName,
      phone: customerPhone,
      address: isPickup ? 'Retiro en Tienda' : address.trim(),
      reference: isPickup ? 'Mostrador' : reference.trim(),
      notes: notes.trim(),
      latitude: clientLat,
      longitude: clientLng,
      distanceKm: isPickup ? 0 : distanceKm,
      deliveryFee: finalDeliveryFee,
      deliveryType: effectiveDeliveryType,
      paymentMethod,
      cashChangeFor: paymentMethod === 'cash' ? parseFloat(cashAmount) : null
    });

    // 2. Extraer número de WhatsApp / Teléfono de la tienda
    const foundStore = stores?.find(s => s.slug === tenantSlug || s.id === tenantSlug);
    const rawOwnerPhone = storeConfig?.whatsapp || storeConfig?.phone || selectedStore?.whatsapp || selectedStore?.phone || foundStore?.whatsapp || foundStore?.phone || '';
    let cleanWa = rawOwnerPhone.replace(/[^0-9]/g, '');

    if (cleanWa.length === 8) {
      cleanWa = `591${cleanWa}`;
    }

    if (cleanWa && cleanWa.length >= 8) {
      const orderNum = newOrder?.id || `PED-${Date.now().toString().slice(-4)}`;
      const itemsList = cart.map(i => `• ${i.quantity}x ${i.name} (${currency} ${(i.price * i.quantity).toFixed(2)})`).join('\n');

      let deliveryDetails = '';
      if (effectiveDeliveryType === 'delivery') {
        deliveryDetails = `📍 *Modalidad:* Envío a Domicilio (Motodelivery)\n   *Dirección:* ${address.trim()}\n   *Referencia:* ${reference.trim() || 'Sin referencia adicional'}`;
        if (distanceKm != null) {
          deliveryDetails += `\n   *Distancia:* ${distanceKm.toFixed(1)} km`;
        }
        deliveryDetails += `\n   *Costo Envío:* ${finalDeliveryFee === 0 ? 'GRATIS' : `${currency} ${finalDeliveryFee.toFixed(2)}`}`;
        if (storeConfig?.isRainActive) {
          deliveryDetails += ` (Incluye recargo de lluvia)`;
        }
        if (clientLat != null && clientLng != null) {
          deliveryDetails += `\n   *Ubicación GPS:* https://www.google.com/maps/search/?api=1&query=${clientLat},${clientLng}`;
        }
        if (notes.trim()) {
          deliveryDetails += `\n   *Notas:* ${notes.trim()}`;
        }
      } else {
        deliveryDetails = `🛍️ *Modalidad:* Retiro en Tienda (Paso por el local)\n   *Ubicación Local:* ${storeConfig?.address || 'Dirección de la tienda'}\n   *Costo Envío:* GRATIS (Bs. 0.00)`;
      }

      let waText = '';
      if (paymentMethod === 'cash') {
        const cashPayAmount = parseFloat(cashAmount) || 0;
        const paymentLines = [
          `💳 *Forma de Pago:* Efectivo (${effectiveDeliveryType === 'pickup' ? 'Pagar al Recoger en Caja' : 'Pagar contra entrega'})`
        ];
        if (cashPayAmount > 0) {
          paymentLines.push(`💵 *Pagaré con:* ${currency} ${cashPayAmount.toFixed(2)}`);
          if (cashPayAmount > finalTotal) {
            paymentLines.push(`🪙 *Vuelto a entregarme:* ${currency} ${changeToReturn}`);
          }
        }

        waText = `🛒 *NUEVO PEDIDO #${orderNum}*\n🏪 *Tienda:* ${storeDisplayName}\n\n👤 *Cliente:* ${customerName}\n📱 *Teléfono:* ${customerPhone}\n\n${deliveryDetails}\n\n${paymentLines.join('\n')}\n\n📦 *Productos:* \n${itemsList}\n\n💰 *Subtotal:* ${currency} ${cartSubtotal.toFixed(2)}${appliedCoupon ? `\n🏷 *Cupón Descuento:* -${currency} ${appliedCoupon.discount.toFixed(2)} (${appliedCoupon.code})` : ''}\n🛵 *Envío:* ${finalDeliveryFee === 0 ? 'GRATIS' : `${currency} ${finalDeliveryFee.toFixed(2)}`}\n💵 *TOTAL FINAL:* ${currency} ${finalTotal.toFixed(2)}`;
      } else if (paymentMethod === 'qr') {
        waText = `🛒 *NUEVO PEDIDO #${orderNum}*\n🏪 *Tienda:* ${storeDisplayName}\n\n👤 *Cliente:* ${customerName}\n📱 *Teléfono:* ${customerPhone}\n\n${deliveryDetails}\n\n📱 *Forma de Pago:* Transferencia QR Digital\n✨ *Estado Pago:* Adjunto mi comprobante de pago por este medio\n\n📦 *Productos:* \n${itemsList}\n\n💰 *Subtotal:* ${currency} ${cartSubtotal.toFixed(2)}${appliedCoupon ? `\n🏷 *Cupón Descuento:* -${currency} ${appliedCoupon.discount.toFixed(2)} (${appliedCoupon.code})` : ''}\n🛵 *Envío:* ${finalDeliveryFee === 0 ? 'GRATIS' : `${currency} ${finalDeliveryFee.toFixed(2)}`}\n💵 *TOTAL PAGADO:* ${currency} ${finalTotal.toFixed(2)}`;
      } else {
        waText = `🛒 *NUEVO PEDIDO #${orderNum}*\n🏪 *Tienda:* ${storeDisplayName}\n\n👤 *Cliente:* ${customerName}\n📱 *Teléfono:* ${customerPhone}\n\n${deliveryDetails}\n\n💳 *Forma de Pago:* Tarjeta Débito/Crédito (POS Móvil)\n\n📦 *Productos:* \n${itemsList}\n\n💰 *Subtotal:* ${currency} ${cartSubtotal.toFixed(2)}${appliedCoupon ? `\n🏷 *Cupón Descuento:* -${currency} ${appliedCoupon.discount.toFixed(2)} (${appliedCoupon.code})` : ''}\n🛵 *Envío:* ${finalDeliveryFee === 0 ? 'GRATIS' : `${currency} ${finalDeliveryFee.toFixed(2)}`}\n💵 *TOTAL FINAL:* ${currency} ${finalTotal.toFixed(2)}`;
      }

      const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                title="Volver al paso anterior"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {step === 1 ? 'Finalizar Pedido' : 'Método de Pago'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Paso {step} de 2
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {step === 1 ? 'Elige modalidad y dirección de entrega' : 'Selecciona cómo deseas pagar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {step === 1 ? (
            /* PASO 1: MODALIDAD Y DIRECCIÓN */
            <div className="space-y-4">
              {/* Selector de Modalidad: Delivery vs Retiro */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  ¿Cómo deseas recibir tu compra?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {isDeliveryEnabled ? (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${effectiveDeliveryType === 'delivery'
                          ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${effectiveDeliveryType === 'delivery' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-xs font-black text-emerald-700">
                          {finalDeliveryFee === 0 ? 'GRATIS' : `+${currency} ${finalDeliveryFee.toFixed(2)}`}
                        </span>
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">Envío a Domicilio</p>
                        <p className="text-[11px] text-slate-500 font-medium">Motodelivery a tu puerta</p>
                      </div>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 opacity-60 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-xl bg-slate-200 text-slate-400">
                          <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">No disponible</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-500 text-xs sm:text-sm">Envío a Domicilio</p>
                        <p className="text-[11px] text-slate-400 font-medium">Solo retiro en tienda</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${effectiveDeliveryType === 'pickup'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl ${effectiveDeliveryType === 'pickup' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-xs font-black text-emerald-700">GRATIS</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm">Retiro en Tienda</p>
                      <p className="text-[11px] text-slate-500 font-medium">Pasa a recoger al local</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm focus:outline-hidden transition-all ${formErrors.name
                        ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
                        : 'border-slate-200 focus:border-emerald-500'
                      }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      Escribe tu nombre completo
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
                    placeholder="+591 71234567"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm focus:outline-hidden transition-all ${formErrors.phone
                        ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
                        : 'border-slate-200 focus:border-emerald-500'
                      }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      Ingresa tu celular o WhatsApp
                    </p>
                  )}
                </div>
              </div>

              {/* Si es RETIRO EN TIENDA: Mostrar ubicación del local */}
              {effectiveDeliveryType === 'pickup' && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-extrabold text-xs sm:text-sm">Retiro directo en la tienda física</span>
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Prepararemos tu pedido para que solo pases por el mostrador a retirarlo:
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200/80 text-xs font-bold text-slate-800 space-y-1">
                    <p className="flex items-center gap-1.5 text-emerald-800">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{storeConfig?.address || 'Dirección de la tienda en Santa Cruz'}</span>
                    </p>
                    {storeConfig?.reference && (
                      <p className="text-[11px] text-slate-500 font-medium pl-5">
                        Ref: {storeConfig.reference}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-700">
                    * Sin costo adicional de envío (Bs. 0.00). Te avisaremos por WhatsApp cuando esté listo.
                  </p>
                </div>
              )}

              {/* Si es ENVÍO A DOMICILIO: Dirección exacta y GPS */}
              {effectiveDeliveryType === 'delivery' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Dirección de Entrega a Domicilio</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={isDetectingGps}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
                      title="Detectar coordenadas GPS exactas para calcular tarifa precisa"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                      <span>{isDetectingGps ? 'Detectando...' : 'Detectar mi GPS'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Calle, Avenida y Número de Casa / Puerta *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (formErrors.address) setFormErrors(prev => ({ ...prev, address: false }));
                      }}
                      placeholder="Ej. Av. Las Palmas #240, entre 3er y 4to anillo"
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium bg-white focus:outline-hidden ${
                        formErrors.address ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20' : 'border-slate-200 focus:border-emerald-500'
                      }`}
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        Ingresa tu dirección de entrega
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Punto de Referencia
                      </label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Ej. Portón negro frente a la plaza"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Indicaciones para el Repartidor
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej. Timbre no funciona, llamar al llegar"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Badge de Cotización de Distancia y Tarifa de Moto */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Bike className="w-4 h-4 text-emerald-600" />
                        <span>Flete de Motodelivery:</span>
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {finalDeliveryFee === 0 ? 'GRATIS' : `${currency} ${finalDeliveryFee.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-1">
                      <span>
                        {distanceKm != null 
                          ? `Distancia en ruta: ~${distanceKm.toFixed(1)} km` 
                          : 'Distancia estimada (fija tu GPS para cálculo exacto)'}
                      </span>
                      {storeConfig?.isRainActive && (
                        <span className="text-blue-700 font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <CloudRain className="w-3 h-3" />
                          <span>Incluye +Bs. 5 por lluvia</span>
                        </span>
                      )}
                    </div>

                    {distanceKm != null && distanceKm > MAX_DELIVERY_DISTANCE_KM && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>Tu ubicación ({distanceKm.toFixed(1)} km) supera el radio de cobertura de 18 km. Por favor elige Retiro en Tienda.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Advertencia de Pedido Mínimo para Delivery */}
              {isBelowMinOrder && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Pedido mínimo para delivery: {currency} {minOrder.toFixed(2)}</span>
                    <span className="text-[11px] text-amber-800">
                      Tu compra actual es de {currency} {cartSubtotal.toFixed(2)}. Te faltan <strong>{currency} {missingToMinOrder.toFixed(2)}</strong> para habilitar el envío a domicilio, o puedes elegir arriba la opción <strong>"Retiro en Tienda"</strong> sin mínimo.
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToPayment}
                className={`w-full py-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${isBelowMinOrder
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
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2.5">
                  Selecciona tu forma de pago:
                </label>
                <div className="space-y-2.5">
                  {/* Opción 1: Efectivo */}
                  <div
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'cash'
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
                          {effectiveDeliveryType === 'pickup' ? 'Pagas al recoger tu pedido en el local' : 'Pagas al recibir el pedido en tu puerta'}
                        </p>
                      </div>
                    </div>

                    {paymentMethod === 'cash' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-700 shrink-0">¿Con cuánto pagarás?</label>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{currency}</span>
                          <input
                            type="number"
                            step="5"
                            min={finalTotal}
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder={finalTotal.toFixed(2)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Opción 2: QR Digital */}
                  <div
                    onClick={() => setPaymentMethod('qr')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'qr'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${paymentMethod === 'qr' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">Transferencia Simple QR</p>
                        <p className="text-[11px] text-slate-500">Pagas con QR desde cualquier banco boliviano</p>
                      </div>
                    </div>

                    {paymentMethod === 'qr' && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-3">
                        {qrImage ? (
                          <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 text-center space-y-2.5">
                            <img src={qrImage} alt="QR de Cobro" className="w-36 h-36 mx-auto object-contain rounded-xl border border-slate-100" />
                            <p className="text-[11px] font-bold text-slate-700">Escanea o descarga el código QR oficial de la tienda</p>
                            <button
                              type="button"
                              onClick={handleDownloadQr}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold inline-flex items-center gap-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Descargar Imagen QR</span>
                            </button>
                          </div>
                        ) : (
                          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                            La tienda te enviará el código QR actualizado por WhatsApp al confirmar.
                          </div>
                        )}

                        {bankDetails && (
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700">{bankDetails.bankName || 'Banco'}</span>
                              <button
                                type="button"
                                onClick={handleCopyBankAccount}
                                className="text-[11px] text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedBank ? 'Copiado' : 'Copiar Cuenta'}</span>
                              </button>
                            </div>
                            <p className="text-[11px] font-mono text-slate-600">{bankDetails.accountNumber}</p>
                            <p className="text-[10px] text-slate-400">Titular: {bankDetails.holder}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Opción 3: Tarjeta POS */}
                  <div
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'card'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${paymentMethod === 'card' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">Tarjeta Débito / Crédito</p>
                        <p className="text-[11px] text-slate-500">
                          {effectiveDeliveryType === 'pickup' ? 'Pagas con lector POS en caja' : 'Llevamos el lector POS a tu domicilio'}
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
                  <span>Entrega ({effectiveDeliveryType === 'delivery' ? 'Motodelivery a Domicilio' : 'Retiro en Tienda'}):</span>
                  <span className="font-bold text-slate-900">
                    {finalDeliveryFee === 0 ? 'GRATIS' : `${currency} ${finalDeliveryFee.toFixed(2)}`}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Descuento cupón:</span>
                    <span>-{currency} {appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total Final:</span>
                  <span className="text-lg font-black text-emerald-700">{currency} {finalTotal.toFixed(2)}</span>
                </div>

                {paymentMethod === 'cash' && parseFloat(cashAmount) > finalTotal && (
                  <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg font-bold flex justify-between">
                    <span>{effectiveDeliveryType === 'pickup' ? 'Vuelto en caja:' : 'Vuelto del repartidor:'}</span>
                    <span>{currency} {changeToReturn}</span>
                  </div>
                )}
              </div>

              {/* Botón de Confirmación por WhatsApp */}
              <button
                type="button"
                onClick={handleConfirmAndSendWhatsApp}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/20 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Confirmar y Enviar Pedido por WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
