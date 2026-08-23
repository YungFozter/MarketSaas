import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  DollarSign, 
  Percent, 
  X, 
  Image as ImageIcon,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const InventoryManager = () => {
  const { products, categories, saveProduct, deleteProduct, showToast } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null); // null = modal cerrado
  const [isNew, setIsNew] = useState(false);

  const filteredProducts = products.filter((prod) => {
    const matchesCat = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenNew = () => {
    setIsNew(true);
    setEditingProduct({
      name: '',
      code: `780${Math.floor(10000000 + Math.random() * 90000000)}`,
      category: 'Abarrotes',
      price: 1.50,
      originalPrice: 1.50,
      costPrice: 0.90,
      stock: 20,
      minStock: 5,
      unit: 'Unidad',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      description: 'Producto fresco de alta calidad para la despensa del hogar.',
      badge: '',
      isPopular: false
    });
  };

  const handleOpenEdit = (product) => {
    setIsNew(false);
    setEditingProduct({ ...product });
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!editingProduct.name.trim()) {
      showToast('Ingresa el nombre del producto', 'warning');
      return;
    }
    saveProduct(editingProduct);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>Catálogo & Gestión de Inventario</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controla precios, costos de compra, márgenes de ganancia y existencias en tiempo real.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, SKU o categoría..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.filter(c => c.id !== 'all').map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">Categoría / SKU</th>
                <th className="py-3.5 px-4">Costo Compra</th>
                <th className="py-3.5 px-4">Precio Venta</th>
                <th className="py-3.5 px-4">Margen Bruto</th>
                <th className="py-3.5 px-4">Stock Actual</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const cost = prod.costPrice || prod.price * 0.7;
                const marginPercent = ((prod.price - cost) / prod.price) * 100;
                const isLowStock = prod.stock <= prod.minStock;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Producto */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"
                        />
                        <div>
                          <p className="font-extrabold text-slate-900 leading-snug">{prod.name}</p>
                          <p className="text-[11px] text-slate-400">{prod.unit}</p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría / SKU */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-700">{prod.category}</p>
                      <p className="text-[10px] font-mono text-slate-400">{prod.code}</p>
                    </td>

                    {/* Costo */}
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      ${cost.toFixed(2)}
                    </td>

                    {/* Precio de Venta */}
                    <td className="py-3 px-4">
                      <span className="font-black text-sm text-emerald-700">${prod.price.toFixed(2)}</span>
                      {prod.originalPrice > prod.price && (
                        <span className="block text-[10px] text-slate-400 line-through">
                          ${prod.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Margen % */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {marginPercent.toFixed(0)}%
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-xl font-extrabold text-xs inline-flex items-center gap-1 ${
                        isLowStock
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {isLowStock && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {prod.stock} u.
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Editar producto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar ${prod.name} del catálogo?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear / Editar Producto */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div 
            className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  {isNew ? 'Registrar Nuevo Producto' : 'Editar Producto'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">Configura precios, costos y stock.</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-4 sm:p-8 space-y-4 overflow-y-auto flex-1">
              {/* Nombre */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Ej. Leche Entera Selección 1L"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Categoría y Código */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Código de Producto <span className="text-[10px] text-emerald-600 font-normal">(Auto si se deja vacío)</span>
                  </label>
                  <input
                    type="text"
                    value={editingProduct.code || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    placeholder="Ej. COD-001 (Auto si está vacío)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Costo, Precio Venta, Precio Oferta y Margen % */}
              <div className="space-y-2 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Costo Compra (Bs.)</label>
                    <input
                      type="number"
                      step="0.10"
                      value={editingProduct.costPrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Precio Venta (Bs.) *</label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 rounded-xl border border-emerald-300 text-xs font-black text-emerald-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Precio Normal (Bs.)</label>
                    <input
                      type="number"
                      step="0.10"
                      value={editingProduct.originalPrice || editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                    />
                  </div>
                </div>

                {/* Calculadora en tiempo real de Margen % */}
                {editingProduct.price > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 text-xs">
                    <span className="text-slate-600 font-semibold">Margen de Ganancia Estimado:</span>
                    <span className="font-extrabold text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      {(((editingProduct.price - (editingProduct.costPrice || 0)) / editingProduct.price) * 100).toFixed(1)}% Margen Neto
                    </span>
                  </div>
                )}
              </div>

              {/* Stock y Stock Mínimo */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock Actual (u)</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alerta Stock Mínimo</label>
                  <input
                    type="number"
                    value={editingProduct.minStock || 5}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidad / Formato</label>
                  <input
                    type="text"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="Botella 1L, Kg..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Cargar Foto de Producto (Archivo + URL) */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 block">Foto del Producto (Cargar desde Archivo o Enlace)</label>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {editingProduct.image ? (
                      <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin Foto</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditingProduct({ ...editingProduct, image: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                    />
                    <input
                      type="url"
                      placeholder="O pega una URL de foto en Internet..."
                      value={editingProduct.image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Badge y Descripción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Badge Promocional</label>
                  <input
                    type="text"
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                    placeholder="Ej. Oferta del Día, Más Vendido..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Descripción Corta</label>
                  <input
                    type="text"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Detalles para el cliente..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
