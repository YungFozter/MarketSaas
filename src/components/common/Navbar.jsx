import React, { useState, useEffect } from 'react';
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
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import './Navbar.css';

export const Navbar = ({ 
  onOpenCart, 
  onOpenPoints, 
  onOpenRequests, 
  onOpenLocationModal, 
  onRequestAdminAccess, 
  onOpenAuthModal,
  activeSpectatorTab = 'residents',
  onSelectSpectatorTab
}) => {
  const { 
    viewMode, 
    setViewMode, 
    cart, 
    cartTotal, 
    cartSubtotal,
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const winHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (winHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollY / winHeight) * 100)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way').length;

  const handleTabNavigation = (tab) => {
    if (onSelectSpectatorTab) {
      onSelectSpectatorTab(tab);
    }
    const el = document.getElementById('section-showcase');
    if (el) {
      const yOffset = -75;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Barra superior de Promoción y Confianza Rediseñada (Se colapsa suavemente al scrollear) */}
      <div 
        className={`w-full bg-slate-950 text-white text-[11px] sm:text-xs border-b border-slate-800/80 transition-all duration-300 overflow-hidden ${
          isScrolled 
            ? 'max-h-0 opacity-0 py-0 border-none' 
            : 'max-h-16 py-1.5 px-3 sm:px-6 opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          
          {/* Lado Izquierdo: Anuncio de Confianza & Estado en Vivo */}
          <div className="hidden sm:flex items-center gap-2 text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-white font-extrabold text-[11px] tracking-tight">Red Disponible 24 horas</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold text-[11px]">Comercio de Proximidad Inteligente</span>
          </div>

          {/* Lado Derecho: Switch de Modos y Badge de Usuario */}
          <div className="flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto">
            {currentUser && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-100 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-800 truncate max-w-[170px]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{merchantStore?.name || currentUser.email}</span>
              </span>
            )}

            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700/80 shadow-xs">
              <button
                onClick={() => setViewMode('spectator')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'spectator'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Conoce MarketSaaS y vista informativa"
              >
                <span>✨</span>
                <span>Info Plataforma</span>
              </button>

              <button
                onClick={() => setViewMode('customer')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'customer'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Ver tienda en vivo como cliente"
              >
                <span>🛍️</span>
                <span>Vista Vecino</span>
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
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Panel de administración del comerciante"
              >
                <span>🏪</span>
                <span>Panel Minimarket</span>
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

      {/* Cápsula Flotante Despegada / Dynamic Island */}
      <div 
        className={`transition-all duration-300 ease-out ${
          isScrolled 
            ? 'max-w-6xl mx-auto px-3 sm:px-6 pt-2 sm:pt-2.5' 
            : 'w-full px-0 pt-0'
        }`}
      >
        <div 
          className={`relative transition-all duration-300 ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-950/8 px-3 sm:px-6 ring-1 ring-black/5'
              : 'bg-white border-b border-slate-100 shadow-none px-3 sm:px-6 lg:px-8'
          }`}
        >
          <div className={`flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 ${
            isScrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-18'
          }`}>
          
          {/* Logo y Marca Oficial MarketSaaS en Código Vectorial (Sin imágenes de fondo beige) */}
          <button 
            onClick={() => setViewMode('spectator')}
            className="flex items-center gap-2 sm:gap-3 shrink-0 text-left cursor-pointer group focus:outline-none"
            title="Ir a la pantalla informativa de MarketSaaS"
          >
            {viewMode === 'spectator' ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Isotipo Moderno con Flecha de Crecimiento */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 border border-slate-700/80 flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:border-emerald-500/50 transition-all shrink-0">
                  <div className="flex items-center justify-center font-black text-sm sm:text-base text-emerald-400 tracking-tighter">
                    M<span className="text-sky-400">S</span>
                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 -ml-0.5 -mt-1.5 sm:-mt-2" />
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="font-extrabold text-lg sm:text-xl md:text-2xl text-slate-950 tracking-tight">
                      Market<span className="text-sky-600">SaaS</span>
                    </span>
                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[9px] font-extrabold border border-sky-200 uppercase tracking-wider">
                      Plataforma
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold tracking-tight hidden sm:block">
                    La evolución digital de tus ventas.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
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

          {/* Acciones del Navbar (Lado Derecho) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {viewMode === 'spectator' ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Botón rápido Explorar Tienda Vecino en Navbar */}
                <button
                  onClick={() => setViewMode('customer')}
                  className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200/90 transition-all cursor-pointer shadow-2xs group"
                  title="Explorar catálogo y experiencia de compra"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Ver Tienda Demo</span>
                </button>

                {/* Botón Principal de Acceso Dueños */}
                <button
                  onClick={() => {
                    if (currentUser) setViewMode('admin');
                    else if (onOpenAuthModal) onOpenAuthModal();
                    else if (onRequestAdminAccess) onRequestAdminAccess();
                  }}
                  className="relative group overflow-hidden px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-bold sm:font-extrabold text-[11px] sm:text-xs md:text-sm text-white bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 hover:from-emerald-950 hover:to-slate-900 border border-slate-700/80 shadow-xs hover:shadow-md hover:shadow-emerald-950/20 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap"
                  title={currentUser ? 'Ir a panel de administración' : 'Iniciar sesión o registrar tu tienda'}
                >
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  <span>{currentUser ? 'Mi Panel' : 'Acceso Dueños'}</span>
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
                  <span className="font-extrabold">{storeConfig.currencySymbol || 'Bs.'} {cartSubtotal.toFixed(2)}</span>

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
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/80 ml-1 shrink-0"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
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

            {viewMode === 'customer' && (
              <>
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
              </>
            )}

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

        {/* Indicador de brillo y progreso dinámico al scrollear */}
        {isScrolled && (
          <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-slate-100/60 overflow-hidden pointer-events-none rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 transition-all duration-150 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}
        </div>
      </div>
    </header>
  );
};
