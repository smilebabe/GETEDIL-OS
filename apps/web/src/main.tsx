import React from 'react';
import ReactDOM from 'react-dom/client';
import { PWAProvider } from './lib/pwa';
import App from './App';

/**
 * Main Application Entry Point
 * Wraps the application with PWAProvider for service worker and offline support
 */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PWAProvider>
      <App />
    </PWAProvider>
  </React.StrictMode>
);
