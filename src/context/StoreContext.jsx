import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialProducts, initialCategories, initialStoreConfig, initialOrders, initialProductRequests } from '../data/initialData';
import confetti from 'canvas-confetti';
import { supabase } from '../services/supabaseClient';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  // Identificador de Tienda Multi-Tenant (ej. ?store=donpepe o ?tenant=central)
  const getInitialTenantSlug = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('store') || params.get('tenant') || localStorage.getItem('marketsaas_active_tenant') || 'default';
  };
  const [tenantSlug, setTenantSlug] = useState(getInitialTenantSlug);

  // Estados de Autenticación de Dueño
  const [currentUser, setCurrentUser] = useState(null);
  const [merchantStore, setMerchantStore] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 1. Vista actual: Al abrir el enlace principal (https://marketsaas.onrender.com),
  // SIEMPRE la primera pantalla es la Informativa ("Vista Espectador").
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') && ['spectator', 'customer', 'admin'].includes(params.get('view'))) {
        return params.get('view');
      }
      if (params.get('store') || params.get('tenant')) {
        return 'customer';
      }
    }
    return 'spectator';
  });

  // 2. Productos
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_products`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(prod => {
          if (prod.id === 'prod-1' || prod.name?.toLowerCase().includes('leche entera') || prod.name?.toLowerCase().includes('pil leche')) {
            return {
              ...prod,
              id: 'prod-1',
              name: 'Pil Leche Fresca Natural 946 ml',
              category: 'Lácteos & Huevos',
              price: 8.00,
              originalPrice: 8.50,
              unit: 'Bolsa 946 ml',
              image: '/products/leche-pil.png',
              description: 'Leche fluida ultrapasteurizada y homogeneizada Pil, con 2.7% de materia grasa natural. Nutritiva y fresca, ideal para el desayuno familiar y recetas diarias.',
              badge: 'Ahorro Pack'
            };
          }
          if (prod.id === 'prod-7' || prod.name?.toLowerCase().includes('spaghetti')) {
            return {
              ...prod,
              id: 'prod-7',
              name: 'Fideos Lazzaroni Cortos 1 Kg',
              category: 'Abarrotes',
              price: 1.15,
              unit: 'Bolsa 1 Kg',
              image: '/products/fideos-lazzaroni.png',
              description: 'Pasta corta de sémola de trigo seleccionada Lazzaroni, ideal para sopas y guisos.'
            };
          }
          if (prod.id === 'prod-10' || prod.name?.toLowerCase().includes('manantial') || prod.name?.toLowerCase().includes('vital')) {
            return {
              ...prod,
              id: 'prod-10',
              name: 'Agua Vital sin Gas 600 ml',
              category: 'Bebidas & Licores',
              price: 0.80,
              unit: 'Botella 600 ml',
              image: '/products/agua-vital-600ml.png',
              description: 'Agua purificada de mesa Vital sin gas en botella de 600 ml. Hidratación pura, ligera y refrescante para cualquier momento del día.',
              badge: 'Hidratación'
            };
          }
          if (prod.id === 'prod-11' || prod.name?.toLowerCase().includes('cola clásica') || prod.name?.toLowerCase().includes('coca-cola')) {
            return {
              ...prod,
              id: 'prod-11',
              name: 'Soda Coca-Cola 2 L',
              category: 'Bebidas & Licores',
              price: 2.50,
              unit: 'Botella 2L',
              image: '/products/coca-cola-2l.png',
              description: 'Bebida gaseosa Coca-Cola Sabor Original en botella familiar de 2 Litros. El refresco ideal para acompañar tus comidas y compartir en familia.',
              badge: 'Bien Helada'
            };
          }
          if (prod.id === 'prod-12' || prod.name?.toLowerCase().includes('papas fritas') || prod.name?.toLowerCase().includes('lays')) {
            return {
              ...prod,
              id: 'prod-12',
              name: 'Papas Lays Clásicas Bolsa Pequeña',
              category: 'Snacks & Golosinas',
              price: 1.50,
              unit: 'Bolsa 70g',
              image: '/products/lays-clasicas.png',
              description: 'Papas fritas Lay\'s Clásicas crocantes con el toque justo de sal en práctica bolsa de 70g. El snack perfecto para disfrutar a cualquier hora.',
              badge: 'Favorito Vecinos'
            };
          }
          if (prod.id === 'prod-13' || prod.name?.toLowerCase().includes('detergente') || prod.name?.toLowerCase().includes('omo')) {
            return {
              ...prod,
              id: 'prod-13',
              name: 'Detergente Omo Limon Con Jabón 1.8K',
              category: 'Limpieza & Hogar',
              price: 4.90,
              unit: 'Bolsa 1.8 Kg',
              image: '/products/omo-limon-1.8k.png',
              description: 'Detergente en polvo Omo Limón con bicarbonato y fórmula con el poder del jabón en bolsa de 1.8 kg. Remueve las manchas más difíciles en el primer lavado dejando un aroma fresco.',
              badge: 'Máximo Ahorro'
            };
          }
          if (prod.id === 'prod-14' || prod.name?.toLowerCase().includes('papel higi') || prod.name?.toLowerCase().includes('nacional selecto')) {
            return {
              ...prod,
              id: 'prod-14',
              name: 'Nacional Selecto Papel Higienico Th 3D X 6 Unidades',
              category: 'Limpieza & Hogar',
              price: 3.50,
              unit: 'Pack 6 rollos x 30m',
              image: '/products/papel-nacional-selecto-6u.jpg',
              description: 'Papel higiénico Nacional Selecto Triple Hoja con tecnología 3D acolchonada en pack de 6 unidades x 30 metros. Máxima suavidad, resistencia y rendimiento para el hogar.',
              badge: 'Básico del Hogar'
            };
          }
          return prod;
        });
      } catch (e) {
        return initialProducts;
      }
    }
    return initialProducts;
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
        if (parsed.defaultDeliveryFee === undefined || parsed.defaultDeliveryFee === 5.00) {
          parsed.defaultDeliveryFee = 0.00;
        }
        if (Array.isArray(parsed.condominiums)) {
          parsed.condominiums = parsed.condominiums.map(c => ({
            ...c,
            deliveryFee: c.deliveryFee === 5.00 || c.deliveryFee === 7.00 || c.deliveryFee === 8.00 ? 0.00 : c.deliveryFee
          }));
        }
        return { ...initialStoreConfig, ...parsed };
      } catch (e) {
        return initialStoreConfig;
      }
    }
    return initialStoreConfig;
  });

  const setStoreConfig = (newConfigData) => {
    const updated = typeof newConfigData === 'function' ? newConfigData(storeConfig) : newConfigData;
    setStoreConfigState(updated);
    if (supabase) {
      const payload = {
        id: tenantSlug,
        tenant_id: tenantSlug,
        name: updated.name || 'Tienda',
        config: updated,
        owner_id: currentUser?.id || merchantStore?.owner_id || null,
        updated_at: new Date().toISOString()
      };
      supabase.from('store_config').upsert([payload]).then(({ error }) => {
        if (error) console.error('Error sincronizando storeConfig en Supabase:', error);
      });
    }
  };

  // 4. Carrito de Compras
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_cart`);
    return saved ? JSON.parse(saved) : [];
  });

  // 5. Ubicación seleccionada por el cliente
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_location`);
    return saved ? JSON.parse(saved) : {
      condominium: initialStoreConfig.condominiums[0].name,
      tower: initialStoreConfig.condominiums[0].towers[0],
      apartment: 'Depto 302',
      notes: ''
    };
  });

  // 6. Pedidos
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_orders`);
    return saved ? JSON.parse(saved) : initialOrders;
  });

  // 7. Puntos de Fidelidad / VeciPuntos del cliente
  const [veciPoints, setVeciPoints] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_points`);
    return saved ? parseInt(saved, 10) : 340;
  });

  // 8. Solicitudes de productos ("Pídelo si no está")
  const [productRequests, setProductRequests] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_requests`);
    return saved ? JSON.parse(saved) : initialProductRequests;
  });

  // 9. Cupones de descuento aplicados
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // 10. Pedido activo para seguimiento
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);

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
        setStoreConfigState(prev => ({ ...prev, ...configData, name: storeRecord.name || configData.name }));
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

  // Cargar datos de Supabase reactivamente cada vez que cambia tenantSlug
  useEffect(() => {
    if (!supabase) return;

    // 1. Cargar productos por tienda
    supabase.from('products').select('*').then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const filtered = data.filter(p => !p.tenant_id || p.tenant_id === tenantSlug);
        if (filtered.length > 0) setProducts(filtered);
      }
    });

    // 2. Cargar storeConfig por tienda
    supabase.from('store_config').select('*').eq('id', tenantSlug).maybeSingle().then(({ data, error }) => {
      if (!error && data) {
        const loadedConfig = data.config || data;
        const { id, tenant_id, ...configData } = loadedConfig;
        setStoreConfigState(prev => ({ ...prev, ...configData, name: data.name || configData.name }));
      }
    });

    // 3. Cargar pedidos por tienda
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const filtered = data.filter(o => !o.tenant_id || o.tenant_id === tenantSlug);
        if (filtered.length > 0) setOrders(filtered);
      }
    });

    // 4. Cargar solicitudes de productos por tienda
    supabase.from('product_requests').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const filtered = data.filter(r => !r.tenant_id || r.tenant_id === tenantSlug);
        if (filtered.length > 0) setProductRequests(filtered);
      }
    });

    // Subscripciones en Tiempo Real (Realtime) para Pedidos y Productos
    const ordersChannel = supabase
      .channel(`public:orders:${tenantSlug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          if (!payload.new.tenant_id || payload.new.tenant_id === tenantSlug) {
            setOrders(prev => [payload.new, ...prev.filter(o => o.id !== payload.new.id)]);
          }
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => (o.id === payload.new.id ? payload.new : o)));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    const productsChannel = supabase
      .channel(`public:products:${tenantSlug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        if (payload.eventType === 'INSERT') {
          if (!payload.new.tenant_id || payload.new.tenant_id === tenantSlug) {
            setProducts(prev => [payload.new, ...prev.filter(p => p.id !== payload.new.id)]);
          }
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => (p.id === payload.new.id ? payload.new : p)));
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

  // Guardar en localStorage por tenantSlug
  useEffect(() => {
    localStorage.setItem(`marketsaas_${tenantSlug}_viewMode`, viewMode);
  }, [viewMode, tenantSlug]);

  // Invalidación automática de caché local para asegurar que los usuarios siempre vean los productos actualizados
  const CURRENT_SCHEMA_VER = '2026-09-04-v6-bolivian-prices';
  useEffect(() => {
    try {
      const storedVer = localStorage.getItem('marketsaas_catalog_version');
      if (storedVer !== CURRENT_SCHEMA_VER) {
        localStorage.setItem('marketsaas_catalog_version', CURRENT_SCHEMA_VER);
        setProducts(initialProducts);
        setStoreConfigState(initialStoreConfig);
        localStorage.setItem(`marketsaas_${tenantSlug}_products`, JSON.stringify(initialProducts));
        localStorage.setItem(`marketsaas_${tenantSlug}_config`, JSON.stringify(initialStoreConfig));
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
    localStorage.setItem(`marketsaas_${tenantSlug}_cart`, JSON.stringify(cart));
  }, [cart, tenantSlug]);

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
    localStorage.setItem(`marketsaas_${tenantSlug}_requests`, JSON.stringify(productRequests));
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
    const payload = { ...productData, tenant_id: tenantSlug };
    if (productData.id) {
      // Editar
      setProducts(prev =>
        prev.map(p => (p.id === productData.id ? { ...p, ...payload } : p))
      );
      if (supabase) {
        supabase.from('products').upsert([payload]).then(({ error }) => {
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
        id: `prod-${Date.now()}`,
        code: productData.code && productData.code.trim() ? productData.code.trim() : autoCode,
        image: productData.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
      };
      setProducts(prev => [newProd, ...prev]);
      if (supabase) {
        supabase.from('products').insert([newProd]).then(({ error }) => {
          if (error) console.error('Error insertando producto en Supabase:', error);
        });
      }
      showToast(`Nuevo producto "${newProd.name}" creado (${newProd.code}).`);
    }
  };

  const deleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (supabase) {
      supabase.from('products').delete().eq('id', productId).then(({ error }) => {
        if (error) console.error('Error eliminando producto en Supabase:', error);
      });
    }
    showToast('Producto eliminado del catálogo.', 'warning');
  };

  // Venta en POS de Mostrador (Dueño)
  const completePosSale = (posItems, paymentType = 'cash') => {
    const subtotal = posItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const saleId = `POS-${Math.floor(1000 + Math.random() * 9000)}`;

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
    if (supabase) {
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

      const newConfig = {
        ...initialStoreConfig,
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
        admin_pin: '1234',
        condominiums: initialStoreConfig.condominiums,
        coupons: initialStoreConfig.coupons,
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

      // Sembrar catálogo inicial para esta tienda si se desea
      const seededProducts = initialProducts.map(p => ({
        id: `${cleanSlug}-${p.id}`,
        tenant_id: cleanSlug,
        name: p.name,
        category: p.category,
        price: p.price,
        original_price: p.originalPrice || p.price,
        unit: p.unit,
        stock: p.stock,
        image: p.image,
        badge: p.badge || null,
        is_active: true,
        code: p.code
      }));

      await supabase.from('products').insert(seededProducts);
      setProducts(seededProducts);

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
    setViewMode('customer');
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
        veciPoints,
        productRequests,
        submitProductRequest,
        voteProductRequest,
        updateRequestStatus,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
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
