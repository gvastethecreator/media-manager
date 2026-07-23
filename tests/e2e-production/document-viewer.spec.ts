import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, test } from '@playwright/test';

interface EntityResponse {
	id: string;
}

async function apiJson<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	if (!publicPort) throw new Error('MEDIA_MANAGER_APP_PORT es obligatorio para el smoke de documentos.');
	const response = await request.post(path, {
		data,
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
	});
	const text = await response.text();
	expect(response.ok(), `POST ${path} devolvió ${response.status()}: ${text}`).toBe(true);
	return JSON.parse(text) as T;
}

test('abre un documento de texto desde su fuente autorizada y permite cerrar el visor con Escape', async ({
	page,
	request,
}, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de documentos.');
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

	const fixtureDirectory = 'document-viewer-browser';
	const fileName = 'Documento de visor canónico.txt';
	const content = 'Contenido servido por la fuente canónica del documento.';
	const relativePath = `${fixtureDirectory}/${fileName}`;
	await mkdir(resolve(mediaRoot, fixtureDirectory), { recursive: true });
	await writeFile(resolve(mediaRoot, fixtureDirectory, fileName), content, 'utf8');
	const folder = await apiJson<EntityResponse>(request, '/api/folders', {
		name: 'Documentos de visor',
		source: { relativePath: fixtureDirectory, rootId: 'smoke-root' },
	});
	await apiJson<EntityResponse>(request, '/api/documents', {
		extension: 'txt',
		folderId: folder.id,
		hash: createHash('sha256').update(content).digest('hex'),
		mimeType: 'text/plain',
		name: fileName,
		size: Buffer.byteLength(content),
		source: { relativePath, rootId: 'smoke-root' },
	});

	await page.goto('/documents', { waitUntil: 'domcontentloaded' });
	await expect(page.getByRole('heading', { name: 'Documentos' })).toBeVisible();
	const documentItem = page.getByText(fileName, { exact: true }).first();
	await expect(documentItem).toBeVisible();
	const contentResponse = page.waitForResponse(
		(response) => response.request().method() === 'GET' && new URL(response.url()).pathname.endsWith('/content')
	);
	await documentItem.dblclick();
	expect((await contentResponse).status()).toBe(200);
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Descargar' })).toBeEnabled();
	await expect(dialog.getByText(content, { exact: true })).toBeVisible();

	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('document-viewer-desktop.png') });
	await page.setViewportSize({ height: 768, width: 1024 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('document-viewer-compact.png') });
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await page.waitForTimeout(300);
	expect(pageErrors).toEqual([]);
	expect(consoleErrors).toEqual([]);
	expect(serverErrors).toEqual([]);
});
