import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

const emptyModule = resolve(__dirname, 'src/empty.ts');

export default defineConfig({
	plugins: [
		react({
			// Optimización para Bun: usar SWC en lugar de Babel cuando sea posible
			jsxRuntime: 'automatic',
			babel: {
				parserOpts: {
					plugins: ['decorators-legacy']
				}
			}
		}),
		tsconfigPaths({
			ignoreConfigErrors: true,
		}),
		svgr({
			svgrOptions: {
				icon: true,
			},
		}),
	],
	esbuild: {
		// Optimización para Bun: target más moderno
		target: 'esnext',
		// Mejorar performance de transformación
		minifyIdentifiers: false,
		minifySyntax: true,
		minifyWhitespace: true,
		// Optimizar para desarrollo
		drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
	},
	server: {
		port: 5173,
		host: true,
		// Optimización HMR para Bun
		hmr: {
			port: 5175,
			// Mejorar compatibilidad con Bun
			clientPort: 5175,
			host: 'localhost'
		},
		// Configuración adicional para mejorar compatibilidad con Bun
		middlewareMode: false,
		fs: {
			strict: false,
			// Permitir acceso a archivos fuera del workspace
			allow: ['..', '../..'],
		},
		// Optimización de proxy para mejor rendimiento
		proxy: {
			'/api': {
				target: 'http://localhost:4000',
				changeOrigin: true,
				secure: false,
				// Optimizaciones de proxy
				timeout: 30000,
				proxyTimeout: 30000,
				keepalive: true,
			},
		},
		// Optimización de watch para Bun
		watch: {
			usePolling: false,
			ignored: ['**/node_modules/**', '**/dist/**', '**/logs/**'],
		},
	},
	preview: {
		port: 4173,
	},
	build: {
		// Optimizaciones de build para Bun
		target: 'esnext',
		sourcemap: true,
		// Optimizar chunks para mejor carga
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				// Optimización de chunks más granular
				manualChunks: {
					react: ['react', 'react-dom'],
					router: ['react-router-dom'],
					query: ['@tanstack/react-query'],
					ui: ['framer-motion', 'motion', 'lucide-react'],
					vendor: ['zustand', 'lodash', 'date-fns'],
					utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
				},
				// Optimizar nombres de archivos
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]',
			},
			// Evitar que Rollup intente resolver dependencias de Node.js
			external: ['fs', 'fs/promises', 'path', 'crypto', 'sharp', 'http'],
			// Optimizaciones de tree-shaking
			treeshake: {
				preset: 'recommended',
				manualPureFunctions: ['console.log', 'console.info'],
			},
		},
		// Optimización de minificación
		minify: 'esbuild',
		// Optimizar assets
		assetsInlineLimit: 4096,
		// Optimización de CSS
		cssCodeSplit: true,
		cssMinify: true,
	},
	define: {
		// Definir variables de entorno para el cliente
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		// Optimización: definir variables en tiempo de build
		'__DEV__': process.env.NODE_ENV !== 'production',
		'__PROD__': process.env.NODE_ENV === 'production',
	},
	optimizeDeps: {
		// Optimización de dependencias para Bun
		exclude: [
			// Excluir módulos de Node.js
			'fs', 'fs/promises', 'path', 'crypto', 'sharp', 'http',
			// Excluir dependencias que causan problemas
			'@tauri-apps/api'
		],
		include: [
			// Pre-bundlear dependencias críticas
			'react', 'react-dom', 'react-router-dom',
			'framer-motion', 'motion',
			'@tanstack/react-query',
			'zustand',
			'lucide-react',
			'lodash',
			'date-fns',
			'clsx',
			'tailwind-merge'
		],
		// Optimización de ESBuild para dependencias
		esbuildOptions: {
			target: 'esnext',
			platform: 'browser',
			mainFields: ['browser', 'module', 'main'],
			conditions: ['browser', 'module', 'import'],
		},
		// Forzar re-optimización en desarrollo
		force: process.env.NODE_ENV === 'development',
	},
	resolve: {
		alias: [
			// Alias para módulos de Node.js que no deben incluirse en el bundle del cliente
			{ find: 'fs/promises', replacement: emptyModule },
			{ find: 'fs', replacement: emptyModule },
			{ find: 'path', replacement: emptyModule },
			{ find: 'crypto', replacement: emptyModule },
			{ find: 'sharp', replacement: emptyModule },
			{ find: 'http', replacement: emptyModule },
		],
		// Optimización de resolución de módulos
		mainFields: ['browser', 'module', 'main'],
		conditions: ['browser', 'module', 'import'],
		extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
	},
	// Configuración específica para Bun
	worker: {
		format: 'es',
		plugins: [react()],
	},
	// Optimización de logs
	logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
	clearScreen: false,
});
