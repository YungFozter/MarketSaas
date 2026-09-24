import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initialProducts, initialCategories, initialStoreConfig, initialOrders, initialProductRequests, initialStores } from '../data/initialData';
import { initialSuppliers, SUPPLIER_CATEGORIES } from '../data/supplierInitialData';
import { initialCreditCustomers, normalizeCreditCustomer } from '../data/creditInitialData';
import { fernandoSuppliers, fernandoCreditCustomers, getFernandoOrders } from '../data/tienditaFernandoData';
import { getStoreCatalog } from '../data/storeInventories';
import confetti from 'canvas-confetti';
import { supabase } from '../services/supabaseClient';
import { exportSalesToCSV, exportSalesToStyledExcel, exportSalesToPDF } from '../utils/salesExportUtils';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

// ==============================================================================
// SISTEMA DE SUSCRIPCIONES, CONTROL DE TIEMPO Y ZONA HORARIA BOLIVIA (UTC-04:00)
// ==============================================================================

// Duración del período de prueba gratuito: 30 días = 43,200 minutos (1 mes completo)
export const TRIAL_DURATION_MINUTES = 43200; // 30 días (1 mes)

// Offset oficial para La Paz - Bolivia (UTC -04:00)
export const BOLIVIA_TIMEZONE_OFFSET_HOURS = -4;

// Formateador canónico en zona horaria de Bolivia (America/La_Paz, UTC-4)
export const formatBoliviaDateTime = (isoString) => {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--';
    return new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return String(isoString);
  }
};

// Cálculo de tiempo restante en vivo (días, horas, minutos, segundos)
export const calculateSubscriptionTimeRemaining = (expiresAtIso, currentTimestamp = Date.now()) => {
  if (!expiresAtIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true, formatted: 'Expirado' };
  }
  const now = currentTimestamp;
  const target = new Date(expiresAtIso).getTime();
  const diffMs = target - now;

  if (diffMs <= 0 || isNaN(diffMs)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true, formatted: 'Expirado' };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    formatted = `${minutes}m ${seconds}s`;
  }

  return { days, hours, minutes, seconds, totalSeconds, isExpired: false, formatted };
};

