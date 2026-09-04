import React, { useState } from 'react';
import { 
  Store, 
  ShoppingBag, 
  MapPin, 
  Sparkles, 
  Award, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  Layers, 
  PlusCircle, 
  Menu, 
  X,
  PhoneCall,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './Navbar.css';

export const Navbar = ({ onOpenCart, onOpenPoints, onOpenRequests, onOpenLocationModal, onRequestAdminAccess, onOpenAuthModal }) => {
  const { 
    viewMode, 
    setViewMode, 
    cart, 
    cartTotal, 
    cartSavings, 
    selectedLocation, 
    veciPoints, 
    storeConfig,
    orders,
    currentUser,
    merchantStore,
    signOutMerchant
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way').length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm transition-all">
      {/* Barra superior de Promoción y Confianza */}
      <div className="bg-slate-900 text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 shrink-0">
            {/* Si está autenticado, mostrar badge del dueño */}
            {currentUser && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-100 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-800 truncate max-w-[170px]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{merchantStore?.name || currentUser.email}</span>
              </span>
            )}

            {/* Switch de Modo Espectador / Cliente / Administrador */}
            <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setViewMode('spectator')}
                className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'spectator'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Conoce MarketSaaS y vista informativa"
              >
                <span>✨</span>
                <span className="hidden sm:inline">Info Plataforma</span>
                <span className="sm:hidden">Info</span>
              </button>

              <button
                onClick={() => setViewMode('customer')}
                className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'customer'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Ver tienda en vivo como cliente"
              >
                <span>🛍️</span>
                <span className="hidden sm:inline">Vista Vecino</span>
                <span className="sm:hidden">Tienda</span>
              </button>

              <button
                onClick={() => {
                  if (currentUser) {
                    setViewMode('admin');
                  } else if (onOpenAuthModal) {
                    onOpenAuthModal();
                  } else if (onRequestAdminAccess) {
                    onRequestAdminAccess();
                  } else {
                    setViewMode('admin');
                  }
                }}
                className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Panel de administración del comerciante"
              >
                <span>🏪</span>
                <span className="hidden sm:inline">Panel Minimarket</span>
                <span className="sm:hidden">Dueño</span>
                {activeOrdersCount > 0 && (
                  <span className="bg-rose-500 text-white px-1.5 rounded-full text-[9px] animate-pulse">
                    {activeOrdersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo Oficial MarketSaaS / Nombre del Negocio */}
          <button 
            onClick={() => setViewMode('spectator')}
            className="flex items-center min-w-0 text-left cursor-pointer group focus:outline-none"
            title="Ir a la pantalla informativa de MarketSaaS"
          >
            {viewMode === 'spectator' ? (
              <div className="flex items-center py-1">
                <img 
                  src="/logoCompleto.png" 
                  alt="MarketSaaS - La evolución digital de tus ventas" 
                  className="h-9 sm:h-12 w-auto object-contain mix-blend-multiply transition-transform group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src="/iconoPestana.png" 
                  alt="MarketSaaS" 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none">
                      {storeConfig.name}
                    </span>
                    <span className="hidden md:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Abierto
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                    {storeConfig.tagline}
                  </p>
                </div>
              </div>
            )}
          </button>

          {/* Selector de Ubicación (Vista Cliente - Solo si delivery está habilitado por el dueño) */}
          {viewMode === 'customer' && storeConfig.enableDelivery !== false && (
            <div className="hidden lg:flex items-center">
              <button
                onClick={onOpenLocationModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block leading-none">
                    Entrega en:
                  </span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    {selectedLocation.condominium} - {selectedLocation.tower}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Acciones del Navbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {viewMode === 'spectator' ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Botón rápido Explorar Tienda Vecino en Navbar */}
                <button
                  onClick={() => setViewMode('customer')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-slate-200/90 transition-all cursor-pointer shadow-2xs group"
                  title="Explorar catálogo y experiencia de compra"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Ver Tienda Demo</span>
                </button>

                {/* Botón Principal de Acceso Dueños Mejorado */}
                <button
                  onClick={() => {
                    if (currentUser) setViewMode('admin');
                    else if (onOpenAuthModal) onOpenAuthModal();
                    else if (onRequestAdminAccess) onRequestAdminAccess();
                  }}
                  className="relative group overflow-hidden px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 hover:from-emerald-950 hover:to-slate-900 border border-slate-700/80 shadow-xs hover:shadow-md hover:shadow-emerald-950/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  title={currentUser ? 'Ir a panel de administración' : 'Iniciar sesión o registrar tu tienda'}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <LogIn className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  <span>{currentUser ? 'Mi Panel Minimarket' : 'Acceso Dueños'}</span>
                </button>
              </div>
            ) : viewMode === 'customer' ? (
              <>
                {/* Botón de Solicitar Producto ("Pídelo si no está") */}
                <button
                  onClick={onOpenRequests}
                  className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 px-3 py-2 rounded-xl border border-slate-200 transition-all shadow-2xs"
                  title="¿Falta algún producto en el catálogo? Pídelo a la tienda"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Pídelo si no está</span>
                </button>

                {/* VeciPuntos / Fidelidad (Opcional según la tienda) */}
                {storeConfig.enablePoints !== false && (
                  <button
                    onClick={onOpenPoints}
                    className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 transition-all shadow-2xs group"
                  >
                    <div className="w-5 h-5 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-black text-[10px] sm:text-xs shadow-2xs group-hover:rotate-12 transition-transform">
                      ★
                    </div>
                    <div className="text-left leading-none hidden xs:block">
                      <span className="text-[9px] uppercase font-bold text-amber-600 block">Puntos</span>
                      <span className="text-[11px] sm:text-xs font-extrabold text-amber-950">{veciPoints} pts</span>
                    </div>
                  </button>
                )}

                {/* Carrito de Compras Flotante */}
                <button
                  onClick={onOpenCart}
                  className="relative flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Carrito</span>
                  <span className="font-extrabold">{storeConfig.currencySymbol || 'Bs.'} {cartTotal.toFixed(2)}</span>

                  {totalCartItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] sm:text-[11px] flex items-center justify-center shadow-md animate-bounce-gentle">
                      {totalCartItems}
                    </span>
                  )}
                </button>
              </>
            ) : (
              /* Vista de Administrador / Dueño */
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="truncate max-w-[140px] font-bold">{storeConfig.name}</span>
                </span>
                <button
                  onClick={() => setViewMode('customer')}
                  className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                >
                  Ver como Cliente
                </button>
                {currentUser && (
                  <button
                    onClick={signOutMerchant}
                    className="text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-xl border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                    title="Cerrar sesión de comerciante"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Salir</span>
                  </button>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 space-y-2.5 animate-fadeIn">
            {/* Navegación Espectador / Tienda en Móvil */}
            {viewMode === 'spectator' ? (
              <button
                onClick={() => {
                  setViewMode('customer');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-600 text-white text-left text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Explorar Tienda de Demostración</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setViewMode('spectator');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 text-left text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Conoce MarketSaaS (Info)</span>
              </button>
            )}

            {viewMode === 'customer' && (
              <button
                onClick={() => {
                  onOpenLocationModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 text-left text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors"
              >
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Ubicación de entrega:</span>
                  <span className="truncate block font-bold text-slate-900">{selectedLocation.condominium} - {selectedLocation.tower}</span>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                onOpenRequests();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pídelo si no está en la tienda</span>
            </button>

            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-2 border border-emerald-200/60">
              <span className="font-semibold flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-700 shrink-0" /> WhatsApp Tienda:
              </span>
              <a 
                href={`https://wa.me/${storeConfig.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-800 underline bg-emerald-100 px-2 py-1 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                {storeConfig.phone}
              </a>
            </div>

            {/* Opciones de Comerciante en móvil */}
            {currentUser ? (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Sesión activa:</span>
                  <span className="text-xs font-bold text-slate-800 truncate block">{currentUser.email}</span>
                </div>
                <button
                  onClick={() => {
                    signOutMerchant();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  else if (onRequestAdminAccess) onRequestAdminAccess();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Acceso Comerciantes (Login / Registro)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
