import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log environment variables for debugging
  console.log('Vite Env Mode:', mode);
  console.log('Vite Env Variables:', {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL ? 'Set' : 'Not Set',
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set'
  });

  return {
    define: {
      'process.env': { ...env, VITE_MODE: `"${mode}"` },
      __APP_ENV__: env.APP_ENV,
    },
    plugins: [react()],
    optimizeDeps: {
      include: ['@tailwindcss/forms'],
      exclude: ['lucide-react'],
    },
    server: {
      watch: {
        usePolling: true,
      },
    },
    build: {
      commonjsOptions: {
        include: [/node_modules/],
        extensions: ['.js', '.cjs'],
        strictRequires: true,
        transformMixedEsModules: true,
      },
    },
  };
});
