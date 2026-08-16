import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, type APIRequestContext, type Page, test } from '@playwright/test';
import { generateFrontmatter } from '../../src/services/taxonomy/file-backed/file-backed.service';

interface ArtifactDocument {
	body: string;
	contentHash: string;
	entityId: string;
	relativePath: string;
}

interface EntityResponse {
	id: string;
}

async function apiJson<T>(
	request: APIRequestContext,
	method: 'GET' | 'POST' | 'PUT',
	path: string,
	data?: unknown
): Promise<T> {
	const publicPort = process.env.MEDIA_MANAGER_APP_PORT;
	if (!publicPort) throw new Error('MEDIA_MANAGER_APP_PORT es obligatorio para el smoke de taxonomía.');
	const response = await request.fetch(path, {
		data,
		headers: { Origin: `http://127.0.0.1:${publicPort}` },
		method,
	});
	const text = await response.text();
	expect(response.ok(), `${method} ${path} devolvió ${response.status()}: ${text}`).toBe(true);
	return JSON.parse(text) as T;
}

function promptTextarea(page: Page, label: string) {
	return page.getByRole('dialog').getByText(label, { exact: true }).locator('..').locator('textarea');
}

function assertDialogInsideViewport(page: Page): Promise<void> {
	return page
		.getByRole('dialog')
		.boundingBox()
		.then((box) => {
			expect(box).not.toBeNull();
			expect(box!.x).toBeGreaterThanOrEqual(0);
			expect(box!.y).toBeGreaterThanOrEqual(0);
			expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
			expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
		});
}

