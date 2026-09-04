import React from 'react';
import { 
  Store, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag, 
  HelpCircle, 
  Building2, 
  Banknote, 
  QrCode, 
  CreditCard,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CustomerFooter = ({ onOpenCart, onOpenPoints, onOpenRequests, onOpenLocationModal }) => {
  const { storeConfig } = useStore();

  const storeName = storeConfig?.name || 'Minimarket Saas';
  const tagline = storeConfig?.tagline || 'Tu tienda de confianza a pasos de tu puerta';
  const address = storeConfig?.address || 'Calle Los Sauces #420 (Junto al acceso principal)';
  const schedule = storeConfig?.schedule || 'Lunes a Domingo: 08:00 AM - 10:30 PM';
  const phone = storeConfig?.phone || '+591 72125280';
  const whatsappNumber = storeConfig?.whatsapp ? storeConfig.whatsapp.replace(/[^0-9]/g, '') : '59172125280';
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola ${storeName}, tengo una consulta sobre mi pedido.`)}`;

  const condominiums = storeConfig?.condominiums || [
    { name: 'Condominio Las Palmas' },
    { name: 'Condominio Altos del Valle' },
    { name: 'Edificio Vista Sol' },
    { name: 'Barrio Central' }
  ];

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Fila Superior: Identidad y Contacto Directo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          
          {/* Columna 1: Datos de la Tienda */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold shadow-inner">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white tracking-tight leading-tight">
                  {storeName}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {storeConfig?.isOpen !== false ? 'Abierto Ahora' : 'Cerrado Temporalmente'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {tagline}
            </p>

            <div className="space-y-2.5 pt-1 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{address}</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{schedule}</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Columna 2: Cobertura & Condominios Vecinos */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Cobertura Hiperlocal</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atendemos de forma prioritaria a los vecinos de la zona y condominios registrados:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {condominiums.map((condo, idx) => (
                <span 
                  key={idx}
                  className="text-[11px] font-semibold bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {condo.name}
                </span>
              ))}
            </div>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Entregas rápidas directo a conserjería o retiro en tienda.</span>
            </div>
          </div>

          {/* Columna 3: Métodos de Pago & Seguridad */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Métodos de Pago</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paga como te sea más cómodo al recibir tu pedido o al retirar:
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-slate-100 block">Efectivo</strong>
                  <span className="text-[10px] text-slate-400">Pago contra entrega con vuelto exacto</span>
                </div>
              </li>
              <li className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <strong className="text-slate-100 block">Transferencia / QR Digital</strong>
                  <span className="text-[10px] text-slate-400">Simple QR Banco Unión y billeteras</span>
                </div>
              </li>
              <li className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <strong className="text-slate-100 block">Tarjeta Débito / Crédito</strong>
                  <span className="text-[10px] text-slate-400">POS Móvil inalámbrico en conserjería</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Columna 4: Accesos Rápidos del Vecino */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Accesos para Vecinos</span>
            </h4>
            <div className="space-y-2 text-xs">
              {onOpenCart && (
                <button
                  onClick={onOpenCart}
                  className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 transition-colors border border-slate-700/60"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ver mi Canasta</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Abrir →</span>
                </button>
              )}

              {onOpenPoints && (
                <button
                  onClick={onOpenPoints}
                  className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 transition-colors border border-slate-700/60"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Canjear VeciPuntos</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">Mis Puntos →</span>
                </button>
              )}

              {onOpenRequests && (
                <button
                  onClick={onOpenRequests}
                  className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 transition-colors border border-slate-700/60"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>¿Falta un producto? Pídelo</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">Solicitar →</span>
                </button>
              )}

              {onOpenLocationModal && (
                <button
                  onClick={onOpenLocationModal}
                  className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 transition-colors border border-slate-700/60"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cambiar mi Condominio</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Elegir →</span>
                </button>
              )}
            </div>

            <div className="pt-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garantía de frescura y atención personalizada de barrio.</span>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Copyright & Legal */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-300">
              {storeName}
            </span>
            <span>•</span>
            <span>© {new Date().getFullYear()} Todos los derechos reservados</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400 font-medium">
              Potenciado por <strong className="text-emerald-400 font-extrabold">MarketSaaS</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Red Hiperlocal Conectada</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
