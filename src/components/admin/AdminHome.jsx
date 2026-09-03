import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Store, 
  Sparkles, 
  Settings,
  Bell,
  Share2,
  Copy,
  ExternalLink,
  Check,
  Globe,
  UserCheck
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { LiveOrdersBoard } from './LiveOrdersBoard';
import { InventoryManager } from './InventoryManager';
import { PosTerminal } from './PosTerminal';
import { StoreSettings } from './StoreSettings';
import { ProductRequestsAdmin } from './ProductRequestsAdmin';
import { useStore } from '../../context/StoreContext';
import './AdminHome.css';

export const AdminHome = ({ onOpenAuthModal }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copied, setCopied] = useState(false);
  const { orders, productRequests, storeConfig, tenantSlug, currentUser, showToast } = useStore();

  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const pendingRequestsCount = productRequests.filter(r => r.status === 'pending').length;

  const publicStoreUrl = `${window.location.origin}${window.location.pathname}?store=${tenantSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    setCopied(true);
    showToast('¡Enlace de tienda copiado al portapapeles!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola vecinos! Ya pueden hacer sus pedidos online en *${storeConfig.name}* a través de nuestro enlace directo: ${publicStoreUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const tabs = [
    { id: 'dashboard', name: 'Resumen & Ventas', icon: LayoutDashboard },
    { id: 'orders', name: 'Pedidos en Vivo', icon: ShoppingBag, badge: pendingOrdersCount },
    { id: 'inventory', name: 'Inventario & Precios', icon: Package },
    { id: 'pos', name: 'Punto de Venta (POS)', icon: Store },
    { id: 'requests', name: 'Peticiones Vecinos', icon: Sparkles, badge: pendingRequestsCount },
    { id: 'settings', name: 'Configuración Tienda', icon: Settings },
  ];

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24 space-y-5">
      {/* Banner de Identidad del Comerciante y Enlace Público */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Store className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight truncate">
                {storeConfig.name}
              </h1>
              <span className="text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                ID: {tenantSlug}
              </span>
            </div>
            <p className="text-xs text-slate-300 truncate mt-0.5 flex items-center gap-1.5">
              {currentUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Dueño: <strong>{currentUser.email}</strong></span>
                </>
              ) : (
                <span className="text-amber-300">
                  Modo de prueba local. Para guardar tus cambios en la nube, inicia sesión con Supabase.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Acciones de Enlace de Tienda */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-700/70 hover:bg-slate-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-600 transition-all cursor-pointer"
            title="Copiar link para compartir con clientes"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            title="Enviar catálogo por WhatsApp a los vecinos"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir WhatsApp</span>
          </button>

          <a
            href={publicStoreUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors shrink-0"
            title="Abrir vista pública de la tienda en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Barra de Pestañas del Administrador */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar touch-pan-x scroll-smooth -mx-3 px-3 sm:mx-0 sm:px-0 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shrink-0 border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                  : 'bg-white text-slate-600 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{tab.name}</span>
              {tab.badge > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div>
        {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
        {activeTab === 'orders' && <LiveOrdersBoard />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'pos' && <PosTerminal />}
        {activeTab === 'requests' && <ProductRequestsAdmin />}
        {activeTab === 'settings' && <StoreSettings />}
      </div>
    </main>
  );
};
