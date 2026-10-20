import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HeroBanner } from './HeroBanner';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';
import { CustomerStoreSchedule } from './CustomerStoreSchedule';
import { CustomerDeliveryScheduleCard } from './CustomerDeliveryScheduleCard';
import { PwaInstallBanner } from './PwaInstallBanner';
import { SearchEmptyState } from './SearchEmptyState/SearchEmptyState';
import { Sparkles, ShoppingBag, ArrowRight, MessageCircle, X, Store, Truck, ChevronLeft, ChevronRight, Clock, Smartphone, Crown, CheckCircle2, PackageCheck, ChevronUp } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { normalizeSearchText } from '../../utils/formatters';
import './CustomerHome.css';

export const CustomerHome = ({ onOpenCart, onOpenRequests, onOpenLocationModal }) => {
  const { 
    products, 
    orders,
    selectedLocation, 
    activeTrackingOrderId, 
    setActiveTrackingOrderId, 
    neighborOrderIds,
    setIsTrackingModalOpen,
    goToDirectory, 
    storeConfig,
    tenantSlug,
    storeOpenStatus,
    isProPlan,
    addToCart,
    showToast
  } = useStore();

  const isProStore = Boolean(storeConfig?.isProStore || isProPlan || String(storeConfig?.plan || storeConfig?.subscription?.plan || '').toLowerCase().includes('pro'));

  const [selectedCategory, setSelectedCategoryState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlCat = params.get('category');
        if (urlCat) return urlCat;
        const saved = localStorage.getItem(`marketsaas_${storeConfig?.id || 'default'}_customer_cat`);
        return saved || 'all';
      } catch (e) {
        return 'all';
      }
    }
    return 'all';
  });

  const setSelectedCategory = (cat) => {
    setSelectedCategoryState(cat);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`marketsaas_${storeConfig?.id || 'default'}_customer_cat`, cat);
        const url = new URL(window.location.href);
        if (cat === 'all') {
          url.searchParams.delete('category');
        } else {
          url.searchParams.set('category', cat);
        }
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        // ignore
      }
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const catalogGridRef = useRef(null);

  // Filtrado reactivo optimizado con useMemo para navegación ultra-ligera en móvil
  const filteredProducts = useMemo(() => {
    const cleanQuery = normalizeSearchText(searchQuery);
    const targetCat = selectedCategory === 'all' ? null : selectedCategory.toLowerCase().trim();

    return products.filter((prod) => {
      if (!prod) return false;
      const prodCat = (prod.category || '').toLowerCase().trim();
      const matchesCategory = !targetCat || prodCat === targetCat;
      if (!matchesCategory) return false;
      if (!cleanQuery) return true;

      return (
        normalizeSearchText(prod.name).includes(cleanQuery) ||
        prodCat.includes(cleanQuery) ||
        normalizeSearchText(prod.code).includes(cleanQuery) ||
        normalizeSearchText(prod.description).includes(cleanQuery)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  // Resetear a la página 1 cuando cambia categoría, búsqueda o cantidad por página
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, startIndex, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (catalogGridRef.current) {
      catalogGridRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Control de visibilidad del botón flotante para volver arriba a la tienda
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleWindowScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  // Transmisión y Chaining fluido de Scroll para el Catálogo de Productos (VISTA VECINO):
  // Al llegar al tope superior de la lista scrolleable del catálogo (scrollTop <= 0) y seguir subiendo
  // (mediante deslizamiento táctil en móviles o rueda/trackpad), el evento transmite el scroll
  // directamente a la página principal para volver a la tienda sin atascos ni zonas muertas.
  useEffect(() => {
    const el = catalogGridRef.current;
    if (!el) return;

    let touchStartY = 0;

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartY - currentY; // > 0: arrastre hacia arriba (bajar), < 0: arrastre hacia abajo (subir)

      // Si el usuario desliza con el dedo hacia abajo para subir la página
      // y la lista del catálogo ya se encuentra en su tope superior (scrollTop <= 0)
      if (deltaY < 0 && el.scrollTop <= 0) {
        window.scrollBy({ top: deltaY, behavior: 'auto' });
      }
      // Si el usuario desliza hacia arriba para bajar la página y la lista ya llegó a su fin
      else if (deltaY > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        window.scrollBy({ top: deltaY, behavior: 'auto' });
      }
      touchStartY = currentY;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [currentPage, itemsPerPage, selectedCategory, filteredProducts]);

  const [isDeliveredSectionOpen, setIsDeliveredSectionOpen] = useState(true);

  // Pedidos entregados legítimos del vecino (en este dispositivo o activos)
  const neighborDeliveredOrders = useMemo(() => {
    const relevantIds = new Set([activeTrackingOrderId, ...(neighborOrderIds || [])].filter(Boolean));
    return (orders || [])
      .filter(o => o && o.status === 'delivered' && (relevantIds.has(o.id) || o.id === activeTrackingOrderId))
      .sort((a, b) => new Date(b.deliveredAt || b.updatedAt || b.createdAt || b.created_at || 0).getTime() - new Date(a.deliveredAt || a.updatedAt || a.createdAt || a.created_at || 0).getTime());
  }, [orders, activeTrackingOrderId, neighborOrderIds]);

  // Pedido activo en curso (pending, preparing, on_the_way)
  const inProgressOrder = useMemo(() => {
    const relevantIds = new Set([activeTrackingOrderId, ...(neighborOrderIds || [])].filter(Boolean));
    return (orders || []).find(
      o => o && (relevantIds.has(o.id) || o.id === activeTrackingOrderId) && ['pending', 'preparing', 'on_the_way'].includes(o.status)
    );
  }, [orders, activeTrackingOrderId, neighborOrderIds]);

  // Pedido recién entregado para banner de felicitación / aviso
  const recentDeliveredOrder = useMemo(() => {
    if (inProgressOrder) return null;
    return (orders || []).find(
      o => o && o.id === activeTrackingOrderId && o.status === 'delivered'
    );
  }, [orders, activeTrackingOrderId, inProgressOrder]);

  const activeOrder = inProgressOrder || recentDeliveredOrder;
  const isDeliveredActive = Boolean(activeOrder && activeOrder.status === 'delivered');
  const isPickup = activeOrder ? (activeOrder.deliveryType === 'pickup' || activeOrder.delivery_type === 'pickup') : false;

  const orderTitle = activeOrder ? (
    isDeliveredActive
      ? isPickup
        ? `¡Tu pedido #${activeOrder.id} ya fue retirado con éxito!`
        : `¡Tu pedido #${activeOrder.id} fue entregado con éxito!`
      : isPickup
        ? activeOrder.status === 'on_the_way'
          ? `¡Tu pedido está listo para recoger! (#${activeOrder.id})`
          : activeOrder.status === 'preparing'
            ? `¡Tu pedido se está preparando! (#${activeOrder.id})`
            : `¡Pedido recibido! (#${activeOrder.id})`
        : activeOrder.status === 'on_the_way'
          ? `¡Tienes un pedido en camino! (#${activeOrder.id})`
          : activeOrder.status === 'preparing'
            ? `¡Tu pedido se está preparando! (#${activeOrder.id})`
            : `¡Pedido recibido! (#${activeOrder.id})`
  ) : '';

  const orderSubtitle = activeOrder ? (
    isDeliveredActive
      ? isPickup
        ? `Pasa a disfrutar de tus productos. ¡Gracias por comprar en ${storeConfig?.name || 'la tienda'}!`
        : `Entregado en tu puerta. ¡Disfruta tus productos frescos del barrio!`
      : isPickup
        ? activeOrder.status === 'on_the_way'
          ? `Pasa a retirarlo por el mostrador de ${storeConfig?.name || 'la tienda'}`
          : activeOrder.status === 'preparing'
            ? `Empacando tus productos para entrega en mostrador`
            : `Esperando confirmación de ${storeConfig?.name || 'la tienda'}`
        : activeOrder.status === 'on_the_way'
          ? `El repartidor va rumbo a ${activeOrder.customer?.address || selectedLocation?.address || 'tu dirección'}`
          : activeOrder.status === 'preparing'
            ? `Empacando tus productos frescos para el despacho`
            : `Esperando confirmación de ${storeConfig?.name || 'la tienda'}`
  ) : '';

  const handleDismissActiveOrder = (e) => {
    e?.stopPropagation?.();
    setActiveTrackingOrderId(null);
    try {
      localStorage.removeItem(`marketsaas_${tenantSlug || storeConfig?.id || 'default'}_active_order`);
      localStorage.removeItem('marketsaas_default_active_order');
    } catch (err) {}
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24">
      {/* Barra de Retorno al Directorio de Tiendas */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={goToDirectory}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer group"
          title="Regresar al mapa y directorio de tiendas"
        >
          <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors">
            🗺️
          </span>
          <span className="group-hover:underline">Cambiar de Tienda / Ver Mapa</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="hidden sm:inline">Comprando en:</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            {storeConfig?.logoUrl ? (
              <img 
                src={storeConfig.logoUrl} 
                alt={storeConfig.name} 
                className="w-4 h-4 rounded-md object-contain bg-white shrink-0 border border-slate-200"
              />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{storeConfig.name}</span>
            {isProStore && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-900 bg-amber-200/90 border border-amber-400 px-1.5 py-0.2 rounded-md shadow-2xs ml-0.5 shrink-0" title="Tienda Oficial con Plan PRO">
                <Crown className="w-2.5 h-2.5 text-amber-800 fill-amber-500" />
                <span>PRO</span>
              </span>
            )}
          </span>
          {(storeConfig.whatsapp || storeConfig.phone) && (
            <a
              href={`https://wa.me/${(storeConfig.whatsapp || storeConfig.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola ${storeConfig.name}! Tengo una consulta sobre los productos de la tienda.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-colors shadow-2xs"
              title="Consultar por WhatsApp a la tienda"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Consultar a la tienda</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          )}

          {/* Botón PWA para Instalar la App del Minimarket */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            title="Instalar la aplicación en tu celular o PC"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
            <span className="sm:hidden">App 📲</span>
          </button>
        </div>
      </div>

      {/* Vista Previa Profesional del Horario de Hoy y Semana Completa (contraída por defecto) */}
      <CustomerStoreSchedule 
        storeConfig={storeConfig} 
        initialExpanded={false} 
      />

      {/* Card / Banner de Horario de Envíos a Domicilio (Motodelivery) */}
      {storeConfig?.enableDelivery !== false && (
        <CustomerDeliveryScheduleCard 
          storeConfig={storeConfig} 
          variant="card" 
        />
      )}

      {/* Banner Superior Principal */}
      <HeroBanner 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenLocationModal={onOpenLocationModal}
      />

      {/* Banner de Pedido en Curso o Pedido Recién Entregado */}
      {activeOrder && (
        <div className={`mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 relative ${
          isDeliveredActive 
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 animate-fadeIn border border-emerald-400/40' 
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 animate-pulse-glow'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold shrink-0">
              {isDeliveredActive ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              ) : isPickup ? (
                <Store className="w-5 h-5 text-white" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-xs sm:text-sm">
                  {orderTitle}
                </p>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {isDeliveredActive ? '✓ Entregado' : isPickup ? 'Mostrador' : 'Delivery'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5">
                {orderSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTrackingOrderId(activeOrder.id);
                setIsTrackingModalOpen(true);
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white text-emerald-900 font-black text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isDeliveredActive ? 'Ver Detalle y Recibo' : 'Ver Seguimiento en Vivo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDismissActiveOrder}
              title="Cerrar aviso"
              className="p-2 rounded-xl bg-black/15 hover:bg-black/25 text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN DE ENTREGADOS: Historial y Lista de Pedidos Entregados del Vecino */}
      {neighborDeliveredOrders.length > 0 && (
        <section className="mb-6 sm:mb-8 rounded-3xl bg-white border border-emerald-200 shadow-sm p-4 sm:p-5 space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center font-bold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Pedidos Entregados
                  </h3>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                    {neighborDeliveredOrders.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Registro de tus pedidos despachados y recibidos exitosamente
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDeliveredSectionOpen(prev => !prev)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
            >
              <span>{isDeliveredSectionOpen ? 'Ocultar' : 'Ver pedidos'}</span>
              <span className={`text-[10px] transform transition-transform ${isDeliveredSectionOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
          </div>

          {isDeliveredSectionOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {neighborDeliveredOrders.map(order => {
                const isPickup = order.deliveryType === 'pickup' || order.delivery_type === 'pickup';
                const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
                const currency = storeConfig?.currencySymbol || 'Bs.';
                const orderDate = order.deliveredAt || order.updatedAt || order.createdAt || order.created_at;

                return (
                  <div 
                    key={order.id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-black text-slate-900">
                              #{order.id}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{isPickup ? 'Retirado en Tienda' : 'Entregado'}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {orderDate ? new Date(orderDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Hoy'}
                          </p>
                        </div>

                        <span className="text-sm sm:text-base font-black text-emerald-800 whitespace-nowrap">
                          {currency} {Number(order.total || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Lista resumida de productos */}
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}:
                        </p>
                        <p className="text-xs font-medium text-slate-800 line-clamp-2">
                          {(order.items || []).map(it => `${it.quantity || 1}x ${it.name}`).join(' • ') || 'Abarrotes variados'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTrackingOrderId(order.id);
                          setIsTrackingModalOpen(true);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Ver Seguimiento en Vivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (Array.isArray(order.items)) {
                            let addedCount = 0;
                            order.items.forEach(it => {
                              const existingProd = products.find(p => p.id === it.id);
                              if (existingProd) {
                                addToCart?.(existingProd, it.quantity || 1);
                                addedCount++;
                              }
                            });
                            if (addedCount > 0) {
                              showToast?.('Productos agregados nuevamente a tu canasta', 'success');
                              onOpenCart?.();
                            } else {
                              showToast?.('Los productos ya no se encuentran en catálogo', 'warning');
                            }
                          }
                        }}
                        className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer shrink-0"
                        title="Volver a pedir estos mismos productos"
                      >
                        Repetir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Barra de Categorías */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Catálogo de Productos Principal */}
      <section id="products-catalog-section" className="scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {selectedCategory === 'all' ? 'Todo el Catálogo' : selectedCategory}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {filteredProducts.length === 1 
                ? '1 producto encontrado' 
                : `${filteredProducts.length} productos encontrados`}
            </p>
          </div>

          {/* Selector de cantidad por página (16, 32, 50) */}
          {filteredProducts.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-2 pr-1">
                Por pág:
              </span>
              <div className="flex items-center gap-1">
                {[16, 32, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setItemsPerPage(num)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      itemsPerPage === num
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <SearchEmptyState
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            storeConfig={storeConfig}
            onClearFilter={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            onRequestProduct={(term) => onOpenRequests(term || searchQuery || '')}
          />
        ) : (
          <>
            {/* Contenedor scrolleable del catálogo para no alargar la pantalla */}
            <div 
              ref={catalogGridRef}
              className="max-h-[580px] sm:max-h-[700px] overflow-y-auto overscroll-y-auto touch-pan-y pr-1 sm:pr-2 pb-2 scroll-smooth rounded-2xl focus:outline-none catalog-scroll-container"
              tabIndex={0}
              aria-label="Lista de productos del catálogo"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-1">
                {paginatedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onOpenDetail={(p) => setSelectedProduct(p)}
                    onRequestProduct={onOpenRequests}
                  />
                ))}
              </div>
            </div>

            {/* Barra de Paginación */}
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                Mostrando <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> de <span className="font-bold text-slate-800">{filteredProducts.length}</span> productos
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <div className="px-3 py-1.5 text-xs font-extrabold text-slate-700 bg-slate-100 rounded-xl border border-slate-200/60">
                  Página {currentPage} de {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Página Siguiente"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Modal de Detalle de Producto */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onRequestProduct={onOpenRequests}
        />
      )}

      {/* Banner PWA: Instalar en el Celular con 1 Clic */}
      <PwaInstallBanner storeName={storeConfig?.name || 'tu tienda'} />

      {/* Botón Flotante para Volver a la Tienda cuando se hace scroll hacia abajo */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (catalogGridRef.current) {
              catalogGridRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-700/60 flex items-center gap-2 text-xs font-extrabold transition-all cursor-pointer hover:scale-105 active:scale-95 animate-fadeIn select-none"
          title="Subir a la Tienda"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ChevronUp className="w-4 h-4" />
          </div>
          <span>Subir a la Tienda</span>
        </button>
      )}
    </main>
  );
};
