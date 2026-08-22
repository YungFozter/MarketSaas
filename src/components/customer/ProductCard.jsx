import React from 'react';
import { Plus, Minus, Check, Sparkles, Tag, Eye } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ProductCard = ({ product, onOpenDetail }) => {
  const { cart, addToCart, updateCartQuantity } = useStore();

  const cartItem = cart.find(item => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock <= 0;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const savings = hasDiscount ? (product.originalPrice - product.price).toFixed(2) : null;

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Imagen & Badges Superiores */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onOpenDetail(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />

        {/* Overlay sutil para ver detalle */}
        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/90 backdrop-blur-xs text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            Ver Detalle
          </span>
        </div>

        {/* Badges de Oferta / Ahorro */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start pointer-events-none">
          {product.badge && (
            <span className="bg-emerald-600 text-white text-[10px] sm:text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md shadow-emerald-700/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {product.badge}
            </span>
          )}

          {hasDiscount && (
            <span className="bg-amber-500 text-slate-950 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-950" />
              Ahorras ${savings}
            </span>
          )}
        </div>

        {/* Badge de Stock Bajo */}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-2 right-2 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            ¡Solo {product.stock} disponibles!
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-lg">
              Agotado temporalmente
            </span>
          </div>
        )}
      </div>

      {/* Información del Producto */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Categoría y Código SKU */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>{product.category}</span>
            <span className="font-mono text-[10px] text-slate-400">SKU: {product.code.slice(-5)}</span>
          </div>

          {/* Nombre y Unidad */}
          <h3 
            onClick={() => onOpenDetail(product)}
            className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 cursor-pointer mb-1"
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 font-medium mb-3">
            {product.unit}
          </p>
        </div>

        {/* Precios y Botón de Acción */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through block font-medium">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-extrabold text-emerald-700">
                ${product.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Control de Carrito */}
          <div>
            {isOutOfStock ? (
              <button
                disabled
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed"
              >
                Sin Stock
              </button>
            ) : quantityInCart > 0 ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-2xl p-1 shadow-2xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCartQuantity(product.id, quantityInCart - 1);
                  }}
                  className="w-7 h-7 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center font-bold text-sm shadow-2xs transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-black text-xs sm:text-sm text-emerald-900 px-2 min-w-5 text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCartQuantity(product.id, quantityInCart + 1);
                  }}
                  disabled={quantityInCart >= product.stock}
                  className="w-7 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
