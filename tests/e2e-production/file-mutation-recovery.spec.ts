import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test('muestra la recuperación durable de inicio sin marcar el explorador como listo', async ({ page }) => {
	const pageErrors: string[] = [];
	const consoleErrors: string[] = [];
	const serverErrors: string[] = [];
	page.on('pageerror', (error) => pageErrors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') consoleErrors.push(message.text());
	});
	page.on('response', (response) => {
		if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
	});
	const recoveryResponse = page.waitForResponse(
		(response) => new URL(response.url()).pathname === '/api/files/recovery-status'
	);
	await page.goto('/all-files', { waitUntil: 'domcontentloaded' });
	const response = await recoveryResponse;
	expect(response.status()).toBe(200);
	expect(await response.json()).toEqual({
		data: { recovery: { completed: 0, manual: 1, pending: 0, state: 'manual_review_required' } },
		success: true,
	});
	const statusBar = page.getByTestId('file-browser-status-bar');
	const recovery = page.getByTestId('file-browser-startup-recovery');
	await expect(statusBar).toBeVisible();
	await expect(recovery).toHaveText('Recovery: 1 review');
	await expect(recovery).toHaveAttribute('title', 'Startup recovery requires manual review for 1 operation.');
	await expect(recovery).toHaveAttribute('aria-label', 'Startup recovery requires manual review for 1 operation.');
	await expect(statusBar.getByText('Ready')).toHaveCount(0);

	const evidenceDirectory = resolve(
		process.cwd(),
		'.scratch',
		'planning',
		'2026-07-14-complete-recovery',
		'artifacts',
		'file-mutation-recovery'
	);
	await mkdir(evidenceDirectory, { recursive: true });
	await page.screenshot({ animations: 'disabled', path: resolve(evidenceDirectory, 'manual-review-desktop.png') });

	await recovery.click();
	const reviewDialog = page.getByRole('dialog', { name: 'Recovery review' });
	await expect(reviewDialog).toBeVisible();
	await expect(reviewDialog).toContainText('removes a temporary copy');
	await expect(reviewDialog.getByRole('button', { name: 'Retry repair' })).toBeVisible();

	await page.screenshot({ animations: 'disabled', path: resolve(evidenceDirectory, 'manual-review-dialog.png') });
	await reviewDialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(reviewDialog).toHaveCount(0);

	await page.setViewportSize({ height: 768, width: 1024 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	await page.screenshot({ animations: 'disabled', path: resolve(evidenceDirectory, 'manual-review-compact.png') });

	await page.waitForTimeout(500);
	expect(pageErrors).toEqual([]);
	expect(consoleErrors).toEqual([]);
	expect(serverErrors).toEqual([]);
});
