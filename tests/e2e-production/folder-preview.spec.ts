import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, test } from '@playwright/test';

interface EntityResponse {
	id: string;
}

async function postJson<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	if (!publicPort) throw new Error('MEDIA_MANAGER_APP_PORT es obligatorio para el smoke de previews de carpeta.');

	const response = await request.post(path, {
		data,
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
	});
	const text = await response.text();
	expect(response.ok(), `POST ${path} devolvió ${response.status()}: ${text}`).toBe(true);
	return JSON.parse(text) as T;
}

async function createFolderPreviewFixture(request: APIRequestContext, mediaRoot: string) {
	const name = 'carpeta-preview-local.png';
	const directory = 'folder-preview-browser';
	const relativePath = `${directory}/${name}`;
	const source = resolve(process.cwd(), 'test-files', 'test-photo.png');
	const destination = resolve(mediaRoot, relativePath);
	await mkdir(resolve(destination, '..'), { recursive: true });
	await copyFile(source, destination);
	const content = await readFile(source);
	const folder = await postJson<EntityResponse>(request, '/api/folders', {
		name: 'Carpeta con preview local',
		source: { relativePath: directory, rootId: 'smoke-root' },
	});
	const image = await postJson<EntityResponse>(request, '/api/images', {
		folderId: folder.id,
		hash: createHash('sha256').update(content).digest('hex'),
		height: 720,
		name,
		size: (await stat(source)).size,
		source: { relativePath, rootId: 'smoke-root' },
		width: 1280,
	});

	return { folder, image };
}

test('muestra previews de carpeta desde la API local en el browser de producción', async ({
	page,
	request,
}, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de previews de carpeta.');

	const { folder, image } = await createFolderPreviewFixture(request, mediaRoot);
	const thumbnailResponse = page.waitForResponse(
		(response) =>
			response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/images/${image.id}/thumbnail`
	);
	await page.goto('/folders', { waitUntil: 'domcontentloaded' });
	const folderCard = page.getByRole('listitem').filter({ hasText: 'Carpeta con preview local' });
	await expect(folderCard).toBeVisible();
	expect((await thumbnailResponse).status()).toBe(200);
	await expect(folderCard.locator(`[style*="/api/images/${image.id}/thumbnail"]`)).toHaveCount(1);
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('folder-preview-local.png') });

	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	const previewResponse = await request.get(`/api/folders/${folder.id}/preview`, {
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
	});
	const previewText = await previewResponse.text();
	expect(previewResponse.ok(), `GET preview devolvió ${previewResponse.status()}: ${previewText}`).toBe(true);
	expect(previewText).toContain('href="data:image/');
	expect(previewText).not.toContain('href="/api/');
	expect(previewResponse.headers()['content-security-policy']).toContain('img-src data:');
});
