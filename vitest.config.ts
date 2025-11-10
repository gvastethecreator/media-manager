import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./src/test/setup.ts'],
		include: ['**/*.{test,spec}.{ts,tsx}'],
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/build/**',
			'**/.{idea,git,cache,output,temp}/**',
			'**/tests/e2e/**', // Playwright E2E tests (use 'npm run test:e2e' instead)
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'**/*.config.{ts,js}',
				'**/__tests__/**',
				'**/test/**',
				'**/*.test.{ts,tsx}',
				'**/*.spec.{ts,tsx}',
			],
		},
		testTimeout: 10000,
		mockReset: true,
		restoreMocks: true,
		clearMocks: true,
	},
});
