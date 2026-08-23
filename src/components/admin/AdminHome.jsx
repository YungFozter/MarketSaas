import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Store, 
  Sparkles, 
  Settings,
  Bell
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { LiveOrdersBoard } from './LiveOrdersBoard';
import { InventoryManager } from './InventoryManager';
import { PosTerminal } from './PosTerminal';
import { StoreSettings } from './StoreSettings';
import { ProductRequestsAdmin } from './ProductRequestsAdmin';
import { useStore } from '../../context/StoreContext';

export const AdminHome = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { orders, productRequests } = useStore();

  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
  const pendingRequestsCount = productRequests.filter(r => r.status === 'pending').length;

  const tabs = [
    { id: 'dashboard', name: 'Resumen & Ventas', icon: LayoutDashboard },
    { id: 'orders', name: 'Pedidos en Vivo', icon: ShoppingBag, badge: pendingOrdersCount },
    { id: 'inventory', name: 'Inventario & Precios', icon: Package },
    { id: 'pos', name: 'Punto de Venta (POS)', icon: Store },
    { id: 'requests', name: 'Peticiones Vecinos', icon: Sparkles, badge: pendingRequestsCount },
    { id: 'settings', name: 'Configuración Tienda', icon: Settings },
  ];

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-20 sm:pb-24">
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
