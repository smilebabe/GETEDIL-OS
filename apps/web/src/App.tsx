import React from 'react';
import { InstallPrompt } from './components/InstallPrompt';
import { PushNotificationSettings } from './components/PushNotificationSettings';

// Replace with your actual VAPID public key generated via 'npx web-push generate-vapid-keys'
const VAPID_PUBLIC_KEY = 'BEfCob16WENoZIbYf6j34K9wlWZBcyYiI6Ue9pvnqIk1pr9NMouZxoeC1et7yJMmfTO-jbSXPQiIEMysc29rJ3s';

/**
 * Main Application Component
 * Includes PWA install prompt and push notification settings
 */
export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Install Prompt Component - Shows when user can install PWA */}
      <InstallPrompt 
        onInstall={() => console.log('PWA installed successfully')}
        onDismiss={() => console.log('Install prompt dismissed')}
      />
      
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">GETEDIL</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <p className="text-gray-600">
              Welcome to GETEDIL - Your Progressive Web Application
            </p>
            
            {/* Push Notification Settings */}
            <div style={{ marginTop: '40px', maxWidth: '500px' }}>
              <PushNotificationSettings vapidPublicKey={VAPID_PUBLIC_KEY} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
