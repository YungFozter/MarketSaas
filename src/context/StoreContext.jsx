import React, { createContext, useContext, useState, useEffect } from 'react';
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
    return params.get('store') || params.get('tenant') || localStorage.getItem('marketsaas_active_tenant') || 'don-vecino';
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

  const setStoreConfig = (newConfigData) => {
    const rawUpdated = typeof newConfigData === 'function' ? newConfigData(storeConfig) : newConfigData;
    const { adminPassword, admin_pin, ...safeConfig } = rawUpdated;
    if (Array.isArray(safeConfig.coupons)) {
      safeConfig.coupons = safeConfig.coupons.filter(c => c.code !== 'VECINO10' && c.code !== 'VECI-511');
    }
    setStoreConfigState(safeConfig);
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_store_config`, JSON.stringify(safeConfig));
      localStorage.setItem(`marketsaas_${tenantSlug}_config`, JSON.stringify(safeConfig));
    } catch (err) {}
    if (supabase) {
      const payload = {
        id: tenantSlug,
        tenant_id: tenantSlug,
        name: safeConfig.name || 'Tienda',
        address: safeConfig.address || null,
        slogan: safeConfig.tagline || null,
        phone: safeConfig.phone || null,
        whatsapp: safeConfig.whatsapp || null,
        is_open: safeConfig.isOpen !== false,
        enable_delivery: safeConfig.enableDelivery === true,
        enable_points: safeConfig.enablePoints !== false,
        config: safeConfig,
        coupons: safeConfig.coupons || [],
        owner_id: currentUser?.id || merchantStore?.owner_id || null,
        updated_at: new Date().toISOString()
      };
      supabase.from('store_config').upsert([payload]).then(({ error }) => {
        if (error) console.error('Error sincronizando storeConfig en Supabase:', error);
      });
    }
  };

  // 4. Carrito de Compras (En Modo Demostración inicia siempre vacío en cada recarga)
  const [cart, setCart] = useState([]);

  // 5. Ubicación seleccionada por el cliente
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_location`);
    return saved ? JSON.parse(saved) : {
      condominium: initialStoreConfig.condominiums[0].name,
      tower: initialStoreConfig.condominiums[0].towers[0],
      apartment: 'Casa 27',
      notes: ''
    };
  });

  // 6. Pedidos
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_orders`);
      return saved ? JSON.parse(saved) : (tenantSlug === 'default' ? initialOrders : []);
    } catch (e) {
      console.warn('Error reading stored orders:', e);
      return tenantSlug === 'default' ? initialOrders : [];
    }
  });

  // 7. Puntos de Fidelidad / VeciPuntos del cliente
  const [veciPoints, setVeciPoints] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_points`);
    return saved ? parseInt(saved, 10) : 340;
  });

  // 8. Solicitudes de productos (En Modo Demostración inicia con listado de ejemplo; en tiendas registradas con su lista o vacía)
  const [productRequests, setProductRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_requests`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return tenantSlug === 'default' ? initialProductRequests : [];
  });

  // 9. Cupones de descuento aplicados
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // 10. Pedido activo para seguimiento y modal de tracking
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(() => {
    try {
      return localStorage.getItem(`marketsaas_${tenantSlug}_active_order`) || null;
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
        setStoreConfigState(prev => ({ ...prev, ...configData, coupons: loadedCoupons, name: storeRecord.name || configData.name }));
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
        setStoreConfigState(prev => ({ ...prev, ...configData, coupons: loadedCoupons, name: data.name || configData.name }));
      }
    });

    // 3. Cargar pedidos por tienda con filtro server-side seguro (Previene fuga cross-tenant)
    supabase.from('orders')
      .select('*')
      .eq('tenant_id', tenantSlug)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setOrders(data);
        }
      });

    // 4. Cargar solicitudes de productos por tienda
    if (tenantSlug && tenantSlug !== 'default') {
      supabase.from('product_requests')
        .select('*')
        .eq('tenant_id', tenantSlug)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setProductRequests(data);
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
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev.filter(o => o.id !== payload.new.id)]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => (o.id === payload.new.id ? payload.new : o)));
        } else if (payload.eventType === 'DELETE') {
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

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
    };
  }, [tenantSlug]);

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
                (currentUser && (rs.owner_id === currentUser.id || conf.owner_id === currentUser.id)) ||
                rs.tenant_id === tenantSlug || rs.id === tenantSlug
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
                pointsReward: ((isCurrentOwner && storeConfig?.enablePoints !== undefined)
                  ? storeConfig.enablePoints
                  : (conf.enablePoints !== false)) ? '+20 VeciPuntos' : null,
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

            // Preservar y fusionar la tienda del dueño actual si ya existía en memoria
            const currentOwnerStore = prev.find(s => s.isCurrentOwnerStore || s.slug === tenantSlug || s.id === tenantSlug);
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

  // Limpieza automática en Supabase si el dueño legítimo está autenticado y tiene productos demo residuales
  useEffect(() => {
    if (!supabase || !currentUser || !tenantSlug || tenantSlug === 'default') return;
    const isOwner = Boolean(
      merchantStore && (
        currentUser.id === merchantStore.owner_id || 
        merchantStore.tenant_id === tenantSlug || 
        merchantStore.id === tenantSlug
      )
    );
    if (!isOwner) return;

    const legacyDemoIds = [];
    for (let i = 1; i <= 14; i++) {
      legacyDemoIds.push(`${tenantSlug}-prod-${i}`);
    }

    supabase
      .from('products')
      .delete()
      .in('id', legacyDemoIds)
      .eq('tenant_id', tenantSlug)
      .then(({ error, count }) => {
        if (!error && count && count > 0) {
          console.log(`Eliminados ${count} productos demo residuales de ${tenantSlug} en Supabase.`);
        }
      });
  }, [currentUser, merchantStore, tenantSlug]);

  // Sincronizar reactivamente la tienda del dueño actual en la lista de tiendas del directorio
  useEffect(() => {
    if (!tenantSlug || !storeConfig?.name) return;
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
        pointsReward: storeConfig.enablePoints !== false ? '+20 VeciPuntos' : null,
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
    localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(products));
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
    localStorage.setItem(`marketsaas_${tenantSlug}_points`, veciPoints.toString());
  }, [veciPoints, tenantSlug]);

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
    if (product.stock <= 0) {
      showToast(`¡Lo sentimos! ${product.name} está agotado.`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { ...product, quantity: Math.min(quantity, product.stock) }];
    });

    showToast(`Agregado: ${product.name}`, 'success');
  };

  const updateCartQuantity = (productId, newQty) => {
    const product = products.find(p => p.id === productId);
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    if (product && newQty > product.stock) {
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

  // Crear Pedido desde la vista de Cliente
  const createCustomerOrder = (orderData) => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const earnedPoints = Math.round(cartSubtotal * storeConfig.pointsRatio);

    const newOrder = {
      id: orderId,
      tenant_id: tenantSlug,
      owner_id: storeConfig?.owner_id || null,
      customer: {
        name: orderData.name,
        phone: orderData.phone,
        condominium: orderData.condominium,
        tower: orderData.tower,
        apartment: orderData.apartment,
        notes: orderData.notes || ''
      },
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: cartSubtotal,
      deliveryFee: orderData.deliveryType === 'delivery' ? actualDeliveryFee : 0,
      discount: discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      total: orderData.deliveryType === 'delivery' ? cartTotal : Math.max(0, cartSubtotal - discountAmount),
      deliveryType: orderData.deliveryType, // 'delivery' | 'pickup'
      paymentMethod: orderData.paymentMethod,
      cashChangeFor: orderData.cashChangeFor || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      pointsEarned: earnedPoints
    };

    // Descontar inventario
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const cartItem = cart.find(c => c.id === prod.id);
        if (cartItem) {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
        }
        return prod;
      })
    );

    // Sumar puntos al cliente
    setVeciPoints(prev => prev + earnedPoints);

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
    if (supabase) {
      supabase.from('orders').insert([newOrder]).then(({ error }) => {
        if (error) console.error('Error insertando pedido en Supabase:', error);
      });

      // Descontar inventario de forma atómica en Supabase (RPC)
      cart.forEach(item => {
        supabase.rpc('decrement_stock', { product_id: item.id, quantity: item.quantity }).then(({ error }) => {
          if (error) {
            // Si RPC falla, hacemos fallback a upsert
            supabase.from('products').update({ stock: Math.max(0, item.stock - item.quantity) }).eq('id', item.id);
          }
        });
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

  // Crear o Editar Producto (Dueño)
  const saveProduct = (productData) => {
    const cleanImage = (productData.image && productData.image.trim()) 
      ? productData.image.trim() 
      : '/products/producto-sin-imagen.png';

    const payload = { 
      ...productData, 
      image: cleanImage,
      tenant_id: tenantSlug 
    };
    const syncItem = {
      ...payload,
      image: cleanImage,
      cost_price: payload.costPrice != null ? String(payload.costPrice) : 'Sin definir',
      costPrice: payload.costPrice != null ? String(payload.costPrice) : 'Sin definir',
      min_stock: payload.minStock != null ? String(payload.minStock) : 'Sin definir',
      minStock: payload.minStock != null ? String(payload.minStock) : 'Sin definir',
      stock: payload.stock != null ? String(payload.stock) : 'Sin definir',
      original_price: payload.originalPrice,
      originalPrice: payload.originalPrice,
      is_popular: Boolean(payload.isPopular),
      isPopular: Boolean(payload.isPopular)
    };

    if (productData.id) {
      // Editar
      setProducts(prev =>
        prev.map(p => (p.id === productData.id ? { ...p, ...payload } : p))
      );
      if (supabase) {
        supabase.from('products').upsert([syncItem]).then(({ error }) => {
          if (error) console.error('Error guardando producto en Supabase:', error);
        });
      }
      showToast(`Producto "${productData.name}" actualizado.`);
    } else {
      // Nuevo - Código auto-incrementable por defecto si el dueño no ingresa uno
      const nextNum = products.length + 1;
      const autoCode = `COD-${String(nextNum).padStart(3, '0')}`;
      const newProd = {
        ...payload,
        id: `${tenantSlug}-prod-${Date.now()}`,
        tenant_id: tenantSlug,
        code: productData.code && productData.code.trim() ? productData.code.trim() : autoCode,
        image: cleanImage
      };
      const newProdSync = {
        ...syncItem,
        id: newProd.id,
        tenant_id: tenantSlug,
        code: newProd.code,
        image: cleanImage
      };
      setProducts(prev => [newProd, ...prev]);
      if (supabase) {
        supabase.from('products').insert([newProdSync]).then(({ error }) => {
          if (error) console.error('Error insertando producto en Supabase:', error);
        });
      }
      showToast(`Nuevo producto "${newProd.name}" creado (${newProd.code}).`);
    }
  };

  const deleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (supabase) {
      supabase.from('products').delete().eq('id', productId).eq('tenant_id', tenantSlug).then(({ error }) => {
        if (error) console.error('Error eliminando producto en Supabase:', error);
      });
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

    // Descontar inventario
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const item = posItems.find(i => i.id === prod.id);
        if (item) {
          return { ...prod, stock: Math.max(0, prod.stock - item.quantity) };
        }
        return prod;
      })
    );

    // Registrar como pedido completado directo
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
      createdAt: new Date().toISOString(),
      pointsEarned: 0
    };

    setOrders(prev => [posOrder, ...prev]);
    if (supabase && tenantSlug) {
      supabase.from('orders').insert([posOrder]).then(({ error }) => {
        if (error) console.error('Error insertando venta POS en Supabase:', error);
      });
    }
    triggerConfetti();
    const currency = storeConfig.currencySymbol || 'Bs.';
    showToast(`Venta de mostrador ${saleId} registrada por ${currency} ${subtotal.toFixed(2)}.`, 'success');
  };

  // Solicitar producto ("Pídelo si no está")
  const submitProductRequest = (customerName, productName, notes) => {
    const newReq = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      tenant_id: tenantSlug,
      customerName: customerName || 'Vecino anónimo',
      productName,
      notes,
      votes: 1,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    setProductRequests(prev => [newReq, ...prev]);
    if (supabase && tenantSlug && tenantSlug !== 'default') {
      supabase.from('product_requests').insert([newReq]).then(({ error }) => {
        if (error) console.error('Error insertando solicitud de producto en Supabase:', error);
      });
    }
    showToast('¡Solicitud enviada! El dueño de la tienda la evaluará pronto.', 'success');
  };

  const voteProductRequest = (requestId) => {
    setProductRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, votes: r.votes + 1 } : r))
    );
    showToast('¡Voto registrado! Entre más vecinos voten, más rápido llegará.', 'success');
  };

  const updateRequestStatus = (requestId, status) => {
    setProductRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status } : r))
    );
    if (supabase && tenantSlug && tenantSlug !== 'default') {
      supabase.from('product_requests').update({ status }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Error actualizando solicitud de producto en Supabase:', error);
      });
    }
    showToast('Estado de solicitud actualizado.');
  };

  // Canjear VeciPuntos por Cupón
  const redeemPoints = (pointsCost, discountValue, couponName) => {
    const currency = storeConfig.currencySymbol || 'Bs.';
    if (veciPoints < pointsCost) {
      showToast('No tienes suficientes VeciPuntos para este cupón.', 'error');
      return false;
    }
    setVeciPoints(prev => prev - pointsCost);
    setAppliedCoupon({
      code: couponName,
      discount: discountValue,
      description: `Descuento de ${currency} ${discountValue.toFixed(2)} por VeciPuntos`
    });
    triggerConfetti();
    showToast(`¡Cupón "${couponName}" canjeado y aplicado a tu carrito!`, 'success');
    return true;
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
      // Validar si ya existe ese slug
      const { data: existing } = await supabase
        .from('store_config')
        .select('id')
        .eq('id', cleanSlug)
        .maybeSingle();

      if (existing) {
        return { data: null, error: { message: `El enlace "${cleanSlug}" ya está en uso. Por favor elige otro.` } };
      }

      const userId = ownerId || currentUser?.id || (await supabase.auth.getUser())?.data?.user?.id || null;

      const { adminPassword, admin_pin, ...baseConfig } = initialStoreConfig;
      const newConfig = {
        ...baseConfig,
        name: storeName,
        tagline: 'Tu tienda de confianza a pasos de tu puerta',
        phone: phone || '',
        whatsapp: whatsapp || phone || '',
        themeColor: themeColor || 'emerald',
        owner_id: userId
      };

      const storeRecord = {
        id: cleanSlug,
        tenant_id: cleanSlug,
        name: storeName,
        slogan: 'Tu tienda de confianza a pasos de tu puerta',
        theme_color: themeColor || 'emerald',
        currency_symbol: 'Bs.',
        is_open: true,
        condominiums: initialStoreConfig.condominiums,
        coupons: [],
        categories: initialStoreConfig.categories,
        payment_methods: initialStoreConfig.paymentMethods,
        config: newConfig,
        owner_id: userId,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('store_config').insert([storeRecord]).select();
      if (error) throw error;

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
        tenantSlug,
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
        categories: initialCategories,
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
        redeemPoints,
        applyCouponCode,
        removeCoupon,
        selectedLocation,
        setSelectedLocation,
        orders,
        createCustomerOrder,
        updateOrderStatus,
        cancelOrder,
        completePosSale,
        saveProduct,
        deleteProduct,
        deleteProductsBatch,
        importProductsBatch,
        veciPoints,
        setVeciPoints,
        productRequests,
        submitProductRequest,
        voteProductRequest,
        updateRequestStatus,
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
