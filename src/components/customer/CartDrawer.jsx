import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  Sparkles, 
  ArrowRight, 
  Tag, 
  ShieldCheck 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CartDrawer = ({ isOpen, onClose, onProceedCheckout, onOpenPoints }) => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    cartSubtotal, 
    cartSavings, 
    cartTotal, 
    actualDeliveryFee, 
    isFreeDelivery, 
    appliedCoupon, 
    removeCoupon,
    storeConfig,
    selectedLocation 
  } = useStore();

  if (!isOpen) return null;

  const freeDeliveryThreshold = storeConfig.freeDeliveryThreshold;
  const progressPercent = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);
  const remainingForFree = Math.max(0, freeDeliveryThreshold - cartSubtotal);
  const currency = storeConfig?.currencySymbol || 'Bs.';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header del Carrito */}
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Tu Canasta Vecina</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {cart.reduce((acc, i) => acc + i.quantity, 0)} productos seleccionados
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

            {/* Barra de Progreso de Envío Gratis */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  {isFreeDelivery ? (
                    <span className="text-emerald-700 font-extrabold">¡Envío GRATIS alcanzado!</span>
                  ) : (
                    <span>Agrega <strong>{currency} {remainingForFree.toFixed(2)}</strong> para delivery gratis</span>
                  )}
                </span>
                <span className="text-emerald-700 font-black">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${isFreeDelivery ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-emerald-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lista de Ítems */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-700 text-lg mb-1">Tu carrito está vacío</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Explora nuestro catálogo con los mejores precios de barrio y agrega tus productos favoritos.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">{item.unit}</p>
                    <p className="text-xs font-extrabold text-emerald-700 mt-0.5">
                      {currency} {item.price.toFixed(2)} c/u
                    </p>
                  </div>

                  {/* Controles de Cantidad */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-extrabold text-xs px-1.5 min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-extrabold text-xs text-slate-800">
                      {currency} {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con Resumen y Checkout */}
          {cart.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/80 space-y-3">
              
              {/* Cupón aplicado o botón para canjear puntos */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Tag className="w-4 h-4 text-emerald-700" />
                    <span>Cupón: {appliedCoupon.code} (-{currency} {appliedCoupon.discount.toFixed(2)})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-emerald-700 hover:text-rose-600 font-extrabold text-xs"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPoints();
                  }}
                  className="w-full text-left flex items-center justify-between p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-xs text-amber-950 font-bold transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    ¿Tienes VeciPuntos? Canjea descuentos
                  </span>
                  <span className="text-[11px] font-black text-amber-700 underline">Canjear →</span>
                </button>
              )}

              {/* Desglose de Precios */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal productos</span>
                  <span className="font-semibold text-slate-800">{currency} {cartSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <span>Envío a {selectedLocation.condominium}</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {isFreeDelivery ? (
                      <span className="text-emerald-600 font-bold">GRATIS</span>
                    ) : (
                      `+${currency} ${actualDeliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento aplicado</span>
                    <span>-{currency} {appliedCoupon.discount.toFixed(2)}</span>
                  </div>
                )}

                {cartSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      ¡Ahorro total en este pedido!
                    </span>
                    <span>-{currency} {cartSavings.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-base font-extrabold text-slate-900">
                  <span>Total a Pagar</span>
                  <span className="text-xl font-black text-emerald-700">{currency} {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón de Checkout */}
              <button
                onClick={() => {
                  onClose();
                  onProceedCheckout();
                }}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Continuar al Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors pt-1 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar canasta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
