import React from 'react';
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

export const CategoryBar = ({ selectedCategory, onSelectCategory }) => {
  const { categories, products } = useStore();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span>Categorías de la Tienda</span>
        </h2>
        <span className="text-xs text-slate-500 font-medium">
          {products.length} productos en stock
        </span>
      </div>

      {/* Barra de scroll horizontal limpia */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar touch-pan-x scroll-smooth">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === 'all'
            ? products.length
            : products.filter(p => p.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shrink-0 border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-2xs'
              }`}
            >
              <span className={`p-1 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-emerald-700'}`}>
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
    </div>
  );
};
