import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq, inArray } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { profiles } from '../src/lib/drizzle/schema/core/profiles';
import { mediaRoots } from '../src/lib/drizzle/schema/media-core/assets';
import { favorites } from '../src/lib/drizzle/schema/organization/favorites';
import { notes } from '../src/lib/drizzle/schema/taxonomy/notes';
import { prompts } from '../src/lib/drizzle/schema/taxonomy/prompts';
import { taxonomyArtifacts } from '../src/lib/drizzle/schema/taxonomy/artifacts';
import { wildcards } from '../src/lib/drizzle/schema/taxonomy/wildcards';
import charactersRouter from '../src/server/routes/characters.effect';
import favoritesRouter from '../src/server/routes/favorites.effect';
import { promptsEffectRouter } from '../src/server/routes/prompts.effect';
import { notesEffectRouter, wildcardsEffectRouter } from '../src/server/routes/secondary-services.effect';
import taxonomyArtifactsRouter from '../src/server/routes/taxonomy-artifacts';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';

const entityIds: string[] = [];
const favoriteIds: string[] = [];
const profileIds: string[] = [];
const rootIds: string[] = [];
const temporaryDirectories: string[] = [];

function createApp(registry: Awaited<ReturnType<typeof createAuthorizedRootRegistry>>) {
	const app = express();
	app.locals.authorizedRootRegistry = registry;
	app.use(express.json());
	app.use('/api/characters', charactersRouter);
	app.use('/api/favorites', favoritesRouter);
	app.use('/api/notes', notesEffectRouter);
	app.use('/api/prompts', promptsEffectRouter);
	app.use('/api/taxonomy-artifacts', taxonomyArtifactsRouter);
	app.use('/api/wildcards', wildcardsEffectRouter);
	return app;
}

