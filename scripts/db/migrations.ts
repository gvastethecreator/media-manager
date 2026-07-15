#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { resolveDatabasePath } from './database-safety';
import { compareSchema, loadSchemaContract, type SchemaDriftReport } from './schema-fingerprint';

export const MIGRATIONS_DIRECTORY = resolve(import.meta.dir, '../../src/lib/drizzle/migrations');
export const MIGRATION_TABLE = '__media_manager_migrations';

export type MigrationFile = {
	checksum: string;
	name: string;
	path: string;
	statements: string[];
	version: number;
};

export type MigrationState = 'applied' | 'modified' | 'pending';

export type MigrationStatus = {
	checksum: string;
	databaseChecksum?: string;
	name: string;
	state: MigrationState;
	version: number;
};

export type DatabaseCheck = {
	foreignKeyViolations: number;
	healthy: boolean;
	integrity: string;
	migrations: MigrationStatus[];
	schema: SchemaDriftReport;
	unknownMigrations: string[];
	userVersion: number;
};

type AppliedMigration = {
	checksum: string;
	name: string;
	version: number;
};

type DrizzleJournal = {
	entries: Array<{ idx: number; tag: string }>;
};

type MigrationOptions = {
	busyTimeoutMs?: number;
	databasePath: string;
	migrationsDirectory?: string;
};

const MIGRATION_FILE_PATTERN = /^(\d{4})_([a-z0-9][a-z0-9_-]*)\.sql$/;

function checksumSql(sql: string): string {
	return createHash('sha256').update(sql).digest('hex');
}

function hasMigrationTable(database: Database): boolean {
	return Boolean(
		database.query("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ? LIMIT 1").get(MIGRATION_TABLE)
	);
}

function readAppliedMigrations(database: Database): AppliedMigration[] {
	if (!hasMigrationTable(database)) return [];
	return database
		.query(`SELECT version, name, checksum FROM ${MIGRATION_TABLE} ORDER BY version`)
		.all() as AppliedMigration[];
}

function countApplicationObjects(database: Database): number {
	const row = database
		.query(
			`SELECT count(*) AS count FROM sqlite_schema
			 WHERE type IN ('table', 'view')
			   AND name NOT LIKE 'sqlite_%'
			   AND name <> ?`
		)
		.get(MIGRATION_TABLE) as { count: number };
	return Number(row.count);
}

function ensureMigrationTable(database: Database): void {
	database.exec(`
		CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			checksum TEXT NOT NULL,
			appliedAt TEXT NOT NULL,
			durationMs INTEGER NOT NULL CHECK(durationMs >= 0)
		)
	`);
}

function validateMigrationHistory(database: Database, migrations: MigrationFile[]): void {
	const applied = readAppliedMigrations(database);
	const applicationObjectCount = countApplicationObjects(database);
	if (applied.length === 0) {
		if (applicationObjectCount > 0) {
			throw new Error(
				'La base contiene schema sin un prefijo de migraciones válido. Ejecuta db:check sobre una copia y adopta sólo tras reconciliar.'
			);
		}
		return;
	}

	for (let index = 0; index < applied.length; index += 1) {
		const entry = applied[index];
		const expected = migrations[index];
		if (!expected || entry.version >= migrations.length) {
			throw new Error(`El historial contiene una migración desconocida: ${entry.name}`);
		}
		if (entry.version !== index) {
			throw new Error(`El historial de migraciones no es continuo: se esperaba ${index} y apareció ${entry.version}.`);
		}
		if (entry.name !== expected.name || entry.checksum !== expected.checksum) {
			throw new Error(`Migración aplicada fue modificada: ${expected.name}`);
		}
	}
}

async function validateCanonicalSchema(database: Database, migrationsDirectory: string): Promise<void> {
	if (resolve(migrationsDirectory) !== resolve(MIGRATIONS_DIRECTORY)) return;
	const schema = compareSchema(database, await loadSchemaContract());
	const unknown = schema.extra.filter((entry) => entry.classification === 'unknown');
	if (schema.missing.length > 0 || schema.changed.length > 0 || unknown.length > 0) {
		throw new Error(
			'El schema resultante no coincide con el contrato canónico; ejecuta db:check para diagnosticar drift.'
		);
	}
}

function rollbackQuietly(database: Database): void {
	try {
		database.exec('ROLLBACK');
	} catch {
		// The failed statement may already have ended the transaction.
	}
}

