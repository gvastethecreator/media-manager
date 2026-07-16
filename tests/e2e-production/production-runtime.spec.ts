import { expect, test } from '@playwright/test';

test('arranca artefactos, renderiza la SPA y cierra el runtime same-origin sin errores', async ({ page, request }) => {
	const pageErrors: string[] = [];
	const consoleErrors: string[] = [];
	page.on('pageerror', (error) => pageErrors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') consoleErrors.push(message.text());
	});

	const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
	expect(response?.status()).toBe(200);
	await expect(page.locator('#root')).toBeVisible();
	const main = page.locator('main#main-content');
	await expect(main).toBeVisible();
	await expect(main.getByText('Dashboard', { exact: true }).first()).toBeVisible();

	const healthResponse = await request.get('/health');
	expect(healthResponse.status()).toBe(200);
	expect(await healthResponse.json()).toMatchObject({ status: 'ready' });

	const apiHealth = await page.evaluate(async () => {
		const apiResponse = await fetch('/api/system/health');
		return { body: await apiResponse.json(), status: apiResponse.status };
	});
	expect(apiHealth.status).toBe(200);
	expect(apiHealth.body).toMatchObject({ status: 'ok' });

	const scriptSource = await page.locator('script[src*="/assets/"]').first().getAttribute('src');
	expect(scriptSource).toBeTruthy();
	const assetResponse = await request.get(scriptSource!);
	expect(assetResponse.status()).toBe(200);
	expect(assetResponse.headers()['cache-control']).toContain('immutable');
	expect(response?.headers()['cache-control']).toBe('no-cache');

	const fallbackResponse = await request.get('/library/smoke-asset', {
		headers: { Accept: 'text/html' },
	});
	expect(fallbackResponse.status()).toBe(200);
	expect(fallbackResponse.headers()['content-type']).toContain('text/html');

	await page.waitForTimeout(1_000);
	const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
	expect(horizontalOverflow).toBe(false);
	expect(pageErrors).toEqual([]);
	expect(consoleErrors).toEqual([]);

	const evidencePath = process.env.MEDIA_MANAGER_SMOKE_EVIDENCE_PATH;
	if (evidencePath) await page.screenshot({ animations: 'disabled', path: evidencePath });
});
