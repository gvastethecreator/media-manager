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

// Current runtime index. Keep the historical media_fts contract for existing libraries.
const FILES_FTS_SQL_HASHES = new Map([
	['table:files_fts:files_fts', '3e77aa8fc2ed5f1ba2d03004a44bbd41e3e8828644584770b330e3ddfe84a2ac'],
	['table:files_fts_config:files_fts_config', '3ad29d0ee113f37dca21e7510a82874aee7093507d33387d6579c0f9f80944a8'],
	['table:files_fts_content:files_fts_content', 'bcc5acc10c331c6ba81e72daea9333683295c78597b35b9f8949ebc335511c22'],
	['table:files_fts_data:files_fts_data', '4c0d2ca2e1f88df754b0b60fb4021ec37810f13b5667b86a7f128de1f667d8fd'],
	['table:files_fts_docsize:files_fts_docsize', '571ba040ef6b4941b8f8f4eea43a9e9037c7eab39a5ef7eb7fe3383fbc35b5af'],
	['table:files_fts_idx:files_fts_idx', '4803cab27be24f262be4c201ea206d49c218d1c9921ef6d5627013ee031a42c2'],
	['trigger:audios_ad:Audio', 'a36e2c52344e21b85b3a67471ec937ca83476e62bfb97d90dce55dced937c12b'],
	['trigger:audios_ai:Audio', '1dd2b81774aa90fd15575610ce5e0f4ea9eb19a5b8fd3b8c006d5aab1c116c38'],
	['trigger:audios_au:Audio', 'ae5994dc4fdf71a03cd81c9949b2aeaf361c60b7c2702bbc125cb2f5c6f0aa9d'],
	['trigger:documents_ad:Document', '5d5cc93153433a0608cc6a8bc0ddbcc23a3cd9a847f89c1369cdee087098d3ba'],
	['trigger:documents_ai:Document', 'e1ead04ed23e3e9e0d2ad2520f5d034a23374d2c5a6611d5c9e9bdd025eeda49'],
	['trigger:documents_au:Document', '2f8459c7eb72cd73553c05f5f900767b19ed8c1bc81557dc9c79f7fc48ededed'],
	['trigger:images_ad:Image', 'd4fc08065bc42c4a8899371c9904b46c73d46b1863bc9f51f77ce424d9e1b8eb'],
	['trigger:images_ai:Image', 'ba265cf351a505f0d1481da77d37f5e9bdc080fbb5199aa559b74d638fefde04'],
	['trigger:images_au:Image', '75c33b2e74ad7328b4b96b5802d4ac3bb3d100313082da656d351c3dbfb52082'],
	['trigger:videos_ad:Video', 'f652515ed1a2be7bb5d0b5696435398a9b83764204a8710234c47b4f74f93413'],
	['trigger:videos_ai:Video', 'c43c9e782478bb76b0d20d0c4d2443029dadc31735d06cc340038a04839229c7'],
	['trigger:videos_au:Video', 'aab74af4a6d2730dbbd372eb388aa225dd402042a3a267a5d58173727f6517b7'],
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

function hasValidFtsRoot(rows: SqliteSchemaRow[], name = 'media_fts'): boolean {
	const root = rows.find((row) => row.type === 'table' && row.name === name && row.tableName === name);
	const expected = name === 'media_fts' ? FTS_ROOT_SQL_HASH : FILES_FTS_SQL_HASHES.get('table:files_fts:files_fts');
	return Boolean(root && hash(normalizeSql(root.sql)) === expected);
}

function isFtsExtension(row: SqliteSchemaRow, validFtsRoot: boolean, validFilesFtsRoot: boolean): boolean {
	if (
		validFilesFtsRoot &&
		FILES_FTS_SQL_HASHES.get(`${row.type}:${row.name}:${row.tableName}`) === hash(normalizeSql(row.sql))
	)
		return true;
	if (!(validFtsRoot && FTS_EXTENSION_OBJECTS.has(`${row.type}:${row.name}:${row.tableName}`))) return false;
	if (row.type !== 'trigger') return true;
	return hash(normalizeSql(row.sql)) === FTS_TRIGGER_SQL_HASHES.get(row.name);
}

function isManagedObject(row: SqliteSchemaRow, validFtsRoot: boolean, validFilesFtsRoot: boolean): boolean {
	return (
		row.name !== MIGRATION_TABLE &&
		!row.name.startsWith('sqlite_') &&
		!isFtsExtension(row, validFtsRoot, validFilesFtsRoot)
	);
}

function classifyExtra(
	row: SqliteSchemaRow,
	validFtsRoot: boolean,
	validFilesFtsRoot: boolean
): 'extension' | 'legacy' | 'unknown' {
	if (
		row.name.startsWith('sqlite_') ||
		row.name === MIGRATION_TABLE ||
		isFtsExtension(row, validFtsRoot, validFilesFtsRoot)
	) {
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
	const validFilesFtsRoot = hasValidFtsRoot(rows, 'files_fts');
	return rows
		.filter((row) => isManagedObject(row, validFtsRoot, validFilesFtsRoot))
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
	const validFilesFtsRoot = hasValidFtsRoot(rows, 'files_fts');
	const actualManaged = rows
		.filter((row) => isManagedObject(row, validFtsRoot, validFilesFtsRoot))
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
		.map((row) => ({
			classification: classifyExtra(row, validFtsRoot, validFilesFtsRoot),
			name: row.name,
			type: row.type,
		}));

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