export async function loadMigrations(migrationsDirectory = MIGRATIONS_DIRECTORY): Promise<MigrationFile[]> {
	const names = (await readdir(migrationsDirectory)).filter((name) => name.endsWith('.sql')).sort();
	const journal = JSON.parse(
		await readFile(resolve(migrationsDirectory, 'meta', '_journal.json'), 'utf8')
	) as DrizzleJournal;
	if (!Array.isArray(journal.entries)) throw new Error('Journal de migraciones inválido.');
	const migrations: MigrationFile[] = [];
	let previousVersion = -1;
	for (const name of names) {
		const match = MIGRATION_FILE_PATTERN.exec(name);
		if (!match) throw new Error(`Nombre de migración no monotónico: ${name}`);
		const version = Number.parseInt(match[1], 10);
		if (version !== previousVersion + 1) {
			throw new Error(`Secuencia de migraciones inválida: se esperaba ${previousVersion + 1} y apareció ${version}.`);
		}
		const path = resolve(migrationsDirectory, name);
		const sql = await readFile(path, 'utf8');
		const statements = sql
			.split('--> statement-breakpoint')
			.map((statement) => statement.trim())
			.filter(Boolean);
		if (statements.length === 0) throw new Error(`Migración vacía: ${name}`);
		migrations.push({ checksum: checksumSql(sql), name, path, statements, version });
		previousVersion = version;
	}
	if (migrations.length === 0) throw new Error(`No hay migraciones SQL en ${migrationsDirectory}`);
	const journalTags = journal.entries.map((entry) => entry.tag);
	const migrationTags = migrations.map((entry) => entry.name.replace(/\.sql$/, ''));
	if (JSON.stringify(journalTags) !== JSON.stringify(migrationTags)) {
		throw new Error('El journal Drizzle no coincide con la secuencia SQL versionada.');
	}
	return migrations;
}

function toStatus(migration: MigrationFile, state: MigrationState, databaseChecksum?: string): MigrationStatus {
	return {
		checksum: migration.checksum,
		...(databaseChecksum ? { databaseChecksum } : {}),
		name: migration.name,
		state,
		version: migration.version,
	};
}

