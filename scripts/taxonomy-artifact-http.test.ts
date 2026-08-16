import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { and, eq } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { mediaRoots } from '../src/lib/drizzle/schema/media-core/assets';
import { images } from '../src/lib/drizzle/schema/files/images';
import { folders } from '../src/lib/drizzle/schema/organization/folders';
import { imagePrompts } from '../src/lib/drizzle/schema/relations/remainingRelations';
import { notes } from '../src/lib/drizzle/schema/taxonomy/notes';
import { prompts } from '../src/lib/drizzle/schema/taxonomy/prompts';
import { taxonomyArtifacts } from '../src/lib/drizzle/schema/taxonomy/artifacts';
import { wildcards } from '../src/lib/drizzle/schema/taxonomy/wildcards';
import { notesEffectRouter } from '../src/server/routes/secondary-services.effect';
import { wildcardsEffectRouter } from '../src/server/routes/secondary-services.effect';
import favoritesEffectRouter from '../src/server/routes/favorites.effect';
import { promptsEffectRouter } from '../src/server/routes/prompts.effect';
import taxonomyArtifactsRouter from '../src/server/routes/taxonomy-artifacts';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';
import { sanitizeJsonResponses } from '../src/server/security/sanitize-public-payload';

const temporaryDirectories: string[] = [];

function createApp(registry: Awaited<ReturnType<typeof createAuthorizedRootRegistry>>) {
	const app = express();
	app.locals.authorizedRootRegistry = registry;
	app.use(express.json());
	app.use('/api', sanitizeJsonResponses);
	app.use('/api/taxonomy-artifacts', taxonomyArtifactsRouter);
	app.use('/api/favorites', favoritesEffectRouter);
	app.use('/api/notes', notesEffectRouter);
	app.use('/api/prompts', promptsEffectRouter);
	app.use('/api/wildcards', wildcardsEffectRouter);
	return app;
}

