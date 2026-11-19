import React, { useId, useMemo } from 'react';
import { Search, Store, Crown, MapPin, Navigation, Bike } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { resolveIsolatedStoreShareData } from '../../utils/storeTenantUtils';
import './HeroBanner.css';

export const HeroBanner = ({ searchQuery, setSearchQuery }) => {
  const { storeConfig, stores = [], selectedStore, merchantStore, tenantSlug, isProPlan } = useStore();
  const searchInputId = useId();
  const isProStore = Boolean(
    storeConfig?.isProStore ||
    isProPlan ||
    String(storeConfig?.plan || storeConfig?.subscription?.plan || '').toLowerCase().includes('pro')
  );

  const tenant = tenantSlug || storeConfig?.id || 'default';

  const {
    scopedConfig,
    storeName,
    addressText,
    mapsUrl,
    hasExactCoordinates
  } = useMemo(() => resolveIsolatedStoreShareData({
    tenant,
    storeConfig,
    merchantStore,
    selectedStore,
    stores
  }), [tenant, storeConfig, merchantStore, selectedStore, stores]);

  const hasAddress = addressText && addressText !== 'Dirección de la tienda';
  const taglineText = scopedConfig?.tagline?.trim() || 'Pide fácil desde tu celular para retiro rápido en local o entrega a tu puerta.';
  const isDeliveryEnabled = scopedConfig?.enableDelivery !== false;

  const scrollToCatalog = () => {
    const el = document.getElementById('products-catalog-section') || document.querySelector('section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    scrollToCatalog();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    // Evitar enviar búsquedas incompletas mientras un teclado IME está componiendo texto (incluyendo Safari keyCode 229)
    if (e.isComposing || e.nativeEvent?.isComposing || e.keyCode === 229) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  };

  return (
    <section
      aria-label={`Información y buscador de ${storeName}`}
      className="hero-banner-container text-white shadow-lg mb-4 sm:mb-5"
    >
      {scopedConfig?.bannerUrl && (
        <img
          src={scopedConfig.bannerUrl}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="hero-banner-bg-img"
        />
      )}
      <div className="hero-banner-scrim" aria-hidden="true" />

      <div className="hero-banner-inner">
        {/* Columna Izquierda: Identidad real de la tienda, dirección y pin GPS */}
        <div className="min-w-0">
          <div className="hero-banner-identity">
            {scopedConfig?.logoUrl ? (
              <div className="hero-banner-logo-box bg-white p-1 shadow-md">
                <img
                  src={scopedConfig.logoUrl}
                  alt={`Logo de ${storeName}`}
                  width={56}
                  height={56}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="hero-banner-logo-box bg-white/15 text-white shadow-sm">
                <Store className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
              </div>
            )}

            <div className="hero-banner-text">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="hero-banner-title">{storeName}</h1>
                {isProStore && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full hero-banner-pro-chip text-amber-300 text-[10px] font-black shrink-0">
                    <Crown className="w-3 h-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                    <span className="tracking-wide">TIENDA PRO</span>
                  </span>
                )}
              </div>
              <p className="hero-banner-tagline">{taglineText}</p>
            </div>
          </div>

          <div className="hero-banner-meta-row">
            {hasAddress && (
              <span className="hero-banner-meta-pill" title={addressText}>
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
                <span className="truncate">{addressText}</span>
              </span>
            )}

            {(hasExactCoordinates || hasAddress) && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-banner-maps-link shadow-xs"
                aria-label={`Cómo llegar a ${storeName} en Google Maps`}
                title={hasExactCoordinates ? 'Abrir pin GPS exacto en Google Maps' : 'Buscar ubicación en Google Maps'}
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>Cómo llegar (Maps)</span>
              </a>
            )}

            <span className="hero-banner-meta-pill">
              <Bike className="w-3.5 h-3.5 text-emerald-200 shrink-0" aria-hidden="true" />
              <span>{isDeliveryEnabled ? 'Delivery y Retiro en tienda' : 'Retiro rápido en local'}</span>
            </span>
          </div>
        </div>

        {/* Columna Derecha: Buscador de productos accesible e IME-safe */}
        <form
          role="search"
          onSubmit={handleSearchSubmit}
          className="hero-banner-search-panel"
        >
          <label htmlFor={searchInputId} className="sr-only">
            Buscar productos en {storeName}
          </label>
          <div className="relative flex items-center">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Busca leche, pan, bebidas, SKU..."
              className="hero-banner-search-control w-full pl-10 pr-24 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 font-medium text-xs sm:text-sm shadow-md border-2 border-transparent focus:border-amber-400 focus:outline-hidden transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="hero-banner-clear-btn absolute right-[4.75rem] text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 flex items-center cursor-pointer"
              >
                Limpiar
              </button>
            )}
            <button
              type="submit"
              className="hero-banner-search-btn absolute right-1 px-3 sm:px-3.5 my-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center active:scale-95 cursor-pointer"
            >
              <span>Buscar</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
