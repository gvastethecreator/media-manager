import { expect, test } from '@playwright/test';

test('retires the direct upload screen and its API in favor of the authorized file browser', async ({
	page,
}, testInfo) => {
	const expectedRetiredApiFailure = 'Failed to load resource: the server responded with a status of 410 (Gone)';
	const errors: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	page.on('pageerror', (error) => errors.push(error.message));

	await page.goto('/settings?section=media&item=uploaded-images');
	await expect(page.getByRole('heading', { name: 'Direct uploads retired' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Open file browser' })).toHaveAttribute('href', '/files');
	await page.screenshot({ path: testInfo.outputPath('uploaded-images-retirement.png'), fullPage: true });

	const response = await page.evaluate(async () => {
		const request = await fetch('/api/uploaded-images/upload', {
			body: JSON.stringify({ path: 'C:\\private\\image.png' }),
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
		});
		return { body: await request.json(), status: request.status };
	});
	expect(response.status).toBe(410);
	expect(response.body).toEqual({
		code: 'AUTHORIZED_ROOT_INGEST_REQUIRED',
		message: 'Las cargas directas fueron retiradas. Añade archivos a un media root autorizado y reindexa la carpeta.',
		retryable: false,
	});
	expect(errors.filter((error) => error !== expectedRetiredApiFailure)).toEqual([]);
});
