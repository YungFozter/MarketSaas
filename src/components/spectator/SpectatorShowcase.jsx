import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import orderNotificationSound from '../../../mp3/Notificacion de orden de compra.mp3';
import {
  ShoppingBag,
  Store,
  Building2,
  Building,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  PlusCircle,
  ArrowRight,
  Search,
  MapPin,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Plus,
  Minus,
  BatteryCharging,
  Signal,
  Wifi,
  Bell,
  Clock,
  TrendingUp,
  PackageCheck,
  Truck,
  Lock,
  Check,
  PhoneCall,
  Receipt,
  Users,
  X,
  MessageCircle,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './SpectatorShowcase.css';

const INITIAL_DEMO_ORDERS = [
  {
    id: '1042',
    time: 'Hace 2 min',
    tower: 'Torre A • Depto 904',
    items: 'Pan Marraqueta + Leche Pil 1L + Huevos (12)',
    price: 28.50,
    status: 'pending',
    badge: 'QR Pagado',
    buyer: 'Camila Rojas'
  },
  {
    id: '1044',
    time: 'Hace 5 min',
    tower: 'Torre B • Depto 301',
    items: 'Bebida 2L + Papas Fritas',
    price: 18.00,
    status: 'pending',
    badge: 'Efectivo',
    buyer: 'Ignacio Silva'
  },
  {
    id: '1040',
    time: 'Hace 8 min',
    tower: 'Torre C • Depto 201',
    items: 'Abarrotes fin de mes & Frutas',
    price: 85.00,
    status: 'packing',
    progress: 75,
    badge: 'Transferencia',
    buyer: 'Patricia Mena'
  },
  {
    id: '1038',
    time: 'Hace 14 min',
    tower: 'Torre B • Depto 502',
    items: 'Pack Desayuno Familiar',
    price: 35.00,
    status: 'delivering',
    rider: 'Carlos (A pie • 2 min)',
    badge: 'En ruta',
    buyer: 'Rodrigo Gómez'
  }
];

export const SpectatorShowcase = ({
  onExploreStore,
  onGoToMerchant,
  activeTab: controlledTab,
  onTabChange
}) => {
  const { storeConfig, showToast } = useStore();
  const [internalTab, setInternalTab] = useState('residents'); // 'residents' | 'merchants' | 'condos'
  const [isCondoModalOpen, setIsCondoModalOpen] = useState(false);
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;

  const whatsappNumber = storeConfig?.whatsapp ? storeConfig.whatsapp.replace(/[^0-9]/g, '') : '59172125280';
  const condoWaMessage = '¡Hola MarketSaaS! 🏢 Me gustaría recibir información sobre los beneficios e integración de MarketSaaS para mi condominio o edificio.';
  const condoWaUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(condoWaMessage)}`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCondoModalOpen) {
        setIsCondoModalOpen(false);
      }
    };
    if (isCondoModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCondoModalOpen]);

  const handleTabChange = (tab) => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Estado interactivo dentro del simulador de smartphone (Para Residentes)
  const [milkQuantity, setMilkQuantity] = useState(1);
  const [breadQuantity, setBreadQuantity] = useState(0);

  const breadPrice = 1.00;
  const milkPrice = 8.00;
  const totalCartItems = milkQuantity + breadQuantity;
  const totalCartPrice = (milkQuantity * milkPrice) + (breadQuantity * breadPrice);
  const totalVeciPoints = (milkQuantity * 8) + (breadQuantity * 5);

  // Estado interactivo dentro del simulador de Kanban (Para Comerciantes)
  const [soundActive, setSoundActive] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleToggleSound = () => {
    setSoundActive(prev => {
      const next = !prev;
      if (next) {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio(orderNotificationSound);
          }
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => {
            console.warn('Audio playback warning:', err);
          });
        } catch (e) {
          console.warn('Audio error:', e);
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
      return next;
    });
  };
  const [merchantOrders, setMerchantOrders] = useState(INITIAL_DEMO_ORDERS);

  const handleResetOrders = () => {
    setMerchantOrders(INITIAL_DEMO_ORDERS);
    if (showToast) {
      showToast('Pedidos de prueba reiniciados en el Tablero Kanban.', 'info');
    }
  };

  const handleSimulateWhatsAppOrder = () => {
    if (showToast) {
      showToast('¡Simulación completada! En la tienda real, este pedido se abre en WhatsApp con emojis y datos de entrega.', 'success');
    }
  };

  const handleAdvanceOrder = (orderId) => {
    setMerchantOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        if (order.status === 'pending') return { ...order, status: 'packing', progress: 50 };
        if (order.status === 'packing') return { ...order, status: 'delivering', rider: 'Carlos (A pie • 3 min)' };
        if (order.status === 'delivering') return { ...order, status: 'completed' };
      }
      return order;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">

      {/* Encabezado de Sección */}
      <div className="text-center mb-8 sm:mb-12">
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-3.5 py-1 rounded-full border border-emerald-200">
          Experiencia Ecosistémica 360°
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-2.5 mb-2 tracking-tight">
          Una sola plataforma para cada participante del barrio
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-slate-600 max-w-2xl mx-auto">
          Descubre cómo MarketSaaS transforma las compras vecinales, potencia a los minimarkets locales y brinda seguridad a las comunidades residenciales.
        </p>

        {/* Selector Segmentado de Perspectivas */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/90 backdrop-blur-md shadow-2xs gap-1.5 max-w-full overflow-x-auto border border-slate-300/60">
            <button
              onClick={() => handleTabChange('residents')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'residents' ? 'spectator-tab-active' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>🛍️</span>
              <span>Para Residentes</span>
            </button>

            <button
              onClick={() => handleTabChange('merchants')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'merchants' ? 'spectator-tab-active' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>🏪</span>
              <span>Para Comerciantes</span>
            </button>

            <button
              onClick={() => handleTabChange('condos')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'condos' ? 'spectator-tab-active' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>🏢</span>
              <span>Para Condominios</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. PERSPECTIVA: PARA RESIDENTES (Simulador Interactivo Smartphone)
          ========================================================================= */}
      {activeTab === 'residents' && (
        <div className="spectator-showcase-panel flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 rounded-3xl animate-fade-in-up">

          {/* Columna Izquierda: Beneficios del Vecino */}
          <div className="w-full lg:w-1/2 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-xs sm:text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Experiencia de Compra Hiperlocal en 60 Segundos</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Pida lo que te falta sin salir de casa.
            </h3>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">
              ¿Olvidaste el pan, o la leche del desayuno? Revisa si en el minimarket de tu preferencia o el más cercano tienen lo que buscas y ahorra tiempo en encontrar una tienda con lo que necesitas.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <strong className="text-slate-900 text-xs sm:text-sm block">Precios Justos en tiempo Real</strong>
                  <span className="text-slate-500 text-xs sm:text-sm">Sin sorpresas y con conocimiento sobre precios reales a cada momento.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <strong className="text-slate-900 text-xs sm:text-sm block">Club de VeciPuntos:</strong>
                  <span className="text-slate-500 text-xs sm:text-sm">Acumula puntos canjeables en cada compra para obtener descuentos directos en tu tienda favorita. (Puntos disponibles según decisión de cada tienda)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <strong className="text-slate-900 text-xs sm:text-sm block">Paga en efectivo o con QR:</strong>
                  <span className="text-slate-500 text-xs sm:text-sm">Paga de forma rápida y segura por tu app de banco favorita o en efectivo.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onExploreStore}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar Tienda en Vivo</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Smartphone Mockup Interactivo */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="spectator-phone-frame w-[310px] sm:w-[340px] h-[580px] rounded-[44px] p-3 shadow-2xl relative">
              <div className="spectator-phone-screen w-full h-full rounded-[34px] overflow-hidden flex flex-col bg-white text-slate-800">

                {/* Status Bar */}
                <div className="px-5 pt-3 pb-1 flex justify-between items-center text-[10px] text-slate-500 bg-white">
                  <span className="font-bold">9:41</span>
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <BatteryCharging className="w-3 h-3" />
                  </div>
                </div>

                {/* Header App Tienda */}
                <div className="px-4 py-2 bg-emerald-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                      <Store className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-left leading-tight">
                      <span className="text-xs font-bold block">Minimarket Don Vecino</span>
                      <span className="text-[9px] text-emerald-200">Abierto • Torre A / Depto 904</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full font-bold text-emerald-200">
                    15-30 min
                  </span>
                </div>

                {/* Interactive Body Cart Simulator */}
                <div className="flex-1 p-3.5 space-y-2.5 overflow-y-auto text-left">

                  {/* Buscador Mock */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      readOnly
                      placeholder="Buscar pan, leche, bebidas..."
                      className="w-full bg-slate-100 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-600 pointer-events-none"
                    />
                  </div>

                  <div className="text-[11px] font-bold text-slate-700 pt-1">
                    Productos Agregados al Carrito:
                  </div>

                  {/* Item 1: Pan Amasado */}
                  <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-between gap-2 border border-slate-200/60 shadow-2xs">
                    <img
                      src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&auto=format&fit=crop&q=80"
                      alt="Pan fresco horneado"
                      width="48"
                      height="48"
                      loading="lazy"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">Pan Crujiente (1kg)</span>
                        <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[8px] font-black">+5 VP</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Recién horneado</div>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">1.00 Bs.</div>
                    </div>
                    {breadQuantity > 0 ? (
                      <div className="flex items-center gap-1 bg-slate-200/80 px-1 py-0.5 rounded-lg text-xs font-bold">
                        <button onClick={() => setBreadQuantity(q => Math.max(0, q - 1))} className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center cursor-pointer">
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-3 text-center">{breadQuantity}</span>
                        <button onClick={() => setBreadQuantity(q => q + 1)} className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center cursor-pointer">
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setBreadQuantity(1)} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer hover:bg-emerald-700">
                        + Agregar
                      </button>
                    )}
                  </div>

                  {/* Item 2: Leche Entera */}
                  <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-between gap-2 border border-slate-200/60 shadow-2xs">
                    <img
                      src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120&auto=format&fit=crop&q=80"
                      alt="Leche natural pasteurizada"
                      width="48"
                      height="48"
                      loading="lazy"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">Leche Entera 1L</span>
                        <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[8px] font-black">+8 VP</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Refrigerada a 4°C</div>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">8.00 Bs.</div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-200/80 px-1 py-0.5 rounded-lg text-xs font-bold">
                      <button onClick={() => setMilkQuantity(q => Math.max(1, q - 1))} className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center cursor-pointer">
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-3 text-center">{milkQuantity}</span>
                      <button onClick={() => setMilkQuantity(q => q + 1)} className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center cursor-pointer">
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Aviso de Despacho Vecinal Gratis */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="text-[10px]">
                      <span className="font-bold text-amber-900 block uppercase">Despacho Vecinal Prioritario</span>
                      <span className="text-slate-600">Llega directo a conserjería con sello de entrega.</span>
                    </div>
                  </div>

                </div>

                {/* Floating WhatsApp Checkout Pill inside Phone */}
                <div className="p-2.5 bg-white/95 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={handleSimulateWhatsAppOrder}
                    className="spectator-whatsapp-pill w-full px-3 py-2 rounded-xl flex items-center justify-between shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                    title="Simular pedido por WhatsApp"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                        {totalCartItems}
                      </span>
                      <div className="text-left">
                        <div className="text-[11px] font-extrabold leading-none">Pedir por WhatsApp</div>
                        <div className="text-[9px] opacity-90">+{totalVeciPoints} VeciPuntos</div>
                      </div>
                    </div>
                    <span className="text-xs font-black">Bs. {totalCartPrice.toFixed(2)}</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          2. PERSPECTIVA: PARA COMERCIANTES (Tablero Kanban de Despacho Interactivo)
          ========================================================================= */}
      {activeTab === 'merchants' && (
        <div className="spectator-showcase-panel flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 rounded-3xl animate-fade-in-up">

          {/* Columna Izquierda: Motor Comercial del Locatario */}
          <div className="w-full lg:w-1/2 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-xs sm:text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Sistema Operativo para Tiendas y Almacenes</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Control total de despachos, stock y caja diaria.
            </h3>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">
              Diseñado para el comerciante ocupado: actualiza stock desde tu celular, recibe alertas sonoras ante cada orden y  administra tus ventas .
            </p>

            {/* Tarjetas de Funcionalidades Clave para el Locatario */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all group">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2 group-hover:scale-110 transition-transform">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Alerta Sonora</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">Aviso acústico al recibir el pedido de WhatsApp.</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all group">
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 mb-2 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Stock Flash</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">Pausa o activa productos agotados en 1 toque.</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all group">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 mb-2 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Cierre Contable</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">Exporta reportes diarios de ventas y QR a Excel.</div>
              </div>
            </div>

            {/* Badges de Confianza Locataria */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 font-semibold">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Pedidos Directos a WhatsApp
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={onGoToMerchant}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Ver Tablero de Despachos en Vivo</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Mockup Interactivo del Tablero Kanban */}
          <div className="w-full lg:w-1/2">
            <div className="spectator-kanban-frame w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200 text-left bg-slate-50">

              {/* Barra Superior estilo macOS / Terminal POS */}
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-200 ml-1">
                    Panel Minimarket • "Almacén Don Vecino"
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={handleResetOrders}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-2xs"
                    title="Reiniciar pedidos de prueba del tablero"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden xs:inline">Reiniciar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${soundActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}
                    title="Alternar alertas sonoras de pedidos"
                  >
                    {soundActive ? <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" /> : <VolumeX className="w-3 h-3" />}
                    <span>Sonido {soundActive ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Ticker de Métricas en Vivo de la Tienda */}
              <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 18 Pedidos Hoy
                  </span>
                  <span className="text-slate-400 hidden sm:inline">•</span>
                  <span className="font-bold text-emerald-700 hidden sm:inline">Bs. 1.260</span>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> Despacho Promedio: <strong>12 min</strong>
                </span>
              </div>

              {merchantOrders.filter(o => o.status !== 'completed').length === 0 ? (
                <div className="p-8 text-center bg-white m-3 rounded-2xl border border-emerald-200 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">¡Todos los pedidos de prueba fueron entregados!</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Has completado el flujo completo de recepción, empaque y despacho con acuse de recibo en el tablero Kanban.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetOrders}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reiniciar Simulación de Pedidos</span>
                  </button>
                </div>
              ) : (
                /* Columnas Kanban Responsivas */
                <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">

                  {/* 1. Columna: Pendientes */}
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                      <span className="text-[11px] font-extrabold text-amber-800 uppercase flex items-center gap-1">
                        🟡 Pendientes ({merchantOrders.filter(o => o.status === 'pending').length})
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                        Nuevos
                      </span>
                    </div>

                    <div className="space-y-2">
                      {merchantOrders.filter(o => o.status === 'pending').map(order => (
                        <div key={order.id} className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-900 text-xs">#{order.id}</span>
                            <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {order.time}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 truncate">{order.tower}</div>
                          <div className="text-[10px] text-slate-500 leading-tight line-clamp-1">{order.items}</div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-xs font-black text-emerald-700">Bs. {order.price.toFixed(2)}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {order.badge}
                            </span>
                          </div>

                          <button
                            onClick={() => handleAdvanceOrder(order.id)}
                            className="w-full mt-1.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            <span>Pasar a Empaque</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. Columna: En Empaque */}
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-blue-200/60">
                      <span className="text-[11px] font-extrabold text-blue-800 uppercase flex items-center gap-1">
                        🔵 En Empaque ({merchantOrders.filter(o => o.status === 'packing').length})
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-900">
                        Bolsas
                      </span>
                    </div>

                    <div className="space-y-2">
                      {merchantOrders.filter(o => o.status === 'packing').map(order => (
                        <div key={order.id} className="p-2.5 rounded-xl bg-white border border-blue-200 shadow-2xs space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-900 text-xs">#{order.id}</span>
                            <span className="text-[9px] text-blue-600 font-bold">Armando bolsa</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 truncate">{order.tower}</div>
                          <div className="text-[10px] text-slate-500 leading-tight line-clamp-1">{order.items}</div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${order.progress || 70}%` }} />
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-xs font-black text-emerald-700">Bs. {order.price.toFixed(2)}</span>
                            <span className="text-[9px] text-slate-400">{order.buyer}</span>
                          </div>

                          <button
                            onClick={() => handleAdvanceOrder(order.id)}
                            className="w-full mt-1.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Despachar a Torre</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Columna: En Camino */}
                  <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/80 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-purple-200/60">
                      <span className="text-[11px] font-extrabold text-purple-800 uppercase flex items-center gap-1">
                        🟣 En Camino ({merchantOrders.filter(o => o.status === 'delivering').length})
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-900">
                        En ruta
                      </span>
                    </div>

                    <div className="space-y-2">
                      {merchantOrders.filter(o => o.status === 'delivering').map(order => (
                        <div key={order.id} className="p-2.5 rounded-xl bg-white border border-purple-200 shadow-2xs space-y-1.5 text-left">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-900 text-xs">#{order.id}</span>
                            <span className="text-[9px] text-purple-700 font-extrabold bg-purple-100 px-1.5 py-0.2 rounded">
                              {order.rider || 'Repartidor'}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 truncate">{order.tower}</div>
                          <div className="text-[10px] text-slate-500 leading-tight line-clamp-1">{order.items}</div>

                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-xs font-black text-emerald-700">Bs. {order.price.toFixed(2)}</span>
                            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Con acuse
                            </span>
                          </div>

                          <button
                            onClick={() => handleAdvanceOrder(order.id)}
                            className="w-full mt-1.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Finalizar Entrega</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Barra Inferior Informativa de Automatización */}
              <div className="px-4 py-2 bg-slate-900 text-slate-300 text-[11px] flex items-center justify-between border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  Notificación WhatsApp enviada automáticamente al comprador con código de retiro.
                </span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          3. PERSPECTIVA: PARA CONDOMINIOS (Hub Inteligente de Conserjería)
          ========================================================================= */}
      {activeTab === 'condos' && (
        <div className="spectator-showcase-panel flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 rounded-3xl animate-fade-in-up">

          {/* Columna Izquierda: Seguridad y Beneficios para el Edificio */}
          <div className="w-full lg:w-1/2 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-emerald-700 text-xs sm:text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Conectividad & Beneficios para Condominios</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Organización, comodidad y entregas eficientes para tu Condominio
            </h3>

            <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed">
              Conecta tu edificio o condominio con las tiendas y minimarkets de tu zona. Facilita que los residentes reciban sus pedidos de forma ágil, coordinada y ordenada, optimizando los tiempos de entrega y mejorando la convivencia comunitaria.
            </p>

            {/* 3 Pilares Residenciales */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 text-xs sm:text-sm block">Coordinación y Entregas Claras:</strong>
                  <span className="text-slate-500 text-xs sm:text-sm leading-snug">
                    Cada pedido incluye los datos exactos del vecino (torre, bloque y departamento) para un ingreso y entrega ágil, transparente y sin confusiones.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 shrink-0 font-bold text-xs">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 text-xs sm:text-sm block">Recepción Ordenada en Conserjería:</strong>
                  <span className="text-slate-500 text-xs sm:text-sm leading-snug">
                    Facilita la labor de recepción en portería gracias a paquetes claramente identificados y avisos directos para que los residentes retiren sin demoras.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-900 text-xs sm:text-sm block">Conexión con el Comercio Cercano:</strong>
                  <span className="text-slate-500 text-xs sm:text-sm leading-snug">
                    Acceso instantáneo a los catálogos de tiendas del entorno, facilitando compras rápidas de despensa sin salir del condominio y potenciando el abastecimiento diario.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCondoModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <span>Conoce los Beneficios para tu Edificio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Columna Derecha: Conserjería Digital Hub & Auditoría */}
          <div className="w-full lg:w-1/2">
            <div className="spectator-kanban-frame w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200 text-left bg-slate-50">

              {/* Header Conserjería Central */}
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-white block">Conserjería Central - Condominio Las Lilas</span>
                    <span className="text-[10px] text-slate-400">Torres A, B y C • 148 Departamentos Conectados</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Turno Activo
                </span>
              </div>

              {/* 3 KPI Cards de Impacto Residencial */}
              <div className="p-3.5 grid grid-cols-3 gap-2 bg-slate-100/80 border-b border-slate-200 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                  <div className="text-lg sm:text-2xl font-black text-emerald-700">-68%</div>
                  <div className="text-[10px] font-bold text-slate-600 leading-tight mt-0.5">Tráfico Foráneo</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-teal-200 shadow-2xs">
                  <div className="text-lg sm:text-2xl font-black text-teal-700">14 min</div>
                  <div className="text-[10px] font-bold text-slate-600 leading-tight mt-0.5">Entrega Promedio</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-amber-200 shadow-2xs">
                  <div className="text-lg sm:text-2xl font-black text-amber-600">4.9/5 ⭐</div>
                  <div className="text-[10px] font-bold text-slate-600 leading-tight mt-0.5">Satisfacción Vecinal</div>
                </div>
              </div>

              {/* Registro en Tiempo Real de Encomiendas en Recepción */}
              <div className="p-3.5 space-y-2.5">
                <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span>Recepción Digital de Encomiendas</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Registro Seguro QR
                  </span>
                </div>

                {/* Paquete 1 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Torre A • Depto 704</div>
                      <div className="text-[10px] text-slate-500">Minimarket San Jorge (3 bolsas) • Recibido en mesón</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200 shrink-0">
                    Casillero A-12
                  </span>
                </div>

                {/* Paquete 2 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Torre B • Depto 302</div>
                      <div className="text-[10px] text-slate-500">Almacén Vecinal • Entregado en mano a residente</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[10px] font-black border border-blue-200 shrink-0">
                    Entregado OK
                  </span>
                </div>

                {/* Paquete 3 */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">Torre C • Depto 1105</div>
                      <div className="text-[10px] text-slate-500">Botillería & Market La Esquina (a 120m)</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-[10px] font-black border border-amber-200 shrink-0">
                    En Camino (3 min)
                  </span>
                </div>
              </div>

              {/* Garantía de Privacidad y Cero Vulnerabilidad */}
              <div className="px-4 py-2.5 bg-slate-900 text-slate-300 text-[11px] flex items-center gap-2 border-t border-slate-800">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-tight">
                  <strong className="text-white font-bold">Privacidad 100% Protegida:</strong> Los repartidores nunca tienen acceso a teléfonos personales ni códigos de citófono.
                </span>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Modal: Beneficios para Condominios & Edificios */}
      {isCondoModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
          onClick={() => setIsCondoModalOpen(false)}
        >
          <div 
            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-200 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                    Beneficios para Condominios & Edificios
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Organización, agilidad y convivencia comunitaria con MarketSaaS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCondoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
              {/* Banner introductorio */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  MarketSaaS conecta edificios y condominios con los comercios del entorno para agilizar el abastecimiento diario, protegiendo el orden en conserjería y mejorando la convivencia de la comunidad.
                </p>
              </div>

              {/* 3 Pilares */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Pilar 1: Conserjería */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold mb-2">
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Conserjería Despejada
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Cada orden llega con etiqueta clara de Torre y Departamento. Cero paquetes extraviados o acumulados en mesón.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200/60 inline-block w-fit">
                    Entregas Ágiles
                  </span>
                </div>

                {/* Pilar 2: Residentes */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold mb-2">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Comodidad Vecinal
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Los residentes compran despensa inmediata a tiendas cercanas y reciben en conserjería o puerta en minutos.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60 inline-block w-fit">
                    Sin Sobrecostos
                  </span>
                </div>

                {/* Pilar 3: Administración */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold mb-2">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Orden & Seguridad
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Menos repartidores desconocidos merodeando los accesos. Flujo directo y transparente coordinado con tiendas locales.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 inline-block w-fit">
                    Control Comunitario
                  </span>
                </div>
              </div>

              {/* Caja de Contacto / WhatsApp CTA */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-sm sm:text-base text-emerald-300 flex items-center justify-center sm:justify-start gap-1.5">
                    <Building className="w-4 h-4" />
                    ¿Administras o vives en un Condominio?
                  </h4>
                  <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                    Escríbenos para coordinar la habilitación de torres, bloques y departamentos con los minimarkets registrados en tu zona.
                  </p>
                </div>
                <a
                  href={condoWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-slate-950" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCondoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
