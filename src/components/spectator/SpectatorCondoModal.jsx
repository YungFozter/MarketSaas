import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Building,
  PackageCheck,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  X
} from 'lucide-react';
import './SpectatorCondoModal.css';

export const SpectatorCondoModal = ({ isOpen, onClose, whatsappNumber = '59172125280' }) => {
  const condoWaMessage = '¡Hola MarketSaaS! 🏢 Me gustaría recibir información sobre los beneficios e integración de MarketSaaS para mi condominio o edificio.';
  const condoWaUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(condoWaMessage)}`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="spectator-condo-modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="spectator-condo-modal-card relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-200 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                Beneficios para Condominios & Edificios
              </h3>
              <p className="text-xs text-emerald-100">
                Organización, agilidad y convivencia comunitaria con MarketSaaS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* Banner introductorio */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              MarketSaaS conecta edificios y condominios con los comercios del entorno para agilizar el abastecimiento diario, protegiendo el orden en conserjería y mejorando la convivencia de la comunidad.
            </p>
          </div>

          {/* 3 Pilares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pilar 1: Conserjería */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold mb-2">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Conserjería Despejada
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cada orden llega con etiqueta clara de Torre y Departamento. Cero paquetes extraviados o acumulados en mesón.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200/60 inline-block w-fit">
                Entregas Ágiles
              </span>
            </div>

            {/* Pilar 2: Residentes */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold mb-2">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Comodidad Vecinal
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Los residentes compran despensa inmediata a tiendas cercanas y reciben en conserjería o puerta en minutos.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60 inline-block w-fit">
                Sin Sobrecostos
              </span>
            </div>

            {/* Pilar 3: Administración */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Orden & Seguridad
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menos repartidores desconocidos merodeando los accesos. Flujo directo y transparente coordinado con tiendas locales.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 inline-block w-fit">
                Control Comunitario
              </span>
            </div>
          </div>

          {/* Caja de Contacto / WhatsApp CTA */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-sm sm:text-base text-emerald-300 flex items-center justify-center sm:justify-start gap-1.5">
                <Building className="w-4 h-4" />
                ¿Administras o vives en un Condominio?
              </h4>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                Escríbenos para coordinar la habilitación de torres, bloques y departamentos con los minimarkets registrados en tu zona.
              </p>
            </div>
            <a
              href={condoWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-slate-950" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
