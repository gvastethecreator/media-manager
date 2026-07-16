import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveAudioListOrder } from '../../src/services/audio/audio.service.effect';
import { migrateDatabase } from './migrations';

const families = [
	{ assetIndex: 'Video_assetId_key', folderIndex: 'Video_folderId_createdAt_idx', table: 'Video' },
	{ assetIndex: 'Audio_assetId_key', folderIndex: 'Audio_folderId_createdAt_idx', table: 'Audio' },
	{ assetIndex: 'Document_assetId_key', folderIndex: 'Document_folderId_createdAt_idx', table: 'Document' },
	{ assetIndex: 'JsonFile_assetId_key', folderIndex: 'JsonFile_folderId_createdAt_idx', table: 'JsonFile' },
	{ assetIndex: 'File3D_assetId_key', folderIndex: 'File3D_folderId_createdAt_idx', table: 'File3D' },
] as const;
const temporaryDirectories: string[] = [];

async function createDatabase(): Promise<Database> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-media-query-plan-'));
	temporaryDirectories.push(directory);
	const databasePath = join(directory, 'plan.sqlite');
	await migrateDatabase({ databasePath });
	return new Database(databasePath, { strict: true });
}

const explain = (database: Database, sql: string, ...params: unknown[]): string[] =>
	(database.query(`EXPLAIN QUERY PLAN ${sql}`).all(...params) as Array<{ detail: string }>).map((row) => row.detail);

afterEach(async () => {
	Bun.gc(true);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('media specialization query plans', () => {
	it('uses exact-identity indexes for canonical joins', async () => {
		const database = await createDatabase();
		try {
			for (const family of families) {
				const plan = explain(
					database,
					`SELECT Entity.id
					 FROM ${family.table} AS Entity
					 JOIN Asset ON Asset.id = Entity.assetId
					 JOIN SourceFile ON SourceFile.id = Asset.primarySourceFileId
					 WHERE Entity.assetId = ?`,
					'asset-id'
				);
				expect(
					plan.some((detail) => detail.includes(family.assetIndex)),
					plan.join('\n')
				).toBe(true);
				expect(
					plan.some((detail) => detail.includes('Asset') && detail.includes('INDEX')),
					plan.join('\n')
				).toBe(true);
				expect(
					plan.some((detail) => detail.includes('SourceFile') && detail.includes('INDEX')),
					plan.join('\n')
				).toBe(true);
			}
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});

	it('uses folder plus creation-time indexes for lifecycle-aware lists without a temporary sort', async () => {
		const database = await createDatabase();
		try {
			const defaultAudioOrder = resolveAudioListOrder({});
			expect(defaultAudioOrder).toEqual({ sortColumn: 'createdAt', sortDirection: 'desc' });
			for (const family of families) {
				const direction = family.table === 'Audio' ? defaultAudioOrder.sortDirection.toUpperCase() : 'DESC';
				const plan = explain(
					database,
					`SELECT Entity.id
					 FROM ${family.table} AS Entity
					 LEFT JOIN Asset ON Asset.id = Entity.assetId
					 WHERE Entity.folderId = ?
					   AND (Entity.assetId IS NULL OR (Asset.status <> 'deleted' AND Asset.deletedAt IS NULL))
					 ORDER BY Entity.createdAt ${direction}, Entity.id ${direction}
					 LIMIT 50`,
					'folder-id'
				);
				expect(
					plan.some((detail) => detail.includes(family.folderIndex)),
					plan.join('\n')
				).toBe(true);
				expect(
					plan.some((detail) => detail.includes('USE TEMP B-TREE FOR ORDER BY')),
					plan.join('\n')
				).toBe(false);
			}
		} finally {
			database.clearQueryCache();
			database.close();
		}
	});
});
