import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, type Locator, test } from '@playwright/test';

interface EntityResponse {
	id: string;
}

async function apiJson<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	if (!publicPort) throw new Error('MEDIA_MANAGER_APP_PORT es obligatorio para el smoke de visores multimedia.');
	const response = await request.post(path, {
		data,
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
	});
	const text = await response.text();
	expect(response.ok(), `POST ${path} devolvió ${response.status()}: ${text}`).toBe(true);
	return JSON.parse(text) as T;
}

async function copyFixture(mediaRoot: string, fixtureName: string, relativePath: string) {
	const source = resolve(process.cwd(), 'test-files', fixtureName);
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

async function expectMediaReady(media: Locator) {
	await expect(media).toHaveCount(1);
	await expect
		.poll(() => media.evaluate((element: HTMLMediaElement) => element.readyState), { timeout: 30_000 })
		.toBeGreaterThanOrEqual(3);
}

async function expectCompactLayout(
	page: import('@playwright/test').Page,
	testInfo: import('@playwright/test').TestInfo,
	name: string
) {
	await page.setViewportSize({ height: 768, width: 1024 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath(`${name}-compact.png`) });
}

async function expectWithinViewport(page: import('@playwright/test').Page, locator: Locator) {
	await expect(locator).toBeVisible();
	const box = await locator.boundingBox();
	const viewport = page.viewportSize();
	expect(box, 'El control debe tener una caja visible.').not.toBeNull();
	expect(viewport, 'La prueba requiere un viewport configurado.').not.toBeNull();
	if (!(box && viewport)) return;
	expect(box.x).toBeGreaterThanOrEqual(0);
	expect(box.y).toBeGreaterThanOrEqual(0);
	expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
	expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

test('abre un vídeo desde su fuente autorizada con controles y sin errores de ejecución', async ({
	page,
	request,
}, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de visores multimedia.');
	const runtime = trackRuntimeProblems(page);
	const directory = 'media-viewer-browser/video';
	const fileName = 'video-canónico.mp4';
	const relativePath = `${directory}/${fileName}`;
	const fixture = await copyFixture(mediaRoot, 'test-video.mp4', relativePath);
	const folder = await apiJson<EntityResponse>(request, '/api/folders', {
		name: 'Vídeos de visor',
		source: { relativePath: directory, rootId: 'smoke-root' },
	});
	const video = await apiJson<EntityResponse>(request, '/api/videos', {
		duration: 1,
		folderId: folder.id,
		hash: createHash('sha256').update(fixture.content).digest('hex'),
		height: 720,
		name: fileName,
		size: fixture.size,
		source: { relativePath, rootId: 'smoke-root' },
		width: 1280,
	});

	await page.goto('/videos', { waitUntil: 'domcontentloaded' });
	const item = page.getByText(fileName, { exact: true }).first();
	await expect(item).toBeVisible();
	const contentResponse = page.waitForResponse(
		(response) =>
			response.request().method() === 'GET' && new URL(response.url()).pathname === `/api/videos/${video.id}/content`
	);
	await item.dblclick();
	expect([200, 206]).toContain((await contentResponse).status());
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	const media = dialog.locator('video');
	await expectMediaReady(media);
	expect(await media.getAttribute('controls')).not.toBeNull();
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('video-viewer-desktop.png') });
	await expectCompactLayout(page, testInfo, 'video-viewer');
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	expect(runtime.pageErrors).toEqual([]);
	expect(runtime.clientErrors).toEqual([]);
	expect(runtime.consoleErrors).toEqual([]);
	expect(runtime.serverErrors).toEqual([]);
});

