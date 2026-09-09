import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Gift, 
  Award, 
  Check, 
  ShieldCheck, 
  Info, 
  Store, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Phone,
  Search,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Edit2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './LoyaltyPointsModal.css';

export const LoyaltyPointsModal = ({ isOpen, onClose }) => {
  const { 
    veciPoints, 
    redeemPoints, 
    appliedCoupon, 
    storeConfig,
    selectedStore,
    customerPhone,
    setCustomerPhone,
    customerName,
    fetchCustomerPoints,
    normalizeCustomerPhone,
    showToast
  } = useStore();

  const [showFaq, setShowFaq] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [inputDigits, setInputDigits] = useState('');
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  const currency = storeConfig?.currencySymbol || 'Bs.';
  const isDeliveryActive = storeConfig?.enableDelivery === true;
  const isPointsEnabled = storeConfig?.enablePoints !== false;
  const pointsRatio = Number(storeConfig?.pointsRatio) || 10;
  const storeDisplayName = storeConfig?.name || selectedStore?.name || 'Mi Tienda';

  // Al abrir el modal, sincronizar el teléfono del cliente y consultar saldo oficial
  useEffect(() => {
    if (isOpen) {
      if (customerPhone) {
        const rawDigits = customerPhone.replace(/\D/g, '').replace(/^591/, '').slice(0, 8);
        setInputDigits(rawDigits);
        setIsEditingPhone(false);
        setIsLoadingPoints(true);
        fetchCustomerPoints(customerPhone).finally(() => {
          setIsLoadingPoints(false);
        });
      } else {
        setIsEditingPhone(true);
        setInputDigits('');
      }
    }
  }, [isOpen, customerPhone]);

  if (!isOpen) return null;

  const handlePhoneInputChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const cleanDigits = rawVal.startsWith('591') ? rawVal.slice(3) : rawVal;
    setInputDigits(cleanDigits.slice(0, 8));
  };

  const handleLookupPhone = async (e) => {
    e?.preventDefault();
    if (!inputDigits || inputDigits.length < 7) {
      showToast('Ingresa un número de celular o WhatsApp válido (mínimo 7 u 8 dígitos).', 'warning');
      return;
    }

    const fullPhone = `+591 ${inputDigits}`;
    setCustomerPhone(fullPhone);
    setIsLoadingPoints(true);
    const balance = await fetchCustomerPoints(fullPhone);
    setIsLoadingPoints(false);
    setIsEditingPhone(false);
    showToast(`Saldo de VeciPuntos consultado para ${fullPhone}.`, 'success');
  };

  const handleRedeemCoupon = async (tier) => {
    if (!isPointsEnabled) {
      showToast('Esta tienda no tiene activo el programa de VeciPuntos.', 'warning');
      return;
    }

    if (!tier.isAvailable) {
      showToast('Este cupón no está disponible para las modalidades activas de la tienda.', 'warning');
      return;
    }

    if (!customerPhone) {
      setIsEditingPhone(true);
      showToast('Ingresa tu número de WhatsApp para canjear tus puntos.', 'warning');
      return;
    }

    if (veciPoints < tier.points) {
      showToast(`Te faltan ${tier.points - veciPoints} puntos para canjear este cupón.`, 'error');
      return;
    }

    const success = await redeemPoints(tier.points, tier.discount, tier.code);
    if (success) {
      onClose();
    }
  };

  const couponTiers = [
    {
      code: 'VECI-1OFF',
      points: 150,
      discount: 1.00,
      title: `Cupón ${currency} 1.00 OFF`,
      desc: 'Descuento directo en tu canasta (Aplica en retiro y delivery)',
      type: 'discount',
      isAvailable: true
    },
    {
      code: 'VECI-250OFF',
      points: 300,
      discount: 2.50,
      title: `Cupón ${currency} 2.50 OFF`,
      desc: '¡Ahorro directo para tus compras de la semana!',
      type: 'discount',
      isAvailable: true
    },
    {
      code: 'VECI-DELIVERY-FREE',
      points: 200,
      discount: 1.50,
      title: 'Cupón Delivery Gratis',
      desc: isDeliveryActive 
        ? 'Cubre el costo de entrega a tu puerta o departamento' 
        : 'Solo aplicable en comercios con servicio de reparto activo',
      type: 'delivery',
      isAvailable: isDeliveryActive
    }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Principal Oficial */}
        <div className={`p-5 sm:p-6 text-slate-950 flex flex-col justify-between relative overflow-hidden shrink-0 ${
          isPointsEnabled 
            ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600' 
            : 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400'
        }`}>
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/20 rounded-full blur-xl pointer-events-none"></div>

          {/* Fila Superior: Título de Programa y Tienda */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 text-xs font-black text-amber-950">
                <Award className="w-4 h-4" />
                <span>Club VeciPuntos</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/40 text-[11px] font-extrabold text-amber-950">
                <Store className="w-3.5 h-3.5" />
                <span className="truncate max-w-[160px]">{storeDisplayName}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-amber-950 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Saldo Oficial o Mensaje de Desactivado */}
          <div className="relative z-10 space-y-1">
            {isPointsEnabled ? (
              <>
                <p className="text-xs font-bold text-amber-950/80 flex items-center gap-1.5">
                  <span>Tu saldo acumulado en esta tienda:</span>
                  {isLoadingPoints && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950">
                    {isLoadingPoints ? '...' : veciPoints}
                  </span>
                  <span className="text-lg font-extrabold text-amber-950/80">Puntos</span>
                </div>
                <p className="text-xs font-medium text-amber-950/90 pt-0.5">
                  Ganas <strong>{pointsRatio} puntos por cada 1 {currency}</strong> en compras completadas con tu número de WhatsApp.
                </p>
              </>
            ) : (
              <div className="py-2 space-y-1 text-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-800" />
                  <h3 className="font-extrabold text-sm text-slate-900">Programa Desactivado en esta Tienda</h3>
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  <strong>{storeDisplayName}</strong> actualmente no tiene habilitado el programa de VeciPuntos. Cada comercio afiliado es autónomo y define sus promociones y fidelización de manera independiente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Identificación del Vecino por WhatsApp */}
          {isPointsEnabled && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950">
              {customerPhone && !isEditingPhone ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                        Vecino Identificado:
                      </p>
                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {customerPhone} {customerName ? `(${customerName})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => fetchCustomerPoints(customerPhone)}
                      disabled={isLoadingPoints}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-[11px] hover:bg-amber-100/60 transition-colors cursor-pointer"
                      title="Actualizar saldo"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPoints ? 'animate-spin' : ''}`} />
                      <span>Actualizar</span>
                    </button>
                    <button
                      onClick={() => setIsEditingPhone(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-200/70 hover:bg-amber-300 text-amber-950 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLookupPhone} className="space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Phone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Identifícate con tu WhatsApp para ver tus puntos:</span>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <div className="flex items-center bg-white border border-amber-300 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-500 flex-1">
                      <span className="text-xs font-black text-slate-500 mr-2 select-none">+591</span>
                      <input
                        type="tel"
                        value={inputDigits}
                        onChange={handlePhoneInputChange}
                        placeholder="Ej. 72125280"
                        className="w-full bg-transparent text-xs font-bold text-slate-900 outline-hidden tracking-wider"
                        autoFocus={isEditingPhone && !customerPhone}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoadingPoints || inputDigits.length < 7}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white disabled:text-slate-500 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isLoadingPoints ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Consultar</span>
                    </button>
                    {customerPhone && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(false)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-800/80">
                    Tus puntos se asocian de forma privada y permanente a tu número para acumular en tus pedidos.
                  </p>
                </form>
              )}
            </div>
          )}

          {/* Tarjeta Informativa de Tienda y Condiciones */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 font-black text-slate-800">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Condiciones del Programa en {storeDisplayName}:</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Autonomía por comercio:</strong> Los puntos se acumulan y canjean exclusivamente en la tienda donde realizas tus compras.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Modalidades:</strong> Los cupones en efectivo aplican tanto para retiro en local como delivery. Los cupones de entrega gratuita aplican si la tienda cuenta con servicio de reparto activo.</span>
              </li>
            </ul>
          </div>

          {/* Lista de Cupones Canjeables */}
          {isPointsEnabled && (
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-3">
                <Gift className="w-4 h-4 text-emerald-600" />
                <span>Cupones disponibles para canjear en tu compra:</span>
              </h3>

              <div className="space-y-2.5">
                {couponTiers.map((tier) => {
                  const canAfford = veciPoints >= tier.points;
                  const isApplied = appliedCoupon?.code === tier.code;

                  return (
                    <div
                      key={tier.code}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isApplied
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                          : canAfford && tier.isAvailable
                            ? 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-md'
                            : 'border-slate-200 bg-slate-50/70 opacity-70'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {tier.title}
                          </span>
                          <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                            {tier.points} pts
                          </span>
                          {!tier.isAvailable && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                              Solo tiendas con delivery activo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
                          {tier.desc}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isApplied ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                            <Check className="w-3.5 h-3.5" />
                            Aplicado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRedeemCoupon(tier)}
                            disabled={!canAfford || !tier.isAvailable}
                            className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-xs shadow-md transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                          >
                            {canAfford ? 'Canjear' : `Faltan ${Math.max(0, tier.points - veciPoints)} pts`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acordeón de Preguntas Frecuentes Oficial */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setShowFaq(!showFaq)}
              className="w-full p-3 text-left flex items-center justify-between text-xs font-extrabold text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>¿Cómo funciona VeciPuntos en esta tienda? (Preguntas frecuentes)</span>
              </span>
              {showFaq ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showFaq && (
              <div className="p-3.5 border-t border-slate-200 space-y-2.5 text-[11px] text-slate-600 bg-white leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-slate-800">1. ¿Cómo acumulo mis VeciPuntos?</h4>
                  <p>Cada vez que realizas un pedido indicando tu número de WhatsApp, el sistema acredita automáticamente tus puntos según el monto total de tu compra al ser confirmada.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">2. ¿Los puntos se comparten entre todas las tiendas?</h4>
                  <p>No. Cada minimarket afiliado mantiene su propio programa de fidelización independiente. Tus puntos acumulados en <strong>{storeDisplayName}</strong> son exclusivos de esta tienda.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">3. ¿Qué ocurre si la tienda no ofrece delivery?</h4>
                  <p>Puedes canjear los cupones de descuento monetario normalmente; estos se aplican a tu canasta de retiro en local para pagar menos en caja.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800">4. ¿Cómo se aplica mi cupón al canjearlo?</h4>
                  <p>Al hacer clic en "Canjear", el cupón se añade de inmediato a tu canasta de compras activa y verás el descuento aplicado en tu resumen de pago.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tus VeciPuntos están protegidos y vinculados de manera segura a tu número de WhatsApp.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
