import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { mediaRoots } from '@/lib/drizzle/schema/media-core/assets';
import { notes } from '@/lib/drizzle/schema/taxonomy/notes';
import { prompts } from '@/lib/drizzle/schema/taxonomy/prompts';
import { taxonomyArtifactDeletionLedger, taxonomyArtifacts } from '@/lib/drizzle/schema/taxonomy/artifacts';
import { wildcards } from '@/lib/drizzle/schema/taxonomy/wildcards';
import { createAuthorizedRootRegistry } from '@/server/security/authorized-roots';
import type { FavoriteWriteTransaction } from '@/services/favorite/favorite-write-transaction';
import {
	ArtifactConflictError,
	ArtifactValidationError,
	computeArtifactHash,
	createArtifactDeletionTombstone,
	createArtifactPathAuthority,
	generateFrontmatter,
	quarantineArtifactFile,
	writeArtifactFile,
} from './file-backed.service';
import {
	deleteTaxonomyArtifactWithEntity,
	filterAuthorizedTaxonomyEntities,
	readAndReconcileTaxonomyArtifact,
	rebuildTaxonomyArtifactIndex,
	relocateTaxonomyArtifact,
	saveTaxonomyArtifact,
	searchTaxonomyArtifacts,
} from './taxonomy-artifact.service';

const temporaryDirectories: string[] = [];

async function createTestRoot(rootId: string, persist = true) {
	const path = await mkdtemp(join(tmpdir(), 'media-manager-taxonomy-manager-'));
	temporaryDirectories.push(path);
	const registry = await createAuthorizedRootRegistry([
		{ id: rootId, path, permissions: ['read', 'write', 'delete', 'index'] },
	]);
	if (persist) await db.insert(mediaRoots).values({ id: rootId, label: `Taxonomy ${rootId}` });
	return { path, registry };
}

function artifactPath(
	registry: Awaited<ReturnType<typeof createAuthorizedRootRegistry>>,
	rootId: string,
	relativePath: string,
	permission: 'delete' | 'read' | 'write' = 'write'
) {
	return createArtifactPathAuthority(
		{ relativePath, rootId },
		async (reference, mode) => (await registry.resolve(reference, permission, mode)).absolutePath
	);
}

afterEach(async () => {
	await db.delete(taxonomyArtifactDeletionLedger);
	await db.delete(taxonomyArtifacts);
	await db.delete(prompts);
	await db.delete(notes);
	await db.delete(wildcards);
	await db.delete(mediaRoots);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 20, recursive: true, retryDelay: 50 });
	}
});

