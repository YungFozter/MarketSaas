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
  PhoneCall
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Navbar = ({ onOpenCart, onOpenPoints, onOpenRequests, onOpenLocationModal, onRequestAdminAccess }) => {
  const { 
    viewMode, 
    setViewMode, 
    cart, 
    cartTotal, 
    cartSavings, 
    selectedLocation, 
    veciPoints, 
    storeConfig,
    orders
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'on_the_way').length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm transition-all">
      {/* Barra superior de Promoción y Confianza */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white text-[11px] sm:text-xs py-1 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 font-medium min-w-0">
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span className="truncate">100% Garantía de Frescura</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-emerald-100">
              <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              Entregas en 10-15 min
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Switch de Modo Cliente / Administrador */}
            <div className="flex items-center bg-black/25 p-0.5 rounded-lg border border-white/20">
              <button
                onClick={() => setViewMode('customer')}
                className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-md font-semibold text-[10px] sm:text-xs transition-all flex items-center gap-1 ${
                  viewMode === 'customer'
                    ? 'bg-white text-emerald-900 shadow-xs font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Cliente</span>
              </button>
              <button
                onClick={() => {
                  if (viewMode === 'customer') {
                    if (onRequestAdminAccess) {
                      onRequestAdminAccess();
                    } else {
                      setViewMode('admin');
                    }
                  }
                }}
                className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-md font-semibold text-[10px] sm:text-xs transition-all flex items-center gap-1 ${
                  viewMode === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Store className="w-3 h-3" />
                <span>Dueño</span>
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
          
          {/* Logo y Nombre del Negocio */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-50 shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
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

          {/* Selector de Ubicación (Vista Cliente) */}
          {viewMode === 'customer' && (
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
            {viewMode === 'customer' ? (
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
                  Modo Tienda Activo
                </span>
                <button
                  onClick={() => setViewMode('customer')}
                  className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1"
                >
                  Ver como Cliente
                </button>
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
          </div>
        )}
      </div>
    </header>
  );
};
