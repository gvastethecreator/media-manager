import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: [['list']],
	webServer: {
		command: 'bun run dev:full',
		url: 'http://localhost:5173',
		reuseExistingServer: true,
		timeout: 120_000,
	},
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'retain-on-failure',
		actionTimeout: 10_000,
		navigationTimeout: 20_000,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
