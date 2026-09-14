import React from 'react';
import { 
  Search, 
  MessageCircle, 
  Sparkles, 
  PlusCircle, 
  ArrowRight, 
  RefreshCw, 
  Store,
  HelpCircle,
  ShoppingBag
} from 'lucide-react';
import './SearchEmptyState.css';

export const SearchEmptyState = ({
  searchQuery = '',
  selectedCategory = 'all',
  storeConfig = {},
  onClearFilter,
  onRequestProduct
}) => {
  const storeName = storeConfig?.name || 'la tienda';
  const cleanPhone = (storeConfig?.whatsapp || storeConfig?.phone || '').replace(/[^0-9]/g, '');
  const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 7);

  // Mensaje predeterminado personalizado con el término buscado
  const queryTerm = searchQuery.trim();
  const whatsappMsg = queryTerm
    ? `¡Hola ${storeName}! Estuve buscando "${queryTerm}" en su tienda virtual de MarketSaaS y no lo encontré. ¿Tienen disponible en la tienda o me confirman el precio?`
    : `¡Hola ${storeName}! Quería consultar sobre la disponibilidad de productos en su tienda.`;

  const whatsappUrl = hasPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`
    : null;

  return (
    <div className="search-empty-state-card bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 text-center max-w-xl mx-auto my-6 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-16 w-64 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Ícono Superior */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200/60 shadow-xs">
          {queryTerm ? (
            <Search className="w-8 h-8 text-amber-600 animate-pulse" />
          ) : (
            <Sparkles className="w-8 h-8 text-amber-600" />
          )}
        </div>

        {/* Título y Mensaje */}
        {queryTerm ? (
          <>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              No encontramos resultados para <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-block font-mono text-sm sm:text-base">"{queryTerm}"</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              Muchas veces las tiendas tienen productos en almacén que aún no han registrado en la web. ¡Puedes consultar al casero al instante o pedir que lo agregue!
            </p>
          </>
        ) : (
          <>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              No hay productos disponibles en esta categoría
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              Prueba seleccionando otra categoría o pídelo a la tienda para que lo abastezca en su próximo inventario.
            </p>
          </>
        )}

        {/* Botones de Acción Inmediata (Acceso Rápido) */}
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          {/* Opción 1: Preguntar por WhatsApp directo */}
          {hasPhone ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="search-whatsapp-btn w-full py-3.5 px-5 rounded-2xl text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg cursor-pointer transition-all"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <div className="text-left leading-tight">
                <span>Preguntar por WhatsApp a {storeName}</span>
                <span className="block text-[10px] font-normal text-emerald-100">
                  {queryTerm ? `Consultar si tienen "${queryTerm}"` : 'Consulta directa al tendero'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto shrink-0" />
            </a>
          ) : (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-center gap-2">
              <Store className="w-4 h-4 text-slate-400" />
              <span>Tienda: {storeName}</span>
            </div>
          )}

          {/* Opción 2: Solicitar el producto al catálogo */}
          <button
            type="button"
            onClick={() => onRequestProduct?.(queryTerm)}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs sm:text-sm border border-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Pídelo al Catálogo {queryTerm ? `("${queryTerm}")` : ''}</span>
          </button>

          {/* Opción 3: Limpiar búsqueda y ver todo */}
          <button
            type="button"
            onClick={onClearFilter}
            className="w-full py-2.5 px-4 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ver todos los productos disponibles</span>
          </button>
        </div>

        {/* Tip informativo inferior */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Tu consulta ayuda a la tienda a saber qué productos abastecer.</span>
        </div>
      </div>
    </div>
  );
};
