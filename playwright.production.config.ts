import { defineConfig, devices } from '@playwright/test';

function requiredPort(name: string): number {
	const value = Number.parseInt(process.env[name] ?? '', 10);
	if (!(Number.isSafeInteger(value) && value > 0 && value <= 65_535)) {
		throw new Error(`${name} debe contener un puerto dinámico válido.`);
	}
	return value;
}

const publicPort = requiredPort('MEDIA_MANAGER_APP_PORT');
const baseURL = `http://127.0.0.1:${publicPort}`;

export default defineConfig({
	expect: { timeout: 15_000 },
	forbidOnly: true,
	fullyParallel: false,
	outputDir: 'test-results/production-smoke',
	projects: [
		{
			name: 'production-chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	reporter: [['list']],
	retries: 0,
	testDir: './tests/e2e-production',
	timeout: 90_000,
	use: {
		actionTimeout: 10_000,
		baseURL,
		navigationTimeout: 60_000,
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
		video: 'off',
		viewport: { height: 900, width: 1440 },
	},
	webServer: {
		command: 'bun scripts/start-production.ts',
		reuseExistingServer: false,
		stdout: 'pipe',
		stderr: 'pipe',
		timeout: 120_000,
		url: `${baseURL}/health`,
	},
	workers: 1,
});
