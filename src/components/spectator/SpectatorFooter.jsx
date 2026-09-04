import React from 'react';
import { Store, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';
import './SpectatorFooter.css';

export const SpectatorFooter = ({ onExploreStore, onScrollToAuth, onGoToAdmin }) => {
  return (
    <footer className="spectator-footer-container w-full text-slate-600 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
          
          {/* Columna 1 y 2: Identidad y Sello */}
          <div className="space-y-4 md:col-span-2 pr-0 md:pr-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">MarketSaaS</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md">
              Infraestructura de comercio hiperlocal para condominios, barrios cerrados y minimarkets de proximidad. Automatización por WhatsApp y entrega prioritaria a conserjería.
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sello de Confianza Vecinal y Garantía de Entrega</span>
            </div>
          </div>

          {/* Columna 3: Navegación Rápida */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Navegación Rápida
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-500">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Sobre la Solución
                </button>
              </li>
              <li>
                <button
                  onClick={onExploreStore}
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Catálogo en Vivo
                </button>
              </li>
              <li>
                <button
                  onClick={onGoToAdmin}
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Tablero Kanban Despacho
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToAuth}
                  className="hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Ingreso Locatarios
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 4: Soporte & Comunidad */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Soporte & Legal
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-500">
              <li>
                <span className="text-slate-400">Canal de Conserjería</span>
              </li>
              <li>
                <span className="text-slate-400">Pautas de Comunidad</span>
              </li>
              <li>
                <span className="text-slate-400">Privacidad de Edificios</span>
              </li>
              <li>
                <span className="text-slate-400">Términos de Servicio</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Fila Inferior */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs text-center sm:text-left">
          <p>© {new Date().getFullYear()} MarketSaaS Inc. Plataforma SaaS Hiperlocal para Barrios y Condominios.</p>
          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span>Pagos con QR & Transferencia</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <MessageSquare className="w-3 h-3 text-emerald-600" /> Integración WhatsApp Business
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
