/* ==============================================================================
   NeighborhoodMap.markers.js
   ------------------------------------------------------------------------------
   Fábricas de marcadores del mapa de VISTA VECINO y reconciliador de capas.
   - Pines DOM (L.divIcon) para zoom cercano: máximo detalle visual.
   - Puntos canvas (L.circleMarker) para zoom lejano: costo casi nulo por tienda.
   Los estilos visuales de los pines viven en NeighborhoodMap.css (sin estilos
   inline: menos HTML que parsear por marcador y estilos cacheables).
   ============================================================================== */
import L from 'leaflet';
import { escapeHtml } from '../../utils/formatters';

const PIN_SIZE = [36, 44];
const PIN_ANCHOR = [18, 44];

const LOCK_ICON_SVG = (color) => `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>`;

const STORE_ICON_SVG = (color) => `
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>`;

/** Valida que la tienda tenga coordenadas numéricas utilizables. */
export const hasValidCoords = (store) => {
  const coords = store?.googleMapsCoordinates;
  return Boolean(
    coords &&
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    !Number.isNaN(coords.lat) &&
    !Number.isNaN(coords.lng)
  );
};

/**
 * Resuelve la variante visual de una tienda (compartida por pin DOM y punto canvas).
 * @returns {{ variant: 'closed'|'pro_owner'|'pro'|'owner'|'official'|'default', isOpen: boolean, pinColor: string, strokeColor: string, isPro: boolean }}
 */
export const getStoreVisual = (store) => {
  const isOpen = store.isOpen !== false;
  const isPro = Boolean(store.isProStore || String(store.plan || store.subscription?.plan || '').toLowerCase().includes('pro'));

  if (!isOpen) {
    return { variant: 'closed', isOpen, pinColor: '#475569', strokeColor: '#334155', isPro };
  }
  
  if (store.isCurrentOwnerStore && isPro) {
    return { variant: 'pro_owner', isOpen, pinColor: '#d97706', strokeColor: '#b45309', isPro: true };
  }
  
  if (isPro) {
    return { variant: 'pro', isOpen, pinColor: '#d97706', strokeColor: '#b45309', isPro: true };
  }

  if (store.isCurrentOwnerStore) {
    return { variant: 'owner', isOpen, pinColor: '#059669', strokeColor: '#047857', isPro: false };
  }

  if (store.isRegisteredStore) {
    return { variant: 'official', isOpen, pinColor: '#059669', strokeColor: '#047857', isPro: false };
  }

  return { variant: 'default', isOpen, pinColor: '#334155', strokeColor: '#1e293b', isPro: false };
};

const BADGE_TEXT = {
  pro_owner: '👑 Tu Tienda PRO',
  pro: '⭐ Tienda PRO',
  owner: '⭐ Tu Tienda',
  official: 'Oficial'
};

