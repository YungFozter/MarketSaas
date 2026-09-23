import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  PackageCheck,
  Store, 
  Sparkles, 
  Settings,
  Volume2,
  VolumeX,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
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
  Lock,
  KeyRound,
  BookOpen
} from 'lucide-react';
import { InventoryManager } from './InventoryManager';
import { PosTerminal } from './PosTerminal';
import { SalesHistory } from './SalesHistory';
import { CreditManager } from './CreditManager';
import { StorePrintKitModal } from './StorePrintKitModal';
import { StoreSettings } from './StoreSettings';
import { ProductRequestsAdmin } from './ProductRequestsAdmin';
import { SubscriptionManager } from './SubscriptionManager';
import { SupplierManager } from './SupplierManager';
import { SubscriptionBlockedModal } from './SubscriptionBlockedModal';
import { ExportSalesReportModal } from './ExportSalesReportModal';
import { ShareStoreModal } from './ShareStoreModal';
import { OrderNotificationBanner } from './OrderNotificationBanner/OrderNotificationBanner';
import { playOrderNotificationSound, sendOrderNotification } from '../../services/orderNotificationService';
import { useStore, filterOutDemoSuppliers } from '../../context/StoreContext';
import { escapeHtml } from '../../utils/formatters';
import './AdminHome.css';

