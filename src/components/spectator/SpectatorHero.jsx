import React from 'react';
import { ShoppingBag, Store, Sparkles } from 'lucide-react';
import { SpectatorCarousel } from './SpectatorCarousel';
import './SpectatorHero.css';

export const SpectatorHero = ({ onExploreStore, onScrollToAuth }) => {
  return (
    <div className="spectator-hero-container w-full">
      {/* Luces de brillo ambiental en segundo plano */}
      <div className="spectator-ambient-glow-1" />
      <div className="spectator-ambient-glow-2" />

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3 sm:pt-5 sm:pb-5 flex flex-col items-center text-center">
        
        {/* Insignia Shimmer */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-2xs border border-slate-200/80 mb-2 sm:mb-2.5 animate-fade-in-up">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Plataforma SaaS Hiperlocal para Barrios y Condominios
          </span>
        </div>

        {/* Título Principal H1 */}
        <h1 className="text-2xl sm:text-3xl lg:text-[38px] xl:text-[42px] font-extrabold tracking-tight text-slate-900 max-w-4xl leading-tight mb-2 sm:mb-2.5">
          El comercio de cercanía, <br className="hidden sm:inline" />
          <span className="spectator-gradient-title">digitalizado y a tu puerta</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 max-w-2xl mb-3 sm:mb-4 leading-normal">
          Entregas hiperlocales en minutos, pedidos directos a WhatsApp, catálogo dinámico en tiempo real y{' '}
          <strong className="text-slate-900 font-bold">0% de comisiones abusivas</strong> para minimarkets y almacenes comunitarios.
        </p>

        {/* Botones CTA Principales */}
        <div className="flex flex-row items-center justify-center gap-3 w-full sm:w-auto mb-3 sm:mb-4">
          <button
            onClick={onExploreStore}
            className="flex-1 sm:flex-initial h-9 sm:h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
            <span>Explorar Tienda Demo</span>
          </button>

          <button
            onClick={onScrollToAuth}
            className="flex-1 sm:flex-initial h-9 sm:h-10 px-5 rounded-xl bg-white/95 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Acceso a Dueños</span>
          </button>
        </div>

        {/* Carrusel Dinámico de Descripciones del Sistema */}
        <div className="w-full">
          <SpectatorCarousel />
        </div>

      </section>
    </div>
  );
};