export async function inspectMigrationStatus({
	databasePath,
	migrationsDirectory = MIGRATIONS_DIRECTORY,
}: MigrationOptions): Promise<{ migrations: MigrationStatus[]; unknownMigrations: string[] }> {
	const migrations = await loadMigrations(migrationsDirectory);
	if (!(await stat(databasePath).catch(() => null))) {
		return {
			migrations: migrations.map((migration) => toStatus(migration, 'pending')),
			unknownMigrations: [],
		};
	}
	const database = new Database(databasePath, { readonly: true, strict: true });
	try {
		const applied = readAppliedMigrations(database);
		const appliedByVersion = new Map(applied.map((entry) => [entry.version, entry]));
		const knownVersions = new Set(migrations.map((entry) => entry.version));
		return {
			migrations: migrations.map((migration) => {
				const databaseMigration = appliedByVersion.get(migration.version);
				if (!databaseMigration) return toStatus(migration, 'pending');
				const state =
					databaseMigration.name === migration.name && databaseMigration.checksum === migration.checksum
						? ('applied' as const)
						: ('modified' as const);
				return toStatus(migration, state, databaseMigration.checksum);
			}),
			unknownMigrations: applied.filter((entry) => !knownVersions.has(entry.version)).map((entry) => entry.name),
		};
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

export async function migrateDatabase({
	busyTimeoutMs = 5_000,
	databasePath,
	migrationsDirectory = MIGRATIONS_DIRECTORY,
}: MigrationOptions): Promise<{ applied: string[]; skipped: string[] }> {
	const migrations = await loadMigrations(migrationsDirectory);
	const database = new Database(databasePath, { create: true, strict: true });
	const applied: string[] = [];
	const skipped: string[] = [];
	try {
		database.exec(`PRAGMA busy_timeout = ${Math.max(0, Math.trunc(busyTimeoutMs))}`);

		for (const migration of migrations) {
			const startedAt = performance.now();
			database.exec('BEGIN IMMEDIATE');
			try {
				validateMigrationHistory(database, migrations);
				ensureMigrationTable(database);
				const existing = database
					.query(`SELECT version, name, checksum FROM ${MIGRATION_TABLE} WHERE version = ?`)
					.get(migration.version) as AppliedMigration | null;
				if (existing) {
					if (existing.name !== migration.name || existing.checksum !== migration.checksum) {
						throw new Error(`Migración aplicada fue modificada: ${migration.name}`);
					}
					database.exec('COMMIT');
					skipped.push(migration.name);
					continue;
				}
				for (const statement of migration.statements) database.exec(statement);
				const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
				database
					.query(
						`INSERT INTO ${MIGRATION_TABLE} (version, name, checksum, appliedAt, durationMs)
						 VALUES (?, ?, ?, ?, ?)`
					)
					.run(migration.version, migration.name, migration.checksum, new Date().toISOString(), durationMs);
				database.exec(`PRAGMA user_version = ${migration.version + 1}`);
				database.exec('COMMIT');
				applied.push(migration.name);
			} catch (error) {
				rollbackQuietly(database);
				throw error;
			}
		}
		await validateCanonicalSchema(database, migrationsDirectory);
		return { applied, skipped };
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

export async function checkDatabase({
	databasePath,
	migrationsDirectory = MIGRATIONS_DIRECTORY,
}: MigrationOptions): Promise<DatabaseCheck> {
	const status = await inspectMigrationStatus({ databasePath, migrationsDirectory });
	const database = new Database(databasePath, { readonly: true, strict: true });
	try {
		const integrityRow = database.query('PRAGMA integrity_check').get() as Record<string, unknown>;
		const integrity = String(Object.values(integrityRow)[0] ?? 'unknown');
		const foreignKeyViolations = database.query('PRAGMA foreign_key_check').all().length;
		const userVersionRow = database.query('PRAGMA user_version').get() as Record<string, unknown>;
		const userVersion = Number(Object.values(userVersionRow)[0] ?? 0);
		const schema = compareSchema(database, await loadSchemaContract());
		const migrationFailure = status.migrations.some((entry) => entry.state !== 'applied');
		const schemaFailure =
			schema.missing.length > 0 ||
			schema.changed.length > 0 ||
			schema.extra.some((entry) => entry.classification === 'unknown');
		return {
			foreignKeyViolations,
			healthy:
				integrity === 'ok' &&
				foreignKeyViolations === 0 &&
				!migrationFailure &&
				status.unknownMigrations.length === 0 &&
				!schemaFailure,
			integrity,
			migrations: status.migrations,
			schema,
			unknownMigrations: status.unknownMigrations,
			userVersion,
		};
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

function parseCli(arguments_: string[]): { command: string; databasePath: string; json: boolean } {
	const [command, ...options] = arguments_;
	const databaseIndex = options.indexOf('--database');
	const databaseInput = databaseIndex >= 0 ? options[databaseIndex + 1] : process.env.DATABASE_URL;
	if (!command) throw new Error('Comando requerido: migrate | status | plan | check');
	if (!databaseInput) throw new Error('DATABASE_URL o --database es obligatorio; no existe fallback a db.sqlite.');
	return { command, databasePath: resolveDatabasePath(databaseInput), json: options.includes('--json') };
}

async function runCli(): Promise<void> {
	const { command, databasePath, json } = parseCli(process.argv.slice(2));
	if (command === 'migrate') {
		const result = await migrateDatabase({ databasePath });
		console.log(
			json ? JSON.stringify(result) : `Aplicadas: ${result.applied.length}; existentes: ${result.skipped.length}`
		);
		return;
	}
	if (command === 'status' || command === 'plan') {
		const result = await inspectMigrationStatus({ databasePath });
		const output = command === 'plan' ? result.migrations.filter((entry) => entry.state !== 'applied') : result;
		console.log(json ? JSON.stringify(output) : JSON.stringify(output, null, 2));
		if (result.unknownMigrations.length > 0 || result.migrations.some((entry) => entry.state === 'modified')) {
			process.exitCode = 1;
		}
		return;
	}
	if (command === 'check') {
		const result = await checkDatabase({ databasePath });
		console.log(json ? JSON.stringify(result) : JSON.stringify(result, null, 2));
		if (!result.healthy) process.exitCode = 1;
		return;
	}
	throw new Error(`Comando desconocido: ${command}`);
}

if (import.meta.main) {
	await runCli().catch((error) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	});
}
