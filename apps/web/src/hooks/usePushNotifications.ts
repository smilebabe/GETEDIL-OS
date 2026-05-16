import { useEffect, useState } from 'react';

interface PushNotificationManagerOptions {
  vapidPublicKey: string;
  onSubscriptionChange?: (subscribed: boolean) => void;
  onError?: (error: Error) => void;
}

export class PushNotificationManager {
  private vapidPublicKey: string;
  private onSubscriptionChange?: (subscribed: boolean) => void;
  private onError?: (error: Error) => void;

  constructor(options: PushNotificationManagerOptions) {
    this.vapidPublicKey = options.vapidPublicKey;
    this.onSubscriptionChange = options.onSubscriptionChange;
    this.onError = options.onError;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return permission;
    }

    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    try {
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        return null;
      }

      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported');
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      // Send subscription to your backend
      await this.sendSubscriptionToBackend(subscription);

      this.onSubscriptionChange?.(true);
      
      return subscription;
    } catch (error) {
      this.onError?.(error as Error);
      console.error('Failed to subscribe for push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return false;
      }

      const success = await subscription.unsubscribe();
      
      if (success) {
        // Notify backend to remove subscription
        await this.removeSubscriptionFromBackend(subscription);
        this.onSubscriptionChange?.(false);
      }

      return success;
    } catch (error) {
      this.onError?.(error as Error);
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  async getSubscriptionStatus(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      return subscription !== null;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return false;
    }
  }

  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    // TODO: Implement backend API call to save subscription
    // Example:
    // await fetch('/api/notifications/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription),
    // });
    console.log('Subscription saved:', subscription);
  }

  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    // TODO: Implement backend API call to remove subscription
    // Example:
    // await fetch('/api/notifications/unsubscribe', {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription),
    // });
    console.log('Subscription removed:', subscription);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// React Hook for managing push notifications
export function usePushNotifications(vapidPublicKey: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        const manager = new PushNotificationManager({
          vapidPublicKey,
          onSubscriptionChange: setIsSubscribed,
        });
        
        const subscribed = await manager.getSubscriptionStatus();
        setIsSubscribed(subscribed);
      }
    };

    checkSupport();
  }, [vapidPublicKey]);

  const subscribe = async () => {
    setLoading(true);
    setError(null);

    const manager = new PushNotificationManager({
      vapidPublicKey,
      onSubscriptionChange: setIsSubscribed,
      onError: setError,
    });

    await manager.subscribe();
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    setError(null);

    const manager = new PushNotificationManager({
      vapidPublicKey,
      onSubscriptionChange: setIsSubscribed,
      onError: setError,
    });

    await manager.unsubscribe();
    setLoading(false);
  };

  return {
    isSupported,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  };
}

export default PushNotificationManager;
