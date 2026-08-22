import React, { useState } from 'react';
import { X, Plus, Minus, ShieldCheck, Sparkles, Truck, Check, Share2, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ProductModal = ({ product, onClose }) => {
  const { addToCart, cart, updateCartQuantity, selectedLocation } = useStore();
  const [qty, setQty] = useState(1);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 shadow-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Imagen Lateral */}
        <div className="md:w-1/2 bg-slate-100 relative min-h-64 sm:min-h-80">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.badge && (
            <span className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {product.badge}
            </span>
          )}
        </div>

        {/* Detalles y Compra */}
        <div className="p-6 sm:p-8 md:w-1/2 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span>{product.category}</span>
              <span className="font-mono">CÓDIGO: {product.code}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight mb-2">
              {product.name}
            </h2>

            <p className="text-sm font-semibold text-emerald-700 mb-4">
              Presentación: {product.unit}
            </p>

            {/* Precios */}
            <div className="flex items-baseline gap-3 mb-4 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <span className="text-2xl sm:text-3xl font-black text-emerald-800">
                ${product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-400 line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="bg-amber-400 text-amber-950 text-xs font-black px-2 py-0.5 rounded-md">
                    Ahorras ${(product.originalPrice - product.price).toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {/* Descripción */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Garantías */}
            <div className="space-y-2 mb-6 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Disponible para entrega en <strong>{selectedLocation.condominium}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Garantía de frescura directa del minimarket</span>
              </div>
            </div>
          </div>

          {/* Selector de cantidad y botón */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {isOutOfStock ? (
              <div className="text-center py-3 bg-rose-50 text-rose-700 font-bold rounded-2xl border border-rose-200 text-sm">
                Producto agotado por el momento
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Cantidad a llevar:</span>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold shadow-2xs"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-extrabold text-sm px-3 min-w-8 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Agregar al Carrito - ${(product.price * qty).toFixed(2)}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
