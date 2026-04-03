import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext', // Required for top-level await in some AI/Wasm libs
    sourcemap: false,
    rollupOptions: {
      output: {
        /**
         * Advanced Chunking Strategy for GETEDIL-OS
         * Purpose: Isolate heavy modules from the critical rendering path of core pillars.
         */
        manualChunks(id) {
          // 1. Isolate ONNX Runtime and Edge-Brain AI logic
          if (id.includes('onnxruntime-web') || id.includes('edge-brain.js')) {
            return 'vendor-ai-engine';
          }

          // 2. Isolate Video Feed Engine and heavy playback libs
          if (id.includes('video-feed-engine') || id.includes('hls.js')) {
            return 'vendor-video-core';
          }

          // 3. Isolate Supabase and Auth logic
          if (id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase';
          }

          // 4. Group UI Framework Core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react-core';
          }

          // 5. Separate 27 Pillars into their own chunk groups if not dynamically imported
          // Note: This is a fallback; dynamic imports (import()) are still preferred.
          if (id.includes('src/pillars/')) {
            const pillarName = id.split('src/pillars/')[1].split('/')[0];
            return `pillar-${pillarName.toLowerCase()}`;
          }
        },
        
        // Clean up asset naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Prevent small chunks from being inlined as base64
    assetsInlineLimit: 4096, 
  },
});
