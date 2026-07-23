import { expect, test } from '@playwright/test';

const supportedPaths = ['/all-images', '/files', '/file3d', '/file-3ds'];

test('resolves the media navigation paths emitted by the interface', async ({ page }) => {
	for (const path of supportedPaths) {
		await page.goto(path, { waitUntil: 'domcontentloaded' });
		await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toHaveCount(0);
		await expect(page.locator('main')).toBeVisible();
	}
});
