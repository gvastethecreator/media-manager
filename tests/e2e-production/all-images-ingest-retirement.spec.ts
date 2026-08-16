import { expect, test } from '@playwright/test';

test('routes all-images media intake and reindexing to the authorized file browser', async ({ page }, testInfo) => {
	const errors: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	page.on('pageerror', (error) => errors.push(error.message));

	await page.goto('/all-images');
	const fileBrowserLink = page.getByRole('link', { name: 'Open file browser' });
	await expect(fileBrowserLink).toHaveAttribute('href', '/files');
	await expect(page.getByRole('link', { name: 'Manage reindexing' })).toHaveAttribute('href', '/files');
	await expect(page.getByRole('button', { name: 'Reindex' })).toHaveCount(0);
	await expect(page.getByText('Upload Images', { exact: true })).toHaveCount(0);
	await page.screenshot({ path: testInfo.outputPath('all-images-authorized-ingest.png'), fullPage: true });
	await fileBrowserLink.click();
	await expect(page).toHaveURL(/\/files$/);
	expect(errors).toEqual([]);
});
