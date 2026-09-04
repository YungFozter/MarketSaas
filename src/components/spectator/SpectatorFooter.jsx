import React from 'react';
import { Store, ShieldCheck, Sparkles, CheckCircle2, Lock, ArrowUpRight, Heart } from 'lucide-react';
import './SpectatorFooter.css';

export const SpectatorFooter = ({ onExploreStore, onScrollToAuth, onGoToAdmin }) => {
  return (
    <footer className="spectator-footer-container w-full text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-slate-800/80">
          
          {/* Columna 1: Identidad, Misión y Garantías */}
          <div className="space-y-4 md:col-span-5 pr-0 lg:pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  MarketSaaS
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              La plataforma moderna que impulsa el comercio de cercanía y empodera a los minimarkets de barrio. Unimos tecnología intuitiva, pedidos ágiles y confianza comunitaria para que vecinos y comerciantes disfruten de una experiencia digital rápida, humana y eficiente.
            </p>

            {/* Sello de Confianza Vecinal y Garantía */}
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 text-emerald-400 text-xs font-bold border border-emerald-800/60 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sello de Confianza Vecinal y Garantía de Entrega</span>
            </div>
          </div>

          {/* Columna 2: Navegación Rápida */}
          <div className="space-y-3.5 md:col-span-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Navegación Rápida
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Sobre la Solución</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onExploreStore}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Catálogo en Vivo</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onGoToAdmin}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Tablero Kanban Despacho</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToAuth}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Ingreso Locatarios</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Soporte & Comunidad */}
          <div className="space-y-3.5 md:col-span-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Soporte & Legal
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-default">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Canal de Conserjería & Enlace
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-default">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Pautas de Comunidad Segura
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-default">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Privacidad de Edificios & Datos
                </span>
              </li>
              <li>
                <span className="flex items-center gap-2 hover:text-slate-300 transition-colors cursor-default">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Términos del Servicio Hiperlocal
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Fila Inferior Rediseñada sin Integración WhatsApp Business */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
          <p className="text-slate-400">
            © {new Date().getFullYear()} <strong className="text-slate-200 font-semibold">MarketSaaS Inc.</strong> Plataforma SaaS Hiperlocal para Barrios y Condominios.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Transacciones Cifradas</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Pagos con QR & Transferencia</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
