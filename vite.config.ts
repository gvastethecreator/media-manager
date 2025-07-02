import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

const emptyModule = resolve(__dirname, 'src/empty.ts');

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
                                },
                        },
                        // Evitar que Rollup intente resolver dependencias de Node.js
                        external: ['fs', 'fs/promises', 'path', 'crypto', 'sharp'],
                },
        },
	define: {
		// Definir variables de entorno para el cliente
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
	},
        optimizeDeps: {
                // Evitar que Vite intente bundlear módulos de Node.js
                exclude: ['fs', 'fs/promises', 'path', 'crypto', 'sharp'],
                include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'motion'],
        },
        resolve: {
                alias: [
                        // Alias para módulos de Node.js que no deben incluirse en el bundle del cliente
                        { find: 'fs/promises', replacement: emptyModule },
                        { find: 'fs', replacement: emptyModule },
                        { find: 'path', replacement: emptyModule },
                        { find: 'crypto', replacement: emptyModule },
                        { find: 'sharp', replacement: emptyModule },
                ],
        },
});
