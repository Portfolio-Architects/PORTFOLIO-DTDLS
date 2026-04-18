'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// BeforeInstallPromptEvent type declaration
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isInstallable: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  triggerA2HSPrompt: () => Promise<boolean>;
  showCustomA2HSModal: boolean;
  setShowCustomA2HSModal: (show: boolean) => void;
  triggerCustomA2HSModal: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  deferredPrompt: null,
  triggerA2HSPrompt: async () => false,
  showCustomA2HSModal: false,
  setShowCustomA2HSModal: () => {},
  triggerCustomA2HSModal: () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showCustomA2HSModal, setShowCustomA2HSModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If the app is already installed, we shouldn't show the prompt
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowCustomA2HSModal(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerA2HSPrompt = async () => {
    if (!deferredPrompt) return false;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }
    return false;
  };

  const triggerCustomA2HSModal = () => {
    // Only show if we actually caught the beforeinstallprompt
    if (isInstallable && deferredPrompt) {
      setShowCustomA2HSModal(true);
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        deferredPrompt,
        triggerA2HSPrompt,
        showCustomA2HSModal,
        setShowCustomA2HSModal,
        triggerCustomA2HSModal,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
