import React from 'react';
import {
  MessageCircle,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  HelpCircle,
  Banknote,
  QrCode,
  CreditCard
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CustomerFooter = ({ onOpenCart, onOpenPoints, onOpenRequests }) => {
  const { storeConfig, customerSubView } = useStore();

  const whatsappNumber = storeConfig?.whatsapp ? storeConfig.whatsapp.replace(/[^0-9]/g, '') : '59172125280';
  const merchantWaMessage = "¡Hola!. Me gustaría crear mi Tienda Digital en MarketSaaS. 🚀 Quisiera recibir información sobre cómo activar mi propio minimarket online, digitalizar mi catálogo y comenzar a recibir pedidos por WhatsApp. 🛒📦";
  const merchantWaUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(merchantWaMessage)}`;

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 pt-8 pb-6 px-4 sm:px-6 lg:px-8 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Fila Principal Compacta: Métodos de Pago y Accesos Rápidos */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          
          {/* Métodos de Pago Compactos */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-300">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Pagos Aceptados:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                <span>Efectivo</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>QR Simple</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Tarjeta POS</span>
              </span>
            </div>
          </div>

          {/* Accesos Rápidos para Vecinos */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700/60 hover:text-white transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mi Canasta</span>
              </button>
            )}

            {onOpenPoints && (
              <button
                onClick={onOpenPoints}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700/60 hover:text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>VeciPuntos</span>
              </button>
            )}

            {onOpenRequests && customerSubView === 'storefront' && (
              <button
                onClick={onOpenRequests}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700/60 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pedir Producto</span>
              </button>
            )}
          </div>
        </div>

        {/* Línea Sutil para Comercios */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 text-center py-1">
          <span>¿Tienes una tienda de barrio o minimarket?</span>
          <a
            href={merchantWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Digitaliza tu tienda con MarketSaaS →</span>
          </a>
        </div>

        {/* Barra Inferior de Copyright & Legal */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} MarketSaaS. Todos los derechos reservados.</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Conectando vecinos con sus comercios locales</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
