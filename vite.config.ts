import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendor: ['@tanstack/react-query', 'zustand'],
          ui: ['@radix-ui/react-label', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  define: {
    // Definir variables de entorno para el cliente
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  optimizeDeps: {
    exclude: ['fs', 'path', 'crypto', 'sharp'], // Excluir módulos de Node.js
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-label',
      '@radix-ui/react-dialog',
      'framer-motion',
      'motion',
    ],
  },
  resolve: {
    alias: {
      // Alias para módulos de Node.js que no deberían ejecutarse en el cliente
      fs: false,
      path: false,
      crypto: false,
      sharp: false,
    },
  },
});