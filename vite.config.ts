import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// Load environment variables manually
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env file if it exists
if (fs.existsSync('.env')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

export default defineConfig(({ mode }) => {
  // Load all environment variables
  const env = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), '')
  };
  
  // Required environment variables
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(varName => !env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing required environment variables:', missingVars.join(', '));
    console.warn('Current working directory:', process.cwd());
    console.warn('Environment file exists:', fs.existsSync('.env') ? 'Yes' : 'No');
    console.warn('Environment file content:', fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : 'Not found');
  } else {
    console.log('✅ All required environment variables are set');
    console.log('Supabase URL:', env.VITE_SUPABASE_URL ? 'Set' : 'Not Set');
    console.log('Supabase Key:', env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');
  }

  // Expose environment variables to the client
  const envWithProcess = {
    'process.env': {
      ...Object.entries(env).reduce((prev, [key, val]) => {
        if (key.startsWith('VITE_')) {
          return { ...prev, [key]: `"${val}"` };
        }
        return prev;
      }, {}),
      VITE_MODE: `"${mode}"`
    },
    __APP_ENV__: env.APP_ENV,
  };

  return {
    define: envWithProcess,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'robots.txt', 'safari-pinned-tab.svg'],
        // Disable the default service worker generation
        injectRegister: 'auto',
        workbox: {
          sourcemap: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
        manifest: {
          name: 'UNHINGED',
          short_name: 'UNHINGED',
          description: 'The ultimate creator collaboration platform',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
          ],
        },
        devOptions: {
          enabled: true, // Enable PWA in development for testing
          type: 'module',
          navigateFallback: 'index.html',
        },
        // Enable PWA features
        includeManifestIcons: true,
        disable: false,
        // Using generateSW strategy with custom configuration
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      include: ['@tailwindcss/forms', 'lucide-react'],
      exclude: [],
    },
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      watch: {
        usePolling: true,
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: 'terser',
      commonjsOptions: {
        include: [/node_modules/, /public/],
        extensions: ['.js', '.cjs', '.mjs'],
        strictRequires: true,
        transformMixedEsModules: true,
      },
    },
  };
});
