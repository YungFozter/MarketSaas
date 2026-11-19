import React, { useMemo } from 'react';
import { 
  Sparkles, 
  Milk, 
  Croissant, 
  Package, 
  Apple, 
  Coffee, 
  Cookie, 
  Sparkle, 
  Layers 
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './CategoryBar.css';

const iconMap = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Milk: <Milk className="w-4 h-4" />,
  Croissant: <Croissant className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  Apple: <Apple className="w-4 h-4" />,
  Coffee: <Coffee className="w-4 h-4" />,
  Cookie: <Cookie className="w-4 h-4" />,
  Sparkle: <Sparkle className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />
};

export const CategoryBar = React.memo(({ selectedCategory, onSelectCategory }) => {
  const { categories = [], products = [] } = useStore();

  // Diccionario precalculado O(1) de cantidad de productos por categoría
  const categoryCounts = useMemo(() => {
    const counts = { all: products.length };
    products.forEach((p) => {
      if (!p) return;
      const cat = (p.category || '').toLowerCase().trim();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <section aria-label="Categorías de la tienda" className="mb-5">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
          Categorías
        </h2>
        <span className="text-xs text-slate-500 font-semibold">
          {products.length} {products.length === 1 ? 'producto' : 'productos'} en stock
        </span>
      </div>

      {/* Barra de scroll horizontal limpia con snap y deslizamiento táctil nativo */}
      <div className="category-bar-scroller" role="group" aria-label="Filtrar por categoría">
        {categories.map((cat) => {
          const catIdNorm = (cat.id || '').toLowerCase().trim();
          const isSelected = selectedCategory === cat.id || (selectedCategory !== 'all' && selectedCategory?.toLowerCase()?.trim() === catIdNorm);
          const count = cat.count !== undefined
            ? cat.count
            : (cat.id === 'all'
              ? products.length
              : (categoryCounts[catIdNorm] || 0));

          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={`category-pill-button flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm border cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs'
              }`}
            >
              <span className={`p-1 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-emerald-700'}`} aria-hidden="true">
                {iconMap[cat.icon] || <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </span>
              <span>{cat.name}</span>
              <span
                className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
});
