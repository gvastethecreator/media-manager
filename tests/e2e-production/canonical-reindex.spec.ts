import { access, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, test } from '@playwright/test';

interface FolderResponse {
	id: string;
}

async function apiJson<T>(request: APIRequestContext, method: 'POST', path: string, data: unknown): Promise<T> {
	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	if (!publicPort) throw new Error('MEDIA_MANAGER_APP_PORT es obligatorio para el smoke de reindexado.');
	const response = await request.fetch(path, {
		data,
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
		method,
	});
	const text = await response.text();
	expect(response.ok(), `${method} ${path} devolvió ${response.status()}: ${text}`).toBe(true);
	return JSON.parse(text) as T;
}

test('muestra sólo el reindexado canónico por carpeta y conserva su diálogo accesible', async ({ page, request }) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de reindexado.');

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

	const relativePath = 'canonical-reindex-browser';
	const folderName = 'Carpeta de reindexado canónico';
	await mkdir(resolve(mediaRoot, relativePath), { recursive: true });
	const folder = await apiJson<FolderResponse>(request, 'POST', '/api/folders', {
		name: folderName,
		source: { relativePath, rootId: 'smoke-root' },
	});

	await sharp({ create: { width: 16, height: 16, channels: 3, background: '#4588aa' } })
		.png()
		.toFile(resolve(mediaRoot, relativePath, 'cleanup-move.png'));
	await page.goto('/settings?section=files&item=folders', { waitUntil: 'domcontentloaded' });
	await expect(page.getByTestId('folders-settings')).toBeVisible();
	await expect(page.getByTestId('reindex-all-button')).toHaveCount(0);
	await expect(page.getByTestId('reindex-all-guidance')).toHaveText('Reindex each folder from its own action.');

	const infoButton = page.getByRole('button', { name: 'Reindex process' });
	await infoButton.click();
	const infoDialog = page.getByRole('dialog');
	await expect(infoDialog).toContainText('Each reindex runs on an authorized folder');
	await expect(infoDialog).toContainText('There is no global shortcut');
	expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true);

	const evidenceDirectory = resolve(
		process.cwd(),
		'.scratch',
		'planning',
		'2026-07-14-complete-recovery',
		'artifacts',
		'canonical-reindex'
	);
	await mkdir(evidenceDirectory, { recursive: true });
	await page.screenshot({ animations: 'disabled', path: resolve(evidenceDirectory, 'dialog-desktop.png') });

	await page.keyboard.press('Escape');
	await expect(infoDialog).toBeHidden();
	await expect(infoButton).toBeFocused();

	await page.getByTestId('folders-settings').getByTitle(folderName, { exact: true }).hover();
	const reindexResponse = page.waitForResponse(
		(response) => response.request().method() === 'POST' && response.url().includes(`/api/folders/${folder.id}/reindex`)
	);
	await page.getByRole('button', { name: `Reindex ${folderName}` }).click();
	expect((await reindexResponse).status()).toBe(200);
	await page.getByRole('button', { name: 'Close reindex terminal' }).click();
	await expect(page.getByText('Reindex Terminal')).toHaveCount(0);

	await page.setViewportSize({ height: 768, width: 1024 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	await page.screenshot({ animations: 'disabled', path: resolve(evidenceDirectory, 'folders-compact.png') });

	await page.setViewportSize({ height: 900, width: 1440 });
	await page.goto(`/folders/${folder.id}`, { waitUntil: 'domcontentloaded' });
	const file = page.getByRole('button', { name: /cleanup-move/ });
	await expect(file).toBeVisible();
	await file.click();
	const assetId = await file.getAttribute('data-item-id');
	expect(assetId).toBeTruthy();
	await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
	await page.screenshot({ animations: 'disabled', path: resolve(evidenceDirectory, 'cleanup-selection.png') });

	const destinationPath = 'cleanup-move-destination';
	await mkdir(resolve(mediaRoot, destinationPath));
	const destination = await apiJson<FolderResponse>(request, 'POST', '/api/folders', {
		name: 'Cleanup move destination',
		source: { relativePath: destinationPath, rootId: 'smoke-root' },
	});
	await apiJson(request, 'POST', '/api/files/assets/move', {
		assets: [{ assetId, assetType: 'image' }],
		targetFolderId: destination.id,
	});
	await access(resolve(mediaRoot, destinationPath, 'cleanup-move.png'));
	await expect(access(resolve(mediaRoot, relativePath, 'cleanup-move.png'))).rejects.toThrow();
	await page.goto(`/folders/${destination.id}`, { waitUntil: 'domcontentloaded' });
	await expect(page.getByRole('button', { name: /cleanup-move/ })).toBeVisible();
	await page.screenshot({ animations: 'disabled', path: resolve(evidenceDirectory, 'cleanup-moved.png') });
	expect(pageErrors).toEqual([]);
	expect(consoleErrors).toEqual([]);
	expect(serverErrors).toEqual([]);
});