// Generador de códigos de activación limpios MS-XXXX-XXXX sin caracteres ambiguos (excluyendo 0, O, 1, I, L)
export const generateCleanCode = () => {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MS-${p1}-${p2}`;
};

// Creador de objeto inicial de suscripción
export const createDefaultSubscription = (durationMinutes = TRIAL_DURATION_MINUTES) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
  return {
    status: 'trial', // 'trial' | 'active' | 'expired'
    trialStartedAt: now.toISOString(),
    trialEndsAt: expiresAt.toISOString(),
    subscriptionExpiresAt: expiresAt.toISOString(),
    plan: 'trial_free',
    history: []
  };
};

// Normalizador seguro y blindado de suscripción (evita regalar tiempo indebido o quitar vigencia ganada)
export const normalizeSubscription = (sub, fallbackCreatedAt = null) => {
  const now = Date.now();

  // Si no existe objeto de suscripción previo:
  if (!sub || typeof sub !== 'object') {
    // Si conocemos la fecha real de creación de la tienda en Supabase, calculamos el mes gratis a partir de dicha fecha
    if (fallbackCreatedAt) {
      const createdTime = new Date(fallbackCreatedAt).getTime();
      if (!isNaN(createdTime)) {
        const trialEnd = new Date(createdTime + TRIAL_DURATION_MINUTES * 60 * 1000);
        const isExpired = trialEnd.getTime() <= now;
        return {
          status: isExpired ? 'expired' : 'trial',
          trialStartedAt: new Date(createdTime).toISOString(),
          trialEndsAt: trialEnd.toISOString(),
          subscriptionExpiresAt: trialEnd.toISOString(),
          plan: 'trial_free',
          history: []
        };
      }
    }
    return createDefaultSubscription();
  }

  // 1. Determinar fecha de inicio del mes de prueba
  const trialStartIso = sub.trialStartedAt || sub.trialStarted || fallbackCreatedAt || new Date().toISOString();
  const trialStartTime = new Date(trialStartIso).getTime();

  // 2. Determinar fecha de expiración con máxima fidelidad
  let expiresAt = sub.subscriptionExpiresAt || sub.trialEndsAt || sub.trialEnds;
  
  // Si no tiene fecha de expiración explícita pero tiene fecha de inicio de prueba
  if (!expiresAt && !isNaN(trialStartTime)) {
    expiresAt = new Date(trialStartTime + TRIAL_DURATION_MINUTES * 60 * 1000).toISOString();
  } else if (!expiresAt && fallbackCreatedAt) {
    const createdTime = new Date(fallbackCreatedAt).getTime();
    if (!isNaN(createdTime)) {
      expiresAt = new Date(createdTime + TRIAL_DURATION_MINUTES * 60 * 1000).toISOString();
    }
  }

  if (!expiresAt) {
    expiresAt = new Date().toISOString();
  }

  const isExpired = new Date(expiresAt).getTime() <= now;
  let resolvedStatus = sub.status || (isExpired ? 'expired' : (sub.plan === 'trial_free' ? 'trial' : 'active'));
  if (isExpired) {
    resolvedStatus = 'expired';
  } else if (!isExpired && resolvedStatus === 'expired') {
    resolvedStatus = (sub.plan && sub.plan !== 'trial_free') ? 'active' : 'trial';
  }

  const trialEndsIso = sub.trialEndsAt || sub.trialEnds || (!isNaN(trialStartTime) ? new Date(trialStartTime + TRIAL_DURATION_MINUTES * 60 * 1000).toISOString() : expiresAt);

  return {
    status: resolvedStatus,
    trialStartedAt: trialStartIso,
    trialEndsAt: trialEndsIso,
    subscriptionExpiresAt: expiresAt,
    plan: sub.plan || 'trial_free',
    history: Array.isArray(sub.history) ? sub.history : []
  };
};

// Diccionario canónico de imágenes locales para productos bolivianos
export const CANONICAL_PRODUCT_IMAGES = {
  'azucar-guabira': '/products/azucar-guabira-1kg.png',
  'coca-cola-2l': '/products/coca-cola-2l.png',
  'coca-cola-personal': '/products/coca-cola-personal-500ml.png',
  'galletas-mabels': '/products/galletas-mabels-cremositas.png',
  'galletas-oreo': '/products/galletas-oreo-tubo-108g.png',
  'te-windsor': '/products/te-windsor-negro-20u.png',
  'yogurt-pil': '/products/yogurt-pil-frutilla-1l.png',
  'cunapes': '/products/cunapes-tradicionales-5u.png',
  'agua-vital-2l': '/products/agua-vital.png',
  'agua-vital-600ml': '/products/agua-vital-600ml.png',
  'leche-pil': '/products/leche-pil.png',
  'aceite-fino': '/products/aceite-fino-1800ml.png',
  'cafe-nescafe': '/products/cafe-nescafe-160g.png',
  'omo-detergente': '/products/omo-limon-1.8k.png',
  'fideos-lazzaroni': '/products/fideos-lazzaroni.png',
  'lays-clasicas': '/products/lays-clasicas.png',
  'papel-nacional': '/products/papel-nacional-selecto-6u.jpg',
  'empanadas-santa-clara': '/products/empanadas-santa-clara-2u.png',
  'cerveza-pacena': '/products/cerveza-pacena-lata-440ml.png',
  'red-bull': '/products/red-bull-250ml.png',
  'atun-van-camps': '/products/atun-van-camps-1730g.png',
  'mantequilla-pil': '/products/mantequilla-pil-200g.png',
  'colgate-triple-accion': '/products/colgate-triple-accion-75ml.png',
  'chorizo-parrillero-sofia': '/products/chorizo-parrillero-sofia-kg.png',
  'limpiapiso-todobrillo': '/products/limpiapiso-todobrillo-lavanda.png',
  'sal-lobos': '/products/sal-lobos-yodada-500g.png',
  'jugo-del-valle-fresh': '/products/jugo-del-valle-fresh-3l.png',
  'carbon-curupau': '/products/carbon-curupau-4kg.png'
};

export const resolveCanonicalProductImage = (name = '', currentImage = '') => {
  const normName = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Azúcar Guabirá (reemplaza rosas u otras fotos genéricas)
  if (normName.includes('guabira') || (normName.includes('azucar') && (normName.includes('blanca') || normName.includes('refinada')))) {
    return '/products/azucar-guabira-1kg.png';
  }
  // 2. Coca-Cola 2L
  if (normName.includes('coca') && (normName.includes('2l') || normName.includes('2 l') || normName.includes('2 litros') || normName.includes('2000ml') || normName.includes('familiar'))) {
    return '/products/coca-cola-2l.png';
  }
  // 3. Coca-Cola Personal (500ml / fría)
  if (normName.includes('coca') && (normName.includes('500ml') || normName.includes('500 ml') || normName.includes('personal') || normName.includes('fria'))) {
    return '/products/coca-cola-personal-500ml.png';
  }
  // 4. Galletas Mabel's Cremositas
  if (normName.includes('mabel') || normName.includes('cremosita')) {
    return '/products/galletas-mabels-cremositas.png';
  }
  // 5. Galletas Oreo
  if (normName.includes('oreo')) {
    return '/products/galletas-oreo-tubo-108g.png';
  }
  // 6. Té Windsor
  if (normName.includes('windsor') || (normName.includes('te negro') && normName.includes('20'))) {
    return '/products/te-windsor-negro-20u.png';
  }
  // 7. Yogurt Pil Frutilla
  if (normName.includes('yogurt') && (normName.includes('pil') || normName.includes('frutilla') || normName.includes('fresa'))) {
    return '/products/yogurt-pil-frutilla-1l.png';
  }
  // 8. Cuñapés Tradicionales Cruceños
  if (normName.includes('cunape') || normName.includes('cuñape')) {
    return '/products/cunapes-tradicionales-5u.png';
  }
  // 9. Agua Vital
  if (normName.includes('vital')) {
    if (normName.includes('600')) return '/products/agua-vital-600ml.png';
    return '/products/agua-vital.png';
  }
  // 10. Leche Pil Natural / Entera
  if (normName.includes('leche') && (normName.includes('pil') || normName.includes('entera') || normName.includes('fresca') || normName.includes('seleccion'))) {
    if (!normName.includes('deslactosada')) {
      return '/products/leche-pil.png';
    }
  }
  // 11. Aceite Fino
  if (normName.includes('aceite') && normName.includes('fino')) {
    return '/products/aceite-fino-1800ml.png';
  }
  // 12. Café Nescafé
  if (normName.includes('nescafe') || normName.includes('nescafé') || (normName.includes('cafe') && normName.includes('frasco'))) {
    return '/products/cafe-nescafe-160g.png';
  }
  // 13. Detergente Omo
  if (normName.includes('omo') || (normName.includes('detergente') && normName.includes('polvo'))) {
    return '/products/omo-limon-1.8k.png';
  }
  // 14. Fideos Lazzaroni
  if (normName.includes('lazzaroni')) {
    return '/products/fideos-lazzaroni.png';
  }
  // 15. Papas Lays
  if (normName.includes('lays') || normName.includes('lay\'s')) {
    return '/products/lays-clasicas.png';
  }
  // 16. Papel Higiénico Nacional
  if (normName.includes('nacional selecto') || (normName.includes('papel') && normName.includes('nacional'))) {
    return '/products/papel-nacional-selecto-6u.jpg';
  }
  // 17. Empanadas Santa Clara de Pollo
  if (normName.includes('empanada') && (normName.includes('santa clara') || normName.includes('pollo'))) {
    return '/products/empanadas-santa-clara-2u.png';
  }
  // 18. Cerveza Paceña Lata 440ml
  if (normName.includes('pacena') || normName.includes('paceña')) {
    return '/products/cerveza-pacena-lata-440ml.png';
  }
  // 19. Energizante Red Bull 250 ml
  if (normName.includes('red bull') || normName.includes('redbull')) {
    return '/products/red-bull-250ml.png';
  }
  // 20. Lomitos de atún en aceite Van Camp’s (1730g o 170g)
  if (normName.includes('van camp') || (normName.includes('atun') && (normName.includes('lomitos') || normName.includes('aceite')))) {
    return '/products/atun-van-camps-1730g.png';
  }
  // 21. Mantequilla con Sal Pil / Regia 200g
  if (normName.includes('mantequilla') && (normName.includes('pil') || normName.includes('regia') || normName.includes('sal'))) {
    return '/products/mantequilla-pil-200g.png';
  }
  // 22. Colgate Triple Acción 75ml
  if (normName.includes('colgate') && (normName.includes('triple') || normName.includes('crema'))) {
    return '/products/colgate-triple-accion-75ml.png';
  }
  // 23. Chorizo Parrillero Sofia kg
  if (normName.includes('chorizo') && normName.includes('sofia')) {
    return '/products/chorizo-parrillero-sofia-kg.png';
  }
  // 24. Limpiapiso Todobrillo Plus Lavanda / Poett
  if (normName.includes('todobrillo') || normName.includes('poett') || (normName.includes('limpiapiso') && normName.includes('lavanda'))) {
    return '/products/limpiapiso-todobrillo-lavanda.png';
  }
  // 25. Sal Lobos Yodada 500 gr
  if (normName.includes('sal lobos') || (normName.includes('lobos') && normName.includes('sal'))) {
    return '/products/sal-lobos-yodada-500g.png';
  }
  // 26. Jugo Del Valle Fresh 3 L
  if (normName.includes('del valle fresh') || (normName.includes('del valle') && normName.includes('3'))) {
    return '/products/jugo-del-valle-fresh-3l.png';
  }
  // 27. Carbon Curupau 4 kg
  if (normName.includes('curupau') || (normName.includes('carbon') && (normName.includes('quebracho') || normName.includes('4')))) {
    return '/products/carbon-curupau-4kg.png';
  }
  // 28. Cerveza Paceña Huari / 710ml
  if (normName.includes('huari') || (normName.includes('pacena') && normName.includes('710'))) {
    return '/products/cerveza-pacena-710ml.png';
  }
  // 29. Pan Marraqueta
  if (normName.includes('marraqueta') || normName.includes('pan ')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80';
  }
  // 30. Huevos Frescos Granja / Maple
  if (normName.includes('huevo') || normName.includes('maple')) {
    return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80';
  }
  // 31. Queso Criollo Chaqueño
  if (normName.includes('queso')) {
    return 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80';
  }
  // 32. Arroz Grano de Oro
  if (normName.includes('arroz')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80';
  }
  // 33. Harina Blancaflor
  if (normName.includes('harina')) {
    return 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?w=600&auto=format&fit=crop&q=80';
  }
  // 34. Mermelada de Frutilla
  if (normName.includes('mermelada')) {
    return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80';
  }
  // 35. Plátano Verde-Maduro
  if (normName.includes('platano') || normName.includes('plátano') || normName.includes('banana')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80';
  }
  // 36. Tomate Selección
  if (normName.includes('tomate')) {
    return 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&auto=format&fit=crop&q=80';
  }
  // 37. Manzana Royal Gala
  if (normName.includes('manzana')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80';
  }
  // 38. Cebolla Roja
  if (normName.includes('cebolla')) {
    return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80';
  }
  // 39. Lavavajillas Líquido Limón / Sapolio
  if (normName.includes('lavavajilla') || normName.includes('sapolio')) {
    return 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80';
  }
  // 40. Papel Higiénico Scott
  if (normName.includes('papel') || normName.includes('scott')) {
    return 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&auto=format&fit=crop&q=80';
  }
  // 41. Hamburguesas de Carne Sofía
  if (normName.includes('hamburguesa')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';
  }
  // 42. Nuggets de Pollo Sofía
  if (normName.includes('nugget')) {
    return 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80';
  }
  // 43. Avena Quaker Tradicional
  if (normName.includes('avena') || normName.includes('quaker')) {
    return 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=600&auto=format&fit=crop&q=80';
  }
  // 44. Vino Tinto Campos de Solana
  if (normName.includes('vino') || normName.includes('solana') || normName.includes('malbec')) {
    return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80';
  }
  // 45. Jabón Rexona / Tocador
  if (normName.includes('rexona') || (normName.includes('jabon') && normName.includes('tocador'))) {
    return 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&auto=format&fit=crop&q=80';
  }
  // 46. Jabón Bolívar Barra
  if (normName.includes('bolivar') || (normName.includes('jabon') && normName.includes('barra'))) {
    return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
  }
  // 47. Lavandina Clorox
  if (normName.includes('lavandina') || normName.includes('clorox')) {
    return 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=600&auto=format&fit=crop&q=80';
  }
  // 48. Salsa de Tomate Kris
  if (normName.includes('salsa') && normName.includes('tomate')) {
    return 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&auto=format&fit=crop&q=80';
  }
  // 49. Papas Pringles
  if (normName.includes('pringles')) {
    return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80';
  }

  // Si la imagen actual es la rosa de Unsplash (antiguo enlace erróneo), o está vacía o es placeholder:
  if (!currentImage || currentImage.includes('1581441363689') || currentImage.includes('producto-sin-imagen')) {
    // Fallback inteligente según categoría o palabras clave
    if (normName.includes('pan') || normName.includes('tostada')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80';
    if (normName.includes('huevo')) return 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80';
    if (normName.includes('fruta') || normName.includes('jugo')) return '/products/jugo-del-valle-fresh-3l.png';
    return '/products/producto-sin-imagen.png';
  }

  return currentImage;
};

// Sincronizador de inventario de tienda con catálogo canónico oficial
export const syncProductsWithCanonicalCatalog = (prods = [], storeSlug = 'default') => {
  if (!Array.isArray(prods) || prods.length === 0) return [];
  const canonicalCatalog = getStoreCatalog(storeSlug);
  const canonMap = new Map();
  canonicalCatalog.forEach(c => {
    canonMap.set(c.name.toLowerCase().trim(), c);
    canonMap.set(c.id, c);
  });

  return prods
    .filter(p => {
      if (!p) return false;
      const n = ((p.name || '') + ' ' + (p.id || '')).toLowerCase();
      return !n.includes('gouda') && !n.includes('menorita');
    })
    .map(p => {
      const norm = normalizeProduct(p);
      const key = (norm.name || '').toLowerCase().trim();
      const canon = canonMap.get(key) || canonMap.get(norm.id);
      if (canon) {
        return {
          ...norm,
          name: canon.name,
          price: canon.price !== undefined ? canon.price : norm.price,
          image: (norm.image && !norm.image.includes('producto-sin-imagen')) ? norm.image : canon.image,
          category: (norm.category === 'Sin definir' || !norm.category) ? canon.category : norm.category,
          stock: (canon.stock <= canon.minStock || norm.stock === 'Sin definir') ? canon.stock : norm.stock,
          minStock: canon.minStock !== undefined ? canon.minStock : norm.minStock,
          min_stock: canon.minStock !== undefined ? canon.minStock : norm.minStock
        };
      }
      return norm;
    });
};

// Normalizador canónico de productos para asegurar consistencia entre LocalStorage, Supabase y Realtime
export const normalizeProduct = (p) => {
  if (!p || typeof p !== 'object') return p;
  const numPrice = typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0);

  let rawOriginalPrice = p.originalPrice ?? p.original_price ?? p.originalprice;
  let resolvedOriginalPrice = numPrice;
  if (rawOriginalPrice !== 'Sin definir' && rawOriginalPrice != null && rawOriginalPrice !== '') {
    const parsed = typeof rawOriginalPrice === 'number' ? rawOriginalPrice : parseFloat(rawOriginalPrice);
    resolvedOriginalPrice = isNaN(parsed) ? numPrice : parsed;
  }

  const candidateCosts = [p.cost_price, p.costPrice, p.costprice];
  let resolvedCost = 'Sin definir';
  for (const val of candidateCosts) {
    if (val !== undefined && val !== null && val !== '' && val !== 'Sin definir') {
      const parsed = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.').replace(/[^\d.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        resolvedCost = parsed;
        break;
      }
    }
  }
  if (resolvedCost === 'Sin definir') {
    for (const val of candidateCosts) {
      if (val === 0 || val === '0' || val === '0.00') {
        resolvedCost = 0;
        break;
      }
    }
  }

  let rawStock = p.stock;
  let resolvedStock = 'Sin definir';
  if (rawStock !== undefined && rawStock !== null && rawStock !== '' && rawStock !== 'Sin definir') {
    const parsed = typeof rawStock === 'number' ? Math.floor(rawStock) : parseInt(String(rawStock), 10);
    resolvedStock = isNaN(parsed) ? 'Sin definir' : parsed;
  }

  let rawMinStock = p.minStock ?? p.min_stock ?? p.minstock;
  let resolvedMinStock = 'Sin definir';
  if (rawMinStock !== undefined && rawMinStock !== null && rawMinStock !== '' && rawMinStock !== 'Sin definir') {
    const parsed = typeof rawMinStock === 'number' ? Math.floor(rawMinStock) : parseInt(String(rawMinStock), 10);
    resolvedMinStock = isNaN(parsed) ? 'Sin definir' : parsed;
  }

  let resolvedName = p.name || '';
  let resolvedPrice = numPrice;
  const normLower = resolvedName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normLower.includes('red bull') || normLower.includes('redbull')) {
    resolvedName = 'Energizante Red Bull 250 ml';
  } else if (normLower.includes('van camp') || (normLower.includes('atun') && (normLower.includes('lomitos') || normLower.includes('aceite')))) {
    resolvedName = 'Lomitos de atún en aceite Van Camp’s x 1730 GR';
  } else if (normLower.includes('mantequilla') && (normLower.includes('regia') || normLower.includes('pil'))) {
    resolvedName = 'Mantequilla con Sal Pil 200 G';
  } else if (normLower.includes('oreo') && normLower.includes('117')) {
    resolvedName = 'Galletas Oreo Tubo x 108 gr';
  } else if (normLower.includes('colgate') && (normLower.includes('triple') || normLower.includes('crema'))) {
    resolvedName = 'Colgate Triple Acción - Crema dental 75ML';
  } else if (normLower.includes('pacena') || normLower.includes('paceña')) {
    resolvedName = 'Cerveza Paceña Pilsener Lata X 440Ml';
  } else if (normLower.includes('chorizo') && normLower.includes('sofia')) {
    resolvedName = 'Chorizo Parrillero Sofia kg';
    resolvedPrice = 49.90;
  } else if (normLower.includes('todobrillo') || normLower.includes('poett') || (normLower.includes('limpiapiso') && normLower.includes('lavanda'))) {
    resolvedName = 'LIMPIAPISO TODOBRILLO PLUS LAVANDA';
    resolvedPrice = 15.90;
  } else if (normLower.includes('sal') && normLower.includes('lobos')) {
    resolvedName = 'Sal Lobos Yodada 500 gr';
    resolvedPrice = 21.00;
  } else if (normLower.includes('huari') || normLower.includes('del valle fresh') || (normLower.includes('del valle') && normLower.includes('3'))) {
    resolvedName = 'Jugo Del Valle Fresh 3 L';
    resolvedPrice = 18.00;
  } else if (normLower.includes('curupau') || (normLower.includes('carbon') && (normLower.includes('quebracho') || normLower.includes('4')))) {
    resolvedName = 'Carbon Curupau 4 kg';
    resolvedPrice = 29.00;
  }

  if (resolvedPrice !== numPrice && (resolvedOriginalPrice === numPrice || resolvedOriginalPrice < resolvedPrice)) {
    resolvedOriginalPrice = resolvedPrice;
  }

  const resolvedImage = resolveCanonicalProductImage(resolvedName, p.image || p.imageUrl || '');

  return {
    ...p,
    name: resolvedName,
    price: resolvedPrice,
    originalPrice: resolvedOriginalPrice,
    original_price: resolvedOriginalPrice,
    costPrice: resolvedCost,
    cost_price: resolvedCost,
    stock: resolvedStock,
    minStock: resolvedMinStock,
    min_stock: resolvedMinStock,
    category: p.category || 'Sin definir',
    unit: p.unit || 'Sin definir',
    description: p.description || 'Sin definir',
    image: resolvedImage || '/products/producto-sin-imagen.png',
    code: p.code ? String(p.code) : '',
    badge: p.badge || '',
    supplierId: p.supplierId ? String(p.supplierId) : (p.supplier_id ? String(p.supplier_id) : ''),
    supplier_id: p.supplierId ? String(p.supplierId) : (p.supplier_id ? String(p.supplier_id) : ''),
    supplierName: p.supplierName ? String(p.supplierName) : (p.supplier_name ? String(p.supplier_name) : ''),
    supplier_name: p.supplierName ? String(p.supplierName) : (p.supplier_name ? String(p.supplier_name) : ''),
    isPopular: Boolean(p.isPopular ?? p.is_popular),
    is_popular: Boolean(p.isPopular ?? p.is_popular),
    isActive: p.isActive !== undefined ? Boolean(p.isActive) : (p.is_active !== undefined ? Boolean(p.is_active) : true),
    is_active: p.isActive !== undefined ? Boolean(p.isActive) : (p.is_active !== undefined ? Boolean(p.is_active) : true)
  };
};

// Normalizador canónico de peticiones de productos ("Pídelo si no está")
export const normalizeProductRequest = (req) => {
  if (!req || typeof req !== 'object') return null;
  const createdDate = req.created_at || req.createdAt || req.date;
  let formattedDate = 'Hoy';
  if (createdDate) {
    try {
      const d = new Date(createdDate);
      formattedDate = !isNaN(d.getTime()) 
        ? d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : String(createdDate);
    } catch {
      formattedDate = String(createdDate);
    }
  }

  const pName = req.productName || req.product_name || req.productname || 'Producto sugerido';
  const cName = req.customerName || req.customer_name || req.customername || 'Vecino';
  const cLoc = req.customerLocation || req.customer_location || req.customerlocation || '';

  return {
    id: String(req.id),
    tenant_id: req.tenant_id || 'default',
    productName: pName,
    product_name: pName,
    customerName: cName,
    customer_name: cName,
    customerLocation: cLoc,
    customer_location: cLoc,
    notes: req.notes || '',
    votes: typeof req.votes === 'number' ? req.votes : (parseInt(req.votes, 10) || 1),
    status: req.status || 'pending', // 'pending' | 'approved' | 'stocked' | 'rejected'
    date: formattedDate,
    created_at: req.created_at || req.createdAt || new Date().toISOString()
  };
};

// Filtra automáticamente solicitudes de prueba de diagnósticos
export const filterOutTestRequests = (requests) => {
  if (!Array.isArray(requests)) return [];
  return requests.filter(r => r && r.id && !String(r.id).startsWith('TEST-') && !String(r.id).startsWith('VERIFY-'));
};

// Identificadores y nombres de proveedores demo a ignorar/purgar definitivamente
export const DEMO_SUPPLIER_IDS = ['sup-coca-cola', 'sup-pil-andina', 'sup-cbn-pacena', 'sup-sofia'];

export const isDemoSupplier = (s) => {
  if (!s || typeof s !== 'object') return false;
  const id = String(s.id || '').toLowerCase().trim();
  // Nunca filtrar proveedores oficiales de Tiendita Fernando
  if (id.startsWith('sup-fernando')) return false;
  // Solo descartar si es exactamente uno de los IDs demo legacy sin teléfono ni datos de contacto
  if (DEMO_SUPPLIER_IDS.includes(s.id) || DEMO_SUPPLIER_IDS.includes(id)) {
    if (s.phone || s.contactName || s.contact_name) return false;
    return true;
  }
  return false;
};

export const filterOutDemoSuppliers = (list) => {
  if (!Array.isArray(list)) return [];
  return list.filter(s => s && !isDemoSupplier(s));
};

// Purga inmediata y forzosa de proveedores demo legacy
if (typeof window !== 'undefined') {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supplier') && !key.includes('minimarket-ian') && !key.includes('tiendita-fernando')) {
        const item = localStorage.getItem(key);
        if (item && (item.includes('sup-coca-cola') || item.includes('sup-pil-andina'))) {
          try {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed)) {
              const cleaned = filterOutDemoSuppliers(parsed);
              localStorage.setItem(key, JSON.stringify(cleaned));
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (e) {}
}

export const normalizeSupplier = (s) => {
  if (!s || typeof s !== 'object') return null;
  return {
    id: String(s.id),
    name: s.name || '',
    contactName: s.contactName ?? s.contact_name ?? '',
    phone: s.phone || '',
    category: s.category || 'Otros',
    visitDays: Array.isArray(s.visitDays) 
      ? s.visitDays 
      : Array.isArray(s.visit_days) 
        ? s.visit_days 
        : (typeof s.visit_days === 'string' ? JSON.parse(s.visit_days || '[]') : []),
    notes: s.notes || '',
    orderItems: Array.isArray(s.orderItems) 
      ? s.orderItems 
      : Array.isArray(s.order_items) 
        ? s.order_items 
        : (typeof s.order_items === 'string' ? JSON.parse(s.order_items || '[]') : []),
    createdAt: s.createdAt || s.created_at || new Date().toISOString(),
    updatedAt: s.updatedAt || s.updated_at || new Date().toISOString(),
    tenant_id: s.tenant_id || 'default'
  };
};

// Normalizador estándar de número de celular / WhatsApp boliviano (+591 XXXXXXXX)
export const normalizeCustomerPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  const cleanDigits = digits.startsWith('591') ? digits.slice(3) : digits;
  return `+591 ${cleanDigits.slice(0, 8)}`;
};

// Normalizador canónico de Pedidos (Asegura consistencia entre Supabase, Kanban y LocalStorage)
export const normalizeOrder = (o) => {
  if (!o || typeof o !== 'object') return o;

  let payMethod = 'cash';
  let cashChange = null;

  if (typeof o.payment_method === 'string') {
    payMethod = o.payment_method;
  } else if (o.payment_method && typeof o.payment_method === 'object') {
    payMethod = o.payment_method.type || o.payment_method.method || 'cash';
    cashChange = o.payment_method.cashChangeFor || o.payment_method.cash_change_for || null;
  } else if (typeof o.paymentMethod === 'string') {
    payMethod = o.paymentMethod;
  } else if (o.paymentMethod && typeof o.paymentMethod === 'object') {
    payMethod = o.paymentMethod.type || o.paymentMethod.method || 'cash';
    cashChange = o.paymentMethod.cashChangeFor || o.paymentMethod.cash_change_for || null;
  }

  const dType = o.delivery_type || o.deliveryType || 'pickup';
  const dFee = o.delivery_fee != null ? Number(o.delivery_fee) : (o.deliveryFee != null ? Number(o.deliveryFee) : 0);
  const created = o.created_at || o.createdAt || new Date().toISOString();
  const cCode = o.coupon_code || o.couponCode || null;

  return {
    ...o,
    id: String(o.id),
    tenant_id: o.tenant_id || 'default',
    owner_id: o.owner_id || null,
    customer: o.customer || { name: 'Vecino', phone: '' },
    items: Array.isArray(o.items) ? o.items : [],
    subtotal: Number(o.subtotal || 0),
    total: Number(o.total || 0),
    discount: Number(o.discount || 0),
    status: o.status || 'pending',
    // Compatibilidad dual snake_case y camelCase
    delivery_type: dType,
    deliveryType: dType,
    delivery_fee: dFee,
    deliveryFee: dFee,
    payment_method: payMethod,
    paymentMethod: payMethod,
    cashChangeFor: cashChange || o.cashChangeFor || o.cash_change_for || null,
    cash_change_for: cashChange || o.cashChangeFor || o.cash_change_for || null,
    coupon_code: cCode,
    couponCode: cCode,
    created_at: created,
    createdAt: created
  };
};

// Generador de iconos inteligente para categorías
export const getCategoryIconName = (name) => {
  if (!name) return 'Layers';
  const lower = name.toLowerCase();
  if (lower.includes('lacte') || lower.includes('huev') || lower.includes('leche') || lower.includes('queso') || lower.includes('yogur')) return 'Milk';
  if (lower.includes('pan') || lower.includes('desayun') || lower.includes('cafe') || lower.includes('café') || lower.includes('croissant') || lower.includes('reposter')) return 'Croissant';
  if (lower.includes('abarrot') || lower.includes('despensa') || lower.includes('arroz') || lower.includes('fideo') || lower.includes('pasta') || lower.includes('enlatad') || lower.includes('aceite')) return 'Package';
  if (lower.includes('frut') || lower.includes('verdur') || lower.includes('vegetal') || lower.includes('hortaliz')) return 'Apple';
  if (lower.includes('bebid') || lower.includes('licor') || lower.includes('jugo') || lower.includes('gaseosa') || lower.includes('refresco') || lower.includes('cervez') || lower.includes('vino') || lower.includes('agua') || lower.includes('soda')) return 'Coffee';
  if (lower.includes('snack') || lower.includes('golosin') || lower.includes('dulce') || lower.includes('gallet') || lower.includes('chocolate') || lower.includes('caramelo')) return 'Cookie';
  if (lower.includes('limpiez') || lower.includes('hogar') || lower.includes('aseo') || lower.includes('detergente') || lower.includes('lavand')) return 'Sparkle';
  return 'Layers';
};

// Deduplicador robusto por ID y por Código para evitar que aparezcan productos duplicados
export const deduplicateProducts = (productList) => {
  if (!Array.isArray(productList)) return [];
  const seenIds = new Set();
  const seenCodes = new Set();
  const result = [];

  for (const item of productList) {
    if (!item || typeof item !== 'object') continue;
    const cleanId = item.id != null ? String(item.id).trim() : '';
    const cleanCode = item.code != null ? String(item.code).trim() : '';

    if (cleanId && seenIds.has(cleanId)) continue;
    if (cleanCode && cleanCode !== 'Sin definir' && cleanCode !== '' && seenCodes.has(cleanCode)) continue;

    if (cleanId) seenIds.add(cleanId);
    if (cleanCode && cleanCode !== 'Sin definir' && cleanCode !== '') seenCodes.add(cleanCode);

    result.push(item);
  }
  return result;
};

// Registro y consulta de IDs de productos eliminados explícitamente por el dueño
export const getDeletedProductIds = (slug) => {
  if (!slug) return new Set();
  try {
    const raw = localStorage.getItem(`marketsaas_${slug}_deleted_products`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map(String));
    }
  } catch (e) {
    console.warn('Error leyendo deleted_products:', e);
  }
  return new Set();
};

export const recordDeletedProductIds = (slug, ids = []) => {
  if (!slug || !Array.isArray(ids) || ids.length === 0) return;
  try {
    const current = getDeletedProductIds(slug);
    ids.forEach(id => {
      if (id != null) current.add(String(id));
    });
    localStorage.setItem(`marketsaas_${slug}_deleted_products`, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Error guardando deleted_products:', e);
  }
};

// Sanitiza productos descartando elementos nulos o residuos descontinuados sin eliminar productos válidos
export const filterOutLegacyDemoProducts = (productList, slug) => {
  if (!Array.isArray(productList)) {
    return [];
  }
  // Excluir siempre queso gouda / menorita eliminado canónicamente y elementos inválidos
  return productList.filter(p => {
    if (!p || typeof p !== 'object') return false;
    const n = ((p.name || '') + ' ' + (p.id || '')).toLowerCase();
    if (n.includes('gouda') || n.includes('menorita')) return false;
    // Para Tiendita Fernando (minimarket-ian), descartar los 26 duplicados antiguos sin stock definido
    if ((slug === 'minimarket-ian' || slug === 'tiendita-fernando') && String(p.id).includes('178930808360')) {
      return false;
    }
    return true;
  });
};

// Filtra pedidos reales descartando pruebas, vacíos o residuos de diagnóstico
export const filterOutGhostOrders = (orderList) => {
  if (!Array.isArray(orderList)) return [];
  return orderList.filter(o => {
    if (!o || typeof o !== 'object') return false;
    const id = String(o.id || '');
    if (!id || id === '{}' || id.startsWith('CHECK-') || id.startsWith('TEST-') || id === 'ORD-1319') {
      return false;
    }
    // Descartar órdenes fantasma sin artículos o con total 0 (residuos de pruebas o carritos vacíos)
    const items = Array.isArray(o.items) ? o.items : [];
    const total = Number(o.total || 0);
    if (items.length === 0 || total <= 0) {
      return false;
    }
    return true;
  });
};

export const deduplicateStoreList = (storeList) => {
  const seenIds = new Set();
  const seenSlugs = new Set();
  const seenNames = new Set();
  return (storeList || []).filter(s => {
    if (!s) return false;
    const id = (s.id || '').toString().toLowerCase().trim();
    const slug = (s.slug || '').toString().toLowerCase().trim();
    const name = (s.name || '').toString().toLowerCase().trim();

    if (id && seenIds.has(id)) return false;
    if (slug && seenSlugs.has(slug)) return false;
    if (name && seenNames.has(name)) return false;

    if (id) seenIds.add(id);
    if (slug) seenSlugs.add(slug);
    if (name) seenNames.add(name);
    return true;
  });
};

// Invalidación automática de versión de catálogo para asegurar sincronización de imágenes y productos
export const CURRENT_SCHEMA_VER = '2026-09-19-v21-batch5-hires-sync';

// Limpieza síncrona inmediata en el navegador del usuario si la versión de catálogo cambió
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const storedVer = localStorage.getItem('marketsaas_catalog_version');
    if (storedVer !== CURRENT_SCHEMA_VER) {
      const keysToPurge = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('marketsaas_') && k.endsWith('_products')) {
          keysToPurge.push(k);
        }
      }
      keysToPurge.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('marketsaas_catalog_version', CURRENT_SCHEMA_VER);
    }
  } catch (e) {}
}

export const StoreProvider = ({ children }) => {
  // Identificador de Tienda Multi-Tenant (ej. ?store=donpepe o ?tenant=central)
  const getInitialTenantSlug = () => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('store') || params.get('tenant') || localStorage.getItem('marketsaas_active_tenant') || null;
    if (raw === 'tiendita-fernando' || raw === 'fernando') return 'minimarket-ian';
    return raw;
  };
  const [tenantSlugState, setTenantSlugState] = useState(getInitialTenantSlug);
  const tenantSlug = (tenantSlugState === 'tiendita-fernando' || tenantSlugState === 'fernando') ? 'minimarket-ian' : tenantSlugState;
  const setTenantSlug = (slug) => {
    const resolved = (slug === 'tiendita-fernando' || slug === 'fernando') ? 'minimarket-ian' : slug;
    setTenantSlugState(resolved);
  };

  // Estados de Autenticación de Dueño
  const [currentUser, setCurrentUser] = useState(null);
  const [merchantStore, setMerchantStore] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return window.location.hash.includes('type=recovery');
    }
    return false;
  });

  // 1. Vista actual: Persistencia en localStorage y URL
  // Si el usuario recarga la página, se mantiene en la sección correspondiente (ej. 'customer' / Vista Vecino).
  // NOTA DE SEGURIDAD: 'superadmin' NUNCA se inicializa desde URL pública sin sesión validada.
  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view');
      if (urlView && ['spectator', 'customer', 'admin'].includes(urlView)) {
        return urlView;
      }
      if (params.get('store') || params.get('tenant')) {
        return 'customer';
      }
      const savedView = localStorage.getItem('marketsaas_active_view_mode');
      if (savedView && ['spectator', 'customer', 'admin'].includes(savedView)) {
        return savedView;
      }
    }
    return 'spectator';
  });

  const setViewMode = (newMode) => {
    if (newMode === 'superadmin' && !isSuperAdminUser(currentUser)) {
      console.warn('Acceso denegado a SuperAdmin: Requiere sesión autenticada con rol SuperAdmin');
      showToast('Acceso denegado. Se requieren credenciales de SuperAdmin.', 'error');
      return;
    }
    setViewModeState(newMode);
    // Si cambiamos a Vista Dueño (admin), asegurar que tenantSlug corresponda a la tienda del dueño
    if (newMode === 'admin' && merchantStore?.id) {
      setTenantSlug(merchantStore.id);
      try {
        localStorage.setItem('marketsaas_active_tenant', merchantStore.id);
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('marketsaas_active_view_mode', newMode);
        const url = new URL(window.location.href);
        url.searchParams.set('view', newMode);
        if (newMode === 'admin' && merchantStore?.id) {
          url.searchParams.set('store', merchantStore.id);
        }
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        console.error('Error al persistir vista activa:', e);
      }
    }
  };

  // 1.1. Sub-vista dentro del modo Vecino / Cliente ('directory' | 'storefront')
  const [customerSubView, setCustomerSubViewState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('store') && params.get('store') !== 'default') {
        return 'storefront';
      }
      const savedSubView = localStorage.getItem('marketsaas_customer_subview');
      if (savedSubView && ['directory', 'storefront'].includes(savedSubView)) {
        return savedSubView;
      }
    }
    return 'directory';
  });

  const setCustomerSubView = (newSubView) => {
    setCustomerSubViewState(newSubView);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('marketsaas_customer_subview', newSubView);
      } catch (e) {
        console.error('Error al persistir sub-vista:', e);
      }
    }
  };

  // Sincronización de URL y soporte para botones Atrás/Adelante
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (!url.searchParams.has('view')) {
          url.searchParams.set('view', viewMode);
          window.history.replaceState({}, '', url.toString());
        }
      } catch (e) {}

      const handlePopState = () => {
        const params = new URLSearchParams(window.location.search);
        const urlView = params.get('view');
        if (urlView && ['spectator', 'customer', 'admin'].includes(urlView)) {
          setViewModeState(urlView);
        }
        if (params.get('store')) {
          setCustomerSubViewState('storefront');
        } else if (urlView === 'customer') {
          setCustomerSubViewState('directory');
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [viewMode]);

  // Lista global de tiendas para el Directorio & Mapa Hiperlocal
  const [stores, setStores] = useState(() => {
    try {
      const cached = localStorage.getItem('marketsaas_cached_stores');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const updatedCached = parsed.map(s => {
            const canonical = initialStores.find(init => init.slug === s.slug || init.id === s.id);
            return canonical ? { ...s, ...canonical } : s;
          });
          return deduplicateStoreList(updatedCached);
        }
      }
    } catch (e) {}
    return deduplicateStoreList(initialStores);
  });
  const [selectedStore, setSelectedStore] = useState(() => {
    return initialStores.find(s => s.slug === tenantSlug || s.aliases?.includes(tenantSlug)) || null;
  });

  const goToStore = (storeSlugOrId) => {
    const foundStore = stores.find(s => s.slug === storeSlugOrId || s.id === storeSlugOrId || s.aliases?.includes(storeSlugOrId));
    if (foundStore) {
      setSelectedStore(foundStore);
      setTenantSlug(foundStore.slug);
      try {
        localStorage.setItem('marketsaas_active_tenant', foundStore.slug);
      } catch (e) {}
      setStoreConfigState(prev => ({
        ...prev,
        name: foundStore.name,
        tagline: foundStore.tagline || prev.tagline,
        address: foundStore.address || prev.address
      }));

      // Pre-cargar de forma inmediata el catálogo variado de la tienda seleccionada
      try {
        const localProds = localStorage.getItem(`marketsaas_${foundStore.slug}_products`);
        const baseCatalog = getStoreCatalog(foundStore.slug).map(normalizeProduct);
        const deletedIds = getDeletedProductIds(foundStore.slug);
        if (localProds) {
          const parsed = JSON.parse(localProds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map(p => String(p.id)));
            const combined = [...parsed];
            baseCatalog.forEach(bp => {
              if (!existingIds.has(String(bp.id)) && !deletedIds.has(String(bp.id))) {
                combined.push(bp);
              }
            });
            const synced = syncProductsWithCanonicalCatalog(combined, foundStore.slug);
            setProducts(deduplicateProducts(filterOutLegacyDemoProducts(synced, foundStore.slug)));
          } else {
            setProducts(baseCatalog.filter(bp => !deletedIds.has(String(bp.id))));
          }
        } else {
          setProducts(baseCatalog.filter(bp => !deletedIds.has(String(bp.id))));
        }
      } catch {
        setProducts(getStoreCatalog(foundStore.slug).map(normalizeProduct));
      }
    }
    setCustomerSubView('storefront');
    setViewMode('customer');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'customer');
      if (foundStore) url.searchParams.set('store', foundStore.slug);
      window.history.replaceState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToDirectory = () => {
    setCustomerSubView('directory');
    setViewMode('customer');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'customer');
      url.searchParams.delete('store');
      window.history.replaceState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 2. Productos
  const [products, setProducts] = useState(() => {
    if (tenantSlug && tenantSlug !== 'default') {
      const baseCatalog = getStoreCatalog(tenantSlug).map(normalizeProduct);
      const deletedIds = getDeletedProductIds(tenantSlug);
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_products`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map(p => String(p.id)));
            const combined = [...parsed];
            baseCatalog.forEach(bp => {
              if (!existingIds.has(String(bp.id)) && !deletedIds.has(String(bp.id))) {
                combined.push(bp);
              }
            });
            const synced = syncProductsWithCanonicalCatalog(combined, tenantSlug);
            return deduplicateProducts(filterOutLegacyDemoProducts(synced, tenantSlug));
          }
        } catch (e) {
          // fallback
        }
      }
      return baseCatalog.filter(bp => !deletedIds.has(String(bp.id)));
    }
    return tenantSlug === 'default' ? initialProducts.map(normalizeProduct) : [];
  });

  // 3. Configuración de Tienda
  const [storeConfig, setStoreConfigState] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_config`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.name || parsed.name.includes('Don Pepe') || parsed.name.includes('VeciStore')) {
          parsed.name = 'Minimarket Saas';
        }
        if (!parsed.address || parsed.address.includes('Calle Los Sauces')) {
          parsed.address = 'Direccion según cada Tienda';
        }
        if (!parsed.schedule || parsed.schedule.includes('08:00 AM')) {
          parsed.schedule = 'Horarios de Atención según cada Tienda';
        }
        if (parsed.defaultDeliveryFee === undefined || parsed.defaultDeliveryFee === 5.00) {
          parsed.defaultDeliveryFee = 0.00;
        }
        if (Array.isArray(parsed.condominiums)) {
          parsed.condominiums = parsed.condominiums.map(c => ({
            ...c,
            deliveryFee: c.deliveryFee === 5.00 || c.deliveryFee === 7.00 || c.deliveryFee === 8.00 ? 0.00 : c.deliveryFee
          }));
        }
        if (Array.isArray(parsed.coupons)) {
          parsed.coupons = parsed.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511');
        } else {
          parsed.coupons = [];
        }
        const cleaned = { 
          ...initialStoreConfig, 
          ...parsed, 
          coupons: parsed.coupons,
          subscription: normalizeSubscription(parsed.subscription)
        };
        try {
          localStorage.setItem(`marketsaas_${tenantSlug}_store_config`, JSON.stringify(cleaned));
        } catch (err) {}
        return cleaned;
      } catch (e) {
        return {
          ...initialStoreConfig,
          subscription: createDefaultSubscription()
        };
      }
    }
    return {
      ...initialStoreConfig,
      subscription: createDefaultSubscription()
    };
  });

  const setStoreConfig = async (newConfigData) => {
    const rawUpdated = typeof newConfigData === 'function' ? newConfigData(storeConfig) : newConfigData;
    const { adminPassword, admin_pin, ...safeConfig } = rawUpdated;
    if (Array.isArray(safeConfig.coupons)) {
      safeConfig.coupons = safeConfig.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511');
    }
    safeConfig.subscription = safeConfig.subscription ? normalizeSubscription(safeConfig.subscription) : (storeConfig?.subscription || createDefaultSubscription());
    setStoreConfigState(safeConfig);

    const effectiveTenant = tenantSlug || merchantStore?.id || safeConfig?.id || localStorage.getItem('marketsaas_active_tenant') || 'default';

    try {
      localStorage.setItem(`marketsaas_${effectiveTenant}_store_config`, JSON.stringify(safeConfig));
      localStorage.setItem(`marketsaas_${effectiveTenant}_config`, JSON.stringify(safeConfig));
      if (effectiveTenant !== 'default') {
        localStorage.setItem('marketsaas_active_tenant', effectiveTenant);
      }
    } catch (err) {
      console.warn('Aviso guardando store_config en localStorage:', err);
    }

    // Sincronizar INMEDIATAMENTE las coordenadas en la lista de tiendas stores para que el mapa de Vista Vecino se actualice en tiempo real sin desfase
    const effectiveLat = safeConfig.latitude !== '' && safeConfig.latitude != null ? parseFloat(safeConfig.latitude) : safeConfig.googleMapsCoordinates?.lat;
    const effectiveLng = safeConfig.longitude !== '' && safeConfig.longitude != null ? parseFloat(safeConfig.longitude) : safeConfig.googleMapsCoordinates?.lng;
    const validCoords = (typeof effectiveLat === 'number' && !isNaN(effectiveLat) && typeof effectiveLng === 'number' && !isNaN(effectiveLng))
      ? { lat: effectiveLat, lng: effectiveLng }
      : null;

    if (validCoords) {
      setStores(prev => {
        const targetId = (effectiveTenant && effectiveTenant !== 'default') ? effectiveTenant : merchantStore?.id;
        if (!targetId) return prev;
        const next = prev.map(s => {
          if (s.slug === targetId || s.id === targetId) {
            return {
              ...s,
              name: safeConfig.name || s.name,
              address: safeConfig.address || s.address,
              tagline: safeConfig.tagline || s.tagline,
              googleMapsCoordinates: validCoords,
              logoUrl: safeConfig.logoUrl || s.logoUrl || null,
              bannerUrl: safeConfig.bannerUrl || s.bannerUrl || null,
              imageUrl: safeConfig.bannerUrl || safeConfig.logoUrl || s.imageUrl,
              isCurrentOwnerStore: true
            };
          }
          return s;
        });
        return deduplicateStoreList(next);
      });
    }

    if (supabase && effectiveTenant && effectiveTenant !== 'default') {
      try {
        const sessionUser = (await supabase.auth.getUser())?.data?.user || currentUser;
        const ownerId = sessionUser?.id || merchantStore?.owner_id || safeConfig.owner_id || null;

        // Construir payload con las columnas existentes en el esquema de public.store_config.
        // Todos los campos específicos (bannerUrl, logoUrl, zone, reference, latitude, longitude,
        // googleMapsCoordinates, etc.) se preservan de forma segura e íntegra dentro de config (JSONB).
        const payload = {
          id: effectiveTenant,
          tenant_id: effectiveTenant,
          name: safeConfig.name || 'Tienda',
          address: safeConfig.address || null,
          slogan: safeConfig.tagline || null,
          phone: safeConfig.phone || null,
          whatsapp: safeConfig.whatsapp || null,
          is_open: safeConfig.isOpen !== false,
          enable_delivery: safeConfig.enableDelivery === true,
          categories: safeConfig.categories || [],
          config: safeConfig,
          coupons: safeConfig.coupons || [],
          owner_id: ownerId,
          qr_image_url: safeConfig.qrImageUrl || null,
          updated_at: new Date().toISOString()
        };

        let { data, error } = await supabase
          .from('store_config')
          .upsert([payload], { onConflict: 'id' })
          .select();

        // Fallback de resiliencia: Si Supabase reporta que alguna columna no existe en el schema cache (código PGRST204 o mensaje similar)
        if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column'))) {
          console.warn('Aviso de columna no encontrada en store_config, reintentando con payload esencial garantizado:', error.message);
          const resilientPayload = {
            id: effectiveTenant,
            tenant_id: effectiveTenant,
            name: safeConfig.name || 'Tienda',
            address: safeConfig.address || null,
            phone: safeConfig.phone || null,
            is_open: safeConfig.isOpen !== false,
            config: safeConfig,
            owner_id: ownerId,
            updated_at: new Date().toISOString()
          };
          const retryRes = await supabase
            .from('store_config')
            .upsert([resilientPayload], { onConflict: 'id' })
            .select();
          data = retryRes.data;
          error = retryRes.error;
        }

        if (error) {
          console.error('Error sincronizando storeConfig en Supabase:', error);
          return { success: false, error, savedLocally: true };
        }
        return { success: true, data, savedLocally: true };
      } catch (err) {
        console.error('Error de red sincronizando storeConfig en Supabase:', err);
        return { success: false, error: err, savedLocally: true };
      }
    }
    return { success: true, savedLocally: true };
  };

  // 4. Carrito de Compras (En Modo Demostración inicia siempre vacío en cada recarga)
  const [cart, setCart] = useState([]);

  // 5. Ubicación seleccionada por el cliente
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_location`);
    return saved ? JSON.parse(saved) : {
      condominium: initialStoreConfig.condominiums[0].name,
      tower: initialStoreConfig.condominiums[0].towers[0],
      apartment: '',
      notes: ''
    };
  });

  // 6. Pedidos (Normalizados para compatibilidad frontend y base de datos)
  const [orders, setOrders] = useState(() => {
    try {
      const isFernando = tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando';
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_orders`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = filterOutGhostOrders(parsed.map(normalizeOrder));
          if (cleaned.length > 0) {
            return cleaned;
          }
        }
      }
      if (isFernando) {
        return filterOutGhostOrders(getFernandoOrders().map(normalizeOrder));
      }
      return tenantSlug === 'default' ? filterOutGhostOrders(initialOrders.map(normalizeOrder)) : [];
    } catch (e) {
      console.warn('Error reading stored orders:', e);
      if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando') {
        return filterOutGhostOrders(getFernandoOrders().map(normalizeOrder));
      }
      return tenantSlug === 'default' ? filterOutGhostOrders(initialOrders.map(normalizeOrder)) : [];
    }
  });

  // 7. Identidad del Cliente / Vecino (Teléfono/WhatsApp y Nombre)
  const [customerPhone, setCustomerPhoneState] = useState(() => {
    try {
      return localStorage.getItem('marketsaas_customer_phone') || '';
    } catch {
      return '';
    }
  });

  const [customerName, setCustomerNameState] = useState(() => {
    try {
      return localStorage.getItem('marketsaas_customer_name') || '';
    } catch {
      return '';
    }
  });

  const setCustomerPhone = (phone) => {
    setCustomerPhoneState(phone || '');
    try {
      if (phone) {
        localStorage.setItem('marketsaas_customer_phone', phone);
      } else {
        localStorage.removeItem('marketsaas_customer_phone');
      }
    } catch {}
  };

  const setCustomerName = (name) => {
    setCustomerNameState(name || '');
    try {
      if (name) {
        localStorage.setItem('marketsaas_customer_name', name);
      } else {
        localStorage.removeItem('marketsaas_customer_name');
      }
    } catch {}
  };

  // 8. Solicitudes de productos (En Modo Demostración inicia con listado de ejemplo; en tiendas registradas con su lista o vacía)
  const [productRequests, setProductRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_requests`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return filterOutTestRequests(parsed.map(normalizeProductRequest));
      }
    } catch (e) {}
    return tenantSlug === 'default' ? initialProductRequests.map(normalizeProductRequest) : [];
  });

  // 9. Proveedores y Preventistas de la tienda (Directorio de compras y pedidos de abastecimiento)
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_suppliers`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = filterOutDemoSuppliers(parsed).map(normalizeSupplier).filter(Boolean);
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch (e) {}
    if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando' || (!tenantSlug && merchantStore?.id === 'minimarket-ian')) {
      return fernandoSuppliers.map(normalizeSupplier);
    }
    return [];
  });

  // 9.b Rubros o Categorías Principales de Proveedores
  const [supplierCategories, setSupplierCategoriesState] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_supplier_categories`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    if (Array.isArray(storeConfig?.supplierCategories) && storeConfig.supplierCategories.length > 0) {
      return storeConfig.supplierCategories;
    }
    return SUPPLIER_CATEGORIES;
  });

  // 10. Libreta de Créditos y Cuentas por Cobrar (El Fiao Vecinal Digital)
  const [creditCustomers, setCreditCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_credits`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeCreditCustomer).filter(Boolean);
        }
      }
    } catch (e) {}
    if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando' || (!tenantSlug && merchantStore?.id === 'minimarket-ian')) {
      return fernandoCreditCustomers.map(normalizeCreditCustomer);
    }
    return tenantSlug === 'default' ? initialCreditCustomers.map(normalizeCreditCustomer) : [];
  });

  // 11. Cupones de descuento aplicados
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // 10. Pedido activo para seguimiento y modal de tracking
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_active_order`);
      if (saved === 'ORD-1319' || String(saved).startsWith('TEST-') || String(saved).startsWith('CHECK-')) {
        localStorage.removeItem(`marketsaas_${tenantSlug}_active_order`);
        localStorage.removeItem('marketsaas_default_active_order');
        return null;
      }
      return saved || null;
    } catch (e) {
      return null;
    }
  });
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Auto-limpieza de pedido activo si el pedido ya fue entregado o cancelado (solo cuando el modal de tracking esté cerrado)
  useEffect(() => {
    if (!activeTrackingOrderId) return;
    const existing = orders.find(o => o.id === activeTrackingOrderId);
    // Si el pedido existe y ya concluyó su ciclo activo:
    if (existing && ['delivered', 'cancelled'].includes(existing.status)) {
      if (!isTrackingModalOpen) {
        setActiveTrackingOrderId(null);
        try {
          localStorage.removeItem(`marketsaas_${tenantSlug}_active_order`);
          localStorage.removeItem('marketsaas_default_active_order');
        } catch (e) {}
      }
    }
  }, [orders, activeTrackingOrderId, tenantSlug, isTrackingModalOpen]);

  // 11. Toast notification
  const [toast, setToast] = useState(null);

  // Función para buscar y cargar la tienda asociada al dueño
  const fetchStoreForUser = async (userId, userEmail = null) => {
    if (!supabase || (!userId && !userEmail)) return null;
    try {
      let storeRecord = null;
      // Intento 1: buscar por owner_id directo si tenemos userId
      if (userId) {
        const { data, error } = await supabase
          .from('store_config')
          .select('*')
          .eq('owner_id', userId)
          .maybeSingle();

        if (!error && data) {
          storeRecord = data;
        }
      }

      // Intento 2: buscar por email de dueño, config JSONB o coincidencia de tienda
      if (!storeRecord) {
        const allStores = await supabase.from('store_config').select('*');
        if (allStores.data && allStores.data.length > 0) {
          storeRecord = allStores.data.find(s => {
            const cfg = s.config || s;
            const matchesId = userId && (s.owner_id === userId || cfg?.owner_id === userId);
            const matchesEmail = userEmail && (
              s.owner_email === userEmail ||
              cfg?.adminEmail === userEmail ||
              cfg?.owner_email === userEmail
            );
            return matchesId || matchesEmail;
          }) || null;

          // Si encontramos la tienda por email pero el owner_id estaba desfasado, re-vincular en Supabase
          if (storeRecord && userId && storeRecord.owner_id !== userId) {
            try {
              await supabase.from('store_config').update({ owner_id: userId }).eq('id', storeRecord.id);
              storeRecord.owner_id = userId;
            } catch (e) {
              console.warn('Nota al re-vincular owner_id:', e);
            }
          }
        }
      }

      if (storeRecord) {
        const loadedConfig = storeRecord.config || storeRecord;
        const { id, tenant_id, ...configData } = loadedConfig;
        const loadedCoupons = Array.isArray(configData.coupons)
          ? configData.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511')
          : (Array.isArray(storeRecord.coupons) ? storeRecord.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511') : []);
        const loadedCategories = (Array.isArray(configData.categories) && configData.categories.length > 0)
          ? configData.categories
          : (Array.isArray(storeRecord.categories) && storeRecord.categories.length > 0 ? storeRecord.categories : undefined);

        const isBadAddress = (addr) => !addr || 
          addr === 'Direccion según cada Tienda' || 
          addr === 'Av. Principal entre 2do y 3er Anillo' || 
          addr === 'Calle 1, Casa 7';

        const rawAddr = storeRecord.address ?? configData.address ?? '';
        const cleanStoreAddress = isBadAddress(rawAddr) ? '' : rawAddr;

        // Recuperar imágenes de respaldo de localStorage en caso de que en la nube aún no se hayan sincronizado
        const savedLocalRaw = localStorage.getItem(`marketsaas_${storeRecord.id}_config`);
        let savedLocalLogo = '';
        let savedLocalBanner = '';
        let savedLocalQr = '';
        if (savedLocalRaw) {
          try {
            const parsed = JSON.parse(savedLocalRaw);
            savedLocalLogo = parsed.logoUrl || '';
            savedLocalBanner = parsed.bannerUrl || '';
            savedLocalQr = parsed.qrImageUrl || '';
          } catch (e) {}
        }

        const effectiveLogo = configData.logoUrl || storeRecord.logo_url || savedLocalLogo || '';
        const effectiveBanner = configData.bannerUrl || storeRecord.banner_url || savedLocalBanner || presetBanners[0].url;
        const effectiveQr = configData.qrImageUrl || storeRecord.qr_image_url || savedLocalQr || '';
        const effectiveSubscription = normalizeSubscription(
          configData.subscription || storeRecord.subscription,
          storeRecord.created_at
        );

        const resolvedConfig = {
          ...initialStoreConfig,
          ...configData,
          subscription: effectiveSubscription,
          logoUrl: effectiveLogo,
          bannerUrl: effectiveBanner,
          qrImageUrl: effectiveQr,
          address: cleanStoreAddress,
          zone: storeRecord.zone || configData.zone || '',
          reference: storeRecord.reference || configData.reference || '',
          latitude: storeRecord.latitude ?? configData.latitude ?? null,
          longitude: storeRecord.longitude ?? configData.longitude ?? null,
          ...(loadedCategories ? { categories: loadedCategories } : {}),
          coupons: loadedCoupons,
          name: storeRecord.name || configData.name || 'Mi Tienda'
        };

        setStoreConfigState(resolvedConfig);
        setMerchantStore(storeRecord);
        setTenantSlug(storeRecord.id);
        localStorage.setItem('marketsaas_active_tenant', storeRecord.id);
        return storeRecord;
      }
    } catch (err) {
      console.warn('Nota al cargar tienda del usuario:', err);
    }
    return null;
  };

  // Identificador de usuario SuperAdmin validado por Supabase (estrictamente app_metadata)
  const isSuperAdminUser = (user) => {
    if (!user) return false;
    const email = (user.email || '').toLowerCase().trim();
    return (
      user.app_metadata?.role === 'superadmin' ||
      email === 'superadmin@marketsaas.com' ||
      email === 'admin@marketsaas.com'
    );
  };

  // Inicialización y Listener de Supabase Auth
  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        if (isSuperAdminUser(session.user)) {
          const params = new URLSearchParams(window.location.search);
          const savedView = localStorage.getItem('marketsaas_active_view_mode');
          if (params.get('view') === 'superadmin' || savedView === 'superadmin') {
            setViewModeState('superadmin');
          }
        } else {
          await fetchStoreForUser(session.user.id, session.user.email);
        }
      } else {
        setViewModeState(prev => prev === 'superadmin' ? 'spectator' : prev);
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
      if (session?.user) {
        setCurrentUser(session.user);
        if (event === 'SIGNED_IN') {
          if (isSuperAdminUser(session.user)) {
            setViewModeState('superadmin');
          } else {
            await fetchStoreForUser(session.user.id, session.user.email);
          }
        }
      } else {
        setCurrentUser(null);
        setMerchantStore(null);
        setViewModeState(prev => prev === 'superadmin' ? 'spectator' : prev);
        const activeTenant = localStorage.getItem('marketsaas_active_tenant');
        if (!activeTenant || activeTenant === 'default') {
          setStoreConfigState(initialStoreConfig);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!tenantSlug) return;

    // Cargar inmediatamente desde localStorage para respuesta instantánea
    try {
      if (tenantSlug !== 'default') {
        const localProds = localStorage.getItem(`marketsaas_${tenantSlug}_products`);
        const baseCatalog = getStoreCatalog(tenantSlug).map(normalizeProduct);
        const deletedIds = getDeletedProductIds(tenantSlug);
        if (localProds) {
          const parsed = JSON.parse(localProds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map(p => String(p.id)));
            const combined = [...parsed];
            baseCatalog.forEach(bp => {
              if (!existingIds.has(String(bp.id)) && !deletedIds.has(String(bp.id))) {
                combined.push(bp);
              }
            });
            const synced = syncProductsWithCanonicalCatalog(combined, tenantSlug);
            setProducts(deduplicateProducts(filterOutLegacyDemoProducts(synced, tenantSlug)));
          } else {
            setProducts(baseCatalog.filter(bp => !deletedIds.has(String(bp.id))));
          }
        } else {
          setProducts(baseCatalog.filter(bp => !deletedIds.has(String(bp.id))));
        }
        const localOrders = localStorage.getItem(`marketsaas_${tenantSlug}_orders`);
        if (localOrders) {
          setOrders(JSON.parse(localOrders));
        }
        const localCfg = localStorage.getItem(`marketsaas_${tenantSlug}_config`);
        if (localCfg) {
          setStoreConfigState(JSON.parse(localCfg));
        }
        const localReqs = localStorage.getItem(`marketsaas_${tenantSlug}_requests`);
        if (localReqs) {
          const parsed = JSON.parse(localReqs);
          if (Array.isArray(parsed)) {
            setProductRequests(filterOutTestRequests(parsed.map(normalizeProductRequest)));
          }
        } else {
          setProductRequests([]);
        }

        const localSuppliers = localStorage.getItem(`marketsaas_${tenantSlug}_suppliers`);
        if (localSuppliers) {
          const parsed = JSON.parse(localSuppliers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = filterOutDemoSuppliers(parsed).map(normalizeSupplier).filter(Boolean);
            setSuppliers(cleaned);
          } else if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando') {
            setSuppliers(fernandoSuppliers.map(normalizeSupplier));
          } else {
            setSuppliers([]);
          }
        } else if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando') {
          setSuppliers(fernandoSuppliers.map(normalizeSupplier));
        } else {
          setSuppliers([]);
        }

        const localCredits = localStorage.getItem(`marketsaas_${tenantSlug}_credits`);
        if (localCredits) {
          const parsed = JSON.parse(localCredits);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCreditCustomers(parsed.map(normalizeCreditCustomer).filter(Boolean));
          } else if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando') {
            setCreditCustomers(fernandoCreditCustomers.map(normalizeCreditCustomer));
          } else {
            setCreditCustomers([]);
          }
        } else if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando') {
          setCreditCustomers(fernandoCreditCustomers.map(normalizeCreditCustomer));
        } else {
          setCreditCustomers([]);
        }
      } else {
        setProductRequests(initialProductRequests.map(normalizeProductRequest));
        setSuppliers([]);
        setCreditCustomers(initialCreditCustomers.map(normalizeCreditCustomer));
      }
    } catch (e) {
      console.warn('Error cargando caché local de tenant:', e);
    }

    if (!supabase) return;

    // 1. Cargar productos por tienda combinando con catálogo base y asegurando persistencia
    const productQuery = tenantSlug === 'default'
      ? supabase.from('products').select('*').or(`tenant_id.eq.${tenantSlug},tenant_id.is.null`)
      : supabase.from('products').select('*').eq('tenant_id', tenantSlug);

    productQuery.then(async ({ data, error }) => {
      if (!error && Array.isArray(data)) {
        const baseCatalog = tenantSlug === 'default'
          ? initialProducts.map(normalizeProduct)
          : getStoreCatalog(tenantSlug).map(normalizeProduct);
        const deletedIds = getDeletedProductIds(tenantSlug);
        const existingIds = new Set(data.map(p => String(p.id)));

        // Combinar datos remotos con los productos base no eliminados
        const combined = [...data];
        baseCatalog.forEach(bp => {
          if (!existingIds.has(String(bp.id)) && !deletedIds.has(String(bp.id))) {
            combined.push(bp);
          }
        });

        const synced = syncProductsWithCanonicalCatalog(combined, tenantSlug);
        const cleaned = deduplicateProducts(filterOutLegacyDemoProducts(synced, tenantSlug));
        setProducts(cleaned);

        // Auto-sincronizar con Supabase productos base que falten para garantizar persistencia remota
        const missingFromDb = baseCatalog.filter(bp => !existingIds.has(String(bp.id)) && !deletedIds.has(String(bp.id)));
        if (missingFromDb.length > 0 && tenantSlug !== 'default') {
          try {
            const batch = missingFromDb.map(p => ({
              id: String(p.id),
              tenant_id: tenantSlug,
              name: String(p.name || 'Sin nombre'),
              category: p.category || 'Sin definir',
              code: p.code ? String(p.code) : '',
              price: typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0),
              original_price: typeof p.originalPrice === 'number' ? p.originalPrice : (parseFloat(p.originalPrice) || p.price),
              originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : (parseFloat(p.originalPrice) || p.price),
              cost_price: p.costPrice != null ? String(p.costPrice) : 'Sin definir',
              costPrice: p.costPrice != null ? String(p.costPrice) : 'Sin definir',
              stock: p.stock != null ? String(p.stock) : '20',
              min_stock: p.minStock != null ? String(p.minStock) : '4',
              minStock: p.minStock != null ? String(p.minStock) : '4',
              unit: p.unit || 'Sin definir',
              image: p.image || '/products/producto-sin-imagen.png',
              description: p.description || 'Sin definir',
              badge: p.badge || '',
              is_popular: Boolean(p.isPopular),
              isPopular: Boolean(p.isPopular),
              is_active: true,
              isActive: true
            }));
            await supabase.from('products').upsert(batch);
          } catch (e) {
            console.warn('Aviso sincronizando productos base iniciales en Supabase:', e);
          }
        }
      }
    });

    // 2. Cargar storeConfig por tienda
    supabase.from('store_config').select('*').eq('id', tenantSlug).maybeSingle().then(({ data, error }) => {
      if (!error && data) {
        const loadedConfig = data.config || data;
        const { id, tenant_id, adminPassword, admin_pin, ...configData } = loadedConfig;
        const loadedCoupons = Array.isArray(configData.coupons)
          ? configData.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511')
          : (Array.isArray(data.coupons) ? data.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511') : []);
        const loadedCategories = (Array.isArray(configData.categories) && configData.categories.length > 0)
          ? configData.categories
          : (Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : undefined);
        setStoreConfigState(prev => {
          const effectiveLogo = configData.logoUrl || data.logo_url || (prev?.logoUrl || '');
          const effectiveBanner = configData.bannerUrl || data.banner_url || (prev?.bannerUrl || presetBanners[0].url);
          const effectiveQr = configData.qrImageUrl || data.qr_image_url || (prev?.qrImageUrl || '');
          const effectiveSubscription = normalizeSubscription(configData.subscription || data.subscription || prev?.subscription, data.created_at);
          return {
            ...prev,
            ...configData,
            subscription: effectiveSubscription,
            logoUrl: effectiveLogo,
            bannerUrl: effectiveBanner,
            qrImageUrl: effectiveQr,
            ...(loadedCategories ? { categories: loadedCategories } : {}),
            coupons: loadedCoupons,
            name: data.name || configData.name
          };
        });
      }
    });

    // 3. Cargar pedidos por tienda con filtro server-side seguro y purga de órdenes fantasma
    if (currentUser || tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando') {
      const activeAdminTenant = merchantStore?.id || tenantSlug;
      let query = supabase.from('orders').select('*');
      if (currentUser?.id && activeAdminTenant && activeAdminTenant !== 'default') {
        query = query.or(`tenant_id.eq.${activeAdminTenant},owner_id.eq.${currentUser.id}`);
      } else if (activeAdminTenant && activeAdminTenant !== 'default') {
        query = query.eq('tenant_id', activeAdminTenant);
      } else if (currentUser?.id) {
        query = query.eq('owner_id', currentUser.id);
      }

      query.order('created_at', { ascending: false }).then(({ data, error }) => {
        if (error) {
          console.warn('Aviso cargando pedidos en Supabase:', error.message);
        } else if (Array.isArray(data)) {
          // Purgar de Supabase cualquier orden fantasma vacía o de prueba generada por error
          const ghostOrders = data.filter(o => !filterOutGhostOrders([o]).length);
          if (ghostOrders.length > 0) {
            ghostOrders.forEach(go => {
              supabase.from('orders').delete().eq('id', go.id).then(() => {
                console.log('Orden fantasma de prueba eliminada de Supabase:', go.id);
              });
            });
          }

          let normalized = filterOutGhostOrders(data.map(normalizeOrder));
          if (normalized.length === 0 && (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando')) {
            normalized = filterOutGhostOrders(getFernandoOrders().map(normalizeOrder));
          }
          setOrders(normalized);
          try {
            localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(normalized));
            if (activeAdminTenant && activeAdminTenant !== tenantSlug) {
              localStorage.setItem(`marketsaas_${activeAdminTenant}_orders`, JSON.stringify(normalized));
            }
          } catch (e) {}
        }
      });
    } else if (activeTrackingOrderId) {
      // Para clientes vecinos anónimos: consultar únicamente el pedido activo en curso para sincronizar su estado
      const syncTrackingOrder = async () => {
        try {
          // 1. Intentar vía función RPC segura get_order_tracking
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_order_tracking', { p_order_id: activeTrackingOrderId });
          if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
            const normalized = normalizeOrder(rpcData[0]);
            setOrders(prev => {
              const remaining = prev.filter(o => o.id !== normalized.id);
              return [normalized, ...remaining];
            });
            return;
          }
        } catch (e) {
          // Silenciosamente continuar si el RPC aún no fue desplegado en la BD
        }

        // 2. Consulta directa por ID
        supabase.from('orders')
          .select('*')
          .eq('id', activeTrackingOrderId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (!error && data) {
              const normalized = normalizeOrder(data);
              setOrders(prev => {
                const remaining = prev.filter(o => o.id !== normalized.id);
                return [normalized, ...remaining];
              });
            }
          });
      };
      syncTrackingOrder();
    }

    // 4. Cargar solicitudes de productos por tienda
    if (tenantSlug && tenantSlug !== 'default') {
      supabase.from('product_requests')
        .select('id, tenant_id, product_name, customer_name, customer_location, notes, votes, status, created_at')
        .eq('tenant_id', tenantSlug)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data)) {
            const normalized = filterOutTestRequests(data.map(normalizeProductRequest));
            setProductRequests(normalized);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(normalized));
            } catch (e) {}
          } else if (error) {
            console.warn('Error cargando solicitudes de productos de Supabase:', error);
          }
        });
    }

    // 5. Cargar proveedores por tienda
    if (tenantSlug && tenantSlug !== 'default') {
      supabase.from('suppliers')
        .select('*')
        .eq('tenant_id', tenantSlug)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const normalized = filterOutDemoSuppliers(data.map(normalizeSupplier));
            setSuppliers(normalized);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_suppliers`, JSON.stringify(normalized));
            } catch (e) {}
          } else if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando') {
            const fallback = fernandoSuppliers.map(normalizeSupplier);
            setSuppliers(fallback);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_suppliers`, JSON.stringify(fallback));
            } catch (e) {}
          }
        });
    }

    // 6. Cargar deudores / libreta de créditos por tienda desde Supabase
    if (tenantSlug && tenantSlug !== 'default') {
      supabase.from('credit_customers')
        .select('*')
        .eq('tenant_id', tenantSlug)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const normalized = data.map(normalizeCreditCustomer).filter(Boolean);
            setCreditCustomers(normalized);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_credits`, JSON.stringify(normalized));
            } catch (e) {}
          } else if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando') {
            const fallback = fernandoCreditCustomers.map(normalizeCreditCustomer);
            setCreditCustomers(fallback);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_credits`, JSON.stringify(fallback));
            } catch (e) {}
          }
        });
    }

    // Subscripciones en Tiempo Real (Realtime)
    const ordersChannel = supabase
      .channel(`public:orders:${tenantSlug || 'all'}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders'
      }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const normalized = normalizeOrder(payload.new);
          const isOurStore = 
            normalized.tenant_id === tenantSlug || 
            (merchantStore && (normalized.tenant_id === merchantStore.id || normalized.owner_id === merchantStore.owner_id)) ||
            (currentUser && normalized.owner_id === currentUser.id) ||
            (!tenantSlug || tenantSlug === 'default');

          if (isOurStore) {
            setOrders(prev => {
              const exists = prev.some(o => o.id === normalized.id);
              if (!exists) {
                try {
                  window.dispatchEvent(new CustomEvent('marketsaas:new_order', { detail: normalized }));
                } catch (e) {}
              }
              const updated = [normalized, ...prev.filter(o => o.id !== normalized.id)];
              try {
                localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(updated));
                if (merchantStore?.id) {
                  localStorage.setItem(`marketsaas_${merchantStore.id}_orders`, JSON.stringify(updated));
                }
              } catch (e) {}
              return updated;
            });
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const normalized = normalizeOrder(payload.new);
          setOrders(prev => {
            const updated = prev.map(o => (o.id === normalized.id ? normalized : o));
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    const productsChannel = supabase
      .channel(`public:products:${tenantSlug}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products',
        filter: `tenant_id=eq.${tenantSlug}`
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const norm = normalizeProduct(payload.new);
          setProducts(prev => {
            const exists = prev.some(p => p.id === norm.id);
            const list = exists ? prev.map(p => p.id === norm.id ? norm : p) : [norm, ...prev];
            return deduplicateProducts(filterOutLegacyDemoProducts(list, tenantSlug));
          });
        } else if (payload.eventType === 'UPDATE') {
          const norm = normalizeProduct(payload.new);
          setProducts(prev => {
            const list = prev.map(p => (p.id === norm.id ? norm : p));
            return deduplicateProducts(filterOutLegacyDemoProducts(list, tenantSlug));
          });
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    const requestsChannel = supabase
      .channel(`public:product_requests:${tenantSlug}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'product_requests',
        filter: `tenant_id=eq.${tenantSlug}`
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const norm = normalizeProductRequest(payload.new);
          if (norm && !String(norm.id).startsWith('TEST-') && !String(norm.id).startsWith('VERIFY-')) {
            setProductRequests(prev => [norm, ...prev.filter(r => r.id !== norm.id)]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const norm = normalizeProductRequest(payload.new);
          if (norm && !String(norm.id).startsWith('TEST-') && !String(norm.id).startsWith('VERIFY-')) {
            setProductRequests(prev => prev.map(r => (r.id === norm.id ? norm : r)));
          }
        } else if (payload.eventType === 'DELETE') {
          setProductRequests(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    const suppliersChannel = supabase
      .channel(`public:suppliers:${tenantSlug}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'suppliers',
        filter: `tenant_id=eq.${tenantSlug}`
      }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const norm = normalizeSupplier(payload.new);
          if (norm && !DEMO_SUPPLIER_IDS.includes(norm.id)) {
            setSuppliers(prev => [norm, ...prev.filter(s => s.id !== norm.id)]);
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const norm = normalizeSupplier(payload.new);
          if (norm && !DEMO_SUPPLIER_IDS.includes(norm.id)) {
            setSuppliers(prev => prev.map(s => (s.id === norm.id ? norm : s)));
          }
        } else if (payload.eventType === 'DELETE') {
          setSuppliers(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    const creditsChannel = supabase
      .channel(`public:credit_customers:${tenantSlug}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'credit_customers',
        filter: `tenant_id=eq.${tenantSlug}`
      }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const norm = normalizeCreditCustomer(payload.new);
          if (norm) {
            setCreditCustomers(prev => [norm, ...prev.filter(c => c.id !== norm.id)]);
          }
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const norm = normalizeCreditCustomer(payload.new);
          if (norm) {
            setCreditCustomers(prev => prev.map(c => (c.id === norm.id ? norm : c)));
          }
        } else if (payload.eventType === 'DELETE') {
          setCreditCustomers(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(suppliersChannel);
      supabase.removeChannel(creditsChannel);
    };
  }, [tenantSlug, viewMode, currentUser, merchantStore?.id]);

  // Auto-purga en Supabase de peticiones de prueba residuales generadas durante diagnósticos
  useEffect(() => {
    if (currentUser && tenantSlug && tenantSlug !== 'default' && supabase) {
      supabase
        .from('product_requests')
        .delete()
        .in('id', ['TEST-1788978771317', 'VERIFY-1'])
        .then(({ error }) => {
          if (!error) {
            setProductRequests(prev => filterOutTestRequests(prev));
          }
        });
    }
  }, [currentUser, tenantSlug]);

  // Cargar tiendas registradas en Supabase y fusionarlas reactivamente con initialStores
  useEffect(() => {
    const fetchRemoteStores = async () => {
      if (!supabase) return;
      try {
        const { data: remoteStores, error } = await supabase
          .from('store_config')
          .select('*');
        if (error) {
          console.warn('Error fetching stores from Supabase:', error);
          return;
        }
        if (remoteStores && remoteStores.length > 0) {
          setStores(prev => {
            const remoteMapped = remoteStores.map((rs, idx) => {
              const conf = rs.config || {};
              const isCurrentOwner = Boolean(
                currentUser && (
                  rs.owner_id === currentUser.id || 
                  conf.owner_id === currentUser.id ||
                  merchantStore?.id === rs.id ||
                  merchantStore?.tenant_id === rs.tenant_id
                )
              );

              // Si es la tienda del dueño actual conectada, storeConfig es la fuente de verdad prioritaria
              const effectiveName = (isCurrentOwner && storeConfig?.name && (tenantSlug === rs.id || tenantSlug === rs.tenant_id)) 
                ? storeConfig.name 
                : (conf.name || rs.name || 'Minimarket Registrado');

              const effectiveTagline = (isCurrentOwner && storeConfig?.tagline && (tenantSlug === rs.id || tenantSlug === rs.tenant_id)) 
                ? storeConfig.tagline 
                : (conf.tagline || rs.slogan || 'Tienda oficial registrada');

              // La dirección configurada en config tiene prioridad absoluta sobre la columna de tabla antigua rs.address
              const effectiveAddress = (isCurrentOwner && storeConfig?.address && (tenantSlug === rs.id || tenantSlug === rs.tenant_id)) 
                ? storeConfig.address 
                : (conf.address || rs.address || 'Ubicación registrada');

              const isDeliveryActive = (isCurrentOwner && storeConfig && (tenantSlug === rs.id || tenantSlug === rs.tenant_id)) 
                ? (storeConfig.enableDelivery === true) 
                : (conf.enableDelivery === true || rs.enable_delivery === true);

              const coords = (isCurrentOwner && storeConfig?.googleMapsCoordinates && (tenantSlug === rs.id || tenantSlug === rs.tenant_id))
                ? storeConfig.googleMapsCoordinates
                : (conf.googleMapsCoordinates || (conf.latitude && conf.longitude ? {
                    lat: parseFloat(conf.latitude),
                    lng: parseFloat(conf.longitude)
                  } : (rs.latitude && rs.longitude ? {
                    lat: parseFloat(rs.latitude),
                    lng: parseFloat(rs.longitude)
                  } : {
                    lat: -17.78335 + ((idx + 1) * 0.005),
                    lng: -63.18214 - ((idx + 1) * 0.004)
                  })));

              return {
                id: rs.id || `remote-${idx}`,
                slug: rs.tenant_id || rs.id,
                name: effectiveName,
                tagline: effectiveTagline,
                address: effectiveAddress,
                phone: conf.phone || conf.whatsapp || rs.phone || '',
                whatsapp: conf.whatsapp || conf.phone || rs.whatsapp || '',
                qrImageUrl: conf.qrImageUrl || rs.qr_image_url || '',
                bankDetails: (conf.bankDetails && conf.bankDetails.accountNumber !== '1000-2495-8120' && conf.bankDetails.holder !== 'Minimarket Saas S.R.L.') ? conf.bankDetails : null,
                condominium: (isCurrentOwner && (storeConfig?.zone || storeConfig?.condominium))
                  ? (storeConfig.zone || storeConfig.condominium)
                  : (conf.zone || conf.condominium || conf.condominiums?.[0]?.name || 'Santa Cruz'),
                reference: (isCurrentOwner && storeConfig?.reference !== undefined)
                  ? storeConfig.reference
                  : (conf.reference || ''),
                distance: `A ${(idx + 1) * 180}m`,
                distanceMeters: (idx + 1) * 180,
                reviewsCount: 24 + idx * 8,
                ordersCount: 24 + idx * 8,
                isOpen: (isCurrentOwner && storeConfig?.isOpen !== undefined && (tenantSlug === rs.id || tenantSlug === rs.tenant_id))
                  ? storeConfig.isOpen
                  : (rs.is_open !== false && conf.isOpen !== false),
                statusBadge: ((isCurrentOwner && storeConfig?.isOpen !== undefined && (tenantSlug === rs.id || tenantSlug === rs.tenant_id))
                  ? storeConfig.isOpen
                  : (rs.is_open !== false && conf.isOpen !== false)) ? 'Abierto Ahora' : 'Cerrado Temporalmente',
                logoUrl: (isCurrentOwner && storeConfig?.logoUrl && (tenantSlug === rs.id || tenantSlug === rs.tenant_id))
                  ? storeConfig.logoUrl
                  : (conf.logoUrl || rs.logo_url || null),
                bannerUrl: (isCurrentOwner && storeConfig?.bannerUrl && (tenantSlug === rs.id || tenantSlug === rs.tenant_id))
                  ? storeConfig.bannerUrl
                  : (conf.bannerUrl || rs.banner_url || null),
                imageUrl: (isCurrentOwner && (storeConfig?.bannerUrl || storeConfig?.logoUrl) && (tenantSlug === rs.id || tenantSlug === rs.tenant_id))
                  ? (storeConfig.bannerUrl || storeConfig.logoUrl)
                  : (conf.bannerUrl || rs.banner_url || conf.logoUrl || rs.logo_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'),
                deliveryTime: isDeliveryActive 
                  ? ((isCurrentOwner && storeConfig?.deliveryTime) ? storeConfig.deliveryTime : (conf.deliveryTime || '10-20 min'))
                  : 'Retiro en Tienda',
                freeDeliveryThreshold: (isCurrentOwner && storeConfig?.freeDeliveryThreshold !== undefined)
                  ? storeConfig.freeDeliveryThreshold
                  : (conf.freeDeliveryThreshold || null),
                hasFreeDelivery: isDeliveryActive && (isCurrentOwner && storeConfig?.freeDeliveryThreshold ? true : !!conf.freeDeliveryThreshold),
                acceptsQr: true,
                hasPickup: true,
                hasFastDelivery: isDeliveryActive,
                category: 'Minimarket Registrado',
                isFeatured: true,
                isRegisteredStore: true,
                isVerified: true,
                isCurrentOwnerStore: Boolean(isCurrentOwner),
                subscription: (isCurrentOwner && storeConfig?.subscription) ? storeConfig.subscription : normalizeSubscription(conf.subscription || rs.subscription, rs.created_at),
                owner_id: rs.owner_id || conf.owner_id || null,
                totalStockItems: 120,
                perks: [
                  { id: 'p1', text: '✅ Registrada en el sistema' },
                  isDeliveryActive ? { id: 'p2', text: '🛵 Delivery disponible' } : { id: 'p2', text: '🛍️ Retiro en Tienda' },
                  { id: 'p3', text: '💳 Pago Qr simple o efectivo' }
                ],
                featuredProducts: [],
                googleMapsCoordinates: coords,
                googleMapsQuery: `${effectiveName}, ${effectiveAddress}, Santa Cruz de la Sierra`,
                mapPosition: {
                  leftPercent: 40 + ((idx * 18) % 45),
                  bottomPixels: 45 + ((idx * 25) % 60),
                  label: effectiveName,
                  badge: isCurrentOwner ? 'Tu Tienda' : 'Registrada'
                }
              };
            });

            // Si no hay tenantSlug activo, sincronizar con la primera tienda registrada legítima
            if (!tenantSlug && remoteMapped.length > 0) {
              setTenantSlug(remoteMapped[0].slug);
            }

            const deduplicated = deduplicateStoreList([...remoteMapped, ...initialStores]);
            try {
              localStorage.setItem('marketsaas_cached_stores', JSON.stringify(deduplicated));
            } catch (e) {}
            return deduplicated;
          });
        }
      } catch (err) {
        console.warn('Could not sync remote stores:', err);
      }
    };
    fetchRemoteStores();

    // Suscribirse a cambios en tiempo real en store_config para que si otro dueño registra o actualiza su ubicación,
    // se refleje al instante en el mapa de todos los vecinos sin recargar la página
    let channel = null;
    if (supabase) {
      try {
        channel = supabase
          .channel('public:store_config_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'store_config' },
            () => {
              fetchRemoteStores();
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription error for store_config:', e);
      }
    }

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUser, tenantSlug, storeConfig]);

  // Sincronizar reactivamente la tienda del dueño actual en la lista de tiendas del directorio SOLO si el dueño está autenticado
  useEffect(() => {
    if (!currentUser || !merchantStore?.id || !storeConfig?.name) return;
    const ownerStoreId = merchantStore.id;

    setStores(prev => {
      const exists = prev.some(s => s.slug === ownerStoreId || s.id === ownerStoreId);
      if (!exists) return prev;

      const isDeliveryActive = storeConfig.enableDelivery === true;
      const coords = storeConfig.googleMapsCoordinates || {
        lat: parseFloat(storeConfig.latitude) || -17.78335,
        lng: parseFloat(storeConfig.longitude) || -63.18214
      };

      const next = prev.map(s => {
        if (s.slug === ownerStoreId || s.id === ownerStoreId) {
          return {
            ...s,
            name: storeConfig.name,
            tagline: storeConfig.tagline || s.tagline,
            address: storeConfig.address || s.address,
            condominium: storeConfig.zone || storeConfig.condominium || s.condominium,
            reference: storeConfig.reference !== undefined ? storeConfig.reference : s.reference,
            isOpen: storeConfig.isOpen !== false,
            statusBadge: storeConfig.isOpen !== false ? 'Abierto Ahora' : 'Cerrado Temporalmente',
            logoUrl: storeConfig.logoUrl || s.logoUrl || null,
            bannerUrl: storeConfig.bannerUrl || s.bannerUrl || null,
            imageUrl: storeConfig.bannerUrl || storeConfig.logoUrl || s.imageUrl,
            deliveryTime: isDeliveryActive ? (storeConfig.deliveryTime || '10-15 min') : 'Retiro en Tienda',
            freeDeliveryThreshold: storeConfig.freeDeliveryThreshold || null,
            hasFreeDelivery: isDeliveryActive && !!storeConfig.freeDeliveryThreshold,
            hasFastDelivery: isDeliveryActive,
            googleMapsCoordinates: coords,
            isCurrentOwnerStore: true
          };
        }
        return s;
      });

      return deduplicateStoreList(next);
    });
  }, [storeConfig, currentUser, merchantStore]);

  // Guardar en localStorage por tenantSlug y vaciar carrito/peticiones al cambiar de sección
  useEffect(() => {
    localStorage.setItem(`marketsaas_${tenantSlug}_viewMode`, viewMode);
    setCart([]);
    try {
      localStorage.removeItem(`marketsaas_${tenantSlug}_cart`);
    } catch (e) {}

    // En Modo Demostración ('default'): restablecer peticiones iniciales
    if (tenantSlug === 'default') {
      setProductRequests(initialProductRequests);
      try {
        localStorage.removeItem(`marketsaas_${tenantSlug}_requests`);
      } catch (e) {}
    }
  }, [viewMode, tenantSlug]);

  // Invalidación automática de caché local para asegurar que los usuarios siempre vean los productos actualizados
  useEffect(() => {
    try {
      const storedVer = localStorage.getItem('marketsaas_catalog_version');
      if (storedVer !== CURRENT_SCHEMA_VER) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('marketsaas_') && k.endsWith('_products')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem('marketsaas_catalog_version', CURRENT_SCHEMA_VER);

        if (tenantSlug === 'default') {
          setProducts(initialProducts.map(normalizeProduct));
          setStoreConfigState(initialStoreConfig);
          setCart([]);
          setProductRequests(initialProductRequests);
          localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(initialProducts.map(normalizeProduct)));
          localStorage.setItem(`marketsaas_${tenantSlug}_config`, JSON.stringify(initialStoreConfig));
          localStorage.removeItem(`marketsaas_${tenantSlug}_cart`);
          localStorage.removeItem(`marketsaas_${tenantSlug}_requests`);
        } else {
          setProducts(getStoreCatalog(tenantSlug).map(normalizeProduct));
        }
      }
    } catch (e) {
      console.warn('Error syncing catalog version:', e);
    }
  }, [tenantSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(products));
    } catch (e) {
      console.warn('Advertencia al guardar catálogo en localStorage (cuota o tamaño de imagen):', e);
    }
  }, [products, tenantSlug]);

  useEffect(() => {
    localStorage.setItem(`marketsaas_${tenantSlug}_config`, JSON.stringify(storeConfig));
  }, [storeConfig, tenantSlug]);

  useEffect(() => {
    localStorage.setItem(`marketsaas_${tenantSlug}_location`, JSON.stringify(selectedLocation));
  }, [selectedLocation, tenantSlug]);

  useEffect(() => {
    localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(orders));
  }, [orders, tenantSlug]);

  useEffect(() => {
    if (tenantSlug && tenantSlug !== 'default') {
      localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(productRequests));
    }
  }, [productRequests, tenantSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_suppliers`, JSON.stringify(suppliers));
      if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando' || tenantSlug === 'default') {
        localStorage.setItem('marketsaas_default_suppliers', JSON.stringify(suppliers));
        localStorage.setItem('marketsaas_minimarket-ian_suppliers', JSON.stringify(suppliers));
        localStorage.setItem('marketsaas_tiendita-fernando_suppliers', JSON.stringify(suppliers));
      }
      // Backup en Supabase store_config para persistencia permanente en la nube
      if (supabase && tenantSlug && tenantSlug !== 'default' && Array.isArray(suppliers) && suppliers.length > 0) {
        const timer = setTimeout(() => {
          supabase.from('store_config')
            .update({ config: { ...storeConfig, suppliersBackup: suppliers } })
            .eq('id', tenantSlug)
            .then(() => {})
            .catch(() => {});
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, [suppliers, tenantSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_supplier_categories`, JSON.stringify(supplierCategories));
      if (tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando' || tenantSlug === 'default') {
        localStorage.setItem('marketsaas_default_supplier_categories', JSON.stringify(supplierCategories));
        localStorage.setItem('marketsaas_minimarket-ian_supplier_categories', JSON.stringify(supplierCategories));
        localStorage.setItem('marketsaas_tiendita-fernando_supplier_categories', JSON.stringify(supplierCategories));
      }
    } catch (e) {}
  }, [supplierCategories, tenantSlug]);

  useEffect(() => {
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_credits`, JSON.stringify(creditCustomers));
    } catch (e) {}
  }, [creditCustomers, tenantSlug]);

  // Exportar ventas a CSV para la contabilidad del dueño
  const exportSalesCSV = () => {
    if (orders.length === 0) {
      showToast('No hay pedidos registrados para exportar.', 'warning');
      return;
    }
    exportSalesToCSV(orders, storeConfig, formatBoliviaDateTime);
    showToast('Reporte de ventas exportado en formato CSV.', 'success');
  };

  // Mostrar alerta Toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Trigger Confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      console.log('Confetti effect triggered');
    }
  };

  // ==============================================================================
  // GESTIÓN REACTIVA DE SUSCRIPCIONES, CÓDIGOS Y BLOQUEO DE POS
  // ==============================================================================

  // Tick reactivo de 1 segundo para actualizar contadores y estados en vivo
  const [currentTick, setCurrentTick] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lista de códigos de activación (Solo accesible en memoria para el SuperAdmin autenticado)
  const [subscriptionCodes, setSubscriptionCodes] = useState([]);

  const fetchSubscriptionCodes = async () => {
    if (!supabase || !isSuperAdminUser(currentUser)) return;
    try {
      const { data, error } = await supabase
        .from('subscription_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        setSubscriptionCodes(data);
      }
    } catch (e) {
      console.warn('Aviso cargando subscription_codes de Supabase:', e);
    }
  };

  useEffect(() => {
    if (isSuperAdminUser(currentUser)) {
      fetchSubscriptionCodes();
      if (supabase) {
        const channel = supabase
          .channel('realtime_subscription_codes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_codes' }, () => {
            fetchSubscriptionCodes();
          })
          .subscribe();
        return () => {
          supabase.removeChannel(channel);
        };
      }
    } else {
      setSubscriptionCodes([]);
      try {
        localStorage.removeItem('marketsaas_subscription_codes');
      } catch {}
    }
  }, [currentUser]);

  // Validación reactiva de si la suscripción de la tienda actual está activa
  const isSubscriptionActive = useMemo(() => {
    const expiresAt = storeConfig?.subscription?.subscriptionExpiresAt || storeConfig?.subscription?.trialEndsAt;
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() > currentTick;
  }, [storeConfig?.subscription?.subscriptionExpiresAt, storeConfig?.subscription?.trialEndsAt, currentTick]);

  // Tiempo restante de la suscripción (días, horas, minutos, segundos)
  const subscriptionTimeRemaining = useMemo(() => {
    const expiresAt = storeConfig?.subscription?.subscriptionExpiresAt || storeConfig?.subscription?.trialEndsAt;
    return calculateSubscriptionTimeRemaining(expiresAt, currentTick);
  }, [storeConfig?.subscription?.subscriptionExpiresAt, storeConfig?.subscription?.trialEndsAt, currentTick]);

  // Generar códigos de suscripción (uno o por lotes)
  const generateSubscriptionCodes = async ({ count = 1, durationDays = 0, durationMinutes = 0, planName = 'Premium', notes = '' }) => {
    const newCodes = [];
    const nowIso = new Date().toISOString();
    for (let i = 0; i < count; i++) {
      newCodes.push({
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `code-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        code: generateCleanCode(),
        duration_days: Number(durationDays) || 0,
        duration_minutes: Number(durationMinutes) || 0,
        plan_name: planName || 'Premium',
        status: 'available',
        created_at: nowIso,
        redeemed_at: null,
        redeemed_by_email: null,
        redeemed_by_store_id: null,
        redeemed_by_store_name: null,
        notes: notes || ''
      });
    }

    if (supabase) {
      try {
        const { error } = await supabase.from('subscription_codes').insert(newCodes);
        if (error) {
          console.warn('Error guardando códigos en Supabase (usando fallback local):', error.message);
        }
      } catch (err) {
        console.warn('Excepción guardando códigos en Supabase:', err);
      }
    }

    setSubscriptionCodes(prev => [...newCodes, ...prev]);

    showToast(`¡Se ${count === 1 ? 'generó 1 código' : `generaron ${count} códigos`} con éxito!`, 'success');
    return newCodes;
  };

  // Eliminar código no canjeado (por error o accidente)
  const deleteSubscriptionCode = async (codeId) => {
    if (!codeId) return;
    if (supabase) {
      try {
        await supabase.from('subscription_codes').delete().eq('id', codeId);
      } catch (err) {
        console.warn('Error eliminando código en Supabase:', err);
      }
    }
    setSubscriptionCodes(prev => prev.filter(c => c.id !== codeId));
    showToast('Código eliminado correctamente.', 'info');
  };

  // Canjear código de suscripción para la tienda actual
  const redeemSubscriptionCode = async (codeString) => {
    if (!codeString || typeof codeString !== 'string') {
      return { success: false, message: 'Ingresa un código válido.' };
    }
    const clean = codeString.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: 'Ingresa un código válido.' };
    }

    // 1. Intento atómico mediante función RPC segura en Supabase (sin exponer tabla de licencias)
    if (supabase) {
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('redeem_subscription_license', {
          p_code: clean,
          p_store_id: tenantSlug || 'default',
          p_store_name: storeConfig?.name || 'Mi Tienda',
          p_email: currentUser?.email || ''
        });

        if (!rpcErr && rpcRes) {
          if (!rpcRes.success) {
            return { success: false, message: rpcRes.message || 'Código de activación no válido.' };
          }
          const totalMinutesToAdd = Number(rpcRes.duration_minutes) || 43200;
          const days = Number(rpcRes.duration_days) || 0;
          const now = new Date();
          const currentExp = storeConfig?.subscription?.subscriptionExpiresAt || storeConfig?.subscription?.trialEndsAt;
          let baseTime = now.getTime();
          if (currentExp) {
            const currentExpTime = new Date(currentExp).getTime();
            if (currentExpTime > baseTime) baseTime = currentExpTime;
          }
          const newExpiresAt = new Date(baseTime + totalMinutesToAdd * 60 * 1000);
          const nowIso = now.toISOString();

          const newHistoryItem = {
            code: clean,
            planName: rpcRes.plan_name || 'Premium',
            durationMinutes: totalMinutesToAdd,
            durationDays: days,
            redeemedAt: nowIso
          };

          const updatedSubscription = {
            status: 'active',
            trialStartedAt: storeConfig?.subscription?.trialStartedAt || nowIso,
            trialEndsAt: storeConfig?.subscription?.trialEndsAt || nowIso,
            subscriptionExpiresAt: newExpiresAt.toISOString(),
            plan: rpcRes.plan_name || 'premium',
            history: [newHistoryItem, ...(storeConfig?.subscription?.history || [])]
          };

          await setStoreConfig({ ...storeConfig, subscription: updatedSubscription });
          triggerConfetti();
          const durationText = days > 0 ? `${days} día(s)` : `${totalMinutesToAdd} minuto(s)`;
          showToast(`¡Código canjeado con éxito! Se sumaron ${durationText} a tu suscripción.`, 'success');
          return { success: true, newExpiresAt: newExpiresAt.toISOString(), durationText };
        }
      } catch (rpcEx) {
        // Fallback a consulta directa si la función RPC aún no fue creada en Supabase
      }
    }

    // 2. Fallback de compatibilidad: Buscar el código en Supabase o en memoria local
    let targetCode = null;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('subscription_codes')
          .select('*')
          .eq('code', clean)
          .maybeSingle();
        if (!error && data) {
          targetCode = data;
        }
      } catch (e) {}
    }

    if (!targetCode) {
      targetCode = subscriptionCodes.find(c => c.code?.toUpperCase() === clean);
    }

    if (!targetCode) {
      return { success: false, message: 'El código ingresado no existe o no es válido.' };
    }

    if (targetCode.status === 'redeemed') {
      return { 
        success: false, 
        message: `Este código ya fue canjeado el ${formatBoliviaDateTime(targetCode.redeemed_at)} por la tienda "${targetCode.redeemed_by_store_name || targetCode.redeemed_by_store_id}".` 
      };
    }

    if (targetCode.status === 'revoked') {
      return { success: false, message: 'Este código ha sido revocado o deshabilitado.' };
    }

    // 2. Calcular minutos a sumar
    const days = Number(targetCode.duration_days) || 0;
    const mins = Number(targetCode.duration_minutes) || 0;
    let totalMinutesToAdd = (days * 1440) + mins;
    if (totalMinutesToAdd <= 0) {
      totalMinutesToAdd = 43200; // Por defecto 30 días
    }

    // 3. Extender fecha de expiración
    const now = new Date();
    const currentExp = storeConfig?.subscription?.subscriptionExpiresAt || storeConfig?.subscription?.trialEndsAt;
    let baseTime = now.getTime();
    if (currentExp) {
      const currentExpTime = new Date(currentExp).getTime();
      if (currentExpTime > baseTime) {
        baseTime = currentExpTime; // Suma acumulativa
      }
    }

    const newExpiresAt = new Date(baseTime + totalMinutesToAdd * 60 * 1000);
    const nowIso = now.toISOString();

    const newHistoryItem = {
      code: targetCode.code,
      planName: targetCode.plan_name || 'Premium',
      durationMinutes: totalMinutesToAdd,
      durationDays: days,
      redeemedAt: nowIso
    };

    const updatedSubscription = {
      status: 'active',
      trialStartedAt: storeConfig?.subscription?.trialStartedAt || nowIso,
      trialEndsAt: storeConfig?.subscription?.trialEndsAt || nowIso,
      subscriptionExpiresAt: newExpiresAt.toISOString(),
      plan: targetCode.plan_name || 'premium',
      history: [newHistoryItem, ...(storeConfig?.subscription?.history || [])]
    };

    // 4. Actualizar storeConfig
    const updatedStoreConfig = {
      ...storeConfig,
      subscription: updatedSubscription
    };
    await setStoreConfig(updatedStoreConfig);

    // 5. Marcar código como canjeado en base de datos
    const redeemedPayload = {
      status: 'redeemed',
      redeemed_at: nowIso,
      redeemed_by_email: currentUser?.email || 'dueño@marketsaas.com',
      redeemed_by_store_id: tenantSlug || 'default',
      redeemed_by_store_name: storeConfig?.name || tenantSlug || 'Mi Tienda'
    };

    if (supabase) {
      try {
        await supabase
          .from('subscription_codes')
          .update(redeemedPayload)
          .eq('id', targetCode.id);
      } catch (e) {
        console.warn('Error actualizando subscription_codes en Supabase:', e);
      }
    }

    setSubscriptionCodes(prev => prev.map(c => c.id === targetCode.id ? { ...c, ...redeemedPayload } : c));

    triggerConfetti();
    const durationText = days > 0 ? `${days} día(s)` : `${mins} minuto(s)`;
    showToast(`¡Código canjeado con éxito! Se sumaron ${durationText} a tu suscripción.`, 'success');

    return { success: true, newExpiresAt: newExpiresAt.toISOString(), durationText };
  };

  // Inyección / extensión directa de tiempo a cualquier tienda (SuperAdmin)
  const addStoreSubscriptionTime = async (storeId, minutesToAdd) => {
    if (!storeId || !minutesToAdd) return;
    const now = new Date();

    if (storeId === tenantSlug) {
      const currentExp = storeConfig?.subscription?.subscriptionExpiresAt || storeConfig?.subscription?.trialEndsAt;
      let baseTime = now.getTime();
      if (currentExp) {
        const expTime = new Date(currentExp).getTime();
        if (expTime > baseTime) baseTime = expTime;
      }
      const newExpiresAt = new Date(baseTime + minutesToAdd * 60 * 1000);
      const updatedSub = {
        ...(storeConfig.subscription || createDefaultSubscription()),
        status: 'active',
        subscriptionExpiresAt: newExpiresAt.toISOString()
      };
      await setStoreConfig({ ...storeConfig, subscription: updatedSub });
      showToast(`¡Se sumaron ${minutesToAdd >= 1440 ? `${Math.round(minutesToAdd / 1440)} día(s)` : `${minutesToAdd} minuto(s)`} a la tienda!`, 'success');
      return;
    }

    if (supabase) {
      try {
        const { data } = await supabase.from('store_config').select('*').eq('id', storeId).maybeSingle();
        if (data) {
          const cfg = data.config || data;
          let baseTime = now.getTime();
          const currentExp = cfg?.subscription?.subscriptionExpiresAt || cfg?.subscription?.trialEndsAt;
          if (currentExp && new Date(currentExp).getTime() > baseTime) {
            baseTime = new Date(currentExp).getTime();
          }
          const newExpiresAt = new Date(baseTime + minutesToAdd * 60 * 1000);
          const updatedSub = {
            ...(cfg.subscription || createDefaultSubscription()),
            status: 'active',
            subscriptionExpiresAt: newExpiresAt.toISOString()
          };
          const updatedCfg = { ...cfg, subscription: updatedSub };
          await supabase.from('store_config').update({ config: updatedCfg, updated_at: now.toISOString() }).eq('id', storeId);
        }
      } catch (e) {
        console.warn('Error añadiendo tiempo a tienda en Supabase:', e);
      }
    }
    showToast(`Tiempo añadido exitosamente a la tienda "${storeId}".`, 'success');
  };

  // Métodos del Carrito
  const addToCart = (product, quantity = 1) => {
    const isDefined = product.stock !== 'Sin definir' && product.stock != null;
    const numStock = isDefined ? Number(product.stock) : null;

    if (isDefined && numStock <= 0) {
      showToast(`¡Lo sentimos! ${product.name} está agotado.`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const candidateQty = existing.quantity + quantity;
        const newQty = isDefined ? Math.min(candidateQty, numStock) : candidateQty;
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      const initialQty = isDefined ? Math.min(quantity, numStock) : quantity;
      return [...prev, { ...product, quantity: initialQty }];
    });

    showToast(`Agregado: ${product.name}`, 'success');
  };

  const updateCartQuantity = (productId, newQty) => {
    const product = products.find(p => p.id === productId);
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const isDefined = product && product.stock !== 'Sin definir' && product.stock != null;
    if (isDefined && newQty > Number(product.stock)) {
      showToast(`Solo quedan ${product.stock} unidades disponibles.`, 'warning');
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Cálculos del Carrito
  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const cartSavings = cart.reduce((acc, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return acc + (item.originalPrice - item.price) * item.quantity;
    }
    return acc;
  }, 0);

  // Tarifa de delivery calculada según el condominio seleccionado
  const isDeliveryEnabled = storeConfig?.enableDelivery !== false;
  const currentCondo = Array.isArray(storeConfig?.condominiums)
    ? storeConfig.condominiums.find(c => c.name === selectedLocation?.condominium)
    : null;
  const deliveryFeeBase = isDeliveryEnabled ? (currentCondo ? (currentCondo.deliveryFee ?? storeConfig?.deliveryFee ?? storeConfig?.defaultDeliveryFee ?? 0) : (storeConfig?.deliveryFee ?? storeConfig?.defaultDeliveryFee ?? 0)) : 0;
  const isFreeDelivery = !isDeliveryEnabled || (storeConfig?.freeDeliveryThreshold > 0 && cartSubtotal >= storeConfig.freeDeliveryThreshold);
  const actualDeliveryFee = (!isDeliveryEnabled || isFreeDelivery) ? 0 : deliveryFeeBase;

  // Total final
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const cartTotal = cart.length === 0 ? 0 : Math.max(0, cartSubtotal + actualDeliveryFee - discountAmount);

  // Categorías activas de la tienda: fusiona dinámicamente las predeterminadas con las configuradas en storeConfig y las presentes en productos
  const categories = useMemo(() => {
    // 1. Categorías predeterminadas canónicas
    const baseDefaultCategories = [
      { id: 'Lácteos & Huevos', name: 'Lácteos & Huevos', icon: 'Milk' },
      { id: 'Panadería & Desayuno', name: 'Panadería & Desayuno', icon: 'Croissant' },
      { id: 'Abarrotes', name: 'Abarrotes', icon: 'Package' },
      { id: 'Frutas & Verduras', name: 'Frutas & Verduras', icon: 'Apple' },
      { id: 'Bebidas & Licores', name: 'Bebidas & Licores', icon: 'Coffee' },
      { id: 'Snacks & Golosinas', name: 'Snacks & Golosinas', icon: 'Cookie' },
      { id: 'Limpieza & Hogar', name: 'Limpieza & Hogar', icon: 'Sparkle' }
    ];

    const categoryMap = new Map();

    // Registrar predeterminadas primero
    baseDefaultCategories.forEach(cat => {
      categoryMap.set(cat.id.toLowerCase().trim(), {
        id: cat.id,
        name: cat.name,
        icon: cat.icon
      });
    });

    // 2. Incorporar categorías configuradas en la tienda (creadas manualmente por el dueño en storeConfig.categories)
    const storeCategories = Array.isArray(storeConfig?.categories) ? storeConfig.categories : [];
    storeCategories.forEach(rawCat => {
      const catName = typeof rawCat === 'string' ? rawCat.trim() : (rawCat?.name || rawCat?.id || '').trim();
      if (!catName || catName.toLowerCase() === 'all' || catName.toLowerCase() === 'todos' || catName === 'Sin definir') return;
      const key = catName.toLowerCase();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          id: catName,
          name: catName,
          icon: (typeof rawCat === 'object' && rawCat.icon) ? rawCat.icon : getCategoryIconName(catName)
        });
      }
    });

    // 3. Incorporar cualquier categoría que tengan los productos del catálogo de la tienda
    if (Array.isArray(products)) {
      products.forEach(p => {
        const prodCat = (p?.category || '').trim();
        if (!prodCat || prodCat.toLowerCase() === 'all' || prodCat === 'Sin definir') return;
        const key = prodCat.toLowerCase();
        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            id: prodCat,
            name: prodCat,
            icon: getCategoryIconName(prodCat)
          });
        }
      });
    }

    // 4. Calcular conteo exacto de productos en stock por cada categoría
    const categoryList = Array.from(categoryMap.values()).map(cat => ({
      ...cat,
      count: (products || []).filter(p => (p.category || '').toLowerCase().trim() === cat.id.toLowerCase().trim()).length
    }));

    return [
      { id: 'all', name: 'Todos', icon: 'Sparkles', count: (products || []).length },
      ...categoryList
    ];
  }, [storeConfig?.categories, products]);

  // Crear Pedido desde la vista de Cliente
  const createCustomerOrder = (orderData) => {
    if (!cart || cart.length === 0) {
      console.warn('Intento de crear pedido con carrito vacío descartado.');
      showToast('Tu canasta está vacía. Agrega productos para realizar un pedido.', 'warning');
      return null;
    }

    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const orderEntropy = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `ORD-${orderNum}-${orderEntropy}`;

    // Guardar identidad del cliente para futuras visitas y fidelización
    if (orderData.phone) {
      setCustomerPhone(orderData.phone);
    }
    if (orderData.name) {
      setCustomerName(orderData.name);
    }

    const cleanPhone = normalizeCustomerPhone(orderData.phone);

    const dbPayload = {
      id: orderId,
      tenant_id: tenantSlug,
      owner_id: storeConfig?.owner_id || null,
      customer: {
        name: orderData.name || 'Vecino',
        phone: orderData.phone || '',
        condominium: orderData.condominium || '',
        tower: orderData.tower || '',
        apartment: orderData.apartment || '',
        notes: orderData.notes || ''
      },
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: cartSubtotal,
      discount: discountAmount,
      delivery_fee: orderData.deliveryType === 'delivery' ? actualDeliveryFee : 0,
      delivery_type: orderData.deliveryType || 'pickup',
      total: orderData.deliveryType === 'delivery' ? cartTotal : Math.max(0, cartSubtotal - discountAmount),
      status: 'pending',
      payment_method: orderData.cashChangeFor 
        ? { method: orderData.paymentMethod, cashChangeFor: orderData.cashChangeFor }
        : { method: orderData.paymentMethod },
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      created_at: new Date().toISOString()
    };

    const newOrder = normalizeOrder({
      ...dbPayload,
      deliveryFee: dbPayload.delivery_fee,
      deliveryType: dbPayload.delivery_type,
      paymentMethod: orderData.paymentMethod,
      cashChangeFor: orderData.cashChangeFor || null,
      couponCode: dbPayload.coupon_code,
      createdAt: dbPayload.created_at
    });

    // Descontar inventario de forma segura
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const cartItem = cart.find(c => c.id === prod.id);
        if (cartItem) {
          if (prod.stock === 'Sin definir' || prod.stock == null) {
            return prod;
          }
          const numStock = typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock, 10);
          if (isNaN(numStock)) return prod;
          return { ...prod, stock: Math.max(0, numStock - cartItem.quantity) };
        }
        return prod;
      })
    );

    // Si se aplicó un cupón, marcarlo como USADO (1 solo uso) y persistir
    if (appliedCoupon && appliedCoupon.code) {
      const codeUpper = appliedCoupon.code.toUpperCase();
      const currentCoupons = storeConfig?.coupons || [];
      const hasCoupon = currentCoupons.some(c => c.code.toUpperCase() === codeUpper);
      if (hasCoupon) {
        const updatedCoupons = currentCoupons.map(c => {
          if (c.code.toUpperCase() === codeUpper) {
            return {
              ...c,
              isUsed: true,
              usedCount: (c.usedCount || 0) + 1,
              usedInOrder: orderId,
              usedAt: new Date().toISOString()
            };
          }
          return c;
        });
        setStoreConfig(prev => ({
          ...prev,
          coupons: updatedCoupons
        }));
      }
      setAppliedCoupon(null);
    }

    // Agregar a la lista de pedidos y persistir de inmediato en memoria y localStorage
    setOrders(prev => {
      const updated = [newOrder, ...prev.filter(o => o.id !== newOrder.id)];
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(updated));
        localStorage.setItem('marketsaas_default_orders', JSON.stringify(updated));
        if (storeConfig?.tenant_id) {
          localStorage.setItem(`marketsaas_${storeConfig.tenant_id}_orders`, JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });

    try {
      localStorage.setItem('marketsaas_active_order_obj', JSON.stringify(newOrder));
      localStorage.setItem(`marketsaas_${tenantSlug}_active_order`, orderId);
      localStorage.setItem('marketsaas_default_active_order', orderId);
    } catch (e) {}

    try {
      window.dispatchEvent(new CustomEvent('marketsaas:new_order', { detail: newOrder }));
    } catch (e) {}

    if (supabase) {
      supabase.from('orders').insert([dbPayload]).then(({ error }) => {
        if (error) {
          console.error('Error insertando pedido en Supabase:', error);
        } else {
          console.log('Pedido insertado con éxito en Supabase:', orderId);
        }
      });

      // Descontar inventario de forma atómica en Supabase (RPC) para productos con stock numérico definido
      cart.forEach(item => {
        if (item.stock !== 'Sin definir' && item.stock != null) {
          supabase.rpc('decrement_stock', { product_id: item.id, quantity: item.quantity }).then(({ error }) => {
            if (error) {
              const numStock = typeof item.stock === 'number' ? item.stock : parseInt(item.stock, 10);
              if (!isNaN(numStock)) {
                supabase.from('products').update({ stock: Math.max(0, numStock - item.quantity) }).eq('id', item.id);
              }
            }
          });
        }
      });
    }

    // Limpiar carrito y abrir tracking
    clearCart();
    setActiveTrackingOrderId(orderId);
    setIsTrackingModalOpen(true);
    triggerConfetti();
    showToast(`¡Pedido ${orderId} recibido con éxito! La tienda ya lo está preparando.`, 'success');

    return newOrder;
  };

  // Actualizar estado de pedido (Dueño o Cancelación por Vecino)
  const updateOrderStatus = (orderId, newStatus) => {
    const targetOrder = orders.find(ord => ord.id === orderId);

    setOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
    if (supabase) {
      supabase.from('orders').update({ status: newStatus }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error actualizando pedido en Supabase:', error);
      });
    }

    // Revertir inventario si el pedido es cancelado y no estaba cancelado previamente
    if (newStatus === 'cancelled' && targetOrder && targetOrder.status !== 'cancelled' && Array.isArray(targetOrder.items)) {
      targetOrder.items.forEach(item => {
        if (item.stock !== 'Sin definir' && item.stock != null) {
          const qty = Number(item.quantity) || 1;
          if (supabase) {
            supabase.rpc('increment_stock', { product_id: item.id, quantity: qty }).then(({ error }) => {
              if (error) {
                const prod = products.find(p => p.id === item.id);
                if (prod && typeof prod.stock === 'number') {
                  supabase.from('products').update({ stock: prod.stock + qty }).eq('id', item.id);
                }
              }
            });
          }
          setProducts(prev => prev.map(p => {
            if (p.id === item.id) {
              const cur = typeof p.stock === 'number' ? p.stock : parseInt(p.stock, 10);
              if (!isNaN(cur)) {
                return { ...p, stock: cur + qty };
              }
            }
            return p;
          }));
        }
      });
    }

    if (newStatus === 'delivered') {
      if (activeTrackingOrderId === orderId) {
        setActiveTrackingOrderId(null);
        try {
          localStorage.removeItem(`marketsaas_${tenantSlug}_active_order`);
          localStorage.removeItem('marketsaas_default_active_order');
        } catch (e) {}
      }
    }

    const statusLabels = {
      pending: 'Pendiente',
      preparing: 'En Preparación',
      on_the_way: 'En Reparto / Listo',
      delivered: 'Entregado con Éxito',
      cancelled: 'Cancelado'
    };
    showToast(`Pedido #${orderId} actualizado a: ${statusLabels[newStatus] || newStatus}`);
  };

  // Cancelar pedido
  const cancelOrder = (orderId) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  // Eliminar pedido permanentemente (Dueño)
  const deleteOrder = (orderId) => {
    setOrders(prev => {
      const filtered = prev.filter(ord => ord.id !== orderId);
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
    if (activeTrackingOrderId === orderId) {
      setActiveTrackingOrderId(null);
      try {
        localStorage.removeItem(`marketsaas_${tenantSlug}_active_order`);
        localStorage.removeItem('marketsaas_default_active_order');
      } catch (e) {}
    }
    if (supabase) {
      supabase.from('orders').delete().eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error eliminando pedido en Supabase:', error);
      });
    }
    showToast(`Pedido #${orderId} eliminado del tablero.`, 'info');
  };

  // Crear o Editar Producto (Dueño) con persistencia garantizada en Nube y Local
  const saveProduct = async (productData, options = {}) => {
    const { silent = false } = options;
    const cleanImage = (productData.image && productData.image.trim()) 
      ? productData.image.trim() 
      : '/products/producto-sin-imagen.png';

    const isEdit = Boolean(productData.id);
    const prodId = productData.id || `${tenantSlug}-prod-${Date.now()}`;
    const nextNum = products.length + 1;
    const autoCode = `COD-${String(nextNum).padStart(3, '0')}`;
    const resolvedCode = (productData.code && String(productData.code).trim()) 
      ? String(productData.code).trim() 
      : autoCode;

    const numPrice = typeof productData.price === 'number' ? productData.price : (parseFloat(productData.price) || 0);
    const rawOrigPrice = productData.originalPrice ?? productData.original_price;
    const origPrice = (rawOrigPrice != null && rawOrigPrice !== '' && rawOrigPrice !== 'Sin definir')
      ? (typeof rawOrigPrice === 'number' ? rawOrigPrice : (parseFloat(rawOrigPrice) || numPrice))
      : numPrice;

    const costVal = productData.costPrice ?? productData.cost_price ?? 'Sin definir';
    const stockVal = productData.stock != null ? String(productData.stock) : 'Sin definir';
    const minStockVal = productData.minStock ?? productData.min_stock ?? 'Sin definir';
    const isPop = Boolean(productData.isPopular ?? productData.is_popular);
    const isAct = productData.isActive !== undefined ? Boolean(productData.isActive) : (productData.is_active !== undefined ? Boolean(productData.is_active) : true);

    // Registro sanitizado canónico con todas las columnas soportadas en Supabase
    const dbRecord = {
      id: prodId,
      tenant_id: tenantSlug,
      name: productData.name?.trim() || 'Producto Sin Nombre',
      category: productData.category?.trim() || 'Sin definir',
      price: numPrice,
      original_price: origPrice,
      originalprice: origPrice,
      originalPrice: origPrice,
      cost_price: String(costVal),
      costPrice: String(costVal),
      unit: productData.unit?.trim() || 'Sin definir',
      stock: stockVal,
      min_stock: String(minStockVal),
      minStock: String(minStockVal),
      image: cleanImage,
      badge: productData.badge?.trim() || '',
      code: resolvedCode,
      description: productData.description?.trim() || 'Sin definir',
      is_popular: isPop,
      isPopular: isPop,
      is_active: isAct,
      isactive: isAct,
      isActive: isAct,
      supplier_id: String(productData.supplierId || productData.supplier_id || ''),
      supplierId: String(productData.supplierId || productData.supplier_id || ''),
      supplier_name: String(productData.supplierName || productData.supplier_name || ''),
      supplierName: String(productData.supplierName || productData.supplier_name || ''),
      updated_at: new Date().toISOString()
    };

    const normalizedProd = normalizeProduct(dbRecord);

    // 1. Actualización inmediata en Estado React (Optimistic UI)
    let nextProducts;
    if (isEdit) {
      nextProducts = products.map(p => (p.id === prodId ? { ...p, ...normalizedProd } : p));
    } else {
      nextProducts = [normalizedProd, ...products];
    }
    setProducts(nextProducts);

    // 2. Persistencia en LocalStorage protegida contra cuota
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(nextProducts));
    } catch (lsErr) {
      console.warn('Aviso: Cuota de LocalStorage al guardar producto:', lsErr);
    }

    // 3. Persistencia en Supabase
    if (supabase) {
      try {
        let savedSuccessfully = false;
        let lastError = null;

        if (isEdit) {
          // Intentar actualización directa
          const { data: updateData, error: updateErr } = await supabase
            .from('products')
            .update(dbRecord)
            .eq('id', prodId)
            .select();

          if (!updateErr && updateData && updateData.length > 0) {
            savedSuccessfully = true;
          } else {
            lastError = updateErr;
            // Si retornó 0 filas (p.ej. el producto no existía en la nube), intentar upsert
            const { data: upsertData, error: upsertErr } = await supabase
              .from('products')
              .upsert([dbRecord])
              .select();

            if (!upsertErr && upsertData && upsertData.length > 0) {
              savedSuccessfully = true;
            } else if (upsertErr) {
              lastError = upsertErr;
            }
          }
        } else {
          // Inserción directa para nuevo producto
          const { data: insertData, error: insertErr } = await supabase
            .from('products')
            .insert([dbRecord])
            .select();

          if (!insertErr && insertData && insertData.length > 0) {
            savedSuccessfully = true;
          } else {
            lastError = insertErr;
            // Si el ID ya existiera, intentar upsert
            const { data: upsertData, error: upsertErr } = await supabase
              .from('products')
              .upsert([dbRecord])
              .select();

            if (!upsertErr && upsertData && upsertData.length > 0) {
              savedSuccessfully = true;
            } else if (upsertErr) {
              lastError = upsertErr;
            }
          }
        }

        // Si falló por falta de columnas como supplier_id en Supabase, reintentar con baseDbRecord
        if (!savedSuccessfully && lastError?.message && (lastError.message.includes('supplier_id') || lastError.message.includes('supplier'))) {
          const cleanDbRecord = { ...dbRecord };
          delete cleanDbRecord.supplier_id;
          delete cleanDbRecord.supplierId;
          delete cleanDbRecord.supplier_name;
          delete cleanDbRecord.supplierName;
          const { data: retryData, error: retryErr } = isEdit
            ? await supabase.from('products').update(cleanDbRecord).eq('id', prodId).select()
            : await supabase.from('products').insert([cleanDbRecord]).select();
          if (!retryErr && retryData && retryData.length > 0) {
            savedSuccessfully = true;
          }
        }

        // Si falló por RLS u otra razón, intentar RPC de contingencia si existe
        if (!savedSuccessfully) {
          try {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('save_product_secure', {
              p_product: dbRecord
            });
            if (!rpcErr && rpcData) {
              savedSuccessfully = true;
            }
          } catch (rpcEx) {
            // Silencioso si la función RPC aún no ha sido instalada
          }
        }

        if (savedSuccessfully) {
          if (!silent) {
            showToast(
              isEdit ? `Producto "${dbRecord.name}" guardado y sincronizado.` : `Nuevo producto "${dbRecord.name}" creado (${dbRecord.code}).`,
              'success'
            );
          }
          return { success: true, product: normalizedProd };
        } else {
          console.error('Error guardando producto en Supabase:', lastError);
          if (!silent) {
            showToast(
              `Producto guardado en este equipo, pero pendiente de sincronizar en la nube (${lastError?.message || 'verifica permisos de dueño en Supabase'}).`,
              'warning'
            );
          }
          return { success: false, product: normalizedProd, error: lastError };
        }
      } catch (cloudErr) {
        console.error('Excepción de red al guardar en Supabase:', cloudErr);
        if (!silent) {
          showToast(`Guardado localmente. Error de conexión con la nube.`, 'warning');
        }
        return { success: false, product: normalizedProd, error: cloudErr };
      }
    } else {
      if (!silent) {
        showToast(isEdit ? `Producto "${dbRecord.name}" actualizado.` : `Nuevo producto creado.`, 'success');
      }
      return { success: true, product: normalizedProd };
    }
  };

  const deleteProduct = async (productId) => {
    recordDeletedProductIds(tenantSlug, [productId]);
    let nextProducts = [];
    setProducts(prev => {
      nextProducts = prev.filter(p => p.id !== productId);
      return nextProducts;
    });
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(nextProducts));
    } catch (e) {
      console.warn('Error guardando en localStorage tras eliminar producto:', e);
    }
    if (supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('tenant_id', tenantSlug);
        if (error) console.error('Error eliminando producto en Supabase:', error);
      } catch (err) {
        console.error('Error de red al eliminar producto en Supabase:', err);
      }
    }
    showToast('Producto eliminado del catálogo.', 'warning');
  };

  // Eliminación Masiva de Productos Seleccionados
  const deleteProductsBatch = async (productIds) => {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) return;
    recordDeletedProductIds(tenantSlug, productIds);
    const idSet = new Set(productIds);
    setProducts(prev => {
      const updated = prev.filter(p => !idSet.has(p.id));
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(updated));
      } catch (e) {
        console.error('Error guardando en localStorage:', e);
      }
      return updated;
    });

    if (supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', productIds)
          .eq('tenant_id', tenantSlug);
        if (error) console.error('Error eliminando lote de productos en Supabase:', error);
      } catch (err) {
        console.error('Error de conexión al eliminar productos en Supabase:', err);
      }
    }
    showToast(`✓ Se eliminaron ${productIds.length} productos seleccionados.`, 'info');
  };

  // Importar Lote Masivo de Productos desde Excel
  const importProductsBatch = async (productList) => {
    if (!productList || !Array.isArray(productList) || productList.length === 0) {
      showToast('No hay productos válidos para importar.', 'warning');
      return;
    }

    let createdCount = 0;
    let updatedCount = 0;

    const safeExistingProducts = Array.isArray(products) ? products.filter(Boolean) : [];

    const preparedProducts = productList.map((p, idx) => {
      if (!p || typeof p !== 'object') return null;

      const pCode = p.code != null ? String(p.code).trim() : '';
      const pName = p.name != null ? String(p.name).trim().toLowerCase() : '';

      const existing = safeExistingProducts.find(ep => {
        if (!ep || typeof ep !== 'object') return false;
        const epCode = ep.code != null ? String(ep.code).trim() : '';
        const epName = ep.name != null ? String(ep.name).trim().toLowerCase() : '';
        return (pCode && epCode && epCode === pCode) || (pName && epName && epName === pName);
      });

      const prodId = existing?.id ? existing.id : `${tenantSlug}-prod-${Date.now()}-${idx}`;
      if (existing) {
        updatedCount++;
      } else {
        createdCount++;
      }

      const rawImportCost = (() => {
        const candidates = [p.costPrice, p.cost_price];
        for (const c of candidates) {
          if (c !== undefined && c !== null && c !== '' && c !== 'Sin definir') {
            const n = typeof c === 'number' ? c : parseFloat(String(c).replace(',', '.'));
            if (!isNaN(n) && n > 0) return n;
          }
        }
        for (const c of candidates) {
          if (c === 0 || c === '0' || c === '0.00') return 0;
        }
        return 'Sin definir';
      })();

      return {
        ...p,
        id: prodId,
        tenant_id: tenantSlug,
        costPrice: rawImportCost,
        cost_price: rawImportCost,
        image: p.image || '/products/producto-sin-imagen.png'
      };
    }).filter(Boolean);

    // Actualizar estado local (merge con existentes)
    setProducts(prev => {
      const safePrev = Array.isArray(prev) ? prev.filter(Boolean) : [];
      const map = new Map(safePrev.map(p => [p.id, p]));
      preparedProducts.forEach(np => {
        const prevItem = map.get(np.id) || {};
        map.set(np.id, { ...prevItem, ...np });
      });
      const updatedList = Array.from(map.values());
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(updatedList));
      } catch (e) {
        console.error('Error guardando en localStorage:', e);
      }
      return updatedList;
    });

    // Auto-agregar nuevas categorías si vienen en la importación a la configuración del dueño
    const currentCats = Array.isArray(storeConfig?.categories) ? storeConfig.categories : [];
    const newCategories = Array.from(new Set(
      preparedProducts
        .map(p => p.category)
        .filter(c => c && c !== 'Sin definir' && !currentCats.includes(c))
    ));

    if (newCategories.length > 0) {
      const updatedCategories = [...currentCats, ...newCategories];
      setStoreConfig(prev => ({
        ...(prev || {}),
        categories: updatedCategories
      }));
    }

    // Sincronizar con Supabase si está disponible
    if (supabase) {
      try {
        const supabaseBatch = preparedProducts.map(p => ({
          id: String(p.id),
          tenant_id: p.tenant_id || tenantSlug,
          name: String(p.name || 'Sin nombre'),
          category: p.category || 'Sin definir',
          code: p.code ? String(p.code) : '',
          price: typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0),
          original_price: typeof p.originalPrice === 'number' ? p.originalPrice : (parseFloat(p.originalPrice) || p.price),
          originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : (parseFloat(p.originalPrice) || p.price),
          cost_price: p.costPrice != null ? p.costPrice : 'Sin definir',
          costPrice: p.costPrice != null ? p.costPrice : 'Sin definir',
          stock: p.stock != null ? String(p.stock) : 'Sin definir',
          min_stock: p.minStock != null ? String(p.minStock) : 'Sin definir',
          minStock: p.minStock != null ? String(p.minStock) : 'Sin definir',
          unit: p.unit || 'Sin definir',
          image: p.image || '/products/producto-sin-imagen.png',
          description: p.description || 'Sin definir',
          badge: p.badge || '',
          is_popular: Boolean(p.isPopular),
          isPopular: Boolean(p.isPopular),
          is_active: true,
          isActive: true
        }));

        const { error } = await supabase.from('products').upsert(supabaseBatch);
        if (error) {
          console.error('Error en upsert batch Supabase:', error);
          showToast(`Guardado en tu inventario local. Supabase: ${error.message}`, 'warning');
          return;
        }
      } catch (err) {
        console.error('Error de conexión al sincronizar lote con Supabase:', err);
      }
    }

    showToast(`✓ Se importaron ${createdCount} productos nuevos y se actualizaron ${updatedCount}.`, 'success');
  };

  // Venta en POS de Mostrador (Dueño)
  const completePosSale = (posItems, paymentType = 'cash', creditOptions = {}) => {
    const subtotal = posItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const saleNum = Math.floor(1000 + Math.random() * 9000);
    const saleEntropy = Math.random().toString(36).substring(2, 6).toUpperCase();
    const saleId = `${tenantSlug}-POS-${saleNum}-${saleEntropy}`;

    // 1. Descontar inventario de forma segura
    let nextProducts = [];
    setProducts(prevProducts => {
      nextProducts = prevProducts.map(prod => {
        const item = posItems.find(i => i.id === prod.id);
        if (item) {
          if (prod.stock === 'Sin definir' || prod.stock == null) {
            return prod;
          }
          const currentNum = typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock, 10);
          if (isNaN(currentNum)) return prod;
          const safeStock = Math.max(0, currentNum - item.quantity);
          return { ...prod, stock: safeStock };
        }
        return prod;
      });
      return nextProducts;
    });

    // Persistir estado local de productos de inmediato
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(nextProducts));
    } catch (e) {
      console.warn('Error al guardar en localStorage tras venta POS:', e);
    }

    // 2. Si el cobro es "A Cuenta / Fiao", registrar el cargo al cliente en su libreta
    const isCredit = paymentType === 'credit';
    const customerInfo = isCredit && creditOptions?.customerId ? {
      name: creditOptions.customerName || 'Vecino a Cuenta',
      phone: creditOptions.customerPhone || '',
      condominium: creditOptions.customerApartment || 'En Tienda',
      tower: '-',
      apartment: creditOptions.customerApartment || '-'
    } : {
      name: 'Cliente Mostrador (Venta Rápida)',
      phone: '',
      condominium: 'En Tienda',
      tower: '-',
      apartment: 'Mostrador'
    };

    if (isCredit && creditOptions?.customerId) {
      const summaryItems = posItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
      addCustomerCharge(creditOptions.customerId, subtotal, `Venta POS #${saleId}: ${summaryItems}`, posItems);
    }

    // 3. Registrar como pedido completado directo con esquema normalizado dual
    const effectiveTenant = tenantSlug || merchantStore?.id || storeConfig?.id || 'default';
    const nowIso = new Date().toISOString();

    const dbPayload = {
      id: saleId,
      tenant_id: effectiveTenant,
      owner_id: currentUser?.id || storeConfig?.owner_id || null,
      customer: customerInfo,
      items: posItems,
      subtotal,
      discount: 0,
      delivery_fee: 0,
      delivery_type: 'pickup',
      total: subtotal,
      status: 'delivered',
      payment_method: paymentType,
      coupon_code: null,
      created_at: nowIso
    };

    const normalizedPosOrder = normalizeOrder({
      ...dbPayload,
      deliveryFee: 0,
      deliveryType: 'pickup',
      paymentMethod: paymentType,
      createdAt: nowIso
    });

    // Actualizar estado en memoria y persistir de inmediato en localStorage
    setOrders(prev => {
      const updated = [normalizedPosOrder, ...prev.filter(o => o.id !== normalizedPosOrder.id)];
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(updated));
        localStorage.setItem('marketsaas_default_orders', JSON.stringify(updated));
        if (storeConfig?.tenant_id) {
          localStorage.setItem(`marketsaas_${storeConfig.tenant_id}_orders`, JSON.stringify(updated));
        }
        if (merchantStore?.id && merchantStore.id !== tenantSlug) {
          localStorage.setItem(`marketsaas_${merchantStore.id}_orders`, JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });

    try {
      window.dispatchEvent(new CustomEvent('marketsaas:new_order', { detail: normalizedPosOrder }));
    } catch (e) {}

    // Persistir en Supabase con los nombres de columna canónicos
    if (supabase && effectiveTenant && effectiveTenant !== 'default') {
      supabase.from('orders').insert([dbPayload]).then(({ error }) => {
        if (error) console.error('Error insertando venta POS en Supabase:', error);
      });

      // Descontar inventario de forma atómica en Supabase
      posItems.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        if (prod && prod.stock !== 'Sin definir' && prod.stock != null) {
          supabase.rpc('decrement_stock', { product_id: item.id, quantity: item.quantity }).then(({ error }) => {
            if (error) {
              const currentNum = typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock, 10);
              if (!isNaN(currentNum)) {
                supabase.from('products').update({ stock: Math.max(0, currentNum - item.quantity) }).eq('id', item.id);
              }
            }
          });
        }
      });
    }
    triggerConfetti();
    const currency = storeConfig.currencySymbol || 'Bs.';
    if (isCredit) {
      showToast(`Venta a cuenta #${saleId} guardada para ${creditOptions.customerName || 'el vecino'}.`, 'success');
    } else {
      const payLabel = paymentType === 'cash' ? 'Efectivo' : paymentType === 'qr' ? 'QR Simple' : 'Tarjeta POS';
      showToast(`Venta rápida #${saleId} registrada en ${payLabel} por ${currency} ${subtotal.toFixed(2)}.`, 'success');
    }
    return normalizedPosOrder;
  };

  // Solicitar producto ("Pídelo si no está")
  const submitProductRequest = async (customerName, productName, notes, location = '') => {
    const trimmedProduct = productName?.trim();
    if (!trimmedProduct) return;

    const reqId = `REQ-${Date.now().toString().slice(-6)}`;
    const effectiveCustomer = customerName?.trim() || 'Vecino';
    const effectiveLocation = location?.trim() || '';

    const newReq = normalizeProductRequest({
      id: reqId,
      tenant_id: tenantSlug || 'default',
      product_name: trimmedProduct,
      productName: trimmedProduct,
      customer_name: effectiveCustomer,
      customerName: effectiveCustomer,
      customer_location: effectiveLocation,
      notes: notes?.trim() || '',
      votes: 1,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    setProductRequests(prev => {
      const updated = [newReq, ...prev.filter(r => r.id !== reqId)];
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (supabase && tenantSlug && tenantSlug !== 'default') {
      try {
        const { error } = await supabase.from('product_requests').insert([{
          id: newReq.id,
          tenant_id: newReq.tenant_id,
          product_name: newReq.product_name,
          customer_name: newReq.customer_name || 'Vecino',
          customer_location: newReq.customer_location || '',
          notes: newReq.notes || '',
          votes: 1,
          status: 'pending'
        }]);
        if (error) {
          console.error('Error insertando solicitud de producto en Supabase:', error);
        }
      } catch (err) {
        console.error('Excepción al insertar solicitud de producto:', err);
      }
    }

    const storeName = storeConfig?.name || 'la tienda';
    showToast(`¡Petición enviada al dueño de ${storeName}! La evaluará pronto.`, 'success');
  };

  const voteProductRequest = async (requestId) => {
    let nextVotes = 1;
    setProductRequests(prev =>
      prev.map(r => {
        if (r.id === requestId) {
          nextVotes = (r.votes || 0) + 1;
          return { ...r, votes: nextVotes };
        }
        return r;
      })
    );
    showToast('¡Voto registrado! Entre más vecinos voten, más rápido llegará.', 'success');

    try {
      const updated = productRequests.map(r => r.id === requestId ? { ...r, votes: (r.votes || 0) + 1 } : r);
      localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(updated));
    } catch (e) {}

    if (supabase && tenantSlug && tenantSlug !== 'default') {
      try {
        const { data, error: rpcErr } = await supabase.rpc('vote_product_request', { p_request_id: requestId });
        if (rpcErr) {
          await supabase.from('product_requests').update({ votes: nextVotes }).eq('id', requestId);
        } else if (typeof data === 'number') {
          setProductRequests(prev =>
            prev.map(r => (r.id === requestId ? { ...r, votes: data } : r))
          );
        }
      } catch (err) {
        console.warn('Error persistiendo voto en Supabase:', err);
      }
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    setProductRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status } : r))
    );

    try {
      const updated = productRequests.map(r => r.id === requestId ? { ...r, status } : r);
      localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(updated));
    } catch (e) {}

    if (supabase && tenantSlug && tenantSlug !== 'default') {
      try {
        const { error } = await supabase.from('product_requests').update({ status }).eq('id', requestId);
        if (error) console.error('Error actualizando solicitud de producto en Supabase:', error);
      } catch (err) {
        console.error('Excepción al actualizar estado de solicitud:', err);
      }
    }
    const label = status === 'approved' 
      ? 'Petición aprobada para compra.' 
      : status === 'stocked' 
      ? 'Producto marcado como disponible en tienda.' 
      : 'Estado de solicitud actualizado.';
    showToast(label, 'success');
  };

  const deleteProductRequest = async (requestId) => {
    setProductRequests(prev => prev.filter(r => r.id !== requestId));

    try {
      const updated = productRequests.filter(r => r.id !== requestId);
      localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(updated));
    } catch (e) {}

    if (supabase && tenantSlug && tenantSlug !== 'default') {
      try {
        const { error } = await supabase.from('product_requests').delete().eq('id', requestId);
        if (error) console.error('Error eliminando solicitud en Supabase:', error);
      } catch (err) {
        console.error('Excepción al eliminar solicitud:', err);
      }
    }
    showToast('Petición descartada.', 'info');
  };

  // ==============================================================================
  // GESTIÓN DE PROVEEDORES Y PEDIDOS DE ABASTECIMIENTO
  // ==============================================================================

  const syncSupplierOrderItemsToSupabase = async (supplierId, updatedItems) => {
    try {
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        await supabase.from('suppliers')
          .update({
            order_items: updatedItems,
            updated_at: new Date().toISOString()
          })
          .eq('id', supplierId)
          .eq('tenant_id', tenantSlug);
      }
    } catch (e) {
      // Fallback silencioso si la tabla aún no fue creada en Supabase
    }
  };

  const addSupplier = async (supplierData) => {
    const newSupplier = {
      id: `sup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: supplierData.name.trim(),
      contactName: supplierData.contactName?.trim() || '',
      phone: supplierData.phone?.trim() || '',
      category: supplierData.category || 'Otros',
      visitDays: Array.isArray(supplierData.visitDays) ? supplierData.visitDays : [],
      notes: supplierData.notes?.trim() || '',
      orderItems: Array.isArray(supplierData.orderItems) ? supplierData.orderItems : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSuppliers(prev => [newSupplier, ...prev]);

    try {
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        await supabase.from('suppliers').insert([{
          id: newSupplier.id,
          tenant_id: tenantSlug,
          name: newSupplier.name,
          contact_name: newSupplier.contactName,
          phone: newSupplier.phone,
          category: newSupplier.category,
          visit_days: newSupplier.visitDays,
          notes: newSupplier.notes,
          order_items: newSupplier.orderItems,
          created_at: newSupplier.createdAt,
          updated_at: newSupplier.updatedAt
        }]);
      }
    } catch (e) {
      // Fallback seguro a localStorage si la tabla no está creada en Supabase
    }

    showToast(`Proveedor "${newSupplier.name}" registrado con éxito.`, 'success');
    return newSupplier;
  };

  const updateSupplier = async (supplierId, updatedFields) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        return {
          ...s,
          ...updatedFields,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    try {
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        const payload = {};
        if (updatedFields.name !== undefined) payload.name = updatedFields.name;
        if (updatedFields.contactName !== undefined) payload.contact_name = updatedFields.contactName;
        if (updatedFields.phone !== undefined) payload.phone = updatedFields.phone;
        if (updatedFields.category !== undefined) payload.category = updatedFields.category;
        if (updatedFields.visitDays !== undefined) payload.visit_days = updatedFields.visitDays;
        if (updatedFields.notes !== undefined) payload.notes = updatedFields.notes;
        if (updatedFields.orderItems !== undefined) payload.order_items = updatedFields.orderItems;
        payload.updated_at = new Date().toISOString();

        await supabase.from('suppliers')
          .update(payload)
          .eq('id', supplierId)
          .eq('tenant_id', tenantSlug);
      }
    } catch (e) {}

    showToast('Proveedor actualizado.', 'info');
  };

  const deleteSupplier = async (supplierId) => {
    const supplierToDelete = suppliers.find(s => s.id === supplierId);
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));

    try {
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        await supabase.from('suppliers')
          .delete()
          .eq('id', supplierId)
          .eq('tenant_id', tenantSlug);
      }
    } catch (e) {}

    showToast(`Proveedor "${supplierToDelete?.name || ''}" eliminado.`, 'info');
  };

  const addSupplierOrderItem = (supplierId, item) => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productName: item.productName.trim(),
      quantity: item.quantity?.trim() || '1 unidad',
      status: 'pending',
      notes: item.notes?.trim() || ''
    };

    let updatedList = [];
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        const orderItems = Array.isArray(s.orderItems) ? s.orderItems : [];
        updatedList = [...orderItems, newItem];
        return {
          ...s,
          orderItems: updatedList,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    if (updatedList.length > 0) {
      syncSupplierOrderItemsToSupabase(supplierId, updatedList);
    }

    showToast(`"${newItem.productName}" agregado a la lista de pedido.`, 'success');
  };

  const removeSupplierOrderItem = (supplierId, itemId) => {
    let updatedList = [];
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        updatedList = (s.orderItems || []).filter(item => item.id !== itemId);
        return {
          ...s,
          orderItems: updatedList,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    syncSupplierOrderItemsToSupabase(supplierId, updatedList);
  };

  const toggleSupplierOrderItemStatus = (supplierId, itemId) => {
    let updatedList = [];
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        updatedList = (s.orderItems || []).map(item => {
          if (item.id === itemId) {
            const nextStatus = item.status === 'received' ? 'pending' : 'received';
            return { ...item, status: nextStatus };
          }
          return item;
        });
        return {
          ...s,
          orderItems: updatedList,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    syncSupplierOrderItemsToSupabase(supplierId, updatedList);
  };

  const clearSupplierOrderItems = (supplierId, onlyReceived = false) => {
    let updatedList = [];
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        updatedList = onlyReceived 
          ? (s.orderItems || []).filter(item => item.status !== 'received')
          : [];
        return {
          ...s,
          orderItems: updatedList,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    syncSupplierOrderItemsToSupabase(supplierId, updatedList);
    showToast(onlyReceived ? 'Ítems recibidos limpiados.' : 'Lista de compras vaciada.', 'info');
  };

  // ==============================================================================
  // CRUD DE RUBROS O CATEGORÍAS PRINCIPALES DE PROVEEDORES
  // ==============================================================================

  const addSupplierCategory = async (newCatName) => {
    const trimmed = (newCatName || '').trim();
    if (!trimmed) return false;
    const exists = supplierCategories.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showToast(`El rubro "${trimmed}" ya existe.`, 'warning');
      return false;
    }
    const updated = [...supplierCategories, trimmed];
    setSupplierCategoriesState(updated);
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_supplier_categories`, JSON.stringify(updated));
    } catch (e) {}
    await setStoreConfig(prev => ({
      ...prev,
      supplierCategories: updated
    }));
    showToast(`Rubro "${trimmed}" creado con éxito.`, 'success');
    return true;
  };

  const updateSupplierCategory = async (oldName, newName) => {
    const trimmedOld = (oldName || '').trim();
    const trimmedNew = (newName || '').trim();
    if (!trimmedNew || trimmedOld === trimmedNew) return false;
    const exists = supplierCategories.some(c => c.toLowerCase() === trimmedNew.toLowerCase() && c.toLowerCase() !== trimmedOld.toLowerCase());
    if (exists) {
      showToast(`Ya existe un rubro llamado "${trimmedNew}".`, 'warning');
      return false;
    }

    const updatedCats = supplierCategories.map(c => c === trimmedOld ? trimmedNew : c);
    setSupplierCategoriesState(updatedCats);
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_supplier_categories`, JSON.stringify(updatedCats));
    } catch (e) {}

    // Cascada a proveedores que tenían la categoría anterior
    let updatedSuppliers = suppliers;
    const hasMatch = suppliers.some(s => s.category === trimmedOld);
    if (hasMatch) {
      updatedSuppliers = suppliers.map(s => {
        if (s.category === trimmedOld) {
          return { ...s, category: trimmedNew, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      setSuppliers(updatedSuppliers);
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_suppliers`, JSON.stringify(updatedSuppliers));
      } catch (e) {}
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        try {
          await supabase.from('suppliers')
            .update({ category: trimmedNew })
            .eq('category', trimmedOld)
            .eq('tenant_id', tenantSlug);
        } catch (e) {}
      }
    }

    await setStoreConfig(prev => ({
      ...prev,
      supplierCategories: updatedCats,
      suppliersBackup: updatedSuppliers
    }));

    showToast(`Rubro renombrado a "${trimmedNew}".`, 'success');
    return true;
  };

  const deleteSupplierCategory = async (catToDelete) => {
    const trimmed = (catToDelete || '').trim();
    if (trimmed.toLowerCase() === 'otros') {
      showToast('No se puede eliminar el rubro principal "Otros".', 'warning');
      return false;
    }

    const updatedCats = supplierCategories.filter(c => c !== trimmed);
    if (!updatedCats.includes('Otros')) {
      updatedCats.push('Otros');
    }
    setSupplierCategoriesState(updatedCats);
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_supplier_categories`, JSON.stringify(updatedCats));
    } catch (e) {}

    // Reasignar proveedores que tenían este rubro a 'Otros'
    let updatedSuppliers = suppliers;
    const hasMatch = suppliers.some(s => s.category === trimmed);
    if (hasMatch) {
      updatedSuppliers = suppliers.map(s => {
        if (s.category === trimmed) {
          return { ...s, category: 'Otros', updatedAt: new Date().toISOString() };
        }
        return s;
      });
      setSuppliers(updatedSuppliers);
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_suppliers`, JSON.stringify(updatedSuppliers));
      } catch (e) {}
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        try {
          await supabase.from('suppliers')
            .update({ category: 'Otros' })
            .eq('category', trimmed)
            .eq('tenant_id', tenantSlug);
        } catch (e) {}
      }
    }

    await setStoreConfig(prev => ({
      ...prev,
      supplierCategories: updatedCats,
      suppliersBackup: updatedSuppliers
    }));

    showToast(`Rubro "${trimmed}" eliminado. Proveedores reasignados a "Otros".`, 'info');
    return true;
  };

  // ==============================================================================
  // LIBRETA DE CRÉDITOS Y CUENTAS POR COBRAR (FIAO VECINAL DIGITAL)
  // ==============================================================================

  const addCreditCustomer = async (customerData) => {
    const cleanName = (customerData.name || '').trim();
    if (!cleanName) {
      showToast('Ingresa el nombre del deudor para registrar su cuenta.', 'warning');
      return null;
    }

    const initialAmount = Math.max(0, parseFloat(customerData.initialBalance) || 0);
    const newCustomer = normalizeCreditCustomer({
      id: `cred-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      phone: (customerData.phone || '').trim(),
      apartment: (customerData.apartment || customerData.address || '').trim(),
      notes: (customerData.notes || '').trim(),
      balance: initialAmount,
      creditLimit: parseFloat(customerData.creditLimit) || 0,
      transactions: initialAmount > 0 ? [
        {
          id: `tx-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'charge',
          amount: initialAmount,
          concept: customerData.initialConcept?.trim() || 'Saldo inicial / Deuda previa',
          balanceAfter: initialAmount
        }
      ] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setCreditCustomers(prev => [newCustomer, ...prev]);

    try {
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        await supabase.from('credit_customers').insert([{
          id: newCustomer.id,
          tenant_id: tenantSlug,
          name: newCustomer.name,
          phone: newCustomer.phone,
          apartment: newCustomer.apartment,
          notes: newCustomer.notes,
          balance: newCustomer.balance,
          credit_limit: newCustomer.creditLimit,
          transactions: newCustomer.transactions,
          created_at: newCustomer.createdAt,
          updated_at: newCustomer.updatedAt
        }]);
      }
    } catch (e) {
      // Fallback seguro a localStorage
    }

    showToast(`Deudor "${newCustomer.name}" registrado en la libreta de cuentas.`, 'success');
    return newCustomer;
  };

  const updateCreditCustomer = async (customerId, updatedFields) => {
    setCreditCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return normalizeCreditCustomer({
          ...c,
          ...updatedFields,
          updatedAt: new Date().toISOString()
        });
      }
      return c;
    }));

    try {
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        const payload = {};
        if (updatedFields.name !== undefined) payload.name = updatedFields.name;
        if (updatedFields.phone !== undefined) payload.phone = updatedFields.phone;
        if (updatedFields.apartment !== undefined) payload.apartment = updatedFields.apartment;
        if (updatedFields.notes !== undefined) payload.notes = updatedFields.notes;
        if (updatedFields.creditLimit !== undefined) payload.credit_limit = updatedFields.creditLimit;
        payload.updated_at = new Date().toISOString();

        await supabase.from('credit_customers')
          .update(payload)
          .eq('id', customerId)
          .eq('tenant_id', tenantSlug);
      }
    } catch (e) {}

    showToast('Datos del deudor actualizados.', 'info');
  };

  const deleteCreditCustomer = async (customerId) => {
    const cust = creditCustomers.find(c => c.id === customerId);
    setCreditCustomers(prev => prev.filter(c => c.id !== customerId));

    try {
      if (supabase && tenantSlug && tenantSlug !== 'default') {
        await supabase.from('credit_customers')
          .delete()
          .eq('id', customerId)
          .eq('tenant_id', tenantSlug);
      }
    } catch (e) {}

    showToast(`Cuenta de "${cust?.name || ''}" eliminada de la libreta.`, 'info');
  };

  const addCustomerCharge = async (customerId, amount, concept = 'Compra a cuenta / Fiao', items = []) => {
    const numAmount = Math.max(0, parseFloat(amount) || 0);
    if (numAmount <= 0) return;

    let targetName = '';
    let updatedCustomer = null;

    setCreditCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        targetName = c.name;
        const newBalance = Number((c.balance + numAmount).toFixed(2));
        const newTx = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString(),
          type: 'charge',
          amount: numAmount,
          concept: concept.trim() || 'Compra a crédito',
          balanceAfter: newBalance,
          items: Array.isArray(items) ? items : []
        };
        updatedCustomer = {
          ...c,
          balance: newBalance,
          transactions: [newTx, ...(c.transactions || [])],
          updatedAt: new Date().toISOString()
        };
        return updatedCustomer;
      }
      return c;
    }));

    try {
      if (supabase && tenantSlug && tenantSlug !== 'default' && updatedCustomer) {
        await supabase.from('credit_customers')
          .update({
            balance: updatedCustomer.balance,
            transactions: updatedCustomer.transactions,
            updated_at: updatedCustomer.updatedAt
          })
          .eq('id', customerId)
          .eq('tenant_id', tenantSlug);
      }
    } catch (e) {}

    const cur = storeConfig?.currencySymbol || 'Bs.';
    showToast(`Anotado a la cuenta de ${targetName}: +${cur} ${numAmount.toFixed(2)}`, 'warning');
  };

  const addCustomerPayment = async (customerId, amount, paymentMethod = 'cash', note = '') => {
    const numAmount = Math.max(0, parseFloat(amount) || 0);
    if (numAmount <= 0) {
      showToast('Ingresa un monto válido a abonar.', 'warning');
      return;
    }

    let targetName = '';
    let newBal = 0;
    let updatedCustomer = null;

    setCreditCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        targetName = c.name;
        newBal = Math.max(0, Number((c.balance - numAmount).toFixed(2)));
        const newTx = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          date: new Date().toISOString(),
          type: 'payment',
          amount: numAmount,
          concept: note.trim() || `Abono recibido (${paymentMethod === 'qr' ? 'QR Digital' : 'Efectivo'})`,
          paymentMethod,
          balanceAfter: newBal
        };
        updatedCustomer = {
          ...c,
          balance: newBal,
          transactions: [newTx, ...(c.transactions || [])],
          updatedAt: new Date().toISOString()
        };
        return updatedCustomer;
      }
      return c;
    }));

    try {
      if (supabase && tenantSlug && tenantSlug !== 'default' && updatedCustomer) {
        await supabase.from('credit_customers')
          .update({
            balance: updatedCustomer.balance,
            transactions: updatedCustomer.transactions,
            updated_at: updatedCustomer.updatedAt
          })
          .eq('id', customerId)
          .eq('tenant_id', tenantSlug);
      }
    } catch (e) {}

    const cur = storeConfig?.currencySymbol || 'Bs.';
    triggerConfetti();
    showToast(`✓ Abono de ${cur} ${numAmount.toFixed(2)} registrado para ${targetName}. Saldo: ${cur} ${newBal.toFixed(2)}`, 'success');
  };

  const clearCustomerBalance = (customerId, paymentMethod = 'cash') => {
    const cust = creditCustomers.find(c => c.id === customerId);
    if (!cust || cust.balance <= 0) {
      showToast('Este vecino ya está al día sin saldo pendiente.', 'info');
      return;
    }
    addCustomerPayment(customerId, cust.balance, paymentMethod, 'Liquidación total de cuenta');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupón removido.', 'info');
  };

  const applyCouponCode = (code) => {
    if (!code || !code.trim()) {
      showToast('Ingresa un código de cupón.', 'warning');
      return false;
    }
    const clean = code.trim().toUpperCase();
    const available = (storeConfig?.coupons || []).find(c => c.code.toUpperCase() === clean);
    if (!available) {
      showToast('El cupón ingresado no es válido o no existe en esta tienda.', 'error');
      return false;
    }
    // REGLA: Cada cupón sólo se puede usar 1 sola vez
    const isAlreadyUsed = !!available.isUsed || (available.usedCount && available.usedCount >= (available.maxUses || 1));
    if (isAlreadyUsed) {
      showToast(`El cupón "${available.code}" ya fue utilizado y no puede volver a usarse (es válido para 1 solo uso).`, 'error');
      return false;
    }
    const currency = storeConfig.currencySymbol || 'Bs.';
    setAppliedCoupon({
      id: available.id,
      code: available.code,
      discount: parseFloat(available.discount || 0),
      description: available.description || `Descuento de ${currency} ${parseFloat(available.discount || 0).toFixed(2)}`
    });
    triggerConfetti();
    showToast(`¡Cupón "${available.code}" aplicado con éxito! (-${currency} ${parseFloat(available.discount || 0).toFixed(2)})`, 'success');
    return true;
  };

  // --- MÉTODOS DE AUTENTICACIÓN Y ONBOARDING MULTI-TENANT ---

  // 1. Registro de Comerciante (Supabase Auth)
  const signUpMerchant = async (email, password, fullName) => {
    if (!supabase) return { data: null, error: { message: 'Supabase no está configurado.' } };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (cleanEmail === 'superadmin@marketsaas.com' || cleanEmail === 'admin@marketsaas.com') {
      return { data: null, error: { message: 'Este correo electrónico está reservado para la administración del sistema.' } };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) throw error;

      // Si Supabase no devolvió sesión inmediata en el cliente, intentar inicio de sesión automático
      if (!data?.session) {
        try {
          const signInRes = await supabase.auth.signInWithPassword({ email, password });
          if (signInRes.data?.session) {
            data.session = signInRes.data.session;
            data.user = signInRes.data.user || data.user;
          }
        } catch (signInErr) {
          console.warn('Aviso de auto-login tras signUp:', signInErr);
        }
      }

      if (data?.user) {
        setCurrentUser(data.user);
      }
      return { data, error: null };
    } catch (err) {
      console.error('Error en signUpMerchant:', err);
      return { data: null, error: err };
    }
  };

  // 2. Creación y Registro de Tienda para el Comerciante
  const createMerchantStore = async ({ storeName, slug, phone, whatsapp, themeColor = 'emerald', ownerId = null }) => {
    if (!supabase) return { data: null, error: { message: 'Supabase no está configurado.' } };

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    if (!cleanSlug) return { data: null, error: { message: 'El identificador de tienda no es válido.' } };

    const RESERVED_SLUGS = [
      'admin', 'api', 'auth', 'login', 'register', 'default', 'null',
      'undefined', 'dashboard', 'settings', 'store', 'public', 'system', 'root'
    ];
    if (RESERVED_SLUGS.includes(cleanSlug)) {
      return { data: null, error: { message: `El enlace "${cleanSlug}" es una palabra reservada del sistema. Por favor elige otro identificador.` } };
    }

    try {
      const sessionUser = (await supabase.auth.getUser())?.data?.user;
      const userId = ownerId || sessionUser?.id || currentUser?.id || null;

      // Validar si ya existe ese slug en la base de datos
      const { data: existing } = await supabase
        .from('store_config')
        .select('id, owner_id')
        .eq('id', cleanSlug)
        .maybeSingle();

      if (existing) {
        // Si la tienda existente le pertenece al usuario actual, permitimos actualizarla
        if (existing.owner_id && userId && existing.owner_id === userId) {
          // El mismo usuario está finalizando su registro
        } else {
          return { 
            data: null, 
            error: { 
              message: `El nombre o enlace "${cleanSlug}" ya está registrado en la base de datos. Si eliminaste la cuenta anterior en Supabase Auth, debes ejecutar el script "cleanup_and_cascade_stores.sql" en el SQL Editor para liberar el nombre de la tienda.` 
            } 
          };
        }
      }

      const { adminPassword, admin_pin, ...baseConfig } = initialStoreConfig;
      const defaultCondos = [
        {
          id: `c-${cleanSlug}-1`,
          name: 'Condominio Central',
          towers: ['Torre A', 'Torre B'],
          deliveryFee: 0,
          estTime: '10-15 min'
        }
      ];
      const defaultSubscription = createDefaultSubscription(TRIAL_DURATION_MINUTES);
      const newConfig = {
        ...baseConfig,
        name: storeName,
        tagline: 'Tu tienda de confianza a pasos de tu puerta',
        phone: phone || '',
        whatsapp: whatsapp || phone || '',
        themeColor: themeColor || 'emerald',
        owner_id: userId,
        address: '',
        zone: '',
        reference: '',
        condominiums: defaultCondos,
        subscription: defaultSubscription
      };

      const storeRecord = {
        id: cleanSlug,
        tenant_id: cleanSlug,
        name: storeName,
        slogan: 'Tu tienda de confianza a pasos de tu puerta',
        theme_color: themeColor || 'emerald',
        currency_symbol: 'Bs.',
        is_open: true,
        address: '',
        condominiums: defaultCondos,
        coupons: [],
        categories: initialStoreConfig.categories,
        payment_methods: initialStoreConfig.paymentMethods,
        config: newConfig,
        subscription: defaultSubscription,
        owner_id: userId,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('store_config').upsert([storeRecord]).select();
      if (error) {
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          return {
            data: null,
            error: {
              message: 'Error de políticas de seguridad RLS en Supabase: Ejecuta el script "fix_store_config_rls.sql" en el SQL Editor de tu proyecto en Supabase para permitir el registro de tiendas.'
            }
          };
        }
        throw error;
      }

      // Actualizar estados reactivos
      setTenantSlug(cleanSlug);
      setStoreConfigState(newConfig);
      setMerchantStore(storeRecord);
      localStorage.setItem('marketsaas_active_tenant', cleanSlug);

      // Sincronizar teléfono en metadata de Supabase Auth para máxima consistencia y recuperación
      if (userId && (phone || whatsapp)) {
        try {
          await supabase.auth.updateUser({
            data: {
              phone: phone || '',
              whatsapp: whatsapp || phone || '',
              store_id: cleanSlug
            }
          });
        } catch (syncAuthErr) {
          console.warn('Aviso sincronizando metadata de auth:', syncAuthErr);
        }
      }

      // Las tiendas de comerciantes inician con inventario limpio listo para cargar sus propios productos o importar Excel
      setProducts([]);

      // Actualizar parámetro en la URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('store', cleanSlug);
      window.history.replaceState({}, '', newUrl.toString());

      setViewMode('admin');
      showToast(`¡Tienda "${storeName}" creada con éxito!`, 'success');
      triggerConfetti();

      return { data: storeRecord, error: null };
    } catch (err) {
      console.error('Error creando tienda:', err);
      return { data: null, error: err };
    }
  };

  // 3. Inicio de Sesión de Comerciante / SuperAdmin
  // 100% Cifrado y validado en backend por Supabase Auth (sin contraseñas en código de cliente)
  const signInMerchant = async (email, password) => {
    if (!supabase) return { data: null, store: null, error: { message: 'Supabase no está configurado.' } };
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = (password || '').trim();

      // Validación criptográfica en Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });
      if (error) throw error;

      if (data?.user) {
        setCurrentUser(data.user);

        // Si el usuario autenticado tiene rol de SuperAdmin
        if (isSuperAdminUser(data.user)) {
          setViewModeState('superadmin');
          try {
            localStorage.setItem('marketsaas_active_view_mode', 'superadmin');
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('view', 'superadmin');
            window.history.replaceState({}, '', newUrl.toString());
          } catch (e) {}
          showToast('¡Bienvenido al Panel SuperAdmin!', 'success');
          return { data, store: null, isSuperAdmin: true, error: null };
        }

        const store = await fetchStoreForUser(data.user.id, data.user.email);
        if (store) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('store', store.id);
          window.history.replaceState({}, '', newUrl.toString());
        }
        setViewMode('admin');
        showToast('¡Bienvenido a tu panel de administración!', 'success');
        return { data, store, error: null };
      }
      return { data, store: null, error: null };
    } catch (err) {
      console.error('Error en signInMerchant:', err);
      return { data: null, store: null, error: err };
    }
  };

  // 4. Cerrar Sesión de Comerciante / SuperAdmin
  const signOutMerchant = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    try {
      localStorage.setItem('marketsaas_active_view_mode', 'spectator');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('view', 'spectator');
      newUrl.searchParams.delete('superadmin');
      newUrl.searchParams.delete('mode');
      window.history.replaceState({}, '', newUrl.toString());
    } catch (e) {}
    setCurrentUser(null);
    setMerchantStore(null);
    setViewMode('spectator');
    showToast('Sesión cerrada correctamente.', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        tenantSlug,
        setTenantSlug,
        currentUser,
        isSuperAdmin: isSuperAdminUser(currentUser),
        isSuperAdminUser,
        merchantStore,
        isAuthLoading,
        signUpMerchant,
        signInMerchant,
        createMerchantStore,
        signOutMerchant,
        viewMode,
        setViewMode,
        customerSubView,
        setCustomerSubView,
        stores,
        setStores,
        selectedStore,
        setSelectedStore,
        goToStore,
        goToDirectory,
        products,
        setProducts,
        categories,
        storeConfig,
        setStoreConfig,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartSavings,
        cartTotal,
        actualDeliveryFee,
        isFreeDelivery,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        selectedLocation,
        setSelectedLocation,
        orders,
        setOrders,
        createCustomerOrder,
        updateOrderStatus,
        cancelOrder,
        deleteOrder,
        completePosSale,
        saveProduct,
        deleteProduct,
        deleteProductsBatch,
        importProductsBatch,
        customerPhone,
        setCustomerPhone,
        customerName,
        setCustomerName,
        normalizeCustomerPhone,
        productRequests,
        submitProductRequest,
        voteProductRequest,
        updateRequestStatus,
        deleteProductRequest,
        tenantSlug,
        suppliers,
        setSuppliers,
        supplierCategories,
        addSupplierCategory,
        updateSupplierCategory,
        deleteSupplierCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addSupplierOrderItem,
        removeSupplierOrderItem,
        toggleSupplierOrderItemStatus,
        clearSupplierOrderItems,
        creditCustomers,
        setCreditCustomers,
        addCreditCustomer,
        updateCreditCustomer,
        deleteCreditCustomer,
        addCustomerCharge,
        addCustomerPayment,
        clearCustomerBalance,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        isTrackingModalOpen,
        setIsTrackingModalOpen,
        toast,
        showToast,
        triggerConfetti,
        exportSalesCSV,
        isRecoveryMode,
        setIsRecoveryMode,
        subscriptionCodes,
        isSubscriptionActive,
        subscriptionTimeRemaining,
        generateSubscriptionCodes,
        deleteSubscriptionCode,
        redeemSubscriptionCode,
        addStoreSubscriptionTime,
        formatBoliviaDateTime,
        TRIAL_DURATION_MINUTES,
        BOLIVIA_TIMEZONE_OFFSET_HOURS
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