export const AdminHome = ({ onOpenAuthModal }) => {
  const { 
    orders, 
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    createCustomerOrder,
    products, 
    setProducts,
    saveProduct,
    productRequests, 
    suppliers = [],
    storeConfig, 
    setStoreConfig,
    tenantSlug, 
    currentUser, 
    merchantStore,
    isAuthLoading,
    signOutMerchant,
    setViewMode,
    goToDirectory,
    showToast,
    exportSalesCSV,
    isSubscriptionActive,
    subscriptionTimeRemaining,
    formatBoliviaDateTime,
    creditCustomers = []
  } = useStore();

  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab && ['kanban', 'pos', 'sales', 'credits', 'inventory', 'suppliers', 'analytics', 'requests', 'settings', 'subscription'].includes(urlTab)) {
        return urlTab;
      }
      try {
        const saved = localStorage.getItem(`marketsaas_${tenantSlug}_admin_tab`);
        if (saved && ['kanban', 'pos', 'sales', 'credits', 'inventory', 'suppliers', 'analytics', 'requests', 'settings', 'subscription'].includes(saved)) {
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

  // Filtro de Horario / Período del Tablero Kanban y KPIs:
  // 'today' = Estrictamente pedidos/ventas del día calendario actual (desde 00:00:00 de hoy)
  // '24h'   = Ventana móvil de las últimas 24 horas antes del momento actual
  // 'all'   = Todo el historial
  const [kanbanTimeRange, setKanbanTimeRange] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_kanban_time_range`);
      if (saved && ['today', '24h', 'all'].includes(saved)) return saved;
    } catch {}
    return 'today';
  });

  const handleSetKanbanTimeRange = (range) => {
    setKanbanTimeRange(range);
    try {
      localStorage.setItem(`marketsaas_${tenantSlug}_kanban_time_range`, range);
    } catch {}
  };

  const matchesKanbanTimeRange = (dateString, range) => {
    if (!dateString || range === 'all') return true;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return true;

    const now = new Date();
    if (range === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return date >= startOfToday;
    }
    if (range === '24h') {
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return date >= twentyFourHoursAgo;
    }
    return true;
  };

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`marketsaas_${tenantSlug}_checked_items`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrintKitOpen, setIsPrintKitOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'pos' | 'delivery'
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const getDisplayOrderId = (id) => {
    if (!id) return '';
    const str = String(id);
    if (str.includes('POS-')) {
      return 'POS-' + str.split('POS-')[1];
    }
    return str.length > 14 ? str.slice(-8) : str;
  };

  const currency = storeConfig?.currencySymbol || 'Bs.';
  const isOpen = storeConfig?.isOpen !== false;

  // Pedidos filtrados según el rango temporal seleccionado en el Kanban ('today' vs '24h' vs 'all')
  const timeFilteredOrders = (orders || []).filter(o => {
    if (!o) return false;
    return matchesKanbanTimeRange(o.createdAt || o.created_at, kanbanTimeRange);
  });

  // Cálculos de KPIs en tiempo real según el período de horario activo
  const validOrders = timeFilteredOrders.filter(o => o && o.status !== 'cancelled');
  const totalSales = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const averageTicket = validOrders.length > 0 ? (totalSales / validOrders.length) : 0;
  
  // Desglose por método de pago para Ventas y Cierre de Caja (soportando camelCase y snake_case)
  const getOrderPaymentMethod = (o) => o?.paymentMethod || o?.payment_method || 'cash';

  const cashOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'cash');
  const qrOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'qr');
  const cardOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'card');
  const creditOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'credit');

  const totalCashSales = cashOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalQrSales = qrOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalCardSales = cardOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalCreditSales = creditOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalSalesCount = cashOrders.length + qrOrders.length + cardOrders.length + creditOrders.length;
  const totalDaySales = totalCashSales + totalQrSales + totalCardSales;
  const totalDeliveryCollected = validOrders
    .filter(o => (o?.deliveryType || o?.delivery_type) === 'delivery')
    .reduce((acc, o) => acc + (o.deliveryFee || o.delivery_fee || 0), 0);

  // Helper para clasificar si un pedido corresponde a Mostrador (presencial POS o retiro en tienda) vs Domicilio
  const isPickupOrPosOrder = (order) => {
    if (!order) return false;
    const id = String(order.id || '');
    if (id.includes('POS-') || id.startsWith('POS-')) return true;
    const dType = order.deliveryType || order.delivery_type;
    if (dType === 'pickup') return true;
    const cName = order.customer?.name || '';
    if (cName.includes('Presencial') || cName.includes('Mostrador') || cName.includes('Cliente Mostrador')) return true;
    const condo = order.customer?.condominium || '';
    const apt = order.customer?.apartment || '';
    if (condo === 'Retiro en Tienda' || condo === 'En Tienda' || apt === 'Mostrador') return true;
    if (dType === 'delivery') return false;
    return false;
  };

  // Transacciones recientes para el Feed de Actividad en Vivo
  const recentTransactions = validOrders
    .filter(o => {
      const isPickup = isPickupOrPosOrder(o);
      if (feedFilter === 'pos') return isPickup;
      if (feedFilter === 'delivery') return !isPickup;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime())
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

  // Filtrado de pedidos según condominio y período seleccionado en el Kanban
  const condoFilteredOrders = timeFilteredOrders.filter(o => {
    if (!o) return false;
    if (selectedCondoFilter === 'all') return true;
    return o.customer?.condominium === selectedCondoFilter;
  });

  const activeOrders = condoFilteredOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way');
  const pendingOrders = condoFilteredOrders.filter(o => o.status === 'pending');
  const preparingOrders = condoFilteredOrders.filter(o => o.status === 'preparing');
  const onTheWayOrders = condoFilteredOrders.filter(o => o.status === 'on_the_way');
  const deliveredOrders = condoFilteredOrders.filter(o => o.status === 'delivered');

  // Identificar pedidos activos anteriores al período temporal seleccionado (para no desatender clientes)
  const allActiveOrders = (orders || []).filter(o => 
    o && (o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way')
  );
  const olderActiveOrders = allActiveOrders.filter(o => 
    !matchesKanbanTimeRange(o.createdAt || o.created_at, kanbanTimeRange)
  );

  const lowStockProducts = (products || []).filter(p => {
    if (!p || p.stock === 'Sin definir' || p.stock == null || p.minStock === 'Sin definir' || p.minStock == null) return false;
    const numStock = Number(p.stock);
    const numMin = Number(p.minStock);
    return !isNaN(numStock) && !isNaN(numMin) && numStock <= numMin;
  });
  const pendingRequests = (productRequests || []).filter(r => r && r.status === 'pending');
  const creditDebtorsCount = (creditCustomers || []).filter(c => (c.balance || 0) > 0).length;

  // Enlace público de la tienda
  const publicStoreUrl = `${window.location.origin}${window.location.pathname}?store=${tenantSlug}`;

  // Reproductor de sonido de alertas acústicas
  const playNotificationSound = () => {
    if (!soundAlertsActive) return;
    playOrderNotificationSound();
  };

  const notifiedOrderIds = useRef(new Set());

  // Escuchar pedidos entrantes en tiempo real para activar sonido y notificación acústica
  useEffect(() => {
    const handleIncomingOrder = (e) => {
      const order = e?.detail;
      if (!order || !order.id) return;
      if (notifiedOrderIds.current.has(order.id)) return;
      notifiedOrderIds.current.add(order.id);

      if (soundAlertsActive) {
        playOrderNotificationSound();
      }

      // Enviar notificación Push nativa al dispositivo (celular / escritorio)
      sendOrderNotification(order, storeConfig);

      showToast?.(
        `¡Nuevo pedido entrante #${order.id} de ${order.customer?.name || 'Vecino'}!`,
        'success'
      );
    };

    window.addEventListener('marketsaas:new_order', handleIncomingOrder);
    return () => {
      window.removeEventListener('marketsaas:new_order', handleIncomingOrder);
    };
  }, [soundAlertsActive, showToast, storeConfig]);

  // Monitoreo al desbloquear el teléfono o volver a la pestaña (visibilitychange / focus)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        // Al regresar a la pestaña, verificar si hay pedidos pendientes no notificados
        const recentPending = (orders || []).filter(o => {
          if (!o || o.status !== 'pending' || !o.id) return false;
          if (notifiedOrderIds.current.has(o.id)) return false;
          const orderAgeMs = Date.now() - new Date(o.createdAt || o.created_at || Date.now()).getTime();
          // Notificar si el pedido tiene menos de 2 horas de antigüedad
          return orderAgeMs < 2 * 60 * 60 * 1000;
        });

        if (recentPending.length > 0) {
          const newest = recentPending[0];
          notifiedOrderIds.current.add(newest.id);
          if (soundAlertsActive) {
            playOrderNotificationSound();
          }
          sendOrderNotification(newest, storeConfig);
          showToast?.(`¡Tienes un pedido pendiente #${newest.id} de ${newest.customer?.name || 'Vecino'}!`, 'info');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [orders, soundAlertsActive, storeConfig, showToast]);

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
              <h3 style="margin:0;">${escapeHtml(storeConfig.name)}</h3>
              <p style="margin:2px 0;">COMANDA DE COCINA / DESPACHO</p>
              <div class="divider"></div>
              <p class="bold" style="font-size:16px; margin:4px 0;">ORDEN #${escapeHtml(order.id)}</p>
              <p style="margin:2px 0;">${escapeHtml(new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</p>
              <div class="divider"></div>
            </div>
            <div>
              <p style="margin:2px 0;"><strong>Cliente:</strong> ${escapeHtml(order.customer?.name || 'Vecino')}</p>
              <p style="margin:2px 0;"><strong>Modalidad:</strong> ${order.deliveryType === 'delivery' ? 'Delivery a Domicilio' : 'Retiro en Tienda / Mostrador'}</p>
              ${order.deliveryType === 'delivery' ? `
                <p style="margin:2px 0;"><strong>Destino:</strong> ${escapeHtml(order.customer?.condominium || '')}</p>
                <p style="margin:2px 0;">${escapeHtml([order.customer?.tower, order.customer?.apartment].filter(Boolean).join(' - '))}</p>
              ` : ''}
              <p style="margin:2px 0;"><strong>Tel:</strong> ${escapeHtml(order.customer?.phone || '')}</p>
            </div>
            <div class="divider"></div>
            <p class="bold" style="margin:4px 0;">ITEMS:</p>
            ${order.items.map(item => `
              <div class="row">
                <span>[ ] ${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}</span>
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
    const currentStock = (prod.stock !== 'Sin definir' && prod.stock != null && !isNaN(parseInt(prod.stock, 10)))
      ? parseInt(prod.stock, 10)
      : 0;
    const newStock = Math.max(0, currentStock + delta);
    saveProduct({ ...prod, stock: newStock }, { silent: true });
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

  const currentDayBolivia = useMemo(() => {
    try {
      const now = new Date();
      const dayName = new Intl.DateTimeFormat('es-BO', { 
        timeZone: 'America/La_Paz', 
        weekday: 'long' 
      }).format(now);
      return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    } catch {
      return 'Lunes';
    }
  }, []);

  const suppliersVisitingToday = useMemo(() => {
    return filterOutDemoSuppliers(suppliers || []).filter(s => s && Array.isArray(s.visitDays) && s.visitDays.includes(currentDayBolivia));
  }, [suppliers, currentDayBolivia]);

  const navItems = [
    { id: 'kanban', label: 'Tablero Kanban', icon: LayoutDashboard, badge: pendingOrders.length },
    { id: 'pos', label: 'Punto de Venta', icon: Store, badge: !isSubscriptionActive ? '🔒' : null },
    { id: 'sales', label: 'Historial de Ventas', icon: Receipt },
    { id: 'credits', label: 'Libreta de Deudas', icon: BookOpen, badge: creditDebtorsCount > 0 ? `${creditDebtorsCount} debe` : null },
    { id: 'inventory', label: 'Inventario', icon: Package, badge: lowStockProducts.length > 0 ? lowStockProducts.length : null },
    { id: 'suppliers', label: 'Proveedores', icon: Truck, badge: suppliersVisitingToday.length > 0 ? 'Hoy' : null },
    { id: 'requests', label: 'Buzón Vecinos', icon: Sparkles, badge: pendingRequests.length > 0 ? pendingRequests.length : null },
    { id: 'subscription', label: 'Mi Suscripción', icon: KeyRound, badge: !isSubscriptionActive ? 'Vencido' : null },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

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
              onClick={() => onOpenAuthModal?.('login')}
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

  // Si el usuario tiene cuenta pero todavía no ha registrado su tienda
  if (!merchantStore) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        {/* Luces de fondo ambient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 text-slate-950">
            <Store className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-400/20">
            Cuenta Creada • Falta Registrar Tienda
          </span>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            ¡Hola, {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Comerciante'}!
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            Ya tienes tu cuenta de dueño activa, pero aún no has registrado tu minimarket. Completa los datos de tu tienda para comenzar a recibir pedidos.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => onOpenAuthModal?.('register')}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Completar Registro de mi Tienda</span>
            </button>

            <button
              onClick={() => setViewMode('customer')}
              className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors border border-slate-700/60 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Volver a la Vista Vecino (Catálogo)</span>
            </button>

            <button
              onClick={() => {
                signOutMerchant();
                setViewMode('customer');
              }}
              className="w-full py-2.5 px-4 text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
            >
              Cerrar Sesión
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
          {/* Botón Compartir Tienda */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs transition-all cursor-pointer shadow-2xs group"
            title="Compartir enlace y ubicación de tu tienda por diferentes aplicaciones"
          >
            <Share2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Compartir Tienda</span>
          </button>

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
                <p 
                  className="text-[10px] text-slate-400 truncate"
                  title={storeConfig?.address?.trim() || storeConfig?.zone?.trim() || 'Sin ubicación'}
                >
                  {storeConfig?.address?.trim() || storeConfig?.zone?.trim() || 'Sin ubicación'}
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

            {/* Chip Dinámico de Suscripción / Cuenta Regresiva UTC-4 */}
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                !isSubscriptionActive
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
              title="Haz clic para gestionar tu suscripción"
            >
              {!isSubscriptionActive ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Suscripción Vencida</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono">
                    {subscriptionTimeRemaining.days > 0 
                      ? `${subscriptionTimeRemaining.days}d ${subscriptionTimeRemaining.hours}h` 
                      : `${String(subscriptionTimeRemaining.minutes).padStart(2, '0')}:${String(subscriptionTimeRemaining.seconds).padStart(2, '0')}`}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Quick Action CTA Buttons */}
          <div className="flex items-center gap-2">
            {/* Botón de Venta Rápida Directa (Con bloqueo por suscripción) */}
            <button
              onClick={() => {
                if (!isSubscriptionActive) {
                  setIsBlockedModalOpen(true);
                } else {
                  setIsPosModalOpen(true);
                }
              }}
              className={`h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                !isSubscriptionActive
                  ? 'bg-slate-800 hover:bg-slate-900 text-slate-200 shadow-slate-800/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
              title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Abrir terminal de Venta Rápida en mostrador"}
            >
              {!isSubscriptionActive ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Receipt className="w-3.5 h-3.5 text-white" />
              )}
              <span>Venta Rápida</span>
              {!isSubscriptionActive && (
                <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-md font-black ml-0.5">
                  Bloqueado
                </span>
              )}
            </button>


            <button
              onClick={() => setIsPrintKitOpen(true)}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Diseñar e imprimir cartel QR para vitrina o carpa de mostrador"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Cartel QR Mostrador</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Descargar o imprimir reporte contable de ventas (PDF, Excel)"
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar Reporte</span>
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
              
              {/* Encabezado del Panel con Selector de Período / Horario */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl text-slate-900 tracking-tight font-black flex flex-wrap items-center gap-2">
                    <span>Panel de Control</span>
                    <span className="text-emerald-600 font-extrabold truncate">{storeConfig.name}</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {kanbanTimeRange === 'today' && '📅 Pedidos y ventas de hoy (desde las 00:00)'}
                    {kanbanTimeRange === '24h' && '⏱️ Pedidos y ventas de las últimas 24 horas'}
                    {kanbanTimeRange === 'all' && '🌐 Historial completo de pedidos y ventas'}
                  </p>
                </div>

                {/* Selector de Período de Horario para el Tablero Kanban y Ventas */}
                <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100/90 p-1 sm:p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleSetKanbanTimeRange('today')}
                    className={`h-9 sm:h-auto px-2 sm:px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      kanbanTimeRange === 'today'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                    title="Filtrar pedidos estrictamente desde las 00:00 del día actual"
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Día Actual (Hoy)</span>
                    <span className="sm:hidden">Hoy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetKanbanTimeRange('24h')}
                    className={`h-9 sm:h-auto px-2 sm:px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      kanbanTimeRange === '24h'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                    title="Filtrar pedidos de las últimas 24 horas (desde hace 24h hasta ahora)"
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Últimas 24 Horas</span>
                    <span className="sm:hidden">24 Horas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetKanbanTimeRange('all')}
                    className={`h-9 sm:h-auto px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer whitespace-nowrap ${
                      kanbanTimeRange === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                    }`}
                    title="Ver todos los pedidos sin filtro de horario"
                  >
                    <span>Todos</span>
                  </button>
                </div>
              </div>

              {/* 3 TOP OPERATIONAL KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* KPI 1: Ventas del Período Seleccionado */}
                <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-500 font-medium">
                        {kanbanTimeRange === 'today' ? 'Ventas de Hoy' : kanbanTimeRange === '24h' ? 'Ventas (Últimas 24h)' : 'Ventas Totales'}
                      </span>
                      <p className="text-2xl text-slate-900 tracking-tight font-black">
                        {currency} {totalSales.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('sales')}
                      className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold cursor-pointer transition-colors"
                      title="Ver Historial de Ventas"
                    >
                      <Receipt className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      {validOrders.length} {kanbanTimeRange === 'today' ? 'cobrados hoy' : kanbanTimeRange === '24h' ? 'cobrados (24h)' : 'cobrados'}
                    </span>
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
                    <span>
                      {storeConfig?.enableDelivery === false
                        ? `${onTheWayOrders.length} listos`
                        : `${onTheWayOrders.filter(o => o.deliveryType !== 'delivery').length} listos / ${onTheWayOrders.filter(o => o.deliveryType === 'delivery').length} ruta`}
                    </span>
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

              {/* Alerta de pedidos activos pendientes de períodos anteriores */}
              {olderActiveOrders.length > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-amber-900 leading-tight">
                        Atención: Hay {olderActiveOrders.length} pedido(s) activo(s) ({olderActiveOrders.filter(o => o.status === 'pending').length} pendientes) realizados antes del filtro actual
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        Estás viendo {kanbanTimeRange === 'today' ? 'estrictamente el día actual' : 'las últimas 24 horas'}. No olvides atender pedidos de días anteriores.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {kanbanTimeRange === 'today' && (
                      <button
                        type="button"
                        onClick={() => handleSetKanbanTimeRange('24h')}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                      >
                        Ver Últimas 24h
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSetKanbanTimeRange('all')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-xs cursor-pointer transition-colors shadow-2xs"
                    >
                      Ver Todos ({allActiveOrders.length} activos)
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* ALERTA Y CONFIGURACIÓN DE NOTIFICACIONES PUSH EN DISPOSITIVO              */}
              {/* ========================================================================= */}
              <OrderNotificationBanner 
                storeConfig={storeConfig} 
                soundAlertsActive={soundAlertsActive} 
                onToggleSound={() => setSoundAlertsActive(prev => !prev)} 
                showToast={showToast} 
              />

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
                              {order.deliveryType === 'delivery' ? (
                                <>
                                  <p className="text-xs font-semibold text-slate-900 mt-1">
                                    🏢 {[order.customer?.tower, order.customer?.apartment].filter(Boolean).join(' • ') || 'A Domicilio'}
                                  </p>
                                  {order.customer?.condominium && (
                                    <p className="text-[11px] text-slate-400">{order.customer.condominium}</p>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs font-bold text-emerald-800 mt-1 flex items-center gap-1">
                                  <span>🏪 Retiro en Tienda (Mostrador)</span>
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700">
                                {order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro Local'}
                              </span>
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Deseas descartar/eliminar el pedido #${order.id}?`)) {
                                    deleteOrder(order.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Descartar / Eliminar pedido"
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
                              {order.deliveryType === 'delivery' ? (
                                <p className="text-xs font-semibold text-slate-900">{[order.customer?.tower, order.customer?.apartment].filter(Boolean).join(' • ') || 'A Domicilio'}</p>
                              ) : (
                                <p className="text-xs font-bold text-emerald-800">🏪 Retiro en Mostrador</p>
                              )}
                              <p className="text-xs text-slate-400">{order.customer?.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                                {order.paymentMethod === 'qr' ? 'QR Pagado' : 'Efectivo'}
                              </span>
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Deseas descartar/eliminar el pedido #${order.id}?`)) {
                                    deleteOrder(order.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Descartar / Eliminar pedido"
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
                              showToast(
                                order.deliveryType === 'delivery'
                                  ? `Pedido #${order.id} despachado a ruta.`
                                  : `Pedido #${order.id} listo para retiro en mostrador.`,
                                'info'
                              );
                            }}
                            className={`w-full h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                              order.deliveryType === 'delivery'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            type="button"
                          >
                            <span>{order.deliveryType === 'delivery' ? 'Despachar / Enviar Repartidor ➔' : 'Listo para Recoger en Tienda ➔'}</span>
                            {order.deliveryType === 'delivery' ? <Bike className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />}
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

                  {/* COLUMNA 3: 🟣 EN RUTA / LISTOS */}
                  <div className="rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${storeConfig?.enableDelivery === false ? 'bg-emerald-500' : 'bg-purple-500'}`}></span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {storeConfig?.enableDelivery === false ? 'Listos para Recoger' : 'Listos / En Ruta'}
                        </h3>
                        <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${
                          storeConfig?.enableDelivery === false 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {onTheWayOrders.length}
                        </span>
                      </div>
                      {storeConfig?.enableDelivery === false ? (
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Truck className="w-4 h-4 text-purple-500" />
                      )}
                    </div>

                    {onTheWayOrders.map(order => {
                      const isPickup = order.deliveryType !== 'delivery';
                      return (
                        <div 
                          key={order.id} 
                          className="group relative rounded-xl bg-white p-3.5 shadow-xs border border-slate-100 hover:shadow-md transition-all"
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${isPickup ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                          <div className="pl-2 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base font-bold text-slate-900">#{order.id}</span>
                                  <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${
                                    isPickup 
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                                  }`}>
                                    {isPickup ? 'Listo en Tienda 🛍️' : 'En camino 🛵'}
                                  </span>
                                </div>
                                {isPickup ? (
                                  <p className="text-xs font-bold text-emerald-800 mt-0.5">
                                    🏪 Mostrador: Esperando al vecino
                                  </p>
                                ) : (
                                  <p className="text-xs font-semibold text-slate-900 mt-0.5">
                                    🏢 {[order.customer?.tower, order.customer?.apartment].filter(Boolean).join(' • ') || 'A Domicilio'}
                                  </p>
                                )}
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {order.customer?.name} {order.customer?.phone ? `• ${order.customer.phone}` : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-sm font-black text-slate-900">
                                  {currency} {order.total.toFixed(2)}
                                </span>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`¿Deseas descartar/eliminar el pedido #${order.id}?`)) {
                                      deleteOrder(order.id);
                                    }
                                  }}
                                  className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Descartar / Eliminar pedido"
                                  type="button"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Banner informativo de estado de entrega */}
                            {isPickup ? (
                              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2">
                                <Store className="w-4 h-4 text-emerald-700 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-emerald-950 truncate">
                                    {order.paymentMethod === 'cash' 
                                      ? `Cobrar en caja: ${currency} ${order.total.toFixed(2)}` 
                                      : order.paymentMethod === 'qr' 
                                      ? 'Pagado vía QR Digital' 
                                      : 'Cobrar con Tarjeta en Tienda'}
                                  </p>
                                  <p className="text-[10px] text-emerald-700 truncate">
                                    {order.paymentMethod === 'cash' && order.cashChangeFor 
                                      ? `Paga con ${currency} ${order.cashChangeFor} (Vuelto: ${currency} ${(order.cashChangeFor - order.total).toFixed(2)})` 
                                      : 'Productos listos en mostrador'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center gap-2">
                                <Bike className="w-4 h-4 text-purple-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-purple-950 truncate">Repartidor en Ruta</p>
                                  <p className="text-[10px] text-purple-700 truncate">Hacia la puerta del vecino</p>
                                </div>
                              </div>
                            )}

                            {/* Botones de acción y WhatsApp */}
                            <div className="space-y-1.5 pt-1">
                              <button 
                                onClick={() => {
                                  updateOrderStatus(order.id, 'delivered');
                                  showToast(
                                    isPickup 
                                      ? `¡Pedido #${order.id} entregado en mostrador!` 
                                      : `¡Pedido #${order.id} marcado como entregado!`, 
                                    'success'
                                  );
                                }}
                                className="w-full h-9 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
                                type="button"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isPickup ? 'Entregar al Vecino en Caja [✓]' : 'Confirmar Entrega [✓]'}</span>
                              </button>

                              <button 
                                onClick={() => handleNotifyWhatsApp(
                                  order, 
                                  isPickup 
                                    ? `¡Hola ${order.customer?.name || 'Vecino'}! Tu pedido #${order.id} en ${storeConfig?.name || 'la tienda'} ya está empacado y listo para que pases a recogerlo en el local. ¡Te esperamos!` 
                                    : `¡Hola ${order.customer?.name || 'Vecino'}! El repartidor ya está abajo con tu pedido #${order.id}.`
                                )}
                                className="w-full h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors cursor-pointer"
                                type="button"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{isPickup ? 'Avisar que ya puede recoger' : 'Avisar que está abajo'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {onTheWayOrders.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        {storeConfig?.enableDelivery === false ? 'No hay pedidos listos para recoger' : 'No hay pedidos en ruta ni listos'}
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
                            {order.deliveryType === 'delivery' ? (
                              <p className="text-xs font-semibold text-slate-800">
                                🏢 {[order.customer?.tower, order.customer?.apartment].filter(Boolean).join(' • ') || 'A Domicilio'}
                              </p>
                            ) : (
                              <p className="text-xs font-bold text-emerald-800">
                                🏪 Retirado en Mostrador
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-sm font-bold text-slate-900">{currency} {order.total.toFixed(2)}</span>
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Deseas eliminar del registro el pedido #${order.id}?`)) {
                                  deleteOrder(order.id);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar pedido"
                              type="button"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-xs pt-1 border-t border-slate-100">
                          <span>{(order.paymentMethod || order.payment_method || 'cash').toUpperCase()}</span>
                          <span className="text-emerald-700 font-bold text-[11px]">★ 5.0 Exitoso</span>
                        </div>
                      </div>
                    ))}
                    {deliveredOrders.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('sales')}
                        className="w-full py-2 text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/90 rounded-xl transition-colors cursor-pointer"
                      >
                        +{deliveredOrders.length - 4} pedidos más entregados • Ver historial →
                      </button>
                    )}
                    {deliveredOrders.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        {kanbanTimeRange === 'today' 
                          ? 'No hay pedidos entregados aún hoy' 
                          : kanbanTimeRange === '24h'
                          ? 'No hay pedidos entregados en las últimas 24 horas'
                          : 'No hay pedidos entregados'}
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
                      🏪 Mostrador ({validOrders.filter(isPickupOrPosOrder).length})
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
                      🛵 Domicilio ({validOrders.filter(o => !isPickupOrPosOrder(o)).length})
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
                      const idStr = String(tx.id || '');
                      const isPos = idStr.includes('POS-') || tx.customer?.name?.includes('Presencial') || tx.customer?.name?.includes('Mostrador') || tx.customer?.name?.includes('Cliente Mostrador');
                      const isPickup = tx.deliveryType === 'pickup' || tx.delivery_type === 'pickup' || tx.customer?.condominium === 'Retiro en Tienda' || tx.customer?.condominium === 'En Tienda' || tx.customer?.apartment === 'Mostrador';
                      const payMethod = tx.paymentMethod || tx.payment_method || 'cash';
                      const txTime = tx.createdAt || tx.created_at;
                      const displayId = getDisplayOrderId(tx.id);
                      const itemsCount = tx.items?.length || 1;

                      return (
                        <div 
                          key={tx.id}
                          className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          {/* Izquierda: Método de Pago + Datos del Cliente / Origen + Metadatos */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 md:mt-0 ${
                              payMethod === 'cash' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                                : payMethod === 'qr'
                                ? 'bg-cyan-50 text-cyan-600 border border-cyan-200/80'
                                : payMethod === 'credit'
                                ? 'bg-purple-50 text-purple-600 border border-purple-200/80'
                                : 'bg-blue-50 text-blue-600 border border-blue-200/80'
                            }`}>
                              {payMethod === 'cash' && <Banknote className="w-5 h-5" />}
                              {payMethod === 'qr' && <QrCode className="w-5 h-5" />}
                              {payMethod === 'card' && <CreditCard className="w-5 h-5" />}
                              {payMethod === 'credit' && <BookOpen className="w-5 h-5" />}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              {/* Fila 1: Origen de la Venta + Badge de método de pago */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                  {isPos ? (
                                    '🏪 Venta Rápida de Mostrador'
                                  ) : isPickup ? (
                                    `🛍️ ${tx.customer?.name || 'Vecino'} • Retiro en Tienda`
                                  ) : (
                                    `🛵 ${tx.customer?.name ? `${tx.customer.name} • ` : ''}${tx.customer?.condominium || 'Domicilio'}`
                                  )}
                                  {!isPos && !isPickup && (tx.customer?.tower || tx.customer?.apartment) && (
                                    <span className="font-semibold text-slate-600 ml-1">
                                      ({[tx.customer?.tower, tx.customer?.apartment].filter(Boolean).join(' - ')})
                                    </span>
                                  )}
                                </span>

                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                  payMethod === 'cash' ? 'bg-emerald-100 text-emerald-800' :
                                  payMethod === 'qr' ? 'bg-cyan-100 text-cyan-800' :
                                  payMethod === 'credit' ? 'bg-purple-100 text-purple-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {payMethod === 'cash' ? '💵 Efectivo' : payMethod === 'qr' ? '📱 QR Simple' : payMethod === 'credit' ? '📒 A Cuenta' : '💳 Tarjeta POS'}
                                </span>
                              </div>

                              {/* Fila 2: ID limpio en píldora + Cantidad de productos + Tiempo relativo */}
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 font-medium flex-wrap">
                                <span 
                                  className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 whitespace-nowrap" 
                                  title={`ID completo: #${tx.id}`}
                                >
                                  #{displayId}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="whitespace-nowrap text-slate-500">
                                  {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 whitespace-nowrap text-slate-400">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{formatRelativeTime(txTime)}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Derecha / Fila inferior en móvil: Estado + Importe + Borrar */}
                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100/90">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
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

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                                  +{currency} {(tx.total || 0).toFixed(2)}
                                </span>
                              </div>
                              <button
                                onClick={() => setTransactionToDelete(tx)}
                                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Eliminar transacción del registro"
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

          {/* TAB 2: PUNTO DE VENTA */}
          {activeTab === 'pos' && (
            <div className="animate-fadeIn">
              {isSubscriptionActive ? (
                <PosTerminal />
              ) : (
                <div className="max-w-2xl mx-auto my-8 p-8 sm:p-12 bg-white rounded-3xl border border-slate-200/90 shadow-xl text-center">
                  <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Lock className="w-10 h-10 animate-pulse" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-700 mb-3">
                    Módulo Bloqueado
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                    Punto de Venta (POS) Bloqueado
                  </h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
                    El período de prueba de tu tienda ha expirado. Para continuar realizando ventas presenciales en mostrador, canjea un código de activación en la sección «Mi Suscripción».
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('subscription')}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Ir a Mi Suscripción y Canjear</span>
                    </button>
                    <button
                      onClick={() => setIsBlockedModalOpen(true)}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Canjear Código Aquí</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORIAL DE VENTAS */}
          {activeTab === 'sales' && (
            <div className="animate-fadeIn">
              <SalesHistory />
            </div>
          )}

          {/* TAB: LIBRETA DE CRÉDITOS / FIAO VECINAL */}
          {activeTab === 'credits' && (
            <div className="animate-fadeIn">
              <CreditManager />
            </div>
          )}

          {/* TAB 4: INVENTARIO */}
          {activeTab === 'inventory' && (
            <div className="animate-fadeIn">
              <InventoryManager />
            </div>
          )}

          {/* TAB 5: PROVEEDORES & REABASTECIMIENTO */}
          {activeTab === 'suppliers' && (
            <div className="animate-fadeIn">
              <SupplierManager />
            </div>
          )}

          {/* TAB 6: BUZÓN DE VECINOS */}
          {activeTab === 'requests' && (
            <div className="animate-fadeIn">
              <ProductRequestsAdmin />
            </div>
          )}

          {/* TAB 6: MI SUSCRIPCIÓN */}
          {activeTab === 'subscription' && (
            <div className="animate-fadeIn">
              <SubscriptionManager />
            </div>
          )}

          {/* TAB 7: CONFIGURACIÓN */}
          {activeTab === 'settings' && (
            <div className="animate-fadeIn">
              <StoreSettings />
            </div>
          )}

        </div>
      </main>



      {/* ========================================================================= */}
      {/* MODAL DE VENTA RÁPIDA (POS Terminal Directo)                              */}
      {/* ========================================================================= */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-6xl h-[94vh] max-h-[94vh] bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header del Panel de Venta Rápida */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight whitespace-nowrap">
                    Punto de Venta (POS)
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Venta Rápida de Mostrador</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsPosModalOpen(false)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Cerrar punto de venta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido interactivo: Punto de Venta */}
            <div className="p-3 sm:p-5 overflow-y-auto flex-1">
              <PosTerminal 
                onClose={() => setIsPosModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bloqueo de Suscripción */}
      <SubscriptionBlockedModal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        onNavigateToSubscription={() => {
          setIsBlockedModalOpen(false);
          setActiveTab('subscription');
        }}
      />

      {/* Modal de Exportación de Reporte de Ventas (PDF, Excel, CSV) */}
      <ExportSalesReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Modal para Compartir Tienda (Multicanal / Apps) */}
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Modal Kit Imprimible de Mostrador & QR de Vitrina */}
      <StorePrintKitModal
        isOpen={isPrintKitOpen}
        onClose={() => setIsPrintKitOpen(false)}
      />

      {/* Modal de confirmación para eliminar transacción del Feed */}
      {transactionToDelete && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setTransactionToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 p-5 sm:p-6 text-center space-y-4 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                ¿Descartar transacción?
              </h3>
              <p className="text-xs text-slate-500">
                Esta acción eliminará el pedido del registro y afectará los reportes contables.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-left space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Pedido:</span>
                <span className="font-mono font-bold text-slate-800">#{getDisplayOrderId(transactionToDelete.id)}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                <span className="text-slate-500 font-medium">Monto cobrado:</span>
                <span className="font-black text-slate-900">+{currency} {(transactionToDelete.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteOrder(transactionToDelete.id);
                  setTransactionToDelete(null);
                  showToast('Transacción descartada.', 'info');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Descartar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
