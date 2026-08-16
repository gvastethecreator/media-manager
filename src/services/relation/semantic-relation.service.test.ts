import { afterEach, describe, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db, schema } from '@/lib/drizzle';
import { assets, mediaRoots, sourceFiles } from '@/lib/drizzle/schema/media-core/assets';
import { relationRoleApplicability, relationRoles, semanticRelations } from '@/lib/drizzle/schema/relations/semantic';
import { notes } from '@/lib/drizzle/schema/taxonomy/notes';
import { prompts } from '@/lib/drizzle/schema/taxonomy/prompts';
import {
	createSemanticRelation,
	listRelationRoles,
	listSemanticRelations,
	SemanticRelationError,
	updateSemanticRelation,
} from './semantic-relation.service';

async function createNotes(...ids: string[]): Promise<void> {
	await db.insert(notes).values(ids.map((id) => ({ id, title: id })));
}

async function createAsset(id: string, assetType: 'image' | 'video'): Promise<void> {
	const rootId = 'semantic-relation-service-root';
	await db.insert(mediaRoots).values({ id: rootId, label: 'Semantic relation service' }).onConflictDoNothing();
	await db.transaction(async (transaction: typeof db) => {
		await transaction.insert(sourceFiles).values({
			assetId: id,
			availability: 'available',
			byteSize: 1,
			contentHash: 'a'.repeat(64),
			id: `source-${id}`,
			relativePath: `semantic/${id}.${assetType === 'image' ? 'png' : 'mp4'}`,
			rootId,
		});
		await transaction.insert(assets).values({
			assetType,
			id,
			primarySourceFileId: `source-${id}`,
			title: id,
		});
	});
}

afterEach(async () => {
	await db.delete(semanticRelations);
	await db.delete(notes);
	await db.delete(prompts);
	await db.delete(relationRoleApplicability).where(eq(relationRoleApplicability.roleSlug, 'test_symmetric_self'));
	await db.delete(relationRoles).where(eq(relationRoles.slug, 'test_symmetric_self'));
	await db.transaction(async (transaction: typeof db) => {
		await transaction.run(sql`PRAGMA defer_foreign_keys = ON`);
		await transaction.delete(assets);
		await transaction.delete(sourceFiles);
	});
	await db.delete(mediaRoots).where(eq(mediaRoots.id, 'semantic-relation-service-root'));
	await db
		.update(relationRoles)
		.set({ deprecatedAt: null, replacementSlug: null })
		.where(eq(relationRoles.slug, 'inspired_by'));
});

