import { expect, test } from '@playwright/test';

test('routes thumbnail maintenance to authorized folders', async ({ page }, testInfo) => {
	const errors: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	page.on('pageerror', (error) => errors.push(error.message));

	await page.goto('/settings?section=files&item=thumbnails', { waitUntil: 'domcontentloaded' });
	await expect(page.getByText('Procesamiento por carpeta', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Ver carpetas autorizadas' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Optimizar' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Reprocesar todo' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Limpiar huérfanas' })).toHaveCount(0);
	await page.screenshot({ path: testInfo.outputPath('thumbnail-maintenance-by-folder.png'), fullPage: true });

	await page.getByRole('button', { name: 'Ver carpetas autorizadas' }).click();
	await expect(page.getByTestId('folders-settings')).toBeVisible();
	expect(errors).toEqual([]);
});
