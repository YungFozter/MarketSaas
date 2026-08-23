import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialProducts, initialCategories, initialStoreConfig, initialOrders, initialProductRequests } from '../data/initialData';
import confetti from 'canvas-confetti';
import { supabase } from '../supabaseClient';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  // Identificador de Tienda Multi-Tenant (ej. ?store=donpepe o ?tenant=central)
  const getTenantSlug = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('store') || params.get('tenant') || 'default';
  };
  const tenantSlug = getTenantSlug();

  // 1. Vista actual: 'customer' o 'admin'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem(`marketsaas_${tenantSlug}_viewMode`) || 'customer';
  });

  // 2. Productos
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_products`);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  // 3. Configuración de Tienda
  const [storeConfig, setStoreConfig] = useState(() => {
    const saved = localStorage.getItem(`marketsaas_${tenantSlug}_config`);
    return saved ? JSON.parse(saved) : initialStoreConfig;
  });

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

  // Cargar datos de Supabase filtrados por tenantSlug si está configurado
  useEffect(() => {
    if (!supabase) return;

    // 1. Cargar productos
    supabase.from('products').select('*').eq('tenant_id', tenantSlug).then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setProducts(data);
      }
    });

    // 2. Cargar storeConfig
    supabase.from('store_config').select('*').eq('id', tenantSlug).single().then(({ data, error }) => {
      if (!error && data) {
        const { id, ...configData } = data;
        setStoreConfig(prev => ({ ...prev, ...configData }));
      }
    });

    // 3. Cargar pedidos
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setOrders(data);
      }
    });

    // 4. Cargar solicitudes de productos
    supabase.from('product_requests').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setProductRequests(data);
      }
    });

    // Subscripciones en Tiempo Real (Realtime) para Pedidos y Productos
    const ordersChannel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
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
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [payload.new, ...prev.filter(p => p.id !== payload.new.id)]);
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
  }, []);

  // Guardar en localStorage por tenantSlug
  useEffect(() => {
    localStorage.setItem(`marketsaas_${tenantSlug}_viewMode`, viewMode);
  }, [viewMode, tenantSlug]);

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
  const currentCondo = storeConfig.condominiums.find(c => c.name === selectedLocation.condominium);
  const deliveryFeeBase = currentCondo ? currentCondo.deliveryFee : storeConfig.defaultDeliveryFee;
  const isFreeDelivery = cartSubtotal >= storeConfig.freeDeliveryThreshold;
  const actualDeliveryFee = isFreeDelivery ? 0 : deliveryFeeBase;

  // Total final
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const cartTotal = Math.max(0, cartSubtotal + actualDeliveryFee - discountAmount);

  // Crear Pedido desde la vista de Cliente
  const createCustomerOrder = (orderData) => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const earnedPoints = Math.round(cartSubtotal * storeConfig.pointsRatio);

    const newOrder = {
      id: orderId,
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
    if (productData.id) {
      // Editar
      setProducts(prev =>
        prev.map(p => (p.id === productData.id ? { ...p, ...productData } : p))
      );
      if (supabase) {
        supabase.from('products').upsert([productData]).then(({ error }) => {
          if (error) console.error('Error guardando producto en Supabase:', error);
        });
      }
      showToast(`Producto "${productData.name}" actualizado.`);
    } else {
      // Nuevo
      const newProd = {
        ...productData,
        id: `prod-${Date.now()}`,
        code: productData.code || `780${Math.floor(10000000 + Math.random() * 90000000)}`,
        image: productData.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
      };
      setProducts(prev => [newProd, ...prev]);
      if (supabase) {
        supabase.from('products').insert([newProd]).then(({ error }) => {
          if (error) console.error('Error insertando producto en Supabase:', error);
        });
      }
      showToast(`Nuevo producto "${newProd.name}" creado.`);
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
    showToast(`Venta de mostrador ${saleId} registrada por $${subtotal.toFixed(2)}.`, 'success');
  };

  // Solicitar producto ("Pídelo si no está")
  const submitProductRequest = (customerName, productName, notes) => {
    const newReq = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName || 'Vecino anónimo',
      productName,
      notes,
      votes: 1,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    setProductRequests(prev => [newReq, ...prev]);
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
    if (veciPoints < pointsCost) {
      showToast('No tienes suficientes VeciPuntos para este cupón.', 'error');
      return false;
    }
    setVeciPoints(prev => prev - pointsCost);
    setAppliedCoupon({
      code: couponName,
      discount: discountValue,
      description: `Descuento de $${discountValue.toFixed(2)} por VeciPuntos`
    });
    triggerConfetti();
    showToast(`¡Cupón "${couponName}" canjeado y aplicado a tu carrito!`, 'success');
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Cupón removido.', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        tenantSlug,
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
