import React from 'react';
import { Plus, Minus, Check, Sparkles, Tag, Eye } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './ProductCard.css';

export const ProductCard = React.memo(({ product, onOpenDetail, onRequestProduct, deferRender = false }) => {
  const { cart, addToCart, updateCartQuantity, storeConfig } = useStore();

  const cartItem = cart.find(item => item.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const hasNumericStock = typeof product.stock === 'number' && !isNaN(product.stock);
  const isOutOfStock = hasNumericStock && product.stock <= 0;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const savings = hasDiscount ? (product.originalPrice - product.price).toFixed(2) : null;
  const currency = storeConfig?.currencySymbol || 'Bs.';

  return (
    <article
      className={`product-card-item group relative bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col overflow-hidden ${
        deferRender ? 'product-card-deferred' : ''
      }`}
    >
      {/* Imagen & Badges Superiores (botón accesible por teclado y clic) */}
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        aria-label={`Ver detalle de ${product.name}`}
        className="product-card-trigger relative aspect-square sm:aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer block text-left focus:outline-none"
      >
        <img
          src={product.image}
          alt={product.name}
          className="product-image-zoom w-full h-full object-cover object-center"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/products/producto-sin-imagen.png';
          }}
        />

        {/* Overlay sutil en escritorio/teclado (oculto en dispositivos sin hover) */}
        <div className="product-card-detail-overlay absolute inset-0 bg-slate-900/15 flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Ver Detalle</span>
          </span>
        </div>

        {/* Badges de Oferta / Ahorro */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 items-start pointer-events-none max-w-[85%]">
          {product.badge && (
            <span className="bg-emerald-600 text-white text-[9px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md shadow-emerald-700/20 flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 text-amber-300 shrink-0" aria-hidden="true" />
              <span className="truncate">{product.badge}</span>
            </span>
          )}

          {hasDiscount && (
            <span className="bg-amber-500 text-slate-950 text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-950 shrink-0" aria-hidden="true" />
              <span>-{currency} {savings}</span>
            </span>
          )}
        </div>

        {/* Badge de Stock Bajo */}
        {hasNumericStock && product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
            ¡Solo {product.stock}!
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center p-2 text-center">
            <span className="bg-rose-600 text-white text-[11px] sm:text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg">
              Agotado
            </span>
          </div>
        )}
      </button>

      {/* Información del Producto */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
        <div className="min-w-0">
          {/* Categoría y Código SKU */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-semibold mb-1 gap-1">
            <span className="truncate">{product.category}</span>
            {product.code ? (
              <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 shrink-0">#{String(product.code).slice(-4)}</span>
            ) : null}
          </div>

          {/* Nombre accesible y Unidad */}
          <h3 className="font-bold text-slate-900 text-xs sm:text-[15px] leading-tight sm:leading-snug mb-1">
            <button
              type="button"
              onClick={() => onOpenDetail(product)}
              className="product-card-trigger text-left w-full group-hover:text-emerald-700 transition-colors line-clamp-2 cursor-pointer focus:outline-none rounded-sm"
            >
              {product.name}
            </button>
          </h3>

          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mb-2.5 truncate">
            {product.unit}
          </p>
        </div>

        {/* Precios y Botón de Acción */}
        <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
          <div className="min-w-0">
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through block font-medium leading-none">
                {currency} {product.originalPrice.toFixed(2)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-extrabold text-emerald-700">
                {currency} {product.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Control de Carrito */}
          <div className="shrink-0">
            {isOutOfStock ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRequestProduct) onRequestProduct(product.name);
                }}
                className="product-card-action px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] sm:text-xs font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Pedir al dueño que reponga este producto"
              >
                <span>🔔 Pídelo</span>
              </button>
            ) : quantityInCart > 0 ? (
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  aria-label={`Quitar una unidad de ${product.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCartQuantity(product.id, quantityInCart - 1);
                  }}
                  className="product-card-action w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="font-black text-xs sm:text-sm text-emerald-900 px-1.5 min-w-4 text-center">
                  {quantityInCart}
                </span>
                <button
                  type="button"
                  aria-label={`Agregar una unidad más de ${product.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCartQuantity(product.id, quantityInCart + 1);
                  }}
                  disabled={hasNumericStock && quantityInCart >= product.stock}
                  className="product-card-action w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label={`Agregar ${product.name} al carrito`}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1);
                }}
                className="product-card-action flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="hidden xs:inline">Agregar</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </article>
  );
});
