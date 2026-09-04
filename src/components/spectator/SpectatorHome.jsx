import React from 'react';
import { useStore } from '../../context/StoreContext';
import { SpectatorHero } from './SpectatorHero';
import { SpectatorShowcase } from './SpectatorShowcase';
import { SpectatorOnboardingBanner } from './SpectatorOnboardingBanner';
import { SpectatorFooter } from './SpectatorFooter';
import './SpectatorHome.css';

export const SpectatorHome = ({ onExploreStore, onOpenAuthModal }) => {
  const { setViewMode, currentUser } = useStore();

  const handleAuthAction = () => {
    if (currentUser) {
      setViewMode('admin');
    } else if (onOpenAuthModal) {
      onOpenAuthModal();
    }
  };

  return (
    <div className="spectator-page-wrapper w-full">
      {/* 1. Hero Section con gradientes y carrusel de descripciones */}
      <SpectatorHero
        onExploreStore={onExploreStore}
        onScrollToAuth={handleAuthAction}
      />

      {/* 2. Demostrador interactivo en 3 dimensiones (Residentes, Comerciantes, Condominios) */}
      <SpectatorShowcase
        onExploreStore={onExploreStore}
        onGoToMerchant={handleAuthAction}
      />

      {/* 3. Banner de conversión rápida Onboarding */}
      <SpectatorOnboardingBanner
        onExploreStore={onExploreStore}
        onScrollToAuth={handleAuthAction}
      />

      {/* 4. Footer profesional de plataforma */}
      <SpectatorFooter
        onExploreStore={onExploreStore}
        onScrollToAuth={handleAuthAction}
        onGoToAdmin={handleAuthAction}
      />
    </div>
  );
};
