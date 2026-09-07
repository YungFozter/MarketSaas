import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Store, 
  Sparkles, 
  Settings,
  Volume2,
  VolumeX,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Search,
  Filter,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  Eye,
  LogOut,
  LogIn,
  UserCheck,
  DollarSign,
  QrCode,
  Banknote,
  CreditCard,
  Printer,
  Share2,
  Copy,
  Check,
  Menu,
  X,
  ChevronRight,
  Bike,
  Layers,
  ShieldAlert,
  MessageCircle,
  Bell,
  CheckSquare,
  Square,
  Receipt,
  Wallet
} from 'lucide-react';
import { InventoryManager } from './InventoryManager';
import { PosTerminal } from './PosTerminal';
import { SalesHistory } from './SalesHistory';
import { StoreSettings } from './StoreSettings';
import { ProductRequestsAdmin } from './ProductRequestsAdmin';
import { useStore } from '../../context/StoreContext';
import './AdminHome.css';

export const AdminHome = ({ onOpenAuthModal }) => {
  const { 
    orders, 
    updateOrderStatus,
    createCustomerOrder,
    products, 
    setProducts,
    saveProduct,
    productRequests, 
    storeConfig, 
    setStoreConfig,
    tenantSlug, 
    currentUser, 
    isAuthLoading,
    signOutMerchant,
    setViewMode,
    goToDirectory,
    showToast,
    exportSalesCSV
  } = useStore();

  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab && ['kanban', 'pos', 'inventory', 'analytics', 'requests', 'settings'].includes(urlTab)) {
        return urlTab;
      }
      try {
        const saved = localStorage.getItem(`marketsaas_${tenantSlug}_admin_tab`);
        if (saved && ['kanban', 'pos', 'inventory', 'analytics', 'requests', 'settings'].includes(saved)) {
          return saved;
        }
      } catch (e) {
        // ignore
      }
    }
    return 'kanban';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_admin_tab`, tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        // ignore
      }
    }
  };
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [soundAlertsActive, setSoundAlertsActive] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCondoFilter, setSelectedCondoFilter] = useState('all');
  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_checked_items`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [isCashCloseModalOpen, setIsCashCloseModalOpen] = useState(false);
  const [quickSalePaymentType, setQuickSalePaymentType] = useState(null);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'pos' | 'delivery'

  const currency = storeConfig?.currencySymbol || 'Bs.';
  const isOpen = storeConfig?.isOpen !== false;

  // Cálculos de KPIs en tiempo real
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalSales = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const averageTicket = validOrders.length > 0 ? (totalSales / validOrders.length) : 0;
  
  // Desglose por método de pago para Ventas y Cierre de Caja
  const cashOrders = validOrders.filter(o => o.paymentMethod === 'cash');
  const qrOrders = validOrders.filter(o => o.paymentMethod === 'qr');
  const cardOrders = validOrders.filter(o => o.paymentMethod === 'card');

  const totalCashSales = cashOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalQrSales = qrOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalCardSales = cardOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalSalesCount = cashOrders.length + qrOrders.length + cardOrders.length;
  const totalDaySales = totalCashSales + totalQrSales + totalCardSales;
  const totalDeliveryCollected = validOrders
    .filter(o => o.deliveryType === 'delivery')
    .reduce((acc, o) => acc + (o.deliveryFee || 0), 0);

  // Transacciones recientes para el Feed de Actividad en Vivo
  const recentTransactions = validOrders
    .filter(o => {
      const isPos = o.id?.startsWith('POS-') || o.customer?.name?.includes('Presencial');
      if (feedFilter === 'pos') return isPos;
      if (feedFilter === 'delivery') return !isPos;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Hoy';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) return 'Hace un momento';
      if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Hoy';
    }
  };

  // Filtrado de pedidos según condominio seleccionado en el Kanban
  const condoFilteredOrders = orders.filter(o => {
    if (selectedCondoFilter === 'all') return true;
    return o.customer?.condominium === selectedCondoFilter;
  });

  const activeOrders = condoFilteredOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way');
  const pendingOrders = condoFilteredOrders.filter(o => o.status === 'pending');
  const preparingOrders = condoFilteredOrders.filter(o => o.status === 'preparing');
  const onTheWayOrders = condoFilteredOrders.filter(o => o.status === 'on_the_way');
  const deliveredOrders = condoFilteredOrders.filter(o => o.status === 'delivered');

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const pendingRequests = productRequests.filter(r => r.status === 'pending');

  // Enlace público de la tienda
  const publicStoreUrl = `${window.location.origin}${window.location.pathname}?store=${tenantSlug}`;

  // Reproductor de sonido de alertas acústicas
  const playNotificationSound = () => {
    if (!soundAlertsActive) return;
    try {
      const audio = new Audio('/mp3/Notificacion de orden de compra.mp3');
      audio.play().catch(() => {
        // Fallback Web Audio API sintetizador de campanas armónicas
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const playTone = (freq, delay, dur) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + dur);
          };
          playTone(587.33, 0.0, 0.4); // D5
          playTone(880.00, 0.15, 0.5); // A5
          playTone(1174.66, 0.35, 0.8); // D6
        }
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // Toggle de apertura / cierre en vivo
  const handleToggleStoreOpen = (targetState) => {
    const updated = { ...storeConfig, isOpen: targetState };
    setStoreConfig(updated);
    showToast(
      targetState 
        ? '¡Tienda ABIERTA! Los vecinos ya pueden realizar pedidos.' 
        : 'Tienda CERRADA. Se pausó la recepción de nuevos pedidos en la app de vecinos.',
      targetState ? 'success' : 'info'
    );
  };

  // Simular nuevo pedido entrante
  const handleSimulateNewOrder = () => {
    const newId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const sampleResidents = [
      { name: 'Camila Rojas', phone: '+591 71234567', condo: 'Condominio Las Palmas', tower: 'Torre A', apt: 'Depto 904' },
      { name: 'Carlos Mendoza', phone: '+591 78901234', condo: 'Condominio Las Palmas', tower: 'Torre C', apt: 'Depto 201' },
      { name: 'Sebastián Pavez', phone: '+591 76543210', condo: 'Condominio Las Palmas', tower: 'Torre B', apt: 'Depto 402' },
      { name: 'Lucía Valenzuela', phone: '+591 70123456', condo: 'Condominio Las Palmas', tower: 'Torre A', apt: 'Depto 105' }
    ];
    const resident = sampleResidents[Math.floor(Math.random() * sampleResidents.length)];
    
    // Seleccionar 2-3 productos
    const prods = [...products].sort(() => 0.5 - Math.random()).slice(0, 3);
    const items = prods.map(p => ({
      id: p.id,
      name: p.name,
      quantity: Math.floor(Math.random() * 2) + 1,
      price: p.price
    }));
    const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const deliveryFee = storeConfig?.enableDelivery ? 5.00 : 0.00;
    const total = subtotal + deliveryFee;

    const newOrder = {
      id: newId,
      customer: {
        name: resident.name,
        phone: resident.phone,
        condominium: resident.condo,
        tower: resident.tower,
        apartment: resident.apt,
        notes: 'Entregar en mano o en recepción.'
      },
      items,
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      deliveryType: storeConfig?.enableDelivery ? 'delivery' : 'pickup',
      paymentMethod: Math.random() > 0.5 ? 'qr' : 'cash',
      cashChangeFor: total > 50 ? 100 : 50,
      status: 'pending',
      createdAt: new Date().toISOString(),
      pointsEarned: Math.round(subtotal)
    };

    createCustomerOrder(newOrder);
    playNotificationSound();
    showToast(`¡Nuevo pedido entrante #${newId} de ${resident.name}!`, 'success');
  };

  // Imprimir comanda térmica
  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '', 'width=420,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comanda #${order.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 13px; padding: 12px; width: 280px; color: #000; }
              .center { text-align: center; }
              .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
              .row { display: flex; justify-content: space-between; margin: 3px 0; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="center">
              <h3 style="margin:0;">${storeConfig.name}</h3>
              <p style="margin:2px 0;">COMANDA DE COCINA / DESPACHO</p>
              <div class="divider"></div>
              <p class="bold" style="font-size:16px; margin:4px 0;">ORDEN #${order.id}</p>
              <p style="margin:2px 0;">${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <div class="divider"></div>
            </div>
            <div>
              <p style="margin:2px 0;"><strong>Cliente:</strong> ${order.customer.name}</p>
              <p style="margin:2px 0;"><strong>Destino:</strong> ${order.customer.condominium}</p>
              <p style="margin:2px 0;">${order.customer.tower} - ${order.customer.apartment}</p>
              <p style="margin:2px 0;"><strong>Tel:</strong> ${order.customer.phone}</p>
            </div>
            <div class="divider"></div>
            <p class="bold" style="margin:4px 0;">ITEMS:</p>
            ${order.items.map(item => `
              <div class="row">
                <span>[ ] ${item.quantity}x ${item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="divider"></div>
            <div class="row"><span>Subtotal:</span><span>Bs. ${order.subtotal.toFixed(2)}</span></div>
            <div class="row"><span>Envío:</span><span>Bs. ${order.deliveryFee.toFixed(2)}</span></div>
            <div class="row bold" style="font-size:15px; margin-top:4px;">
              <span>TOTAL:</span>
              <span>Bs. ${order.total.toFixed(2)}</span>
            </div>
            <div class="row" style="margin-top:4px;">
              <span>Método de Pago:</span>
              <span class="bold">${order.paymentMethod.toUpperCase()}</span>
            </div>
            ${order.paymentMethod === 'cash' && order.cashChangeFor ? `
              <div class="row"><span>Paga con:</span><span>Bs. ${order.cashChangeFor}</span></div>
              <div class="row bold"><span>Vuelto:</span><span>Bs. ${(order.cashChangeFor - order.total).toFixed(2)}</span></div>
            ` : ''}
            <div class="divider"></div>
            <p class="center" style="font-size:11px; margin:4px 0;">Gracias por comprar en tu minimarket de confianza.</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // WhatsApp contextual al cliente
  const handleNotifyWhatsApp = (order, customText = '') => {
    let text = customText;
    if (!text) {
      if (order.status === 'pending') {
        text = `¡Hola ${order.customer.name}! Hemos recibido tu pedido #${order.id} en ${storeConfig.name}. Ya comenzamos a prepararlo. Total: ${currency} ${order.total.toFixed(2)}.`;
      } else if (order.status === 'preparing') {
        text = `¡Hola ${order.customer.name}! Tu pedido #${order.id} ya está casi listo en el mostrador de ${storeConfig.name} y saldrá en breve hacia ${order.customer.condominium}.`;
      } else if (order.status === 'on_the_way') {
        text = `¡Hola ${order.customer.name}! 🛵 Tu pedido #${order.id} ya va en camino hacia ${order.customer.tower}, ${order.customer.apartment}. ¡Por favor atento al citófono o timbre!`;
      } else {
        text = `¡Hola ${order.customer.name}! Tu pedido #${order.id} ha sido entregado exitosamente. ¡Muchas gracias por apoyar a tu tienda de barrio!`;
      }
    }
    const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Modificar stock inline para el Bento de Inventario Exprés
  const handleQuickStockChange = (productId, delta) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, prod.stock + delta);
    saveProduct({ ...prod, stock: newStock });
    showToast(`Stock de "${prod.name}" actualizado a ${newStock} unidades`, 'info');
  };

  // Toggle de ítems checklist en el Kanban con persistencia local
  const toggleItemCheck = (orderId, itemId) => {
    const key = `${orderId}-${itemId}`;
    setCheckedItems(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(`marketsaas_${tenantSlug}_checked_items`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Imprimir Cierre y Arqueo de Caja del Día en formato térmico
  const handlePrintDailyCashClose = () => {
    const printWindow = window.open('', '', 'width=420,height=650');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cierre de Caja - ${storeConfig.name}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 13px; padding: 14px; width: 280px; color: #000; }
              .center { text-align: center; }
              .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
              .row { display: flex; justify-content: space-between; margin: 4px 0; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="center">
              <h3 style="margin:0;">${storeConfig.name}</h3>
              <p style="margin:2px 0;">ARQUEO & CIERRE DE CAJA DIARIO</p>
              <div class="divider"></div>
              <p style="margin:2px 0;">Fecha: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin:2px 0;">Responsable: ${currentUser?.user_metadata?.full_name || currentUser?.email || 'Administrador'}</p>
              <div class="divider"></div>
            </div>
            
            <p class="bold" style="margin:6px 0 2px 0;">RESUMEN DE OPERACIONES:</p>
            <div class="row"><span>Pedidos Cobrados:</span><span class="bold">${validOrders.length}</span></div>
            <div class="row"><span>Ticket Promedio:</span><span>Bs. ${averageTicket.toFixed(2)}</span></div>
            <div class="divider"></div>

            <p class="bold" style="margin:6px 0 2px 0;">DESGLOSE POR FORMA DE COBRO:</p>
            <div class="row">
              <span>💵 Efectivo (${cashOrders.length}):</span>
              <span class="bold">Bs. ${totalCashSales.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>📲 QR Simple (${qrOrders.length}):</span>
              <span class="bold">Bs. ${totalQrSales.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>💳 Tarjeta POS (${cardOrders.length}):</span>
              <span class="bold">Bs. ${totalCardSales.toFixed(2)}</span>
            </div>
            <div class="row">
              <span>🛵 Delivery / Envíos:</span>
              <span>Bs. ${totalDeliveryCollected.toFixed(2)}</span>
            </div>
            <div class="divider"></div>

            <div class="row bold" style="font-size:15px; margin:8px 0;">
              <span>TOTAL VENTAS:</span>
              <span>Bs. ${totalSales.toFixed(2)}</span>
            </div>
            <div class="divider"></div>

            <div style="margin-top: 36px; text-align: center;">
              <div style="border-top: 1px solid #000; width: 180px; margin: 0 auto 4px auto;"></div>
              <p style="font-size:11px; margin:0;">Firma Responsable de Caja</p>
            </div>
            <p class="center" style="font-size:10px; margin-top:20px; color:#555;">MarketSaaS • Sistema Hiperlocal</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      showToast('Comanda de Cierre de Caja enviada a impresión.', 'success');
    }
  };

  const navItems = [
    { id: 'kanban', label: 'Tablero Kanban', icon: LayoutDashboard, badge: pendingOrders.length },
    { id: 'pos', label: 'Terminal POS', icon: Store },
    { id: 'sales', label: 'Historial de Ventas', icon: Receipt },
    { id: 'inventory', label: 'Inventario', icon: Package, badge: lowStockProducts.length > 0 ? lowStockProducts.length : null },
    { id: 'requests', label: 'Buzón Vecinos', icon: Sparkles, badge: pendingRequests.length > 0 ? pendingRequests.length : null },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  // Auto-abrir modal de login si intenta ver el panel sin sesión
  useEffect(() => {
    if (!isAuthLoading && !currentUser && onOpenAuthModal) {
      onOpenAuthModal();
    }
  }, [isAuthLoading, currentUser, onOpenAuthModal]);

  // Auth Guard: Comprobación de estado de autenticación
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Verificando credenciales de tienda...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        {/* Luces de fondo ambient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20 text-slate-950">
            <Store className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-black uppercase tracking-wider mb-3 border border-amber-400/20">
            Área Privada de Comerciante
          </span>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Inicia Sesión en tu Minimarket
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            Para ver tu panel de pedidos en vivo, controlar tu inventario y emitir ventas, debes ingresar con tu cuenta de comerciante.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => onOpenAuthModal?.()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión o Registrar Tienda</span>
            </button>

            <button
              onClick={() => setViewMode('customer')}
              className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors border border-slate-700/60 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Volver a la Vista Vecino (Catálogo)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 antialiased font-sans">
      
      {/* ========================================================================= */}
      {/* 1. MODERN VERTICAL LEFT SIDEBAR (Desktop: sticky w-64, Mobile: drawer)   */}
      {/* ========================================================================= */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between 
        transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 shrink-0 shadow-xl lg:shadow-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Brand & Store Selector */}
        <div>
          <div className="p-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20">
                  MS
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none">MarketSaaS</span>
                  <span className="text-[11px] font-bold text-slate-400 mt-0.5">Comercio Panel</span>
                </div>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Estado Tienda: Abierto / Cerrado */}
            <div className="mt-4 flex items-center justify-between p-1 bg-slate-100 rounded-xl">
              <button 
                onClick={() => handleToggleStoreOpen(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isOpen 
                    ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                type="button"
              >
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                ABIERTO
              </button>
              <button 
                onClick={() => handleToggleStoreOpen(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isOpen 
                    ? 'bg-rose-50 text-rose-800 shadow-xs border border-rose-200' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                type="button"
              >
                <span className={`w-2 h-2 rounded-full ${!isOpen ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                CERRADO
              </button>
            </div>

            {/* Sonido Pedidos Toggle Indicator */}
            <button
              onClick={() => {
                const nextState = !soundAlertsActive;
                setSoundAlertsActive(nextState);
                if (nextState) {
                  playNotificationSound();
                  showToast('Sonido de pedidos activado.', 'info');
                } else {
                  showToast('Sonido de pedidos silenciado.', 'warning');
                }
              }}
              className={`mt-2.5 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                soundAlertsActive 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/70' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title="Haz clic para activar o probar el sonido de pedidos"
            >
              <div className="flex items-center gap-1.5">
                {soundAlertsActive ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                <span>Sonido: {soundAlertsActive ? 'ACTIVO' : 'SILENCIADO'}</span>
              </div>
              {soundAlertsActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge != null && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Info & User Profile */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Vista Vecino Shortcut */}
          <button
            onClick={() => {
              setViewMode('customer');
              goToDirectory();
            }}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            title="Previsualizar catálogo como cliente"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Vista Vecino</span>
          </button>

          {/* Profile Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.email ? currentUser.email[0].toUpperCase() : 'D'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-900 truncate">
                  {currentUser?.user_metadata?.full_name || storeConfig.name || 'Don Vecino'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {storeConfig.condominiums?.[0]?.name || 'Condominio Central'}
                </p>
              </div>
            </div>
            {currentUser ? (
              <button
                onClick={signOutMerchant}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 font-bold text-xs"
                title="Iniciar Sesión"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop para móvil cuando el sidebar está abierto */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE CONTENT AREA                                           */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#f8fafc]">
        
        {/* Top Workspace Sub-Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Botón de apertura de menú para móviles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Nombre de la Tienda */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-extrabold text-xs text-slate-800">
                {storeConfig.name}
              </span>
            </div>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex items-center gap-2">
            {/* Botón de Ventas del Día */}
            <button
              onClick={() => setIsCashCloseModalOpen(true)}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Ver resumen de Ventas e iniciar ventas rápidas"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ventas</span>
            </button>

            <button
              onClick={exportSalesCSV}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Descargar reporte contable en CSV"
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar (.CSV)</span>
            </button>

            <button
              onClick={handleSimulateNewOrder}
              className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-dashed border-amber-300 font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
              title="Herramienta de prueba: simular un pedido entrante"
            >
              <Bell className="w-3 h-3 text-amber-600" />
              <span className="hidden md:inline">Probar Pedido Demo</span>
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 3. WORKSPACE CONTAINER (Changes based on activeTab)                      */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1600px] mx-auto flex-1">
          
          {/* TAB 1: COCKPIT OPERATIVO (Kanban + Top KPIs + Bento Grid) */}
          {activeTab === 'kanban' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Section Title */}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight font-black">
                  Panel de Control {storeConfig.name}
                </h1>
              </div>

              {/* 3 TOP OPERATIONAL KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* KPI 1: Ventas del Día */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-500 font-medium">Ventas del Día</span>
                      <p className="text-2xl text-slate-900 tracking-tight font-black">
                        {currency} {totalSales.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCashCloseModalOpen(true)}
                      className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold cursor-pointer transition-colors"
                      title="Abrir Ventas"
                    >
                      <Receipt className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 font-medium">{validOrders.length} cobrados</span>
                    <button
                      onClick={() => setActiveTab('sales')}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      Ver Ventas →
                    </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                </div>

                {/* KPI 2: Pedidos Activos */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-500 font-medium">Pedidos Activos</span>
                      <p className="text-2xl text-slate-900 tracking-tight font-black">
                        {activeOrders.length} en curso
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>{pendingOrders.length} pend.</span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{preparingOrders.length} empaque</span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>{onTheWayOrders.length} ruta</span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-500"></div>
                </div>

                {/* KPI 4: Alertas de Stock Crítico */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-500 font-medium">Alertas de Stock</span>
                      <p className="text-2xl text-rose-600 tracking-tight font-black">
                        {lowStockProducts.length} críticos
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-slate-500 text-xs truncate">
                    {lowStockProducts.slice(0, 3).map(p => (
                      <span key={p.id} className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold truncate max-w-[85px]">
                        {p.name.split(' ')[0]}
                      </span>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <span className="text-[11px] text-emerald-600 font-bold">Stock saludable ✓</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-500"></div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* TABLERO KANBAN DE PEDIDOS                                                 */}
              {/* ========================================================================= */}
              <section className="space-y-3.5">
                {/* 4 KANBAN COLUMNS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                  
                  {/* COLUMNA 1: 🟡 PENDIENTES */}
                  <div className="rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <h3 className="text-sm font-bold text-slate-900">Pendientes</h3>
                        <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          {pendingOrders.length}
                        </span>
                      </div>
                      <Volume2 className="w-4 h-4 text-amber-500 animate-pulse" />
                    </div>

                    {pendingOrders.map(order => (
                      <div key={order.id} className="group relative rounded-xl bg-white p-3.5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-amber-500"></div>
                        <div className="pl-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-base font-bold text-slate-900">#{order.id}</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px]">
                                  Nuevo ⏱️
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-900 mt-1">
                                🏢 {order.customer.tower || 'Torre A'} • {order.customer.apartment || 'S/N'}
                              </p>
                              <p className="text-[11px] text-slate-400">{order.customer.condominium}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 shrink-0">
                              {order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro Local'}
                            </span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{order.customer.name}</span>
                            <span className="text-slate-400">{order.customer.phone}</span>
                          </div>

                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                              <QrCode className="w-3 h-3 text-emerald-600" />
                              {order.paymentMethod === 'qr' ? 'QR Simple (Digital)' : `Efectivo: Paga Bs. ${order.cashChangeFor || order.total}`}
                            </span>
                          </div>

                          {/* Checklist de Artículos */}
                          <div className="mt-2.5 p-2 rounded-xl bg-slate-50 space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Checklist de Artículos:</span>
                            {order.items.map(item => {
                              const checked = checkedItems[`${order.id}-${item.id}`];
                              return (
                                <label 
                                  key={item.id} 
                                  onClick={() => toggleItemCheck(order.id, item.id)}
                                  className="flex items-center justify-between gap-2 cursor-pointer select-none py-0.5 text-xs text-slate-700"
                                >
                                  <div className="flex items-center gap-1.5">
                                    {checked ? <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> : <Square className="w-3.5 h-3.5 text-slate-300" />}
                                    <span className={checked ? 'line-through text-slate-400' : ''}>{item.quantity}x {item.name}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold">{currency} {(item.price * item.quantity).toFixed(2)}</span>
                                </label>
                              );
                            })}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <div className="flex items-baseline justify-between mb-2">
                              <span className="text-xs text-slate-400">Total a Cobrar:</span>
                              <span className="text-base text-slate-900 font-black">{currency} {order.total.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                              <button 
                                onClick={() => {
                                  updateOrderStatus(order.id, 'preparing');
                                  showToast(`Pedido #${order.id} aceptado y en preparación.`, 'info');
                                }}
                                className="col-span-3 h-9 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
                                type="button"
                              >
                                <span>Aceptar y Preparar</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleNotifyWhatsApp(order)}
                                className="col-span-1 h-9 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer" 
                                title="Chat WhatsApp Vecino" 
                                type="button"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handlePrintOrder(order)}
                                className="col-span-1 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer" 
                                title="Imprimir Comanda Térmica" 
                                type="button"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pendingOrders.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        No hay pedidos pendientes
                      </div>
                    )}
                  </div>

                  {/* COLUMNA 2: 🔵 EN PREPARACIÓN */}
                  <div className="rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <h3 className="text-sm font-bold text-slate-900">En Preparación</h3>
                        <span className="px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                          {preparingOrders.length}
                        </span>
                      </div>
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>

                    {preparingOrders.map(order => (
                      <div key={order.id} className="group relative rounded-xl bg-white p-3.5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-blue-500"></div>
                        <div className="pl-2 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-base font-bold text-slate-900">#{order.id}</span>
                              <p className="text-xs font-semibold text-slate-900">{order.customer.tower || 'Torre B'} • {order.customer.apartment || 'S/N'}</p>
                              <p className="text-xs text-slate-400">{order.customer.name}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                              {order.paymentMethod === 'qr' ? 'QR Pagado' : 'Efectivo'}
                            </span>
                          </div>

                          {/* Barra de progreso de empaque */}
                          <div className="p-2 rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1 font-bold">
                              <span>Artículos verificados:</span>
                              <span className="text-emerald-700">{order.items.length} productos listos</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-500">Total: <strong>{currency} {order.total.toFixed(2)}</strong></span>
                            <span className="text-[11px] text-slate-400 font-bold">{order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro en Local'}</span>
                          </div>

                          <button 
                            onClick={() => {
                              updateOrderStatus(order.id, 'on_the_way');
                              showToast(`Pedido #${order.id} despachado.`, 'info');
                            }}
                            className="w-full h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-700 shadow-xs transition-all cursor-pointer"
                            type="button"
                          >
                            <span>{order.deliveryType === 'delivery' ? 'Despachar / Enviar Repartidor' : 'Listo para Retiro en Caja ➔'}</span>
                            <Bike className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {preparingOrders.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        No hay pedidos en preparación
                      </div>
                    )}
                  </div>

                  {/* COLUMNA 3: 🟣 EN RUTA */}
                  <div className="rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        <h3 className="text-sm font-bold text-slate-900">En Ruta</h3>
                        <span className="px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                          {onTheWayOrders.length}
                        </span>
                      </div>
                      <Truck className="w-4 h-4 text-purple-500" />
                    </div>

                    {onTheWayOrders.map(order => (
                      <div key={order.id} className="group relative rounded-xl bg-white p-3.5 shadow-xs border border-slate-100 hover:shadow-md transition-all">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-purple-500"></div>
                        <div className="pl-2 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-base font-bold text-slate-900">#{order.id}</span>
                              <p className="text-xs font-semibold text-slate-900">{order.customer.tower} • {order.customer.apartment}</p>
                              <p className="text-xs text-purple-600 font-bold">En camino 🛵</p>
                            </div>
                            <span className="text-sm font-black text-slate-900">{currency} {order.total.toFixed(2)}</span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-50 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                              M
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">Repartidor Interno</p>
                              <p className="text-[10px] text-slate-400 truncate">Hacia recepción / puerta</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <button 
                              onClick={() => {
                                updateOrderStatus(order.id, 'delivered');
                                showToast(`¡Pedido #${order.id} marcado como entregado!`, 'success');
                              }}
                              className="w-full h-9 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
                              type="button"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirmar Entrega [✓]</span>
                            </button>
                            <button 
                              onClick={() => handleNotifyWhatsApp(order, `¡Hola ${order.customer.name}! El repartidor ya está abajo con tu pedido #${order.id}.`)}
                              className="w-full h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors cursor-pointer"
                              type="button"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Avisar que está abajo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {onTheWayOrders.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        No hay pedidos en ruta
                      </div>
                    )}
                  </div>

                  {/* COLUMNA 4: 🟢 ENTREGADOS */}
                  <div className="rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <h3 className="text-sm font-bold text-slate-900">Entregados</h3>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          {deliveredOrders.length}
                        </span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>

                    {deliveredOrders.slice(0, 4).map(order => (
                      <div key={order.id} className="rounded-xl bg-white p-3 shadow-xs border border-slate-100 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900">#{order.id}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <p className="text-xs font-semibold text-slate-800">{order.customer.tower || 'Torre B'} • {order.customer.apartment || 'S/N'}</p>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{currency} {order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-xs pt-1 border-t border-slate-100">
                          <span>{order.paymentMethod.toUpperCase()}</span>
                          <span className="text-emerald-700 font-bold text-[11px]">★ 5.0 Exitoso</span>
                        </div>
                      </div>
                    ))}
                    {deliveredOrders.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        No hay pedidos entregados aún hoy
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ========================================================================= */}
              {/* 4. FEED DE ACTIVIDAD & ÚLTIMOS COBROS EN VIVO                              */}
              {/* ========================================================================= */}
              <section className="space-y-3.5 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div>
                      <h2 className="text-lg text-slate-900 font-bold tracking-tight">Feed de Actividad & Últimos Cobros</h2>
                      <p className="text-xs text-slate-400">Auditoría en tiempo real de transacciones y pedidos registrados</p>
                    </div>
                  </div>

                  {/* Filtros rápidos: Todos, Mostrador, Domicilio */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFeedFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        feedFilter === 'all' 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Todos ({validOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedFilter('pos')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        feedFilter === 'pos' 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      🏪 Mostrador ({validOrders.filter(o => o.id?.startsWith('POS-') || o.customer?.name?.includes('Presencial')).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedFilter('delivery')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        feedFilter === 'delivery' 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      🛵 Domicilio ({validOrders.filter(o => !(o.id?.startsWith('POS-') || o.customer?.name?.includes('Presencial'))).length})
                    </button>
                  </div>
                </div>

                {/* Lista de Transacciones Recientes */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
                  {recentTransactions.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Aún no hay transacciones registradas</p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Cuando realices una venta en el mostrador o un vecino confirme un pedido, se reflejará aquí en tiempo real.
                      </p>
                    </div>
                  ) : (
                    recentTransactions.map((tx) => {
                      const isPos = tx.id?.startsWith('POS-') || tx.customer?.name?.includes('Presencial');
                      const payMethod = tx.paymentMethod || 'cash';
                      return (
                        <div 
                          key={tx.id}
                          className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          {/* Izquierda: Método de Pago + Datos del Cliente / Origen */}
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              payMethod === 'cash' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : payMethod === 'qr'
                                ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {payMethod === 'cash' && <Banknote className="w-5 h-5" />}
                              {payMethod === 'qr' && <QrCode className="w-5 h-5" />}
                              {payMethod === 'card' && <CreditCard className="w-5 h-5" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                  {isPos ? 'Venta de Mostrador (Presencial)' : `🏢 ${tx.customer?.tower || 'Torre'} • ${tx.customer?.apartment || 'Depto'}`}
                                </span>
                                {!isPos && tx.customer?.condominium && (
                                  <span className="text-[11px] font-semibold text-slate-500">
                                    • {tx.customer.condominium}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                                  {payMethod === 'cash' ? 'Efectivo' : payMethod === 'qr' ? 'QR' : 'Tarjeta'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                <span className="font-mono font-semibold text-slate-500">#{tx.id}</span>
                                <span>•</span>
                                <span>{tx.items?.length || 1} {tx.items?.length === 1 ? 'producto' : 'productos'}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {formatRelativeTime(tx.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Derecha: Estado + Monto cobrado */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                              tx.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : tx.status === 'on_the_way'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : tx.status === 'preparing'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {tx.status === 'delivered' ? '✓ Cobrado / Entregado' : tx.status === 'on_the_way' ? '🛵 En camino' : tx.status === 'preparing' ? '📦 En preparación' : '⏱️ Pendiente'}
                            </span>

                            <div className="text-right">
                              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                +{currency} {(tx.total || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

            </div>
          )}

          {/* TAB 2: TERMINAL POS */}
          {activeTab === 'pos' && (
            <div className="animate-fadeIn">
              <PosTerminal />
            </div>
          )}

          {/* TAB 3: HISTORIAL DE VENTAS */}
          {activeTab === 'sales' && (
            <div className="animate-fadeIn">
              <SalesHistory />
            </div>
          )}

          {/* TAB 4: INVENTARIO */}
          {activeTab === 'inventory' && (
            <div className="animate-fadeIn">
              <InventoryManager />
            </div>
          )}

          {/* TAB 4: BUZÓN DE VECINOS */}
          {activeTab === 'requests' && (
            <div className="animate-fadeIn">
              <ProductRequestsAdmin />
            </div>
          )}

          {/* TAB 5: CONFIGURACIÓN */}
          {activeTab === 'settings' && (
            <div className="animate-fadeIn">
              <StoreSettings />
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL DE VENTAS DEL DÍA & ACCESO A VENTAS RÁPIDAS                          */}
      {/* ========================================================================= */}
      {isCashCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header del Modal */}
            <div className="p-6 pb-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Ventas</h3>
                  <p className="text-xs text-slate-300">
                    {storeConfig.name} • {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCashCloseModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de Ventas */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Selecciona una opción para abrir el panel y registrar una nueva venta:
              </p>

              {/* Cuadrícula de Métodos de Pago Interactivos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Venta en Efectivo */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCashCloseModalOpen(false);
                    setQuickSalePaymentType('cash');
                  }}
                  className="p-3.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/90 border-2 border-emerald-200 hover:border-emerald-500 transition-all cursor-pointer shadow-2xs hover:shadow-md text-left group flex flex-col justify-between"
                  title="Abrir panel de Venta en Efectivo"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-tight">Venta en Efectivo</span>
                      <Banknote className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xl font-black text-emerald-950">{currency} {totalCashSales.toFixed(2)}</p>
                    <p className="text-[10px] text-emerald-700 mt-0.5 font-semibold">
                      {cashOrders.length} {cashOrders.length === 1 ? 'venta' : 'ventas'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[11px] font-extrabold text-emerald-700 group-hover:text-emerald-950">
                    <span>+ Iniciar Venta</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>

                {/* Qr Digital */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCashCloseModalOpen(false);
                    setQuickSalePaymentType('qr');
                  }}
                  className="p-3.5 rounded-2xl bg-cyan-50/80 hover:bg-cyan-100/90 border-2 border-cyan-200 hover:border-cyan-500 transition-all cursor-pointer shadow-2xs hover:shadow-md text-left group flex flex-col justify-between"
                  title="Abrir panel de Venta por QR"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-extrabold text-cyan-900 uppercase tracking-tight">Qr Digital</span>
                      <QrCode className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xl font-black text-cyan-950">{currency} {totalQrSales.toFixed(2)}</p>
                    <p className="text-[10px] text-cyan-700 mt-0.5 font-semibold">
                      {qrOrders.length} {qrOrders.length === 1 ? 'venta' : 'ventas'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-cyan-200/80 flex items-center justify-between text-[11px] font-extrabold text-cyan-700 group-hover:text-cyan-950">
                    <span>+ Iniciar Venta</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>

                {/* Tarjeta POS Móvil */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCashCloseModalOpen(false);
                    setQuickSalePaymentType('card');
                  }}
                  className="p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100/90 border-2 border-amber-200 hover:border-amber-500 transition-all cursor-pointer shadow-2xs hover:shadow-md text-left group flex flex-col justify-between"
                  title="Abrir panel de Venta con Tarjeta"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-tight">Tarjeta POS Móvil</span>
                      <CreditCard className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-xl font-black text-amber-950">{currency} {totalCardSales.toFixed(2)}</p>
                    <p className="text-[10px] text-amber-700 mt-0.5 font-semibold">
                      {cardOrders.length} {cardOrders.length === 1 ? 'venta' : 'ventas'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px] font-extrabold text-amber-700 group-hover:text-amber-950">
                    <span>+ Iniciar Venta</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </button>
              </div>

              {/* Total General Destacado */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Ventas del día</span>
                  <p className="text-2xl font-black text-emerald-400 tracking-tight">{currency} {totalDaySales.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-slate-200 font-black block">
                    {totalSalesCount} {totalSalesCount === 1 ? 'venta' : 'ventas'}
                  </span>
                </div>
              </div>

              {/* Acciones del Modal */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrintDailyCashClose}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Comanda de Cierre</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCashCloseModalOpen(false)}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL DE VENTA RÁPIDA (Lanzado al presionar opción en Ventas)             */}
      {/* ========================================================================= */}
      {quickSalePaymentType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-6xl max-h-[94vh] bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header del Panel de Venta Rápida */}
            <div className="p-4 sm:px-6 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <span>Panel de Venta</span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      {quickSalePaymentType === 'cash' ? 'Venta en Efectivo' : quickSalePaymentType === 'qr' ? 'Qr Digital' : 'Tarjeta POS Móvil'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecciona productos del catálogo, agrégalos al ticket y procesa la venta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickSalePaymentType(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar panel de venta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido interactivo: Terminal de Venta POS */}
            <div className="p-3 sm:p-5 overflow-y-auto flex-1">
              <PosTerminal 
                initialPaymentType={quickSalePaymentType} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