test('abre un audio desde su fuente autorizada y entrega controles cuando el medio está listo', async ({
	page,
	request,
}, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de visores multimedia.');
	const runtime = trackRuntimeProblems(page);
	const directory = 'media-viewer-browser/audio';
	const fileName = 'audio-canónico.wav';
	const relativePath = `${directory}/${fileName}`;
	const fixture = await copyFixture(mediaRoot, 'test-audio.wav', relativePath);
	const folder = await apiJson<EntityResponse>(request, '/api/folders', {
		name: 'Audios de visor',
		source: { relativePath: directory, rootId: 'smoke-root' },
	});
	const audio = await apiJson<EntityResponse>(request, '/api/audio', {
		album: null,
		albumArtist: null,
		artist: null,
		bitrate: 1_411_200,
		bpm: null,
		channels: 2,
		codec: 'pcm_s16le',
		comment: null,
		composer: null,
		description: null,
		disc: null,
		duration: 1,
		extension: 'wav',
		folderId: folder.id,
		format: 'wav',
		genre: null,
		hash: createHash('sha256').update(fixture.content).digest('hex'),
		isArchived: false,
		isFavorite: false,
		key: null,
		lyrics: null,
		mimeType: 'audio/wav',
		mood: null,
		name: fileName,
		sampleRate: 44_100,
		size: fixture.size,
		source: { relativePath, rootId: 'smoke-root' },
		title: 'Audio canónico',
		track: null,
		year: null,
	});

	await page.goto('/audios', { waitUntil: 'domcontentloaded' });
	const item = page.getByText(fileName, { exact: true }).first();
	await expect(item).toBeVisible();
	const contentResponse = page.waitForResponse((response) => {
		const url = new URL(response.url());
		return (
			response.request().method() === 'GET' &&
			url.pathname === '/api/files/content' &&
			url.searchParams.get('assetType') === 'audio' &&
			url.searchParams.get('assetId') === audio.id
		);
	});
	await item.dblclick();
	expect([200, 206]).toContain((await contentResponse).status());
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expectMediaReady(dialog.locator('audio'));
	await expect(dialog.getByRole('alert')).toHaveCount(0);
	await expect(dialog).not.toContainText(/Infinity|NaN/);
	const playButton = dialog.getByRole('button', { name: 'Reproducir audio' });
	const progressSlider = dialog.getByRole('slider', { name: 'Posición de reproducción' });
	await expect(playButton).toBeEnabled();
	await expectWithinViewport(page, playButton);
	await expectWithinViewport(page, progressSlider);
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('audio-viewer-desktop.png') });
	await expectCompactLayout(page, testInfo, 'audio-viewer');
	await expectWithinViewport(page, playButton);
	await expectWithinViewport(page, progressSlider);
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	expect(runtime.pageErrors).toEqual([]);
	expect(runtime.clientErrors).toEqual([]);
	expect(runtime.consoleErrors).toEqual([]);
	expect(runtime.serverErrors).toEqual([]);
});

