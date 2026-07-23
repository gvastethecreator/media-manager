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

function createPdfFixture(text: string): Buffer {
	const stream = `BT /F1 24 Tf 100 700 Td (${text}) Tj ET`;
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
		`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
	];
	let pdf = '%PDF-1.4\n';
	const offsets = [0];
	for (const [index, object] of objects.entries()) {
		offsets.push(Buffer.byteLength(pdf, 'ascii'));
		pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
	}
	const xrefOffset = Buffer.byteLength(pdf, 'ascii');
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	for (const offset of offsets.slice(1)) pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
	return Buffer.from(pdf, 'ascii');
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

test('renderiza un PDF desde su fuente autorizada y descarga por la ruta protegida', async ({
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

	const fixtureDirectory = 'pdf-viewer-browser';
	const fileName = 'Documento PDF canónico.pdf';
	const pdf = createPdfFixture('PDF canónico');
	const relativePath = `${fixtureDirectory}/${fileName}`;
	await mkdir(resolve(mediaRoot, fixtureDirectory), { recursive: true });
	await writeFile(resolve(mediaRoot, fixtureDirectory, fileName), pdf);
	const folder = await apiJson<EntityResponse>(request, '/api/folders', {
		name: 'PDF de visor',
		source: { relativePath: fixtureDirectory, rootId: 'smoke-root' },
	});
	await apiJson<EntityResponse>(request, '/api/documents', {
		extension: 'pdf',
		folderId: folder.id,
		hash: createHash('sha256').update(pdf).digest('hex'),
		mimeType: 'application/pdf',
		name: fileName,
		size: pdf.byteLength,
		source: { relativePath, rootId: 'smoke-root' },
	});

	await page.goto('/documents', { waitUntil: 'domcontentloaded' });
	const documentItem = page.getByText(fileName, { exact: true }).first();
	await expect(documentItem).toBeVisible();
	const contentResponse = page.waitForResponse(
		(response) => response.request().method() === 'GET' && new URL(response.url()).pathname.endsWith('/content')
	);
	await documentItem.dblclick();
	expect((await contentResponse).status()).toBe(200);
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.getByText('Página 1 de 1')).toBeVisible();
	await expect(dialog.locator('canvas')).toBeVisible();
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('pdf-viewer-desktop.png') });

	const downloadPromise = page.waitForEvent('download');
	await dialog.getByRole('link', { name: 'Descargar' }).click();
	expect((await downloadPromise).suggestedFilename()).toBe(fileName);

	await page.setViewportSize({ height: 768, width: 1024 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('pdf-viewer-compact.png') });
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await page.waitForTimeout(300);
	expect(pageErrors).toEqual([]);
	expect(consoleErrors).toEqual([]);
	expect(serverErrors).toEqual([]);
});

test('informa un PDF corrupto sin romper el diálogo del visor', async ({ page, request }, testInfo) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de documentos.');
	const fixtureDirectory = 'broken-pdf-viewer-browser';
	const fileName = 'Documento PDF corrupto.pdf';
	const content = 'Este archivo no contiene un PDF válido.';
	const relativePath = `${fixtureDirectory}/${fileName}`;
	await mkdir(resolve(mediaRoot, fixtureDirectory), { recursive: true });
	await writeFile(resolve(mediaRoot, fixtureDirectory, fileName), content, 'utf8');
	const folder = await apiJson<EntityResponse>(request, '/api/folders', {
		name: 'PDF corrupto de visor',
		source: { relativePath: fixtureDirectory, rootId: 'smoke-root' },
	});
	await apiJson<EntityResponse>(request, '/api/documents', {
		extension: 'pdf',
		folderId: folder.id,
		hash: createHash('sha256').update(content).digest('hex'),
		mimeType: 'application/pdf',
		name: fileName,
		size: Buffer.byteLength(content),
		source: { relativePath, rootId: 'smoke-root' },
	});

	await page.goto('/documents', { waitUntil: 'domcontentloaded' });
	const documentItem = page.getByText(fileName, { exact: true }).first();
	await expect(documentItem).toBeVisible();
	await documentItem.dblclick();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('alert')).toContainText('Comprueba que el archivo no esté dañado o protegido.');
	await expect(dialog.getByRole('button', { name: 'Reintentar' })).toBeVisible();
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('pdf-viewer-error-desktop.png') });
	await page.setViewportSize({ height: 768, width: 1024 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('pdf-viewer-error-compact.png') });
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
});
