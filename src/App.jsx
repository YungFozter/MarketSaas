import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/common/Navbar';
import { Toast } from './components/common/Toast';
import { CustomerHome } from './components/customer/CustomerHome';
import { AdminHome } from './components/admin/AdminHome';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { OrderTrackingModal } from './components/customer/OrderTrackingModal';
import { LoyaltyPointsModal } from './components/customer/LoyaltyPointsModal';
import { RequestProductModal } from './components/customer/RequestProductModal';
import { LocationModal } from './components/customer/LocationModal';
import { AdminPinModal } from './components/admin/AdminPinModal';

const AppContent = () => {
  const { viewMode, setViewMode, activeTrackingOrderId, setActiveTrackingOrderId } = useStore();

  // Estados de Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleAdminAccessSuccess = () => {
    setIsAdminPinOpen(false);
    setViewMode('admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Barra de Navegación Principal */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPoints={() => setIsPointsOpen(true)}
        onOpenRequests={() => setIsRequestsOpen(true)}
        onOpenLocationModal={() => setIsLocationOpen(true)}
        onRequestAdminAccess={() => setIsAdminPinOpen(true)}
      />

      {/* Contenido Principal según el Modo Activo */}
      <div className="flex-1">
        {viewMode === 'customer' ? (
          <CustomerHome
            onOpenCart={() => setIsCartOpen(true)}
            onOpenPoints={() => setIsPointsOpen(true)}
            onOpenRequests={() => setIsRequestsOpen(true)}
            onOpenLocationModal={() => setIsLocationOpen(true)}
          />
        ) : (
          <AdminHome />
        )}
      </div>

      {/* Footer Limpio y Amigable */}
      <footer className="bg-white border-t border-slate-200/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-slate-700">
            MarketSaaS • Sistema Hiperlocal para Tiendas de Barrio y Condominios
          </p>
          <div className="flex items-center gap-4 font-medium text-slate-400">
            <span>✨ Garantía de Frescura</span>
            <span>🛵 Delivery Express</span>
            <span>★ VeciPuntos</span>
          </div>
        </div>
      </footer>

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

      <AdminPinModal
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onSuccess={handleAdminAccessSuccess}
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
