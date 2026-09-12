import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initialProducts, initialCategories, initialStoreConfig, initialOrders, initialProductRequests, initialStores } from '../data/initialData';
import confetti from 'canvas-confetti';
import { supabase } from '../services/supabaseClient';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

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

  return {
    ...p,
    price: numPrice,
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
    image: p.image || '/products/producto-sin-imagen.png',
    code: p.code ? String(p.code) : '',
    badge: p.badge || '',
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

// Filtra automáticamente los 14 productos demo sembrados si la tienda ya cuenta con productos reales/importados
export const filterOutLegacyDemoProducts = (productList, slug) => {
  if (!Array.isArray(productList) || !slug || slug === 'default') {
    return productList;
  }
  const hasCustomProducts = productList.some(p => {
    if (!p || !p.id) return false;
    return /prod-\d{10,}/.test(p.id) || !p.id.startsWith(`${slug}-prod-`);
  });

  if (!hasCustomProducts) {
    return productList;
  }

  return productList.filter(p => {
    if (!p || !p.id) return false;
    const isLegacyDemoId = new RegExp(`^${slug}-prod-([1-9]|1[0-4])$`).test(p.id);
    return !isLegacyDemoId;
  });
};

export const StoreProvider = ({ children }) => {
  // Identificador de Tienda Multi-Tenant (ej. ?store=donpepe o ?tenant=central)
  const getInitialTenantSlug = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('store') || params.get('tenant') || localStorage.getItem('marketsaas_active_tenant') || null;
  };
  const [tenantSlug, setTenantSlug] = useState(getInitialTenantSlug);

  // Estados de Autenticación de Dueño
  const [currentUser, setCurrentUser] = useState(null);
  const [merchantStore, setMerchantStore] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 1. Vista actual: Persistencia en localStorage y URL
  // Si el usuario recarga la página, se mantiene exactamente en la sección donde estaba (ej. 'customer' / Vista Vecino).
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
    setViewModeState(newMode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('marketsaas_active_view_mode', newMode);
        const url = new URL(window.location.href);
        url.searchParams.set('view', newMode);
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
  const [stores, setStores] = useState(initialStores);
  const [selectedStore, setSelectedStore] = useState(() => {
    return initialStores.find(s => s.slug === tenantSlug) || null;
  });

  const goToStore = (storeSlugOrId) => {
    const foundStore = stores.find(s => s.slug === storeSlugOrId || s.id === storeSlugOrId);
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
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_products`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return filterOutLegacyDemoProducts(deduplicateProducts(parsed.map(normalizeProduct)), tenantSlug);
        }
      } catch (e) {
        // fallback
      }
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
        const cleaned = { ...initialStoreConfig, ...parsed, coupons: parsed.coupons };
        try {
          localStorage.setItem(`marketsaas_${tenantSlug}_store_config`, JSON.stringify(cleaned));
        } catch (err) {}
        return cleaned;
      } catch (e) {
        return initialStoreConfig;
      }
    }
    return initialStoreConfig;
  });

  const setStoreConfig = async (newConfigData) => {
    const rawUpdated = typeof newConfigData === 'function' ? newConfigData(storeConfig) : newConfigData;
    const { adminPassword, admin_pin, ...safeConfig } = rawUpdated;
    if (Array.isArray(safeConfig.coupons)) {
      safeConfig.coupons = safeConfig.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511');
    }
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
        const found = prev.some(s => s.slug === effectiveTenant || s.id === effectiveTenant || s.isCurrentOwnerStore);
        if (found) {
          return prev.map(s => {
            if (s.slug === effectiveTenant || s.id === effectiveTenant || s.isCurrentOwnerStore) {
              return {
                ...s,
                name: safeConfig.name || s.name,
                address: safeConfig.address || s.address,
                tagline: safeConfig.tagline || s.tagline,
                googleMapsCoordinates: validCoords,
                isCurrentOwnerStore: true
              };
            }
            return s;
          });
        }
        return prev;
      });
    }

    if (supabase && effectiveTenant && effectiveTenant !== 'default') {
      try {
        const sessionUser = (await supabase.auth.getUser())?.data?.user || currentUser;
        const ownerId = sessionUser?.id || merchantStore?.owner_id || safeConfig.owner_id || null;

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
          latitude: validCoords ? validCoords.lat : null,
          longitude: validCoords ? validCoords.lng : null,
          qr_image_url: safeConfig.qrImageUrl || null,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('store_config')
          .upsert([payload], { onConflict: 'id' })
          .select();

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
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_orders`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(o => !String(o.id).startsWith('CHECK-') && !String(o.id).startsWith('TEST-') && o.id !== '{}' && o.id !== 'ORD-1319')
            .map(normalizeOrder);
        }
      }
      return tenantSlug === 'default' ? initialOrders.map(normalizeOrder) : [];
    } catch (e) {
      console.warn('Error reading stored orders:', e);
      return tenantSlug === 'default' ? initialOrders.map(normalizeOrder) : [];
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

  // 9. Cupones de descuento aplicados
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

  // Auto-limpieza de pedido activo si el pedido ya fue entregado, cancelado o no existe en orders
  useEffect(() => {
    if (!activeTrackingOrderId) return;
    const existing = orders.find(o => o.id === activeTrackingOrderId);
    // Si el pedido no existe o ya no está en curso activo:
    if (!existing || ['delivered', 'cancelled'].includes(existing.status)) {
      setActiveTrackingOrderId(null);
      try {
        localStorage.removeItem(`marketsaas_${tenantSlug}_active_order`);
        localStorage.removeItem('marketsaas_default_active_order');
      } catch (e) {}
    }
  }, [orders, activeTrackingOrderId, tenantSlug]);

  // 11. Toast notification
  const [toast, setToast] = useState(null);

  // Función para buscar y cargar la tienda asociada al dueño
  const fetchStoreForUser = async (userId) => {
    if (!supabase || !userId) return null;
    try {
      let storeRecord = null;
      // Intento 1: buscar por owner_id
      const { data, error } = await supabase
        .from('store_config')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();

      if (!error && data) {
        storeRecord = data;
      } else {
        // Intento 2: buscar en toda la tabla por si owner_id está en config JSONB
        const allStores = await supabase.from('store_config').select('*');
        if (allStores.data && allStores.data.length > 0) {
          storeRecord = allStores.data.find(s => {
            const cfg = s.config || s;
            return s.owner_id === userId || cfg?.owner_id === userId;
          }) || null;
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

        const resolvedConfig = {
          ...initialStoreConfig,
          ...configData,
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

  // Inicialización y Listener de Supabase Auth
  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        await fetchStoreForUser(session.user.id);
      }
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        if (event === 'SIGNED_IN') {
          await fetchStoreForUser(session.user.id);
        }
      } else {
        setCurrentUser(null);
        setMerchantStore(null);
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
        if (localProds) {
          const parsed = JSON.parse(localProds);
          if (Array.isArray(parsed)) {
            setProducts(filterOutLegacyDemoProducts(deduplicateProducts(parsed.map(normalizeProduct)), tenantSlug));
          }
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
      } else {
        setProductRequests(initialProductRequests.map(normalizeProductRequest));
      }
    } catch (e) {
      console.warn('Error cargando caché local de tenant:', e);
    }

    if (!supabase) return;

    // 1. Cargar productos por tienda de forma aislada a nivel servidor con deduplicación y purga de demo
    const productQuery = tenantSlug === 'default'
      ? supabase.from('products').select('*').or(`tenant_id.eq.${tenantSlug},tenant_id.is.null`)
      : supabase.from('products').select('*').eq('tenant_id', tenantSlug);

    productQuery.then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const cleaned = filterOutLegacyDemoProducts(deduplicateProducts(data.map(normalizeProduct)), tenantSlug);
        setProducts(cleaned);
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
          return {
            ...prev,
            ...configData,
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

    // 3. Cargar pedidos por tienda con filtro server-side seguro y normalización canónica
    supabase.from('orders')
      .select('*')
      .eq('tenant_id', tenantSlug)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn('Aviso cargando pedidos en Supabase:', error.message);
        } else if (Array.isArray(data)) {
          const normalized = data
            .filter(o => !String(o.id).startsWith('CHECK-') && !String(o.id).startsWith('TEST-') && o.id !== '{}' && o.id !== 'ORD-1319')
            .map(normalizeOrder);
          setOrders(normalized);
          try {
            localStorage.setItem(`marketsaas_${tenantSlug}_orders`, JSON.stringify(normalized));
          } catch (e) {}

          // Auto-limpieza si el pedido activo en cliente ya no existe en la base de datos
          setActiveTrackingOrderId(prev => {
            if (prev && !normalized.some(o => o.id === prev)) {
              try {
                localStorage.removeItem(`marketsaas_${tenantSlug}_active_order`);
                localStorage.removeItem('marketsaas_default_active_order');
              } catch (err) {}
              return null;
            }
            return prev;
          });
        }
      });

    // 4. Cargar solicitudes de productos por tienda
    if (tenantSlug && tenantSlug !== 'default') {
      supabase.from('product_requests')
        .select('*')
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

    // Subscripciones en Tiempo Real (Realtime) con filtro de fila de Postgres por tenant_id
    const ordersChannel = supabase
      .channel(`public:orders:${tenantSlug}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `tenant_id=eq.${tenantSlug}`
      }, payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const normalized = normalizeOrder(payload.new);
          setOrders(prev => {
            const exists = prev.some(o => o.id === normalized.id);
            if (!exists) {
              try {
                window.dispatchEvent(new CustomEvent('marketsaas:new_order', { detail: normalized }));
              } catch (e) {}
            }
            return [normalized, ...prev.filter(o => o.id !== normalized.id)];
          });
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const normalized = normalizeOrder(payload.new);
          setOrders(prev => prev.map(o => (o.id === normalized.id ? normalized : o)));
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
          setProducts(prev => filterOutLegacyDemoProducts(deduplicateProducts([normalizeProduct(payload.new), ...prev.filter(p => p.id !== payload.new.id)]), tenantSlug));
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => filterOutLegacyDemoProducts(deduplicateProducts(prev.map(p => (p.id === payload.new.id ? normalizeProduct(payload.new) : p))), tenantSlug));
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

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [tenantSlug]);

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
              const effectiveName = (isCurrentOwner && storeConfig?.name) 
                ? storeConfig.name 
                : (conf.name || rs.name || 'Minimarket Registrado');

              const effectiveTagline = (isCurrentOwner && storeConfig?.tagline) 
                ? storeConfig.tagline 
                : (conf.tagline || rs.slogan || 'Tienda oficial registrada');

              // La dirección configurada en config tiene prioridad absoluta sobre la columna de tabla antigua rs.address
              const effectiveAddress = (isCurrentOwner && storeConfig?.address) 
                ? storeConfig.address 
                : (conf.address || rs.address || 'Ubicación registrada');

              const isDeliveryActive = (isCurrentOwner && storeConfig) 
                ? (storeConfig.enableDelivery === true) 
                : (conf.enableDelivery === true || rs.enable_delivery === true);

              const coords = (isCurrentOwner && storeConfig?.googleMapsCoordinates)
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
                bankDetails: conf.bankDetails || rs.bank_details || null,
                condominium: (isCurrentOwner && (storeConfig?.zone || storeConfig?.condominium))
                  ? (storeConfig.zone || storeConfig.condominium)
                  : (conf.zone || conf.condominium || conf.condominiums?.[0]?.name || 'Santa Cruz'),
                reference: (isCurrentOwner && storeConfig?.reference !== undefined)
                  ? storeConfig.reference
                  : (conf.reference || ''),
                distance: `A ${(idx + 1) * 180}m`,
                distanceMeters: (idx + 1) * 180,
                rating: 4.9,
                reviewsCount: 24 + idx * 8,
                ordersCount: 24 + idx * 8,
                isOpen: (isCurrentOwner && storeConfig?.isOpen !== undefined)
                  ? storeConfig.isOpen
                  : (rs.is_open !== false && conf.isOpen !== false),
                statusBadge: ((isCurrentOwner && storeConfig?.isOpen !== undefined)
                  ? storeConfig.isOpen
                  : (rs.is_open !== false && conf.isOpen !== false)) ? 'Abierto Ahora' : 'Cerrado Temporalmente',
                imageUrl: (isCurrentOwner && (storeConfig?.bannerUrl || storeConfig?.logoUrl))
                  ? (storeConfig.bannerUrl || storeConfig.logoUrl)
                  : (conf.bannerUrl || conf.logoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80'),
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

            // Preservar y fusionar la tienda del dueño actual si ya existía en memoria y está autenticado
            const currentOwnerStore = currentUser
              ? prev.find(s => s.isCurrentOwnerStore && (s.slug === tenantSlug || s.id === tenantSlug))
              : null;
            const remoteSlugs = new Set(remoteMapped.map(s => s.slug));
            let finalStores = remoteMapped.map(s => {
              if (currentOwnerStore && (s.slug === currentOwnerStore.slug || s.id === currentOwnerStore.id)) {
                return {
                  ...s,
                  ...currentOwnerStore,
                  distance: s.distance,
                  distanceMeters: s.distanceMeters,
                  googleMapsCoordinates: currentOwnerStore.googleMapsCoordinates || s.googleMapsCoordinates
                };
              }
              return s;
            });
            if (currentOwnerStore && !remoteSlugs.has(currentOwnerStore.slug)) {
              finalStores.unshift(currentOwnerStore);
              remoteSlugs.add(currentOwnerStore.slug);
            }
            return finalStores;
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
    if (!currentUser || !merchantStore || !tenantSlug || !storeConfig?.name) return;
    setStores(prev => {
      const idx = prev.findIndex(s => s.slug === tenantSlug || s.id === tenantSlug || s.isCurrentOwnerStore);
      const isDeliveryActive = storeConfig.enableDelivery === true;
      const coords = storeConfig.googleMapsCoordinates || {
        lat: parseFloat(storeConfig.latitude) || -17.78335,
        lng: parseFloat(storeConfig.longitude) || -63.18214
      };
      const updatedCurrent = {
        id: tenantSlug,
        slug: tenantSlug,
        name: storeConfig.name,
        tagline: storeConfig.tagline || 'Tu tienda de confianza a pasos de tu puerta',
        address: storeConfig.address || 'En tu sector',
        condominium: storeConfig.zone || storeConfig.condominium || 'Santa Cruz',
        reference: storeConfig.reference || '',
        distance: 'En tu zona',
        distanceMeters: 100,
        rating: 5.0,
        reviewsCount: 30,
        ordersCount: 30,
        isOpen: storeConfig.isOpen !== false,
        statusBadge: storeConfig.isOpen !== false ? 'Abierto Ahora' : 'Cerrado Temporalmente',
        imageUrl: storeConfig.bannerUrl || storeConfig.logoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        deliveryTime: isDeliveryActive ? (storeConfig.deliveryTime || '10-15 min') : 'Retiro en Tienda',
        freeDeliveryThreshold: storeConfig.freeDeliveryThreshold || null,
        hasFreeDelivery: isDeliveryActive && !!storeConfig.freeDeliveryThreshold,
        acceptsQr: true,
        hasPickup: true,
        hasFastDelivery: isDeliveryActive,
        category: 'Minimarket Registrado',
        isFeatured: true,
        isRegisteredStore: true,
        isVerified: true,
        isCurrentOwnerStore: true,
        owner_id: currentUser?.id || merchantStore?.owner_id || null,
        totalStockItems: 100,
        perks: [
          { id: 'p1', text: '✅ Registrada en el sistema' },
          isDeliveryActive ? { id: 'p2', text: '🛵 Delivery disponible' } : { id: 'p2', text: '🛍️ Retiro en Tienda' },
          { id: 'p3', text: '💳 Pago Qr simple o efectivo' }
        ],
        featuredProducts: [],
        googleMapsCoordinates: coords,
        googleMapsQuery: `${storeConfig.name}, ${storeConfig.address || ''}, Santa Cruz de la Sierra`,
        mapPosition: {
          leftPercent: 50,
          bottomPixels: 55,
          label: storeConfig.name,
          badge: 'Tu Tienda'
        }
      };

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updatedCurrent };
        return copy;
      } else {
        return [updatedCurrent, ...prev];
      }
    });
  }, [storeConfig, tenantSlug, currentUser]);

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
  const CURRENT_SCHEMA_VER = '2026-09-08-v11-clean-inventory';
  useEffect(() => {
    try {
      const storedVer = localStorage.getItem('marketsaas_catalog_version');
      if (storedVer !== CURRENT_SCHEMA_VER) {
        localStorage.setItem('marketsaas_catalog_version', CURRENT_SCHEMA_VER);
        if (tenantSlug === 'default') {
          setProducts(initialProducts);
          setStoreConfigState(initialStoreConfig);
          setCart([]);
          setProductRequests(initialProductRequests);
          localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(initialProducts));
          localStorage.setItem(`marketsaas_${tenantSlug}_config`, JSON.stringify(initialStoreConfig));
          localStorage.removeItem(`marketsaas_${tenantSlug}_cart`);
          localStorage.removeItem(`marketsaas_${tenantSlug}_requests`);
        } else {
          // Si es una tienda personalizada registrada, limpiar la caché local para forzar recarga limpia desde Supabase
          localStorage.removeItem(`marketsaas_${tenantSlug}_products`);
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

  // Exportar ventas a CSV para la contabilidad del dueño
  const exportSalesCSV = () => {
    if (orders.length === 0) {
      showToast('No hay pedidos registrados para exportar.', 'warning');
      return;
    }
    const headers = ["ID Pedido", "Fecha", "Cliente", "Telefono", "Condominio", "Torre/Depto", "Tipo", "Metodo Pago", "Total", "Estado"];
    const rows = orders.map(o => [
      o.id,
      new Date(o.createdAt).toLocaleDateString() + " " + new Date(o.createdAt).toLocaleTimeString(),
      `"${o.customer.name}"`,
      `"${o.customer.phone}"`,
      `"${o.customer.condominium}"`,
      `"${o.customer.tower} - ${o.customer.apartment}"`,
      o.deliveryType === 'delivery' ? 'Delivery' : 'Retiro',
      o.paymentMethod,
      o.total.toFixed(2),
      o.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${storeConfig.name.replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  const isDeliveryEnabled = storeConfig.enableDelivery === true;
  const currentCondo = storeConfig.condominiums?.find(c => c.name === selectedLocation.condominium);
  const deliveryFeeBase = isDeliveryEnabled ? (currentCondo ? (currentCondo.deliveryFee ?? storeConfig.defaultDeliveryFee ?? 0) : (storeConfig.defaultDeliveryFee ?? 0)) : 0;
  const isFreeDelivery = !isDeliveryEnabled || (storeConfig.freeDeliveryThreshold > 0 && cartSubtotal >= storeConfig.freeDeliveryThreshold);
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
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

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

    // Agregar a la lista de pedidos y persistir en Supabase
    setOrders(prev => [newOrder, ...prev]);
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
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_active_order`, orderId);
    } catch (e) {}
    triggerConfetti();
    showToast(`¡Pedido ${orderId} recibido con éxito! La tienda ya lo está preparando.`, 'success');

    return newOrder;
  };

  // Actualizar estado de pedido (Dueño)
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
    if (supabase) {
      supabase.from('orders').update({ status: newStatus }).eq('id', orderId).then(({ error }) => {
        if (error) console.error('Error actualizando pedido en Supabase:', error);
      });
    }

    if (newStatus === 'delivered' || newStatus === 'cancelled') {
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
    showToast(`Pedido ${orderId} actualizado a: ${statusLabels[newStatus] || newStatus}`);
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
  const completePosSale = (posItems, paymentType = 'cash') => {
    const subtotal = posItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const saleId = `${tenantSlug}-POS-${Math.floor(1000 + Math.random() * 9000)}`;

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

    // 2. Registrar como pedido completado directo
    const posOrder = {
      id: saleId,
      tenant_id: tenantSlug,
      owner_id: currentUser?.id || storeConfig?.owner_id || null,
      customer: {
        name: 'Venta de Mostrador (Presencial)',
        phone: 'Presencial',
        condominium: 'En Tienda',
        tower: '-',
        apartment: '-'
      },
      items: posItems,
      subtotal,
      deliveryFee: 0,
      discount: 0,
      total: subtotal,
      deliveryType: 'pickup',
      paymentMethod: paymentType,
      status: 'delivered',
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [posOrder, ...prev]);
    if (supabase && tenantSlug) {
      supabase.from('orders').insert([posOrder]).then(({ error }) => {
        if (error) console.error('Error insertando venta POS en Supabase:', error);
      });

      // 3. Descontar inventario de forma atómica en Supabase para productos con stock numérico definido
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
    showToast(`Venta de mostrador ${saleId} registrada por ${currency} ${subtotal.toFixed(2)}.`, 'success');
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
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
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
        condominiums: []
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
        condominiums: [],
        coupons: [],
        categories: initialStoreConfig.categories,
        payment_methods: initialStoreConfig.paymentMethods,
        config: newConfig,
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

  // 3. Inicio de Sesión de Comerciante
  const signInMerchant = async (email, password) => {
    if (!supabase) return { data: null, store: null, error: { message: 'Supabase no está configurado.' } };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      if (data?.user) {
        setCurrentUser(data.user);
        const store = await fetchStoreForUser(data.user.id);
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

  // 4. Cerrar Sesión de Comerciante
  const signOutMerchant = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setMerchantStore(null);
    setViewMode('spectator');
    showToast('Sesión de comerciante cerrada.', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        tenantSlug,
        setTenantSlug,
        currentUser,
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
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        isTrackingModalOpen,
        setIsTrackingModalOpen,
        toast,
        showToast,
        triggerConfetti,
        exportSalesCSV
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
