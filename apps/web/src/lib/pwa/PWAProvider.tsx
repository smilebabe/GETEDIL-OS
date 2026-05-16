import { useEffect, useState } from 'react';
import { registerServiceWorker, subscribeToOfflineStatus, isOnline } from '.';

/**
 * PWA Provider Component
 * Initializes service worker and provides offline status to the app
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Subscribe to online/offline status
    const unsubscribe = subscribeToOfflineStatus((status) => {
      setOnline(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      {!online && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-center z-50">
          You are currently offline. Some features may be limited.
        </div>
      )}
      {children}
    </>
  );
}

export { registerServiceWorker, isOnline, subscribeToOfflineStatus };
