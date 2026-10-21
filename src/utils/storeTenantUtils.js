/**
 * Utilidades canónicas para identificación y aislamiento de Tiendas Semilla vs. Tiendas de Comerciantes
 *
 * REGLA DEL SISTEMA:
 * - Únicas dos tiendas reales con datos de prueba/demostración autorizados:
 *   1. Matías TiendaTodo ('matias-tiendatodo' / 'default')
 *   2. Tiendita Fernando ('minimarket-ian' / 'tiendita-fernando' / 'fernando')
 * - TODAS las demás tiendas de comerciantes creadas o registradas inician 100% limpias.
 */

export const isFernandoSeedStore = (slug) => {
  if (!slug) return false;
  const s = String(slug).toLowerCase().trim();
  return s === 'minimarket-ian' || s === 'tiendita-fernando' || s === 'fernando';
};

export const isMatiasSeedStore = (slug) => {
  if (!slug) return false;
  const s = String(slug).toLowerCase().trim();
  return s === 'matias-tiendatodo' || s === 'default';
};

export const isOfficialSeedStore = (slug) => {
  return isMatiasSeedStore(slug) || isFernandoSeedStore(slug);
};
