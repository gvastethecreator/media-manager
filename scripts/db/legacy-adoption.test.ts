import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createVerifiedBackup, inventoryDatabase, verifyExistingBackup } from './database-safety';
import type { LegacyAdoptionReport } from './legacy-adoption';
import { checkDatabase, loadMigrations, MIGRATION_TABLE } from './migrations';
import { seedDeterministicTestFixture, TEST_PROFILE_ID } from './test-fixture';

const ADDITIVE_INDEXES = [
	'Audio_folderId_hash_idx',
	'Document_folderId_hash_idx',
	'File3D_folderId_hash_idx',
	'File_folderId_hash_idx',
	'Folder_parentId_idx',
	'Image_folderId_hash_idx',
	'JsonFile_folderId_hash_idx',
	'Video_folderId_hash_idx',
];

const temporaryDirectories: string[] = [];

async function runAdoptionInChild(fixture: {
	backupPath: string;
	manifestPath: string;
	outputPath: string;
	workspaceRoot: string;
}): Promise<{ exitCode: number; report?: LegacyAdoptionReport; stderr: string }> {
	const child = Bun.spawn(
		[
			process.execPath,
			join(import.meta.dir, 'fixtures', 'adopt-legacy-child.ts'),
			fixture.backupPath,
			fixture.manifestPath,
			fixture.outputPath,
			fixture.workspaceRoot,
		],
		{ stderr: 'pipe', stdout: 'pipe' }
	);
	const [exitCode, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	return {
		exitCode,
		report: exitCode === 0 ? (JSON.parse(stdout) as LegacyAdoptionReport) : undefined,
		stderr,
	};
}

type LegacyFixtureOptions = {
	addUnknownTable?: boolean;
	favoriteProfileId?: null | string;
	includeOwnedBridgeOrphan?: boolean;
};

async function createLegacyBackup(options: LegacyFixtureOptions = {}): Promise<{
	backupPath: string;
	manifestPath: string;
	outputPath: string;
	sourceCounts: Record<string, number>;
	workspaceRoot: string;
}> {
	const root = await mkdtemp(join(tmpdir(), 'media-manager-legacy-adoption-'));
	temporaryDirectories.push(root);
	const workspaceRoot = join(root, 'workspace');
	const artifactRoot = join(root, 'artifacts');
	await Promise.all([mkdir(workspaceRoot), mkdir(artifactRoot)]);
	const databasePath = join(workspaceRoot, 'legacy.sqlite');
	const [baseline] = await loadMigrations();
	const baselineDatabase = new Database(databasePath, { create: true, strict: true });
	try {
		for (const statement of baseline.statements) baselineDatabase.exec(statement);
	} finally {
		baselineDatabase.clearQueryCache();
		baselineDatabase.close();
	}
	seedDeterministicTestFixture(databasePath);

	const database = new Database(databasePath, { strict: true });
	try {
		database.exec('PRAGMA foreign_keys = OFF');
		for (const indexName of ADDITIVE_INDEXES) database.exec(`DROP INDEX "${indexName}"`);
		database.exec('PRAGMA user_version = 0');
		database.exec(`
			DROP INDEX "Favorite_profileId_entityType_entityId_key";
			DROP INDEX "Favorite_profileId_idx";
			DROP INDEX "Favorite_profileId_addedAt_idx";
			DROP INDEX "Favorite_entityType_idx";
			DROP INDEX "Favorite_addedAt_idx";
			ALTER TABLE "Favorite" RENAME TO "__canonical_Favorite";
			CREATE TABLE "Favorite" (
				"id" text PRIMARY KEY NOT NULL,
				"entityType" text NOT NULL,
				"entityId" text NOT NULL,
				"addedAt" integer NOT NULL DEFAULT (unixepoch()),
				"profileId" text
			);
			DROP TABLE "__canonical_Favorite";
			CREATE UNIQUE INDEX "Favorite_profileId_entityType_entityId_key"
				ON "Favorite" ("profileId", "entityType", "entityId");
			CREATE INDEX "Favorite_profileId_idx" ON "Favorite" ("profileId");
			CREATE INDEX "Favorite_profileId_addedAt_idx" ON "Favorite" ("profileId", "addedAt");
			CREATE INDEX "Favorite_entityType_idx" ON "Favorite" ("entityType");
			CREATE INDEX "Favorite_addedAt_idx" ON "Favorite" ("addedAt");
			CREATE TABLE "Task" ("id" text PRIMARY KEY NOT NULL, "title" text NOT NULL);
		`);
		if (options.addUnknownTable) database.exec('CREATE TABLE "unexpected_domain" ("id" text PRIMARY KEY)');
		database
			.query('INSERT INTO "Favorite" ("id", "profileId", "entityType", "entityId", "addedAt") VALUES (?, ?, ?, ?, ?)')
			.run(
				'legacy-favorite',
				options.favoriteProfileId === undefined ? TEST_PROFILE_ID : options.favoriteProfileId,
				'Image',
				'legacy-image',
				1_700_000_000_000
			);
		if (options.includeOwnedBridgeOrphan !== false) {
			database.exec("INSERT INTO _ImageToWorldItem(A, B) VALUES ('missing-image', 'missing-world-item')");
		}
	} finally {
		database.clearQueryCache();
		database.close();
	}

	const sourceCounts = (await inventoryDatabase(databasePath)).tableCounts;
	const backup = await createVerifiedBackup({
		databasePath,
		outputDirectory: join(artifactRoot, 'backups'),
		workspaceRoot,
	});
	return {
		backupPath: backup.backupPath,
		manifestPath: backup.manifestPath,
		outputPath: join(artifactRoot, 'adopted.sqlite'),
		sourceCounts,
		workspaceRoot,
	};
}

afterEach(async () => {
	// On Windows, Bun SQLite can retain a mapped section until GC runs even after close().
	Bun.gc(true);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 100, recursive: true, retryDelay: 100 });
	}
});

