import React from 'react';
import { 
  Store, 
  Star, 
  MapPin, 
  ArrowRight, 
  Zap, 
  Truck, 
  Package, 
  Sparkles,
  ShoppingBag,
  Award,
  CheckCircle2
} from 'lucide-react';
import './StoreCard.css';

export const StoreCard = ({ 
  store, 
  variant = 'compact', // 'featured' | 'compact'
  onSelect, 
  onClaimStore,
  currencySymbol = 'Bs.' 
}) => {
  if (!store) return null;

  const isFeatured = variant === 'featured' || store.isFeatured;

  if (isFeatured) {
    return (
      <article className="store-card-featured bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 group">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Imagen de la tienda en el lateral izquierdo */}
          <div className="md:col-span-5 relative h-52 sm:h-56 md:h-full min-h-[220px] rounded-xl overflow-hidden shadow-inner">
            <img 
              src={store.imageUrl} 
              alt={store.name} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20" />

            {/* Badges superiores flotantes */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-700/95 backdrop-blur-md rounded-full text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{store.statusBadge || 'Abierto'}</span>
            </div>

            {store.pointsReward && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-[10px] font-extrabold tracking-wider uppercase rounded-full shadow-md">
                <Sparkles className="w-3 h-3" />
                <span>{store.pointsReward}</span>
              </div>
            )}

            {/* Distancia flotante inferior */}
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-white text-xs font-bold drop-shadow">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{store.distance}</span>
            </div>
          </div>

          {/* Detalles comerciales y mini catálogo a la derecha */}
          <div className="md:col-span-7 flex flex-col justify-between h-full">
            <div>
              {/* Encabezado con Nombre y Calificación */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                        {store.name}
                      </h3>
                      {store.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Oficial
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate mt-0.5">
                      <span>{store.address}</span>
                      <span>•</span>
                      <span>{store.reviewsCount || 100} pedidos</span>
                    </p>
                    {onClaimStore && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); onClaimStore(); }}
                        className="text-[11px] text-slate-400 hover:text-emerald-700 underline text-left mt-0.5 cursor-pointer block"
                      >
                        ¿Eres el dueño de este local? Reclámalo gratis
                      </button>
                    )}
                  </div>
                </div>

                <span className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {store.rating || 4.9}
                </span>
              </div>

              {/* Badges de Beneficios */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {store.perks && store.perks.map((perk, idx) => (
                  <span 
                    key={idx}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 ${
                      perk.highlight 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {perk.highlight && <Zap className="w-3 h-3 text-emerald-600" />}
                    {perk.text}
                  </span>
                ))}
              </div>

              {/* Tira de Mini Catálogo con 3 productos más solicitados */}
              {store.featuredProducts && store.featuredProducts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                    Productos más solicitados por vecinos
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {store.featuredProducts.map((prod) => (
                      <div 
                        key={prod.id}
                        className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex flex-col justify-between hover:bg-slate-100/80 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base sm:text-lg">{prod.emoji || '📦'}</span>
                          <span className="text-xs font-bold text-emerald-700">
                            {currencySymbol} {Number(prod.price).toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-800 font-semibold truncate mt-1">
                          {prod.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botón CTA Primario */}
            <button
              type="button"
              onClick={() => onSelect(store.slug)}
              className="mt-5 w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Entrar a la Tienda y Comprar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Variante Compacta (Secundaria)
  return (
    <article className="store-card-compact bg-white rounded-2xl shadow-xs hover:shadow-md border border-slate-200/80 p-4 flex flex-col justify-between transition-all duration-200 group">
      <div>
        {/* Cabecera con foto y distancia */}
        <div className="relative h-28 w-full rounded-xl overflow-hidden mb-3">
          <img 
            src={store.imageUrl} 
            alt={store.name} 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
          
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm rounded-full text-white text-[9px] sm:text-[10px] font-bold uppercase">
            {store.statusBadge || 'Abierto'}
          </div>

          <div className="absolute bottom-2 left-2 text-white text-xs font-bold drop-shadow">
            {store.distance}
          </div>
        </div>

        {/* Info y Calificación */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                {store.name}
              </h3>
              {store.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Tienda Verificada" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="flex items-center text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                {store.rating || 4.7}
              </span>
              <span className="text-slate-400">({store.reviewsCount || 50} pedidos)</span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>

        {/* Tags de Beneficios */}
        <div className="mt-2.5 flex flex-wrap gap-1.5 text-slate-600 text-[10px] sm:text-[11px] font-semibold">
          {store.perks && store.perks.map((p, idx) => (
            <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded">
              {p.text}
            </span>
          ))}
        </div>
      </div>

      {/* Botón Ver Catálogo y Enlace para Reclamar */}
      <div className="mt-3.5 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onSelect(store.slug)}
          className="w-full h-10 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
        >
          <span>Ver Catálogo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {onClaimStore && (
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); onClaimStore(); }}
            className="text-[10px] text-slate-400 hover:text-emerald-700 underline text-center w-full cursor-pointer py-0.5"
          >
            ¿Dueño de este local? Reclámalo
          </button>
        )}
      </div>
    </article>
  );
};
