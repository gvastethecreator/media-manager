import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const SCHEMA_CONTRACT_PATH = resolve(import.meta.dir, '../../src/lib/drizzle/schema-contract.json');

const MIGRATION_TABLE = '__media_manager_migrations';

const FTS_EXTENSION_OBJECTS = new Set([
	'table:media_fts:media_fts',
	'table:media_fts_config:media_fts_config',
	'table:media_fts_content:media_fts_content',
	'table:media_fts_data:media_fts_data',
	'table:media_fts_docsize:media_fts_docsize',
	'table:media_fts_idx:media_fts_idx',
	'trigger:audios_ad:Audio',
	'trigger:audios_ai:Audio',
	'trigger:audios_au:Audio',
	'trigger:documents_ad:Document',
	'trigger:documents_ai:Document',
	'trigger:documents_au:Document',
	'trigger:images_ad:Image',
	'trigger:images_ai:Image',
	'trigger:images_au:Image',
	'trigger:videos_ad:Video',
	'trigger:videos_ai:Video',
	'trigger:videos_au:Video',
]);

const FTS_ROOT_SQL_HASH = '2b9722453e29592658fc4d0b23fda5a1bfcfdbebe185f98f5c0e38c44e81b34e';

const FTS_TRIGGER_SQL_HASHES = new Map([
	['audios_ad', '5a4b6b1962e47d1883475816554b89e124980703c8ced0cfc60a55126f6981fc'],
	['audios_ai', 'c6757f59d9da2934f1fa369db2b2d4fdd45767eafdc7ac2d7eb34ccb9bf08436'],
	['audios_au', '11e21055dab57c41fd0985a7d2e9a1240420399428cfb365bf3214ac443383c4'],
	['documents_ad', '0650bffc2da8ed634814e249b95a2169e97a1935056a9ee9fd4899e19d5c4af6'],
	['documents_ai', '1a9b06123592cc96d0725f6e1eaa3d27514c83cee6837b8f63d9a10a3702119f'],
	['documents_au', '8aa5f52620c836a7f04629eaccafd07add4d4f2a10731f90d6a407ab6a9ae519'],
	['images_ad', '6be74aec0177a1c68d76ffaa06e686280687663088ec29c370a559c899c6ddd6'],
	['images_ai', '2e7cff8999660ca8e88b825bb4e7ad1dfd47fbd3dcc4294b958b773bac521d7a'],
	['images_au', '40585ec33a443bea4c1a9750a08fa61b7fd4f4d02943b2e12f38adea9f11bd25'],
	['videos_ad', '90a38f4cda54802970f5e6b1f59fa66aadb4a84037bd6a0a7a64781d38c81a4b'],
	['videos_ai', 'b65796eecf3f2eddad362f2977315fa76892c99b7c225c6a95af11b1c060aa24'],
	['videos_au', '13e316ed25a6c25157a86e0c1b1ad85a590b1b5fe42389ddadc1b0e93ac2cc9e'],
]);

export type SchemaObject = {
	name: string;
	sqlHash: string;
	tableName: string;
	type: 'index' | 'table' | 'trigger' | 'view';
};

export type SchemaContract = {
	formatVersion: 1;
	fingerprint: string;
	generatedFrom: string;
	objects: SchemaObject[];
};

export type SchemaDriftReport = {
	actualFingerprint: string;
	changed: string[];
	expectedFingerprint: string;
	extra: Array<{ classification: 'extension' | 'legacy' | 'unknown'; name: string; type: string }>;
	missing: string[];
};

type SqliteSchemaRow = {
	name: string;
	sql: string | null;
	tableName: string;
	type: SchemaObject['type'];
};

const LEGACY_OBJECTS = new Set([
	'Asset',
	'AudioAsset',
	'DocumentAsset',
	'ImageAsset',
	'JsonAsset',
	'Task',
	'VideoAsset',
	'_AlbumToTask',
	'_CharacterToTask',
	'_ImageToTask',
	'_VideoToTask',
]);

function normalizeSql(sql: string | null): string {
	return (sql ?? '').replaceAll(/\s+/g, ' ').trim();
}

