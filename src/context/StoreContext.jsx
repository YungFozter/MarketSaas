import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { initialProducts, initialCategories, initialStoreConfig, initialOrders, initialProductRequests, initialStores, presetBanners } from '../data/initialData';
import { initialSuppliers, SUPPLIER_CATEGORIES } from '../data/supplierInitialData';
import { initialCreditCustomers, normalizeCreditCustomer } from '../data/creditInitialData';
import { fernandoSuppliers, fernandoCreditCustomers, getFernandoOrders } from '../data/tienditaFernandoData';
import { matiasSuppliers, matiasCreditCustomers, matiasProductRequests, getMatiasOrders } from '../data/matiasTiendaTodoData';
import { getStoreCatalog } from '../data/storeInventories';
import confetti from 'canvas-confetti';
import { supabase } from '../services/supabaseClient';
import { exportSalesToCSV, exportSalesToStyledExcel, exportSalesToPDF } from '../utils/salesExportUtils';
import { 
  DEFAULT_WEEKLY_SCHEDULE, 
  normalizeStoreSchedule, 
  normalizeDeliverySchedule,
  getBoliviaTime, 
  calculateStoreOpenStatus, 
  formatScheduleSummary 
} from '../utils/scheduleUtils';
import { 
  calculateDistanceKm, 
  calculateDeliveryFee, 
  validateDeliveryEligibility,
  DELIVERY_RATES,
  MAX_DELIVERY_DISTANCE_KM,
  RAIN_SURCHARGE_BS
} from '../utils/deliveryFeeUtils';
import { 
  PAYMENT_METHODS, 
  PAYMENT_METHOD_LABELS, 
  normalizeSplitPayment, 
  validateSplitPayment, 
  calculateSplitPortions, 
  formatPaymentBreakdownText,
  roundMoney
} from '../utils/paymentUtils';

export {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  normalizeSplitPayment,
  validateSplitPayment,
  calculateSplitPortions,
  formatPaymentBreakdownText,
  roundMoney
};

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

// ==============================================================================
// SISTEMA DE SUSCRIPCIONES, CONTROL DE TIEMPO Y ZONA HORARIA BOLIVIA (UTC-04:00)
// ==============================================================================
export {
  TRIAL_DURATION_MINUTES,
  BOLIVIA_TIMEZONE_OFFSET_HOURS,
  formatBoliviaDateTime,
  calculateSubscriptionTimeRemaining,
  generateCleanCode,
  createDefaultSubscription,
  normalizeSubscription,
  SUBSCRIPTION_PLANS,
  SYSTEM_FEATURES,
  resolveActivePlanType,
  isFeatureAllowedForPlan
} from '../utils/subscriptionUtils.js';

import {
  TRIAL_DURATION_MINUTES,
  BOLIVIA_TIMEZONE_OFFSET_HOURS,
  formatBoliviaDateTime,
  calculateSubscriptionTimeRemaining,
  generateCleanCode,
  createDefaultSubscription,
  normalizeSubscription,
  SUBSCRIPTION_PLANS,
  SYSTEM_FEATURES,
  resolveActivePlanType,
  isFeatureAllowedForPlan
} from '../utils/subscriptionUtils.js';

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
          ...canon,
          ...norm,
          // Preservar SIEMPRE los datos editados por el usuario si existen y son válidos
          name: norm.name?.trim() ? norm.name : canon.name,
          price: (norm.price !== undefined && norm.price !== null && !isNaN(norm.price)) ? norm.price : canon.price,
          image: (norm.image && !norm.image.includes('producto-sin-imagen')) ? norm.image : (canon.image || norm.image),
          category: (norm.category && norm.category !== 'Sin definir') ? norm.category : (canon.category || 'Sin definir'),
          stock: (norm.stock !== undefined && norm.stock !== null && norm.stock !== 'Sin definir') ? norm.stock : (canon.stock ?? 10),
          minStock: (norm.minStock !== undefined && norm.minStock !== null && norm.minStock !== 'Sin definir') ? norm.minStock : (canon.minStock ?? 5),
          min_stock: (norm.min_stock !== undefined && norm.min_stock !== null && norm.min_stock !== 'Sin definir') ? norm.min_stock : (canon.minStock ?? 5)
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

  // Soporte canónico y robusto para Pago Combinado (Split Payment)
  const rawTotal = Number(o.total || 0);
  let rawSplit = 
    o.split_payment || 
    o.splitPayment || 
    o.customer?.split_payment || 
    o.customer?.splitPayment || 
    (typeof o.payment_method === 'object' ? (o.payment_method?.splitPayment || o.payment_method?.split_payment) : null) || 
    (typeof o.paymentMethod === 'object' ? (o.paymentMethod?.splitPayment || o.paymentMethod?.split_payment) : null) ||
    o.metadata?.split_payment ||
    o.metadata?.splitPayment;

  if (!rawSplit && typeof o.payment_method === 'string' && o.payment_method.startsWith('{')) {
    try {
      const parsed = JSON.parse(o.payment_method);
      rawSplit = parsed.splitPayment || parsed.split_payment || parsed;
    } catch {}
  }

  let normalizedSplit = null;
  if (payMethod === 'combined' || payMethod === 'split' || rawSplit) {
    payMethod = 'combined';
    normalizedSplit = normalizeSplitPayment(rawSplit, rawTotal);
  }

  const rawCust = o.customer || {};
  const dType = o.delivery_type || o.deliveryType || 'pickup';
  const dFee = o.delivery_fee != null ? Number(o.delivery_fee) : (o.deliveryFee != null ? Number(o.deliveryFee) : 0);
  const dDist = o.distance_km != null 
    ? Number(o.distance_km) 
    : (o.distanceKm != null ? Number(o.distanceKm) : (rawCust.distance_km != null ? Number(rawCust.distance_km) : (rawCust.distanceKm != null ? Number(rawCust.distanceKm) : null)));
  const isRain = Boolean(o.is_rain_surcharge ?? o.isRainSurcharge ?? rawCust.is_rain_surcharge ?? rawCust.isRainSurcharge);
  const created = o.created_at || o.createdAt || new Date().toISOString();
  const cCode = o.coupon_code || o.couponCode || null;

  const normalizedCustomer = {
    name: rawCust.name || 'Cliente',
    phone: rawCust.phone || '',
    address: rawCust.address || '',
    reference: rawCust.reference || '',
    coordinates: rawCust.coordinates || null,
    notes: rawCust.notes || '',
    distance_km: dDist,
    is_rain_surcharge: isRain,
    split_payment: normalizedSplit,
    splitPayment: normalizedSplit
  };

  return {
    ...o,
    id: String(o.id),
    tenant_id: o.tenant_id || 'default',
    owner_id: o.owner_id || null,
    customer: normalizedCustomer,
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
    distance_km: dDist,
    distanceKm: dDist,
    is_rain_surcharge: isRain,
    isRainSurcharge: isRain,
    payment_method: payMethod,
    paymentMethod: payMethod,
    split_payment: normalizedSplit,
    splitPayment: normalizedSplit,
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

import { 
  isFernandoSeedStore, 
  isMatiasSeedStore, 
  isOfficialSeedStore 
} from '../utils/storeTenantUtils';

export {
  isFernandoSeedStore,
  isMatiasSeedStore,
  isOfficialSeedStore
};

// Auto-sanitización síncrona en el navegador: purga versiones viejas y limpia residuos mock en tiendas de comerciantes
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

    // Purgar de forma preventiva datos inyectados de Matías/Fernando que se hayan filtrado en tiendas no oficiales
    const SEED_SLUGS = new Set(['matias-tiendatodo', 'minimarket-ian', 'tiendita-fernando', 'fernando', 'default']);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('marketsaas_')) continue;

      // Sanitizar pedidos mock filtrados en tiendas de comerciantes
      const matchOrders = key.match(/^marketsaas_([a-z0-9-_]+)_orders$/);
      if (matchOrders && !SEED_SLUGS.has(matchOrders[1])) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter(o => {
                const id = String(o?.id || '');
                return !id.startsWith('ORD-98') && !id.startsWith('POS-100') && !id.startsWith('POS-MIX-') && !id.startsWith('ORD-MIX-') && !id.includes('fernando') && !id.includes('ian');
              });
              if (cleaned.length !== parsed.length) {
                localStorage.setItem(key, JSON.stringify(cleaned));
              }
            }
          } catch (e) {}
        }
      }

      // Sanitizar proveedores mock en tiendas no semilla
      const matchSup = key.match(/^marketsaas_([a-z0-9-_]+)_suppliers$/);
      if (matchSup && !SEED_SLUGS.has(matchSup[1])) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const hasMatiasMock = parsed.some(s => s?.id === 'sup-1' || s?.id === 'sup-2' || s?.id === 'sup-3' || s?.company?.includes('Pil Andina') || s?.company?.includes('Cervecería Boliviana'));
              if (hasMatiasMock) {
                localStorage.setItem(key, JSON.stringify([]));
                localStorage.setItem(`marketsaas_${matchSup[1]}_suppliers_initialized`, 'true');
              }
            }
          } catch (e) {}
        }
      }

      // Sanitizar créditos mock en tiendas no semilla
      const matchCred = key.match(/^marketsaas_([a-z0-9-_]+)_credits$/);
      if (matchCred && !SEED_SLUGS.has(matchCred[1])) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const hasMatiasMock = parsed.some(c => c?.id === 'deud-1' || c?.id === 'deud-2' || c?.id === 'deud-3' || c?.name?.includes('Carlos Morales') || c?.name?.includes('Doña Carmen'));
              if (hasMatiasMock) {
                localStorage.setItem(key, JSON.stringify([]));
                localStorage.setItem(`marketsaas_${matchCred[1]}_credits_initialized`, 'true');
              }
            }
          } catch (e) {}
        }
      }

      // Sanitizar solicitudes de productos mock en tiendas no semilla
      const matchReq = key.match(/^marketsaas_([a-z0-9-_]+)_requests$/);
      if (matchReq && !SEED_SLUGS.has(matchReq[1])) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const hasMatiasMock = parsed.some(r => r?.id === 'req-1' || r?.id === 'req-2' || r?.productName?.includes('Coca-Cola Zero') || r?.productName?.includes('Galletas Salvado'));
              if (hasMatiasMock) {
                localStorage.setItem(key, JSON.stringify([]));
              }
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}

