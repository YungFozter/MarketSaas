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
  RotateCcw,
  Ban,
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bike,
  Layers,
  ShieldAlert,
  MessageCircle,
  Bell,
  Crown,
  CheckSquare,
  Square,
  Receipt,
  Lock,
  KeyRound,
  BookOpen,
  HelpCircle,
  Megaphone
} from 'lucide-react';
import { InventoryManager } from './InventoryManager';
import { PosTerminal } from './PosTerminal';
import { SalesHistory } from './SalesHistory';
import { CreditManager } from './CreditManager';
import { StorePrintKitModal } from './StorePrintKitModal';
import { StoreSettings } from './StoreSettings';
import { StoreScheduleManager } from './StoreScheduleManager';
import { ProductRequestsAdmin } from './ProductRequestsAdmin';
import { StoreUserGuide } from './StoreUserGuide';
import { SubscriptionManager } from './SubscriptionManager';
import { SupplierManager } from './SupplierManager';
import { SubscriptionBlockedModal } from './SubscriptionBlockedModal';
import { ExportSalesReportModal } from './ExportSalesReportModal';
import { ShareStoreModal } from './ShareStoreModal';
import { CashRegisterModal } from './CashRegisterModal';
import { WeeklySummaryModal } from './WeeklySummaryModal';
import { OrderNotificationBanner } from './OrderNotificationBanner/OrderNotificationBanner';
import { playOrderNotificationSound, sendOrderNotification } from '../../services/orderNotificationService';
import { useStore, filterOutDemoSuppliers } from '../../context/StoreContext';
import { escapeHtml } from '../../utils/formatters';
import { 
  roundMoney, 
  calculateSplitPortions, 
  formatPaymentBreakdownText,
  PAYMENT_METHODS 
} from '../../utils/paymentUtils';
import './AdminHome.css';