function hash(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function hasValidFtsRoot(rows: SqliteSchemaRow[]): boolean {
	const root = rows.find((row) => row.type === 'table' && row.name === 'media_fts' && row.tableName === 'media_fts');
	return Boolean(root && hash(normalizeSql(root.sql)) === FTS_ROOT_SQL_HASH);
}

function isFtsExtension(row: SqliteSchemaRow, validFtsRoot: boolean): boolean {
	if (!(validFtsRoot && FTS_EXTENSION_OBJECTS.has(`${row.type}:${row.name}:${row.tableName}`))) return false;
	if (row.type !== 'trigger') return true;
	return hash(normalizeSql(row.sql)) === FTS_TRIGGER_SQL_HASHES.get(row.name);
}

function isManagedObject(row: SqliteSchemaRow, validFtsRoot: boolean): boolean {
	return row.name !== MIGRATION_TABLE && !row.name.startsWith('sqlite_') && !isFtsExtension(row, validFtsRoot);
}

function classifyExtra(row: SqliteSchemaRow, validFtsRoot: boolean): 'extension' | 'legacy' | 'unknown' {
	if (row.name.startsWith('sqlite_') || row.name === MIGRATION_TABLE || isFtsExtension(row, validFtsRoot)) {
		return 'extension';
	}
	if (LEGACY_OBJECTS.has(row.name) || LEGACY_OBJECTS.has(row.tableName)) return 'legacy';
	return 'unknown';
}

export function readSchemaObjects(database: Database): SchemaObject[] {
	const rows = database
		.query(
			`SELECT name, tbl_name AS tableName, type, sql
			 FROM sqlite_schema
			 WHERE type IN ('table', 'index', 'trigger', 'view')
			 ORDER BY type, name`
		)
		.all() as SqliteSchemaRow[];

	const validFtsRoot = hasValidFtsRoot(rows);
	return rows
		.filter((row) => isManagedObject(row, validFtsRoot))
		.map((row) => ({
			name: row.name,
			sqlHash: hash(normalizeSql(row.sql)),
			tableName: row.tableName,
			type: row.type,
		}));
}

export function fingerprintSchemaObjects(objects: SchemaObject[]): string {
	return hash(JSON.stringify(objects));
}

export function createSchemaContract(database: Database, generatedFrom = 'src/lib/drizzle/migrations'): SchemaContract {
	const objects = readSchemaObjects(database);
	return {
		formatVersion: 1,
		fingerprint: fingerprintSchemaObjects(objects),
		generatedFrom,
		objects,
	};
}

export async function loadSchemaContract(contractPath = SCHEMA_CONTRACT_PATH): Promise<SchemaContract> {
	const parsed = JSON.parse(await readFile(contractPath, 'utf8')) as Partial<SchemaContract>;
	if (parsed.formatVersion !== 1 || !Array.isArray(parsed.objects) || typeof parsed.fingerprint !== 'string') {
		throw new Error(`Contrato de schema inválido: ${contractPath}`);
	}
	if (fingerprintSchemaObjects(parsed.objects) !== parsed.fingerprint) {
		throw new Error(`Fingerprint autocontenido inválido: ${contractPath}`);
	}
	return parsed as SchemaContract;
}

export function compareSchema(database: Database, contract: SchemaContract): SchemaDriftReport {
	const rows = database
		.query(
			`SELECT name, tbl_name AS tableName, type, sql
			 FROM sqlite_schema
			 WHERE type IN ('table', 'index', 'trigger', 'view')
			 ORDER BY type, name`
		)
		.all() as SqliteSchemaRow[];
	const validFtsRoot = hasValidFtsRoot(rows);
	const actualManaged = rows
		.filter((row) => isManagedObject(row, validFtsRoot))
		.map((row) => ({
			name: row.name,
			sqlHash: hash(normalizeSql(row.sql)),
			tableName: row.tableName,
			type: row.type,
		}));
	const expectedByKey = new Map(contract.objects.map((entry) => [`${entry.type}:${entry.name}`, entry]));
	const actualByKey = new Map(actualManaged.map((entry) => [`${entry.type}:${entry.name}`, entry]));
	const missing: string[] = [];
	const changed: string[] = [];
	for (const [key, expected] of expectedByKey) {
		const actual = actualByKey.get(key);
		if (!actual) missing.push(key);
		else if (actual.sqlHash !== expected.sqlHash || actual.tableName !== expected.tableName) changed.push(key);
	}

	const expectedNames = new Set(contract.objects.map((entry) => `${entry.type}:${entry.name}`));
	const extra = rows
		.filter((row) => !expectedNames.has(`${row.type}:${row.name}`))
		.map((row) => ({ classification: classifyExtra(row, validFtsRoot), name: row.name, type: row.type }));

	return {
		actualFingerprint: fingerprintSchemaObjects(
			actualManaged.filter((entry) => expectedByKey.has(`${entry.type}:${entry.name}`))
		),
		changed,
		expectedFingerprint: contract.fingerprint,
		extra,
		missing,
	};
}
