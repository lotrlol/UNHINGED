import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'framer-motion',
      '@tailwindcss/forms'
    ],
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      'framer-motion': 'framer-motion/dist/framer-motion',
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
});
