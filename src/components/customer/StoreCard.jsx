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
  onViewOnMap,
  currencySymbol = 'Bs.',
  badgeLabel = null,
  isNearest = false
}) => {
  if (!store) return null;

  const isFeatured = variant === 'featured' || store.isFeatured;

  if (isFeatured) {
    return (
      <article className="store-card-featured bg-white rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 group w-full min-w-0 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-5 items-stretch min-w-0">
          {/* Imagen de la tienda en el lateral izquierdo */}
          <div className="w-full md:w-5/12 lg:w-4/12 xl:w-72 shrink-0 relative h-48 sm:h-56 md:h-auto min-h-[200px] md:min-h-[240px] rounded-xl overflow-hidden shadow-inner">
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

            {/* Distancia flotante inferior con acceso directo a centrar mapa */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewOnMap) onViewOnMap(store.slug);
              }}
              className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/85 hover:bg-emerald-950/95 backdrop-blur-md rounded-xl text-white text-xs font-bold drop-shadow cursor-pointer transition-colors border border-white/15"
              title="Centrar y ver ubicación en el mapa interactivo"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{store.distance}</span>
              <span className="text-[10px] text-emerald-300 font-semibold underline ml-0.5">Ver mapa</span>
            </button>
          </div>

          {/* Detalles comerciales y mini catálogo a la derecha */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              {/* Encabezado con Nombre y Calificación */}
              <div className="flex items-start justify-between gap-2.5 min-w-0">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                        {store.name}
                      </h3>
                      {(isNearest || store.isNearest) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs shrink-0">
                          📍 Más Cercana a Ti
                        </span>
                      )}
                      {store.isRegisteredStore && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span>Tienda Registrada</span>
                        </span>
                      )}
                      {!store.isRegisteredStore && store.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Oficial</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 min-w-0 mt-0.5">
                      <span className="truncate">{store.address}</span>
                      <span>•</span>
                      <span className="shrink-0">{store.reviewsCount || 100} pedidos</span>
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                  <span>{store.rating || 4.9}</span>
                </span>
              </div>

              {/* Badges de Beneficios */}
              <div className="mt-3 flex flex-wrap gap-1.5 min-w-0">
                {store.perks && store.perks.map((perk, idx) => (
                  <span 
                    key={idx}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 max-w-full truncate ${
                      perk.highlight 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {perk.highlight && <Zap className="w-3 h-3 text-emerald-600 shrink-0" />}
                    <span className="truncate">{perk.text}</span>
                  </span>
                ))}
              </div>

              {/* Tira de Mini Catálogo con 3 productos más solicitados */}
              {store.featuredProducts && store.featuredProducts.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 min-w-0">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                    Productos más solicitados por vecinos
                  </span>
                  <div className="grid grid-cols-3 gap-2 min-w-0">
                    {store.featuredProducts.map((prod) => (
                      <div 
                        key={prod.id}
                        className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex flex-col justify-between hover:bg-slate-100/80 transition-colors min-w-0"
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
              className="mt-5 w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-w-0"
            >
              <span>Entrar a la Tienda y Comprar</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Variante Compacta (Secundaria: Otros Minimarkets del Vecindario)
  return (
    <article className="store-card-compact bg-white rounded-2xl shadow-xs hover:shadow-md border border-slate-200/80 transition-all duration-200 group w-full min-w-0 overflow-hidden hover:border-emerald-300">
      {/* 1. VISTA MÓVIL (< 640px): Fila Horizontal Compacta y Ligera (~85px) */}
      <div 
        className="flex sm:hidden items-center gap-3 p-2.5 w-full min-w-0 cursor-pointer active:bg-slate-50 transition-colors"
        onClick={() => onSelect(store.slug)}
      >
        {/* Miniatura cuadrada con estado y distancia */}
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden shadow-xs bg-slate-100">
          <img 
            src={store.imageUrl} 
            alt={store.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
          
          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-950/85 backdrop-blur-xs rounded text-white text-[8px] font-extrabold uppercase">
            {store.statusBadge || (store.isOpen !== false ? 'Abierto' : 'Cerrado')}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewOnMap) onViewOnMap(store.slug);
            }}
            className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-950/90 backdrop-blur-xs rounded text-emerald-300 text-[9px] font-bold flex items-center gap-0.5 border border-white/10"
            title="Centrar en mapa"
          >
            <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span>{store.distance}</span>
          </button>
        </div>

        {/* Info Central */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate leading-snug">
              {store.name}
            </h4>
            {store.isRegisteredStore ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Tienda Registrada" />
            ) : store.isVerified ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Tienda Verificada" />
            ) : null}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] min-w-0">
            <span className="flex items-center text-amber-600 font-extrabold shrink-0">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-0.5" />
              <span>{store.rating || 4.7}</span>
            </span>
            <span className="text-slate-400 truncate text-[10px]">
              ({store.reviewsCount || store.ordersCount || 50} pedidos)
            </span>
          </div>

          {/* Métodos de Pago y Entrega (Micro Pills en Móvil) */}
          <div className="flex items-center gap-1 mt-1 text-[9px] font-bold flex-wrap min-w-0">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/70">
              📱 QR
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/70">
              🛍️ Retiro
            </span>
            {store.hasFastDelivery ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/70">
                🛵 Delivery
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/70">
                📍 En local
              </span>
            )}
          </div>
        </div>

        {/* Flecha táctil de acceso directo */}
        <div className="shrink-0 pl-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
            <ArrowRight className="w-4 h-4 shrink-0" />
          </div>
        </div>
      </div>

      {/* 2. VISTA TABLET & ESCRITORIO (>= 640px): Tarjeta Estructurada Completa */}
      <div className="hidden sm:flex flex-col justify-between p-3.5 sm:p-4 h-full min-w-0">
        <div className="min-w-0">
          {/* Cabecera con foto de portada y distancia */}
          <div className="relative h-28 sm:h-32 w-full rounded-xl overflow-hidden mb-2.5 shrink-0">
            <img 
              src={store.imageUrl} 
              alt={store.name} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/65 via-transparent to-transparent" />
            
            {/* Estado de apertura */}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/85 backdrop-blur-sm rounded-full text-white text-[9px] sm:text-[10px] font-bold uppercase">
              {store.statusBadge || 'Abierto'}
            </div>

            {/* Badge superior opcional */}
            {(badgeLabel || store.badgeLabel) && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-600/90 backdrop-blur-sm rounded-full text-white text-[9px] font-bold uppercase shadow-xs">
                {badgeLabel || store.badgeLabel}
              </div>
            )}

            {/* Distancia exacta con botón interactivo */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewOnMap) onViewOnMap(store.slug);
              }}
              className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-slate-950/85 hover:bg-emerald-950/95 backdrop-blur-sm rounded-lg text-white text-[11px] font-bold drop-shadow cursor-pointer border border-white/15 transition-colors"
              title="Centrar y ver en el mapa interactivo"
            >
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{store.distance}</span>
            </button>
          </div>

          {/* Info, Calificación por Estrellas y Volumen de Pedidos */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                  {store.name}
                </h3>
                {store.isRegisteredStore ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                    <span>Registrada</span>
                  </span>
                ) : store.isVerified ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Tienda Verificada" />
                ) : null}
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-xs min-w-0">
                <span className="flex items-center text-amber-600 font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5 shrink-0" />
                  <span>{store.rating || 4.7}</span>
                </span>
                <span className="text-slate-400 truncate text-[11px]">
                  ({store.reviewsCount || store.ordersCount || 50} pedidos)
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          {/* Métodos de Pago y Modalidades Aceptadas (QR Simple, Retiro en caja, Delivery propio) */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 min-w-0 text-[10px] font-bold">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <span>📱</span>
              <span>QR Simple</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80">
              <span>🛍️</span>
              <span>Retiro en caja</span>
            </span>
            {store.hasFastDelivery ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80">
                <span>🛵</span>
                <span>Delivery propio</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
                <span>📍</span>
                <span>Solo Retiro</span>
              </span>
            )}
          </div>
        </div>

        {/* Botón Ver Catálogo */}
        <button
          type="button"
          onClick={() => onSelect(store.slug)}
          className="mt-3.5 w-full h-9 bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 min-w-0"
        >
          <span>Ver Catálogo</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    </article>
  );
};
