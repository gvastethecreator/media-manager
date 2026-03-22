import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite-plus';
import svgr from 'vite-plugin-svgr';

const emptyModule = resolve(import.meta.dirname, 'src/config/empty.ts');
function getManualChunkName(id: string) {
	if (!id.includes('node_modules')) {
		return undefined;
	}

	const matchesPackage = (pkg: string) =>
		id.includes(`/node_modules/${pkg}/`) || id.includes(`\\node_modules\\${pkg}\\`);

	if (matchesPackage('react') || matchesPackage('react-dom')) return 'react';
	if (matchesPackage('react-router-dom')) return 'router';
	if (matchesPackage('@tanstack/react-query')) return 'query';
	if (matchesPackage('gsap') || matchesPackage('lucide-react')) return 'ui';
	if (matchesPackage('zustand') || matchesPackage('lodash') || matchesPackage('date-fns')) return 'vendor';
	if (matchesPackage('clsx') || matchesPackage('tailwind-merge') || matchesPackage('class-variance-authority'))
		return 'utils';

	return undefined;
}

const toolingIgnorePatterns = [
	'node_modules/**',
	'dist/**',
	'build/**',
	'coverage/**',
	'out/**',
	'.vercel/**',
	'.cache/**',
	'.image-cache/**',
	'.thumbnail-cache/**',
	'public/assets/**',
	'.env',
	'.env.*',
	'*.log',
	'*.lock',
	'*.d.ts',
	'*.tsbuildinfo',
	'*.sqlite',
	'*.sqlite3',
	'*.sqlite-journal',
	'.vscode/**',
	'src/components/features/file-browser/file-browser-backup.tsx',
	'**/*.backup.*',
];

