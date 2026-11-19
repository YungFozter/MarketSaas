import React, { useMemo } from 'react';
import {
  MessageCircle,
  ShieldCheck,
  HelpCircle,
  Banknote,
  QrCode,
  CreditCard
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OFFICIAL_PLATFORM_CONTACT } from '../../data/officialPlatformContact';
import './CustomerFooter.css';

const PAYMENT_PILL_CONFIG = {
  cash: { label: 'Efectivo', icon: Banknote, iconClass: 'text-emerald-400' },
  qr: { label: 'QR Simple', icon: QrCode, iconClass: 'text-cyan-400' },
  card: { label: 'Tarjeta POS', icon: CreditCard, iconClass: 'text-amber-400' }
};

export const CustomerFooter = ({ onOpenRequests }) => {
  const { storeConfig, customerSubView } = useStore();

  const merchantWaMessage = '¡Hola! Me gustaría crear mi Tienda Digital en MarketSaaS. Quisiera recibir información sobre cómo activar mi minimarket online, digitalizar mi catálogo y recibir pedidos por WhatsApp.';
  const merchantWaUrl = `https://wa.me/${OFFICIAL_PLATFORM_CONTACT.whatsappDigits}?text=${encodeURIComponent(merchantWaMessage)}`;

  const enabledPayments = useMemo(() => {
    const raw = Array.isArray(storeConfig?.paymentMethods) ? storeConfig.paymentMethods : [];
    const active = raw.filter(pm => pm && pm.enabled !== false && PAYMENT_PILL_CONFIG[pm.id]);
    if (active.length > 0) {
      return active.map(pm => ({
        id: pm.id,
        ...PAYMENT_PILL_CONFIG[pm.id],
        label: pm.name?.split(' ')[0] === 'Efectivo'
          ? 'Efectivo'
          : (PAYMENT_PILL_CONFIG[pm.id]?.label || pm.name)
      }));
    }
    return [
      { id: 'cash', ...PAYMENT_PILL_CONFIG.cash },
      { id: 'qr', ...PAYMENT_PILL_CONFIG.qr },
      { id: 'card', ...PAYMENT_PILL_CONFIG.card }
    ];
  }, [storeConfig?.paymentMethods]);

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 pt-8 pb-6 px-4 sm:px-6 lg:px-8 mt-10 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Fila Principal Compacta: Métodos de Pago y Accesos Rápidos */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-300">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Pagos Aceptados:</span>
            </span>
            <div className="footer-payment-pills">
              {enabledPayments.map((pm) => {
                const Icon = pm.icon;
                return (
                  <span
                    key={pm.id}
                    className="footer-payment-pill px-3 py-1.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs"
                  >
                    <Icon className={`w-3.5 h-3.5 ${pm.iconClass}`} aria-hidden="true" />
                    <span>{pm.label}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Accesos Rápidos para Vecinos */}
          {onOpenRequests && customerSubView === 'storefront' && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onOpenRequests}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700/60 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>Pedir Producto</span>
              </button>
            </div>
          )}
        </div>

        {/* Enlace de captación oficial siempre dirigido a MarketSaaS */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 text-center py-1">
          <span>¿Tienes una tienda de barrio o minimarket?</span>
          <a
            href={merchantWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Digitaliza tu tienda con MarketSaaS →</span>
          </a>
        </div>

        {/* Barra Inferior de Copyright & Legal */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>© {new Date().getFullYear()} MarketSaaS. Todos los derechos reservados.</span>
          </div>

          <div className="text-[11px] text-slate-400">
            <span>Conectando vecinos con sus comercios locales</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
