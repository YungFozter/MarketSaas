import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Search, 
  CheckCircle2, 
  ShoppingBag, 
  Loader2, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { seedProductsCatalog } from '../../../data/seedProductsData';
import { normalizeSearchText } from '../../../utils/formatters';
import './SeedCatalogModal.css';

export const SeedCatalogModal = ({ 
  isOpen, 
  onClose, 
  onImportBatch, 
  currency = 'Bs.',
  triggerConfetti 
}) => {
  const [selectedItems, setSelectedItems] = useState(() => {
    // Por defecto todos seleccionados
    return seedProductsCatalog.map((_, idx) => idx);
  });
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Categorías presentes en el pack semilla
  const categories = useMemo(() => {
    const cats = Array.from(new Set(seedProductsCatalog.map(p => p.category)));
    return ['all', ...cats];
  }, []);

  // Filtrado reactivo de productos
  const filteredCatalog = useMemo(() => {
    return seedProductsCatalog.map((p, originalIndex) => ({ ...p, originalIndex })).filter(item => {
      if (selectedCat !== 'all' && item.category !== selectedCat) {
        return false;
      }
      if (searchTerm.trim()) {
        const normQuery = normalizeSearchText(searchTerm);
        const normName = normalizeSearchText(item.name);
        const normCat = normalizeSearchText(item.category);
        return normName.includes(normQuery) || normCat.includes(normQuery);
      }
      return true;
    });
  }, [selectedCat, searchTerm]);

  if (!isOpen) return null;

  const handleToggleSelect = (originalIndex) => {
    setSelectedItems(prev => 
      prev.includes(originalIndex) 
        ? prev.filter(i => i !== originalIndex) 
        : [...prev, originalIndex]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleOriginalIndices = filteredCatalog.map(p => p.originalIndex);
    const allVisibleSelected = visibleOriginalIndices.every(i => selectedItems.includes(i));

    if (allVisibleSelected) {
      setSelectedItems(prev => prev.filter(i => !visibleOriginalIndices.includes(i)));
    } else {
      setSelectedItems(prev => Array.from(new Set([...prev, ...visibleOriginalIndices])));
    }
  };

  const handleConfirmImport = async () => {
    if (selectedItems.length === 0 || isImporting) return;

    setIsImporting(true);
    try {
      const itemsToImport = selectedItems.map(idx => {
        const raw = seedProductsCatalog[idx];
        const uniqueId = `seed-${idx + 1}-${Date.now().toString(36)}`;
        return {
          ...raw,
          id: uniqueId,
          code: `SKU-${1000 + idx}`,
          costPrice: raw.costPrice,
          originalPrice: raw.price,
          isActive: true
        };
      });

      await onImportBatch(itemsToImport);
      if (triggerConfetti) triggerConfetti();
      onClose();
    } catch (e) {
      console.error('Error importando catálogo semilla:', e);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs seed-modal-overlay">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden seed-modal-content">
        
        {/* Cabecera del Modal con Gradiente */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-black uppercase tracking-wider mb-2 border border-white/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Carga Rápida en 1 Clic</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Pack Inicial de Barrio (50 Productos Esenciales)
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
            Añade al instante los 50 productos de mayor rotación en Santa Cruz con fotos, categorías y precios sugeridos listos. Podrás editarlos cuando desees.
          </p>
        </div>

        {/* Barra de Filtros, Búsqueda y Selección */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Input de Búsqueda dentro del pack */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el pack semilla (ej. Coca-Cola, Leche, Pan...)"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* Botón Seleccionar / Deseleccionar Todos */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
            >
              {filteredCatalog.every(p => selectedItems.includes(p.originalIndex)) 
                ? 'Deseleccionar Visibles' 
                : 'Seleccionar Todos'}
            </button>

            <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-200">
              {selectedItems.length} seleccionados
            </span>
          </div>
        </div>

        {/* Píldoras de Categorías */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? `Todas (${seedProductsCatalog.length})` : cat}
            </button>
          ))}
        </div>

        {/* Lista scrolleable de Productos */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[420px]">
          {filteredCatalog.map((item) => {
            const isSelected = selectedItems.includes(item.originalIndex);
            return (
              <div
                key={item.originalIndex}
                onClick={() => handleToggleSelect(item.originalIndex)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Checkbox visual */}
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                    isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Foto del Producto */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                    loading="lazy"
                  />

                  {/* Datos del Producto */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      {item.badge && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-emerald-700 bg-emerald-100/50 px-1.5 py-0.2 rounded">
                        {item.category}
                      </span>
                      <span>•</span>
                      <span>Stock inicial: {item.stock}</span>
                    </div>
                  </div>
                </div>

                {/* Precios */}
                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-black text-slate-900 block">
                    {currency} {item.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Costo sugerido: {currency} {item.costPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Barra de Acción Inferior */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Los productos se añadirán a tu catálogo y podrás editar sus precios en cualquier momento.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedItems.length === 0 || isImporting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importando al catálogo...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Importar {selectedItems.length} Productos</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
