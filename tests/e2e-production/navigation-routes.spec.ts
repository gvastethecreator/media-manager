import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, test } from '@playwright/test';

const supportedPaths = ['/all-images', '/files', '/file3d', '/file-3ds'];

interface NoteResponse {
	id: string;
	title: string;
}

const longFolderName = 'Carpeta de navegación con un nombre muy largo para comprobar el truncado';

async function createInlineNote(request: APIRequestContext, title: string): Promise<NoteResponse> {
	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	if (!publicPort) throw new Error('MEDIA_MANAGER_APP_PORT es obligatorio para el smoke de navegación.');
	const response = await request.post('/api/notes', {
		data: { content: 'Fixture de navegación.', title },
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
	});
	const text = await response.text();
	expect(response.ok(), `POST /api/notes devolvió ${response.status()}: ${text}`).toBe(true);
	return JSON.parse(text) as NoteResponse;
}

async function createLongFolder(request: APIRequestContext): Promise<void> {
	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!publicPort || !mediaRoot) throw new Error('El smoke de navegación requiere sus rutas temporales.');
	const relativePath = 'navigation-compact-long-folder';
	await mkdir(resolve(mediaRoot, relativePath), { recursive: true });
	const response = await request.post('/api/folders', {
		data: { name: longFolderName, source: { relativePath, rootId: 'smoke-root' } },
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
	});
	const text = await response.text();
	expect(response.ok(), `POST /api/folders devolvió ${response.status()}: ${text}`).toBe(true);
}

test('resolves the media navigation paths emitted by the interface', async ({ page, request }, testInfo) => {
	await createLongFolder(request);

	for (const path of supportedPaths) {
		const imagesResponse =
			path === '/all-images'
				? page.waitForResponse(
						(response) => response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/images'
					)
				: null;
		await page.goto(path, { waitUntil: 'domcontentloaded' });
		await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toHaveCount(0);
		await expect(page.locator('main')).toBeVisible();
		if (path === '/all-images') {
			if (!imagesResponse) throw new Error('La vista de imágenes debe solicitar sus datos.');
			expect((await imagesResponse).status()).toBe(200);
			await expect(page.getByText('Cargando...', { exact: true })).toBeHidden();
			const imageLink = page.getByRole('link', { name: /^Imágenes/ });
			await expect(page.getByRole('link', { name: /^Todos los archivos/ })).toHaveAttribute('href', '/files');
			await expect(imageLink).toHaveAttribute('href', '/all-images');
			await expect(imageLink).toHaveAttribute('aria-current', 'page');
			await expect(page.getByRole('link', { name: /^3D/ })).toHaveAttribute('href', '/file3d');
			await imageLink.focus();
			await expect(imageLink).toBeFocused();
			await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('navigation-after.png') });
			await page
				.getByRole('complementary', { name: 'Panel de navegación principal' })
				.screenshot({ animations: 'disabled', path: testInfo.outputPath('navigation-links-detail.png') });
			await page.setViewportSize({ width: 1024, height: 768 });
			await expect(imageLink).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
			const longFolderLink = page.getByRole('button', { name: `Abrir carpeta ${longFolderName}` });
			const longFolderLabel = longFolderLink.getByText(longFolderName, { exact: true });
			await expect(longFolderLink).toHaveAttribute('title', longFolderName);
			await expect(longFolderLabel).toHaveCSS('text-overflow', 'ellipsis');
			expect(await longFolderLabel.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
			await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('navigation-compact.png') });
		}
	}
});

test('navega a una nota desde el panel sin perder el prefijo de la ruta', async ({ page, request }, testInfo) => {
	const note = await createInlineNote(request, 'Nota de navegación');

	await page.goto('/notes', { waitUntil: 'domcontentloaded' });
	const toggleNotes = page.getByRole('button', { name: 'Toggle Notas children' });
	await expect(toggleNotes).toBeVisible();
	await toggleNotes.click();
	const noteLink = page.getByRole('link', { exact: true, name: note.title });
	await expect(noteLink).toHaveAttribute('href', `/notes/${note.id}`);
	await noteLink.focus();
	await expect(noteLink).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(new RegExp(`/notes/${note.id}$`));
	await expect(page.getByText(`Imágenes de la nota: ${note.title}`, { exact: true })).toBeVisible();
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('navigation-note-detail.png') });
});
