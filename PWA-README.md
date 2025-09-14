# UNHINGED - Progressive Web App (PWA)

This document provides information about the PWA features of the UNHINGED application and how to work with them.

## PWA Features

- **Offline Support**: The app can work offline by caching important assets and data.
- **Installable**: Users can install the app on their devices for quick access.
- **Push Notifications**: Real-time notifications for important updates.
- **App-like Experience**: Full-screen, standalone mode for an immersive experience.
- **Fast Loading**: Service worker caches resources for faster loading times.

## Development

### Testing PWA Features

1. **Development Mode**:
   - PWA is enabled in development mode for testing.
   - Service worker runs in development mode to test offline functionality.

2. **Browser DevTools**:
   - Use the **Application** tab to inspect:
     - Service Workers
     - Cache Storage
     - Manifest
     - Local/Session Storage

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## PWA Configuration

### Service Worker

- Located at: `/public/sw.js`
- Handles:
  - Asset caching
  - Offline support
  - Push notifications

### Web App Manifest

- Located at: `/public/manifest.json`
- Configures:
  - App name and icons
  - Display mode
  - Theme colors
  - Start URL and scope

## Testing Installation

1. Build the application:
   ```bash
   npm run build
   ```

2. Serve the built files using a local server:
   ```bash
   npx serve -s dist
   ```

3. Open Chrome DevTools and go to the **Application** tab.
4. Check the **Service Workers** and **Manifest** sections.
5. In Chrome, look for the install icon in the address bar or the "Add to Home Screen" prompt.

## Debugging

- **Service Worker Issues**:
  - Check the **Service Workers** section in Chrome DevTools
  - Check the **Console** for any errors
  - Use `navigator.serviceWorker.controller` in the console to check the active service worker

- **Cache Issues**:
  - Clear site data in Chrome DevTools > Application > Clear storage
  - Unregister service workers in Chrome DevTools > Application > Service Workers

## Best Practices

1. **Cache Strategy**:
   - Static assets use CacheFirst strategy
   - API calls use NetworkFirst with cache fallback

2. **Updates**:
   - The app checks for updates on each load
   - Users are prompted to refresh when a new version is available

3. **Performance**:
   - Assets are precached during installation
   - Lazy loading is used for non-critical components

## Deployment

When deploying to production, ensure:

1. The `manifest.json` has the correct `start_url` and `scope`
2. The service worker is properly registered in `main.tsx`
3. All required assets are included in the precache manifest
4. HTTPS is enabled (required for service workers and PWA features)

## Troubleshooting

- **App not installing**:
  - Ensure all required icons are present
  - Check the manifest for errors
  - Verify the service worker is properly registered

- **Offline not working**:
  - Check the service worker registration
  - Verify assets are being cached
  - Check the Cache Storage in DevTools

For more information, refer to the [Web App Manifest](https://web.dev/add-manifest/) and [Service Workers](https://developers.google.com/web/fundamentals/primers/service-workers) documentation.
