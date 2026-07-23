import { mkdir } from 'node:fs/promises';
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

	await page.goto('/settings?section=files&item=folders', { waitUntil: 'domcontentloaded' });
	await expect(page.getByTestId('folders-settings')).toBeVisible();
	await expect(page.getByTestId('reindex-all-button')).toHaveCount(0);
	await expect(page.getByTestId('reindex-all-guidance')).toHaveText('Reindexa cada carpeta desde su acción.');

	const infoButton = page.getByRole('button', { name: 'Proceso de reindexado' });
	await infoButton.click();
	const infoDialog = page.getByRole('dialog');
	await expect(infoDialog).toContainText('Cada reindexación se ejecuta sobre una carpeta autorizada');
	await expect(infoDialog).toContainText('No hay un atajo global');
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
	await page.getByRole('button', { name: `Reindexar ${folderName}` }).click();
	expect((await reindexResponse).status()).toBe(200);
	await page.getByRole('button', { name: 'Cerrar terminal de reindexado' }).click();
	await expect(page.getByText('Terminal de Reindexado')).toHaveCount(0);

	await page.setViewportSize({ height: 768, width: 1024 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	await page.screenshot({ animations: 'disabled', path: resolve(evidenceDirectory, 'folders-compact.png') });

	await page.waitForTimeout(500);
	expect(pageErrors).toEqual([]);
	expect(consoleErrors).toEqual([]);
	expect(serverErrors).toEqual([]);
});
