import React, { useState, useEffect, useRef } from 'react';
import { HeroBanner } from './HeroBanner';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';
import { Sparkles, ShoppingBag, ArrowRight, MessageCircle, X, Store, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
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
    setIsTrackingModalOpen,
    goToDirectory, 
    storeConfig,
    tenantSlug
  } = useStore();

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

  // Filtrado
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = 
      selectedCategory === 'all' || 
      prod.category === selectedCategory || 
      (prod.category && selectedCategory && prod.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
    const cleanQuery = normalizeSearchText(searchQuery);
    if (!cleanQuery) return matchesCategory;

    const matchesSearch = 
      normalizeSearchText(prod.name).includes(cleanQuery) ||
      normalizeSearchText(prod.category).includes(cleanQuery) ||
      normalizeSearchText(prod.code).includes(cleanQuery) ||
      normalizeSearchText(prod.description).includes(cleanQuery);

    return matchesCategory && matchesSearch;
  });

  // Resetear a la página 1 cuando cambia categoría, búsqueda o cantidad por página
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (catalogGridRef.current) {
      catalogGridRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Pedido activo real y en curso
  const activeOrder = orders?.find(
    o => o.id === activeTrackingOrderId && ['pending', 'preparing', 'on_the_way'].includes(o.status)
  );

  const isPickup = activeOrder ? (activeOrder.deliveryType === 'pickup' || activeOrder.delivery_type === 'pickup') : false;

  const orderTitle = activeOrder ? (
    isPickup
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
    isPickup
      ? activeOrder.status === 'on_the_way'
        ? `Pasa a retirarlo por el mostrador de ${storeConfig?.name || 'la tienda'}`
        : activeOrder.status === 'preparing'
          ? `Empacando tus productos para entrega en mostrador`
          : `Esperando confirmación de ${storeConfig?.name || 'la tienda'}`
      : activeOrder.status === 'on_the_way'
        ? `El repartidor va rumbo a ${activeOrder.customer?.condominium || activeOrder.customer?.apartment || selectedLocation?.condominium || 'tu dirección'}`
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
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {storeConfig.name}
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
        </div>
      </div>

      {/* Banner Superior Principal */}
      <HeroBanner 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenLocationModal={onOpenLocationModal}
      />

      {/* Banner de Pedido en Curso si existe */}
      {activeOrder && (
        <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse-glow relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold shrink-0">
              {isPickup ? <Store className="w-5 h-5 text-white" /> : <ShoppingBag className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-xs sm:text-sm">
                  {orderTitle}
                </p>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {isPickup ? 'Mostrador' : 'Delivery'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5">
                {orderSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsTrackingModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white text-emerald-900 font-black text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Ver Seguimiento en Vivo</span>
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
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto my-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mb-1">No encontramos productos con ese filtro</h3>
            <p className="text-xs text-slate-500 mb-5">
              ¿Buscabas algo específico? Pídelo al dueño y lo agregaremos pronto al stock.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Ver todos los productos
              </button>
              <button
                onClick={() => onOpenRequests('')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Pídelo a la tienda
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Contenedor scrolleable del catálogo para no alargar la pantalla */}
            <div 
              ref={catalogGridRef}
              className="max-h-[580px] sm:max-h-[700px] overflow-y-auto pr-1 sm:pr-2 pb-2 scroll-smooth rounded-2xl focus:outline-none catalog-scroll-container"
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
    </main>
  );
};