test('informa un audio ausente en lugar de mantener el visor cargando', async ({ page, request }, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de visores multimedia.');
	const runtime = trackRuntimeProblems(page);
	const directory = 'media-viewer-browser/audio-missing';
	const fileName = 'audio-ausente.wav';
	const relativePath = `${directory}/${fileName}`;
	const fixture = await copyFixture(mediaRoot, 'test-audio.wav', relativePath);
	const folder = await apiJson<EntityResponse>(request, '/api/folders', {
		name: 'Audio ausente de visor',
		source: { relativePath: directory, rootId: 'smoke-root' },
	});
	const audio = await apiJson<EntityResponse>(request, '/api/audio', {
		album: null,
		albumArtist: null,
		artist: null,
		bitrate: 1_411_200,
		bpm: null,
		channels: 2,
		codec: 'pcm_s16le',
		comment: null,
		composer: null,
		description: null,
		disc: null,
		duration: 1,
		extension: 'wav',
		folderId: folder.id,
		format: 'wav',
		genre: null,
		hash: createHash('sha256').update(fixture.content).digest('hex'),
		isArchived: false,
		isFavorite: false,
		key: null,
		lyrics: null,
		mimeType: 'audio/wav',
		mood: null,
		name: fileName,
		sampleRate: 44_100,
		size: fixture.size,
		source: { relativePath, rootId: 'smoke-root' },
		title: 'Audio ausente',
		track: null,
		year: null,
	});
	await page.goto('/audios', { waitUntil: 'domcontentloaded' });
	const item = page.getByText(fileName, { exact: true }).first();
	await expect(item).toBeVisible();
	await rm(resolve(mediaRoot, relativePath));
	const contentResponse = page.waitForResponse((response) => {
		const url = new URL(response.url());
		return (
			response.request().method() === 'GET' &&
			url.pathname === '/api/files/content' &&
			url.searchParams.get('assetType') === 'audio' &&
			url.searchParams.get('assetId') === audio.id
		);
	});
	await item.dblclick();
	expect((await contentResponse).status()).toBe(404);
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('alert')).toContainText('No se pudo cargar este audio.');
	await expect(dialog.getByText('Cargando audio...', { exact: true })).toHaveCount(0);
	await expectWithinViewport(page, dialog.getByRole('button', { name: 'Reproducir audio' }));
	await expect(dialog.getByRole('button', { name: 'Reproducir audio' })).toBeDisabled();
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('audio-viewer-missing-source.png') });
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	expect(runtime.pageErrors).toEqual([]);
	expect(runtime.clientErrors).not.toEqual([]);
	const expectedMissingAudioEndpoints = [
		`/api/audio/${audio.id}/waveform`,
		`/api/thumbnails/unified/audio/${audio.id}`,
		`/api/files/content?assetType=audio&assetId=${audio.id}`,
	];
	expect(
		runtime.clientErrors.every((message) =>
			expectedMissingAudioEndpoints.some((endpoint) => message.includes(endpoint))
		)
	).toBe(true);
	expect(runtime.consoleErrors.some((message) => message.includes('Failed to load resource'))).toBe(true);
	expect(
		runtime.consoleErrors.filter((message) => message.includes('[EnhancedAudioViewer] No se pudo cargar el audio'))
	).toHaveLength(1);
	expect(
		runtime.consoleErrors.every(
			(message) =>
				message.includes('Failed to load resource') ||
				message.includes('[EnhancedAudioViewer] No se pudo cargar el audio')
		)
	).toBe(true);
	expect(runtime.serverErrors).toEqual([]);
});

test('renderiza un modelo GLB desde su fuente autorizada sin desbordamiento', async ({ page, request }, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de visores multimedia.');
	const runtime = trackRuntimeProblems(page);
	const directory = 'media-viewer-browser/file3d';
	const fileName = 'modelo-canónico.glb';
	const relativePath = `${directory}/${fileName}`;
	const fixture = await copyFixture(mediaRoot, 'test-3d.glb', relativePath);
	const folder = await apiJson<EntityResponse>(request, '/api/folders', {
		name: 'Modelos de visor',
		source: { relativePath: directory, rootId: 'smoke-root' },
	});
	const file3d = await apiJson<EntityResponse>(request, '/api/file3ds', {
		extension: 'glb',
		folderId: folder.id,
		hash: createHash('sha256').update(fixture.content).digest('hex'),
		mimeType: 'model/gltf-binary',
		name: fileName,
		size: fixture.size,
		source: { relativePath, rootId: 'smoke-root' },
	});

	const contentResponse = page.waitForResponse((response) => {
		const url = new URL(response.url());
		return (
			response.request().method() === 'GET' &&
			url.pathname === '/api/files/content' &&
			url.searchParams.get('assetType') === 'file3d' &&
			url.searchParams.get('assetId') === file3d.id
		);
	});
	await page.goto(`/file3d/${file3d.id}`, { waitUntil: 'domcontentloaded' });
	await expect(page.getByRole('heading', { name: fileName })).toBeVisible();
	await expect(page.getByText('Cargando modelo 3D...')).toBeHidden({ timeout: 30_000 });
	expect((await contentResponse).status()).toBe(200);
	await expect(page.locator('canvas')).toBeVisible();
	await expect(page.getByText('Arrastrar para rotar - Scroll para zoom')).toBeVisible();
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('file3d-viewer-desktop.png') });
	await expectCompactLayout(page, testInfo, 'file3d-viewer');
	expect(runtime.pageErrors).toEqual([]);
	expect(runtime.clientErrors).toEqual([]);
	expect(runtime.consoleErrors).toEqual([]);
	expect(runtime.serverErrors).toEqual([]);
});
