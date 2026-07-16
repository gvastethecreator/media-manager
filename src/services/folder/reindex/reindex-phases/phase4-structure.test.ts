import { inArray } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { folders } from '@/lib/drizzle/schema';
import type { ReindexAnalysisResult } from '../folder-reindex-types';
import { phase4_buildSubfolderStructure } from './phase4-structure';

const testRootIds = ['phase4-root-atomic', 'phase4-root-rollback'];
const testPaths = [
	'C:\\media-manager-tests\\phase4-atomic',
	'C:\\media-manager-tests\\phase4-atomic\\parent',
	'C:\\media-manager-tests\\phase4-atomic\\parent\\nested',
	'C:\\media-manager-tests\\phase4-rollback',
	'C:\\media-manager-tests\\phase4-rollback\\valid',
	'C:\\media-manager-tests\\phase4-rollback\\invalid',
];

const analysis = (newSubfolders: ReindexAnalysisResult['newSubfolders']): ReindexAnalysisResult => ({
	estimatedDuration: 0,
	existingFolders: [],
	missingFolders: [],
	newSubfolders,
	totalFiles: 0,
	totalFolders: 0,
});

afterEach(async () => {
	await db.delete(folders).where(inArray(folders.path, testPaths));
	await db.delete(folders).where(inArray(folders.id, testRootIds));
});

describe('reindex phase 4 transactional structure', () => {
	it('creates parent-first hierarchy atomically and assigns the real nested parent', async () => {
		await db.insert(folders).values({
			id: testRootIds[0],
			name: 'Phase 4 root',
			path: testPaths[0],
		});

		const result = await phase4_buildSubfolderStructure(
			analysis([
				{ name: 'nested', parentId: testRootIds[0], path: testPaths[2] },
				{ name: 'parent', parentId: testRootIds[0], path: testPaths[1] },
			]),
			{}
		);

		expect(result).toEqual(expect.objectContaining({ failed: 0, processed: 2, success: true }));
		const created = await db
			.select()
			.from(folders)
			.where(inArray(folders.path, [testPaths[1], testPaths[2]]));
		const parent = created.find((folder: typeof folders.$inferSelect) => folder.path === testPaths[1]);
		const nested = created.find((folder: typeof folders.$inferSelect) => folder.path === testPaths[2]);
		expect(parent?.parentId).toBe(testRootIds[0]);
		expect(nested?.parentId).toBe(parent?.id);
	});

	it('rolls back earlier inserts when a later parent reference is invalid', async () => {
		await db.insert(folders).values({
			id: testRootIds[1],
			name: 'Phase 4 rollback root',
			path: testPaths[3],
		});

		const result = await phase4_buildSubfolderStructure(
			analysis([
				{ name: 'valid', parentId: testRootIds[1], path: testPaths[4] },
				{ name: 'invalid', parentId: 'missing-parent-phase4', path: testPaths[5] },
			]),
			{}
		);

		expect(result).toEqual(expect.objectContaining({ failed: 2, processed: 0, success: false }));
		expect(
			await db
				.select()
				.from(folders)
				.where(inArray(folders.path, [testPaths[4], testPaths[5]]))
		).toEqual([]);
	});
});