export const AdminHome = ({ onOpenAuthModal }) => {
  const { 
    orders, 
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
    restoreOrder,
    purgeOrderPermanently,
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
    isProPlan,
    activePlanType,
    subscriptionTimeRemaining,
    formatBoliviaDateTime,
    creditCustomers = [],
    isSuperAdmin,
    isImpersonating,
    stopImpersonating,
    systemBroadcast,
    storeOpenStatus,
    toggleStoreOpenStatus
  } = useStore();

  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab && ['kanban', 'pos', 'sales', 'credits', 'inventory', 'suppliers', 'analytics', 'requests', 'schedule', 'settings', 'subscription'].includes(urlTab)) {
        return urlTab;
      }
      try {
        const saved = localStorage.getItem(`marketsaas_${tenantSlug}_admin_tab`);
        if (saved && ['kanban', 'pos', 'sales', 'credits', 'inventory', 'suppliers', 'analytics', 'requests', 'schedule', 'settings', 'subscription'].includes(saved)) {
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('marketsaas_admin_sidebar_collapsed');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('marketsaas_admin_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };
  const [soundAlertsActive, setSoundAlertsActive] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFooterToolsOpen, setIsFooterToolsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('marketsaas_admin_footer_tools_open');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  const toggleFooterTools = () => {
    setIsFooterToolsOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('marketsaas_admin_footer_tools_open', String(next));
      } catch (e) {}
      return next;
    });
  };

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
  const [blockedFeatureName, setBlockedFeatureName] = useState('');
  const [blockedVariant, setBlockedVariant] = useState('expired');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrintKitOpen, setIsPrintKitOpen] = useState(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);
  const [isWeeklySummaryModalOpen, setIsWeeklySummaryModalOpen] = useState(false);
  const [isExpandedDelivered, setIsExpandedDelivered] = useState(false);
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'pos' | 'delivery' | 'omitted'
  const [feedPage, setFeedPage] = useState(1);
  const feedScrollRef = useRef(null);
  const FEED_PAGE_SIZE = 10;

  const handleSetFeedFilter = (filter) => {
    setFeedFilter(filter);
    setFeedPage(1);
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSetFeedPage = (newPage) => {
    setFeedPage(newPage);
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Control de visibilidad del botón flotante para volver arriba al Tablero Kanban
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (activeTab !== 'kanban') {
      setShowScrollTop(false);
      return;
    }
    const handleWindowScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [activeTab]);

  // Transmisión y Chaining fluido de Scroll para el Feed de Actividad:
  // Al llegar al tope superior de la lista scrolleable del feed (scrollTop <= 0) y seguir subiendo
  // (mediante deslizamiento táctil en móviles o rueda/trackpad), el evento transmite el scroll
  // directamente a la página principal para volver al Tablero Kanban sin atascos ni zonas muertas.
  useEffect(() => {
    if (activeTab !== 'kanban') return;
    const el = feedScrollRef.current;
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
      // y la lista del Feed ya se encuentra en su tope superior (scrollTop <= 0)
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
  }, [activeTab]);

  // Bloquear scroll de la página de fondo cuando el modal de Venta Rápida (POS) está activo
  useEffect(() => {
    if (isPosModalOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalOverscroll = document.body.style.overscrollBehavior;
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'contain';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.overscrollBehavior = originalOverscroll;
      };
    }
  }, [isPosModalOpen]);

  // Control de estado de cierre de sesión
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOutMerchant();
    } finally {
      setIsSigningOut(false);
    }
  };

  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [mobileKanbanTab, setMobileKanbanTab] = useState('all'); // 'all' | 'pending' | 'preparing' | 'on_the_way' | 'delivered'
  const [dismissedBroadcast, setDismissedBroadcast] = useState(false);

  const getDisplayOrderId = (id) => {
    if (!id) return '';
    const str = String(id);
    if (str.includes('POS-')) {
      return 'POS-' + str.split('POS-')[1];
    }
    return str.length > 14 ? str.slice(-8) : str;
  };

  const renderPaymentBadge = (method, order = null) => {
    const rawMethod = method || (order?.paymentMethod || order?.payment_method);
    const m = String(rawMethod || 'cash').toLowerCase();

    if (m === 'combined' || m === 'split' || order?.splitPayment || order?.split_payment) {
      const breakdown = order ? formatPaymentBreakdownText(order, currency) : 'Efe + QR + POS';
      return (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-800 text-[10px] font-black border border-violet-200/90 uppercase tracking-wide shadow-2xs"
          title={`Pago Combinado: ${breakdown}`}
        >
          <Layers className="w-3 h-3 text-violet-600 shrink-0" />
          <span>Combinado ({breakdown})</span>
        </span>
      );
    }
    if (m === 'credit') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/80 uppercase tracking-wide">
          📒 A Cuenta
        </span>
      );
    }
    if (m === 'qr') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 text-[10px] font-bold border border-cyan-200/80 uppercase tracking-wide">
          📱 QR Simple
        </span>
      );
    }
    if (m === 'card') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/80 uppercase tracking-wide">
          💳 Tarjeta POS
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/80 uppercase tracking-wide">
        💵 Efectivo
      </span>
    );
  };

  const currency = storeConfig?.currencySymbol || 'Bs.';
  const isOpen = storeOpenStatus ? storeOpenStatus.isOpen : (storeConfig?.isOpen !== false);

  // Pedidos filtrados según el rango temporal seleccionado en el Kanban ('today' vs '24h' vs 'all')
  const timeFilteredOrders = (orders || []).filter(o => {
    if (!o) return false;
    return matchesKanbanTimeRange(o.createdAt || o.created_at, kanbanTimeRange);
  });

  // Cálculos de KPIs en tiempo real según el período de horario activo (Ventas y Cierre de Caja)
  const validOrders = timeFilteredOrders.filter(o => o && o.status === 'delivered');
  const totalSales = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const averageTicket = validOrders.length > 0 ? (totalSales / validOrders.length) : 0;
  
  // Desglose por método de pago para Ventas y Cierre de Caja (soportando camelCase, snake_case y Pago Combinado)
  const getOrderPaymentMethod = (o) => o?.paymentMethod || o?.payment_method || 'cash';

  const cashOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'cash');
  const qrOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'qr');
  const cardOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'card');
  const creditOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'credit');
  const combinedOrders = validOrders.filter(o => getOrderPaymentMethod(o) === 'combined' || o?.splitPayment || o?.split_payment);

  // Totales acumulados exactos sumando porciones de órdenes simples y órdenes con Pago Combinado
  let totalCashSales = 0;
  let totalQrSales = 0;
  let totalCardSales = 0;
  let totalCreditSales = 0;

  validOrders.forEach(o => {
    const p = calculateSplitPortions(o);
    totalCashSales += p.cash;
    totalQrSales += p.qr;
    totalCardSales += p.card;
    totalCreditSales += p.credit;
  });

  totalCashSales = roundMoney(totalCashSales);
  totalQrSales = roundMoney(totalQrSales);
  totalCardSales = roundMoney(totalCardSales);
  totalCreditSales = roundMoney(totalCreditSales);

  const totalSalesCount = validOrders.length;
  const totalDaySales = roundMoney(totalCashSales + totalQrSales + totalCardSales);
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
    const address = order.customer?.address || '';
    const ref = order.customer?.reference || '';
    if (address === 'Retiro en Tienda' || address === 'En Tienda' || ref === 'Mostrador') return true;
    if (dType === 'delivery') return false;
    return false;
  };

  // Helper para identificar pedidos omitidos, cancelados o eliminados
  const isOmittedOrDeletedOrder = (o) => Boolean(
    o && (o.status === 'omitted' || o.status === 'cancelled' || o.status === 'deleted' || o.is_deleted || o.isDeleted)
  );

  // Auditoría completa de transacciones: pedidos entregados/cobrados Y pedidos eliminados/omitidos
  const allFeedOrders = (orders || []).filter(o => {
    if (!o) return false;
    return o.status === 'delivered' || isOmittedOrDeletedOrder(o);
  });

  const filteredFeedTransactions = allFeedOrders
    .filter(o => {
      const isOmitted = isOmittedOrDeletedOrder(o);
      if (feedFilter === 'omitted') return isOmitted;
      if (feedFilter === 'pos') return !isOmitted && isPickupOrPosOrder(o);
      if (feedFilter === 'delivery') return !isOmitted && !isPickupOrPosOrder(o);
      return true; // 'all' shows both delivered and omitted
    })
    .sort((a, b) => {
      const timeA = new Date(a.deletedAt || a.deleted_at || a.deliveredAt || a.updatedAt || a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.deletedAt || b.deleted_at || b.deliveredAt || b.updatedAt || b.createdAt || b.created_at || 0).getTime();
      return timeB - timeA;
    });

  const feedTotalCount = filteredFeedTransactions.length;
  const feedTotalPages = Math.max(1, Math.ceil(feedTotalCount / FEED_PAGE_SIZE));
  const safeFeedPage = Math.min(Math.max(1, feedPage), feedTotalPages);

  const feedStartIndex = feedTotalCount === 0 ? 0 : (safeFeedPage - 1) * FEED_PAGE_SIZE + 1;
  const feedEndIndex = Math.min(safeFeedPage * FEED_PAGE_SIZE, feedTotalCount);

  const paginatedFeedTransactions = filteredFeedTransactions.slice(
    (safeFeedPage - 1) * FEED_PAGE_SIZE,
    safeFeedPage * FEED_PAGE_SIZE
  );

  const recentTransactions = paginatedFeedTransactions;

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

  // Pedidos activos (Pendientes, En Preparación, En Camino):
  // NUNCA deben ocultarse por filtros de fecha, pues representan trabajo en curso y atención prioritaria inmediata.
  const activeOrders = (orders || []).filter(o => 
    o && !isOmittedOrDeletedOrder(o) && (o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way')
  );
  const pendingOrders = activeOrders.filter(o => o.status === 'pending');
  const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
  const onTheWayOrders = activeOrders.filter(o => o.status === 'on_the_way');

  // Pedidos entregados / completados: sí responden al filtro temporal ('today', '24h', 'all') y ordenados por fecha descendente
  const deliveredOrders = (orders || [])
    .filter(o => {
      if (!o || o.status !== 'delivered' || isOmittedOrDeletedOrder(o)) return false;
      return matchesKanbanTimeRange(o.deliveredAt || o.updatedAt || o.createdAt || o.created_at, kanbanTimeRange);
    })
    .sort((a, b) => new Date(b.deliveredAt || b.updatedAt || b.createdAt || b.created_at || 0).getTime() - new Date(a.deliveredAt || a.updatedAt || a.createdAt || a.created_at || 0).getTime());

  // Lista consolidada de pedidos visibles en el Kanban (para contadores de pestañas y vista global)
  const visibleKanbanOrders = [...activeOrders, ...deliveredOrders];

  // Identificar pedidos activos anteriores al período temporal seleccionado (para alerta visual preventiva)
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

  // Al montar la Vista Dueño o recibir/actualizar pedidos, alertar inmediatamente si hay pedidos pendientes recientes no atendidos
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    const unnotifiedPending = orders.filter(o => {
      if (!o || o.status !== 'pending' || !o.id) return false;
      if (notifiedOrderIds.current.has(o.id)) return false;
      const orderAgeMs = Date.now() - new Date(o.createdAt || o.created_at || Date.now()).getTime();
      // Notificar si el pedido tiene menos de 2 horas de antigüedad
      return orderAgeMs < 2 * 60 * 60 * 1000;
    });

    if (unnotifiedPending.length > 0) {
      unnotifiedPending.forEach(o => notifiedOrderIds.current.add(o.id));
      const newest = unnotifiedPending[0];
      if (soundAlertsActive) {
        playOrderNotificationSound();
      }
      sendOrderNotification(newest, storeConfig);
      showToast?.(
        unnotifiedPending.length === 1
          ? `🔔 ¡Tienes un pedido pendiente #${newest.id} de ${newest.customer?.name || 'Vecino'}!`
          : `🔔 ¡Tienes ${unnotifiedPending.length} pedidos pendientes por atender!`,
        'info'
      );
    }
  }, [orders, soundAlertsActive, showToast, storeConfig]);

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

  // Toggle de apertura / cierre en vivo (Sincronizado de forma permanente con Supabase y en la nube)
  const handleToggleStoreOpen = (targetState) => {
    toggleStoreOpenStatus(targetState ? 'manual_open' : 'manual_closed');
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
                <p style="margin:2px 0;"><strong>Destino:</strong> ${escapeHtml(order.customer?.address || 'A Domicilio')}</p>
                ${order.customer?.reference ? `<p style="margin:2px 0;"><strong>Referencia:</strong> ${escapeHtml(order.customer.reference)}</p>` : ''}
                ${order.distanceKm ? `<p style="margin:2px 0;"><strong>Distancia:</strong> ~${order.distanceKm} km</p>` : ''}
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
              <span class="bold">${
                (order.paymentMethod === 'combined' || order.splitPayment || order.split_payment)
                  ? 'PAGO COMBINADO'
                  : String(order.paymentMethod || 'cash').toUpperCase()
              }</span>
            </div>
            ${(() => {
              if (order.paymentMethod === 'combined' || order.splitPayment || order.split_payment) {
                const sp = calculateSplitPortions(order);
                const splitObj = order.splitPayment || order.split_payment;
                let html = '';
                if (sp.cash > 0) html += `<div class="row"><span>• Efectivo:</span><span>Bs. ${sp.cash.toFixed(2)}</span></div>`;
                if (sp.qr > 0) html += `<div class="row"><span>• QR Simple:</span><span>Bs. ${sp.qr.toFixed(2)}</span></div>`;
                if (sp.card > 0) html += `<div class="row"><span>• Tarjeta POS:</span><span>Bs. ${sp.card.toFixed(2)}</span></div>`;
                if (Number(splitObj?.change) > 0) html += `<div class="row bold"><span>Cambio Efectivo:</span><span>Bs. ${Number(splitObj.change).toFixed(2)}</span></div>`;
                return html;
              }
              if (order.paymentMethod === 'cash' && order.cashChangeFor) {
                return `
                  <div class="row"><span>Paga con:</span><span>Bs. ${order.cashChangeFor}</span></div>
                  <div class="row bold"><span>Vuelto:</span><span>Bs. ${(order.cashChangeFor - order.total).toFixed(2)}</span></div>
                `;
              }
              return '';
            })()}
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
        text = `¡Hola ${order.customer.name}! Tu pedido #${order.id} ya está casi listo en el mostrador de ${storeConfig.name} y saldrá en breve hacia ${order.customer.address || 'tu domicilio'}.`;
      } else if (order.status === 'on_the_way') {
        text = `¡Hola ${order.customer.name}! 🛵 Tu pedido #${order.id} ya va en camino hacia ${order.customer.address || 'tu ubicación'}. ${order.customer.reference ? `(Ref: ${order.customer.reference})` : ''} ¡Por favor atento!`;
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
    { id: 'kanban', label: 'Gestión de Pedidos', icon: LayoutDashboard, badge: pendingOrders.length },
    { id: 'pos', label: 'Punto de Venta', icon: Store, badge: !isSubscriptionActive ? '🔒' : null },
    { id: 'sales', label: 'Historial de Ventas', icon: Receipt },
    { id: 'credits', label: 'Libreta de Deudas', icon: BookOpen, badge: creditDebtorsCount > 0 ? `${creditDebtorsCount} debe` : null },
    { id: 'inventory', label: 'Inventario', icon: Package, badge: lowStockProducts.length > 0 ? lowStockProducts.length : null },
    { id: 'suppliers', label: 'Proveedores', icon: Truck, badge: suppliersVisitingToday.length > 0 ? 'Hoy' : null },
    { id: 'requests', label: 'Buzón Vecinos', icon: Sparkles, badge: pendingRequests.length > 0 ? pendingRequests.length : null },
    { id: 'schedule', label: 'Horario', icon: Clock, badge: storeOpenStatus ? (storeOpenStatus.isOpen ? 'Abierto' : 'Cerrado') : null },
    { id: 'subscription', label: 'Mi Suscripción', icon: KeyRound, badge: !isSubscriptionActive ? 'Vencido' : null },
    { id: 'settings', label: 'Configuración', icon: Settings },
    { id: 'guide', label: 'Cómo Usar', icon: HelpCircle, badge: 'Ayuda' },
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
  if (!merchantStore && !isImpersonating && !isSuperAdmin) {
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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] text-slate-900 antialiased font-sans">
      
      {/* ========================================================================= */}
      {/* 1. MODERN VERTICAL LEFT SIDEBAR (Desktop/Media Pantalla: sticky, Mobile: drawer) */}
      {/* ========================================================================= */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/80 flex flex-col h-screen max-h-screen overflow-hidden
        transition-all duration-300 ease-in-out md:static md:sticky md:top-0 shrink-0 shadow-xl md:shadow-none
        ${isSidebarCollapsed ? 'md:w-16' : 'md:w-56 lg:w-64'}
        w-64
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Brand & Store Selector (Fijo arriba: shrink-0) */}
        <div className={`shrink-0 p-3 sm:p-4 border-b border-slate-100 bg-white ${isSidebarCollapsed ? 'md:px-2 md:py-3' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <div 
              onClick={() => {
                if (isSidebarCollapsed) toggleSidebarCollapse();
              }}
              className={`flex items-center gap-2.5 min-w-0 ${isSidebarCollapsed ? 'md:justify-center md:w-full cursor-pointer' : ''}`}
              title={isSidebarCollapsed ? 'Clic para expandir menú' : undefined}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20 shrink-0">
                MS
              </div>
              <div className={`flex flex-col min-w-0 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                <span className="font-extrabold text-base text-slate-900 tracking-tight leading-none truncate">MarketSaaS</span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">Comercio Panel</span>
              </div>
            </div>

            {/* Botón de cierre en móvil */}
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 md:hidden cursor-pointer"
              aria-label="Cerrar menú lateral"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Botón de colapsar en media pantalla y escritorio */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className={`hidden md:flex p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ${isSidebarCollapsed ? 'md:hidden' : ''}`}
              aria-label="Colapsar menú lateral"
              title="Colapsar menú lateral"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Estado Tienda: Abierto / Cerrado */}
          {!isSidebarCollapsed ? (
            <div className="mt-3 flex items-center justify-between p-1 bg-slate-100 rounded-xl">
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
          ) : (
            <div className="mt-3 hidden md:flex justify-center">
              <button
                type="button"
                onClick={() => handleToggleStoreOpen(!isOpen)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
                title={`Tienda ${isOpen ? 'ABIERTA' : 'CERRADA'}. Clic para alternar.`}
              >
                <span className={`w-3 h-3 rounded-full block ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              </button>
            </div>
          )}

          {/* Sonido Pedidos Toggle Indicator */}
          {!isSidebarCollapsed ? (
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
              className={`mt-2 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                soundAlertsActive 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/70' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title="Haz clic para activar o probar el sonido de pedidos"
            >
              <div className="flex items-center gap-1.5">
                {soundAlertsActive ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>Sonido: {soundAlertsActive ? 'ACTIVO' : 'SILENCIADO'}</span>
              </div>
              {soundAlertsActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
            </button>
          ) : (
            <div className="mt-2 hidden md:flex justify-center">
              <button
                type="button"
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
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  soundAlertsActive 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                    : 'bg-slate-100 text-slate-500'
                }`}
                title={`Sonido: ${soundAlertsActive ? 'ACTIVO' : 'SILENCIADO'}`}
              >
                {soundAlertsActive ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links con scroll vertical independiente */}
        <nav className={`flex-1 min-h-0 overflow-y-auto overscroll-contain custom-sidebar-scroll p-2.5 space-y-1 ${isSidebarCollapsed ? 'md:px-2' : ''}`}>
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
                className={`w-full flex items-center ${isSidebarCollapsed ? 'md:justify-center px-2' : 'justify-between px-3'} py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={item.label}
              >
                <div className={`flex items-center gap-2.5 min-w-0 ${isSidebarCollapsed ? 'md:justify-center' : ''}`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className={`truncate ${isSidebarCollapsed ? 'md:hidden' : ''}`}>{item.label}</span>
                </div>
                {item.badge != null && !isSidebarCollapsed && (
                  <span className={`shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white text-emerald-800' 
                      : item.id === 'schedule'
                        ? (storeOpenStatus?.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.badge != null && isSidebarCollapsed && (
                  <span className="hidden md:block w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Store Info & User Profile (Fijo abajo: shrink-0, siempre 100% visible) */}
        <div className={`shrink-0 p-3 border-t border-slate-100 bg-white space-y-2 ${isSidebarCollapsed ? 'md:p-2' : ''}`}>
          {!isSidebarCollapsed && (
            <>
              {/* Header de la sección de herramientas / accesos con botón desplegable */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Accesos Rápidos
                </span>
                <button
                  type="button"
                  onClick={toggleFooterTools}
                  className="text-[11px] font-bold text-slate-400 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-1 rounded-md hover:bg-slate-100"
                  title={isFooterToolsOpen ? 'Plegar accesos' : 'Desplegar accesos'}
                >
                  <span>{isFooterToolsOpen ? 'Ocultar' : 'Mostrar'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFooterToolsOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Opciones desplegables */}
              {isFooterToolsOpen && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  {/* Botón Difusión y Marketing Vecinal */}
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className={`flex items-center justify-between w-full py-2 px-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer shadow-2xs group ${
                      isProPlan 
                        ? 'bg-amber-50/80 hover:bg-amber-100/90 text-amber-950 border-amber-300' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80'
                    }`}
                    title="Campañas de difusión vecinal y plantillas de WhatsApp para tu minimarket"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Megaphone className={`w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform ${isProPlan ? 'text-amber-600' : 'text-emerald-600'}`} />
                      <span className="truncate">Marketing & Difusión</span>
                    </div>
                    {isProPlan ? (
                      <span className="shrink-0 text-[9px] font-black bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md">
                        PRO
                      </span>
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-emerald-600/70 shrink-0" />
                    )}
                  </button>

                  {/* Vista Vecino Shortcut */}
                  <button
                    onClick={() => {
                      setViewMode('customer');
                      goToDirectory();
                    }}
                    className="flex items-center justify-center gap-2 w-full py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                    title="Previsualizar catálogo como cliente"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Vista Vecino</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Profile Card fija */}
          <div className={`p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 ${isSidebarCollapsed ? 'md:justify-center md:p-1.5' : ''}`}>
            <div className={`flex items-center gap-2 min-w-0 ${isSidebarCollapsed ? 'md:justify-center' : ''}`}>
              <div 
                className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                title={currentUser?.email || storeConfig.name}
              >
                {currentUser?.email ? currentUser.email[0].toUpperCase() : 'D'}
              </div>
              <div className={`min-w-0 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                <p className="font-bold text-xs text-slate-900 truncate leading-tight">
                  {currentUser?.user_metadata?.full_name || storeConfig.name || 'Don Vecino'}
                </p>
                <p 
                  className="text-[10px] text-slate-400 truncate leading-tight mt-0.5"
                  title={storeConfig?.address?.trim() || storeConfig?.zone?.trim() || 'Sin ubicación'}
                >
                  {storeConfig?.address?.trim() || storeConfig?.zone?.trim() || 'Sin ubicación'}
                </p>
              </div>
            </div>
            {!isSidebarCollapsed && (
              currentUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  title={isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}
                >
                  {isSigningOut ? (
                    <div className="w-4 h-4 rounded-full border-2 border-rose-500/30 border-t-rose-600 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 font-bold text-xs cursor-pointer"
                  title="Iniciar Sesión"
                >
                  Login
                </button>
              )
            )}
            {isSidebarCollapsed && currentUser && (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                title={isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}
              >
                {isSigningOut ? (
                  <div className="w-4 h-4 rounded-full border-2 border-rose-500/30 border-t-rose-600 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop para móvil cuando el sidebar está abierto */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE CONTENT AREA                                           */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#f8fafc]">
        
        {/* Barra Superior de Soporte SuperAdmin (Modo Impersonación) */}
        {(isSuperAdmin || isImpersonating) && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between gap-3 shadow-md z-40 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-950 shrink-0 animate-ping"></span>
              <span className="truncate">
                🛡️ Modo Soporte SuperAdmin: Estás gestionando <strong>{storeConfig.name}</strong> ({tenantSlug})
              </span>
            </div>
            <button
              type="button"
              onClick={stopImpersonating}
              className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <span>Volver a SuperAdmin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Barra de Difusión / Aviso Global del Sistema */}
        {systemBroadcast?.active && systemBroadcast?.message && !dismissedBroadcast && (
          <div className={`px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-3 shadow-xs z-35 ${
            systemBroadcast.type === 'warning'
              ? 'bg-amber-500/15 border-b border-amber-500/30 text-amber-900'
              : systemBroadcast.type === 'success'
              ? 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-900'
              : 'bg-indigo-500/15 border-b border-indigo-500/30 text-indigo-950'
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base shrink-0">
                {systemBroadcast.type === 'warning' ? '⚠️' : systemBroadcast.type === 'success' ? '🚀' : '📢'}
              </span>
              <span className="truncate">
                {systemBroadcast.message}
              </span>
              {systemBroadcast.link && (
                <a 
                  href={systemBroadcast.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline font-black hover:opacity-80 shrink-0 ml-1"
                >
                  {systemBroadcast.linkText || 'Ver más →'}
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDismissedBroadcast(true)}
              className="p-1 rounded-md hover:bg-black/10 transition-colors shrink-0 text-slate-500 hover:text-slate-800 cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Workspace Sub-Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 py-2.5 select-none shadow-2xs">
          <div className="flex flex-col gap-2.5">
            
            {/* Fila 1: Identidad del Negocio y Estados Globales */}
            <div className="flex items-center justify-between gap-2.5 min-w-0 w-full">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                {/* Botón de control del menú lateral (Móvil abre drawer, Desktop colapsa/expande) */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setMobileSidebarOpen(prev => !prev);
                    } else {
                      toggleSidebarCollapse();
                    }
                  }}
                  className="p-1.5 sm:p-2 -ml-1 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 cursor-pointer shrink-0 transition-transform"
                  aria-label="Abrir o colapsar menú lateral"
                  title="Menú lateral (Clic para alternar)"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Nombre de la Tienda */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate tracking-tight max-w-[130px] sm:max-w-[200px] md:max-w-[320px]">
                    {storeConfig.name}
                  </span>
                </div>
              </div>

              {/* Chips de estado: Suscripción y ABIERTO/CERRADO */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Chip Dinámico de Suscripción */}
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all border cursor-pointer active:scale-95 shrink-0 ${
                    !isSubscriptionActive
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 animate-pulse'
                      : isProPlan
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border-amber-300 shadow-xs'
                        : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90'
                  }`}
                  title={isProPlan ? 'Membresía Plan PRO Activa' : 'Haz clic para gestionar tu suscripción'}
                >
                  {!isSubscriptionActive ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="whitespace-nowrap font-extrabold">Vencido</span>
                    </>
                  ) : (
                    <>
                      {isProPlan ? (
                        <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span className="font-mono whitespace-nowrap font-extrabold flex items-center gap-1">
                        {isProPlan && <span className="font-black tracking-tight text-[10px] bg-slate-950/20 px-1 rounded-sm">PRO</span>}
                        <span>
                          {subscriptionTimeRemaining.days > 0 
                            ? `${subscriptionTimeRemaining.days}d ${subscriptionTimeRemaining.hours}h` 
                            : `${String(subscriptionTimeRemaining.minutes).padStart(2, '0')}:${String(subscriptionTimeRemaining.seconds).padStart(2, '0')}`}
                        </span>
                      </span>
                    </>
                  )}
                </button>

                {/* Control Rápido de Estado de la Tienda (ABIERTO / CERRADO en Tiempo Real) */}
                {storeOpenStatus && (
                  <button
                    type="button"
                    onClick={() => toggleStoreOpenStatus()}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all border shadow-2xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap ${
                      storeOpenStatus.isOpen
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-emerald-600/25 ring-1 ring-emerald-500/30'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-rose-500/10'
                    }`}
                    title={`Estado actual: ${storeOpenStatus.badgeText}. Toca para alternar inmediato.`}
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      {storeOpenStatus.isOpen ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      )}
                    </span>
                    <span className="tracking-wide">
                      {storeOpenStatus.isOpen ? 'ABIERTO' : 'CERRADO'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Fila 2: Acciones Principales en Carrusel Táctil Fluido */}
            <div className="w-full min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none touch-pan-x pb-0.5 pt-0.5 -mx-3 px-3 sm:mx-0 sm:px-0">
              {/* Botón de Venta Rápida Directa (Con bloqueo por suscripción) */}
              <button
                type="button"
                onClick={() => {
                  if (!isSubscriptionActive) {
                    setBlockedFeatureName('Venta Rápida');
                    setIsBlockedModalOpen(true);
                  } else {
                    setIsPosModalOpen(true);
                  }
                }}
                className={`h-9 px-3.5 sm:px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
                  !isSubscriptionActive
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 border border-emerald-600'
                }`}
                title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Abrir terminal de Venta Rápida en mostrador"}
              >
                {!isSubscriptionActive ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Receipt className="w-3.5 h-3.5 text-white shrink-0" />
                )}
                <span>Venta Rápida</span>
              </button>

              {/* Botón Cartel QR Mostrador */}
              <button
                type="button"
                onClick={() => {
                  if (!isSubscriptionActive) {
                    setBlockedFeatureName('Kit Imprimible y Cartel QR');
                    setIsBlockedModalOpen(true);
                  } else {
                    setIsPrintKitOpen(true);
                  }
                }}
                className={`h-9 px-3 sm:px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 whitespace-nowrap ${
                  !isSubscriptionActive
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90'
                }`}
                title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Diseñar e imprimir cartel QR para vitrina o carpa de mostrador"}
              >
                {!isSubscriptionActive ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Printer className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span>Cartel QR<span className="hidden xl:inline"> Mostrador</span></span>
              </button>

              {/* Botón Campañas de Marketing & Difusión */}
              <button
                type="button"
                onClick={() => {
                  if (!isSubscriptionActive) {
                    setBlockedFeatureName('Marketing Vecinal');
                    setIsBlockedModalOpen(true);
                  } else {
                    setIsShareModalOpen(true);
                  }
                }}
                className={`h-9 px-3 sm:px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 whitespace-nowrap ${
                  !isSubscriptionActive
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    : isProPlan
                      ? 'bg-amber-50/90 hover:bg-amber-100 text-amber-950 border-amber-300'
                      : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90'
                }`}
                title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Plantillas de marketing vecinal para WhatsApp y estados"}
              >
                {!isSubscriptionActive ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Megaphone className={`w-3.5 h-3.5 shrink-0 ${isProPlan ? 'text-amber-600' : 'text-emerald-600'}`} />
                )}
                <span>Marketing<span className="hidden xl:inline"> Vecinal</span></span>
                {isProPlan && isSubscriptionActive && (
                  <span className="text-[9px] font-black bg-amber-200 text-amber-900 px-1 py-0.5 rounded leading-none">
                    PRO
                  </span>
                )}
              </button>

              {/* Botón Cierre de Caja / Arqueo (Con bloqueo por suscripción) */}
              <button
                type="button"
                onClick={() => {
                  if (!isSubscriptionActive) {
                    setBlockedFeatureName('Cierre de Caja y Arqueo Diario');
                    setIsBlockedModalOpen(true);
                  } else {
                    setIsCashRegisterModalOpen(true);
                  }
                }}
                className={`h-9 px-3 sm:px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 whitespace-nowrap ${
                  !isSubscriptionActive
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90'
                }`}
                title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Arqueo y Cierre de Caja Diario (Control de Efectivo)"}
              >
                {!isSubscriptionActive ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span>Cierre de Caja</span>
              </button>

              {/* Botón Resumen Semanal para WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  if (!isSubscriptionActive) {
                    setBlockedFeatureName('Resumen para WhatsApp');
                    setIsBlockedModalOpen(true);
                  } else {
                    setIsWeeklySummaryModalOpen(true);
                  }
                }}
                className={`h-9 px-3 sm:px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 whitespace-nowrap ${
                  !isSubscriptionActive
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200/90'
                }`}
                title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Generar y enviar resumen semanal de rendimiento a WhatsApp"}
              >
                {!isSubscriptionActive ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span>Resumen <span className="hidden md:inline">WhatsApp</span><span className="inline md:hidden">WA</span></span>
              </button>

              {/* Botón Exportar Reporte (Con bloqueo por suscripción) */}
              <button
                type="button"
                onClick={() => {
                  if (!isSubscriptionActive) {
                    setBlockedFeatureName('Exportación de Reportes Financieros');
                    setIsBlockedModalOpen(true);
                  } else {
                    setIsExportModalOpen(true);
                  }
                }}
                className={`h-9 px-3 sm:px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 shrink-0 whitespace-nowrap ${
                  !isSubscriptionActive
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/90'
                }`}
                title={!isSubscriptionActive ? "Función bloqueada por suscripción vencida" : "Descargar o imprimir reporte contable de ventas (PDF, Excel)"}
              >
                {!isSubscriptionActive ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span>Exportar<span className="hidden lg:inline"> Reporte</span></span>
              </button>
            </div>

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
                {/* Selector de Pestañas para Móvil (Kanban Mobile Tabs) */}
                <div className="md:hidden flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 overflow-x-auto no-scrollbar shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMobileKanbanTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mobileKanbanTab === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>Todos</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      mobileKanbanTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {visibleKanbanOrders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileKanbanTab('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mobileKanbanTab === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Pendientes</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      mobileKanbanTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pendingOrders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileKanbanTab('preparing')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mobileKanbanTab === 'preparing'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span>En Prep.</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      mobileKanbanTab === 'preparing' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {preparingOrders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileKanbanTab('on_the_way')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mobileKanbanTab === 'on_the_way'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span>{storeConfig?.enableDelivery === false ? 'Listos' : 'En Ruta'}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      mobileKanbanTab === 'on_the_way' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {onTheWayOrders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileKanbanTab('delivered')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mobileKanbanTab === 'delivered'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Entregados</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      mobileKanbanTab === 'delivered' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {deliveredOrders.length}
                    </span>
                  </button>
                </div>

                {/* 4 KANBAN COLUMNS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                  
                  {/* COLUMNA 1: 🟡 PENDIENTES */}
                  <div className={`rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col ${
                    mobileKanbanTab !== 'all' && mobileKanbanTab !== 'pending' ? 'hidden md:flex' : 'flex'
                  }`}>
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
                                <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">#{getDisplayOrderId(order.id)}</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px]">
                                  Nuevo ⏱️
                                </span>
                              </div>
                              {order.deliveryType === 'delivery' ? (
                                <>
                                  <p className="text-xs font-semibold text-slate-900 mt-1">
                                    🛵 {order.customer?.address || 'A Domicilio'}
                                  </p>
                                  {order.customer?.reference && (
                                    <p className="text-[11px] text-slate-400">Ref: {order.customer.reference}</p>
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

                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            {renderPaymentBadge(order.paymentMethod, order)}
                            {order.paymentMethod === 'cash' && order.cashChangeFor > order.total && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                (Paga con {currency} {order.cashChangeFor} • Vuelto {currency} {(order.cashChangeFor - order.total).toFixed(2)})
                              </span>
                            )}
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
                      <div className="py-4 px-3 sm:p-5 text-center text-xs text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200">
                        No hay pedidos pendientes
                      </div>
                    )}
                  </div>

                  {/* COLUMNA 2: 🔵 EN PREPARACIÓN */}
                  <div className={`rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col ${
                    mobileKanbanTab !== 'all' && mobileKanbanTab !== 'preparing' ? 'hidden md:flex' : 'flex'
                  }`}>
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
                              <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">#{getDisplayOrderId(order.id)}</span>
                              {order.deliveryType === 'delivery' ? (
                                <p className="text-xs font-semibold text-slate-900">{[order.customer?.tower, order.customer?.apartment].filter(Boolean).join(' • ') || 'A Domicilio'}</p>
                              ) : (
                                <p className="text-xs font-bold text-emerald-800">🏪 Retiro en Mostrador</p>
                              )}
                              <p className="text-xs text-slate-400">{order.customer?.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {renderPaymentBadge(order.paymentMethod, order)}
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
                      <div className="py-4 px-3 sm:p-5 text-center text-xs text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200">
                        No hay pedidos en preparación
                      </div>
                    )}
                  </div>

                  {/* COLUMNA 3: 🟣 EN RUTA / LISTOS */}
                  <div className={`rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col ${
                    mobileKanbanTab !== 'all' && mobileKanbanTab !== 'on_the_way' ? 'hidden md:flex' : 'flex'
                  }`}>
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
                                  <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">#{getDisplayOrderId(order.id)}</span>
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
                                    {order.paymentMethod === 'combined' || order.splitPayment || order.split_payment
                                      ? `Cobro Mostrador: Pago Combinado (${currency} ${order.total.toFixed(2)})`
                                      : order.paymentMethod === 'cash' 
                                      ? `Cobrar en caja: ${currency} ${order.total.toFixed(2)}` 
                                      : order.paymentMethod === 'qr' 
                                      ? 'Pagado vía QR Digital' 
                                      : order.paymentMethod === 'credit'
                                      ? 'Cargado a Cuenta (Fiao Vecinal)'
                                      : 'Cobrar con Tarjeta en Tienda'}
                                  </p>
                                  <p className="text-[10px] text-emerald-700 truncate">
                                    {order.paymentMethod === 'combined' || order.splitPayment || order.split_payment
                                      ? `Desglose: ${formatPaymentBreakdownText(order, currency)}`
                                      : order.paymentMethod === 'cash' && order.cashChangeFor 
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
                      <div className="py-4 px-3 sm:p-5 text-center text-xs text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200">
                        {storeConfig?.enableDelivery === false ? 'No hay pedidos listos para recoger' : 'No hay pedidos en ruta ni listos'}
                      </div>
                    )}
                  </div>

                  {/* COLUMNA 4: 🟢 ENTREGADOS */}
                  <div className={`rounded-2xl bg-slate-50/80 p-3.5 space-y-3 border border-slate-200/80 flex flex-col ${
                    mobileKanbanTab !== 'all' && mobileKanbanTab !== 'delivered' ? 'hidden md:flex' : 'flex'
                  }`}>
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

                    {(isExpandedDelivered ? deliveredOrders : deliveredOrders.slice(0, 5)).map(order => {
                      const displayId = getDisplayOrderId(order.id);
                      return (
                        <div key={order.id} className="rounded-xl bg-white p-3.5 shadow-xs border border-slate-200/80 hover:shadow-sm transition-all space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-black text-slate-900 tracking-tight whitespace-nowrap">
                                  #{displayId}
                                </span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold shrink-0">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Entregado</span>
                                </span>
                              </div>
                              {order.deliveryType === 'delivery' ? (
                                <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                                  🏢 {[order.customer?.tower, order.customer?.apartment].filter(Boolean).join(' • ') || 'A Domicilio'}
                                </p>
                              ) : (
                                <p className="text-xs font-bold text-emerald-800 mt-1 flex items-center gap-1">
                                  <span>🏪 Retirado en Mostrador</span>
                                </p>
                              )}
                              {order.customer?.name && !order.customer?.name.includes('Presencial') && !order.customer?.name.includes('Mostrador') && (
                                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  {order.customer.name}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                                {currency} {order.total.toFixed(2)}
                              </span>
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Deseas omitir / descartar el pedido #${order.id}?`)) {
                                    deleteOrder(order.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Omitir pedido del tablero"
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                            {renderPaymentBadge(order.paymentMethod || order.payment_method, order)}
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1 shrink-0">
                              <span className="text-amber-500">★</span>
                              <span>5.0 Exitoso</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {deliveredOrders.length > 5 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsExpandedDelivered(prev => !prev)}
                          className="flex-1 py-1.5 text-center text-xs font-bold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                        >
                          {isExpandedDelivered ? 'Mostrar menos' : `+${deliveredOrders.length - 5} pedidos más`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('sales')}
                          className="py-1.5 px-3 text-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                          title="Ver historial de ventas completo"
                        >
                          Historial →
                        </button>
                      </div>
                    )}
                    {deliveredOrders.length === 0 && (
                      <div className="py-4 px-3 sm:p-5 text-center text-xs text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200">
                        {kanbanTimeRange === 'today' 
                          ? 'No hay pedidos entregados aún hoy' 
                          : kanbanTimeRange === '24h' 
                          ? 'No hay pedidos entregados en las últimas 24h' 
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
                  <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <div>
                        <h2 className="text-lg text-slate-900 font-bold tracking-tight">Feed de Actividad & Últimos Cobros</h2>
                        <p className="text-xs text-slate-400">Auditoría en tiempo real de transacciones y pedidos registrados</p>
                      </div>
                    </div>

                    {/* Botón rápido para subir al Tablero Kanban */}
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        if (feedScrollRef.current) {
                          feedScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 sm:ml-2"
                      title="Subir al Tablero Kanban"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Subir al Tablero</span>
                      <span className="sm:hidden">Subir</span>
                    </button>
                  </div>

                  {/* Filtros rápidos: Todos, Mostrador, Domicilio, Eliminados/Omitidos */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto no-scrollbar max-w-full">
                    <button
                      type="button"
                      onClick={() => handleSetFeedFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        feedFilter === 'all' 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Todos ({allFeedOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetFeedFilter('pos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        feedFilter === 'pos' 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      🏪 Mostrador ({allFeedOrders.filter(o => !isOmittedOrDeletedOrder(o) && isPickupOrPosOrder(o)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetFeedFilter('delivery')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        feedFilter === 'delivery' 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      🛵 Domicilio ({allFeedOrders.filter(o => !isOmittedOrDeletedOrder(o) && !isPickupOrPosOrder(o)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetFeedFilter('omitted')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        feedFilter === 'omitted' 
                          ? 'bg-rose-600 text-white shadow-xs' 
                          : 'text-rose-700 hover:text-rose-900 hover:bg-rose-50'
                      }`}
                    >
                      🚫 Eliminados / Omitidos ({allFeedOrders.filter(isOmittedOrDeletedOrder).length})
                    </button>
                  </div>
                </div>

                {/* Lista de Transacciones Recientes Scrolleable y Paginada */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
                  <div 
                    ref={feedScrollRef}
                    className="divide-y divide-slate-100 overflow-y-auto max-h-[560px] sm:max-h-[620px] overscroll-y-auto touch-pan-y transition-all"
                  >
                  {recentTransactions.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {feedFilter === 'omitted' ? 'No hay pedidos eliminados ni omitidos' : 'Aún no hay transacciones registradas'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        {feedFilter === 'omitted' 
                          ? 'Todos los pedidos registrados se encuentran activos o fueron cobrados con éxito.' 
                          : 'Cuando realices una venta en el mostrador o un vecino confirme un pedido, se reflejará aquí en tiempo real.'}
                      </p>
                    </div>
                  ) : (
                    recentTransactions.map((tx) => {
                      const isOmitted = isOmittedOrDeletedOrder(tx);
                      const idStr = String(tx.id || '');
                      const isPos = idStr.includes('POS-') || tx.customer?.name?.includes('Presencial') || tx.customer?.name?.includes('Mostrador') || tx.customer?.name?.includes('Cliente Mostrador');
                      const isPickup = tx.deliveryType === 'pickup' || tx.delivery_type === 'pickup' || tx.customer?.address === 'Retiro en Tienda' || tx.customer?.address === 'En Tienda' || tx.customer?.reference === 'Mostrador';
                      const payMethod = tx.paymentMethod || tx.payment_method || 'cash';
                      const txTime = tx.deletedAt || tx.deleted_at || tx.createdAt || tx.created_at;
                      const displayId = getDisplayOrderId(tx.id);
                      const itemsCount = tx.items?.length || 1;

                      return (
                        <div 
                          key={tx.id}
                          className={`p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isOmitted ? 'bg-rose-50/30 border-l-4 border-l-rose-500' : ''
                          }`}
                        >
                          {/* Izquierda: Método de Pago + Datos del Cliente / Origen + Metadatos */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 md:mt-0 ${
                              isOmitted
                                ? 'bg-rose-100/80 text-rose-600 border border-rose-300/80'
                                : (payMethod === 'combined' || tx.splitPayment || tx.split_payment)
                                ? 'bg-violet-50 text-violet-700 border border-violet-200/80 shadow-2xs'
                                : payMethod === 'cash' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                                : payMethod === 'qr'
                                ? 'bg-cyan-50 text-cyan-600 border border-cyan-200/80'
                                : payMethod === 'credit'
                                ? 'bg-purple-50 text-purple-600 border border-purple-200/80'
                                : 'bg-blue-50 text-blue-600 border border-blue-200/80'
                            }`}>
                              {isOmitted ? (
                                <Ban className="w-5 h-5 text-rose-600" />
                              ) : (
                                <>
                                  {(payMethod === 'combined' || tx.splitPayment || tx.split_payment) && <Layers className="w-5 h-5 text-violet-700" />}
                                  {payMethod === 'cash' && !tx.splitPayment && !tx.split_payment && <Banknote className="w-5 h-5" />}
                                  {payMethod === 'qr' && !tx.splitPayment && !tx.split_payment && <QrCode className="w-5 h-5" />}
                                  {payMethod === 'card' && !tx.splitPayment && !tx.split_payment && <CreditCard className="w-5 h-5" />}
                                  {payMethod === 'credit' && !tx.splitPayment && !tx.split_payment && <BookOpen className="w-5 h-5" />}
                                </>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              {/* Fila 1: Origen de la Venta + Badge de método de pago */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-extrabold text-xs sm:text-sm truncate ${isOmitted ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                                  {isPos ? (
                                    '🏪 Venta Rápida de Mostrador'
                                  ) : isPickup ? (
                                    `🛍️ ${tx.customer?.name || 'Cliente'} • Retiro en Tienda`
                                  ) : (
                                    `🛵 ${tx.customer?.name ? `${tx.customer.name} • ` : ''}${tx.customer?.address || 'Domicilio'}`
                                  )}
                                  {!isPos && !isPickup && tx.customer?.reference && (
                                    <span className="font-semibold text-slate-500 ml-1">
                                      ({tx.customer.reference})
                                    </span>
                                  )}
                                </span>

                                {isOmitted ? (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 bg-rose-100 text-rose-800 border border-rose-200">
                                    🚫 Eliminado / Omitido
                                  </span>
                                ) : (payMethod === 'combined' || tx.splitPayment || tx.split_payment) ? (
                                  <span 
                                    className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 bg-violet-100 text-violet-900 border border-violet-200 shadow-2xs"
                                    title={`Pago Combinado: ${formatPaymentBreakdownText(tx, currency)}`}
                                  >
                                    <Layers className="w-3 h-3 text-violet-700 shrink-0" />
                                    <span>Combinado ({formatPaymentBreakdownText(tx, currency)})</span>
                                  </span>
                                ) : (
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                    payMethod === 'cash' ? 'bg-emerald-100 text-emerald-800' :
                                    payMethod === 'qr' ? 'bg-cyan-100 text-cyan-800' :
                                    payMethod === 'credit' ? 'bg-purple-100 text-purple-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {payMethod === 'cash' ? '💵 Efectivo' : payMethod === 'qr' ? '📱 QR Simple' : payMethod === 'credit' ? '📒 A Cuenta' : '💳 Tarjeta POS'}
                                  </span>
                                )}
                              </div>

                              {/* Fila 2: ID limpio en píldora + Cantidad de productos + Tiempo relativo */}
                              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 font-medium flex-wrap">
                                <span 
                                  className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-md whitespace-nowrap ${
                                    isOmitted ? 'bg-rose-100/70 text-rose-800' : 'bg-slate-100 text-slate-600'
                                  }`} 
                                  title={`ID completo: #${tx.id}`}
                                >
                                  #{displayId}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="whitespace-nowrap text-slate-500">
                                  {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'} {isOmitted ? 'descartados' : ''}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="flex items-center gap-1 whitespace-nowrap text-slate-400">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{isOmitted ? `Omitido ${formatRelativeTime(txTime)}` : formatRelativeTime(txTime)}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Derecha / Fila inferior en móvil: Estado + Importe + Borrar / Restaurar */}
                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100/90">
                            {isOmitted ? (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap bg-rose-50 text-rose-800 border-rose-200">
                                ❌ Omitido del Registro
                              </span>
                            ) : (
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
                            )}

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className={`text-base sm:text-lg font-black tracking-tight whitespace-nowrap ${
                                  isOmitted ? 'text-slate-400 line-through' : 'text-slate-900'
                                }`}>
                                  {isOmitted ? '' : '+'}{currency} {(tx.total || 0).toFixed(2)}
                                </span>
                              </div>

                              {isOmitted ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => restoreOrder(tx.id)}
                                    className="px-2.5 py-1 rounded-lg text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Restaurar pedido al tablero de control"
                                    type="button"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Restaurar</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`¿Deseas purgar definitivamente este pedido #${tx.id} de la base de datos?`)) {
                                        purgeOrderPermanently(tx.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Purgar permanentemente"
                                    type="button"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setTransactionToDelete(tx)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Omitir / Descartar transacción del registro"
                                  type="button"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  </div>

                  {/* Barra Inferior de Paginación Fluida y Responsiva */}
                  {feedTotalCount > 0 && (
                    <div className="bg-slate-50/90 border-t border-slate-200/80 px-3.5 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
                      {/* Información de Registros */}
                      <div className="flex items-center gap-2 text-slate-500 font-medium text-center sm:text-left">
                        <span>
                          Mostrando <strong className="font-extrabold text-slate-800">{feedStartIndex} - {feedEndIndex}</strong> de <strong className="font-extrabold text-slate-800">{feedTotalCount}</strong> {feedTotalCount === 1 ? 'cobro' : 'cobros'}
                        </span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[11px] font-bold">
                          Pág. {safeFeedPage} de {feedTotalPages}
                        </span>
                      </div>

                      {/* Controles de Navegación de Páginas */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleSetFeedPage(safeFeedPage - 1)}
                          disabled={safeFeedPage <= 1}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                            safeFeedPage <= 1
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer active:scale-95'
                          }`}
                          title="Página anterior de cobros"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Anterior</span>
                        </button>

                        {/* Píldoras numéricas de página directa */}
                        {feedTotalPages > 1 && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: feedTotalPages }, (_, i) => i + 1).map((pg) => (
                              <button
                                key={pg}
                                type="button"
                                onClick={() => handleSetFeedPage(pg)}
                                className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer ${
                                  pg === safeFeedPage
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 active:scale-95'
                                }`}
                                title={`Ir a la página ${pg}`}
                              >
                                {pg}
                              </button>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSetFeedPage(safeFeedPage + 1)}
                          disabled={safeFeedPage >= feedTotalPages}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                            safeFeedPage >= feedTotalPages
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs cursor-pointer active:scale-95'
                          }`}
                          title="Página siguiente de cobros"
                        >
                          <span>Siguiente</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Botón rápido para subir al Tablero Kanban */}
                        <button
                          type="button"
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            if (feedScrollRef.current) {
                              feedScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs cursor-pointer active:scale-95"
                          title="Subir al Tablero Kanban"
                        >
                          <ChevronUp className="w-4 h-4 text-emerald-600" />
                          <span className="hidden sm:inline">Subir al Tablero</span>
                          <span className="sm:hidden">Subir</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Botón Flotante para Volver al Tablero Kanban cuando se hace scroll hacia abajo */}
              {showScrollTop && (
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    if (feedScrollRef.current) {
                      feedScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-700/60 flex items-center gap-2 text-xs font-extrabold transition-all cursor-pointer hover:scale-105 active:scale-95 animate-fadeIn"
                  title="Subir al Tablero Kanban"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ChevronUp className="w-4 h-4" />
                  </div>
                  <span>Subir al Tablero</span>
                </button>
              )}

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

          {/* TAB: HORARIO DE ATENCIÓN */}
          {activeTab === 'schedule' && (
            <div className="animate-fadeIn">
              <StoreScheduleManager />
            </div>
          )}

          {/* TAB 7: MI SUSCRIPCIÓN */}
          {activeTab === 'subscription' && (
            <div className="animate-fadeIn">
              <SubscriptionManager />
            </div>
          )}

          {/* TAB 8: CONFIGURACIÓN */}
          {activeTab === 'settings' && (
            <div className="animate-fadeIn">
              <StoreSettings />
            </div>
          )}

          {/* TAB: CÓMO USAR (Guía interactiva para el Dueño) */}
          {activeTab === 'guide' && (
            <div className="animate-fadeIn">
              <StoreUserGuide onNavigateTab={(tab) => setActiveTab(tab)} />
            </div>
          )}

        </div>
      </main>



      {/* ========================================================================= */}
      {/* MODAL DE VENTA RÁPIDA (POS Terminal Directo)                              */}
      {/* ========================================================================= */}
      {isPosModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 md:p-6 bg-slate-950 sm:bg-slate-950/80 sm:backdrop-blur-xs overscroll-contain animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-label="Punto de Venta y Venta Rápida de Mostrador"
        >
          <div className="relative w-full h-[100dvh] sm:h-[94vh] sm:max-h-[94vh] sm:max-w-6xl bg-slate-100 sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200 flex flex-col overflow-hidden overscroll-contain">
            {/* Header del Panel de Venta Rápida (Sticky superior garantizado en móvil y desktop) */}
            <header className="px-3 py-2.5 sm:px-6 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between gap-2 sm:gap-3 shrink-0 border-b border-slate-800 sticky top-0 z-30 select-none shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
                  <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight whitespace-nowrap">
                    Punto de Venta (POS)
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Venta Rápida de Mostrador</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPosModalOpen(false)}
                className="h-9 px-3 sm:px-2.5 sm:h-auto sm:py-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-700/60 shadow-xs"
                title="Cerrar punto de venta y volver"
                aria-label="Cerrar terminal de venta rápida"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                <span className="text-xs font-bold sm:hidden">Cerrar</span>
              </button>
            </header>

            {/* Contenido interactivo: Punto de Venta */}
            <div className="p-2 sm:p-5 overflow-y-auto flex-1 overscroll-contain touch-pan-y">
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
        featureName={blockedFeatureName}
        variant={blockedVariant}
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

      {/* Modal de Arqueo y Cierre de Caja Diario (Control de Efectivo) */}
      <CashRegisterModal
        isOpen={isCashRegisterModalOpen}
        onClose={() => setIsCashRegisterModalOpen(false)}
      />

      {/* Modal de Resumen Semanal para WhatsApp */}
      <WeeklySummaryModal
        isOpen={isWeeklySummaryModalOpen}
        onClose={() => setIsWeeklySummaryModalOpen(false)}
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
                <span className="text-slate-500 font-medium">Método de pago:</span>
                {renderPaymentBadge(transactionToDelete.paymentMethod || transactionToDelete.payment_method, transactionToDelete)}
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