describe('taxonomy artifact manager', () => {
	it('filters large taxonomy collections without exceeding SQLite bind-variable limits', async () => {
		const allowedRootId = `taxonomy-${crypto.randomUUID()}`;
		const deniedRootId = `taxonomy-${crypto.randomUUID()}`;
		const { registry } = await createTestRoot(allowedRootId);
		await createTestRoot(deniedRootId);
		const entities = Array.from({ length: 1_100 }, (_, index) => ({
			id: `bulk-note-${index}`,
			title: `Bulk note ${index}`,
		}));
		for (let offset = 0; offset < entities.length; offset += 100) {
			const batch = entities.slice(offset, offset + 100);
			await db.insert(notes).values(batch);
			await db.insert(taxonomyArtifacts).values(
				batch.map((entity, index) => ({
					byteSize: 4,
					contentHash: 'b'.repeat(64),
					entityId: entity.id,
					entityType: 'note' as const,
					indexedBody: 'Body',
					indexedTitle: entity.title,
					relativePath: `taxonomy/notes/${entity.id}.md`,
					rootId: (offset + index) % 2 === 0 ? allowedRootId : deniedRootId,
				}))
			);
		}

		const authorized = await filterAuthorizedTaxonomyEntities(registry, 'note', entities);

		expect(authorized).toHaveLength(550);
		expect(authorized.every((entity) => Number(entity.id.slice('bulk-note-'.length)) % 2 === 0)).toBe(true);
	});

	it('externalizes Prompt content and commits its DB search projection atomically', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `prompt-${crypto.randomUUID()}`;
		await db.insert(prompts).values({
			id: entityId,
			metadata: JSON.stringify({ operationalFlag: 'keep-me', parameters: [{ key: 'legacy' }] }),
			name: 'Inline prompt',
		});

		const document = await saveTaxonomyArtifact(registry, {
			body: 'Canonical prompt body',
			entityId,
			entityType: 'prompt',
			metadata: {
				category: 'operations',
				parameters: [
					{
						custom: true,
						default: 4,
						description: 'Number of recovery steps',
						key: 'steps',
						type: 'number',
					},
				],
				purpose: 'Recover safely',
				summary: 'A source-of-truth prompt',
				title: 'Recovery prompt',
			},
			rootId,
		});

		expect(document.relativePath).toBe(`taxonomy/prompts/${entityId}.md`);
		expect(await readFile(join(path, document.relativePath), 'utf8')).toContain('Canonical prompt body');
		expect(await db.select().from(prompts).where(eq(prompts.id, entityId))).toMatchObject([
			{
				category: 'operations',
				content: 'Canonical prompt body',
				description: 'A source-of-truth prompt',
				name: 'Recovery prompt',
			},
		]);
		expect(
			JSON.parse(
				(await db.select({ metadata: prompts.metadata }).from(prompts).where(eq(prompts.id, entityId)))[0]?.metadata ??
					'{}'
			)
		).toMatchObject({
			operationalFlag: 'keep-me',
			parameters: [{ custom: true, key: 'steps', type: 'number' }],
			purpose: 'Recover safely',
		});
		expect(await db.select().from(taxonomyArtifacts)).toMatchObject([
			{
				contentHash: document.contentHash,
				entityId,
				entityType: 'prompt',
				indexedBody: 'Canonical prompt body',
				indexedTitle: 'Recovery prompt',
				syncStatus: 'synced',
			},
		]);
	});

	it('lets an external file edit win and rebuilds Note projection deterministically', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Inline note' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'First body',
			entityId,
			entityType: 'note',
			metadata: { category: 'general', title: 'First title' },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);
		const externalDocument = generateFrontmatter(
			{ id: entityId, kind: 'note', schemaVersion: 1, category: 'research', title: 'External title' },
			'External body'
		);
		await writeArtifactFile(artifactPath(registry, rootId, created.relativePath), externalDocument, {
			expectedHash: created.contentHash,
		});

		const reconciled = await readAndReconcileTaxonomyArtifact(registry, 'note', entityId);

		expect(reconciled).toMatchObject({ body: 'External body', metadata: { title: 'External title' } });
		expect(await db.select().from(notes).where(eq(notes.id, entityId))).toMatchObject([
			{ category: 'research', content: 'External body', title: 'External title' },
		]);
		expect((await db.select().from(taxonomyArtifacts))[0]?.contentHash).toBe(reconciled?.contentHash);
	});

	it('marks invalid external content, hides its stale index and re-synchronizes exact restored bytes', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Safe note' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'Searchable canonical body',
			entityId,
			entityType: 'note',
			metadata: { title: 'Safe note' },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);
		const original = await readFile(absolutePath, 'utf8');
		await writeFile(absolutePath, `${original.replace('title:', 'unknown: true\ntitle:')}`, 'utf8');

		await expect(readAndReconcileTaxonomyArtifact(registry, 'note', entityId)).rejects.toBeInstanceOf(
			ArtifactValidationError
		);
		expect(
			(await db.select().from(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId)))[0]?.syncStatus
		).toBe('error');
		expect((await searchTaxonomyArtifacts({ authorizedRootIds: [rootId], query: 'Searchable' })).data).toEqual([]);
		expect(await rebuildTaxonomyArtifactIndex(registry, 'note')).toMatchObject({ error: 1, synced: 0, total: 1 });

		await writeFile(absolutePath, original, 'utf8');
		await expect(readAndReconcileTaxonomyArtifact(registry, 'note', entityId)).resolves.toMatchObject({
			body: 'Searchable canonical body',
			syncStatus: 'synced',
		});
		expect((await searchTaxonomyArtifacts({ authorizedRootIds: [rootId], query: 'Searchable' })).data).toMatchObject([
			{ entityId, syncStatus: 'synced' },
		]);
	});

	it('does not rewrite valid Prompt or Wildcard projections on stable reads', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { registry } = await createTestRoot(rootId);
		const promptId = `prompt-${crypto.randomUUID()}`;
		const wildcardId = `wildcard-${crypto.randomUUID()}`;
		await db.insert(prompts).values({ id: promptId, name: 'Stable prompt' });
		await db.insert(wildcards).values({ id: wildcardId, name: 'Stable wildcard' });
		await saveTaxonomyArtifact(registry, {
			body: 'Stable prompt body',
			entityId: promptId,
			entityType: 'prompt',
			metadata: { parameters: [], purpose: 'Remain stable', title: 'Stable prompt' },
			rootId,
		});
		await saveTaxonomyArtifact(registry, {
			body: 'one\ntwo',
			entityId: wildcardId,
			entityType: 'wildcard',
			metadata: { title: 'Stable wildcard' },
			rootId,
		});
		const before = await db
			.select({ entityId: taxonomyArtifacts.entityId, updatedAt: taxonomyArtifacts.updatedAt })
			.from(taxonomyArtifacts);

		await readAndReconcileTaxonomyArtifact(registry, 'prompt', promptId);
		await readAndReconcileTaxonomyArtifact(registry, 'wildcard', wildcardId);
		await readAndReconcileTaxonomyArtifact(registry, 'prompt', promptId);
		await readAndReconcileTaxonomyArtifact(registry, 'wildcard', wildcardId);

		expect(
			(
				await db
					.select({ entityId: taxonomyArtifacts.entityId, updatedAt: taxonomyArtifacts.updatedAt })
					.from(taxonomyArtifacts)
			).sort((left: { entityId: string }, right: { entityId: string }) => left.entityId.localeCompare(right.entityId))
		).toEqual(
			before.sort((left: { entityId: string }, right: { entityId: string }) =>
				left.entityId.localeCompare(right.entityId)
			)
		);
	});

	it('rejects stale app saves instead of overwriting a newer file version', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `wildcard-${crypto.randomUUID()}`;
		await db.insert(wildcards).values({ id: entityId, name: 'Inline wildcard' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'one',
			entityId,
			entityType: 'wildcard',
			metadata: { title: 'Wildcard' },
			rootId,
		});
		await writeArtifactFile(artifactPath(registry, rootId, created.relativePath), 'external', {
			expectedHash: created.contentHash,
		});

		await expect(
			saveTaxonomyArtifact(registry, {
				body: 'stale app body',
				entityId,
				entityType: 'wildcard',
				expectedHash: created.contentHash,
				metadata: { title: 'Wildcard' },
			})
		).rejects.toBeInstanceOf(ArtifactConflictError);
		expect(await readFile(join(path, created.relativePath), 'utf8')).toBe('external');
	});

	it('relocates inside the governed family and keeps the binding queryable', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Note' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'relocatable',
			entityId,
			entityType: 'note',
			metadata: { title: 'Relocatable note' },
			rootId,
		});

		const moved = await relocateTaxonomyArtifact(registry, {
			entityId,
			entityType: 'note',
			expectedHash: created.contentHash,
			fileName: 'renamed-note.md',
		});

		expect(moved.relativePath).toBe('taxonomy/notes/renamed-note.md');
		await expect(stat(join(path, created.relativePath))).rejects.toMatchObject({ code: 'ENOENT' });
		expect(await readFile(join(path, moved.relativePath), 'utf8')).toContain('relocatable');
		expect((await searchTaxonomyArtifacts({ authorizedRootIds: [rootId], query: 'Relocatable' })).data).toMatchObject([
			{ entityId },
		]);
	});

	it('restores the source when the binding disappears during rename commit', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: `Rename race ${entityId}` });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'rename race body',
			entityId,
			entityType: 'note',
			metadata: { title: `Rename race ${entityId}` },
			rootId,
		});
		await db.run(
			sql.raw(`CREATE TRIGGER TaxonomyArtifact_test_rename_race
				BEFORE UPDATE OF relativePath ON TaxonomyArtifact
				WHEN OLD.entityType = 'note' AND OLD.entityId = '${entityId}'
				BEGIN DELETE FROM TaxonomyArtifact WHERE entityType = OLD.entityType AND entityId = OLD.entityId; END`)
		);
		try {
			await expect(
				relocateTaxonomyArtifact(registry, {
					entityId,
					entityType: 'note',
					expectedHash: created.contentHash,
					fileName: 'rename-race-destination.md',
				})
			).rejects.toBeInstanceOf(ArtifactConflictError);
		} finally {
			await db.run(sql.raw('DROP TRIGGER IF EXISTS TaxonomyArtifact_test_rename_race'));
		}

		expect(await readFile(join(path, created.relativePath), 'utf8')).toContain('rename race body');
		await expect(stat(join(path, 'taxonomy/notes/rename-race-destination.md'))).rejects.toMatchObject({
			code: 'ENOENT',
		});
		expect(await db.select().from(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId))).toEqual([]);
		expect(await rebuildTaxonomyArtifactIndex(registry, 'note')).toMatchObject({ adopted: 1, error: 0, synced: 1 });
	});

	it('marks a missing canonical file without deleting authored DB identity', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Survivor' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'offline',
			entityId,
			entityType: 'note',
			metadata: {
				category: 'research',
				color: 'amber',
				emoji: '🧭',
				summary: 'Metadata that only the canonical artifact can represent',
				title: 'Survivor',
			},
			rootId,
		});
		await db.update(taxonomyArtifacts).set({ authoredMetadata: '{}' }).where(eq(taxonomyArtifacts.entityId, entityId));
		await expect(readAndReconcileTaxonomyArtifact(registry, 'note', entityId)).resolves.toMatchObject({
			metadata: { color: 'amber', emoji: '🧭' },
			syncStatus: 'synced',
		});
		expect(
			JSON.parse(
				(
					await db
						.select({ authoredMetadata: taxonomyArtifacts.authoredMetadata })
						.from(taxonomyArtifacts)
						.where(eq(taxonomyArtifacts.entityId, entityId))
				)[0]?.authoredMetadata ?? '{}'
			)
		).toMatchObject({ color: 'amber', emoji: '🧭', id: entityId, kind: 'note' });
		await rm(join(path, created.relativePath));

		expect(await readAndReconcileTaxonomyArtifact(registry, 'note', entityId)).toMatchObject({
			entityId,
			metadata: {
				category: 'research',
				color: 'amber',
				emoji: '🧭',
				summary: 'Metadata that only the canonical artifact can represent',
				title: 'Survivor',
			},
			syncStatus: 'missing',
		});
		expect(await db.select({ id: notes.id }).from(notes).where(eq(notes.id, entityId))).toEqual([{ id: entityId }]);
		expect((await db.select().from(taxonomyArtifacts))[0]?.syncStatus).toBe('missing');
	});

	it('fails before writing when the authorized root is absent from persistent identity', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId, false);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'No root' });

		await expect(
			saveTaxonomyArtifact(registry, {
				body: 'must not leak',
				entityId,
				entityType: 'note',
				metadata: { title: 'No root' },
				rootId,
			})
		).rejects.toThrow();
		await expect(readFile(join(path, 'taxonomy', 'notes', `${entityId}.md`), 'utf8')).rejects.toMatchObject({
			code: 'ENOENT',
		});
	});

	it('adopts an interrupted unbound file and recovers an external rename by stable identity', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const adoptedId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: adoptedId, title: 'Interrupted' });
		const adoptedRelativePath = `taxonomy/notes/${adoptedId}.md`;
		await writeArtifactFile(
			artifactPath(registry, rootId, adoptedRelativePath),
			generateFrontmatter({ id: adoptedId, kind: 'note', schemaVersion: 1, title: 'Recovered after crash' }, 'File won')
		);

		const adopted = await rebuildTaxonomyArtifactIndex(registry, 'note');
		expect(adopted).toMatchObject({ adopted: 1, error: 0, synced: 1 });
		expect(await readAndReconcileTaxonomyArtifact(registry, 'note', adoptedId)).toMatchObject({
			body: 'File won',
			relativePath: adoptedRelativePath,
		});

		const renamedId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: renamedId, title: 'Rename recovery' });
		const original = await saveTaxonomyArtifact(registry, {
			body: 'rename crash',
			entityId: renamedId,
			entityType: 'note',
			metadata: { title: 'Rename recovery' },
			rootId,
		});
		const movedRelativePath = 'taxonomy/notes/recovered-name.md';
		await rename(join(path, original.relativePath), join(path, movedRelativePath));
		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'note');
		expect(rebuilt.relocated).toBe(1);
		expect(await readAndReconcileTaxonomyArtifact(registry, 'note', original.entityId)).toMatchObject({
			relativePath: movedRelativePath,
		});
	});

	it('keeps duplicate identities conflicted regardless of discovery order', async () => {
		const exercise = async (bindingIndex: 0 | 1) => {
			const rootId = `taxonomy-${crypto.randomUUID()}`;
			const { path, registry } = await createTestRoot(rootId);
			const entityId = `note-${crypto.randomUUID()}`;
			const title = `Duplicate identity ${entityId}`;
			await db.insert(notes).values({ id: entityId, title });
			const content = generateFrontmatter({ id: entityId, kind: 'note', schemaVersion: 1, title }, 'duplicate body');
			const directory = join(path, 'taxonomy', 'notes');
			await writeArtifactFile(artifactPath(registry, rootId, `taxonomy/notes/a-${entityId}.md`), content);
			await writeArtifactFile(artifactPath(registry, rootId, `taxonomy/notes/z-${entityId}.md`), content);
			const discoveredOrder = (await readdir(directory)).filter((name) => name.endsWith('.md'));
			const bindingName = discoveredOrder[bindingIndex];
			await db.insert(taxonomyArtifacts).values({
				authoredMetadata: JSON.stringify({ id: entityId, kind: 'note', schemaVersion: 1, title }),
				byteSize: Buffer.byteLength(content, 'utf8'),
				contentHash: computeArtifactHash(content),
				entityId,
				entityType: 'note',
				indexedBody: 'duplicate body',
				indexedTitle: title,
				relativePath: `taxonomy/notes/${bindingName}`,
				rootId,
			});

			const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'note');
			expect(rebuilt).toMatchObject({ conflict: 1, error: 0, synced: 0 });
			expect(
				(await db.select().from(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId)))[0]?.syncStatus
			).toBe('conflict');
		};

		await exercise(1);
		await exercise(0);
	});

	it('rebuilds only bindings that belong to the active root registry', async () => {
		const allowedRootId = `taxonomy-${crypto.randomUUID()}`;
		const withdrawnRootId = `taxonomy-${crypto.randomUUID()}`;
		const allowed = await createTestRoot(allowedRootId);
		const withdrawn = await createTestRoot(withdrawnRootId);
		const allowedId = `note-${crypto.randomUUID()}`;
		const withdrawnId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values([
			{ id: allowedId, title: 'Allowed' },
			{ id: withdrawnId, title: 'Withdrawn' },
		]);
		await saveTaxonomyArtifact(allowed.registry, {
			body: 'Allowed body',
			entityId: allowedId,
			entityType: 'note',
			metadata: { title: 'Allowed' },
			rootId: allowedRootId,
		});
		await saveTaxonomyArtifact(withdrawn.registry, {
			body: 'Withdrawn body',
			entityId: withdrawnId,
			entityType: 'note',
			metadata: { title: 'Withdrawn' },
			rootId: withdrawnRootId,
		});
		await db
			.update(taxonomyArtifacts)
			.set({ syncStatus: 'conflict' })
			.where(eq(taxonomyArtifacts.entityId, withdrawnId));

		const result = await rebuildTaxonomyArtifactIndex(allowed.registry, 'note');
		expect(result).toMatchObject({ error: 0, synced: 1, total: 1 });
		expect(
			await db
				.select({ syncStatus: taxonomyArtifacts.syncStatus })
				.from(taxonomyArtifacts)
				.where(eq(taxonomyArtifacts.entityId, withdrawnId))
		).toEqual([{ syncStatus: 'conflict' }]);
	});

	it('rolls back the binding and file when the target disappears inside projection commit', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = 'note-projection-race';
		await db.insert(notes).values({ id: entityId, title: 'Projection race' });
		await db.run(
			sql.raw(`CREATE TRIGGER TaxonomyArtifact_test_target_race
				BEFORE INSERT ON TaxonomyArtifact
				WHEN NEW.entityType = 'note' AND NEW.entityId = '${entityId}'
				BEGIN DELETE FROM Note WHERE id = NEW.entityId; END`)
		);
		try {
			await expect(
				saveTaxonomyArtifact(registry, {
					body: 'Must roll back',
					entityId,
					entityType: 'note',
					metadata: { title: 'Projection race' },
					rootId,
				})
			).rejects.toMatchObject({ code: 'ARTIFACT_TARGET_NOT_FOUND' });
		} finally {
			await db.run(sql.raw('DROP TRIGGER IF EXISTS TaxonomyArtifact_test_target_race'));
		}
		expect(await db.select({ id: notes.id }).from(notes).where(eq(notes.id, entityId))).toEqual([{ id: entityId }]);
		expect(
			await db
				.select({ entityId: taxonomyArtifacts.entityId })
				.from(taxonomyArtifacts)
				.where(eq(taxonomyArtifacts.entityId, entityId))
		).toEqual([]);
		await expect(readFile(join(path, 'taxonomy', 'notes', `${entityId}.md`), 'utf8')).rejects.toMatchObject({
			code: 'ENOENT',
		});
	});

	it('recovers a file-first Wildcard crash without leaving an inline phantom', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `wild-${crypto.randomUUID()}`;
		const relativePath = `taxonomy/wildcards/${entityId}.md`;
		await writeArtifactFile(
			artifactPath(registry, rootId, relativePath),
			generateFrontmatter(
				{ id: entityId, kind: 'wildcard', schemaVersion: 1, summary: 'Recovered', title: 'Crash palette' },
				'rojo\nverde'
			)
		);

		const result = await rebuildTaxonomyArtifactIndex(registry, 'wildcard');
		expect(result).toMatchObject({ adopted: 1, error: 0, synced: 1 });
		expect(await db.select().from(wildcards).where(eq(wildcards.id, entityId))).toMatchObject([
			{ children: JSON.stringify(['rojo', 'verde']), description: 'Recovered', name: 'Crash palette' },
		]);
		expect(await readAndReconcileTaxonomyArtifact(registry, 'wildcard', entityId)).toMatchObject({
			body: 'rojo\nverde',
			relativePath,
		});
	});

	it('restores or finalizes interrupted deletes and compensates callback failure', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Delete recovery' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'survive',
			entityId,
			entityType: 'note',
			metadata: { title: 'Delete recovery' },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);

		await expect(
			deleteTaxonomyArtifactWithEntity(
				registry,
				{ entityId, entityType: 'note', expectedHash: created.contentHash },
				async () => {
					throw new Error('database unavailable');
				}
			)
		).rejects.toThrow('database unavailable');
		expect(await readFile(absolutePath, 'utf8')).toContain('survive');

		await quarantineArtifactFile(artifactPath(registry, rootId, created.relativePath, 'delete'), created.contentHash);
		const recovered = await rebuildTaxonomyArtifactIndex(registry, 'note');
		expect(recovered.recoveredDeletes).toBe(1);
		expect(await readFile(absolutePath, 'utf8')).toContain('survive');

		await quarantineArtifactFile(artifactPath(registry, rootId, created.relativePath, 'delete'), created.contentHash);
		await db.delete(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId));
		await db.delete(notes).where(eq(notes.id, entityId));
		const finalized = await rebuildTaxonomyArtifactIndex(registry, 'note');
		expect(finalized.finalizedDeletes).toBe(1);
		await expect(stat(absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('finalizes a stale write quarantine when a valid canonical winner is already installed', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Interrupted write' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'old body',
			entityId,
			entityType: 'note',
			metadata: { title: 'Interrupted write' },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);
		const quarantine = await quarantineArtifactFile(
			artifactPath(registry, rootId, created.relativePath, 'delete'),
			created.contentHash
		);
		await writeArtifactFile(
			artifactPath(registry, rootId, created.relativePath),
			generateFrontmatter(
				{ id: entityId, kind: 'note', schemaVersion: 1, title: 'Interrupted write recovered' },
				'new body'
			),
			{ createOnly: true }
		);

		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'note');
		expect(rebuilt).toMatchObject({ error: 0, finalizedWrites: 1, synced: 1 });
		await expect(quarantine.quarantine.resolve('existing')).rejects.toMatchObject({ code: 'ROOT_PATH_NOT_FOUND' });
		expect(await readAndReconcileTaxonomyArtifact(registry, 'note', entityId)).toMatchObject({
			body: 'new body',
			metadata: { title: 'Interrupted write recovered' },
			syncStatus: 'synced',
		});
	});

	it('finalizes an interrupted rename after discovering its exact installed destination', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Interrupted rename' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'rename body',
			entityId,
			entityType: 'note',
			metadata: { title: 'Interrupted rename' },
			rootId,
		});
		const sourcePath = join(path, created.relativePath);
		const quarantine = await quarantineArtifactFile(
			artifactPath(registry, rootId, created.relativePath, 'delete'),
			created.contentHash
		);
		const destinationRelativePath = `taxonomy/notes/renamed-${entityId}.md`;
		await writeArtifactFile(
			artifactPath(registry, rootId, destinationRelativePath),
			await readFile(await quarantine.quarantine.resolve('existing'), 'utf8'),
			{
				createOnly: true,
			}
		);

		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'note');

		expect(rebuilt).toMatchObject({ conflict: 0, error: 0, finalizedWrites: 1, relocated: 1, synced: 1 });
		expect(await db.select().from(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId))).toMatchObject([
			{ relativePath: destinationRelativePath, syncStatus: 'synced' },
		]);
		await expect(quarantine.quarantine.resolve('existing')).rejects.toMatchObject({ code: 'ROOT_PATH_NOT_FOUND' });
		await expect(stat(sourcePath)).rejects.toMatchObject({ code: 'ENOENT' });
		expect(await readAndReconcileTaxonomyArtifact(registry, 'note', entityId)).toMatchObject({
			body: 'rename body',
			relativePath: destinationRelativePath,
		});
	});

	it('keeps an interrupted rename in conflict when another file claims the identity with different bytes', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Conflicted rename' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'source body',
			entityId,
			entityType: 'note',
			metadata: { title: 'Conflicted rename' },
			rootId,
		});
		const sourcePath = join(path, created.relativePath);
		const quarantine = await quarantineArtifactFile(
			artifactPath(registry, rootId, created.relativePath, 'delete'),
			created.contentHash
		);
		const destinationRelativePath = `taxonomy/notes/conflict-${entityId}.md`;
		await writeArtifactFile(
			artifactPath(registry, rootId, destinationRelativePath),
			generateFrontmatter(
				{ id: entityId, kind: 'note', schemaVersion: 1, title: 'Different claimant' },
				'different body'
			),
			{ createOnly: true }
		);

		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'note');

		expect(rebuilt).toMatchObject({ conflict: 1, error: 0, finalizedWrites: 0, synced: 0 });
		expect(await db.select().from(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId))).toMatchObject([
			{ relativePath: destinationRelativePath, syncStatus: 'conflict' },
		]);
		expect((await stat(await quarantine.quarantine.resolve('existing'))).isFile()).toBe(true);
	});

	it('restores a missing canonical file explicitly and can delete a confirmed missing identity', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Missing lifecycle' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'last indexed body',
			entityId,
			entityType: 'note',
			metadata: { title: 'Missing lifecycle' },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);
		await rm(absolutePath);
		const missing = await readAndReconcileTaxonomyArtifact(registry, 'note', entityId);
		expect(missing?.syncStatus).toBe('missing');

		const restored = await saveTaxonomyArtifact(registry, {
			body: 'restored intentionally',
			entityId,
			entityType: 'note',
			expectedHash: missing?.contentHash,
			metadata: { title: 'Restored' },
			restoreMissing: true,
		});
		expect(await readFile(absolutePath, 'utf8')).toContain('restored intentionally');

		await rm(absolutePath);
		await readAndReconcileTaxonomyArtifact(registry, 'note', entityId);
		await deleteTaxonomyArtifactWithEntity(
			registry,
			{
				deleteMissing: true,
				entityId,
				entityType: 'note',
				expectedHash: restored.contentHash,
			},
			async (beforeDelete) => {
				await db.transaction(async (tx: FavoriteWriteTransaction) => {
					await beforeDelete?.(tx);
					await tx.delete(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId));
					await tx.delete(notes).where(eq(notes.id, entityId));
				});
			}
		);
		expect(await db.select().from(notes).where(eq(notes.id, entityId))).toEqual([]);
	});

	it('aborts a confirmed-missing delete when the authored file reappears inside the entity transaction', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `wildcard-${crypto.randomUUID()}`;
		await db.insert(wildcards).values({ id: entityId, name: 'Reappearing wildcard' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'uno\ndos',
			entityId,
			entityType: 'wildcard',
			metadata: { title: 'Reappearing wildcard' },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);
		const authoredContent = await readFile(absolutePath, 'utf8');
		await rm(absolutePath);
		await readAndReconcileTaxonomyArtifact(registry, 'wildcard', entityId);

		await expect(
			deleteTaxonomyArtifactWithEntity(
				registry,
				{
					deleteMissing: true,
					entityId,
					entityType: 'wildcard',
					expectedHash: created.contentHash,
				},
				async (beforeDelete) => {
					await db.transaction(async (tx: FavoriteWriteTransaction) => {
						await writeFile(absolutePath, authoredContent, 'utf8');
						await beforeDelete?.(tx);
						await tx.delete(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId));
						await tx.delete(wildcards).where(eq(wildcards.id, entityId));
					});
				}
			)
		).rejects.toBeInstanceOf(ArtifactConflictError);

		expect(await db.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.id, entityId))).toEqual([
			{ id: entityId },
		]);
		expect(
			await db
				.select({ entityId: taxonomyArtifacts.entityId })
				.from(taxonomyArtifacts)
				.where(eq(taxonomyArtifacts.entityId, entityId))
		).toEqual([{ entityId }]);
	});

	it('uses a durable tombstone to suppress a reappearing Wildcard after a missing-file delete', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `wildcard-${crypto.randomUUID()}`;
		await db.insert(wildcards).values({ id: entityId, name: 'Deleted wildcard' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'rojo\nverde',
			entityId,
			entityType: 'wildcard',
			metadata: { title: 'Deleted wildcard' },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);
		const authoredContent = await readFile(absolutePath, 'utf8');
		await rm(absolutePath);
		await readAndReconcileTaxonomyArtifact(registry, 'wildcard', entityId);

		await deleteTaxonomyArtifactWithEntity(
			registry,
			{
				deleteMissing: true,
				entityId,
				entityType: 'wildcard',
				expectedHash: created.contentHash,
			},
			async (beforeDelete) => {
				await db.transaction(async (tx: FavoriteWriteTransaction) => {
					await beforeDelete?.(tx);
					await tx.delete(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId));
					await tx.delete(wildcards).where(eq(wildcards.id, entityId));
				});
			}
		);
		await writeFile(absolutePath, authoredContent, 'utf8');

		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'wildcard');
		expect(rebuilt).toMatchObject({ adopted: 0, error: 0, suppressedReappearances: 1, tombstones: 1 });
		expect(await db.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.id, entityId))).toEqual([]);
		expect(
			await db
				.select({ entityId: taxonomyArtifacts.entityId })
				.from(taxonomyArtifacts)
				.where(eq(taxonomyArtifacts.entityId, entityId))
		).toEqual([]);
		expect(await readFile(absolutePath, 'utf8')).toBe(authoredContent);
		expect(
			(await readdir(join(path, 'taxonomy', 'wildcards'))).some((name) => name.endsWith('.delete-tombstone'))
		).toBe(true);
		expect(
			await db
				.select({ rootId: taxonomyArtifactDeletionLedger.rootId })
				.from(taxonomyArtifactDeletionLedger)
				.where(eq(taxonomyArtifactDeletionLedger.rootId, rootId))
		).toEqual([{ rootId }]);
	});

	it('ignores a forged deletion marker in one root while rebuilding the same identity in another root', async () => {
		const forgedRootId = `taxonomy-forged-${crypto.randomUUID()}`;
		const trustedRootId = `taxonomy-trusted-${crypto.randomUUID()}`;
		const forged = await createTestRoot(forgedRootId);
		const trusted = await createTestRoot(trustedRootId);
		const registry = await createAuthorizedRootRegistry([
			{ id: forgedRootId, path: forged.path, permissions: ['read', 'write', 'delete', 'index'] },
			{ id: trustedRootId, path: trusted.path, permissions: ['read', 'write', 'delete', 'index'] },
		]);
		const entityId = `wildcard-${crypto.randomUUID()}`;
		await db.insert(wildcards).values({ id: entityId, name: 'Trusted wildcard' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'trusted\ncanonical',
			entityId,
			entityType: 'wildcard',
			metadata: { title: 'Trusted wildcard' },
			rootId: trustedRootId,
		});
		const nonce = crypto.randomUUID();
		const forgedDirectory = join(forged.path, 'taxonomy', 'wildcards');
		await mkdir(forgedDirectory, { recursive: true });
		await writeFile(
			join(forgedDirectory, `.${entityId}.md.${nonce}.delete-tombstone`),
			`${JSON.stringify({
				contentHash: created.contentHash,
				entityId,
				entityType: 'wildcard',
				nonce,
				originalRelativePath: `taxonomy/wildcards/${entityId}.md`,
				version: 1,
			})}\n`,
			'utf8'
		);

		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'wildcard');

		expect(rebuilt).toMatchObject({ error: 0, suppressedReappearances: 0, synced: 1, tombstones: 0 });
		expect(
			await db
				.select({
					relativePath: taxonomyArtifacts.relativePath,
					rootId: taxonomyArtifacts.rootId,
					syncStatus: taxonomyArtifacts.syncStatus,
				})
				.from(taxonomyArtifacts)
				.where(eq(taxonomyArtifacts.entityId, entityId))
		).toEqual([
			{
				relativePath: created.relativePath,
				rootId: trustedRootId,
				syncStatus: 'synced',
			},
		]);
	});

	it('finishes a crash-left deletion only when its durable ledger matches the tombstone', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Crash ledger recovery' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'bytes left in quarantine',
			entityId,
			entityType: 'note',
			metadata: { title: 'Crash ledger recovery' },
			rootId,
		});
		const target = artifactPath(registry, rootId, created.relativePath, 'delete');
		const nonce = crypto.randomUUID();
		const tombstone = await createArtifactDeletionTombstone(target, {
			contentHash: created.contentHash,
			entityId,
			entityType: 'note',
			nonce,
		});
		await quarantineArtifactFile(target, created.contentHash);

		await db.transaction(async (transaction: FavoriteWriteTransaction) => {
			await transaction.insert(taxonomyArtifactDeletionLedger).values({
				contentHash: created.contentHash,
				entityId,
				entityType: 'note',
				nonce,
				relativePath: created.relativePath,
				rootId,
			});
			await transaction.delete(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId));
			await transaction.delete(notes).where(eq(notes.id, entityId));
		});

		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'note');

		expect(rebuilt).toMatchObject({ error: 0, finalizedDeletes: 1, tombstones: 1 });
		expect((await stat(await tombstone.tombstone.resolve('existing'))).isFile()).toBe(true);
		expect(
			await db
				.select({ nonce: taxonomyArtifactDeletionLedger.nonce })
				.from(taxonomyArtifactDeletionLedger)
				.where(eq(taxonomyArtifactDeletionLedger.rootId, rootId))
		).toEqual([{ nonce }]);
		expect((await readdir(join(path, 'taxonomy', 'notes'))).some((name) => name.endsWith('.quarantine'))).toBe(false);
	});

	it('quarantines a crash-left temporary artifact without replacing its canonical Note', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Temporary recovery' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'canonical body',
			entityId,
			entityType: 'note',
			metadata: { title: 'Temporary recovery' },
			rootId,
		});
		const directory = join(path, 'taxonomy', 'notes');
		const temporaryName = `.${entityId}.md.${crypto.randomUUID()}.tmp`;
		await writeFile(join(directory, temporaryName), 'interrupted staging bytes', 'utf8');

		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, 'note');
		expect(rebuilt).toMatchObject({ error: 0, quarantinedTemps: 1, synced: 1 });
		expect(await readFile(join(path, created.relativePath), 'utf8')).toContain('canonical body');
		const files = await readdir(directory);
		expect(files).not.toContain(temporaryName);
		expect(files.some((name) => name.endsWith('.tmp-orphan'))).toBe(true);
	});

	it('leaves cleanup quarantine for rebuild when delete DB commit succeeds but file finalization fails', async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: 'Finalization failure' });
		const created = await saveTaxonomyArtifact(registry, {
			body: 'delete me',
			entityId,
			entityType: 'note',
			metadata: { title: 'Finalization failure' },
			rootId,
		});
		const directoryPath = join(path, 'taxonomy', 'notes');
		await expect(
			deleteTaxonomyArtifactWithEntity(
				registry,
				{ entityId, entityType: 'note', expectedHash: created.contentHash },
				async (beforeDelete) => {
					await db.transaction(async (tx: FavoriteWriteTransaction) => {
						await beforeDelete?.(tx);
						await tx.delete(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId));
						await tx.delete(notes).where(eq(notes.id, entityId));
					});
					const [quarantine] = (await readdir(directoryPath)).filter((name) => name.endsWith('.quarantine'));
					await writeFile(join(directoryPath, quarantine), 'tampered after database commit', 'utf8');
				}
			)
		).rejects.toThrow(ArtifactConflictError);
		await expect(stat(join(path, created.relativePath))).rejects.toMatchObject({ code: 'ENOENT' });
		expect((await readdir(directoryPath)).some((name) => name.endsWith('.quarantine'))).toBe(true);
		expect(await db.select().from(notes).where(eq(notes.id, entityId))).toEqual([]);
	});
});
