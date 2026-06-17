/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
  // Use the automatic JSX runtime in tests too (source files don't import React).
  esbuild: { jsx: 'automatic' },
  build: {
    // Split large, rarely-changing vendor libs into their own chunks so the
    // browser caches them across deploys (app code changes don't bust them).
    rollupOptions: {
      output: {
        // rolldown (Vite 8) expects a function form.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('/d3-')) return 'charts';
          if (id.includes('framer-motion')) return 'motion';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react-vendor';
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5173,
    hmr: {
      clientPort: 5173,
      host: 'localhost',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
