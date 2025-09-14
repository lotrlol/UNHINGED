// This file handles the service worker registration and update flow

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('ServiceWorker registration successful');
          
          // Check for updates every hour
          setInterval(() => {
            registration.update().catch(err => 
              console.log('Error checking for service worker update:', err)
            );
          }, 60 * 60 * 1000);
        },
        (err) => {
          console.log('ServiceWorker registration failed: ', err);
        }
      );
    });
  }
}

// Function to handle the app update flow
export function handleAppUpdate(registration: ServiceWorkerRegistration) {
  if (registration.waiting) {
    // Service worker is waiting to activate
    if (confirm('A new version is available! Would you like to update?')) {
      // Send message to the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Listen for the service worker to be updated
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Function to check for updates
let updateCheckInterval: NodeJS.Timeout;

export function startUpdateCheck(intervalMinutes = 60) {
  if ('serviceWorker' in navigator) {
    // Initial check
    checkForUpdates();
    
    // Set up periodic checks
    updateCheckInterval = setInterval(checkForUpdates, intervalMinutes * 60 * 1000);
  }
}

export function stopUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
}

async function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  }
}