afterEach(async () => {
	if (favoriteIds.length > 0) await db.delete(favorites).where(inArray(favorites.id, favoriteIds));
	if (entityIds.length > 0) {
		await db.delete(taxonomyArtifacts).where(inArray(taxonomyArtifacts.entityId, entityIds));
		await db.delete(notes).where(inArray(notes.id, entityIds));
		await db.delete(prompts).where(inArray(prompts.id, entityIds));
		await db.delete(wildcards).where(inArray(wildcards.id, entityIds));
	}
	if (profileIds.length > 0) await db.delete(profiles).where(inArray(profiles.id, profileIds));
	if (rootIds.length > 0) await db.delete(mediaRoots).where(inArray(mediaRoots.id, rootIds));
	entityIds.splice(0);
	favoriteIds.splice(0);
	profileIds.splice(0);
	rootIds.splice(0);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('taxonomy root permission contract', () => {
	it('allows reads but denies every direct and nested mutation on a read-only root', async () => {
		const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-permissions-'));
		temporaryDirectories.push(rootPath);
		const rootId = `readonly-root-${crypto.randomUUID()}`;
		rootIds.push(rootId);
		await db.insert(mediaRoots).values({ id: rootId, label: 'Read-only taxonomy root' });
		const ids = {
			note: `readonly-note-${crypto.randomUUID()}`,
			prompt: `readonly-prompt-${crypto.randomUUID()}`,
			wildcard: `readonly-wildcard-${crypto.randomUUID()}`,
		};
		entityIds.push(...Object.values(ids));
		await db.insert(notes).values({ id: ids.note, title: 'Read-only note' });
		await db.insert(prompts).values({ id: ids.prompt, name: 'Read-only prompt' });
		await db.insert(wildcards).values({ id: ids.wildcard, name: 'Read-only wildcard' });
		await db.insert(taxonomyArtifacts).values(
			Object.entries(ids).map(([entityType, entityId]) => ({
				byteSize: 10,
				contentHash: 'd'.repeat(64),
				entityId,
				entityType,
				indexedBody: 'Read-only body',
				indexedTitle: `Read-only ${entityType}`,
				relativePath: `taxonomy/${entityType}s/${entityId}.md`,
				rootId,
			})) as (typeof taxonomyArtifacts.$inferInsert)[]
		);

		let [activeProfile] = await db
			.select({ id: profiles.id })
			.from(profiles)
			.where(eq(profiles.isActive, true))
			.limit(1);
		if (!activeProfile) {
			const profileId = `readonly-profile-${crypto.randomUUID()}`;
			profileIds.push(profileId);
			await db.insert(profiles).values({ id: profileId, isActive: true, name: 'Read-only permission test' });
			activeProfile = { id: profileId };
		}
		const favoriteId = `readonly-favorite-${crypto.randomUUID()}`;
		favoriteIds.push(favoriteId);
		await db.insert(favorites).values({
			entityId: ids.note,
			entityType: 'note',
			id: favoriteId,
			profileId: activeProfile.id,
		});

		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ['read', 'index'] },
		]);
		const app = createApp(registry);
		for (const [path, id] of [
			['notes', ids.note],
			['prompts', ids.prompt],
			['wildcards', ids.wildcard],
		] as const) {
			expect((await request(app).get(`/api/${path}/${id}`)).status).toBe(200);
			expect((await request(app).put(`/api/${path}/${id}`).send({})).status).toBe(403);
			expect((await request(app).delete(`/api/${path}/${id}`)).status).toBe(403);
		}
		expect((await request(app).get(`/api/notes/${ids.note}/images`)).status).toBe(200);

		const mutations = [
			request(app).post(`/api/prompts/${ids.prompt}/images/missing-image`).send(),
			request(app).post(`/api/wildcards/${ids.wildcard}/images/missing-image`).send(),
			request(app).post(`/api/notes/${ids.note}/images/missing-image`).send(),
			request(app).delete(`/api/notes/${ids.note}/images/missing-image`),
			request(app).post(`/api/notes/${ids.note}/videos/missing-video`).send(),
			request(app).delete(`/api/notes/${ids.note}/videos/missing-video`),
			request(app).post(`/api/characters/missing-character/notes/${ids.note}`).send(),
			request(app).delete(`/api/characters/missing-character/notes/${ids.note}`),
			request(app).post('/api/favorites/toggle').send({ entityId: ids.note, entityType: 'note' }),
			request(app).put('/api/favorites/state').send({ entityId: ids.note, entityType: 'note', isFavorite: false }),
			request(app).delete(`/api/favorites/${favoriteId}`),
			request(app)
				.put(`/api/taxonomy-artifacts/note/${ids.note}`)
				.send({ body: 'Denied', metadata: { title: 'Denied' } }),
			request(app)
				.patch(`/api/taxonomy-artifacts/note/${ids.note}/location`)
				.send({ expectedHash: 'd'.repeat(64), fileName: 'denied.md' }),
			request(app)
				.delete(`/api/taxonomy-artifacts/note/${ids.note}`)
				.send({ expectedHash: 'd'.repeat(64) }),
			request(app)
				.post('/api/taxonomy-artifacts/wildcard')
				.send({ body: 'Denied', metadata: { title: 'Denied' }, rootId }),
		];
		for (const mutation of mutations) {
			const response = await mutation;
			expect(response.status, JSON.stringify(response.body)).toBe(403);
			expect(response.body).toMatchObject({ code: 'ROOT_PERMISSION_DENIED' });
		}
	});

	it('returns not found for entities whose root was withdrawn, including indirect mutation routes', async () => {
		const rootId = `withdrawn-root-${crypto.randomUUID()}`;
		const noteId = `withdrawn-note-${crypto.randomUUID()}`;
		rootIds.push(rootId);
		entityIds.push(noteId);
		await db.insert(mediaRoots).values({ id: rootId, label: 'Withdrawn taxonomy root' });
		await db.insert(notes).values({ id: noteId, title: 'Withdrawn note' });
		await db.insert(taxonomyArtifacts).values({
			byteSize: 10,
			contentHash: 'e'.repeat(64),
			entityId: noteId,
			entityType: 'note',
			indexedBody: 'Withdrawn body',
			indexedTitle: 'Withdrawn note',
			relativePath: `taxonomy/notes/${noteId}.md`,
			rootId,
		});
		const app = createApp(await createAuthorizedRootRegistry([]));

		const withdrawn = await request(app).get(`/api/notes/${noteId}`);
		const missing = await request(app).get('/api/notes/missing-note');
		expect(withdrawn.status).toBe(404);
		expect(withdrawn.body).toEqual(missing.body);
		for (const response of [
			await request(app).put(`/api/notes/${noteId}`).send({ title: 'Probe' }),
			await request(app).delete(`/api/notes/${noteId}`),
			await request(app).post(`/api/characters/missing-character/notes/${noteId}`).send(),
			await request(app).post('/api/favorites/toggle').send({ entityId: noteId, entityType: 'note' }),
			await request(app).get(`/api/taxonomy-artifacts/note/${noteId}`),
		]) {
			expect(response.status).toBe(404);
		}
	});
});
