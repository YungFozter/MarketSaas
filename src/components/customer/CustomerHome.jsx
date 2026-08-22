import React, { useState } from 'react';
import { HeroBanner } from './HeroBanner';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';
import { Sparkles, Flame, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CustomerHome = ({ onOpenCart, onOpenPoints, onOpenRequests, onOpenLocationModal }) => {
  const { products, selectedLocation, activeTrackingOrderId, setActiveTrackingOrderId } = useStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filtrado
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const popularProducts = products.filter(p => p.isPopular).slice(0, 4);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Banner Superior Principal */}
      <HeroBanner 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenLocationModal={onOpenLocationModal}
        onOpenPoints={onOpenPoints}
      />

      {/* Banner de Pedido en Curso si existe */}
      {activeTrackingOrderId && (
        <div className="mb-8 p-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex flex-wrap items-center justify-between gap-3 animate-pulse-glow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm">¡Tienes un pedido en preparación (#{activeTrackingOrderId})!</p>
              <p className="text-xs text-emerald-100 font-medium">Revisa en qué etapa viene hacia {selectedLocation.condominium}</p>
            </div>
          </div>
          <button
            onClick={() => {}}
            className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-black text-xs shadow-md hover:bg-emerald-50 transition-colors flex items-center gap-1"
          >
            <span>Ver Seguimiento en Vivo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Categorías */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Sección de "Más Populares / Favoritos del Barrio" cuando no hay búsqueda activa y está en 'all' */}
      {selectedCategory === 'all' && searchQuery.trim() === '' && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Favoritos de los Vecinos
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Lo más pedido esta semana
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenDetail={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Catálogo de Productos Principal */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {selectedCategory === 'all' ? 'Todo el Catálogo' : selectedCategory}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {filteredProducts.length} productos encontrados
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base mb-1">No encontramos productos con ese filtro</h3>
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
                onClick={onOpenRequests}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
              >
                Pídelo a la tienda
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenDetail={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal de Detalle de Producto */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
};
