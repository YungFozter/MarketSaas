import React, { useState, useEffect } from 'react';
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
    storeConfig,
    currentUser,
    merchantStore,
    isRecoveryMode,
    setIsRecoveryMode
  } = useStore();

  // Estados de Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [requestPreloadName, setRequestPreloadName] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [spectatorShowcaseTab, setSpectatorShowcaseTab] = useState('residents');

  // Si llega en modo recuperación de contraseña (por enlace de correo de Supabase)
  useEffect(() => {
    if (isRecoveryMode) {
      setAuthModalMode('update-password');
      setIsAuthModalOpen(true);
    }
  }, [isRecoveryMode]);

  const handleOpenAuthModal = (mode = 'login') => {
    setAuthModalMode(typeof mode === 'string' ? mode : 'login');
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
    if (isRecoveryMode) {
      setIsRecoveryMode(false);
    }
    // Si el usuario intentó acceder a admin pero no tiene sesión ni tienda, volver a vista vecino para no dejarlo atrapado
    if (viewMode === 'admin' && (!currentUser || !merchantStore)) {
      setViewMode('customer');
    }
  };

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOpenRequests = (preloadName = '') => {
    if (customerSubView !== 'storefront') return;
    setRequestPreloadName(typeof preloadName === 'string' ? preloadName : '');
    setIsRequestsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Barra de Navegación Principal para Vista Espectador y Vecino */}
      {viewMode !== 'admin' && (
        <Navbar
          onOpenCart={() => setIsCartOpen(true)}
          onOpenRequests={() => handleOpenRequests('')}
          onOpenLocationModal={() => setIsLocationOpen(true)}
          onRequestAdminAccess={() => handleOpenAuthModal('login')}
          onOpenAuthModal={handleOpenAuthModal}
          activeSpectatorTab={spectatorShowcaseTab}
          onSelectSpectatorTab={setSpectatorShowcaseTab}
        />
      )}

      {/* Contenido Principal según el Modo Activo */}
      <div className="flex-1">
        {viewMode === 'spectator' ? (
          <SpectatorHome
            onExploreStore={() => setViewMode('customer')}
            onOpenAuthModal={handleOpenAuthModal}
            activeShowcaseTab={spectatorShowcaseTab}
            onSelectShowcaseTab={setSpectatorShowcaseTab}
          />
        ) : viewMode === 'customer' ? (
          customerSubView === 'directory' ? (
            <StoreDirectory
              onSelectStore={goToStore}
              onOpenAuthModal={handleOpenAuthModal}
            />
          ) : (
            <CustomerHome
              onOpenCart={() => setIsCartOpen(true)}
              onOpenRequests={handleOpenRequests}
              onOpenLocationModal={() => setIsLocationOpen(true)}
            />
          )
        ) : (
          <AdminHome onOpenAuthModal={handleOpenAuthModal} />
        )}
      </div>

      {/* Footer según la vista activa */}
      {viewMode === 'customer' && (
        <CustomerFooter
          onOpenCart={() => setIsCartOpen(true)}
          onOpenRequests={() => handleOpenRequests('')}
          onOpenLocationModal={() => setIsLocationOpen(true)}
        />
      )}

      {/* Modales Globales */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedCheckout={handleOpenCheckout}
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
        onClose={handleCloseAuthModal}
        initialMode={authModalMode}
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
