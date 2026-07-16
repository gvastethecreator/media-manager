#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { constants as fileSystemConstants } from 'node:fs';
import { copyFile, mkdir, realpath, rm, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { inventoryDatabase, verifyExistingBackup } from './database-safety';
import { checkDatabase, loadMigrations, migrateDatabase, MIGRATION_TABLE } from './migrations';
import { compareSchema, createSchemaContract, type SchemaDriftReport } from './schema-fingerprint';

const ADDITIVE_INDEXES = new Set([
	'Audio_folderId_hash_idx',
	'Document_folderId_hash_idx',
	'File3D_folderId_hash_idx',
	'File_folderId_hash_idx',
	'Folder_parentId_idx',
	'Image_folderId_hash_idx',
	'JsonFile_folderId_hash_idx',
	'Video_folderId_hash_idx',
]);

const FAVORITE_INDEXES = new Set([
	'Favorite_profileId_entityType_entityId_key',
	'Favorite_profileId_idx',
	'Favorite_profileId_addedAt_idx',
	'Favorite_entityType_idx',
	'Favorite_addedAt_idx',
]);

const ALLOWED_CHANGED = new Set(['table:Favorite', ...[...FAVORITE_INDEXES].map((name) => `index:${name}`)]);
const ALLOWED_MISSING = new Set([...ADDITIVE_INDEXES, ...FAVORITE_INDEXES].map((name) => `index:${name}`));

const OWNED_BRIDGE_REPAIRS = [
	['_ImageToAlbum', 'Image', 'Album'],
	['_VideoToAlbum', 'Video', 'Album'],
	['_ImageToCollection', 'Image', 'Collection'],
	['_VideoToCollection', 'Video', 'Collection'],
	['_ImageToTag', 'Image', 'Tag'],
	['_VideoToTag', 'Video', 'Tag'],
	['_ImageToProperty', 'Image', 'Property'],
	['_VideoToProperty', 'Video', 'Property'],
	['_ImageToWildcard', 'Image', 'Wildcard'],
	['_VideoToWildcard', 'Video', 'Wildcard'],
	['_ImageToCharacter', 'Image', 'Character'],
	['_VideoToCharacter', 'Video', 'Character'],
	['_ImageToPlace', 'Image', 'Place'],
	['_VideoToPlace', 'Video', 'Place'],
	['_ImageToWorldItem', 'Image', 'WorldItem'],
	['_VideoToWorldItem', 'Video', 'WorldItem'],
	['_ImageToConcept', 'Image', 'Concept'],
	['_VideoToConcept', 'Video', 'Concept'],
	['_ImageToPrompt', 'Image', 'Prompt'],
	['_VideoToPrompt', 'Video', 'Prompt'],
	['_ImageToNote', 'Image', 'Note'],
	['_VideoToNote', 'Video', 'Note'],
	['_GroupToImage', 'Group', 'Image'],
	['_GroupToVideo', 'Group', 'Video'],
	['_GroupToAlbum', 'Group', 'Album'],
	['_GroupToTag', 'Group', 'Tag'],
] as const;

export type LegacyAdoptionOptions = {
	backupPath: string;
	manifestPath?: string;
	outputPath: string;
	workspaceRoot?: string;
};

export type LegacyAdoptionReport = {
	backupSha256: string;
	driftBefore: Pick<SchemaDriftReport, 'changed' | 'extra' | 'missing'>;
	favoriteRowsPreserved: number;
	healthy: true;
	migration: string;
	outputByteSize: number;
	tableCount: number;
};

function quoteIdentifier(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

function isPathInside(rootPath: string, candidatePath: string): boolean {
	const pathFromRoot = relative(resolve(rootPath), resolve(candidatePath));
	return pathFromRoot === '' || !(pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot));
}

function firstNumber(database: Database, query: string): number {
	const row = database.query(query).get() as Record<string, unknown>;
	return Number(Object.values(row)[0] ?? 0);
}

function rollbackQuietly(database: Database): void {
	try {
		database.exec('ROLLBACK');
	} catch {
		// The transaction may not have started or SQLite may already have rolled it back.
	}
}

function assertAdoptableDrift(drift: SchemaDriftReport): void {
	const forbiddenMissing = drift.missing.filter((key) => !ALLOWED_MISSING.has(key));
	const forbiddenChanged = drift.changed.filter((key) => !ALLOWED_CHANGED.has(key));
	const unknownExtra = drift.extra.filter((entry) => entry.classification === 'unknown');
	if (forbiddenMissing.length > 0 || forbiddenChanged.length > 0 || unknownExtra.length > 0) {
		throw new Error(
			`Drift fuera del perfil de adopción seguro: missing=${forbiddenMissing.length}, changed=${forbiddenChanged.length}, unknown=${unknownExtra.length}.`
		);
	}
}

function assertFavoriteRowsAreAdoptable(database: Database): number {
	const columns = database.query('PRAGMA table_info("Favorite")').all() as Array<{ name: string }>;
	const actualColumns = new Set(columns.map((column) => column.name));
	for (const expected of ['id', 'profileId', 'entityType', 'entityId', 'addedAt']) {
		if (!actualColumns.has(expected)) throw new Error(`Favorite no tiene la columna requerida ${expected}.`);
	}
	if (actualColumns.size !== 5) throw new Error('Favorite contiene columnas desconocidas; adopción manual requerida.');

	const nullProfiles = firstNumber(database, 'SELECT count(*) FROM "Favorite" WHERE "profileId" IS NULL');
	const missingProfiles = firstNumber(
		database,
		'SELECT count(*) FROM "Favorite" favorite LEFT JOIN "Profile" profile ON favorite."profileId" = profile."id" WHERE profile."id" IS NULL'
	);
	const duplicateGroups = firstNumber(
		database,
		`SELECT count(*) FROM (
			SELECT 1 FROM "Favorite"
			GROUP BY "profileId",
				CASE lower("entityType") WHEN 'jsonfile' THEN 'jsonFile' WHEN 'worlditem' THEN 'worldItem' ELSE lower("entityType") END,
				"entityId"
			HAVING count(*) > 1
		)`
	);
	if (nullProfiles > 0 || missingProfiles > 0 || duplicateGroups > 0) {
		throw new Error(
			`Favorite requiere reconciliación antes de adoptar: nullProfile=${nullProfiles}, missingProfile=${missingProfiles}, duplicateGroups=${duplicateGroups}.`
		);
	}
	return firstNumber(database, 'SELECT count(*) FROM "Favorite"');
}

function migrationStatementsByIndex(statements: string[]): Map<string, string> {
	const result = new Map<string, string>();
	for (const statement of statements) {
		const match = /^CREATE (?:UNIQUE )?INDEX `([^`]+)`/i.exec(statement);
		if (match) result.set(match[1], statement);
	}
	return result;
}

function rebuildFavorite(database: Database, baselineStatements: string[]): void {
	const createStatement = baselineStatements.find((statement) => /^CREATE TABLE `Favorite`/i.test(statement));
	if (!createStatement) throw new Error('El baseline no contiene CREATE TABLE Favorite.');
	const indexStatements = migrationStatementsByIndex(baselineStatements);
	for (const name of FAVORITE_INDEXES) database.exec(`DROP INDEX IF EXISTS ${quoteIdentifier(name)}`);
	database.exec('ALTER TABLE "Favorite" RENAME TO "__legacy_Favorite_adoption"');
	database.exec(createStatement);
	database.exec(
		'INSERT INTO "Favorite" ("id", "profileId", "entityType", "entityId", "addedAt") SELECT "id", "profileId", "entityType", "entityId", "addedAt" FROM "__legacy_Favorite_adoption"'
	);
	database.exec('DROP TABLE "__legacy_Favorite_adoption"');
	for (const name of FAVORITE_INDEXES) {
		const statement = indexStatements.get(name);
		if (!statement) throw new Error(`El baseline no contiene el índice ${name}.`);
		database.exec(statement);
	}
}

function reconcileIndexes(database: Database, baselineStatements: string[], drift: SchemaDriftReport): void {
	const indexStatements = migrationStatementsByIndex(baselineStatements);
	const favoriteTableChanged = drift.changed.includes('table:Favorite');
	if (favoriteTableChanged) {
		rebuildFavorite(database, baselineStatements);
	} else {
		for (const name of FAVORITE_INDEXES) {
			const key = `index:${name}`;
			if (!(drift.changed.includes(key) || drift.missing.includes(key))) continue;
			const statement = indexStatements.get(name);
			if (!statement) throw new Error(`El baseline no contiene el índice ${name}.`);
			database.exec(`DROP INDEX IF EXISTS ${quoteIdentifier(name)}`);
			database.exec(statement);
		}
	}

	for (const name of ADDITIVE_INDEXES) {
		if (!drift.missing.includes(`index:${name}`)) continue;
		const statement = indexStatements.get(name);
		if (!statement) throw new Error(`El baseline no contiene el índice ${name}.`);
		database.exec(statement);
	}
}

function recordBaseline(database: Database, migration: Awaited<ReturnType<typeof loadMigrations>>[number]): void {
	database.exec(`
		CREATE TABLE ${MIGRATION_TABLE} (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			checksum TEXT NOT NULL,
			appliedAt TEXT NOT NULL,
			durationMs INTEGER NOT NULL CHECK(durationMs >= 0)
		)
	`);
	database
		.query(`INSERT INTO ${MIGRATION_TABLE} (version, name, checksum, appliedAt, durationMs) VALUES (?, ?, ?, ?, ?)`)
		.run(migration.version, migration.name, migration.checksum, new Date().toISOString(), 0);
	database.exec(`PRAGMA user_version = ${migration.version + 1}`);
}

function createBaselineContract(baseline: Awaited<ReturnType<typeof loadMigrations>>[number]) {
	const database = new Database(':memory:', { strict: true });
	try {
		for (const statement of baseline.statements) database.exec(statement);
		return createSchemaContract(database, baseline.name);
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

function expectedCountsAfterOwnedBridgeRepair(
	database: Database,
	sourceCounts: Record<string, number>
): Record<string, number> {
	const expectedCounts = { ...sourceCounts };
	for (const [bridgeTable, leftTable, rightTable] of OWNED_BRIDGE_REPAIRS) {
		if (!(bridgeTable in sourceCounts)) continue;
		expectedCounts[bridgeTable] = firstNumber(
			database,
			`SELECT count(*)
			 FROM ${quoteIdentifier(bridgeTable)} bridge
			 INNER JOIN ${quoteIdentifier(leftTable)} left_owner ON left_owner."id" = bridge."A"
			 INNER JOIN ${quoteIdentifier(rightTable)} right_owner ON right_owner."id" = bridge."B"`
		);
	}
	return expectedCounts;
}

function assertCountsPreserved(expectedCounts: Record<string, number>, outputCounts: Record<string, number>): void {
	for (const [tableName, expectedCount] of Object.entries(expectedCounts)) {
		if (outputCounts[tableName] !== expectedCount) {
			throw new Error(
				`El conteo de ${tableName} no coincide con la reconciliación permitida: esperado=${expectedCount}, actual=${outputCounts[tableName]}.`
			);
		}
	}
	const outputOnlyWithRows = Object.keys(outputCounts).filter(
		(tableName) =>
			!(tableName in expectedCounts) && tableName !== MIGRATION_TABLE && Number(outputCounts[tableName] ?? 0) !== 0
	);
	if (outputOnlyWithRows.length > 0) {
		throw new Error('La adopción produjo filas en tablas de dominio que no existían en el backup.');
	}
}

async function assertOutputLocation(outputPath: string, backupPath: string, workspaceRoot: string): Promise<void> {
	if (resolve(outputPath) === resolve(backupPath)) throw new Error('El output no puede sobrescribir el backup fuente.');
	const outputParent = dirname(resolve(outputPath));
	await mkdir(outputParent, { recursive: true });
	const [canonicalParent, canonicalWorkspace] = await Promise.all([realpath(outputParent), realpath(workspaceRoot)]);
	if (isPathInside(canonicalWorkspace, canonicalParent)) {
		throw new Error('La copia adoptada debe quedar fuera del workspace/Git.');
	}
	if (await stat(outputPath).catch(() => null)) throw new Error('El output ya existe y no será sobrescrito.');
}

export async function adoptLegacyBackup({
	backupPath,
	manifestPath,
	outputPath,
	workspaceRoot = process.cwd(),
}: LegacyAdoptionOptions): Promise<LegacyAdoptionReport> {
	const resolvedBackupPath = resolve(backupPath);
	const resolvedOutputPath = resolve(outputPath);
	await assertOutputLocation(resolvedOutputPath, resolvedBackupPath, resolve(workspaceRoot));
	const sourceManifest = await verifyExistingBackup({ backupPath: resolvedBackupPath, manifestPath });
	await copyFile(resolvedBackupPath, resolvedOutputPath, fileSystemConstants.COPYFILE_EXCL);

	let database: Database | null = null;
	try {
		const migrations = await loadMigrations();
		const baseline = migrations[0];
		if (!baseline || baseline.version !== 0)
			throw new Error('La historia canónica no comienza con baseline versión 0.');
		const baselineContract = createBaselineContract(baseline);
		database = new Database(resolvedOutputPath, { strict: true });
		if (database.query("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?").get(MIGRATION_TABLE)) {
			throw new Error('La copia ya contiene historial de migraciones; usa db:migrate en lugar de adopción.');
		}

		const driftBefore = compareSchema(database, baselineContract);
		assertAdoptableDrift(driftBefore);
		const favoriteRowsPreserved = assertFavoriteRowsAreAdoptable(database);
		const expectedOutputCounts = expectedCountsAfterOwnedBridgeRepair(database, sourceManifest.inventory.tableCounts);
		database.exec('PRAGMA busy_timeout = 5000');
		database.exec('BEGIN IMMEDIATE');
		try {
			reconcileIndexes(database, baseline.statements, driftBefore);
			recordBaseline(database, baseline);
			const driftAfter = compareSchema(database, baselineContract);
			const unknownAfter = driftAfter.extra.filter((entry) => entry.classification === 'unknown');
			if (driftAfter.missing.length > 0 || driftAfter.changed.length > 0 || unknownAfter.length > 0) {
				throw new Error('La adopción no produjo el contrato canónico exacto.');
			}
			if (database.query('PRAGMA foreign_key_check').all().length > 0) {
				throw new Error('La adopción introdujo violaciones de foreign keys.');
			}
			if (firstNumber(database, 'SELECT count(*) FROM "Favorite"') !== favoriteRowsPreserved) {
				throw new Error('La reconstrucción de Favorite cambió su cantidad de filas.');
			}
			database.exec('COMMIT');
		} catch (error) {
			rollbackQuietly(database);
			throw error;
		}
		database.clearQueryCache();
		database.close();
		database = null;
		await migrateDatabase({ allowExistingPending: true, databasePath: resolvedOutputPath });

		const [check, outputInventory, verifiedSourceAgain] = await Promise.all([
			checkDatabase({ databasePath: resolvedOutputPath }),
			inventoryDatabase(resolvedOutputPath),
			verifyExistingBackup({ backupPath: resolvedBackupPath, manifestPath }),
		]);
		if (!check.healthy) throw new Error('La copia adoptada no supera db:check.');
		assertCountsPreserved(expectedOutputCounts, outputInventory.tableCounts);
		if (verifiedSourceAgain.sha256 !== sourceManifest.sha256)
			throw new Error('El backup fuente cambió durante la adopción.');

		return {
			backupSha256: sourceManifest.sha256,
			driftBefore: {
				changed: driftBefore.changed,
				extra: driftBefore.extra,
				missing: driftBefore.missing,
			},
			favoriteRowsPreserved,
			healthy: true,
			migration: baseline.name,
			outputByteSize: outputInventory.byteSize,
			tableCount: Object.keys(outputInventory.tableCounts).length,
		};
	} catch (error) {
		if (database) {
			rollbackQuietly(database);
			database.clearQueryCache();
			database.close();
			database = null;
		}
		await rm(resolvedOutputPath, { force: true, maxRetries: 20, retryDelay: 100 });
		throw error;
	}
}

if (import.meta.main) {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			backup: { type: 'string' },
			json: { type: 'boolean' },
			manifest: { type: 'string' },
			output: { type: 'string' },
		},
		strict: true,
	});
	if (!(values.backup && values.output)) {
		console.error(
			'Uso: bun run db:adopt-legacy -- --backup <backup.sqlite> --output <copy.sqlite> [--manifest <manifest>]'
		);
		process.exit(2);
	}
	try {
		const report = await adoptLegacyBackup({
			backupPath: values.backup,
			manifestPath: values.manifest,
			outputPath: values.output,
		});
		console.log(values.json ? JSON.stringify(report) : JSON.stringify(report, null, 2));
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
