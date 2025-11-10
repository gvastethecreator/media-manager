import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	// Unit/Integration tests
	{
		extends: './vitest.config.ts',
		test: {
			name: 'unit',
			include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/unit/**/*.{test,spec}.{ts,tsx}'],
			exclude: ['tests/e2e/**', 'tests/api/**'],
		},
	},
	// API tests (simple fetch-based tests that don't need browser)
	{
		extends: './vitest.config.ts',
		test: {
			name: 'api',
			include: ['tests/api/**/*.{test,spec}.{ts,tsx}'],
			testTimeout: 10000,
		},
	},
]);