test('edita Prompt, Note y Wildcard desde sus archivos canónicos y recupera un conflicto externo', async ({
	page,
	request,
}) => {
	const mediaRoot = process.env.MEDIA_MANAGER_SMOKE_ROOT_PATH;
	if (!mediaRoot) throw new Error('MEDIA_MANAGER_SMOKE_ROOT_PATH es obligatorio para el smoke de taxonomía.');

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

	const promptName = 'Prompt browser canónico';
	const noteTitle = 'Nota browser canónica';
	const wildcardName = 'Wildcard browser canónico';
	await page.setViewportSize({ height: 900, width: 1440 });
	expect(page.viewportSize()).toEqual({ height: 900, width: 1440 });

	const prompt = await apiJson<EntityResponse>(request, 'POST', '/api/prompts', {
		content: 'Proyección inicial del Prompt',
		description: 'Fixture de producción',
		name: promptName,
	});
	const promptArtifact = await apiJson<ArtifactDocument>(
		request,
		'PUT',
		`/api/taxonomy-artifacts/prompt/${prompt.id}`,
		{
			body: 'Cuerpo canónico inicial del Prompt',
			metadata: {
				parameters: [],
				purpose: 'Probar el editor de producción',
				summary: 'Fixture de producción',
				title: promptName,
			},
			rootId: 'smoke-root',
		}
	);

	const note = await apiJson<EntityResponse>(request, 'POST', '/api/notes', {
		content: 'Proyección inicial de la Nota',
		title: noteTitle,
	});
	await apiJson<ArtifactDocument>(request, 'PUT', `/api/taxonomy-artifacts/note/${note.id}`, {
		body: 'Cuerpo canónico inicial de la Nota',
		metadata: { category: 'general', summary: 'Fixture de producción', title: noteTitle },
		rootId: 'smoke-root',
	});

	const wildcard = await apiJson<{ artifact: ArtifactDocument; entity: EntityResponse }>(
		request,
		'POST',
		'/api/taxonomy-artifacts/wildcard',
		{
			body: 'rojo\nverde',
			metadata: { summary: 'Fixture de producción', title: wildcardName },
			rootId: 'smoke-root',
		}
	);

	await page.goto('/settings?section=worldbuilding&item=prompts', { waitUntil: 'domcontentloaded' });
	await expect(page.getByRole('heading', { name: 'Worldbuilding' })).toBeVisible();
	await page.getByRole('button', { name: `Editar ${promptName}` }).click();
	await expect(page.getByRole('dialog').getByText('Editar Prompt', { exact: true })).toBeVisible();
	const promptBody = promptTextarea(page, 'Contenido');
	await expect(promptBody).toHaveValue('Cuerpo canónico inicial del Prompt');

	const externalPromptBody = 'Ganador externo del Prompt';
	await writeFile(
		resolve(mediaRoot, ...promptArtifact.relativePath.split('/')),
		generateFrontmatter(
			{
				id: prompt.id,
				kind: 'prompt',
				parameters: [],
				purpose: 'Probar el conflicto externo',
				schemaVersion: 1,
				summary: 'Fixture de producción',
				title: promptName,
			},
			externalPromptBody
		),
		'utf8'
	);
	await promptBody.fill('Intento obsoleto del editor');
	const conflictResponse = page.waitForResponse(
		(response) =>
			response.request().method() === 'PUT' && response.url().includes(`/api/taxonomy-artifacts/prompt/${prompt.id}`)
	);
	await page.getByRole('dialog').getByRole('button', { name: 'Guardar cambios' }).click();
	expect((await conflictResponse).status()).toBe(409);
	await expect(page.getByRole('dialog').getByText('El artefacto cambió desde la última lectura.')).toBeVisible();
	expect((await apiJson<ArtifactDocument>(request, 'GET', `/api/taxonomy-artifacts/prompt/${prompt.id}`)).body).toBe(
		externalPromptBody
	);

	await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
	await page.getByRole('button', { name: `Editar ${promptName}` }).click();
	await expect(promptTextarea(page, 'Contenido')).toHaveValue(externalPromptBody);
	await promptTextarea(page, 'Contenido').fill('Prompt guardado después de recargar');
	await page.getByRole('dialog').getByRole('button', { name: 'Guardar cambios' }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
	expect((await apiJson<ArtifactDocument>(request, 'GET', `/api/taxonomy-artifacts/prompt/${prompt.id}`)).body).toBe(
		'Prompt guardado después de recargar'
	);

	await page.goto('/settings?section=worldbuilding&item=notes');
	await page.getByRole('button', { name: `Editar ${noteTitle}` }).click();
	await expect(page.getByRole('dialog').getByLabel('Contenido')).toHaveValue('Cuerpo canónico inicial de la Nota');
	await page.getByRole('dialog').getByLabel('Contenido').fill('Nota guardada desde el archivo canónico');
	await page.getByRole('dialog').getByRole('button', { name: 'Guardar Cambios' }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
	expect((await apiJson<ArtifactDocument>(request, 'GET', `/api/taxonomy-artifacts/note/${note.id}`)).body).toBe(
		'Nota guardada desde el archivo canónico'
	);

	await writeFile(
		resolve(mediaRoot, ...wildcard.artifact.relativePath.split('/')),
		generateFrontmatter(
			{
				id: wildcard.entity.id,
				kind: 'wildcard',
				schemaVersion: 1,
				summary: 'Edición externa',
				title: wildcardName,
			},
			'externo-uno\nexterno-dos'
		),
		'utf8'
	);
	await page.goto('/settings?section=worldbuilding&item=wildcards');
	await page.getByRole('button', { name: `Editar ${wildcardName}` }).click();
	await expect(page.getByRole('dialog').getByPlaceholder('Valor 1')).toHaveValue('externo-uno');
	await expect(page.getByRole('dialog').getByPlaceholder('Valor 2')).toHaveValue('externo-dos');
	await assertDialogInsideViewport(page);

	const desktopEvidence = process.env.MEDIA_MANAGER_TAXONOMY_DESKTOP_EVIDENCE_PATH;
	if (desktopEvidence) await page.screenshot({ animations: 'disabled', path: desktopEvidence });

	await page.setViewportSize({ height: 768, width: 1024 });
	expect(page.viewportSize()).toEqual({ height: 768, width: 1024 });
	await assertDialogInsideViewport(page);
	expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
	const compactEvidence = process.env.MEDIA_MANAGER_TAXONOMY_COMPACT_EVIDENCE_PATH;
	if (compactEvidence) await page.screenshot({ animations: 'disabled', path: compactEvidence });

	await page.getByRole('dialog').getByPlaceholder('Valor 2').fill('externo-guardado');
	await page.getByRole('dialog').getByRole('button', { name: 'Guardar cambios' }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
	expect(
		(await apiJson<ArtifactDocument>(request, 'GET', `/api/taxonomy-artifacts/wildcard/${wildcard.entity.id}`)).body
	).toBe('externo-uno\nexterno-guardado');

	await page.waitForTimeout(500);
	expect(pageErrors).toEqual([]);
	expect(consoleErrors.filter((message) => !message.includes('status of 409 (Conflict)'))).toEqual([]);
	expect(consoleErrors.filter((message) => message.includes('status of 409 (Conflict)'))).toHaveLength(1);
	expect(serverErrors).toEqual([]);
});
