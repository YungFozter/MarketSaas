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

    // Rastreo continuo de la dirección de scroll (subiendo vs bajando)
    let lastScrollY = window.scrollY;
    let scrollDirection = 'down';

    const handleScrollDirection = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        scrollDirection = 'down';
      } else if (currentScrollY < lastScrollY) {
        scrollDirection = 'up';
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScrollDirection, { passive: true });

    // IntersectionObserver continuo: se activa tanto al entrar como al salir
    // para repetir las transiciones fluidas en todo momento al subir o bajar
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Aplicar clase direccional según el sentido del scroll
            if (scrollDirection === 'down') {
              entry.target.classList.remove('reveal-from-top');
              entry.target.classList.add('reveal-from-bottom');
            } else {
              entry.target.classList.remove('reveal-from-bottom');
              entry.target.classList.add('reveal-from-top');
            }
            entry.target.classList.add('is-visible');
          } else {
            // Al salir completamente del viewport, retirar visibilidad para reiniciar
            // la animación la próxima vez que el usuario regrese navegando
            entry.target.classList.remove('is-visible');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px'
      }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      window.removeEventListener('scroll', handleScrollDirection);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="spectator-page-wrapper w-full">
      {/* 1. SECCIÓN HERO & CARRUSEL (Fondo 1: Blanco Puro con Luces Ambientales Esmeralda) */}
      <section 
        id="section-hero" 
        ref={heroRef}
        className="spectator-section spectator-section-hero is-visible spectator-scroll-reveal reveal-from-bottom w-full"
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
        className="spectator-section spectator-section-showcase spectator-scroll-reveal reveal-from-bottom w-full scroll-mt-20"
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
        className="spectator-section spectator-section-onboarding spectator-scroll-reveal reveal-from-bottom w-full"
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
        className="spectator-section spectator-section-footer spectator-scroll-reveal reveal-from-bottom w-full"
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