afterEach(async () => {
	await db.delete(imagePrompts);
	await db.delete(taxonomyArtifacts);
	await db.delete(notes);
	await db.delete(prompts);
	await db.delete(wildcards);
	await db.delete(images);
	await db.delete(folders);
	await db.delete(mediaRoots);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('taxonomy artifact HTTP contract', () => {
	it('round-trips inline Prompt content and portable editor metadata', async () => {
		const app = createApp(await createAuthorizedRootRegistry([]));
		const metadata = JSON.stringify({
			parameters: [{ custom: false, key: 'subject', type: 'text' }],
			purpose: 'Preserve the inline editor contract',
		});
		const created = await request(app)
			.post('/api/prompts')
			.send({
				content: 'Inline body',
				metadata,
				name: `Inline ${crypto.randomUUID()}`,
				type: 'gpt-4',
			});

		expect(created.status, JSON.stringify(created.body)).toBe(201);
		expect(created.body).toMatchObject({ content: 'Inline body', metadata, type: 'gpt-4' });
		const reopened = await request(app).get(`/api/prompts/${created.body.id}`);
		expect(reopened.status).toBe(200);
		expect(reopened.body).toMatchObject({ content: 'Inline body', metadata, type: 'gpt-4' });
	});

	it('never serves indexed authored content from a root absent from the active authorization registry', async () => {
		const allowedPath = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-allowed-'));
		const deniedPath = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-denied-'));
		temporaryDirectories.push(allowedPath, deniedPath);
		const allowedRootId = `taxonomy-${crypto.randomUUID()}`;
		const deniedRootId = `taxonomy-${crypto.randomUUID()}`;
		const inlineNoteId = `note-${crypto.randomUUID()}`;
		const inlinePromptId = `prompt-${crypto.randomUUID()}`;
		const inlineWildcardId = `wildcard-${crypto.randomUUID()}`;
		const deniedNoteId = `note-${crypto.randomUUID()}`;
		const deniedPromptId = `prompt-${crypto.randomUUID()}`;
		const deniedWildcardId = `wildcard-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values([
			{ id: allowedRootId, label: 'Allowed' },
			{ id: deniedRootId, label: 'Denied' },
		]);
		await db.insert(notes).values([
			{ createdAt: new Date(1_000), id: inlineNoteId, title: 'Visible inline' },
			{ createdAt: new Date(2_000), id: deniedNoteId, content: 'Secret note body', title: 'Secret note' },
		]);
		await db.insert(prompts).values([
			{ createdAt: new Date(1_000), id: inlinePromptId, name: 'Visible prompt' },
			{ createdAt: new Date(2_000), id: deniedPromptId, content: 'Secret prompt body', name: 'Secret prompt' },
		]);
		await db.insert(wildcards).values([
			{ createdAt: new Date(1_000), id: inlineWildcardId, name: 'Visible wildcard' },
			{
				children: JSON.stringify(['Secret wildcard value']),
				createdAt: new Date(2_000),
				id: deniedWildcardId,
				name: 'Secret wildcard',
			},
		]);
		await db.insert(taxonomyArtifacts).values(
			[
				['note', deniedNoteId, 'Secret note', 'Secret note body'],
				['prompt', deniedPromptId, 'Secret prompt', 'Secret prompt body'],
				['wildcard', deniedWildcardId, 'Secret wildcard', 'Secret wildcard value'],
			].map(([entityType, entityId, indexedTitle, indexedBody]) => ({
				byteSize: 100,
				contentHash: 'a'.repeat(64),
				entityId,
				entityType,
				indexedBody,
				indexedTitle,
				relativePath: `taxonomy/${entityType}s/${entityId}.md`,
				rootId: deniedRootId,
			})) as (typeof taxonomyArtifacts.$inferInsert)[]
		);
		const registry = await createAuthorizedRootRegistry([
			{ id: allowedRootId, path: allowedPath, permissions: ['read', 'index'] },
		]);
		const app = createApp(registry);

		const search = await request(app).get('/api/taxonomy-artifacts/search').query({ q: 'Secret' });
		expect(search.status).toBe(200);
		expect(search.body.data).toEqual([]);
		const noteList = await request(app).get('/api/notes').query({ limit: 1 });
		expect(noteList.status).toBe(200);
		expect(noteList.body.data.map((row: { id: string }) => row.id)).toEqual([inlineNoteId]);
		expect(noteList.body.total).toBe(1);
		const promptList = await request(app).get('/api/prompts').query({ limit: 1 });
		expect(promptList.body.data.map((row: { id: string }) => row.id)).toEqual([inlinePromptId]);
		expect(promptList.body.pagination.total).toBe(1);
		const wildcardList = await request(app).get('/api/wildcards').query({ limit: 1 });
		expect(wildcardList.body.data.map((row: { id: string }) => row.id)).toEqual([inlineWildcardId]);
		expect(wildcardList.body.total).toBe(1);
		const deniedNote = await request(app).get(`/api/notes/${deniedNoteId}`);
		const missingNote = await request(app).get('/api/notes/missing-note');
		expect(deniedNote.status).toBe(404);
		expect(missingNote.status).toBe(404);
		expect(deniedNote.body).toEqual(missingNote.body);
		const deniedPrompt = await request(app).get(`/api/prompts/${deniedPromptId}`);
		const missingPrompt = await request(app).get('/api/prompts/missing-prompt');
		expect(deniedPrompt.status).toBe(404);
		expect(deniedPrompt.body).toEqual(missingPrompt.body);
		const deniedWildcard = await request(app).get(`/api/wildcards/${deniedWildcardId}`);
		const missingWildcard = await request(app).get('/api/wildcards/missing-wildcard');
		expect(deniedWildcard.status).toBe(404);
		expect(deniedWildcard.body).toEqual(missingWildcard.body);
		const deniedNoteUpdate = await request(app).put(`/api/notes/${deniedNoteId}`).send({ title: 'Probe' });
		expect(deniedNoteUpdate.status).toBe(404);
		expect(deniedNoteUpdate.body).toEqual(missingNote.body);
		expect((await request(app).delete(`/api/prompts/${deniedPromptId}`)).status).toBe(404);
		expect((await request(app).get(`/api/notes/${deniedNoteId}/images`)).status).toBe(404);
		expect((await request(app).post(`/api/wildcards/${deniedWildcardId}/images/missing-image`).send()).status).toBe(
			404
		);
		expect(
			(await request(app).post('/api/favorites/toggle').send({ entityId: deniedNoteId, entityType: 'note' })).status
		).toBe(404);
		expect(
			(await request(app).get('/api/favorites/check').query({ entityId: deniedWildcardId, entityType: 'wildcard' }))
				.status
		).toBe(404);
		expect((await request(app).delete('/api/notes/missing-note')).status).toBe(404);
		expect((await request(app).delete('/api/wildcards/missing-wildcard')).status).toBe(404);
		const invalidPrompt = await request(app).post('/api/prompts').send({});
		expect(invalidPrompt.status).toBe(400);
		expect(invalidPrompt.body).toMatchObject({ code: 'PROMPT_VALIDATION_ERROR' });
		const invalidNote = await request(app).post('/api/notes').send({});
		expect(invalidNote.status).toBe(400);
		expect(invalidNote.body).toMatchObject({ code: 'ROUTE_VALIDATION_ERROR' });
		const invalidWildcard = await request(app).post('/api/wildcards').send({});
		expect(invalidWildcard.status).toBe(400);
		expect(invalidWildcard.body).toMatchObject({ code: 'ROUTE_VALIDATION_ERROR' });
		const duplicateNote = await request(app).post('/api/notes').send({ title: 'Visible inline' });
		expect(duplicateNote.status).toBe(409);
		expect(duplicateNote.body).toMatchObject({ code: 'NOTE_TITLE_CONFLICT' });
	});

	it('externalizes, reconciles, searches literally, blocks inline writes and deletes coherently', async () => {
		const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-http-'));
		temporaryDirectories.push(rootPath);
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const noteId = `note-${crypto.randomUUID()}`;
		const otherNoteId = `note-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values({ id: rootId, label: 'Taxonomy HTTP' });
		await db.insert(notes).values([
			{ id: noteId, title: 'Inline' },
			{ id: otherNoteId, title: 'Other inline' },
		]);
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ['read', 'write', 'delete', 'index'] },
		]);
		const app = createApp(registry);
		const created = await request(app)
			.put(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ body: 'Canonical body', metadata: { title: '100% literal' }, rootId });
		expect(created.status, JSON.stringify(created.body)).toBe(200);
		expect(created.body).toMatchObject({
			body: 'Canonical body',
			entity: { content: 'Canonical body', id: noteId, title: '100% literal' },
			entityId: noteId,
			entityType: 'note',
			relativePath: `taxonomy/notes/${noteId}.md`,
			rootId,
			syncStatus: 'synced',
		});
		expect(JSON.stringify(created.body)).not.toContain(rootPath);

		const other = await request(app)
			.put(`/api/taxonomy-artifacts/note/${otherNoteId}`)
			.send({ body: 'Other body', metadata: { title: '100x literal' }, rootId });
		expect(other.status).toBe(200);
		const literalSearch = await request(app).get('/api/taxonomy-artifacts/search').query({ q: '%' });
		expect(literalSearch.status).toBe(200);
		expect(literalSearch.body.data.map((row: { entityId: string }) => row.entityId)).toEqual([noteId]);

		expect((await request(app).get(`/api/taxonomy-artifacts/note/${noteId}`)).status).toBe(200);
		const stale = await request(app)
			.put(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ body: 'Stale', expectedHash: '0'.repeat(64), metadata: { title: 'Stale' } });
		expect(stale.status).toBe(409);
		expect(stale.body.code).toBe('ARTIFACT_CONFLICT');

		const invalidRename = await request(app)
			.patch(`/api/taxonomy-artifacts/note/${noteId}/location`)
			.send({ expectedHash: created.body.contentHash, fileName: '../escape.md' });
		expect(invalidRename.status).toBe(400);
		expect(invalidRename.body.code).toBe('ARTIFACT_VALIDATION');

		const blockedUpdate = await request(app).put(`/api/notes/${noteId}`).send({ title: 'Bypass' });
		const blockedDelete = await request(app).delete(`/api/notes/${noteId}`);
		expect(blockedUpdate.status).toBe(409);
		expect(blockedDelete.status).toBe(409);
		expect(blockedDelete.body.code).toBe('ARTIFACT_FILE_BACKED');

		const staleDelete = await request(app)
			.delete(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ expectedHash: 'f'.repeat(64) });
		expect(staleDelete.status).toBe(409);
		expect(staleDelete.body.code).toBe('ARTIFACT_CONFLICT');
		expect((await stat(join(rootPath, created.body.relativePath))).isFile()).toBe(true);

		const deleted = await request(app)
			.delete(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ expectedHash: created.body.contentHash });
		expect(deleted.status, JSON.stringify(deleted.body)).toBe(204);
		expect(await db.select({ id: notes.id }).from(notes).where(eq(notes.id, noteId))).toEqual([]);
		expect(
			await db
				.select()
				.from(taxonomyArtifacts)
				.where(and(eq(taxonomyArtifacts.entityType, 'note'), eq(taxonomyArtifacts.entityId, noteId)))
		).toEqual([]);
		await expect(stat(join(rootPath, created.body.relativePath))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('preserves authored path-like text through both JSON sanitizers without exposing the configured root', async () => {
		const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-authored-text-'));
		temporaryDirectories.push(rootPath);
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const noteId = `note-${crypto.randomUUID()}`;
		const authoredBody = String.raw`Abra C:\Users\author\notes.md y /home/author/reference.txt`;
		const authoredTitle = String.raw`Mapa C:\Archive\catalog.md`;
		await db.insert(mediaRoots).values({ id: rootId, label: 'Authored text' });
		await db.insert(notes).values({ id: noteId, title: 'Inline' });
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ['read', 'write', 'delete', 'index'] },
		]);
		const app = createApp(registry);

		const saved = await request(app)
			.put(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ body: authoredBody, metadata: { summary: authoredBody, title: authoredTitle }, rootId });
		expect(saved.status, JSON.stringify(saved.body)).toBe(200);
		expect(saved.body).toMatchObject({
			body: authoredBody,
			metadata: { summary: authoredBody, title: authoredTitle },
		});
		expect(JSON.stringify(saved.body)).not.toContain(rootPath);

		const reopened = await request(app).get(`/api/taxonomy-artifacts/note/${noteId}`);
		expect(reopened.status).toBe(200);
		expect(reopened.body).toMatchObject({
			body: authoredBody,
			metadata: { summary: authoredBody, title: authoredTitle },
		});
		const searched = await request(app).get('/api/taxonomy-artifacts/search').query({ q: 'reference.txt' });
		expect(searched.status).toBe(200);
		expect(searched.body.data).toMatchObject([{ entityId: noteId, indexedBody: authoredBody }]);
		expect(JSON.stringify(searched.body)).not.toContain(rootPath);
	});

	it('rejects file-backed writes when the root lacks write permission', async () => {
		const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-readonly-'));
		temporaryDirectories.push(rootPath);
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const noteId = `note-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values({ id: rootId, label: 'Read-only taxonomy' });
		await db.insert(notes).values({ id: noteId, title: 'Read only' });
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ['read', 'index'] },
		]);

		const response = await request(createApp(registry))
			.put(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ body: 'Denied', metadata: { title: 'Denied' }, rootId });
		expect(response.status).toBe(403);
		expect(response.body.code).toBe('ROOT_PERMISSION_DENIED');
		expect(JSON.stringify(response.body)).not.toContain(rootPath);
	});

	it('returns a typed 409 and restores the canonical file when Prompt deletion is blocked by relations', async () => {
		const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-delete-conflict-'));
		temporaryDirectories.push(rootPath);
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const promptId = `prompt-${crypto.randomUUID()}`;
		const folderId = `folder-${crypto.randomUUID()}`;
		const imageId = `image-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values({ id: rootId, label: 'Delete conflict' });
		const imagePath = join(rootPath, `${imageId}.png`);
		await writeFile(imagePath, 'fixture image', 'utf8');
		await db.insert(folders).values({ id: folderId, name: 'Fixture', path: rootPath });
		await db.insert(images).values({
			folderId,
			hash: 'b'.repeat(64),
			height: 1,
			id: imageId,
			name: 'Fixture image',
			path: imagePath,
			size: 1,
			width: 1,
		});
		await db.insert(prompts).values({ id: promptId, name: 'Protected prompt' });
		await db.insert(imagePrompts).values({ A: imageId, B: promptId });
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ['read', 'write', 'delete', 'index'] },
		]);
		const app = createApp(registry);
		const created = await request(app)
			.put(`/api/taxonomy-artifacts/prompt/${promptId}`)
			.send({
				body: 'Protected body',
				metadata: { purpose: 'Exercise typed delete conflicts', title: 'Protected prompt' },
				rootId,
			});
		expect(created.status, JSON.stringify(created.body)).toBe(200);

		const response = await request(app)
			.delete(`/api/taxonomy-artifacts/prompt/${promptId}`)
			.send({ expectedHash: created.body.contentHash });

		expect(response.status).toBe(409);
		expect(response.body).toMatchObject({ code: 'PROMPT_HAS_RELATIONS' });
		expect(await db.select({ id: prompts.id }).from(prompts).where(eq(prompts.id, promptId))).toEqual([
			{ id: promptId },
		]);
		expect(await db.select().from(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, promptId))).toHaveLength(1);
		expect((await stat(join(rootPath, created.body.relativePath))).isFile()).toBe(true);

		const detached = await request(app).delete(`/api/prompts/${promptId}/images/${imageId}`);
		expect(detached.status, JSON.stringify(detached.body)).toBe(204);
		expect(await db.select().from(imagePrompts).where(eq(imagePrompts.B, promptId))).toEqual([]);
		const deleted = await request(app)
			.delete(`/api/taxonomy-artifacts/prompt/${promptId}`)
			.send({ expectedHash: created.body.contentHash });
		expect(deleted.status, JSON.stringify(deleted.body)).toBe(204);
		expect(await db.select({ id: prompts.id }).from(prompts).where(eq(prompts.id, promptId))).toEqual([]);
		await expect(stat(join(rootPath, created.body.relativePath))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('creates Wildcards file-backed by default and keeps operational fields in the same projection commit', async () => {
		const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-wildcard-file-backed-'));
		temporaryDirectories.push(rootPath);
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values({ id: rootId, label: 'Wildcard library' });
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ['read', 'write', 'delete', 'index'] },
		]);
		const app = createApp(registry);
		const rejected = await request(app)
			.post('/api/taxonomy-artifacts/wildcard')
			.send({ body: 'duplicado\nduplicado', metadata: { title: 'Invalid' }, rootId });
		expect(rejected.status).toBe(400);
		expect(await db.select({ id: wildcards.id }).from(wildcards)).toEqual([]);

		const created = await request(app)
			.post('/api/taxonomy-artifacts/wildcard')
			.send({
				body: ' rojo \n\nverde',
				metadata: { category: 'color', summary: 'Palette', title: 'Colors' },
				operational: { shortcut: 'colors' },
				rootId,
			});
		expect(created.status, JSON.stringify(created.body)).toBe(201);
		expect(created.body.artifact).toMatchObject({ body: 'rojo\nverde', entityType: 'wildcard', rootId });
		expect(created.body.entity).toMatchObject({
			category: 'color',
			children: JSON.stringify(['rojo', 'verde']),
			description: 'Palette',
			name: 'Colors',
			shortcut: 'colors',
		});

		const entityId = created.body.entity.id as string;
		const updated = await request(app)
			.put(`/api/taxonomy-artifacts/wildcard/${entityId}`)
			.send({
				body: 'azul\namarillo',
				expectedHash: created.body.artifact.contentHash,
				metadata: { title: 'Updated colors' },
				operational: { shortcut: 'updated' },
			});
		expect(updated.status, JSON.stringify(updated.body)).toBe(200);
		expect(await db.select().from(wildcards).where(eq(wildcards.id, entityId))).toMatchObject([
			{
				children: JSON.stringify(['azul', 'amarillo']),
				name: 'Updated colors',
				shortcut: 'updated',
			},
		]);
		expect((await stat(join(rootPath, updated.body.relativePath))).isFile()).toBe(true);

		const deleted = await request(app)
			.delete(`/api/taxonomy-artifacts/wildcard/${entityId}`)
			.send({ expectedHash: updated.body.contentHash });
		expect(deleted.status, JSON.stringify(deleted.body)).toBe(204);
		expect(await db.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.id, entityId))).toEqual([]);
		await expect(stat(join(rootPath, updated.body.relativePath))).rejects.toMatchObject({ code: 'ENOENT' });
	});
});
