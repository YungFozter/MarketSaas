import React, { useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { SpectatorHero } from './SpectatorHero';
import { SpectatorShowcase } from './SpectatorShowcase';
import { SpectatorOnboardingBanner } from './SpectatorOnboardingBanner';
import { SpectatorFooter } from './SpectatorFooter';
import './SpectatorHome.css';

export const SpectatorHome = ({ 
  onExploreStore, 
  onOpenAuthModal,
  activeShowcaseTab = 'residents',
  onSelectShowcaseTab
}) => {
  const { setViewMode, currentUser } = useStore();

  const handleAuthAction = () => {
    if (currentUser) {
      setViewMode('admin');
    } else if (onOpenAuthModal) {
      onOpenAuthModal();
    }
  };

  const heroRef = useRef(null);
  const showcaseRef = useRef(null);
  const onboardingRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const sections = [
      heroRef.current,
      showcaseRef.current,
      onboardingRef.current,
      footerRef.current
    ].filter(Boolean);

    // IntersectionObserver seguro: añade visibilidad suave sin ocultar contenido
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.01,
        rootMargin: '50px 0px 50px 0px'
      }
    );

    sections.forEach((sec) => {
      sec.classList.add('is-visible');
      observer.observe(sec);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="spectator-page-wrapper w-full">
      {/* 1. SECCIÓN HERO & CARRUSEL (Fondo 1: Blanco Puro con Luces Ambientales Esmeralda) */}
      <section 
        id="section-hero" 
        ref={heroRef}
        className="spectator-section spectator-section-hero is-visible spectator-scroll-reveal w-full"
      >
        <SpectatorHero
          onExploreStore={onExploreStore}
          onScrollToAuth={handleAuthAction}
        />
        {/* Divisor sutil de transición */}
        <div className="spectator-transition-seam" />
      </section>

      {/* 2. SECCIÓN SHOWCASE INTERACTIVO 3D (Fondo 2: Slate Claro Perlado con Malla Tecnológica) */}
      <section 
        id="section-showcase" 
        ref={showcaseRef}
        className="spectator-section spectator-section-showcase is-visible spectator-scroll-reveal w-full scroll-mt-20"
      >
        <SpectatorShowcase
          activeTab={activeShowcaseTab}
          onTabChange={onSelectShowcaseTab}
          onExploreStore={onExploreStore}
          onGoToMerchant={handleAuthAction}
        />
        {/* Divisor sutil de transición */}
        <div className="spectator-transition-seam" />
      </section>

      {/* 3. SECCIÓN ONBOARDING & CONVERSIÓN (Fondo 3: Menta Esmeralda Luminosa) */}
      <section 
        id="section-onboarding" 
        ref={onboardingRef}
        className="spectator-section spectator-section-onboarding is-visible spectator-scroll-reveal w-full"
      >
        <SpectatorOnboardingBanner
          onExploreStore={onExploreStore}
          onScrollToAuth={handleAuthAction}
        />
        {/* Divisor sutil de transición hacia el footer */}
        <div className="spectator-transition-seam dark-seam" />
      </section>

      {/* 4. SECCIÓN FOOTER PROFESIONAL (Fondo 4: Midnight Slate Oscuro de Alto Rendimiento) */}
      <section 
        id="section-footer" 
        ref={footerRef}
        className="spectator-section spectator-section-footer is-visible spectator-scroll-reveal w-full"
      >
        <SpectatorFooter
          onExploreStore={onExploreStore}
          onScrollToAuth={handleAuthAction}
          onGoToAdmin={handleAuthAction}
        />
      </section>
    </div>
  );
};
