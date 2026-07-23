import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, type Locator, test } from '@playwright/test';

interface EntityResponse {
	id: string;
}

async function apiJson<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	if (!publicPort) throw new Error('MEDIA_MANAGER_APP_PORT es obligatorio para el smoke del visor de imágenes.');
	const response = await request.post(path, {
		data,
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
	});
	const text = await response.text();
	expect(response.ok(), `POST ${path} devolvió ${response.status()}: ${text}`).toBe(true);
	return JSON.parse(text) as T;
}

async function copyFixture(mediaRoot: string, relativePath: string) {
	const source = resolve(process.cwd(), 'test-files', 'test-photo.png');
	const destination = resolve(mediaRoot, relativePath);
	await mkdir(resolve(destination, '..'), { recursive: true });
	await copyFile(source, destination);
	return {
		content: await readFile(source),
		size: (await stat(source)).size,
	};
}

function trackRuntimeProblems(page: import('@playwright/test').Page) {
	const clientErrors: string[] = [];
	const consoleErrors: string[] = [];
	const pageErrors: string[] = [];
	const serverErrors: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error') consoleErrors.push(message.text());
	});
	page.on('pageerror', (error) => pageErrors.push(error.message));
	page.on('response', (response) => {
		if (response.status() >= 400 && response.status() < 500)
			clientErrors.push(`${response.status()} ${response.url()}`);
		if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
	});
	return { clientErrors, consoleErrors, pageErrors, serverErrors };
}

async function expectImageReady(image: Locator) {
	await expect(image).toHaveCount(1);
	await expect
		.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0), {
			timeout: 30_000,
		})
		.toBe(true);
}

async function createImageFixture(request: APIRequestContext, mediaRoot: string, fileName: string) {
	const directory = `image-viewer-browser/${fileName}`;
	const relativePath = `${directory}/${fileName}`;
	const fixture = await copyFixture(mediaRoot, relativePath);
	const folder = await apiJson<EntityResponse>(request, '/api/folders', {
		name: `Visor ${fileName}`,
		source: { relativePath: directory, rootId: 'smoke-root' },
	});
	const image = await apiJson<EntityResponse>(request, '/api/images', {
		folderId: folder.id,
		hash: createHash('sha256').update(fixture.content).digest('hex'),
		height: 720,
		name: fileName,
		size: fixture.size,
		source: { relativePath, rootId: 'smoke-root' },
		width: 1280,
	});
	return { image, relativePath };
}

async function openImageViewer(
	page: import('@playwright/test').Page,
	image: EntityResponse,
	fileName: string
): Promise<{ contentResponse: import('@playwright/test').Response; dialog: Locator }> {
	await page.goto('/all-images', { waitUntil: 'domcontentloaded' });
	const item = page.getByText(fileName, { exact: true }).first();
	await expect(item).toBeVisible();
	const contentResponse = page.waitForResponse(
		(response) =>
			response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/images/${image.id}/content`
	);
	await item.dblclick();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	return { contentResponse: await contentResponse, dialog };
}

test('abre una imagen desde la biblioteca en el visor global y conserva la entrega autorizada', async ({
	page,
	request,
}, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke del visor de imágenes.');
	const runtime = trackRuntimeProblems(page);
	const fileName = 'imagen-canónica.png';
	const { image } = await createImageFixture(request, mediaRoot, fileName);
	const { contentResponse, dialog } = await openImageViewer(page, image, fileName);

	expect(contentResponse.status()).toBe(200);
	const displayedImage = dialog.locator(`img[src*="/api/images/${image.id}/content"]`);
	await expectImageReady(displayedImage);
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('image-viewer-desktop.png') });
	await page.setViewportSize({ height: 768, width: 1024 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	await expectImageReady(displayedImage);
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('image-viewer-compact.png') });
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	expect(runtime.pageErrors).toEqual([]);
	expect(runtime.clientErrors).toEqual([]);
	expect(runtime.consoleErrors).toEqual([]);
	expect(runtime.serverErrors).toEqual([]);
});

test('informa una fuente de imagen ausente sin dejar un visor vacío', async ({ page, request }, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke del visor de imágenes.');
	const runtime = trackRuntimeProblems(page);
	const fileName = 'imagen-ausente.png';
	const { image, relativePath } = await createImageFixture(request, mediaRoot, fileName);

	await page.goto('/all-images', { waitUntil: 'domcontentloaded' });
	const item = page.getByText(fileName, { exact: true }).first();
	await expect(item).toBeVisible();
	await rm(resolve(mediaRoot, relativePath));
	const contentResponse = page.waitForResponse(
		(response) =>
			response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/images/${image.id}/content`
	);
	await item.dblclick();
	expect((await contentResponse).status()).toBe(404);
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('alert')).toContainText('No se pudo cargar esta imagen.');
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('image-viewer-missing-source.png') });
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	expect(runtime.pageErrors).toEqual([]);
	expect(runtime.clientErrors).not.toEqual([]);
	expect(runtime.clientErrors.every((message) => message.includes(`/api/images/${image.id}/content`))).toBe(true);
	expect(runtime.consoleErrors.every((message) => message.includes('Failed to load resource'))).toBe(true);
	expect(runtime.serverErrors).toEqual([]);
});
