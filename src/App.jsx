import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/common/Navbar';
import { Toast } from './components/common/Toast';
import { SpectatorHome } from './components/spectator/SpectatorHome';
import { StoreDirectory } from './components/customer/StoreDirectory';
import { CustomerHome } from './components/customer/CustomerHome';
import { AdminHome } from './components/admin/AdminHome';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { OrderTrackingModal } from './components/customer/OrderTrackingModal';
import { LoyaltyPointsModal } from './components/customer/LoyaltyPointsModal';
import { RequestProductModal } from './components/customer/RequestProductModal';
import { LocationModal } from './components/customer/LocationModal';
import { CustomerFooter } from './components/customer/CustomerFooter';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { AuthModal } from './components/auth/AuthModal';
import './App.css';

const AppContent = () => {
  const { 
    viewMode, 
    setViewMode, 
    customerSubView, 
    goToStore, 
    activeTrackingOrderId, 
    setActiveTrackingOrderId,
    isTrackingModalOpen,
    setIsTrackingModalOpen,
    cart,
    cartTotal,
    storeConfig
  } = useStore();

  // Estados de Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [requestPreloadName, setRequestPreloadName] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [spectatorShowcaseTab, setSpectatorShowcaseTab] = useState('residents');

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOpenRequests = (preloadName = '') => {
    setRequestPreloadName(typeof preloadName === 'string' ? preloadName : '');
    setIsRequestsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Barra de Navegación Principal */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPoints={() => setIsPointsOpen(true)}
        onOpenRequests={() => handleOpenRequests('')}
        onOpenLocationModal={() => setIsLocationOpen(true)}
        onRequestAdminAccess={() => setIsAuthModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        activeSpectatorTab={spectatorShowcaseTab}
        onSelectSpectatorTab={setSpectatorShowcaseTab}
      />

      {/* Contenido Principal según el Modo Activo */}
      <div className="flex-1">
        {viewMode === 'spectator' ? (
          <SpectatorHome
            onExploreStore={() => setViewMode('customer')}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            activeShowcaseTab={spectatorShowcaseTab}
            onSelectShowcaseTab={setSpectatorShowcaseTab}
          />
        ) : viewMode === 'customer' ? (
          customerSubView === 'directory' ? (
            <StoreDirectory
              onSelectStore={goToStore}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          ) : (
            <CustomerHome
              onOpenCart={() => setIsCartOpen(true)}
              onOpenPoints={() => setIsPointsOpen(true)}
              onOpenRequests={handleOpenRequests}
              onOpenLocationModal={() => setIsLocationOpen(true)}
            />
          )
        ) : (
          <AdminHome onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        )}
      </div>

      {/* Footer según la vista activa */}
      {viewMode === 'customer' && (
        <CustomerFooter
          onOpenCart={() => setIsCartOpen(true)}
          onOpenPoints={() => setIsPointsOpen(true)}
          onOpenRequests={() => handleOpenRequests('')}
          onOpenLocationModal={() => setIsLocationOpen(true)}
        />
      )}

      {viewMode === 'admin' && (
        <footer className="bg-white border-t border-slate-200/90 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-center sm:text-left text-slate-600">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                MarketSaaS Panel Admin
              </span>
              <span className="text-slate-300 font-light">•</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                Gestión de Inventario, Pedidos y Clientes
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} MarketSaaS. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      )}

      {/* Modales Globales */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedCheckout={handleOpenCheckout}
        onOpenPoints={() => setIsPointsOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {isTrackingModalOpen && activeTrackingOrderId && (
        <OrderTrackingModal
          orderId={activeTrackingOrderId}
          onClose={() => setIsTrackingModalOpen(false)}
        />
      )}

      <LoyaltyPointsModal
        isOpen={isPointsOpen}
        onClose={() => setIsPointsOpen(false)}
      />

      <RequestProductModal
        isOpen={isRequestsOpen}
        initialProductName={requestPreloadName}
        onClose={() => {
          setIsRequestsOpen(false);
          setRequestPreloadName('');
        }}
      />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Barra Flotante Fija de Carrito en Móvil */}
      {viewMode === 'customer' && cart.length > 0 && !isCartOpen && !isCheckoutOpen && (
        <aside 
          aria-label="Resumen rápido de canasta"
          className="fixed bottom-3 left-3 right-3 z-40 sm:hidden bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between animate-fade-in"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white leading-tight truncate">
                Total: <span className="text-emerald-400 font-black">{storeConfig?.currencySymbol || 'Bs.'} {cartTotal.toFixed(2)}</span>
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {cart.length} {cart.length === 1 ? 'producto en canasta' : 'productos en canasta'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer transition-all"
          >
            <span>Ver Canasta</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Toast Notification Container */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