export default defineConfig({
	plugins: [
		react({
			jsxRuntime: 'automatic',
		}),
		svgr({
			svgrOptions: {
				icon: true,
			},
		}),
	],
	server: {
		port: 5173,
		host: true,
		// Optimizaci?n HMR para Bun
		hmr: {
			port: 5175,
			// Mejorar compatibilidad con Bun
			clientPort: 5175,
			host: 'localhost',
		},
		// Configuraci?n adicional para mejorar compatibilidad con Bun
		middlewareMode: false,
		fs: {
			strict: false,
			// Permitir acceso a archivos fuera del workspace
			allow: ['..', '../..'],
		},
		// Optimizaci?n de proxy para mejor rendimiento
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:4000',
				changeOrigin: true,
				secure: false,
				// Optimizaciones de proxy
				timeout: 30_000,
				proxyTimeout: 30_000,
			},
		},
		// Optimizaci?n de watch para Bun
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
				manualChunks: getManualChunkName,
				// Optimizar nombres de archivos
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]',
			},
			// Evitar que Rollup intente resolver dependencias de Node.js
			external: ['fs', 'fs/promises', 'path', 'crypto', 'sharp', 'http'],
		},
		// Optimizaci?n de minificaci?n
		minify: 'esbuild',
		// Optimizar assets
		assetsInlineLimit: 4096,
		// Optimizaci?n de CSS
		cssCodeSplit: true,
		cssMinify: true,
	},
	define: {
		// Definir variables de entorno para el cliente
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		// Optimizaci?n: definir variables en tiempo de build
		__DEV__: process.env.NODE_ENV !== 'production',
		__PROD__: process.env.NODE_ENV === 'production',
	},
	optimizeDeps: {
		// Optimizaci?n de dependencias para Bun
		exclude: [
			// Excluir m?dulos de Node.js
			'fs',
			'fs/promises',
			'path',
			'crypto',
			'sharp',
			'http',
			// Excluir dependencias que causan problemas
			'@tauri-apps/api',
		],
		include: [
			// Pre-bundlear dependencias críticas
			'react',
			'react-dom',
			'react-router-dom',
			'gsap',
			'@gsap/react',
			'@tanstack/react-query',
			'zustand',
			'lucide-react',
			'lodash',
			'date-fns',
			'clsx',
			'tailwind-merge',
		],
		// Forzar re-optimizaci?n en desarrollo
		force: process.env.NODE_ENV === 'development',
	},
	resolve: {
		alias: [
			// Alias para m?dulos de Node.js que no deben incluirse en el bundle del cliente
			{ find: 'fs/promises', replacement: emptyModule },
			{ find: 'fs', replacement: emptyModule },
			{ find: 'path', replacement: emptyModule },
			{ find: 'crypto', replacement: emptyModule },
			{ find: 'sharp', replacement: emptyModule },
			{ find: 'http', replacement: emptyModule },
		],
		// Optimizaci?n de resoluci?n de m?dulos
		mainFields: ['browser', 'module', 'main'],
		conditions: ['browser', 'module', 'import'],
		extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
	},
	// Configuraci?n espec?fica para Bun
	worker: {
		format: 'es',
		plugins: () => [react()],
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts'],
		exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**', '**/*.e2e.spec.ts'],
		include: [
			'src/**/*.{test,spec}.{ts,tsx}',
			'tests/unit/**/*.{test,spec}.{ts,tsx}',
			'tests/integration/**/*.{test,spec}.{ts,tsx}',
		],
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: './coverage',
			exclude: ['node_modules/**', 'dist/**', 'tests/**', '**/*.d.ts', '**/*.config.*', 'src-tauri/**', 'scripts/**'],
			thresholds: {
				statements: 50,
			},
		},
		testTimeout: 30_000,
		hookTimeout: 30_000,
		fileParallelism: false,
		maxWorkers: 1,
		minWorkers: 1,
		pool: 'forks',
		isolate: true,
		reporters: ['default'],
		silent: false,
	},
	lint: {
		ignorePatterns: toolingIgnorePatterns,
		plugins: ['typescript', 'react', 'vitest', 'jsx-a11y', 'import', 'promise', 'node'],
		env: {
			browser: true,
			node: true,
			es6: true,
		},
		settings: {
			react: {
				version: '19.2.4',
			},
			vitest: {
				typecheck: false,
			},
		},
		rules: {
			'no-console': 'off',
			'no-debugger': 'error',
			'no-unused-vars': 'off',
			eqeqeq: 'off',
			'no-unused-expressions': 'off',
			'no-control-regex': 'off',
			'require-yield': 'off',
			'react/react-in-jsx-scope': 'off',
			'react/jsx-uses-react': 'off',
			'react/prop-types': 'off',
			'react/no-unescaped-entities': 'off',
			'react-hooks/exhaustive-deps': 'off',
			'jsx-a11y/alt-text': 'off',
			'jsx-a11y/anchor-has-content': 'off',
			'jsx-a11y/click-events-have-key-events': 'off',
			'jsx-a11y/heading-has-content': 'off',
			'jsx-a11y/media-has-caption': 'off',
			'jsx-a11y/no-autofocus': 'off',
			'jsx-a11y/no-static-element-interactions': 'off',
			'jsx-a11y/prefer-tag-over-role': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-empty-interface': 'off',
			'import/no-cycle': 'off',
			'import/namespace': 'off',
			'jest/expect-expect': 'off',
			'jest/no-conditional-expect': 'off',
			'jest/require-to-throw-message': 'off',
			'promise/prefer-await-to-then': 'off',
		},
	},
	fmt: {
		ignorePatterns: toolingIgnorePatterns,
		useTabs: true,
		tabWidth: 2,
		printWidth: 120,
		singleQuote: true,
		semi: true,
		trailingComma: 'es5',
		endOfLine: 'lf',
		insertFinalNewline: true,
	},
	run: {
		tasks: {
			'build:server': {
				command: 'bun run build:server',
			},
			'build:tauri': {
				command: 'bun run build:tauri',
			},
			'db:check': {
				command: 'bun run db:check',
			},
			tsc: {
				command: 'bun run tsc',
			},
		},
	},
	staged: {
		'*': 'vp check --fix',
	},
	// Optimizaci?n de logs
	logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
	clearScreen: false,
});
