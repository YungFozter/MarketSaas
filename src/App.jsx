import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/common/Navbar';
import { Toast } from './components/common/Toast';
import { SpectatorHome } from './components/spectator/SpectatorHome';
import { CustomerHome } from './components/customer/CustomerHome';
import { AdminHome } from './components/admin/AdminHome';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { OrderTrackingModal } from './components/customer/OrderTrackingModal';
import { LoyaltyPointsModal } from './components/customer/LoyaltyPointsModal';
import { RequestProductModal } from './components/customer/RequestProductModal';
import { LocationModal } from './components/customer/LocationModal';
import { AuthModal } from './components/auth/AuthModal';
import './App.css';

const AppContent = () => {
  const { viewMode, setViewMode, activeTrackingOrderId, setActiveTrackingOrderId } = useStore();

  // Estados de Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [spectatorShowcaseTab, setSpectatorShowcaseTab] = useState('residents');

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Barra de Navegación Principal */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPoints={() => setIsPointsOpen(true)}
        onOpenRequests={() => setIsRequestsOpen(true)}
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
          <CustomerHome
            onOpenCart={() => setIsCartOpen(true)}
            onOpenPoints={() => setIsPointsOpen(true)}
            onOpenRequests={() => setIsRequestsOpen(true)}
            onOpenLocationModal={() => setIsLocationOpen(true)}
          />
        ) : (
          <AdminHome onOpenAuthModal={() => setIsAuthModalOpen(true)} />
        )}
      </div>

      {/* Footer Limpio y Elegante (Solo para Tienda y Admin, Espectador incluye su footer enriquecido) */}
      {viewMode !== 'spectator' && (
        <footer className="bg-white border-t border-slate-200/90 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 text-center sm:text-left text-slate-600">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                MarketSaaS
              </span>
              <span className="text-slate-300 font-light">•</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600">
                Sistema Hiperlocal para Tiendas de Barrio y Condominios
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

      {activeTrackingOrderId && (
        <OrderTrackingModal
          orderId={activeTrackingOrderId}
          onClose={() => setActiveTrackingOrderId(null)}
        />
      )}

      <LoyaltyPointsModal
        isOpen={isPointsOpen}
        onClose={() => setIsPointsOpen(false)}
      />

      <RequestProductModal
        isOpen={isRequestsOpen}
        onClose={() => setIsRequestsOpen(false)}
      />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

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