describe('legacy SQLite adoption', () => {
	it('adopts the known historical drift without losing domain rows or legacy extensions', async () => {
		const fixture = await createLegacyBackup();
		const sourceManifest = await verifyExistingBackup({
			backupPath: fixture.backupPath,
			manifestPath: fixture.manifestPath,
		});

		const adoption = await runAdoptionInChild(fixture);
		expect(adoption.exitCode, adoption.stderr).toBe(0);
		const report = adoption.report as LegacyAdoptionReport;
		const [check, outputInventory, sourceManifestAfter] = await Promise.all([
			checkDatabase({ databasePath: fixture.outputPath }),
			inventoryDatabase(fixture.outputPath),
			verifyExistingBackup({ backupPath: fixture.backupPath, manifestPath: fixture.manifestPath }),
		]);

		expect(report.healthy).toBe(true);
		expect(report.favoriteRowsPreserved).toBe(1);
		expect(check.healthy).toBe(true);
		expect(check.schema.extra).toContainEqual({ classification: 'legacy', name: 'Task', type: 'table' });
		for (const [tableName, count] of Object.entries(fixture.sourceCounts)) {
			expect(outputInventory.tableCounts[tableName]).toBe(tableName === '_ImageToWorldItem' ? count - 1 : count);
		}
		expect(outputInventory.tableCounts[MIGRATION_TABLE]).toBe((await loadMigrations()).length);
		expect(outputInventory.tableCounts._AlbumToPlace).toBe(0);
		expect(outputInventory.tableCounts._CharacterToPlace).toBe(0);
		expect(outputInventory.tableCounts.Asset).toBe(0);
		expect(outputInventory.tableCounts.MediaRoot).toBe(0);
		expect(outputInventory.tableCounts.SourceFile).toBe(0);
		expect(outputInventory.tableCounts.RelationRole).toBe(4);
		expect(outputInventory.tableCounts.RelationRoleApplicability).toBe(114);
		expect(outputInventory.tableCounts.RelationRoleConflict).toBe(1);
		expect(sourceManifestAfter.sha256).toBe(sourceManifest.sha256);
	}, 60_000);

	it('rejects unknown schema drift and removes the incomplete output', async () => {
		const fixture = await createLegacyBackup({ addUnknownTable: true });

		const adoption = await runAdoptionInChild(fixture);
		expect(adoption.exitCode).not.toBe(0);
		expect(adoption.stderr).toContain('Drift fuera del perfil de adopción seguro');
		expect(existsSync(fixture.outputPath)).toBe(false);
		await expect(
			verifyExistingBackup({ backupPath: fixture.backupPath, manifestPath: fixture.manifestPath })
		).resolves.toBeTruthy();
	}, 60_000);

	it('rejects unreconciled Favorite ownership and removes the incomplete output', async () => {
		const fixture = await createLegacyBackup({ favoriteProfileId: null });

		const adoption = await runAdoptionInChild(fixture);
		expect(adoption.exitCode).not.toBe(0);
		expect(adoption.stderr).toContain('Favorite requiere reconciliación antes de adoptar');
		expect(existsSync(fixture.outputPath)).toBe(false);
	}, 60_000);
});
