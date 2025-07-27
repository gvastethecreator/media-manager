import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react(), tsconfigPaths()] as any[],
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['src/test/setup.ts'],
		exclude: [...configDefaults.exclude, 'playwright/**', 'e2e/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			thresholds: {
				lines: 70,
				statements: 70,
				branches: 60,
				functions: 70,
			},
			exclude: [
				'coverage/**',
				'dist/**',
				'packages/*/test{,s}/**',
				'**/*.d.ts',
				'cypress/**',
				'test{,s}/**',
				'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
				'**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
				'**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
				'**/__tests__/**',
				'**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,build}.config.*',
				'**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
			],
		},
	},
});
