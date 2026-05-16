import React, { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface PushNotificationSettingsProps {
  vapidPublicKey: string;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ vapidPublicKey }) => {
  const { isSupported, isSubscribed, loading, error, subscribe, unsubscribe } = usePushNotifications(vapidPublicKey);
  const [showError, setShowError] = useState(false);

  const handleToggle = async () => {
    setShowError(false);
    
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#16213e',
        borderRadius: '8px',
        border: '1px solid #0f3460'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
          Push Notifications
        </h3>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
          Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#16213e',
      borderRadius: '8px',
      border: '1px solid #0f3460'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
            Push Notifications
          </h3>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
            {isSubscribed 
              ? 'You will receive notifications' 
              : 'Enable to receive important updates'}
          </p>
          {error && showError && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#e94560' }}>
              {error.message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: isSubscribed ? '#e94560' : '#0f3460',
            color: '#ffffff',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
            transition: 'background-color 0.2s',
            minWidth: '100px'
          }}
        >
          {loading 
            ? 'Processing...' 
            : isSubscribed 
              ? 'Disable' 
              : 'Enable'}
        </button>
      </div>
    </div>
  );
};

export default PushNotificationSettings;
