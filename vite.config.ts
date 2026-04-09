import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2015',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'framer-motion'],
          charts: ['recharts'],
        }
      }
    }
  },
  server: {
    // Conditional HMR — works in both AI Studio and local dev (Bug N-060)
    ...(process.env.VITE_AI_STUDIO ? {
      hmr: { clientPort: 443, protocol: 'wss' }
    } : {})
  }
});
