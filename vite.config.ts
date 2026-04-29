import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          three: ['three', '@react-three/fiber'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          gsap: ['gsap'],
          motion: ['motion', 'framer-motion'],
          genai: ['@google/genai'],
          recharts: ['recharts'],
          icons: ['lucide-react', '@phosphor-icons/react'],
          pdf: ['react-pdf'],
          mammoth: ['mammoth'],
          dnd: ['@hello-pangea/dnd'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
