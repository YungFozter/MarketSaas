import React, { useState } from 'react';
import { X, Plus, Minus, ShieldCheck, Sparkles, Truck, Check, Share2, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './ProductModal.css';

export const ProductModal = ({ product, onClose }) => {
  const { addToCart, cart, updateCartQuantity, selectedLocation, storeConfig } = useStore();
  const [qty, setQty] = useState(1);
  const currency = storeConfig?.currencySymbol || 'Bs.';

  if (!product) return null;

  const cartItem = cart.find(item => item.id === product.id);
  const currentInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  const handleAdd = () => {
    addToCart(product, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 shadow-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Imagen Lateral */}
        <div className="md:w-1/2 bg-slate-100 relative h-48 sm:h-64 md:h-auto shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.badge && (
            <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {product.badge}
            </span>
          )}
        </div>

        {/* Detalles y Compra */}
        <div className="p-5 sm:p-8 md:w-1/2 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-semibold mb-1.5">
              <span>{product.category}</span>
              <span className="font-mono">COD: {product.code}</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-tight mb-1.5">
              {product.name}
            </h2>

            <p className="text-xs sm:text-sm font-semibold text-emerald-700 mb-3">
              Presentación: {product.unit}
            </p>

            {/* Precios */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-3 sm:mb-4 p-3 sm:p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-xl sm:text-3xl font-black text-emerald-800">
                {currency} {product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xs sm:text-sm text-slate-400 line-through">
                    {currency} {product.originalPrice.toFixed(2)}
                  </span>
                  <span className="bg-amber-400 text-amber-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md">
                    Ahorras {currency} {(product.originalPrice - product.price).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {/* Descripción */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 sm:mb-6">
              {product.description}
            </p>

            {/* Garantías */}
            <div className="space-y-1.5 mb-4 sm:mb-6 text-[11px] sm:text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                <span>Disponible para entrega en <strong>{selectedLocation.condominium}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                <span>Garantía de frescura directa del minimarket</span>
              </div>
            </div>
          </div>

          {/* Selector de cantidad y botón */}
          <div className="pt-3 sm:pt-4 border-t border-slate-100 flex flex-col gap-2.5 sm:gap-3">
            {isOutOfStock ? (
              <div className="text-center py-2.5 bg-rose-50 text-rose-700 font-bold rounded-2xl border border-rose-200 text-xs sm:text-sm">
                Producto agotado por el momento
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Cantidad:</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold shadow-2xs text-xs sm:text-sm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-extrabold text-xs sm:text-sm px-2 min-w-6 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold shadow-2xs text-xs sm:text-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  className="w-full py-3 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Agregar al Carrito - {currency} {(product.price * qty).toFixed(2)}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
