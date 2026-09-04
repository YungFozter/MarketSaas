import React from 'react';
import { useStore } from '../../context/StoreContext';
import { SpectatorHero } from './SpectatorHero';
import { SpectatorShowcase } from './SpectatorShowcase';
import { SpectatorOnboardingBanner } from './SpectatorOnboardingBanner';
import { SpectatorAuthPanel } from './SpectatorAuthPanel';
import { SpectatorFooter } from './SpectatorFooter';
import './SpectatorHome.css';

export const SpectatorHome = ({ onExploreStore, onOpenAuthModal }) => {
  const { setViewMode, currentUser } = useStore();

  const handleScrollToAuth = () => {
    const el = document.getElementById('panel-acceso');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (onOpenAuthModal) {
      onOpenAuthModal();
    }
  };

  const handleGoToMerchant = () => {
    if (currentUser) {
      setViewMode('admin');
    } else {
      handleScrollToAuth();
    }
  };

  return (
    <div className="spectator-page-wrapper w-full">
      {/* 1. Hero Section con gradientes y métricas ticker */}
      <SpectatorHero
        onExploreStore={onExploreStore}
        onScrollToAuth={handleScrollToAuth}
      />

      {/* 2. Demostrador interactivo en 3 dimensiones (Residentes, Comerciantes, Condominios) */}
      <SpectatorShowcase
        onExploreStore={onExploreStore}
        onGoToMerchant={handleGoToMerchant}
      />

      {/* 3. Banner de conversión rápida Onboarding */}
      <SpectatorOnboardingBanner
        onExploreStore={onExploreStore}
        onScrollToAuth={handleScrollToAuth}
      />

      {/* 4. Panel de Acceso Integrado (Login / Registro 2 pasos) */}
      <SpectatorAuthPanel
        onExploreStore={onExploreStore}
      />

      {/* 5. Footer profesional de plataforma */}
      <SpectatorFooter
        onExploreStore={onExploreStore}
        onScrollToAuth={handleScrollToAuth}
        onGoToAdmin={handleGoToMerchant}
      />
    </div>
  );
};
