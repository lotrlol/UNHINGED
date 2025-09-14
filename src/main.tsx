import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { register } from './serviceWorkerRegistration';
import './index.css';

// PWA types
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
  
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Initialize PWA
function initializePWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    register();
  }
  
  // Handle installation prompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    const beforeInstallPrompt = e as BeforeInstallPromptEvent;
    window.deferredPrompt = beforeInstallPrompt;
    console.log('PWA installation available');
    
    // Dispatch custom event for UI to show install button
    document.dispatchEvent(new CustomEvent('pwa:installable', { 
      detail: { prompt: beforeInstallPrompt } 
    }));
  });
  
  // Track successful installation
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    window.deferredPrompt = null;
    document.dispatchEvent(new Event('pwa:installed'));
  });
}

// Initialize the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  
  // Initialize PWA
  initializePWA();
  
  // Render the app
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
