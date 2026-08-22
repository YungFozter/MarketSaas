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
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-slate-200/80 shadow-xs transition-all">
      {/* Barra superior de Promoción y Confianza */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              100% Garantía de Frescura & Vecindad
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-emerald-100">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              Entregas en tu puerta en 10-15 min
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Switch de Modo Cliente / Administrador */}
            <div className="flex items-center bg-black/20 p-0.5 rounded-xl border border-white/20">
              <button
                onClick={() => setViewMode('customer')}
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'customer'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Vista Cliente</span>
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
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
                  viewMode === 'admin'
                    ? 'bg-amber-400 text-slate-900 shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Vista Dueño</span>
                {activeOrdersCount > 0 && (
                  <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] animate-pulse">
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
        <div className="flex items-center justify-between h-18 gap-4">
          
          {/* Logo y Nombre del Negocio */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-50">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  {storeConfig.name}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Abierto
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {storeConfig.tagline}
              </p>
            </div>
          </div>

          {/* Selector de Ubicación (Vista Cliente) */}
          {viewMode === 'customer' && (
            <div className="hidden lg:flex items-center">
              <button
                onClick={onOpenLocationModal}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Entregar en tu puerta:
                  </span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    {selectedLocation.condominium} - {selectedLocation.tower}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Acciones del Navbar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
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

                {/* VeciPuntos / Fidelidad */}
                <button
                  onClick={onOpenPoints}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 transition-all shadow-2xs group"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-2xs group-hover:rotate-12 transition-transform">
                    ★
                  </div>
                  <div className="text-left leading-none">
                    <span className="text-[10px] uppercase font-bold text-amber-600 block">Puntos</span>
                    <span className="text-xs font-extrabold text-amber-950">{veciPoints} pts</span>
                  </div>
                </button>

                {/* Carrito de Compras Flotante */}
                <button
                  onClick={onOpenCart}
                  className="relative flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="hidden sm:inline">Carrito</span>
                  <span className="font-extrabold">${cartTotal.toFixed(2)}</span>

                  {totalCartItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-md animate-bounce-gentle">
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
                  className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  Ver como Cliente
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 space-y-2 animate-fadeIn">
            {viewMode === 'customer' && (
              <button
                onClick={() => {
                  onOpenLocationModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-100 text-left text-xs font-bold text-slate-800"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Ubicación: {selectedLocation.condominium} - {selectedLocation.tower}</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenRequests();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200 text-left text-xs font-bold text-slate-700"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Pídelo si no está en la tienda</span>
            </button>

            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-700" /> WhatsApp Tienda:
              </span>
              <a 
                href={`https://wa.me/${storeConfig.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-700 underline"
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