describe('semantic relation service', () => {
	it('registers every semantic relation table in the Drizzle schema', () => {
		expect(Object.keys(schema)).toEqual(
			expect.arrayContaining([
				'relationRoles',
				'relationRoleApplicability',
				'relationRoleConflicts',
				'semanticRelations',
			])
		);
	});

	it('exposes the governed seed and derives inverse labels from one stored row', async () => {
		expect((await listRelationRoles()).map((role) => role.slug)).toEqual([
			'derived_from',
			'inspired_by',
			'references',
			'variant_of',
		]);
		await createNotes('note-source');
		await db.insert(prompts).values({ id: 'prompt-target', name: 'Target' });
		const created = await createSemanticRelation({
			roleSlug: 'references',
			source: { id: 'note-source', type: 'note' },
			target: { id: 'prompt-target', type: 'prompt' },
		});
		expect(created).toMatchObject({ direction: 'forward', label: 'references', role: { slug: 'references' } });
		const inverse = await listSemanticRelations({ id: 'prompt-target', type: 'prompt' });
		expect(inverse.data).toMatchObject([
			{ direction: 'inverse', id: created.id, label: 'referenced_by', other: { id: 'note-source', type: 'note' } },
		]);
		expect(await db.select().from(semanticRelations)).toHaveLength(1);
	});

	it('normalizes symmetric endpoints and prevents inverted duplicates', async () => {
		await createNotes('note-z', 'note-a');
		const relation = await createSemanticRelation({
			roleSlug: 'variant_of',
			source: { id: 'note-z', type: 'note' },
			target: { id: 'note-a', type: 'note' },
		});
		expect(relation.source.id).toBe('note-a');
		expect(relation.target.id).toBe('note-z');
		await expect(
			createSemanticRelation({
				roleSlug: 'variant_of',
				source: { id: 'note-a', type: 'note' },
				target: { id: 'note-z', type: 'note' },
			})
		).rejects.toThrow();
	});

	it('uses SQLite BINARY ordering for symmetric endpoints instead of the host locale', async () => {
		await createNotes('Z', 'a');
		const relation = await createSemanticRelation({
			roleSlug: 'variant_of',
			source: { id: 'a', type: 'note' },
			target: { id: 'Z', type: 'note' },
		});
		expect(relation.source.id).toBe('Z');
		expect(relation.target.id).toBe('a');
	});

	it('keeps opposite roleless directions as two distinct logical relations', async () => {
		await createNotes('note-a', 'note-b');
		const forward = await createSemanticRelation({
			source: { id: 'note-a', type: 'note' },
			target: { id: 'note-b', type: 'note' },
		});
		const reverse = await createSemanticRelation({
			source: { id: 'note-b', type: 'note' },
			target: { id: 'note-a', type: 'note' },
		});
		expect(reverse.id).not.toBe(forward.id);
		expect(await db.select().from(semanticRelations)).toHaveLength(2);
	});

	it('allows a symmetric self-link only when its governed role opts in', async () => {
		await createNotes('note-self');
		await db.insert(relationRoles).values({
			allowSelf: true,
			forwardLabel: 'same_as',
			inverseLabel: 'same_as',
			isSymmetric: true,
			slug: 'test_symmetric_self',
		});
		await db.insert(relationRoleApplicability).values({
			roleSlug: 'test_symmetric_self',
			sourceFamily: 'note',
			targetFamily: 'note',
		});
		const relation = await createSemanticRelation({
			roleSlug: 'test_symmetric_self',
			source: { id: 'note-self', type: 'note' },
			target: { id: 'note-self', type: 'note' },
		});
		expect(relation).toMatchObject({
			source: { id: 'note-self', type: 'note' },
			target: { id: 'note-self', type: 'note' },
		});
	});

	it('requires variant_of Assets to share the same concrete media type', async () => {
		await createAsset('asset-image-a', 'image');
		await createAsset('asset-image-b', 'image');
		await createAsset('asset-video', 'video');
		await expect(
			createSemanticRelation({
				roleSlug: 'variant_of',
				source: { id: 'asset-image-a', type: 'asset' },
				target: { id: 'asset-video', type: 'asset' },
			})
		).rejects.toMatchObject({ code: 'RELATION_ROLE_INVALID' });
		await expect(
			createSemanticRelation({
				roleSlug: 'variant_of',
				source: { id: 'asset-image-b', type: 'asset' },
				target: { id: 'asset-image-a', type: 'asset' },
			})
		).resolves.toMatchObject({ role: { slug: 'variant_of' } });
	});

	it('rejects invalid applicability, self-links, missing endpoints and conflicting bare semantics', async () => {
		await createNotes('note-a', 'note-b');
		await db.insert(prompts).values({ id: 'prompt-a', name: 'Prompt A' });
		await expect(
			createSemanticRelation({
				roleSlug: 'variant_of',
				source: { id: 'note-a', type: 'note' },
				target: { id: 'prompt-a', type: 'prompt' },
			})
		).rejects.toMatchObject({ code: 'RELATION_ROLE_INVALID' });
		await expect(
			createSemanticRelation({
				roleSlug: 'references',
				source: { id: 'note-a', type: 'note' },
				target: { id: 'note-a', type: 'note' },
			})
		).rejects.toMatchObject({ code: 'RELATION_VALIDATION' });
		await expect(
			createSemanticRelation({
				roleSlug: 'references',
				source: { id: 'note-a', type: 'note' },
				target: { id: 'missing', type: 'note' },
			})
		).rejects.toMatchObject({ code: 'RELATION_ENDPOINT_NOT_FOUND' });
		await createSemanticRelation({
			source: { id: 'note-a', type: 'note' },
			target: { id: 'note-b', type: 'note' },
		});
		await expect(
			createSemanticRelation({
				roleSlug: 'references',
				source: { id: 'note-a', type: 'note' },
				target: { id: 'note-b', type: 'note' },
			})
		).rejects.toMatchObject({ code: 'RELATION_CONFLICT' });
		await expect(
			createSemanticRelation({
				roleSlug: 'references',
				source: { id: 'note-b', type: 'note' },
				target: { id: 'note-a', type: 'note' },
			})
		).resolves.toMatchObject({
			role: { slug: 'references' },
			source: { id: 'note-b', type: 'note' },
			target: { id: 'note-a', type: 'note' },
		});
	});

	it('rejects derived_from cycles and role conflicts on either orientation', async () => {
		await createNotes('note-a', 'note-b', 'note-c');
		await createSemanticRelation({
			roleSlug: 'derived_from',
			source: { id: 'note-a', type: 'note' },
			target: { id: 'note-b', type: 'note' },
		});
		await createSemanticRelation({
			roleSlug: 'derived_from',
			source: { id: 'note-b', type: 'note' },
			target: { id: 'note-c', type: 'note' },
		});
		await expect(
			createSemanticRelation({
				roleSlug: 'derived_from',
				source: { id: 'note-c', type: 'note' },
				target: { id: 'note-a', type: 'note' },
			})
		).rejects.toMatchObject({ code: 'RELATION_CYCLE' });
		await expect(
			createSemanticRelation({
				roleSlug: 'variant_of',
				source: { id: 'note-b', type: 'note' },
				target: { id: 'note-a', type: 'note' },
			})
		).rejects.toMatchObject({ code: 'RELATION_CONFLICT' });
	});

	it('normalizes deprecated roles with an explicit live replacement', async () => {
		await createNotes('note-a', 'note-b');
		await db
			.update(relationRoles)
			.set({ deprecatedAt: new Date(), replacementSlug: 'references' })
			.where(eq(relationRoles.slug, 'inspired_by'));
		const relation = await createSemanticRelation({
			roleSlug: 'inspired_by',
			source: { id: 'note-a', type: 'note' },
			target: { id: 'note-b', type: 'note' },
		});
		expect(relation.role?.slug).toBe('references');
	});

	it('enforces canonical symmetric storage and physical endpoint cleanup below the service', async () => {
		await createNotes('note-a', 'note-z');
		await expect(
			db.insert(semanticRelations).values({
				id: 'rel-direct-invalid',
				roleKey: 'variant_of',
				roleSlug: 'variant_of',
				sourceId: 'note-z',
				sourceType: 'note',
				targetId: 'note-a',
				targetType: 'note',
			})
		).rejects.toThrow();
		const created = await createSemanticRelation({
			roleSlug: 'references',
			source: { id: 'note-a', type: 'note' },
			target: { id: 'note-z', type: 'note' },
		});
		await db.delete(notes).where(eq(notes.id, 'note-a'));
		expect(await db.select().from(semanticRelations).where(eq(semanticRelations.id, created.id))).toEqual([]);
	});

	it('returns a typed not-found error when the relation disappears during update commit', async () => {
		await createNotes('note-update-source', 'note-update-target');
		const created = await createSemanticRelation({
			roleSlug: 'references',
			source: { id: 'note-update-source', type: 'note' },
			target: { id: 'note-update-target', type: 'note' },
		});
		await db.run(
			sql.raw(`CREATE TRIGGER SemanticRelation_test_update_race
				BEFORE UPDATE ON SemanticRelation WHEN OLD.id = '${created.id}'
				BEGIN DELETE FROM SemanticRelation WHERE id = OLD.id; END`)
		);
		try {
			await expect(
				updateSemanticRelation(created.id, {
					roleSlug: 'inspired_by',
					source: { id: 'note-update-source', type: 'note' },
					target: { id: 'note-update-target', type: 'note' },
				})
			).rejects.toMatchObject({ code: 'RELATION_NOT_FOUND', status: 404 });
		} finally {
			await db.run(sql.raw('DROP TRIGGER IF EXISTS SemanticRelation_test_update_race'));
		}
	});

	it('uses typed domain errors for contract failures', () => {
		expect(new SemanticRelationError('RELATION_VALIDATION', 'bad', 400)).toMatchObject({ status: 400 });
	});
});
