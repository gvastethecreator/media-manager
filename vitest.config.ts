import { defineConfig } from 'vitest/config';

const testMaxWorkers = Math.max(1, Number.parseInt(process.env.VITEST_MAX_WORKERS ?? '2', 10) || 2);

export default defineConfig({
	test: {
		// Entorno jsdom para tests de componentes React
		environment: 'jsdom',
		// Archivo de setup global
		setupFiles: ['./tests/setup.ts'],
		// Excluir tests E2E (Playwright) - solo unit tests aquí
		exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**', '**/*.e2e.spec.ts'],
		// Incluir solo archivos de test
		include: [
			'src/**/*.{test,spec}.{ts,tsx}',
			'tests/unit/**/*.{test,spec}.{ts,tsx}',
			'tests/integration/**/*.{test,spec}.{ts,tsx}',
		],
		// Globals para describe/it/expect sin imports
		globals: true,
		// Cobertura
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			reportsDirectory: './coverage',
			exclude: ['node_modules/**', 'dist/**', 'tests/**', '**/*.d.ts', '**/*.config.*', 'src-tauri/**', 'scripts/**'],
			thresholds: {
				statements: 50, // Empezar conservador, subir después
			},
		},
		// Timeouts
		testTimeout: 30_000,
		hookTimeout: 30_000,
		// Cada archivo recibe su propia copia migrada de SQLite dentro del worker desde tests/setup.ts.
		fileParallelism: true,
		maxWorkers: testMaxWorkers,
		maxConcurrency: 1,
		sequence: {
			concurrent: false,
			shuffle: false,
		},
		// Pool de ejecución
		pool: 'forks',
		// Aislamiento para evitar contaminación entre tests
		isolate: true,
		// Reporter
		reporters: ['default'],
		// Silenciar console.log durante tests (excepto errores)
		silent: false,
	},
	// Resolver alias de paths igual que en tsconfig
	resolve: {
		tsconfigPaths: true,
		alias: {
			'@': '/src',
		},
	},
});