/** Pin DOM de alta fidelidad para zoom cercano. */
export const createStorePinIcon = (store, isSelected) => {
  const { variant, isOpen, pinColor, strokeColor } = getStoreVisual(store);

  // Anillo de pulso dinámico (SOLO para tiendas abiertas oficiales / pro / del dueño)
  const ringHtml = (variant === 'pro_owner' || variant === 'pro')
    ? '<div class="pro-pulse-ring"></div>'
    : variant === 'owner'
      ? '<div class="owner-pulse-ring"></div>'
      : variant === 'official'
        ? '<div class="registered-pulse-ring"></div>'
        : '';

  const dotHtml = variant !== 'default' ? `<span class="pin-label__dot pin-label__dot--${variant}">●</span>` : '';
  const statusHtml = !isOpen ? '<span class="pin-label__status">CERRADO</span>' : '';
  const badgeHtml = BADGE_TEXT[variant]
    ? `<span class="pin-label__badge pin-label__badge--${variant}">${BADGE_TEXT[variant]}</span>`
    : '';

  const isProVariant = variant === 'pro' || variant === 'pro_owner';
  const crownSvg = isProVariant ? `
    <div class="pin-crown" style="position: absolute; top: -11px; left: 50%; transform: translateX(-50%); pointer-events: none; z-index: 5;">
      <svg width="18" height="13" viewBox="0 0 24 18" fill="#f59e0b" stroke="#b45309" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));">
        <path d="M2 15l2-9 5 5 3-7 3 7 5-5 2 9H2z"></path>
        <circle cx="2" cy="6" r="1.5" fill="#fef3c7"></circle>
        <circle cx="12" cy="4" r="1.5" fill="#fef3c7"></circle>
        <circle cx="22" cy="6" r="1.5" fill="#fef3c7"></circle>
      </svg>
    </div>
  ` : '';

  const html = `
    <div class="custom-leaflet-pin${isSelected ? ' is-active' : ''}${!isOpen ? ' is-closed' : ''}${isProVariant ? ' is-pro' : ''}">
      ${ringHtml}
      ${crownSvg}
      <div class="pin-label">
        <div class="pin-label__chip${isProVariant ? ' pin-label__chip--pro' : ''}">
          ${dotHtml}
          <span class="pin-label__name">${escapeHtml(store.name)}</span>
          ${statusHtml}
        </div>
        ${badgeHtml}
      </div>
      <svg class="pin-svg" width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="18" cy="44" rx="6" ry="2.2" fill="rgba(15, 23, 42, 0.45)"/>
        <circle cx="18" cy="44" r="2.2" fill="${strokeColor}"/>
        <circle cx="18" cy="44" r="0.9" fill="#ffffff"/>
        <path d="M18 43.5C18 43.5 32 28 32 16.5C32 8.5 25.7 2 18 2C10.3 2 4 8.5 4 16.5C4 28 18 43.5 18 43.5Z" fill="${pinColor}" stroke="${strokeColor}" stroke-width="${isProVariant ? '2.4' : '1.8'}"/>
        <circle cx="18" cy="16.5" r="10" fill="#FFFFFF"/>
      </svg>
      <div class="pin-icon">${isOpen ? STORE_ICON_SVG(pinColor) : LOCK_ICON_SVG(pinColor)}</div>
    </div>`;

  return L.divIcon({
    className: 'custom-leaflet-pin-wrapper',
    html,
    iconSize: PIN_SIZE,
    iconAnchor: PIN_ANCHOR
  });
};

/** Estilo del punto canvas para zoom lejano (sin DOM por tienda). */
export const getStoreDotStyle = (store, isSelected) => {
  const { variant, isOpen, pinColor, isPro } = getStoreVisual(store);
  const isOwner = variant === 'owner' || variant === 'pro_owner';
  return {
    radius: isSelected ? 9.5 : isPro ? 8 : (variant === 'default' || !isOpen) ? 5.5 : 7,
    color: isPro ? '#f59e0b' : isOwner ? '#f59e0b' : '#ffffff',
    weight: isPro ? 3.5 : isOwner ? 3 : 2,
    fillColor: pinColor,
    fillOpacity: isOpen ? 1 : 0.75,
    bubblingMouseEvents: false
  };
};

/** Marcador de la ubicación GPS del usuario. */
export const createUserGpsIcon = () =>
  L.divIcon({
    className: 'custom-leaflet-pin-wrapper',
    html: '<div class="user-gps-beacon" title="Tu Ubicación GPS"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

/**
 * Reconciliador incremental de marcadores (estilo "virtual DOM" para capas Leaflet):
 * crea los que faltan, actualiza solo los que cambiaron de estado y elimina los sobrantes.
 *
 * @param {Map<string, {layer: L.Layer, isSelected: boolean, isOpen: boolean}>} registry
 * @param {L.LayerGroup} group
 * @param {Array<{store: object, isSelected: boolean}>} entries
 * @param {{ create: Function, update: Function }} factory
 */
export const reconcileMarkerLayer = (registry, group, entries, { create, update }) => {
  const keep = new Set();

  entries.forEach(({ store, isSelected }) => {
    keep.add(store.slug);
    const existing = registry.get(store.slug);

    if (!existing) {
      const layer = create(store, isSelected);
      layer.addTo(group);
      registry.set(store.slug, { layer, isSelected, isOpen: store.isOpen });
      return;
    }

    if (existing.isSelected !== isSelected || existing.isOpen !== store.isOpen) {
      update(existing.layer, store, isSelected);
      existing.isSelected = isSelected;
      existing.isOpen = store.isOpen;
    }
  });

  registry.forEach((item, slug) => {
    if (!keep.has(slug)) {
      group.removeLayer(item.layer);
      registry.delete(slug);
    }
  });
};

/** Vacía por completo una capa y su registro asociado. */
export const clearMarkerLayer = (registry, group) => {
  if (registry.size === 0) return;
  group.clearLayers();
  registry.clear();
};
