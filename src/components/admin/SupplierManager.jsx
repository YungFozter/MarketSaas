import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Truck, 
  Phone, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Trash2, 
  Edit2, 
  X, 
  ExternalLink, 
  Store, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  RotateCcw,
  FileText,
  User,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SUPPLIER_CATEGORIES, WEEK_DAYS } from '../../data/supplierInitialData';

export const SupplierManager = () => {
  const { 
    suppliers = [], 
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    addSupplierOrderItem, 
    removeSupplierOrderItem, 
    toggleSupplierOrderItemStatus, 
    clearSupplierOrderItems,
    products = [],
    storeConfig = {}
  } = useStore();

  // Estados de interfaz y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState('all'); // 'all' | 'today' | 'Lunes' | etc.

  // Modal para Crear / Editar Proveedor
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    category: 'Abarrotes & Granos',
    visitDays: [],
    notes: ''
  });

  // Estado para nuevo ítem en formulario inline por proveedor { [supplierId]: { productName: '', quantity: '' } }
  const [itemForms, setItemForms] = useState({});

  // Día actual en Bolivia (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  const currentDayBolivia = useMemo(() => {
    try {
      const now = new Date();
      // Formatear en zona horaria Bolivia
      const dayName = new Intl.DateTimeFormat('es-BO', { 
        timeZone: 'America/La_Paz', 
        weekday: 'long' 
      }).format(now);
      // Capitalizar primera letra: "lunes" -> "Lunes"
      return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    } catch {
      return 'Lunes';
    }
  }, []);

  // Productos de la tienda con Stock Bajo o Agotados
  const lowStockProducts = useMemo(() => {
    return (products || []).filter(p => {
      if (!p) return false;
      const stock = parseInt(p.stock, 10);
      const minStock = parseInt(p.minStock || 5, 10);
      return !isNaN(stock) && stock <= minStock;
    });
  }, [products]);

  // Filtrado de proveedores
  const filteredSuppliers = useMemo(() => {
    const list = Array.isArray(suppliers) ? suppliers : [];
    return list.filter(s => {
      if (!s) return false;
      // Búsqueda por texto (nombre proveedor, preventista, notas o nombre de producto pedido)
      const q = (searchTerm || '').toLowerCase().trim();
      const matchesSearch = !q || (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (Array.isArray(s.orderItems) && s.orderItems.some(i => i?.productName && i.productName.toLowerCase().includes(q)))
      );

      // Filtro por categoría
      const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;

      // Filtro por día
      let matchesDay = true;
      if (selectedDayFilter === 'today') {
        matchesDay = Array.isArray(s.visitDays) && s.visitDays.includes(currentDayBolivia);
      } else if (selectedDayFilter !== 'all') {
        matchesDay = Array.isArray(s.visitDays) && s.visitDays.includes(selectedDayFilter);
      }

      return matchesSearch && matchesCategory && matchesDay;
    });
  }, [suppliers, searchTerm, selectedCategory, selectedDayFilter, currentDayBolivia]);

  // Estadísticas rápidas
  const totalSuppliers = (suppliers || []).length;
  const suppliersVisitingToday = useMemo(() => {
    return (suppliers || []).filter(s => s && Array.isArray(s.visitDays) && s.visitDays.includes(currentDayBolivia));
  }, [suppliers, currentDayBolivia]);

  const totalPendingItems = useMemo(() => {
    return (suppliers || []).reduce((acc, s) => {
      if (!s) return acc;
      const pending = (s.orderItems || []).filter(i => i && i.status !== 'received').length;
      return acc + pending;
    }, 0);
  }, [suppliers]);

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      contactName: '',
      phone: '',
      category: 'Abarrotes & Granos',
      visitDays: [],
      notes: ''
    });
    setIsSupplierModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name || '',
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      category: supplier.category || 'Otros',
      visitDays: Array.isArray(supplier.visitDays) ? [...supplier.visitDays] : [],
      notes: supplier.notes || ''
    });
    setIsSupplierModalOpen(true);
  };

  // Toggle de día de visita en el formulario
  const handleToggleVisitDay = (day) => {
    setSupplierFormData(prev => {
      const exists = prev.visitDays.includes(day);
      if (exists) {
        return { ...prev, visitDays: prev.visitDays.filter(d => d !== day) };
      } else {
        return { ...prev, visitDays: [...prev.visitDays, day] };
      }
    });
  };

  // Guardar proveedor (Crear o Editar)
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) return;

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, supplierFormData);
    } else {
      await addSupplier(supplierFormData);
    }

    setIsSupplierModalOpen(false);
  };

  // Manejo de formulario inline de ítems
  const handleItemInputChange = (supplierId, field, value) => {
    setItemForms(prev => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        [field]: value
      }
    }));
  };

  const handleAddItemSubmit = (supplierId) => {
    const form = itemForms[supplierId] || {};
    if (!form.productName || !form.productName.trim()) return;

    addSupplierOrderItem(supplierId, {
      productName: form.productName.trim(),
      quantity: form.quantity && form.quantity.trim() ? form.quantity.trim() : '1 paquete/caja'
    });

    // Limpiar input
    setItemForms(prev => ({
      ...prev,
      [supplierId]: { productName: '', quantity: '' }
    }));
  };

  // Enviar Pedido a WhatsApp
  const handleSendWhatsAppOrder = (supplier) => {
    if (!supplier.phone) return;

    const pendingItems = (supplier.orderItems || []).filter(i => i.status !== 'received');
    if (pendingItems.length === 0) {
      alert('No hay productos pendientes en la lista de este proveedor.');
      return;
    }

    const cleanPhone = supplier.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`;

    const itemsText = pendingItems
      .map(item => `• *${item.quantity}* - ${item.productName}${item.notes ? ` _(${item.notes})_` : ''}`)
      .join('\n');

    const storeName = storeConfig?.name || 'Mi Minimarket';
    const contactGreeting = supplier.contactName ? `Hola ${supplier.contactName}` : `Buenas tardes estimados ${supplier.name}`;

    const message = `¡${contactGreeting}! Te saluda ${storeName}.\n\nTe paso el pedido de mercadería para la próxima visita:\n\n${itemsText}\n\n📍 Tienda: *${storeName}*\n${storeConfig?.address ? `Dirección: ${storeConfig.address}\n` : ''}Por favor confirmar recepción. ¡Muchas gracias!`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Sugerir e importar productos con stock bajo en la lista del proveedor
  const handleSuggestLowStock = (supplier) => {
    if (lowStockProducts.length === 0) {
      alert('¡Excelente! No tienes productos con stock crítico en tu inventario actualmente.');
      return;
    }

    // Filtrar los que coincidan con la categoría del proveedor (o si no coincide ninguno, mostrar los críticos)
    let candidates = lowStockProducts.filter(p => {
      if (!supplier.category || supplier.category === 'Otros') return true;
      const catLower = supplier.category.toLowerCase();
      const pCatLower = (p.category || '').toLowerCase();
      return pCatLower.includes(catLower) || catLower.includes(pCatLower);
    });

    if (candidates.length === 0) {
      candidates = lowStockProducts.slice(0, 4); // Tomar los primeros 4 más urgentes
    }

    // Evitar duplicar ítems ya existentes en la lista del proveedor
    const existingNames = (supplier.orderItems || []).map(i => i.productName.toLowerCase());
    const toAdd = candidates.filter(c => !existingNames.includes(c.name.toLowerCase()));

    if (toAdd.length === 0) {
      alert('Los productos con stock bajo de este rubro ya están en tu lista de pedidos.');
      return;
    }

    toAdd.forEach(p => {
      addSupplierOrderItem(supplier.id, {
        productName: p.name,
        quantity: 'Reabastecer (Stock crítico)',
        notes: `Stock actual: ${p.stock || 0} unidades`
      });
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* ========================================================================= */}
      {/* 1. HEADER & ACTION BUTTONS                                                */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Proveedores & Preventistas
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Agenda tus proveedores, días de visita y qué productos necesitas antes de que llegue el camión.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Proveedor</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY KPI CARDS                                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Proveedores Registrados */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Directorio Activo</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalSuppliers} proveedores</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Visitan Hoy */}
        <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between transition-all ${
          suppliersVisitingToday.length > 0 
            ? 'bg-emerald-50/70 border-emerald-200/90' 
            : 'bg-white border-slate-200/90'
        }`}>
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>🚚 Visitan Hoy ({currentDayBolivia})</span>
              {suppliersVisitingToday.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              )}
            </span>
            <p className="text-2xl font-black text-emerald-950 mt-0.5">
              {suppliersVisitingToday.length} camiones
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Productos Pendientes de Compra */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mercadería por Pedir</span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalPendingItems} productos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTERS & SEARCH BAR                                                   */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Buscador */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por proveedor, preventista, producto o teléfono..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Categoría */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              {SUPPLIER_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Día de Visita */}
          <div className="md:col-span-3">
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">Todos los Días</option>
              <option value="today">🚚 Visitan Hoy ({currentDayBolivia})</option>
              {WEEK_DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Badges rápidos de filtro de días */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold text-[11px] shrink-0 mr-1">Filtrar día:</span>
          <button
            onClick={() => setSelectedDayFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0 ${
              selectedDayFilter === 'all' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedDayFilter('today')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedDayFilter === 'today' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
            }`}
          >
            <span>🚚 Hoy ({currentDayBolivia})</span>
          </button>
          {WEEK_DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-2 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0 ${
                selectedDayFilter === day 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SUPPLIER CARDS LIST                                                    */}
      {/* ========================================================================= */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron proveedores</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'all' || selectedDayFilter !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda o categoría.'
              : 'Empieza registrando a tu primer proveedor o preventista de la tienda.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Proveedor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSuppliers.map(supplier => {
            const isVisitingToday = Array.isArray(supplier.visitDays) && supplier.visitDays.includes(currentDayBolivia);
            const orderItems = Array.isArray(supplier.orderItems) ? supplier.orderItems : [];
            const pendingItems = orderItems.filter(i => i.status !== 'received');
            const receivedItems = orderItems.filter(i => i.status === 'received');
            const inlineForm = itemForms[supplier.id] || { productName: '', quantity: '' };

            return (
              <div 
                key={supplier.id}
                className={`bg-white rounded-3xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden ${
                  isVisitingToday ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200/90'
                }`}
              >
                {/* Header de la Tarjeta */}
                <div className="p-5 border-b border-slate-100 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                          {supplier.category}
                        </span>
                        {isVisitingToday && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                            <span>Visita Hoy</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                        {supplier.name}
                      </h3>
                      {supplier.contactName && (
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Contacto: <strong>{supplier.contactName}</strong></span>
                        </p>
                      )}
                    </div>

                    {/* Botones de acción rápida: Editar y Eliminar */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(supplier)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar proveedor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar al proveedor "${supplier.name}"?`)) {
                            deleteSupplier(supplier.id);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Días de Visita y Teléfono */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {/* Días */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Días:</span>
                      </span>
                      {Array.isArray(supplier.visitDays) && supplier.visitDays.length > 0 ? (
                        supplier.visitDays.map(day => {
                          const isToday = day === currentDayBolivia;
                          return (
                            <span 
                              key={day}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                isToday 
                                  ? 'bg-emerald-600 text-white border-emerald-700' 
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {day}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 italic">No especificados</span>
                      )}
                    </div>

                    {/* Contacto Directo (Llamada / WhatsApp) */}
                    {supplier.phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${supplier.phone}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                          title="Llamar al preventista"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>{supplier.phone}</span>
                        </a>
                        <a
                          href={`https://wa.me/591${supplier.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Notas / Condiciones del Proveedor */}
                  {supplier.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 font-medium flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">📌</span>
                      <span>{supplier.notes}</span>
                    </div>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* SECCIÓN: LISTA DE MERCADERÍA REQUERIDA ("¿Qué necesito que me traigan?")  */}
                {/* ========================================================================= */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-slate-50/40">
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Lista de Pedido
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {pendingItems.length} pendientes
                        </span>
                      </div>

                      {receivedItems.length > 0 && (
                        <button
                          onClick={() => clearSupplierOrderItems(supplier.id, true)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
                        >
                          Limpiar recibidos ({receivedItems.length})
                        </button>
                      )}
                    </div>

                    {/* Tabla / Lista de Ítems */}
                    {orderItems.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-white">
                        No hay productos agendados para este proveedor todavía.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {orderItems.map(item => {
                          const isReceived = item.status === 'received';
                          return (
                            <div 
                              key={item.id}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 text-xs ${
                                isReceived 
                                  ? 'bg-emerald-50/40 border-emerald-200/50 text-slate-400' 
                                  : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  onClick={() => toggleSupplierOrderItemStatus(supplier.id, item.id)}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${
                                    isReceived 
                                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                                      : 'border-slate-300 hover:border-emerald-500 bg-white'
                                  }`}
                                  title={isReceived ? 'Marcar como pendiente' : 'Marcar como recibido'}
                                >
                                  {isReceived && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                                <div className="min-w-0">
                                  <p className={`font-bold truncate ${isReceived ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    {item.productName}
                                  </p>
                                  {item.notes && (
                                    <span className="text-[10px] text-slate-400 block truncate">
                                      {item.notes}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                                  isReceived 
                                    ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                }`}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => removeSupplierOrderItem(supplier.id, item.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Quitar producto"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Formulario Inline para Añadir Producto al Pedido */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inlineForm.productName}
                        onChange={(e) => handleItemInputChange(supplier.id, 'productName', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItemSubmit(supplier.id);
                        }}
                        placeholder="Ej: Leche Pil Natural 1L..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={inlineForm.quantity}
                        onChange={(e) => handleItemInputChange(supplier.id, 'quantity', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItemSubmit(supplier.id);
                        }}
                        placeholder="Cant: 3 fardos"
                        className="w-28 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleAddItemSubmit(supplier.id)}
                        disabled={!inlineForm.productName?.trim()}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
                      >
                        + Agregar
                      </button>
                    </div>

                    {/* Botones de acción inferior: Stock Bajo y WhatsApp */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => handleSuggestLowStock(supplier)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer"
                        title="Importar productos del inventario con stock mínimo o agotado"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Sugerir Stock Bajo</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppOrder(supplier)}
                        disabled={pendingItems.length === 0 || !supplier.phone}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                        title={!supplier.phone ? 'Agrega un teléfono al proveedor para mandar WhatsApp' : 'Enviar lista a WhatsApp'}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Mandar Pedido por WhatsApp</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL PARA CREAR O EDITAR PROVEEDOR                                    */}
      {/* ========================================================================= */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Datos del distribuidor o preventista de la tienda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveSupplier} className="p-6 overflow-y-auto space-y-4">
              
              {/* Nombre de la Empresa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre de la Empresa o Distribuidora <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  placeholder="Ej: Embol Coca-Cola / PIL Andina / Distribuidora San Juan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Nombre del Preventista y Celular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nombre del Preventista / Vendedor
                  </label>
                  <input
                    type="text"
                    value={supplierFormData.contactName}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, contactName: e.target.value })}
                    placeholder="Ej: Carlos Ventas"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Teléfono / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                    placeholder="Ej: 71234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Categoría / Rubro */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rubro o Categoría Principal
                </label>
                <select
                  value={supplierFormData.category}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  {SUPPLIER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Días de Visita de Preventista */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ¿Qué días pasa el camión o preventista por la tienda?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map(day => {
                    const isSelected = supplierFormData.visitDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleVisitDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected 
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notas o Condiciones Especiales */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Notas o Condiciones Especiales
                </label>
                <textarea
                  rows={2}
                  value={supplierFormData.notes}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                  placeholder="Ej: Pedido mínimo 3 fardos. Pasa antes de las 10:00 am. Pago con QR..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Footer con botones */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
