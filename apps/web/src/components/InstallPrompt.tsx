import React, { useState, useEffect } from 'react';

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPromptEvent = e as any;
      setDeferredPrompt(beforeInstallPromptEvent);
      
      // Check if user hasn't dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      onInstall?.();
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
      setShowPrompt(false);
      onDismiss?.();
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
    onDismiss?.();
  };

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#1a1a2e',
      color: '#ffffff',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 9999,
      maxWidth: '90%',
      width: '400px',
      border: '1px solid #16213e'
    }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
          Install GETEDIL
        </h3>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
          Add to your home screen for quick access and offline support
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleDismiss}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#ffffff',
            cursor: 'pointer',
            borderRadius: '6px',
            fontSize: '14px',
            opacity: 0.7
          }}
        >
          Later
        </button>
        <button
          onClick={handleInstallClick}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: '#0f3460',
            color: '#ffffff',
            cursor: 'pointer',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
