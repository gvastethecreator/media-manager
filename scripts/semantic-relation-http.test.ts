import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { mediaRoots } from '../src/lib/drizzle/schema/media-core/assets';
import { semanticRelations } from '../src/lib/drizzle/schema/relations/semantic';
import { notes } from '../src/lib/drizzle/schema/taxonomy/notes';
import { prompts } from '../src/lib/drizzle/schema/taxonomy/prompts';
import { taxonomyArtifacts } from '../src/lib/drizzle/schema/taxonomy/artifacts';
import semanticRelationsRouter from '../src/server/routes/semantic-relations';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await db.delete(semanticRelations);
	await db.delete(taxonomyArtifacts);
	await db.delete(notes);
	await db.delete(prompts);
	await db.delete(mediaRoots);
	for (const directory of temporaryDirectories.splice(0)) await rm(directory, { force: true, recursive: true });
});

function createApp(registry: Awaited<ReturnType<typeof createAuthorizedRootRegistry>>) {
	const app = express();
	app.locals.authorizedRootRegistry = registry;
	app.use(express.json());
	app.use('/api/semantic-relations', semanticRelationsRouter);
	return app;
}

describe('semantic relation HTTP contract', () => {
	it('creates one directed row, derives inverse presentation and rejects derived cycles', async () => {
		await db.insert(notes).values([
			{ id: 'note-a', title: 'A' },
			{ id: 'note-b', title: 'B' },
			{ id: 'note-c', title: 'C' },
		]);
		await db.insert(prompts).values({ id: 'prompt-target', name: 'Prompt target' });
		const app = createApp(await createAuthorizedRootRegistry([]));
		const roles = await request(app).get('/api/semantic-relations/roles');
		expect(roles.status).toBe(200);
		expect(roles.body.data.map((role: { slug: string }) => role.slug)).toEqual([
			'derived_from',
			'inspired_by',
			'references',
			'variant_of',
		]);

		const created = await request(app)
			.post('/api/semantic-relations')
			.send({
				roleSlug: 'references',
				source: { id: 'note-a', type: 'note' },
				target: { id: 'prompt-target', type: 'prompt' },
			});
		expect(created.status, JSON.stringify(created.body)).toBe(201);
		const inverse = await request(app)
			.get('/api/semantic-relations')
			.query({ entityId: 'prompt-target', entityType: 'prompt' });
		expect(inverse.status).toBe(200);
		expect(inverse.body.data).toMatchObject([
			{ direction: 'inverse', label: 'referenced_by', other: { id: 'note-a', type: 'note' } },
		]);

		for (const [sourceId, targetId] of [
			['note-a', 'note-b'],
			['note-b', 'note-c'],
		]) {
			expect(
				(
					await request(app)
						.post('/api/semantic-relations')
						.send({
							roleSlug: 'derived_from',
							source: { id: sourceId, type: 'note' },
							target: { id: targetId, type: 'note' },
						})
				).status
			).toBe(201);
		}
		const cycle = await request(app)
			.post('/api/semantic-relations')
			.send({
				roleSlug: 'derived_from',
				source: { id: 'note-c', type: 'note' },
				target: { id: 'note-a', type: 'note' },
			});
		expect(cycle.status).toBe(409);
		expect(cycle.body.code).toBe('RELATION_CYCLE');

		expect((await request(app).delete(`/api/semantic-relations/${created.body.id}`)).status).toBe(204);
	});

	it('authorizes the complete relation set before applying pagination', async () => {
		const rootPath = await mkdtemp(join(tmpdir(), 'media-manager-semantic-allowed-'));
		temporaryDirectories.push(rootPath);
		const allowedRootId = `root-${crypto.randomUUID()}`;
		const deniedRootId = `root-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values([
			{ id: allowedRootId, label: 'Allowed' },
			{ id: deniedRootId, label: 'Denied' },
		]);
		await db.insert(notes).values([
			{ id: 'note-visible', title: 'Visible' },
			{ id: 'note-public', title: 'Public' },
			{ id: 'note-secret', title: 'Secret', content: 'Secret content' },
		]);
		await db.insert(taxonomyArtifacts).values({
			byteSize: 100,
			contentHash: 'b'.repeat(64),
			entityId: 'note-secret',
			entityType: 'note',
			indexedBody: 'Secret content',
			indexedTitle: 'Secret',
			relativePath: 'taxonomy/notes/note-secret.md',
			rootId: deniedRootId,
		});
		await db.insert(semanticRelations).values([
			{
				createdAt: new Date(1_000),
				id: 'rel-secret',
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: 'note-visible',
				sourceType: 'note',
				targetId: 'note-secret',
				targetType: 'note',
			},
			{
				createdAt: new Date(2_000),
				id: 'rel-visible',
				roleKey: 'references',
				roleSlug: 'references',
				sourceId: 'note-visible',
				sourceType: 'note',
				targetId: 'note-public',
				targetType: 'note',
			},
		]);
		const registry = await createAuthorizedRootRegistry([
			{ id: allowedRootId, path: rootPath, permissions: ['read', 'index'] },
		]);
		const response = await request(createApp(registry))
			.get('/api/semantic-relations')
			.query({ entityId: 'note-visible', entityType: 'note', limit: 1 });
		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			data: [{ id: 'rel-visible', other: { id: 'note-public', type: 'note' } }],
			limit: 1,
			offset: 0,
			total: 1,
		});
	});
});
