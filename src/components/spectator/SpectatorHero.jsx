import React from 'react';
import { ShoppingBag, Store, Zap, PiggyBank, RefreshCw, Building, Sparkles } from 'lucide-react';
import './SpectatorHero.css';

export const SpectatorHero = ({ onExploreStore, onScrollToAuth }) => {
  return (
    <div className="spectator-hero-container w-full">
      {/* Luces de brillo ambiental en segundo plano */}
      <div className="spectator-ambient-glow-1" />
      <div className="spectator-ambient-glow-2" />

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-14 sm:pb-16 flex flex-col items-center text-center">
        
        {/* Insignia Shimmer */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-2xs border border-slate-200/80 mb-6 animate-fade-in-up">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Plataforma SaaS Hiperlocal para Barrios y Condominios
          </span>
        </div>

        {/* Título Principal H1 */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.12] mb-4">
          El comercio de cercanía, <br className="hidden sm:inline" />
          <span className="spectator-gradient-title">digitalizado y a tu puerta</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mb-8 leading-relaxed">
          Entregas hiperlocales en minutos, pedidos directos a WhatsApp, catálogo dinámico en tiempo real y{' '}
          <strong className="text-slate-900 font-bold">0% de comisiones abusivas</strong> para minimarkets y almacenes comunitarios.
        </p>

        {/* Botones CTA Principales */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-12 sm:mb-16">
          <button
            onClick={onExploreStore}
            className="w-full sm:w-auto h-12 px-7 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <ShoppingBag className="w-5 h-5 text-emerald-100 group-hover:scale-110 transition-transform" />
            <span>Explorar Tienda Demo</span>
          </button>

          <button
            onClick={onScrollToAuth}
            className="w-full sm:w-auto h-12 px-7 rounded-xl bg-white/95 hover:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base border border-slate-200 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Store className="w-5 h-5 text-emerald-600" />
            <span>Acceso a Dueños</span>
          </button>
        </div>

        {/* Métricas Ticker: 4 Tarjetas Glassmorphism */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 text-left">
          
          {/* Métrica 1 */}
          <div className="spectator-metric-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Prioridad
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mb-0.5">⚡ 15 min</div>
              <div className="text-xs text-slate-500 leading-snug">Entrega a tu torre (Conserjería o puerta directa)</div>
            </div>
          </div>

          {/* Métrica 2 */}
          <div className="spectator-metric-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <PiggyBank className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                Trato Justo
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mb-0.5">💰 0%</div>
              <div className="text-xs text-slate-500 leading-snug">Comisiones abusivas. Trato directo vecino-comercio</div>
            </div>
          </div>

          {/* Métrica 3 */}
          <div className="spectator-metric-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full">
                En Vivo
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mb-0.5">🔄 100%</div>
              <div className="text-xs text-slate-500 leading-snug">Stock y precios actualizados en tiempo real</div>
            </div>
          </div>

          {/* Métrica 4 */}
          <div className="spectator-metric-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-full">
                SaaS
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mb-0.5">🏢 Multi-Tenant</div>
              <div className="text-xs text-slate-500 leading-snug">Subdominio propio y canal directo por WhatsApp</div>
            </div>
          </div>

        </div>

      </section>
    </div>
  );
};