export const StoreProvider = ({ children }) => {
  // Identificador de Tienda Multi-Tenant (ej. ?store=donpepe o ?tenant=central)
  const getInitialTenantSlug = () => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('store') || params.get('tenant') || localStorage.getItem('marketsaas_active_tenant') || 'matias-tiendatodo';
    if (raw === 'tiendita-fernando' || raw === 'fernando') return 'minimarket-ian';
    if (raw === 'default') return 'matias-tiendatodo';
    return raw;
  };
  const [tenantSlugState, setTenantSlugState] = useState(getInitialTenantSlug);
  const tenantSlug = (tenantSlugState === 'tiendita-fernando' || tenantSlugState === 'fernando') 
    ? 'minimarket-ian' 
    : (tenantSlugState === 'default' || !tenantSlugState ? 'matias-tiendatodo' : tenantSlugState);
  const setTenantSlug = (slug) => {
    const resolved = (slug === 'tiendita-fernando' || slug === 'fernando') 
      ? 'minimarket-ian' 
      : (slug === 'default' || !slug ? 'matias-tiendatodo' : slug);
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

  // Modo Impersonación (SuperAdmin inspeccionando una tienda en vivo - Seguro, requiere validación de sesión activa)
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Sistema de Avisos Globales de Difusión (Broadcast del SuperAdmin a todas las tiendas)
  const [systemBroadcast, setSystemBroadcast] = useState(() => {
    try {
      const saved = localStorage.getItem('marketsaas_system_broadcast');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      active: false,
      message: '',
      type: 'info', // 'info' | 'warning' | 'success'
      link: '',
      linkText: '',
      updatedAt: null
    };
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
    // Si cambiamos a Vista Dueño (admin), asegurar que tenantSlug corresponda a la tienda del dueño (a menos que esté en modo soporte impersonación)
    if (newMode === 'admin' && merchantStore?.id && !isImpersonating) {
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
        if (newMode === 'admin' && merchantStore?.id && !isImpersonating) {
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

      // Recuperar configuración aislada para la tienda seleccionada
      let localStoreConfig = null;
      try {
        const raw = localStorage.getItem(`marketsaas_${foundStore.slug}_store_config`) 
          || localStorage.getItem(`marketsaas_${foundStore.slug}_config`);
        if (raw) {
          localStoreConfig = JSON.parse(raw);
        }
      } catch (e) {}

      setStoreConfigState(prev => {
        const isCurrentOwner = Boolean(
          currentUser && (
            foundStore.owner_id === currentUser.id ||
            merchantStore?.id === foundStore.id ||
            merchantStore?.slug === foundStore.slug
          )
        );

        const storeSchedule = normalizeStoreSchedule(
          localStoreConfig?.schedule || foundStore.schedule || (isCurrentOwner ? prev?.schedule : initialStoreConfig.schedule)
        );

        const baseConfig = localStoreConfig || (isCurrentOwner ? prev : initialStoreConfig);
        const resolved = {
          ...initialStoreConfig,
          ...baseConfig,
          id: foundStore.id || foundStore.slug,
          tenant_id: foundStore.slug,
          name: foundStore.name || baseConfig?.name,
          tagline: foundStore.tagline || baseConfig?.tagline,
          address: foundStore.address || baseConfig?.address,
          owner_id: foundStore.owner_id || baseConfig?.owner_id,
          schedule: storeSchedule,
          storeOpenMode: localStoreConfig?.storeOpenMode || foundStore.storeOpenMode || (isCurrentOwner ? prev?.storeOpenMode : 'auto') || 'auto',
          scheduleClosedMessage: localStoreConfig?.scheduleClosedMessage || foundStore.scheduleClosedMessage || (isCurrentOwner ? prev?.scheduleClosedMessage : '') || '',
          deliverySchedule: normalizeDeliverySchedule(localStoreConfig?.deliverySchedule || foundStore.deliverySchedule || baseConfig?.deliverySchedule)
        };
        const statusCalc = calculateStoreOpenStatus(resolved);
        resolved.isOpen = foundStore.isOpen !== undefined ? foundStore.isOpen : statusCalc.isOpen;
        return resolved;
      });

      // Pre-cargar productos de la tienda seleccionada
      try {
        const localProds = localStorage.getItem(`marketsaas_${foundStore.slug}_products`);
        const isSeed = isOfficialSeedStore(foundStore.slug);
        const baseCatalog = isSeed ? getStoreCatalog(foundStore.slug).map(normalizeProduct) : [];
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
        const isSeed = isOfficialSeedStore(foundStore.slug);
        setProducts(isSeed ? getStoreCatalog(foundStore.slug).map(normalizeProduct) : []);
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
    if (!tenantSlug) return [];

    // Si NO es tienda semilla oficial: NUNCA inyectar catálogo determinista ni productos demo
    if (!isOfficialSeedStore(tenantSlug)) {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_products`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return deduplicateProducts(filterOutLegacyDemoProducts(parsed.map(normalizeProduct), tenantSlug));
          }
        } catch (e) {}
      }
      return [];
    }

    // Tiendas semilla oficiales (Matías TiendaTodo o Tiendita Fernando)
    const baseCatalog = tenantSlug === 'default' 
      ? initialProducts.map(normalizeProduct) 
      : getStoreCatalog(tenantSlug).map(normalizeProduct);
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
      } catch (e) {}
    }
    return baseCatalog.filter(bp => !deletedIds.has(String(bp.id)));
  });

  // 3. Configuración de Tienda Aislada por Tenant
  const [storeConfig, setStoreConfigState] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_store_config`) 
      || localStorage.getItem(`marketsaas_${tenantSlug}_config`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.name || parsed.name.includes('Don Pepe') || parsed.name.includes('VeciStore')) {
          parsed.name = 'Minimarket Saas';
        }
        if (!parsed.address || parsed.address.includes('Calle Los Sauces')) {
          parsed.address = 'Direccion según cada Tienda';
        }
        parsed.schedule = normalizeStoreSchedule(parsed.schedule);
        if (parsed.minDeliveryOrder === undefined) {
          parsed.minDeliveryOrder = 20.00;
        }
        if (parsed.isRainActive === undefined) {
          parsed.isRainActive = false;
        }
        delete parsed.condominiums;
        if (Array.isArray(parsed.coupons)) {
          parsed.coupons = parsed.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511');
        } else {
          parsed.coupons = [];
        }
        const cleaned = { 
          ...initialStoreConfig, 
          ...parsed, 
          schedule: normalizeStoreSchedule(parsed.schedule),
          coupons: parsed.coupons,
          subscription: normalizeSubscription(parsed.subscription)
        };
        const statusCalc = calculateStoreOpenStatus(cleaned);
        cleaned.isOpen = parsed.isOpen !== undefined ? parsed.isOpen : statusCalc.isOpen;
        try {
          localStorage.setItem(`marketsaas_${tenantSlug}_store_config`, JSON.stringify(cleaned));
        } catch (err) {}
        return cleaned;
      } catch (e) {
        return {
          ...initialStoreConfig,
          schedule: normalizeStoreSchedule(initialStoreConfig.schedule),
          subscription: createDefaultSubscription()
        };
      }
    }
    return {
      ...initialStoreConfig,
      schedule: normalizeStoreSchedule(initialStoreConfig.schedule),
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
    safeConfig.schedule = normalizeStoreSchedule(safeConfig.schedule);
    const calculatedStatus = calculateStoreOpenStatus(safeConfig);
    safeConfig.isOpen = calculatedStatus.isOpen;
    setStoreConfigState(safeConfig);

    const effectiveTenant = (tenantSlug && tenantSlug !== 'default' ? tenantSlug : null)
      || merchantStore?.slug
      || merchantStore?.id
      || (safeConfig?.id && safeConfig.id !== 'default' ? safeConfig.id : null)
      || (safeConfig?.tenant_id && safeConfig.tenant_id !== 'default' ? safeConfig.tenant_id : null)
      || (localStorage.getItem('marketsaas_active_tenant') && localStorage.getItem('marketsaas_active_tenant') !== 'default' ? localStorage.getItem('marketsaas_active_tenant') : null)
      || 'minimarket-ian';

    try {
      localStorage.setItem(`marketsaas_${effectiveTenant}_store_config`, JSON.stringify(safeConfig));
      localStorage.setItem(`marketsaas_${effectiveTenant}_config`, JSON.stringify(safeConfig));
      if (effectiveTenant !== 'default') {
        localStorage.setItem('marketsaas_active_tenant', effectiveTenant);
      }
    } catch (err) {
      console.warn('Aviso guardando store_config en localStorage:', err);
    }

    // Sincronizar INMEDIATAMENTE las coordenadas y estado en la lista de tiendas stores para que el mapa y directorio se actualicen en tiempo real
    const effectiveLat = safeConfig.latitude !== '' && safeConfig.latitude != null ? parseFloat(safeConfig.latitude) : safeConfig.googleMapsCoordinates?.lat;
    const effectiveLng = safeConfig.longitude !== '' && safeConfig.longitude != null ? parseFloat(safeConfig.longitude) : safeConfig.googleMapsCoordinates?.lng;
    const validCoords = (typeof effectiveLat === 'number' && !isNaN(effectiveLat) && typeof effectiveLng === 'number' && !isNaN(effectiveLng))
      ? { lat: effectiveLat, lng: effectiveLng }
      : null;

    setStores(prev => {
      const targetId = (effectiveTenant && effectiveTenant !== 'default') ? effectiveTenant : merchantStore?.id;
      if (!targetId) return prev;
      const statusCalc = calculateStoreOpenStatus(safeConfig);
      const next = prev.map(s => {
        if (s.slug === targetId || s.id === targetId) {
          return {
            ...s,
            name: safeConfig.name || s.name,
            address: safeConfig.address || s.address,
            tagline: safeConfig.tagline || s.tagline,
            googleMapsCoordinates: validCoords || s.googleMapsCoordinates,
            logoUrl: safeConfig.logoUrl || s.logoUrl || null,
            bannerUrl: safeConfig.bannerUrl || s.bannerUrl || null,
            imageUrl: safeConfig.bannerUrl || safeConfig.logoUrl || s.imageUrl,
            isOpen: statusCalc.isOpen,
            statusBadge: statusCalc.statusBadge,
            schedule: safeConfig.schedule,
            isCurrentOwnerStore: true,
            isProStore: Boolean(isProPlan || String(safeConfig.subscription?.plan || '').toLowerCase().includes('pro')),
            plan: safeConfig.subscription?.plan || (isProPlan ? 'pro' : 'basic')
          };
        }
        return s;
      });
      return deduplicateStoreList(next);
    });

    if (supabase && effectiveTenant && effectiveTenant !== 'default') {
      try {
        const sessionUser = (await supabase.auth.getUser())?.data?.user || currentUser;
        const ownerId = sessionUser?.id || merchantStore?.owner_id || safeConfig.owner_id || null;

        // Construir payload con las columnas existentes en el esquema de public.store_config.
        // Se sincronizan tanto como columnas dedicadas de alta velocidad (is_open, store_open_mode, schedule)
        // como dentro del JSONB config para resiliencia total y retrocompatibilidad.
        const payload = {
          id: effectiveTenant,
          tenant_id: effectiveTenant,
          name: safeConfig.name || 'Tienda',
          address: safeConfig.address || null,
          slogan: safeConfig.tagline || null,
          phone: safeConfig.phone || null,
          whatsapp: safeConfig.whatsapp || null,
          is_open: safeConfig.isOpen !== false,
          store_open_mode: safeConfig.storeOpenMode || safeConfig.schedule?.mode || 'auto',
          schedule: safeConfig.schedule || {},
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

  // Estado en tiempo real del local (Evaluado según horario o control manual del dueño)
  const storeOpenStatus = useMemo(() => {
    return calculateStoreOpenStatus(storeConfig);
  }, [storeConfig]);

  // Alternador manual inmediato de ABIERTO / CERRADO (Sincroniza en tiempo real en la nube)
  const toggleStoreOpenStatus = async (explicitMode) => {
    const currentStatus = calculateStoreOpenStatus(storeConfig);
    let targetMode = 'auto';
    let nextIsOpen = true;

    if (explicitMode === 'auto') {
      targetMode = 'auto';
      const scheduleObj = normalizeStoreSchedule(storeConfig?.schedule);
      const autoStatus = calculateStoreOpenStatus({
        ...storeConfig,
        storeOpenMode: 'auto',
        schedule: { ...scheduleObj, mode: 'auto' }
      });
      nextIsOpen = autoStatus.isOpen;
    } else if (explicitMode === 'manual_open' || explicitMode === true) {
      targetMode = 'manual_open';
      nextIsOpen = true;
    } else if (explicitMode === 'manual_closed' || explicitMode === false) {
      targetMode = 'manual_closed';
      nextIsOpen = false;
    } else {
      nextIsOpen = !currentStatus.isOpen;
      targetMode = nextIsOpen ? 'manual_open' : 'manual_closed';
    }

    const scheduleObj = normalizeStoreSchedule(storeConfig?.schedule);
    const updatedConfig = {
      ...storeConfig,
      isOpen: nextIsOpen,
      storeOpenMode: targetMode,
      schedule: {
        ...scheduleObj,
        mode: targetMode
      }
    };

    const res = await setStoreConfig(updatedConfig);
    if (typeof showToast === 'function') {
      showToast(
        targetMode === 'auto'
          ? (nextIsOpen ? '🟢 Horario automático: Tienda ABIERTA ahora' : '🟡 Horario automático: Tienda CERRADA ahora')
          : (nextIsOpen ? '🟢 Tu tienda ahora figura como ABIERTA al público' : '🔴 Tu tienda ahora figura como CERRADA temporalmente'),
        nextIsOpen ? 'success' : 'info'
      );
    }
    return nextIsOpen;
  };

  // 4. Carrito de Compras (En Modo Demostración inicia siempre vacío en cada recarga)
  const [cart, setCart] = useState([]);

  // 5. Ubicación seleccionada por el cliente (Dirección de entrega y coordenadas)
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_location`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          address: parsed.address || '',
          reference: parsed.reference || '',
          latitude: parsed.latitude != null ? parseFloat(parsed.latitude) : null,
          longitude: parsed.longitude != null ? parseFloat(parsed.longitude) : null,
          distanceKm: parsed.distanceKm != null ? parseFloat(parsed.distanceKm) : null,
          notes: parsed.notes || ''
        };
      }
    } catch (e) {}
    return {
      address: '',
      reference: '',
      latitude: null,
      longitude: null,
      distanceKm: null,
      notes: ''
    };
  });

  // 6. Pedidos (Normalizados para compatibilidad frontend y base de datos)
  const [orders, setOrders] = useState(() => {
    try {
      const activeSlug = tenantSlug || merchantStore?.id || null;

      // Si la tienda es de un comerciante registrado (no es semilla oficial): NUNCA inyectar pedidos de prueba
      if (!isOfficialSeedStore(activeSlug)) {
        if (activeSlug) {
          const saved = localStorage.getItem(`marketsaas_${activeSlug}_orders`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              return filterOutGhostOrders(parsed.map(normalizeOrder));
            }
          }
        }
        return [];
      }

      // Tiendas semilla oficiales (Matías TiendaTodo o Tiendita Fernando)
      const isFernando = isFernandoSeedStore(activeSlug);
      const isMatias = !isFernando;
      const saved = localStorage.getItem(`marketsaas_${activeSlug}_orders`) || (isMatias ? localStorage.getItem('marketsaas_default_orders') : null);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = filterOutGhostOrders(parsed.map(normalizeOrder));
          if (cleaned.length > 0) {
            const seedOrders = isFernando ? getFernandoOrders().map(normalizeOrder) : getMatiasOrders().map(normalizeOrder);
            const seedMap = new Map(seedOrders.map(so => [so.id, so]));
            let hasUpdate = false;
            const healed = cleaned.map(o => {
              if (seedMap.has(o.id)) {
                const fresh = seedMap.get(o.id);
                if (fresh.paymentMethod === 'combined' && (!o.splitPayment || (!o.splitPayment.qr && !o.splitPayment.card))) {
                  hasUpdate = true;
                  return { ...o, ...fresh };
                }
              }
              return o;
            });

            const existingIds = new Set(healed.map(o => o.id));
            seedOrders.forEach(so => {
              if (!existingIds.has(so.id)) {
                healed.unshift(so);
                hasUpdate = true;
              }
            });
            if (hasUpdate) {
              try {
                localStorage.setItem(`marketsaas_${activeSlug}_orders`, JSON.stringify(healed));
                if (isMatias) {
                  localStorage.setItem('marketsaas_default_orders', JSON.stringify(healed));
                }
              } catch (e) {}
            }
            return healed;
          }
        }
      }
      if (isFernando) {
        return filterOutGhostOrders(getFernandoOrders().map(normalizeOrder));
      }
      return filterOutGhostOrders(getMatiasOrders().map(normalizeOrder));
    } catch (e) {
      console.warn('Error reading stored orders:', e);
      return [];
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
      const activeSlug = tenantSlug || merchantStore?.id || null;
      if (!isOfficialSeedStore(activeSlug)) {
        if (activeSlug) {
          const saved = localStorage.getItem(`marketsaas_${activeSlug}_requests`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return filterOutTestRequests(parsed.map(normalizeProductRequest));
          }
        }
        return [];
      }
      const saved = localStorage.getItem(`marketsaas_${activeSlug}_requests`) || localStorage.getItem('marketsaas_default_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return filterOutTestRequests(parsed.map(normalizeProductRequest));
      }
    } catch (e) {}
    if (isFernandoSeedStore(tenantSlug || merchantStore?.id)) {
      return [];
    }
    return isMatiasSeedStore(tenantSlug || merchantStore?.id) ? matiasProductRequests.map(normalizeProductRequest) : [];
  });

  // 9. Proveedores y Preventistas de la tienda (Directorio de compras y pedidos de abastecimiento)
  const [suppliers, setSuppliers] = useState(() => {
    try {
      const activeSlug = tenantSlug || merchantStore?.id || null;
      if (!isOfficialSeedStore(activeSlug)) {
        if (activeSlug) {
          const saved = localStorage.getItem(`marketsaas_${activeSlug}_suppliers`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed.map(normalizeSupplier).filter(Boolean);
          }
        }
        return [];
      }

      const hasInit = localStorage.getItem(`marketsaas_${activeSlug}_suppliers_initialized`);
      const saved = localStorage.getItem(`marketsaas_${activeSlug}_suppliers`) || localStorage.getItem('marketsaas_default_suppliers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 || hasInit) {
            return parsed.map(normalizeSupplier).filter(Boolean);
          }
        }
      }
      if (hasInit) {
        return [];
      }
    } catch (e) {}
    if (isFernandoSeedStore(tenantSlug || merchantStore?.id)) {
      return fernandoSuppliers.map(normalizeSupplier);
    }
    return isMatiasSeedStore(tenantSlug || merchantStore?.id) ? matiasSuppliers.map(normalizeSupplier) : [];
  });

  // 9.b Rubros o Categorías Principales de Proveedores
  const [supplierCategories, setSupplierCategoriesState] = useState(() => {
    try {
      const activeSlug = tenantSlug || 'matias-tiendatodo';
      const saved = localStorage.getItem(`marketsaas_${activeSlug}_supplier_categories`) || localStorage.getItem('marketsaas_default_supplier_categories');
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
      const activeSlug = tenantSlug || merchantStore?.id || null;
      if (!isOfficialSeedStore(activeSlug)) {
        if (activeSlug) {
          const saved = localStorage.getItem(`marketsaas_${activeSlug}_credits`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed.map(normalizeCreditCustomer).filter(Boolean);
          }
        }
        return [];
      }

      const hasInit = localStorage.getItem(`marketsaas_${activeSlug}_credits_initialized`);
      const saved = localStorage.getItem(`marketsaas_${activeSlug}_credits`) || localStorage.getItem('marketsaas_default_credits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 || hasInit) {
            return parsed.map(normalizeCreditCustomer).filter(Boolean);
          }
        }
      }
      if (hasInit) {
        return [];
      }
    } catch (e) {}
    if (isFernandoSeedStore(tenantSlug || merchantStore?.id)) {
      return fernandoCreditCustomers.map(normalizeCreditCustomer);
    }
    return isMatiasSeedStore(tenantSlug || merchantStore?.id) ? matiasCreditCustomers.map(normalizeCreditCustomer) : [];
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

  // 10.1 Historial de pedidos del vecino realizados en este dispositivo
  const [neighborOrderIds, setNeighborOrderIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_neighbor_orders`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      const active = localStorage.getItem(`marketsaas_${tenantSlug}_active_order`);
      return active ? [active] : [];
    } catch (e) {
      return [];
    }
  });

  const addNeighborOrderId = (orderId) => {
    if (!orderId) return;
    setNeighborOrderIds(prev => {
      const updated = [orderId, ...prev.filter(id => id !== orderId)];
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_neighbor_orders`, JSON.stringify(updated));
        localStorage.setItem('marketsaas_default_neighbor_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // 11. Toast notification
  const [toast, setToast] = useState(null);

  // Función para buscar y cargar la tienda asociada al dueño
  const fetchStoreForUser = async (userId, userEmail = null, userObj = null) => {
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
      // BLINDAJE DE SEGURIDAD: Solo asociar por correo si la cuenta tiene email verificado (email_confirmed_at)
      const activeUser = userObj || currentUser;
      const isEmailVerified = Boolean(activeUser?.email_confirmed_at || activeUser?.confirmed_at);

      if (!storeRecord && isEmailVerified && userEmail) {
        const allStores = await supabase.from('store_config').select('*');
        if (allStores.data && allStores.data.length > 0) {
          storeRecord = allStores.data.find(s => {
            const cfg = s.config || s;
            const matchesId = userId && (s.owner_id === userId || cfg?.owner_id === userId);
            const matchesEmail = (
              s.owner_email === userEmail ||
              cfg?.adminEmail === userEmail ||
              cfg?.owner_email === userEmail
            );
            return matchesId || matchesEmail;
          }) || null;

          // Si encontramos la tienda por email verificado pero el owner_id estaba desfasado, re-vincular en Supabase
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

        const effectiveSchedule = normalizeStoreSchedule(
          configData.schedule || storeRecord.schedule || initialStoreConfig.schedule
        );

        const resolvedConfig = {
          ...initialStoreConfig,
          ...configData,
          id: storeRecord.id,
          tenant_id: storeRecord.id,
          subscription: effectiveSubscription,
          logoUrl: effectiveLogo,
          bannerUrl: effectiveBanner,
          qrImageUrl: effectiveQr,
          address: cleanStoreAddress,
          zone: storeRecord.zone || configData.zone || '',
          reference: storeRecord.reference || configData.reference || '',
          latitude: storeRecord.latitude ?? configData.latitude ?? null,
          longitude: storeRecord.longitude ?? configData.longitude ?? null,
          schedule: effectiveSchedule,
          storeOpenMode: configData.storeOpenMode || storeRecord.store_open_mode || 'auto',
          scheduleClosedMessage: configData.scheduleClosedMessage || '',
          deliverySchedule: normalizeDeliverySchedule(configData.deliverySchedule || storeRecord.delivery_schedule || initialStoreConfig.deliverySchedule),
          ...(loadedCategories ? { categories: loadedCategories } : {}),
          coupons: loadedCoupons,
          name: storeRecord.name || configData.name || 'Mi Tienda'
        };

        const statusCalc = calculateStoreOpenStatus(resolvedConfig);
        resolvedConfig.isOpen = storeRecord.is_open !== undefined ? storeRecord.is_open : statusCalc.isOpen;

        try {
          localStorage.setItem(`marketsaas_${storeRecord.id}_store_config`, JSON.stringify(resolvedConfig));
          localStorage.setItem(`marketsaas_${storeRecord.id}_config`, JSON.stringify(resolvedConfig));
        } catch (e) {}

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

  // Identificador de usuario SuperAdmin validado por Supabase (estrictamente app_metadata o credencial confirmada)
  const isSuperAdminUser = (user) => {
    if (!user) return false;
    const email = (user.email || '').toLowerCase().trim();
    const hasSuperAdminMetadata = user.app_metadata?.role === 'superadmin' || user.app_metadata?.is_superadmin === true;
    const isEmailConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
    const isMasterAdminEmail = isEmailConfirmed && (
      email === 'superadmin@marketsaas.com' ||
      email === 'admin@marketsaas.com'
    );
    return Boolean(hasSuperAdminMetadata || isMasterAdminEmail);
  };

  // Blindaje reactivo: si no es SuperAdmin, purgar cualquier vestigio de impersonación en memoria o localStorage
  useEffect(() => {
    if (!currentUser || !isSuperAdminUser(currentUser)) {
      if (isImpersonating) {
        setIsImpersonating(false);
      }
      try {
        localStorage.removeItem('marketsaas_is_impersonating');
      } catch {}
    }
  }, [currentUser, isImpersonating]);

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
          try {
            if (localStorage.getItem('marketsaas_is_impersonating') === 'true') {
              setIsImpersonating(true);
            }
          } catch {}
          const params = new URLSearchParams(window.location.search);
          const savedView = localStorage.getItem('marketsaas_active_view_mode');
          if (params.get('view') === 'superadmin' || savedView === 'superadmin') {
            setViewModeState('superadmin');
          }
        } else {
          await fetchStoreForUser(session.user.id, session.user.email, session.user);
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
            await fetchStoreForUser(session.user.id, session.user.email, session.user);
          }
        }
      } else {
        setCurrentUser(null);
        setMerchantStore(null);
        setIsImpersonating(false);
        try {
          localStorage.removeItem('marketsaas_is_impersonating');
        } catch {}
        setViewModeState(prev => (prev === 'superadmin' || prev === 'admin') ? 'spectator' : prev);
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
        if (!isOfficialSeedStore(tenantSlug)) {
          // Tiendas de comerciantes: jamás mezclar con baseCatalog ni inyectar productos demo
          if (localProds) {
            try {
              const parsed = JSON.parse(localProds);
              if (Array.isArray(parsed)) {
                setProducts(deduplicateProducts(filterOutLegacyDemoProducts(parsed.map(normalizeProduct), tenantSlug)));
              } else {
                setProducts([]);
              }
            } catch {
              setProducts([]);
            }
          } else {
            setProducts([]);
          }
        } else {
          // Tiendas semilla oficiales
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
        }

        const localOrders = localStorage.getItem(`marketsaas_${tenantSlug}_orders`);
        if (!isOfficialSeedStore(tenantSlug)) {
          // Tiendas de comerciantes: jamás inyectar pedidos de prueba
          if (localOrders) {
            try {
              const parsed = JSON.parse(localOrders);
              setOrders(Array.isArray(parsed) ? filterOutGhostOrders(parsed.map(normalizeOrder)) : []);
            } catch {
              setOrders([]);
            }
          } else {
            setOrders([]);
          }
        } else {
          if (localOrders) {
            try {
              const parsed = JSON.parse(localOrders);
              const isFernando = isFernandoSeedStore(tenantSlug);
              const seedOrders = isFernando ? getFernandoOrders().map(normalizeOrder) : getMatiasOrders().map(normalizeOrder);
              const seedMap = new Map(seedOrders.map(so => [so.id, so]));
              let hasUpdate = false;
              const healed = parsed.map(o => {
                if (seedMap.has(o.id)) {
                  const fresh = seedMap.get(o.id);
                  if (fresh.paymentMethod === 'combined' && (!o.splitPayment || (!o.splitPayment.qr && !o.splitPayment.card))) {
                    hasUpdate = true;
                    return { ...o, ...fresh };
                  }
                }
                return o;
              });

              const existingIds = new Set(healed.map(o => o.id));
              seedOrders.forEach(so => {
                if (!existingIds.has(so.id)) {
                  healed.unshift(so);
                  hasUpdate = true;
                }
              });
              if (hasUpdate) {
                try {
                  localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(healed));
                } catch (e) {}
              }
              setOrders(healed.map(normalizeOrder));
            } catch {
              setOrders(JSON.parse(localOrders));
            }
          } else {
            const isFernando = isFernandoSeedStore(tenantSlug);
            setOrders(isFernando ? getFernandoOrders().map(normalizeOrder) : getMatiasOrders().map(normalizeOrder));
          }
        }

        const localCfg = localStorage.getItem(`marketsaas_${tenantSlug}_config`);
        if (localCfg) {
          setStoreConfigState(JSON.parse(localCfg));
        }

        const localReqs = localStorage.getItem(`marketsaas_${tenantSlug}_requests`);
        if (!isOfficialSeedStore(tenantSlug)) {
          if (localReqs) {
            try {
              const parsed = JSON.parse(localReqs);
              setProductRequests(Array.isArray(parsed) ? filterOutTestRequests(parsed.map(normalizeProductRequest)) : []);
            } catch {
              setProductRequests([]);
            }
          } else {
            setProductRequests([]);
          }
        } else {
          if (localReqs) {
            const parsed = JSON.parse(localReqs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProductRequests(filterOutTestRequests(parsed.map(normalizeProductRequest)));
            } else if (isMatiasSeedStore(tenantSlug)) {
              setProductRequests(matiasProductRequests.map(normalizeProductRequest));
            } else {
              setProductRequests([]);
            }
          } else if (isMatiasSeedStore(tenantSlug)) {
            setProductRequests(matiasProductRequests.map(normalizeProductRequest));
          } else {
            setProductRequests([]);
          }
        }

        const activeSlug = tenantSlug;
        if (!isOfficialSeedStore(activeSlug)) {
          const localSuppliers = localStorage.getItem(`marketsaas_${activeSlug}_suppliers`);
          if (localSuppliers) {
            try {
              const parsed = JSON.parse(localSuppliers);
              setSuppliers(Array.isArray(parsed) ? parsed.map(normalizeSupplier).filter(Boolean) : []);
            } catch {
              setSuppliers([]);
            }
          } else {
            setSuppliers([]);
          }
        } else {
          const hasSupInit = localStorage.getItem(`marketsaas_${activeSlug}_suppliers_initialized`);
          const localSuppliers = localStorage.getItem(`marketsaas_${activeSlug}_suppliers`) || localStorage.getItem('marketsaas_default_suppliers');
          if (localSuppliers) {
            try {
              const parsed = JSON.parse(localSuppliers);
              if (Array.isArray(parsed)) {
                if (parsed.length > 0 || hasSupInit) {
                  setSuppliers(parsed.map(normalizeSupplier).filter(Boolean));
                } else if (isFernandoSeedStore(activeSlug)) {
                  setSuppliers(fernandoSuppliers.map(normalizeSupplier));
                } else {
                  setSuppliers(matiasSuppliers.map(normalizeSupplier));
                }
              }
            } catch (e) {}
          } else if (hasSupInit) {
            setSuppliers([]);
          } else if (isFernandoSeedStore(activeSlug)) {
            setSuppliers(fernandoSuppliers.map(normalizeSupplier));
          } else {
            setSuppliers(matiasSuppliers.map(normalizeSupplier));
          }
        }

        if (!isOfficialSeedStore(activeSlug)) {
          const localCredits = localStorage.getItem(`marketsaas_${activeSlug}_credits`);
          if (localCredits) {
            try {
              const parsed = JSON.parse(localCredits);
              setCreditCustomers(Array.isArray(parsed) ? parsed.map(normalizeCreditCustomer).filter(Boolean) : []);
            } catch {
              setCreditCustomers([]);
            }
          } else {
            setCreditCustomers([]);
          }
        } else {
          const hasCredInit = localStorage.getItem(`marketsaas_${activeSlug}_credits_initialized`);
          const localCredits = localStorage.getItem(`marketsaas_${activeSlug}_credits`) || localStorage.getItem('marketsaas_default_credits');
          if (localCredits) {
            try {
              const parsed = JSON.parse(localCredits);
              if (Array.isArray(parsed)) {
                if (parsed.length > 0 || hasCredInit) {
                  setCreditCustomers(parsed.map(normalizeCreditCustomer).filter(Boolean));
                } else if (isFernandoSeedStore(activeSlug)) {
                  setCreditCustomers(fernandoCreditCustomers.map(normalizeCreditCustomer));
                } else {
                  setCreditCustomers(matiasCreditCustomers.map(normalizeCreditCustomer));
                }
              }
            } catch (e) {}
          } else if (hasCredInit) {
            setCreditCustomers([]);
          } else if (isFernandoSeedStore(activeSlug)) {
            setCreditCustomers(fernandoCreditCustomers.map(normalizeCreditCustomer));
          } else {
            setCreditCustomers(matiasCreditCustomers.map(normalizeCreditCustomer));
          }
        }
      } else {
        setProductRequests(matiasProductRequests.map(normalizeProductRequest));
        const activeSlug = 'matias-tiendatodo';
        const hasSupInit = localStorage.getItem(`marketsaas_${activeSlug}_suppliers_initialized`);
        const savedSup = localStorage.getItem(`marketsaas_${activeSlug}_suppliers`);
        if (savedSup && (hasSupInit || JSON.parse(savedSup).length > 0)) {
          setSuppliers(JSON.parse(savedSup).map(normalizeSupplier).filter(Boolean));
        } else {
          setSuppliers(matiasSuppliers.map(normalizeSupplier));
        }
        const hasCredInit = localStorage.getItem(`marketsaas_${activeSlug}_credits_initialized`);
        const savedCred = localStorage.getItem(`marketsaas_${activeSlug}_credits`);
        if (savedCred && (hasCredInit || JSON.parse(savedCred).length > 0)) {
          setCreditCustomers(JSON.parse(savedCred).map(normalizeCreditCustomer).filter(Boolean));
        } else {
          setCreditCustomers(matiasCreditCustomers.map(normalizeCreditCustomer));
        }
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
        if (!isOfficialSeedStore(tenantSlug)) {
          // Tiendas de comerciantes reales: solo cargar lo que realmente está en la BD o en localStorage
          const localProdsRaw = localStorage.getItem(`marketsaas_${tenantSlug}_products`);
          let localItems = [];
          if (localProdsRaw) {
            try {
              const p = JSON.parse(localProdsRaw);
              if (Array.isArray(p)) localItems = p;
            } catch (e) {}
          }
          if (data.length > 0) {
            const normalizedData = data.map(normalizeProduct);
            setProducts(normalizedData);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(normalizedData));
            } catch (e) {}
          } else if (localItems.length > 0) {
            setProducts(localItems.map(normalizeProduct));
          } else {
            // Tienda nueva limpia: NUNCA inyectar catálogo ni subir productos ficticios a Supabase
            setProducts([]);
          }
          return;
        }

        // Tiendas semilla oficiales (Matías TiendaTodo o Tiendita Fernando)
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

        // Auto-sincronizar con Supabase productos base que falten para garantizar persistencia remota (SOLO en tiendas semilla)
        const missingFromDb = baseCatalog.filter(bp => !existingIds.has(String(bp.id)) && !deletedIds.has(String(bp.id)));
        if (missingFromDb.length > 0 && tenantSlug !== 'default' && isOfficialSeedStore(tenantSlug)) {
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
          const storeSchedule = normalizeStoreSchedule(configData.schedule || data.schedule || prev?.schedule || initialStoreConfig.schedule);
          const storeMode = configData.storeOpenMode || data.store_open_mode || prev?.storeOpenMode || 'auto';
          const storeClosedMsg = configData.scheduleClosedMessage || prev?.scheduleClosedMessage || '';

          const merged = {
            ...initialStoreConfig,
            ...prev,
            ...configData,
            id: data.id || tenantSlug,
            tenant_id: data.tenant_id || tenantSlug,
            subscription: effectiveSubscription,
            logoUrl: effectiveLogo,
            bannerUrl: effectiveBanner,
            qrImageUrl: effectiveQr,
            schedule: storeSchedule,
            storeOpenMode: storeMode,
            scheduleClosedMessage: storeClosedMsg,
            ...(loadedCategories ? { categories: loadedCategories } : {}),
            coupons: loadedCoupons,
            deliverySchedule: normalizeDeliverySchedule(configData.deliverySchedule || data.delivery_schedule || prev?.deliverySchedule),
            name: data.name || configData.name || prev?.name || 'Mi Tienda'
          };

          const openStatus = calculateStoreOpenStatus(merged);
          merged.isOpen = data.is_open !== undefined ? data.is_open : (configData.isOpen !== undefined ? configData.isOpen : openStatus.isOpen);

          try {
            localStorage.setItem(`marketsaas_${tenantSlug}_store_config`, JSON.stringify(merged));
            localStorage.setItem(`marketsaas_${tenantSlug}_config`, JSON.stringify(merged));
          } catch (e) {}

          return merged;
        });
      }
    });

    // 3. Cargar pedidos por tienda con filtro server-side seguro (Estrictamente para dueño autenticado o SuperAdmin)
    const canLoadStoreOrders = Boolean(currentUser && (merchantStore?.id || isImpersonating || isSuperAdminUser(currentUser)));
    if (canLoadStoreOrders) {
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
          if (isFernandoSeedStore(tenantSlug)) {
            const seedOrders = getFernandoOrders().map(normalizeOrder);
            const seedMap = new Map(seedOrders.map(so => [so.id, so]));
            normalized = normalized.map(o => {
              if (seedMap.has(o.id)) {
                const fresh = seedMap.get(o.id);
                if (fresh.paymentMethod === 'combined' && (!o.splitPayment || (!o.splitPayment.qr && !o.splitPayment.card))) {
                  return { ...o, ...fresh };
                }
              }
              return o;
            });
            const existingIds = new Set(normalized.map(o => o.id));
            seedOrders.forEach(so => {
              if (!existingIds.has(so.id)) {
                normalized.push(so);
              }
            });
          } else if (isMatiasSeedStore(tenantSlug)) {
            const seedOrders = getMatiasOrders().map(normalizeOrder);
            const seedMap = new Map(seedOrders.map(so => [so.id, so]));
            normalized = normalized.map(o => {
              if (seedMap.has(o.id)) {
                const fresh = seedMap.get(o.id);
                if (fresh.paymentMethod === 'combined' && (!o.splitPayment || (!o.splitPayment.qr && !o.splitPayment.card))) {
                  return { ...o, ...fresh };
                }
              }
              return o;
            });
            const existingIds = new Set(normalized.map(o => o.id));
            seedOrders.forEach(so => {
              if (!existingIds.has(so.id)) {
                normalized.push(so);
              }
            });
          }

          setOrders(prev => {
            // Preservar pedidos pendientes legítimos locales para que nunca se pierdan por desfase de red
            const isSeed = isOfficialSeedStore(tenantSlug);
            const localPending = (prev || []).filter(o => {
              if (!o || o.status !== 'pending') return false;
              const id = String(o.id || '');
              if (id.startsWith('MOCK-') || id.startsWith('TEST-')) return false;
              // Si no es tienda semilla, descartar cualquier residuo de órdenes de Matías o Fernando
              if (!isSeed && (id.startsWith('ORD-98') || id.startsWith('POS-100') || id.startsWith('POS-MIX-') || id.startsWith('ORD-MIX-') || id.includes('fernando') || id.includes('ian'))) {
                return false;
              }
              return true;
            });
            const existingIds = new Set(normalized.map(o => o.id));
            const merged = [...normalized];
            localPending.forEach(lp => {
              if (!existingIds.has(lp.id)) {
                merged.unshift(lp);
              }
            });
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(merged));
              if (activeAdminTenant && activeAdminTenant !== tenantSlug) {
                localStorage.setItem(`marketsaas_${activeAdminTenant}_orders`, JSON.stringify(merged));
              }
            } catch (e) {}
            return merged;
          });
        }
      });
    } else if (activeTrackingOrderId || (neighborOrderIds && neighborOrderIds.length > 0)) {
      // Para clientes vecinos: consultar pedidos para sincronizar su estado (pendientes, en camino y entregados)
      const idsToSync = Array.from(new Set([activeTrackingOrderId, ...(neighborOrderIds || [])].filter(Boolean)));
      const syncTrackingOrders = async () => {
        try {
          if (idsToSync.length === 1) {
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('get_order_tracking', { p_order_id: idsToSync[0] });
            if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
              const normalized = normalizeOrder(rpcData[0]);
              setOrders(prev => {
                const remaining = (prev || []).filter(o => o.id !== normalized.id);
                return [normalized, ...remaining];
              });
              return;
            }
          }

          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .in('id', idsToSync);
          if (!error && Array.isArray(data) && data.length > 0) {
            const normalizedList = data.map(normalizeOrder);
            setOrders(prev => {
              const remaining = (prev || []).filter(o => !normalizedList.some(n => n.id === o.id));
              return [...normalizedList, ...remaining];
            });
          }
        } catch (e) {
          // Silenciosamente continuar si el RPC aún no fue desplegado en la BD
        }
      };
      syncTrackingOrders();
    }

    // 4. Cargar solicitudes de productos por tienda
    if (tenantSlug && tenantSlug !== 'default') {
      supabase.from('product_requests')
        .select('id, tenant_id, product_name, customer_name, customer_location, notes, votes, status, created_at')
        .eq('tenant_id', tenantSlug)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && Array.isArray(data) && data.length > 0) {
            const normalized = filterOutTestRequests(data.map(normalizeProductRequest));
            setProductRequests(normalized);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(normalized));
            } catch (e) {}
          } else if (isMatiasSeedStore(tenantSlug)) {
            const fallback = matiasProductRequests.map(normalizeProductRequest);
            setProductRequests(fallback);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(fallback));
            } catch (e) {}
          } else {
            setProductRequests([]);
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify([]));
            } catch (e) {}
          }
        });
    }

    // 5. Cargar proveedores por tienda
    const activeSupplierTenant = merchantStore?.id || tenantSlug || 'default';
    const isIanSup = isFernandoSeedStore(activeSupplierTenant);
    const isDemoMatiasSup = isMatiasSeedStore(activeSupplierTenant);
    const supTenantFilter = isIanSup
      ? ['minimarket-ian', 'tiendita-fernando']
      : isDemoMatiasSup
        ? ['matias-tiendatodo', 'default']
        : [activeSupplierTenant];

    // Función de fusión inteligente para proveedores y sus listas de pedidos (evita perder ítems al recargar)
    const mergeSuppliers = (localList = [], remoteList = []) => {
      const map = new Map();

      // 1. Agregar proveedores remotos
      (remoteList || []).forEach(remote => {
        if (remote && remote.id) {
          map.set(remote.id, remote);
        }
      });

      // 2. Fusionar con proveedores locales para conservar listas de pedidos y cambios recientes
      (localList || []).forEach(local => {
        if (!local || !local.id) return;
        if (!map.has(local.id)) {
          // Proveedor creado localmente que aún no está en Supabase: conservarlo intacto
          map.set(local.id, local);
        } else {
          const remote = map.get(local.id);
          const localOrderItems = Array.isArray(local.orderItems) ? local.orderItems : [];
          const remoteOrderItems = Array.isArray(remote.orderItems) ? remote.orderItems : [];

          // Fusión de listas de pedido: Si local tiene ítems y remoto no, o local tiene más ítems
          let mergedOrderItems = remoteOrderItems;
          if (localOrderItems.length > 0 && remoteOrderItems.length === 0) {
            mergedOrderItems = localOrderItems;
          } else if (localOrderItems.length > 0) {
            const itemsMap = new Map();
            remoteOrderItems.forEach(item => { if (item && item.id) itemsMap.set(item.id, item); });
            localOrderItems.forEach(item => { if (item && item.id) itemsMap.set(item.id, item); });
            mergedOrderItems = Array.from(itemsMap.values());
          }

          map.set(local.id, {
            ...remote,
            ...local,
            orderItems: mergedOrderItems,
            updatedAt: local.updatedAt || remote.updatedAt || new Date().toISOString()
          });
        }
      });

      return Array.from(map.values());
    };

    supabase.from('suppliers')
      .select('*')
      .in('tenant_id', supTenantFilter)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        // Leer estado local actual y respaldo en caché
        let localExisting = [];
        try {
          const raw = localStorage.getItem(`marketsaas_${activeSupplierTenant}_suppliers`) || 
                      (isOfficialSeedStore(activeSupplierTenant) ? (localStorage.getItem('marketsaas_default_suppliers') || localStorage.getItem('marketsaas_matias-tiendatodo_suppliers')) : null);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localExisting = parsed.map(normalizeSupplier).filter(Boolean);
          }
        } catch (e) {}

        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteNormalized = filterOutDemoSuppliers(data.map(normalizeSupplier)).filter(Boolean);
          const merged = mergeSuppliers(localExisting, remoteNormalized);
          setSuppliers(merged);
          try {
            localStorage.setItem(`marketsaas_${activeSupplierTenant}_suppliers`, JSON.stringify(merged));
            localStorage.setItem(`marketsaas_${activeSupplierTenant}_suppliers_initialized`, 'true');
            if (isDemoMatiasSup) localStorage.setItem('marketsaas_default_suppliers', JSON.stringify(merged));
          } catch (e) {}
        } else {
          // Si Supabase devuelve 0 filas o hay error, revisar si el dueño ya guardó proveedores localmente
          const hasInit = localStorage.getItem(`marketsaas_${activeSupplierTenant}_suppliers_initialized`);
          if (localExisting.length > 0 || hasInit) {
            setSuppliers(localExisting);
            return;
          }
          if (!isOfficialSeedStore(activeSupplierTenant)) {
            setSuppliers([]);
            return;
          }
          const fallback = isIanSup ? fernandoSuppliers : matiasSuppliers;
          const normalizedFallback = fallback.map(normalizeSupplier).filter(Boolean);
          setSuppliers(normalizedFallback);
          try {
            localStorage.setItem(`marketsaas_${activeSupplierTenant}_suppliers`, JSON.stringify(normalizedFallback));
          } catch (e) {}
        }
      });

    // 6. Cargar deudores / libreta de créditos por tienda desde Supabase con persistencia resiliente
    const activeCreditTenant = merchantStore?.id || tenantSlug || 'default';
    const isIanCredit = isFernandoSeedStore(activeCreditTenant);
    const isDemoMatiasCredit = isMatiasSeedStore(activeCreditTenant);
    const creditTenantFilter = isIanCredit 
      ? ['minimarket-ian', 'tiendita-fernando'] 
      : isDemoMatiasCredit 
        ? ['matias-tiendatodo', 'default'] 
        : [activeCreditTenant];

    // Función de fusión inteligente para jamás perder saldos o transacciones locales
    const mergeCreditCustomers = (localList = [], remoteList = []) => {
      const map = new Map();

      // 1. Agregar clientes remotos
      (remoteList || []).forEach(remote => {
        if (remote && remote.id) {
          map.set(remote.id, remote);
        }
      });

      // 2. Fusionar con clientes locales
      (localList || []).forEach(local => {
        if (!local || !local.id) return;
        if (!map.has(local.id)) {
          // Cliente existe localmente pero no en Supabase: conservarlo intacto
          map.set(local.id, local);
        } else {
          const remote = map.get(local.id);
          const localTime = new Date(local.updatedAt || local.updated_at || local.createdAt || 0).getTime();
          const remoteTime = new Date(remote.updatedAt || remote.updated_at || remote.createdAt || 0).getTime();
          const localTxCount = Array.isArray(local.transactions) ? local.transactions.length : 0;
          const remoteTxCount = Array.isArray(remote.transactions) ? remote.transactions.length : 0;

          // Si el registro local es más reciente o tiene más transacciones (abonos/cargos locales), priorizar el local
          if (localTime > remoteTime || localTxCount > remoteTxCount || (localTime === remoteTime && localTxCount >= remoteTxCount)) {
            map.set(local.id, local);
          } else {
            map.set(local.id, remote);
          }
        }
      });

      return Array.from(map.values());
    };
    
    supabase.from('credit_customers')
      .select('*')
      .in('tenant_id', creditTenantFilter)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        // Leer estado local actual y respaldo en caché
        let localExisting = [];
        try {
          const raw = localStorage.getItem(`marketsaas_${activeCreditTenant}_credits`) || 
                      (isOfficialSeedStore(activeCreditTenant) ? (localStorage.getItem('marketsaas_default_credits') || localStorage.getItem('marketsaas_matias-tiendatodo_credits')) : null);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localExisting = parsed.map(normalizeCreditCustomer).filter(Boolean);
          }
        } catch (e) {}

        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteNormalized = data.map(normalizeCreditCustomer).filter(Boolean);
          const merged = mergeCreditCustomers(localExisting, remoteNormalized);
          setCreditCustomers(merged);

          try {
            localStorage.setItem(`marketsaas_${activeCreditTenant}_credits`, JSON.stringify(merged));
            localStorage.setItem(`marketsaas_${activeCreditTenant}_credits_initialized`, 'true');
            if (isDemoMatiasCredit) {
              localStorage.setItem('marketsaas_default_credits', JSON.stringify(merged));
              localStorage.setItem('marketsaas_matias-tiendatodo_credits', JSON.stringify(merged));
            }
          } catch (e) {}

          // Si algún cliente local tenía datos más nuevos que Supabase o no existía en Supabase, sincronizarlo
          merged.forEach(cust => {
            const remoteFound = data.find(r => r.id === cust.id);
            const localTxCount = Array.isArray(cust.transactions) ? cust.transactions.length : 0;
            const remoteTxCount = remoteFound && Array.isArray(remoteFound.transactions) ? remoteFound.transactions.length : 0;
            if (!remoteFound || localTxCount > remoteTxCount || cust.balance !== (remoteFound?.balance ?? cust.balance)) {
              supabase.from('credit_customers').upsert([{
                id: cust.id,
                tenant_id: activeCreditTenant,
                name: cust.name,
                phone: cust.phone || '',
                apartment: cust.apartment || '',
                notes: cust.notes || '',
                balance: cust.balance,
                credit_limit: cust.creditLimit || 0,
                transactions: cust.transactions || [],
                created_at: cust.createdAt || new Date().toISOString(),
                updated_at: cust.updatedAt || new Date().toISOString()
              }], { onConflict: 'id' }).then(() => {}).catch(() => {});
            }
          });
        } else {
          // Si Supabase devuelve 0 filas o hay error (ej. RLS o sin conexión),
          // ¡NUNCA SOBRESCRIBIR con demo si el dueño ya tiene deudores registrados localmente!
          const hasInit = localStorage.getItem(`marketsaas_${activeCreditTenant}_credits_initialized`);
          if (localExisting.length > 0) {
            setCreditCustomers(localExisting);
            return;
          }
          if (hasInit || !isOfficialSeedStore(activeCreditTenant)) {
            setCreditCustomers([]);
            return;
          }
          const fallback = isIanCredit ? fernandoCreditCustomers : matiasCreditCustomers;
          const normalizedFallback = fallback.map(normalizeCreditCustomer).filter(Boolean);
          setCreditCustomers(normalizedFallback);
          try {
            localStorage.setItem(`marketsaas_${activeCreditTenant}_credits`, JSON.stringify(normalizedFallback));
            if (isDemoMatiasCredit) {
              localStorage.setItem('marketsaas_default_credits', JSON.stringify(normalizedFallback));
              localStorage.setItem('marketsaas_matias-tiendatodo_credits', JSON.stringify(normalizedFallback));
            }
          } catch (e) {}
        }
      });

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
      .on('broadcast', { event: 'new_order' }, payload => {
        if (payload?.payload) {
          const normalized = normalizeOrder(payload.payload);
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

    const activeRtTenant = merchantStore?.id || tenantSlug || 'default';
    const isIanRt = activeRtTenant === 'minimarket-ian' || activeRtTenant === 'tiendita-fernando';
    const isDemoMatiasRt = activeRtTenant === 'matias-tiendatodo' || activeRtTenant === 'default';

    const suppliersChannel = supabase
      .channel(`public:suppliers:${activeRtTenant}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'suppliers'
      }, payload => {
        const itemTenant = payload.new?.tenant_id || payload.old?.tenant_id;
        const isMatch = isIanRt
          ? (itemTenant === 'minimarket-ian' || itemTenant === 'tiendita-fernando')
          : isDemoMatiasRt
            ? (!itemTenant || itemTenant === 'matias-tiendatodo' || itemTenant === 'default')
            : itemTenant === activeRtTenant;

        if (!isMatch) return;

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
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setSuppliers(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    const creditsChannel = supabase
      .channel(`public:credit_customers:${activeRtTenant}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'credit_customers'
      }, payload => {
        const itemTenant = payload.new?.tenant_id || payload.old?.tenant_id;
        const isMatch = isIanRt
          ? (itemTenant === 'minimarket-ian' || itemTenant === 'tiendita-fernando')
          : isDemoMatiasRt
            ? (!itemTenant || itemTenant === 'matias-tiendatodo' || itemTenant === 'default')
            : itemTenant === activeRtTenant;

        if (!isMatch) return;

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
        } else if (payload.eventType === 'DELETE' && payload.old) {
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

  // Sincronización inmediata entre pestañas locales del mismo navegador (Cross-Tab Sync)
  useEffect(() => {
    const handleCrossTabOrder = (incomingOrder) => {
      if (!incomingOrder || !incomingOrder.id) return;
      const normalized = normalizeOrder(incomingOrder);
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
            const updated = [normalized, ...prev.filter(o => o.id !== normalized.id)];
            try {
              localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(updated));
              if (merchantStore?.id) {
                localStorage.setItem(`marketsaas_${merchantStore.id}_orders`, JSON.stringify(updated));
              }
            } catch (e) {}
            return updated;
          }
          return prev;
        });
      }
    };

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('marketsaas_orders_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_ORDER' && event.data?.order) {
            handleCrossTabOrder(event.data.order);
          }
        };
      }
    } catch (e) {}

    const handleStorageEvent = (e) => {
      if (e.key === 'marketsaas_last_order_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.order) {
            handleCrossTabOrder(parsed.order);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (bc) {
        try { bc.close(); } catch (err) {}
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [tenantSlug, merchantStore?.id, currentUser?.id]);

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

                const effectiveSchedule = normalizeStoreSchedule(
                  (isCurrentOwner && storeConfig && (tenantSlug === rs.id || tenantSlug === rs.tenant_id))
                    ? storeConfig.schedule
                    : (conf.schedule || rs.schedule || initialStoreConfig.schedule)
                );

                const targetConf = (isCurrentOwner && storeConfig && (tenantSlug === rs.id || tenantSlug === rs.tenant_id))
                  ? storeConfig
                  : { 
                      ...conf, 
                      schedule: effectiveSchedule,
                      storeOpenMode: conf.storeOpenMode || rs.store_open_mode || 'auto',
                      isOpen: rs.is_open !== false && conf.isOpen !== false 
                    };
                const openStatusCalc = calculateStoreOpenStatus(targetConf);
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
                  zone: (isCurrentOwner && storeConfig?.zone)
                    ? storeConfig.zone
                    : (conf.zone || 'Santa Cruz'),
                  reference: (isCurrentOwner && storeConfig?.reference !== undefined)
                    ? storeConfig.reference
                    : (conf.reference || ''),
                  distance: `A ${(idx + 1) * 180}m`,
                  distanceMeters: (idx + 1) * 180,
                  reviewsCount: 24 + idx * 8,
                  ordersCount: 24 + idx * 8,
                  isOpen: openStatusCalc.isOpen,
                  statusBadge: openStatusCalc.statusBadge,
                  schedule: effectiveSchedule,
                  storeOpenMode: targetConf.storeOpenMode,
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
                isProStore: isCurrentOwner 
                  ? Boolean(isProPlan || String(storeConfig?.subscription?.plan || '').toLowerCase().includes('pro'))
                  : Boolean(String(conf.subscription?.plan || rs.subscription?.plan || '').toLowerCase().includes('pro')),
                plan: isCurrentOwner ? (storeConfig?.subscription?.plan || (isProPlan ? 'pro' : 'basic')) : (conf.subscription?.plan || rs.subscription?.plan || 'basic'),
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
  }, [currentUser, tenantSlug, storeConfig, isProPlan]);

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
            zone: storeConfig.zone || s.zone || 'Santa Cruz',
            reference: storeConfig.reference !== undefined ? storeConfig.reference : s.reference,
            isOpen: calculateStoreOpenStatus(storeConfig).isOpen,
            statusBadge: calculateStoreOpenStatus(storeConfig).statusBadge,
            schedule: storeConfig.schedule,
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
      const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
      localStorage.setItem(`marketsaas_${activeSlug}_suppliers`, JSON.stringify(suppliers));
      localStorage.setItem(`marketsaas_${activeSlug}_suppliers_initialized`, 'true');
      if (activeSlug === 'minimarket-ian' || activeSlug === 'tiendita-fernando' || activeSlug === 'default') {
        localStorage.setItem('marketsaas_default_suppliers', JSON.stringify(suppliers));
        localStorage.setItem('marketsaas_minimarket-ian_suppliers', JSON.stringify(suppliers));
        localStorage.setItem('marketsaas_tiendita-fernando_suppliers', JSON.stringify(suppliers));
      }
      // Backup en Supabase store_config para persistencia permanente en la nube
      if (supabase && activeSlug && activeSlug !== 'default' && Array.isArray(suppliers)) {
        const timer = setTimeout(() => {
          supabase.from('store_config')
            .update({ config: { ...storeConfig, suppliersBackup: suppliers } })
            .eq('id', activeSlug)
            .then(() => {})
            .catch(() => {});
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, [suppliers, tenantSlug, merchantStore?.id, storeConfig]);

  useEffect(() => {
    try {
      const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
      localStorage.setItem(`marketsaas_${activeSlug}_supplier_categories`, JSON.stringify(supplierCategories));
      if (activeSlug === 'minimarket-ian' || activeSlug === 'tiendita-fernando' || activeSlug === 'default') {
        localStorage.setItem('marketsaas_default_supplier_categories', JSON.stringify(supplierCategories));
        localStorage.setItem('marketsaas_minimarket-ian_supplier_categories', JSON.stringify(supplierCategories));
        localStorage.setItem('marketsaas_tiendita-fernando_supplier_categories', JSON.stringify(supplierCategories));
      }
    } catch (e) {}
  }, [supplierCategories, tenantSlug, merchantStore?.id]);

  useEffect(() => {
    try {
      const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
      localStorage.setItem(`marketsaas_${activeSlug}_credits`, JSON.stringify(creditCustomers));
      localStorage.setItem(`marketsaas_${activeSlug}_credits_initialized`, 'true');
      if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
        localStorage.setItem('marketsaas_default_credits', JSON.stringify(creditCustomers));
        localStorage.setItem('marketsaas_matias-tiendatodo_credits', JSON.stringify(creditCustomers));
      }
      // Backup en Supabase store_config para persistencia permanente en la nube
      if (supabase && activeSlug && activeSlug !== 'default' && Array.isArray(creditCustomers)) {
        const timer = setTimeout(() => {
          supabase.from('store_config')
            .update({ config: { ...storeConfig, creditsBackup: creditCustomers } })
            .eq('id', activeSlug)
            .then(() => {})
            .catch(() => {});
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, [creditCustomers, tenantSlug, merchantStore?.id, storeConfig]);

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

  // Lista de códigos de activación (Persistencia en nube y fallback en localStorage para SuperAdmin)
  const [subscriptionCodes, setSubscriptionCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('marketsaas_subscription_codes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const fetchSubscriptionCodes = async () => {
    if (!supabase || !isSuperAdminUser(currentUser)) return;
    try {
      const { data, error } = await supabase
        .from('subscription_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const normalized = data.map(c => ({
          ...c,
          plan_type: c.plan_type || (String(c.plan_name || '').toLowerCase().includes('pro') ? 'pro' : 'basic')
        }));
        setSubscriptionCodes(normalized);
        try {
          localStorage.setItem('marketsaas_subscription_codes', JSON.stringify(normalized));
        } catch {}
      } else if (error) {
        console.warn('Aviso cargando subscription_codes de Supabase:', error);
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
  }, [currentUser, fetchSubscriptionCodes]);

  // Validación reactiva de si la suscripción de la tienda actual está activa
  const isSubscriptionActive = useMemo(() => {
    const expiresAt = storeConfig?.subscription?.subscriptionExpiresAt || storeConfig?.subscription?.trialEndsAt;
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() > currentTick;
  }, [storeConfig?.subscription?.subscriptionExpiresAt, storeConfig?.subscription?.trialEndsAt, currentTick]);

  // Tipo de plan activo: 'trial' | 'basic' | 'pro' | 'expired'
  const activePlanType = useMemo(() => {
    if (!isSubscriptionActive) return 'expired';
    return resolveActivePlanType(storeConfig?.subscription, currentTick);
  }, [isSubscriptionActive, storeConfig?.subscription, currentTick]);

  // Flag booleano de alta conveniencia para componentes
  const isProPlan = useMemo(() => {
    return isSubscriptionActive && activePlanType === 'pro';
  }, [isSubscriptionActive, activePlanType]);

  // Función de consulta rápida de permisos por funcionalidad
  const canAccessFeature = useCallback((featureKey) => {
    return isFeatureAllowedForPlan(featureKey, activePlanType);
  }, [activePlanType]);

  // Nombre legible del plan activo
  const activePlanName = useMemo(() => {
    if (!isSubscriptionActive) return 'Suscripción Vencida';
    if (activePlanType === 'pro') return 'Plan PRO (Bs. 129)';
    if (activePlanType === 'trial') return 'Prueba Gratuita (15 Días)';
    return 'Plan Básico (Bs. 75)';
  }, [isSubscriptionActive, activePlanType]);

  // Tiempo restante de la suscripción (días, horas, minutos, segundos)
  const subscriptionTimeRemaining = useMemo(() => {
    const expiresAt = storeConfig?.subscription?.subscriptionExpiresAt || storeConfig?.subscription?.trialEndsAt;
    return calculateSubscriptionTimeRemaining(expiresAt, currentTick);
  }, [storeConfig?.subscription?.subscriptionExpiresAt, storeConfig?.subscription?.trialEndsAt, currentTick]);

  // Generar códigos de suscripción (uno o por lotes) con persistencia estricta en Supabase
  const generateSubscriptionCodes = async ({ count = 1, durationDays = 0, durationMinutes = 0, planName = '', planType = 'basic', notes = '' }) => {
    const newCodes = [];
    const nowIso = new Date().toISOString();
    const cleanPlanType = planType === 'pro' ? 'pro' : 'basic';
    const effectivePlanName = planName || (cleanPlanType === 'pro' ? 'Plan PRO' : 'Plan Básico');

    for (let i = 0; i < count; i++) {
      newCodes.push({
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : undefined,
        code: generateCleanCode(),
        duration_days: Number(durationDays) || 0,
        duration_minutes: Number(durationMinutes) || 0,
        plan_name: effectivePlanName,
        plan_type: cleanPlanType,
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
        // 1. Intento principal con columna plan_type
        let { error } = await supabase.from('subscription_codes').insert(newCodes);

        // Si la tabla remota en Supabase aún no tiene la columna plan_type (error PGRST204)
        if (error && (error.code === 'PGRST204' || String(error.message || '').includes('plan_type'))) {
          console.warn('Columna plan_type no detectada en Supabase, reintentando inserción con payload compatible (plan_name)...');
          const compatibleCodes = newCodes.map(({ plan_type, ...rest }) => rest);
          const retryRes = await supabase.from('subscription_codes').insert(compatibleCodes);
          error = retryRes.error;
        }

        if (error) {
          console.error('Error persistiendo códigos en Supabase:', error);
          showToast(`Error al guardar en Supabase: ${error.message}`, 'error');
          // Guardar de respaldo local para no perder el código generado en la vista
          const updated = [...newCodes, ...subscriptionCodes];
          setSubscriptionCodes(updated);
          try {
            localStorage.setItem('marketsaas_subscription_codes', JSON.stringify(updated));
          } catch {}
          return newCodes;
        }
      } catch (err) {
        console.error('Excepción guardando códigos en Supabase:', err);
        showToast(`Error de conexión con la base de datos: ${err.message}`, 'error');
      }
    }

    const updated = [...newCodes, ...subscriptionCodes];
    setSubscriptionCodes(updated);
    try {
      localStorage.setItem('marketsaas_subscription_codes', JSON.stringify(updated));
    } catch {}

    const planLabel = cleanPlanType === 'pro' ? 'Plan PRO ⭐' : 'Plan Básico';
    showToast(`¡Se ${count === 1 ? `generó y guardó 1 código para ${planLabel}` : `generaron y guardaron ${count} códigos para ${planLabel}`} con éxito!`, 'success');
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
    const updated = subscriptionCodes.filter(c => c.id !== codeId);
    setSubscriptionCodes(updated);
    try {
      localStorage.setItem('marketsaas_subscription_codes', JSON.stringify(updated));
    } catch {}
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
          const cleanPlanType = rpcRes.plan_type || (String(rpcRes.plan_name || '').toLowerCase().includes('pro') ? 'pro' : 'basic');
          const effectivePlanName = rpcRes.plan_name || (cleanPlanType === 'pro' ? 'Plan PRO' : 'Plan Básico');

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
            planName: effectivePlanName,
            planType: cleanPlanType,
            durationMinutes: totalMinutesToAdd,
            durationDays: days,
            redeemedAt: nowIso
          };

          const updatedSubscription = {
            status: 'active',
            trialStartedAt: storeConfig?.subscription?.trialStartedAt || nowIso,
            trialEndsAt: storeConfig?.subscription?.trialEndsAt || nowIso,
            subscriptionExpiresAt: newExpiresAt.toISOString(),
            plan: effectivePlanName,
            planType: cleanPlanType,
            history: [newHistoryItem, ...(storeConfig?.subscription?.history || [])]
          };

          await setStoreConfig({ 
            ...storeConfig, 
            subscription: updatedSubscription,
            isProStore: cleanPlanType === 'pro',
            plan: cleanPlanType === 'pro' ? 'pro' : 'basic'
          });

          // Actualizar estado en memoria y persistencia local del canje
          setSubscriptionCodes(prev => {
            const updated = prev.map(c => c.code?.toUpperCase() === clean ? { 
              ...c, 
              status: 'redeemed', 
              redeemed_at: nowIso, 
              redeemed_by_store_id: tenantSlug, 
              redeemed_by_store_name: storeConfig?.name || 'Mi Tienda', 
              redeemed_by_email: currentUser?.email 
            } : c);
            try {
              localStorage.setItem('marketsaas_subscription_codes', JSON.stringify(updated));
            } catch {}
            return updated;
          });

          triggerConfetti();
          const durationText = days > 0 ? `${days} día(s)` : `${totalMinutesToAdd} minuto(s)`;
          const planBadge = cleanPlanType === 'pro' ? 'Plan PRO ⭐' : 'Plan Básico';
          showToast(`¡Código canjeado con éxito! Se activó ${planBadge} (+${durationText}).`, 'success');
          return { success: true, newExpiresAt: newExpiresAt.toISOString(), durationText, planType: cleanPlanType };
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

    // Calcular minutos a sumar
    const days = Number(targetCode.duration_days) || 0;
    const mins = Number(targetCode.duration_minutes) || 0;
    let totalMinutesToAdd = (days * 1440) + mins;
    if (totalMinutesToAdd <= 0) {
      totalMinutesToAdd = 43200; // Por defecto 30 días
    }

    const cleanPlanType = targetCode.plan_type || (String(targetCode.plan_name || '').toLowerCase().includes('pro') ? 'pro' : 'basic');
    const effectivePlanName = targetCode.plan_name || (cleanPlanType === 'pro' ? 'Plan PRO' : 'Plan Básico');

    // Extender fecha de expiración
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
      planName: effectivePlanName,
      planType: cleanPlanType,
      durationMinutes: totalMinutesToAdd,
      durationDays: days,
      redeemedAt: nowIso
    };

    const updatedSubscription = {
      status: 'active',
      trialStartedAt: storeConfig?.subscription?.trialStartedAt || nowIso,
      trialEndsAt: storeConfig?.subscription?.trialEndsAt || nowIso,
      subscriptionExpiresAt: newExpiresAt.toISOString(),
      plan: effectivePlanName,
      planType: cleanPlanType,
      history: [newHistoryItem, ...(storeConfig?.subscription?.history || [])]
    };

    // Actualizar storeConfig
    const updatedStoreConfig = {
      ...storeConfig,
      subscription: updatedSubscription,
      isProStore: cleanPlanType === 'pro',
      plan: cleanPlanType === 'pro' ? 'pro' : 'basic'
    };
    await setStoreConfig(updatedStoreConfig);

    // Marcar código como canjeado en base de datos
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

    setSubscriptionCodes(prev => {
      const updated = prev.map(c => c.id === targetCode.id ? { ...c, ...redeemedPayload } : c);
      try {
        localStorage.setItem('marketsaas_subscription_codes', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    triggerConfetti();
    const durationText = days > 0 ? `${days} día(s)` : `${mins} minuto(s)`;
    const planBadge = cleanPlanType === 'pro' ? 'Plan PRO ⭐' : 'Plan Básico';
    showToast(`¡Código canjeado con éxito! Se activó ${planBadge} (+${durationText}).`, 'success');

    return { success: true, newExpiresAt: newExpiresAt.toISOString(), durationText, planType: cleanPlanType };
  };

  // Inyección / extensión directa de tiempo a cualquier tienda (SuperAdmin), permitiendo definir o promover plan (basic / pro)
  const addStoreSubscriptionTime = async (storeId, minutesToAdd, targetPlanType = null) => {
    if (!storeId || !minutesToAdd) return;
    const now = new Date();
    let newExpiresAtIso = null;

    const resolvePlanUpdates = (prevSub) => {
      if (!targetPlanType) return {};
      const isTargetPro = targetPlanType === 'pro';
      return {
        planType: isTargetPro ? 'pro' : 'basic',
        plan: isTargetPro ? 'Plan PRO' : 'Plan Básico'
      };
    };

    if (storeId === tenantSlug) {
      const currentExp = storeConfig?.subscription?.subscriptionExpiresAt || storeConfig?.subscription?.trialEndsAt;
      let baseTime = now.getTime();
      if (currentExp) {
        const expTime = new Date(currentExp).getTime();
        if (expTime > baseTime) baseTime = expTime;
      }
      const newExpiresAt = new Date(baseTime + minutesToAdd * 60 * 1000);
      newExpiresAtIso = newExpiresAt.toISOString();
      const updatedSub = {
        ...(storeConfig.subscription || createDefaultSubscription()),
        status: 'active',
        subscriptionExpiresAt: newExpiresAtIso,
        ...resolvePlanUpdates(storeConfig?.subscription)
      };
      await setStoreConfig({ 
        ...storeConfig, 
        subscription: updatedSub,
        ...(targetPlanType ? { isProStore: targetPlanType === 'pro', plan: targetPlanType === 'pro' ? 'pro' : 'basic' } : {})
      });
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
          newExpiresAtIso = newExpiresAt.toISOString();
          const updatedSub = {
            ...(cfg.subscription || createDefaultSubscription()),
            status: 'active',
            subscriptionExpiresAt: newExpiresAtIso,
            ...resolvePlanUpdates(cfg.subscription)
          };
          const updatedCfg = { 
            ...cfg, 
            subscription: updatedSub,
            ...(targetPlanType ? { isProStore: targetPlanType === 'pro', plan: targetPlanType === 'pro' ? 'pro' : 'basic' } : {})
          };
          await supabase.from('store_config').update({ config: updatedCfg, updated_at: now.toISOString() }).eq('id', storeId);
        }
      } catch (e) {
        console.warn('Error añadiendo tiempo a tienda en Supabase:', e);
      }
    }

    if (!newExpiresAtIso) {
      const targetStore = stores.find(s => s.slug === storeId || s.id === storeId);
      const currentExp = targetStore?.subscription?.subscriptionExpiresAt || targetStore?.subscription?.trialEndsAt;
      let baseTime = now.getTime();
      if (currentExp && new Date(currentExp).getTime() > baseTime) {
        baseTime = new Date(currentExp).getTime();
      }
      newExpiresAtIso = new Date(baseTime + minutesToAdd * 60 * 1000).toISOString();
    }

    // Actualizar reactivamente la tienda en el estado stores en memoria
    setStores(prev => prev.map(s => {
      if (s.slug === storeId || s.id === storeId) {
        const prevSub = s.subscription || createDefaultSubscription();
        return {
          ...s,
          isProStore: targetPlanType ? targetPlanType === 'pro' : s.isProStore,
          plan: targetPlanType ? (targetPlanType === 'pro' ? 'pro' : 'basic') : s.plan,
          subscription: {
            ...prevSub,
            status: 'active',
            subscriptionExpiresAt: newExpiresAtIso,
            ...resolvePlanUpdates(prevSub)
          }
        };
      }
      return s;
    }));

    showToast(`¡Se sumaron ${minutesToAdd >= 1440 ? `${Math.round(minutesToAdd / 1440)} día(s)` : `${minutesToAdd} minuto(s)`} a "${storeId}"!`, 'success');
  };

  // Suspender / Expirar suscripción inmediatamente a cualquier tienda (SuperAdmin)
  const suspendStoreSubscription = async (storeId) => {
    if (!storeId) return;
    const pastIso = new Date(Date.now() - 60 * 1000).toISOString();

    if (storeId === tenantSlug) {
      const updatedSub = {
        ...(storeConfig.subscription || createDefaultSubscription()),
        status: 'expired',
        subscriptionExpiresAt: pastIso
      };
      await setStoreConfig({ ...storeConfig, subscription: updatedSub });
    }

    if (supabase) {
      try {
        const { data } = await supabase.from('store_config').select('*').eq('id', storeId).maybeSingle();
        if (data) {
          const cfg = data.config || data;
          const updatedSub = {
            ...(cfg.subscription || createDefaultSubscription()),
            status: 'expired',
            subscriptionExpiresAt: pastIso
          };
          await supabase.from('store_config').update({ config: { ...cfg, subscription: updatedSub }, updated_at: new Date().toISOString() }).eq('id', storeId);
        }
      } catch (e) {
        console.warn('Error suspendiendo suscripción en Supabase:', e);
      }
    }

    setStores(prev => prev.map(s => {
      if (s.slug === storeId || s.id === storeId) {
        return {
          ...s,
          subscription: {
            ...(s.subscription || createDefaultSubscription()),
            status: 'expired',
            subscriptionExpiresAt: pastIso
          }
        };
      }
      return s;
    }));

    showToast(`Suscripción de "${storeId}" suspendida/vencida.`, 'info');
  };

  // Modo Soporte SuperAdmin: Acceder e Impersonar una tienda
  const impersonateStore = (storeSlugOrId) => {
    if (!isSuperAdminUser(currentUser)) {
      showToast('Acceso denegado: Se requieren permisos legítimos de SuperAdmin.', 'error');
      return;
    }
    const targetStore = (stores || []).find(s => s.slug === storeSlugOrId || s.id === storeSlugOrId);
    if (targetStore) {
      setMerchantStore(targetStore);
    } else {
      setMerchantStore({
        id: storeSlugOrId,
        slug: storeSlugOrId,
        name: storeConfig?.name || storeSlugOrId
      });
    }
    goToStore(storeSlugOrId);
    setIsImpersonating(true);
    try {
      localStorage.setItem('marketsaas_is_impersonating', 'true');
    } catch (e) {}
    setViewModeState('admin');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('marketsaas_active_view_mode', 'admin');
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'admin');
        url.searchParams.set('store', storeSlugOrId);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }
    showToast(`Ingresando a "${storeSlugOrId}" en modo Soporte SuperAdmin.`, 'info');
  };

  // Salir del modo Soporte SuperAdmin y volver al Panel Maestro
  const stopImpersonating = () => {
    setIsImpersonating(false);
    setMerchantStore(null);
    try {
      localStorage.removeItem('marketsaas_is_impersonating');
    } catch (e) {}
    setViewModeState('superadmin');
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('marketsaas_active_view_mode', 'superadmin');
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'superadmin');
        url.searchParams.delete('store');
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }
    showToast('Regresando al Panel Maestro SuperAdmin.', 'info');
  };

  // Guardar y publicar anuncio / difusión global para comerciantes
  const saveSystemBroadcast = async (broadcastData) => {
    const updated = {
      active: Boolean(broadcastData.active),
      message: (broadcastData.message || '').trim(),
      type: broadcastData.type || 'info',
      link: (broadcastData.link || '').trim(),
      linkText: (broadcastData.linkText || '').trim(),
      updatedAt: new Date().toISOString()
    };
    setSystemBroadcast(updated);
    try {
      localStorage.setItem('marketsaas_system_broadcast', JSON.stringify(updated));
    } catch (e) {}

    showToast(updated.active ? '¡Aviso global publicado para todas las tiendas!' : 'Aviso global desactivado.', 'success');
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

  // Tarifa de delivery calculada por distancia (motodelivery) y condición climática (lluvia)
  const isDeliveryEnabled = storeConfig?.enableDelivery !== false;

  // Coordenadas geográficas de la tienda
  const storeLat = (storeConfig?.latitude !== '' && storeConfig?.latitude != null)
    ? parseFloat(storeConfig.latitude)
    : (storeConfig?.googleMapsCoordinates?.lat != null ? parseFloat(storeConfig.googleMapsCoordinates.lat) : null);
  const storeLng = (storeConfig?.longitude !== '' && storeConfig?.longitude != null)
    ? parseFloat(storeConfig.longitude)
    : (storeConfig?.googleMapsCoordinates?.lng != null ? parseFloat(storeConfig.googleMapsCoordinates.lng) : null);

  // Coordenadas geográficas del cliente (desde GPS o marcador en mapa)
  const clientLat = selectedLocation?.latitude != null ? parseFloat(selectedLocation.latitude) : null;
  const clientLng = selectedLocation?.longitude != null ? parseFloat(selectedLocation.longitude) : null;

  // Distancia calculada en kilómetros (Haversine)
  const currentDistanceKm = useMemo(() => {
    if (storeLat != null && storeLng != null && clientLat != null && clientLng != null) {
      return calculateDistanceKm(storeLat, storeLng, clientLat, clientLng);
    }
    if (selectedLocation?.distanceKm != null) {
      return parseFloat(selectedLocation.distanceKm);
    }
    return null;
  }, [storeLat, storeLng, clientLat, clientLng, selectedLocation?.distanceKm]);

  // Cotización detallada de tarifa según kilometraje y lluvia
  const deliveryCalculation = useMemo(() => {
    return calculateDeliveryFee(currentDistanceKm, {
      isRaining: Boolean(storeConfig?.isRainActive)
    });
  }, [currentDistanceKm, storeConfig?.isRainActive]);

  // Monto mínimo requerido de pedido para delivery fijado por el comerciante
  const minDeliveryOrder = parseFloat(storeConfig?.minDeliveryOrder ?? storeConfig?.minOrder ?? 0) || 0;
  const isBelowMinDeliveryOrder = isDeliveryEnabled && minDeliveryOrder > 0 && cartSubtotal < minDeliveryOrder;
  const missingToMinDeliveryOrder = Math.max(0, Math.round((minDeliveryOrder - cartSubtotal) * 100) / 100);

  // Verificación de envío gratuito por umbral de compra si la tienda lo activa
  const isFreeDelivery = !isDeliveryEnabled || (storeConfig?.freeDeliveryThreshold > 0 && cartSubtotal >= storeConfig.freeDeliveryThreshold);

  // Tarifa final efectiva aplicada al pedido
  const actualDeliveryFee = (!isDeliveryEnabled || isFreeDelivery || !deliveryCalculation.isWithinRange)
    ? 0
    : deliveryCalculation.fee;

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

    const resolvedOwnerId = storeConfig?.owner_id || 
      merchantStore?.owner_id || 
      stores?.find(s => s.slug === tenantSlug || s.id === tenantSlug)?.owner_id || 
      null;

    const deliveryFeeValue = orderData.deliveryType === 'delivery' 
      ? (orderData.deliveryFee != null ? Number(orderData.deliveryFee) : actualDeliveryFee) 
      : 0;

    const distanceKmValue = orderData.deliveryType === 'delivery' 
      ? (orderData.distanceKm != null ? Number(orderData.distanceKm) : currentDistanceKm) 
      : 0;

    const isRainSurchargeValue = orderData.deliveryType === 'delivery' 
      ? Boolean(storeConfig?.isRainActive) 
      : false;

    const isCombinedOrder = orderData.paymentMethod === 'combined';
    const validatedCustomerSplit = isCombinedOrder 
      ? normalizeSplitPayment(orderData.splitPayment, Math.max(0, cartSubtotal - discountAmount))
      : null;

    const dbPayload = {
      id: orderId,
      tenant_id: tenantSlug,
      owner_id: resolvedOwnerId,
      customer: {
        name: orderData.name || 'Cliente',
        phone: orderData.phone || '',
        address: orderData.address || '',
        reference: orderData.reference || '',
        coordinates: orderData.coordinates || (orderData.latitude && orderData.longitude ? { lat: orderData.latitude, lng: orderData.longitude } : null),
        notes: orderData.notes || '',
        distance_km: distanceKmValue,
        is_rain_surcharge: isRainSurchargeValue,
        ...(isCombinedOrder && validatedCustomerSplit ? { split_payment: validatedCustomerSplit, splitPayment: validatedCustomerSplit } : {})
      },
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: cartSubtotal,
      discount: discountAmount,
      delivery_fee: deliveryFeeValue,
      delivery_type: orderData.deliveryType || 'pickup',
      total: orderData.deliveryType === 'delivery' 
        ? Math.max(0, cartSubtotal + deliveryFeeValue - discountAmount) 
        : Math.max(0, cartSubtotal - discountAmount),
      status: 'pending',
      payment_method: isCombinedOrder
        ? { method: 'combined', splitPayment: validatedCustomerSplit }
        : orderData.cashChangeFor 
          ? { method: orderData.paymentMethod, cashChangeFor: orderData.cashChangeFor }
          : { method: orderData.paymentMethod },
      split_payment: validatedCustomerSplit,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      created_at: new Date().toISOString()
    };

    const newOrder = normalizeOrder({
      ...dbPayload,
      deliveryFee: deliveryFeeValue,
      deliveryType: dbPayload.delivery_type,
      distance_km: distanceKmValue,
      distanceKm: distanceKmValue,
      is_rain_surcharge: isRainSurchargeValue,
      isRainSurcharge: isRainSurchargeValue,
      paymentMethod: orderData.paymentMethod,
      splitPayment: validatedCustomerSplit,
      split_payment: validatedCustomerSplit,
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
      localStorage.setItem('marketsaas_last_order_event', JSON.stringify({ order: newOrder, timestamp: Date.now() }));
    } catch (e) {}

    // Difusión multi-canal para notificaciones en tiempo real
    // A) Evento en ventana actual
    try {
      window.dispatchEvent(new CustomEvent('marketsaas:new_order', { detail: newOrder }));
    } catch (e) {}

    // B) BroadcastChannel nativo del navegador (pestañas abiertas en el mismo dispositivo)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('marketsaas_orders_channel');
        bc.postMessage({ type: 'NEW_ORDER', order: newOrder, tenantId: tenantSlug });
        bc.close();
      }
    } catch (e) {}

    // Descontar inventario de forma inmediata y reactiva en memoria y localStorage (Pedido Vecino)
    setProducts(prevProds => {
      let changed = false;
      const updated = prevProds.map(p => {
        const cartItem = cart.find(ci => ci.id === p.id);
        if (cartItem && p.stock !== 'Sin definir' && p.stock != null) {
          const curStock = typeof p.stock === 'number' ? p.stock : parseInt(p.stock, 10);
          if (!isNaN(curStock)) {
            changed = true;
            const newStock = Math.max(0, curStock - (Number(cartItem.quantity) || 1));
            return { ...p, stock: newStock };
          }
        }
        return p;
      });

      if (changed) {
        try {
          localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(updated));
          if (tenantSlug === 'matias-tiendatodo') {
            localStorage.setItem('marketsaas_default_products', JSON.stringify(updated));
          }
        } catch (e) {}
      }
      return changed ? updated : prevProds;
    });

    if (supabase) {
      // C) WebSocket Broadcast a través de Supabase Realtime a otros dispositivos (celular o PC del dueño)
      try {
        const rtChannel = supabase.channel(`public:orders:${tenantSlug || 'all'}`);
        rtChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            rtChannel.send({
              type: 'broadcast',
              event: 'new_order',
              payload: newOrder
            }).then(() => {
              setTimeout(() => {
                try { supabase.removeChannel(rtChannel); } catch (e) {}
              }, 2000);
            });
          }
        });
      } catch (e) {}

      supabase.from('orders').insert([dbPayload]).then(({ error }) => {
        if (error) {
          if (error.code === '42703' || error.message?.includes('split_payment')) {
            const { split_payment, ...safePayload } = dbPayload;
            supabase.from('orders').insert([safePayload]).then(({ error: retryErr }) => {
              if (retryErr) {
                console.error('Error insertando pedido en Supabase (reintento seguro):', retryErr);
              } else {
                console.log('Pedido insertado con éxito en Supabase (modo compatible):', orderId);
              }
            });
          } else {
            console.error('Error insertando pedido en Supabase:', error);
          }
        } else {
          console.log('Pedido insertado con éxito en Supabase:', orderId);
        }
      });

      // Descontar inventario de forma atómica y persistente en Supabase (Previene condiciones de carrera con múltiples usuarios)
      cart.forEach(item => {
        const currentProd = products.find(p => p.id === item.id);
        const curStock = currentProd && currentProd.stock !== 'Sin definir' && currentProd.stock != null
          ? (typeof currentProd.stock === 'number' ? currentProd.stock : parseInt(currentProd.stock, 10))
          : (typeof item.stock === 'number' ? item.stock : parseInt(item.stock, 10));

        if (!isNaN(curStock)) {
          const newStock = Math.max(0, curStock - (Number(item.quantity) || 1));
          supabase.rpc('decrement_stock', { product_id: item.id, quantity: Number(item.quantity) || 1 })
            .then(({ error }) => {
              if (error) {
                // Fallback de contingencia si la función RPC aún no estuviese presente
                supabase.from('products').update({ stock: String(newStock), updated_at: new Date().toISOString() }).eq('id', item.id).then();
              }
            });
        }
      });
    }

    // Limpiar carrito y abrir tracking
    clearCart();
    addNeighborOrderId(orderId);
    setActiveTrackingOrderId(orderId);
    setIsTrackingModalOpen(true);
    triggerConfetti();
    showToast(`¡Pedido ${orderId} recibido con éxito! La tienda ya lo está preparando.`, 'success');

    return newOrder;
  };

  // Actualizar estado de pedido (Dueño legítimo o SuperAdmin)
  const updateOrderStatus = (orderId, newStatus) => {
    if (!currentUser && !isImpersonating) {
      showToast('Acceso denegado: Solo el comerciante titular puede cambiar el estado de un pedido.', 'error');
      return;
    }
    const targetOrder = orders.find(ord => ord.id === orderId);
    const nowIso = new Date().toISOString();

    setOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { 
        ...ord, 
        status: newStatus,
        updatedAt: nowIso,
        deliveredAt: newStatus === 'delivered' ? nowIso : ord.deliveredAt
      } : ord))
    );
    if (supabase) {
      const updatePayload = { status: newStatus };
      supabase.from('orders').update(updatePayload).eq('id', orderId).then(({ error }) => {
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

  // Omitir o descartar pedido (eliminación suave que preserva auditoría en Feed de Actividad)
  const deleteOrder = (orderId) => {
    if (!currentUser && !isImpersonating) {
      showToast('Acceso denegado: Solo el comerciante titular puede eliminar o descartar pedidos.', 'error');
      return;
    }
    const targetOrder = orders.find(ord => ord.id === orderId);
    const nowIso = new Date().toISOString();

    // Revertir inventario si el pedido no estaba cancelado/omitido previamente
    if (targetOrder && targetOrder.status !== 'cancelled' && targetOrder.status !== 'omitted' && Array.isArray(targetOrder.items)) {
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

    setOrders(prev => {
      const updated = prev.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'omitted',
            is_deleted: true,
            isDeleted: true,
            deleted_at: nowIso,
            deletedAt: nowIso
          };
        }
        return ord;
      });
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

    if (supabase) {
      supabase.from('orders').update({
        status: 'omitted',
        deleted_at: nowIso
      }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error marcando pedido como omitido en Supabase:', error);
      });
    }
    showToast(`Pedido #${orderId} omitido/descartado. Registrado en el Feed de Actividad.`, 'info');
  };

  // Restaurar pedido omitido / cancelado
  const restoreOrder = (orderId) => {
    if (!currentUser && !isImpersonating) {
      showToast('Acceso denegado: Solo el comerciante titular puede restaurar pedidos.', 'error');
      return;
    }
    const targetOrder = orders.find(ord => ord.id === orderId);
    const restoredStatus = (targetOrder?.deliveryType === 'pickup' && (targetOrder?.customer?.name?.includes('Mostrador') || targetOrder?.customer?.name?.includes('Presencial')))
      ? 'delivered'
      : 'pending';

    setOrders(prev => {
      const updated = prev.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: restoredStatus,
            is_deleted: false,
            isDeleted: false,
            deleted_at: null,
            deletedAt: null
          };
        }
        return ord;
      });
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(updated));
        localStorage.setItem('marketsaas_default_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (supabase) {
      supabase.from('orders').update({
        status: restoredStatus,
        deleted_at: null
      }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error restaurando pedido en Supabase:', error);
      });
    }
    showToast(`Pedido #${orderId} restaurado al tablero de pedidos.`, 'success');
  };

  // Eliminar definitivamente de la base de datos (Purga permanente)
  const purgeOrderPermanently = (orderId) => {
    if (!currentUser && !isImpersonating) {
      showToast('Acceso denegado: Solo el comerciante titular puede purgar pedidos.', 'error');
      return;
    }
    setOrders(prev => {
      const filtered = prev.filter(ord => ord.id !== orderId);
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(filtered));
        localStorage.setItem('marketsaas_default_orders', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
    if (supabase) {
      supabase.from('orders').delete().eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error purgando pedido en Supabase:', error);
      });
    }
    showToast(`Pedido #${orderId} eliminado definitivamente del sistema.`, 'info');
  };

  // Crear o Editar Producto (Dueño) con persistencia garantizada en Nube y Local
  const saveProduct = async (productData, options = {}) => {
    const canManage = Boolean(currentUser || isImpersonating || merchantStore?.id || tenantSlug);
    if (!canManage) {
      showToast('Acceso denegado: Debes iniciar sesión como dueño para modificar productos.', 'error');
      return { success: false, error: 'Unauthorized' };
    }
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

    // Registro sanitizado canónico conteniendo estrictamente columnas reales de la tabla 'products' de Supabase
    const cleanDbRecord = {
      id: prodId,
      tenant_id: tenantSlug,
      name: productData.name?.trim() || 'Producto Sin Nombre',
      category: productData.category?.trim() || 'Sin definir',
      price: numPrice,
      original_price: origPrice,
      cost_price: String(costVal),
      unit: productData.unit?.trim() || 'Sin definir',
      stock: stockVal,
      min_stock: String(minStockVal),
      image: cleanImage,
      badge: productData.badge?.trim() || '',
      code: resolvedCode,
      description: productData.description?.trim() || 'Sin definir',
      is_popular: isPop,
      is_active: isAct,
      updated_at: new Date().toISOString()
    };
    if (productData.supplierId || productData.supplier_id) {
      cleanDbRecord.supplier_id = String(productData.supplierId || productData.supplier_id);
    }

    const normalizedProd = normalizeProduct({
      ...cleanDbRecord,
      supplierId: cleanDbRecord.supplier_id || '',
      supplierName: productData.supplierName || productData.supplier_name || '',
      costPrice: costVal,
      minStock: minStockVal,
      originalPrice: origPrice,
      isPopular: isPop,
      isActive: isAct
    });

    // 1. Actualización inmediata en Estado React (Optimistic UI)
    let nextProducts;
    if (isEdit) {
      nextProducts = products.map(p => (p.id === prodId ? { ...p, ...normalizedProd } : p));
      if (!nextProducts.some(p => p.id === prodId)) {
        nextProducts = [normalizedProd, ...nextProducts];
      }
    } else {
      nextProducts = [normalizedProd, ...products];
    }
    setProducts(nextProducts);

    // 2. Persistencia en LocalStorage protegida contra cuota
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(nextProducts));
      if (tenantSlug === 'matias-tiendatodo') {
        localStorage.setItem('marketsaas_default_products', JSON.stringify(nextProducts));
      }
    } catch (lsErr) {
      console.warn('Aviso: Cuota de LocalStorage al guardar producto:', lsErr);
    }

    // 3. Persistencia en Supabase
    if (supabase) {
      try {
        let savedSuccessfully = false;
        let lastError = null;

        // Intentar upsert atómico directo con cleanDbRecord
        const { data: upsertData, error: upsertErr } = await supabase
          .from('products')
          .upsert([cleanDbRecord], { onConflict: 'id' })
          .select();

        if (!upsertErr && upsertData && upsertData.length > 0) {
          savedSuccessfully = true;
        } else {
          lastError = upsertErr;

          // Si falló por columna supplier_id inexistente en Supabase, reintentar sin supplier_id
          if (cleanDbRecord.supplier_id) {
            const noSupplierRecord = { ...cleanDbRecord };
            delete noSupplierRecord.supplier_id;
            const { data: retryData, error: retryErr } = await supabase
              .from('products')
              .upsert([noSupplierRecord], { onConflict: 'id' })
              .select();

            if (!retryErr && retryData && retryData.length > 0) {
              savedSuccessfully = true;
            } else if (retryErr) {
              lastError = retryErr;
            }
          }
        }

        // Si falló por RLS u otra razón, intentar RPC de contingencia si existe
        if (!savedSuccessfully) {
          try {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('save_product_secure', {
              p_product: cleanDbRecord
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
              isEdit ? `Producto "${cleanDbRecord.name}" guardado y sincronizado.` : `Nuevo producto "${cleanDbRecord.name}" creado (${cleanDbRecord.code}).`,
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
        showToast(isEdit ? `Producto "${cleanDbRecord.name}" guardado.` : `Nuevo producto "${cleanDbRecord.name}" creado.`, 'success');
      }
      return { success: true, product: normalizedProd };
    }
  };

  const deleteProduct = async (productId) => {
    if (!currentUser && !isImpersonating) {
      showToast('Acceso denegado: Debes iniciar sesión como dueño para eliminar productos.', 'error');
      return;
    }
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
    if (!currentUser && !isImpersonating) {
      showToast('Acceso denegado: Debes iniciar sesión como dueño para eliminar productos.', 'error');
      return;
    }
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

  // Venta en POS de Mostrador (Dueño) con soporte para Efectivo, QR, Tarjeta, Fiao y Pago Combinado
  const completePosSale = (posItems, paymentType = 'cash', creditOptions = {}, splitPaymentDetails = null) => {
    const subtotal = posItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const saleNum = Math.floor(1000 + Math.random() * 9000);
    const saleEntropy = Math.random().toString(36).substring(2, 6).toUpperCase();
    const saleId = `${tenantSlug}-POS-${saleNum}-${saleEntropy}`;

    // Validación y blindaje estricto de Pago Combinado
    const isCombined = paymentType === 'combined';
    let validatedSplit = null;
    if (isCombined) {
      const validation = validateSplitPayment(splitPaymentDetails, subtotal);
      if (!validation.isValid) {
        showToast(validation.error || 'El desglose del pago combinado no coincide exactamente con el total.', 'error');
        return null;
      }
      validatedSplit = normalizeSplitPayment(splitPaymentDetails, subtotal);
    }

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
    const baseCustomer = isCredit && creditOptions?.customerId ? {
      name: creditOptions.customerName || 'Cliente a Cuenta',
      phone: creditOptions.customerPhone || '',
      address: creditOptions.customerAddress || 'En Tienda (POS)',
      reference: 'Cuenta Corriente',
      notes: ''
    } : {
      name: 'Cliente Mostrador (Venta Rápida)',
      phone: '',
      address: 'En Tienda (POS)',
      reference: 'Mostrador',
      notes: ''
    };

    const customerInfo = {
      ...baseCustomer,
      ...(isCombined && validatedSplit ? { split_payment: validatedSplit, splitPayment: validatedSplit } : {})
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
      payment_method: isCombined
        ? { method: 'combined', splitPayment: validatedSplit }
        : paymentType,
      split_payment: validatedSplit,
      coupon_code: null,
      created_at: nowIso
    };

    const normalizedPosOrder = normalizeOrder({
      ...dbPayload,
      deliveryFee: 0,
      deliveryType: 'pickup',
      paymentMethod: paymentType,
      splitPayment: validatedSplit,
      split_payment: validatedSplit,
      createdAt: nowIso
    });

    // Actualizar estado en memoria y persistir de inmediato en localStorage
    setOrders(prev => {
      const updated = [normalizedPosOrder, ...prev.filter(o => o.id !== normalizedPosOrder.id)];
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(updated));
        if (isOfficialSeedStore(tenantSlug)) {
          localStorage.setItem('marketsaas_default_orders', JSON.stringify(updated));
        }
        if (storeConfig?.tenant_id) {
          localStorage.setItem(`marketsaas_${storeConfig.tenant_id}_orders`, JSON.stringify(updated));
        }
        if (merchantStore?.id && merchantStore.id !== tenantSlug) {
          localStorage.setItem(`marketsaas_${merchantStore.id}_orders`, JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });

    // Descontar inventario de forma inmediata y reactiva en memoria y localStorage (Venta POS)
    setProducts(prevProds => {
      let changed = false;
      const updated = prevProds.map(p => {
        const posItem = posItems.find(pi => pi.id === p.id);
        if (posItem && p.stock !== 'Sin definir' && p.stock != null) {
          const curStock = typeof p.stock === 'number' ? p.stock : parseInt(p.stock, 10);
          if (!isNaN(curStock)) {
            changed = true;
            const newStock = Math.max(0, curStock - (Number(posItem.quantity) || 1));
            return { ...p, stock: newStock };
          }
        }
        return p;
      });

      if (changed) {
        try {
          localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(updated));
          if (tenantSlug === 'matias-tiendatodo') {
            localStorage.setItem('marketsaas_default_products', JSON.stringify(updated));
          }
        } catch (e) {}
      }
      return changed ? updated : prevProds;
    });

    try {
      window.dispatchEvent(new CustomEvent('marketsaas:new_order', { detail: normalizedPosOrder }));
    } catch (e) {}

    // Persistir en Supabase con los nombres de columna canónicos y fallback de resiliencia
    if (supabase && effectiveTenant && effectiveTenant !== 'default') {
      supabase.from('orders').insert([dbPayload]).then(({ error }) => {
        if (error) {
          if (error.code === '42703' || error.message?.includes('split_payment')) {
            const { split_payment, ...safePayload } = dbPayload;
            supabase.from('orders').insert([safePayload]).then();
          } else {
            console.error('Error insertando venta POS en Supabase:', error);
          }
        }
      });

      // Descontar inventario de forma atómica y persistente en Supabase (Previene condiciones de carrera)
      posItems.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        const curStock = prod && prod.stock !== 'Sin definir' && prod.stock != null
          ? (typeof prod.stock === 'number' ? prod.stock : parseInt(prod.stock, 10))
          : (typeof item.stock === 'number' ? item.stock : parseInt(item.stock, 10));

        if (!isNaN(curStock)) {
          const newStock = Math.max(0, curStock - (Number(item.quantity) || 1));
          supabase.rpc('decrement_stock', { product_id: item.id, quantity: Number(item.quantity) || 1 })
            .then(({ error }) => {
              if (error) {
                // Fallback de contingencia si la función RPC aún no estuviese presente
                supabase.from('products').update({ stock: String(newStock), updated_at: new Date().toISOString() }).eq('id', item.id).then();
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

  // Inyección de ventas y pedidos de prueba para verificación de Pago Combinado
  const injectSplitPaymentTestOrders = () => {
    const isFernando = tenantSlug === 'minimarket-ian' || tenantSlug === 'tiendita-fernando' || (!tenantSlug && merchantStore?.id === 'minimarket-ian');
    const rawSeeds = isFernando ? getFernandoOrders() : getMatiasOrders();
    const splitTestSeeds = rawSeeds
      .filter(o => o.id && (String(o.id).startsWith('POS-MIX-') || String(o.id).startsWith('ORD-MIX-')))
      .map(normalizeOrder);

    if (splitTestSeeds.length === 0) {
      showToast('No se encontraron plantillas de Pago Combinado.', 'warning');
      return;
    }

    setOrders(prev => {
      const cleanPrev = (prev || []).filter(o => !String(o.id).startsWith('POS-MIX-') && !String(o.id).startsWith('ORD-MIX-'));
      const updated = [...splitTestSeeds, ...cleanPrev];
      const activeSlug = tenantSlug || 'matias-tiendatodo';

      try {
        localStorage.setItem(`marketsaas_${activeSlug}_orders`, JSON.stringify(updated));
        if (isOfficialSeedStore(activeSlug)) {
          localStorage.setItem('marketsaas_default_orders', JSON.stringify(updated));
        }
        if (storeConfig?.tenant_id) {
          localStorage.setItem(`marketsaas_${storeConfig.tenant_id}_orders`, JSON.stringify(updated));
        }
        if (merchantStore?.id && merchantStore.id !== activeSlug) {
          localStorage.setItem(`marketsaas_${merchantStore.id}_orders`, JSON.stringify(updated));
        }
      } catch (e) {}

      return updated;
    });

    triggerConfetti?.();
    showToast('¡5 ventas de prueba con Pago Combinado (Mixto) inyectadas con éxito! 🎉', 'success');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.injectSplitPaymentTestOrders = injectSplitPaymentTestOrders;
    }
  }, [tenantSlug, storeConfig, injectSplitPaymentTestOrders]);

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

  const saveSuppliersToLocal = (updatedSuppliers) => {
    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    try {
      localStorage.setItem(`marketsaas_${activeSlug}_suppliers`, JSON.stringify(updatedSuppliers));
      localStorage.setItem(`marketsaas_${activeSlug}_suppliers_initialized`, 'true');
      if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
        localStorage.setItem('marketsaas_default_suppliers', JSON.stringify(updatedSuppliers));
      }
    } catch (e) {}
  };

  const syncSupplierOrderItemsToSupabase = async (supplierId, updatedItems) => {
    const targetTenant = merchantStore?.id || tenantSlug || 'default';
    try {
      if (supabase) {
        const { error } = await supabase.from('suppliers')
          .update({
            order_items: updatedItems,
            updated_at: new Date().toISOString()
          })
          .eq('id', supplierId);

        if (error) {
          await supabase.from('suppliers')
            .update({
              order_items: updatedItems,
              updated_at: new Date().toISOString()
            })
            .eq('id', supplierId)
            .eq('tenant_id', targetTenant);
        }

        // Respaldo resiliente en store_config
        setSuppliers(curr => {
          if (Array.isArray(curr) && curr.length > 0) {
            supabase.from('store_config')
              .update({ config: { ...storeConfig, suppliersBackup: curr } })
              .eq('id', targetTenant)
              .then(() => {})
              .catch(() => {});
          }
          return curr;
        });
      }
    } catch (e) {
      console.warn('Aviso sincronización proveedor en Supabase:', e);
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

    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    const targetTenant = merchantStore?.id || tenantSlug || 'default';

    setSuppliers(prev => {
      const updated = [newSupplier, ...prev.filter(s => s.id !== newSupplier.id)];
      try {
        localStorage.setItem(`marketsaas_${activeSlug}_suppliers`, JSON.stringify(updated));
        localStorage.setItem(`marketsaas_${activeSlug}_suppliers_initialized`, 'true');
        if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
          localStorage.setItem('marketsaas_default_suppliers', JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });

    try {
      if (supabase && targetTenant) {
        await supabase.from('suppliers').upsert([{
          id: newSupplier.id,
          tenant_id: targetTenant,
          name: newSupplier.name,
          contact_name: newSupplier.contactName,
          phone: newSupplier.phone,
          category: newSupplier.category,
          visit_days: newSupplier.visitDays,
          notes: newSupplier.notes,
          order_items: newSupplier.orderItems,
          created_at: newSupplier.createdAt,
          updated_at: newSupplier.updatedAt
        }], { onConflict: 'id' });

        supabase.from('store_config')
          .update({ config: { ...storeConfig, suppliersBackup: [newSupplier, ...suppliers] } })
          .eq('id', targetTenant)
          .then(() => {})
          .catch(() => {});
      }
    } catch (e) {
      // Fallback seguro a localStorage si la tabla no está creada en Supabase
    }

    showToast(`Proveedor "${newSupplier.name}" registrado con éxito.`, 'success');
    return newSupplier;
  };

  const updateSupplier = async (supplierId, updatedFields) => {
    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    const targetTenant = merchantStore?.id || tenantSlug || 'default';

    let updatedList = [];
    setSuppliers(prev => {
      updatedList = prev.map(s => {
        if (s.id === supplierId) {
          return {
            ...s,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      try {
        localStorage.setItem(`marketsaas_${activeSlug}_suppliers`, JSON.stringify(updatedList));
        localStorage.setItem(`marketsaas_${activeSlug}_suppliers_initialized`, 'true');
        if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
          localStorage.setItem('marketsaas_default_suppliers', JSON.stringify(updatedList));
        }
      } catch (e) {}
      return updatedList;
    });

    try {
      if (supabase && targetTenant) {
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
          .eq('id', supplierId);

        supabase.from('store_config')
          .update({ config: { ...storeConfig, suppliersBackup: updatedList } })
          .eq('id', targetTenant)
          .then(() => {})
          .catch(() => {});
      }
    } catch (e) {}

    showToast('Proveedor actualizado.', 'info');
  };

  const deleteSupplier = async (supplierId) => {
    const supplierToDelete = suppliers.find(s => s.id === supplierId);
    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    const targetTenant = merchantStore?.id || tenantSlug || 'default';

    let remaining = [];
    setSuppliers(prev => {
      remaining = prev.filter(s => s.id !== supplierId);
      try {
        localStorage.setItem(`marketsaas_${activeSlug}_suppliers`, JSON.stringify(remaining));
        localStorage.setItem(`marketsaas_${activeSlug}_suppliers_initialized`, 'true');
        if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
          localStorage.setItem('marketsaas_default_suppliers', JSON.stringify(remaining));
        }
      } catch (e) {}
      return remaining;
    });

    try {
      if (supabase && targetTenant) {
        await supabase.from('suppliers')
          .delete()
          .eq('id', supplierId);

        supabase.from('store_config')
          .update({ config: { ...storeConfig, suppliersBackup: remaining } })
          .eq('id', targetTenant)
          .then(() => {})
          .catch(() => {});
      }
    } catch (e) {}

    showToast(`Proveedor "${supplierToDelete?.name || ''}" eliminado.`, 'info');
  };

  const addSupplierOrderItem = (supplierId, item) => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: item.productId || '',
      productName: item.productName.trim(),
      quantity: item.quantity?.trim() || '1 unidad',
      status: 'pending',
      notes: item.notes?.trim() || '',
      createdAt: new Date().toISOString()
    };

    let updatedList = [];
    setSuppliers(prev => {
      const next = prev.map(s => {
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
      });
      saveSuppliersToLocal(next);
      return next;
    });

    if (updatedList.length > 0) {
      syncSupplierOrderItemsToSupabase(supplierId, updatedList);
    }

    showToast(`"${newItem.productName}" agregado a la lista de pedido.`, 'success');
  };

  const removeSupplierOrderItem = (supplierId, itemId) => {
    let updatedList = [];
    setSuppliers(prev => {
      const next = prev.map(s => {
        if (s.id === supplierId) {
          updatedList = (s.orderItems || []).filter(item => item.id !== itemId);
          return {
            ...s,
            orderItems: updatedList,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
      saveSuppliersToLocal(next);
      return next;
    });

    syncSupplierOrderItemsToSupabase(supplierId, updatedList);
  };

  const toggleSupplierOrderItemStatus = (supplierId, itemId) => {
    let updatedList = [];
    let toggledItem = null;
    let nextStatus = 'pending';

    setSuppliers(prev => {
      const next = prev.map(s => {
        if (s.id === supplierId) {
          updatedList = (s.orderItems || []).map(item => {
            if (item.id === itemId) {
              nextStatus = item.status === 'received' ? 'pending' : 'received';
              toggledItem = item;
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
      });
      saveSuppliersToLocal(next);
      return next;
    });

    syncSupplierOrderItemsToSupabase(supplierId, updatedList);

    // Si se encontró el ítem, sincronizar el aumento/ajuste de stock en el inventario
    if (toggledItem) {
      const targetName = (toggledItem.productName || toggledItem.name || '').toLowerCase().trim();
      const qtyMatch = String(toggledItem.quantity || '1').match(/\d+/);
      const units = qtyMatch ? parseInt(qtyMatch[0], 10) : 1;
      const isReceived = nextStatus === 'received';
      const delta = isReceived ? units : -units;

      let matchedProduct = null;
      setProducts(prevProds => {
        let changed = false;
        const updated = prevProds.map(p => {
          const matchById = toggledItem.productId && p.id === toggledItem.productId;
          const matchByName = targetName && p.name && p.name.toLowerCase().trim() === targetName;

          if (matchById || matchByName) {
            changed = true;
            matchedProduct = p;
            const curStock = (typeof p.stock === 'number') ? p.stock : (parseInt(p.stock, 10) || 0);
            const newStock = Math.max(0, curStock + delta);

            // Persistir de inmediato en Supabase
            if (supabase) {
              supabase
                .from('products')
                .update({ stock: String(newStock), updated_at: new Date().toISOString() })
                .eq('id', p.id)
                .then();
            }

            return { ...p, stock: newStock };
          }
          return p;
        });

        if (changed) {
          try {
            localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(updated));
            if (tenantSlug === 'matias-tiendatodo') {
              localStorage.setItem('marketsaas_default_products', JSON.stringify(updated));
            }
          } catch (e) {}
        }
        return changed ? updated : prevProds;
      });

      if (isReceived) {
        showToast(
          matchedProduct 
            ? `¡Mercadería recibida! +${units} u. sumadas al stock de "${matchedProduct.name}".`
            : `Ítem marcado como recibido (+${units} u.).`,
          'success'
        );
      } else {
        showToast(
          matchedProduct 
            ? `Recepción revertida: -${units} u. en el stock de "${matchedProduct.name}".`
            : `Ítem marcado como pendiente.`,
          'info'
        );
      }
    }
  };

  const clearSupplierOrderItems = (supplierId, onlyReceived = false) => {
    let updatedList = [];
    setSuppliers(prev => {
      const next = prev.map(s => {
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
      });
      saveSuppliersToLocal(next);
      return next;
    });

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

    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    const targetTenant = merchantStore?.id || tenantSlug || 'default';

    let updatedList = [];
    setCreditCustomers(prev => {
      updatedList = [newCustomer, ...prev.filter(c => c.id !== newCustomer.id)];
      try {
        localStorage.setItem(`marketsaas_${activeSlug}_credits`, JSON.stringify(updatedList));
        localStorage.setItem(`marketsaas_${activeSlug}_credits_initialized`, 'true');
        if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
          localStorage.setItem('marketsaas_default_credits', JSON.stringify(updatedList));
          localStorage.setItem('marketsaas_matias-tiendatodo_credits', JSON.stringify(updatedList));
        }
      } catch (e) {}
      return updatedList;
    });

    try {
      if (supabase) {
        await supabase.from('credit_customers').upsert([{
          id: newCustomer.id,
          tenant_id: targetTenant,
          name: newCustomer.name,
          phone: newCustomer.phone,
          apartment: newCustomer.apartment,
          notes: newCustomer.notes,
          balance: newCustomer.balance,
          credit_limit: newCustomer.creditLimit,
          transactions: newCustomer.transactions,
          created_at: newCustomer.createdAt,
          updated_at: newCustomer.updatedAt
        }], { onConflict: 'id' });

        if (targetTenant && targetTenant !== 'default') {
          supabase.from('store_config')
            .update({ config: { ...storeConfig, creditsBackup: updatedList } })
            .eq('id', targetTenant)
            .then(() => {})
            .catch(() => {});
        }
      }
    } catch (e) {
      // Fallback seguro a localStorage
    }

    showToast(`Deudor "${newCustomer.name}" registrado en la libreta de cuentas.`, 'success');
    return newCustomer;
  };

  const updateCreditCustomer = async (customerId, updatedFields) => {
    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    const targetTenant = merchantStore?.id || tenantSlug || 'default';

    let updatedList = [];
    let updatedCustomer = null;
    setCreditCustomers(prev => {
      updatedList = prev.map(c => {
        if (c.id === customerId) {
          updatedCustomer = normalizeCreditCustomer({
            ...c,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          });
          return updatedCustomer;
        }
        return c;
      });
      try {
        localStorage.setItem(`marketsaas_${activeSlug}_credits`, JSON.stringify(updatedList));
        localStorage.setItem(`marketsaas_${activeSlug}_credits_initialized`, 'true');
        if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
          localStorage.setItem('marketsaas_default_credits', JSON.stringify(updatedList));
          localStorage.setItem('marketsaas_matias-tiendatodo_credits', JSON.stringify(updatedList));
        }
      } catch (e) {}
      return updatedList;
    });

    try {
      if (supabase && updatedCustomer) {
        await supabase.from('credit_customers').upsert([{
          id: updatedCustomer.id,
          tenant_id: targetTenant,
          name: updatedCustomer.name,
          phone: updatedCustomer.phone || '',
          apartment: updatedCustomer.apartment || '',
          notes: updatedCustomer.notes || '',
          balance: updatedCustomer.balance,
          credit_limit: updatedCustomer.creditLimit || 0,
          transactions: updatedCustomer.transactions || [],
          created_at: updatedCustomer.createdAt || new Date().toISOString(),
          updated_at: updatedCustomer.updatedAt || new Date().toISOString()
        }], { onConflict: 'id' });

        if (targetTenant && targetTenant !== 'default') {
          supabase.from('store_config')
            .update({ config: { ...storeConfig, creditsBackup: updatedList } })
            .eq('id', targetTenant)
            .then(() => {})
            .catch(() => {});
        }
      }
    } catch (e) {}

    showToast('Datos del deudor actualizados.', 'info');
  };

  const deleteCreditCustomer = async (customerId) => {
    const cust = creditCustomers.find(c => c.id === customerId);
    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    const targetTenant = merchantStore?.id || tenantSlug || 'default';

    let remaining = [];
    setCreditCustomers(prev => {
      remaining = prev.filter(c => c.id !== customerId);
      try {
        localStorage.setItem(`marketsaas_${activeSlug}_credits`, JSON.stringify(remaining));
        localStorage.setItem(`marketsaas_${activeSlug}_credits_initialized`, 'true');
        if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
          localStorage.setItem('marketsaas_default_credits', JSON.stringify(remaining));
          localStorage.setItem('marketsaas_matias-tiendatodo_credits', JSON.stringify(remaining));
        }
      } catch (e) {}
      return remaining;
    });

    try {
      if (supabase) {
        await supabase.from('credit_customers')
          .delete()
          .eq('id', customerId);

        if (targetTenant && targetTenant !== 'default') {
          supabase.from('store_config')
            .update({ config: { ...storeConfig, creditsBackup: remaining } })
            .eq('id', targetTenant)
            .then(() => {})
            .catch(() => {});
        }
      }
    } catch (e) {}

    showToast(`Cuenta de "${cust?.name || ''}" eliminada de la libreta.`, 'info');
  };

  const addCustomerCharge = async (customerId, amount, concept = 'Compra a cuenta / Fiao', items = []) => {
    const numAmount = Math.max(0, parseFloat(amount) || 0);
    if (numAmount <= 0) return;

    let targetName = '';
    let updatedCustomer = null;
    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    const targetTenant = merchantStore?.id || tenantSlug || 'default';

    let updatedList = [];
    setCreditCustomers(prev => {
      updatedList = prev.map(c => {
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
      });
      try {
        localStorage.setItem(`marketsaas_${activeSlug}_credits`, JSON.stringify(updatedList));
        localStorage.setItem(`marketsaas_${activeSlug}_credits_initialized`, 'true');
        if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
          localStorage.setItem('marketsaas_default_credits', JSON.stringify(updatedList));
          localStorage.setItem('marketsaas_matias-tiendatodo_credits', JSON.stringify(updatedList));
        }
      } catch (e) {}
      return updatedList;
    });

    try {
      if (supabase && updatedCustomer) {
        await supabase.from('credit_customers').upsert([{
          id: updatedCustomer.id,
          tenant_id: targetTenant,
          name: updatedCustomer.name,
          phone: updatedCustomer.phone || '',
          apartment: updatedCustomer.apartment || '',
          notes: updatedCustomer.notes || '',
          balance: updatedCustomer.balance,
          credit_limit: updatedCustomer.creditLimit || 0,
          transactions: updatedCustomer.transactions || [],
          created_at: updatedCustomer.createdAt || new Date().toISOString(),
          updated_at: updatedCustomer.updatedAt || new Date().toISOString()
        }], { onConflict: 'id' });

        if (targetTenant && targetTenant !== 'default') {
          supabase.from('store_config')
            .update({ config: { ...storeConfig, creditsBackup: updatedList } })
            .eq('id', targetTenant)
            .then(() => {})
            .catch(() => {});
        }
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
    const activeSlug = merchantStore?.id || tenantSlug || 'matias-tiendatodo';
    const targetTenant = merchantStore?.id || tenantSlug || 'default';

    let updatedList = [];
    setCreditCustomers(prev => {
      updatedList = prev.map(c => {
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
      });
      try {
        localStorage.setItem(`marketsaas_${activeSlug}_credits`, JSON.stringify(updatedList));
        localStorage.setItem(`marketsaas_${activeSlug}_credits_initialized`, 'true');
        if (activeSlug === 'matias-tiendatodo' || activeSlug === 'default') {
          localStorage.setItem('marketsaas_default_credits', JSON.stringify(updatedList));
          localStorage.setItem('marketsaas_matias-tiendatodo_credits', JSON.stringify(updatedList));
        }
      } catch (e) {}
      return updatedList;
    });

    try {
      if (supabase && updatedCustomer) {
        await supabase.from('credit_customers').upsert([{
          id: updatedCustomer.id,
          tenant_id: targetTenant,
          name: updatedCustomer.name,
          phone: updatedCustomer.phone || '',
          apartment: updatedCustomer.apartment || '',
          notes: updatedCustomer.notes || '',
          balance: updatedCustomer.balance,
          credit_limit: updatedCustomer.creditLimit || 0,
          transactions: updatedCustomer.transactions || [],
          created_at: updatedCustomer.createdAt || new Date().toISOString(),
          updated_at: updatedCustomer.updatedAt || new Date().toISOString()
        }], { onConflict: 'id' });

        if (targetTenant && targetTenant !== 'default') {
          supabase.from('store_config')
            .update({ config: { ...storeConfig, creditsBackup: updatedList } })
            .eq('id', targetTenant)
            .then(() => {})
            .catch(() => {});
        }
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
        minDeliveryOrder: 20.00,
        maxDeliveryRadiusKm: 18.0,
        isRainActive: false,
        enableDelivery: true,
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

      // Las tiendas de comerciantes inician 100% limpias en todos sus módulos
      setProducts([]);
      setOrders([]);
      setSuppliers([]);
      setCreditCustomers([]);
      setProductRequests([]);
      setCart([]);

      try {
        localStorage.setItem(`marketsaas_${cleanSlug}_products`, JSON.stringify([]));
        localStorage.setItem(`marketsaas_${cleanSlug}_orders`, JSON.stringify([]));
        localStorage.setItem(`marketsaas_${cleanSlug}_suppliers`, JSON.stringify([]));
        localStorage.setItem(`marketsaas_${cleanSlug}_suppliers_initialized`, 'true');
        localStorage.setItem(`marketsaas_${cleanSlug}_credits`, JSON.stringify([]));
        localStorage.setItem(`marketsaas_${cleanSlug}_credits_initialized`, 'true');
        localStorage.setItem(`marketsaas_${cleanSlug}_requests`, JSON.stringify([]));
        localStorage.removeItem(`marketsaas_${cleanSlug}_cart`);
      } catch (e) {}

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
    // 1. Limpieza y cambio de vista INMEDIATO y optimista (0 ms de espera para el usuario)
    try {
      localStorage.setItem('marketsaas_active_view_mode', 'spectator');
      localStorage.removeItem('marketsaas_is_impersonating');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('view', 'spectator');
      newUrl.searchParams.delete('superadmin');
      newUrl.searchParams.delete('mode');
      newUrl.searchParams.delete('store');
      window.history.replaceState({}, '', newUrl.toString());
    } catch (e) {}

    // Desconectar estados locales de usuario y redirigir inmediatamente
    setCurrentUser(null);
    setMerchantStore(null);
    setIsImpersonating(false);
    setViewMode('spectator');
    showToast('Sesión cerrada correctamente.', 'info');

    // 2. En segundo plano sin congelar la pantalla, invalidar la sesión en Supabase
    if (supabase) {
      try {
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
        await Promise.race([signOutPromise, timeoutPromise]);
      } catch (e) {
        console.warn('Aviso al revocar sesión en Supabase:', e);
      }
    }
  };

  // Tienda de comerciante efectiva (resuelve tienda de dueño o tienda impersonada por SuperAdmin)
  const effectiveMerchantStore = useMemo(() => {
    if (merchantStore) return merchantStore;
    const safeImpersonation = Boolean(isImpersonating && isSuperAdminUser(currentUser));
    if (safeImpersonation || (isSuperAdminUser(currentUser) && tenantSlug && tenantSlug !== 'default')) {
      const match = (stores || []).find(s => s.slug === tenantSlug || s.id === tenantSlug);
      if (match) return match;
      if (storeConfig && storeConfig.name) {
        return {
          id: tenantSlug,
          slug: tenantSlug,
          name: storeConfig.name,
          ...storeConfig
        };
      }
    }
    return null;
  }, [merchantStore, isImpersonating, currentUser, tenantSlug, stores, storeConfig]);

  return (
    <StoreContext.Provider
      value={{
        tenantSlug,
        setTenantSlug,
        currentUser,
        isSuperAdmin: isSuperAdminUser(currentUser),
        isSuperAdminUser,
        merchantStore: effectiveMerchantStore,
        isAuthLoading,
        signUpMerchant,
        signInMerchant,
        createMerchantStore,
        signOutMerchant,
        isOfficialSeedStore,
        isFernandoSeedStore,
        isMatiasSeedStore,
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
        storeOpenStatus,
        toggleStoreOpenStatus,
        calculateStoreOpenStatus,
        normalizeStoreSchedule,
        formatScheduleSummary,
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
        deliveryCalculation,
        currentDistanceKm,
        minDeliveryOrder,
        isBelowMinDeliveryOrder,
        missingToMinDeliveryOrder,
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
        neighborOrderIds,
        addNeighborOrderId,
        restoreOrder,
        purgeOrderPermanently,
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
        isProPlan,
        activePlanType,
        activePlanName,
        canAccessFeature,
        SUBSCRIPTION_PLANS,
        SYSTEM_FEATURES,
        subscriptionTimeRemaining,
        generateSubscriptionCodes,
        deleteSubscriptionCode,
        redeemSubscriptionCode,
        addStoreSubscriptionTime,
        suspendStoreSubscription,
        impersonateStore,
        stopImpersonating,
        isImpersonating: Boolean(isImpersonating && isSuperAdminUser(currentUser)),
        systemBroadcast,
        saveSystemBroadcast,
        formatBoliviaDateTime,
        TRIAL_DURATION_MINUTES,
        BOLIVIA_TIMEZONE_OFFSET_HOURS,
        PAYMENT_METHODS,
        PAYMENT_METHOD_LABELS,
        normalizeSplitPayment,
        validateSplitPayment,
        calculateSplitPortions,
        formatPaymentBreakdownText,
        roundMoney,
        injectSplitPaymentTestOrders
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
