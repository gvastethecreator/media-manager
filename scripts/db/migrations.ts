#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { open, readdir, readFile, rm, stat, statfs } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { resolveDatabasePath } from './database-safety';
import { compareSchema, loadSchemaContract, type SchemaDriftReport } from './schema-fingerprint';

export const MIGRATIONS_DIRECTORY = resolve(import.meta.dir, '../../src/lib/drizzle/migrations');
export const MIGRATION_TABLE = '__media_manager_migrations';

export type MigrationFile = {
	checksum: string;
	foreignKeysOff: boolean;
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
	diagnostics: {
		availableBytes: number;
		databaseBytes: number;
		foreignKeysEnabled: boolean;
		freelistCount: number;
		journalMode: string;
		pageCount: number;
		pageSize: number;
		sqliteVersion: string;
	};
	errors: string[];
	expectedUserVersion: number;
	foreignKeyViolations: number;
	healthy: boolean;
	integrity: string;
	migrations: MigrationStatus[];
	schema: SchemaDriftReport;
	unknownMigrations: string[];
	userVersion: number;
	status: 'error' | 'ok' | 'warning';
	warnings: string[];
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
	allowExistingPending?: boolean;
	busyTimeoutMs?: number;
	databasePath: string;
	migrationsDirectory?: string;
	validateSchema?: boolean;
};

const MIGRATION_FILE_PATTERN = /^(\d{4})_([a-z0-9][a-z0-9_-]*)\.sql$/;
const FOREIGN_KEYS_OFF_DIRECTIVE = /^--\s*media-manager:\s*foreign-keys-off\s*$/im;

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

function validateVersionMatchesHistory(database: Database): AppliedMigration[] {
	const applied = readAppliedMigrations(database);
	const userVersion = readPragmaNumber(database, 'user_version');
	if (userVersion !== applied.length) {
		throw new Error(
			`user_version no coincide con la historia aplicada: actual=${userVersion}, esperado=${applied.length}.`
		);
	}
	return applied;
}

function validateMigrationPreconditions(
	database: Database,
	migrations: MigrationFile[],
	allowExistingPending: boolean
): AppliedMigration[] {
	validateMigrationHistory(database, migrations);
	const applied = validateVersionMatchesHistory(database);
	if (!allowExistingPending && applied.length < migrations.length && countApplicationObjects(database) > 0) {
		throw new Error(
			'db:migrate no actualiza bases existentes in-place. Usa db:upgrade para crear backup y publicar una copia nueva.'
		);
	}
	return applied;
}

async function preflightExistingDatabase(
	databasePath: string,
	migrations: MigrationFile[],
	allowExistingPending: boolean,
	busyTimeoutMs: number,
	migrationsDirectory: string,
	validateSchema: boolean
): Promise<void> {
	const target = await stat(databasePath).catch(() => null);
	if (!target || target.size === 0) return;
	const database = new Database(databasePath, { readonly: true, strict: true });
	try {
		// Connection-local only: this must not change the database rejected by preflight.
		database.exec(`PRAGMA busy_timeout = ${Math.max(0, Math.trunc(busyTimeoutMs))}`);
		const applied = validateMigrationPreconditions(database, migrations, allowExistingPending);
		if (validateSchema && applied.length === migrations.length) {
			await validateCanonicalSchema(database, migrationsDirectory);
		}
	} finally {
		database.clearQueryCache();
		database.close();
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

function readPragmaNumber(database: Database, pragma: string): number {
	const row = database.query(`PRAGMA ${pragma}`).get() as Record<string, unknown> | null;
	const value = Number(row ? Object.values(row)[0] : Number.NaN);
	if (!Number.isFinite(value)) throw new Error(`SQLite no devolvió un valor numérico para PRAGMA ${pragma}.`);
	return value;
}

function readFirstValue(row: Record<string, unknown> | null): unknown {
	return row ? Object.values(row)[0] : undefined;
}

function setForeignKeys(database: Database, enabled: boolean): void {
	database.exec(`PRAGMA foreign_keys = ${enabled ? 'ON' : 'OFF'}`);
	const actual = readPragmaNumber(database, 'foreign_keys') === 1;
	if (actual !== enabled) {
		throw new Error(`SQLite no pudo ${enabled ? 'activar' : 'desactivar'} foreign_keys fuera de la transacción.`);
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
		migrations.push({
			checksum: checksumSql(sql),
			foreignKeysOff: FOREIGN_KEYS_OFF_DIRECTIVE.test(sql),
			name,
			path,
			statements,
			version,
		});
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
	allowExistingPending = false,
	busyTimeoutMs = 5_000,
	databasePath,
	migrationsDirectory = MIGRATIONS_DIRECTORY,
	validateSchema = true,
}: MigrationOptions): Promise<{ applied: string[]; skipped: string[] }> {
	const migrations = await loadMigrations(migrationsDirectory);
	await preflightExistingDatabase(
		databasePath,
		migrations,
		allowExistingPending,
		busyTimeoutMs,
		migrationsDirectory,
		validateSchema
	);
	const database = new Database(databasePath, { create: true, strict: true });
	const applied: string[] = [];
	const skipped: string[] = [];
	try {
		database.exec(`PRAGMA busy_timeout = ${Math.max(0, Math.trunc(busyTimeoutMs))}`);
		const appliedBeforeMigration = validateMigrationPreconditions(database, migrations, allowExistingPending);
		if (validateSchema && appliedBeforeMigration.length === migrations.length) {
			await validateCanonicalSchema(database, migrationsDirectory);
		}
		const journalMode = String(
			readFirstValue(database.query('PRAGMA journal_mode = WAL').get() as Record<string, unknown> | null) ?? ''
		).toLowerCase();
		if (journalMode !== 'wal')
			throw new Error(`SQLite no pudo activar WAL para la migración; devolvió ${journalMode}.`);
		database.exec('PRAGMA synchronous = NORMAL');
		setForeignKeys(database, true);

		for (const migration of migrations) {
			const startedAt = performance.now();
			if (migration.foreignKeysOff) setForeignKeys(database, false);
			database.exec('BEGIN IMMEDIATE');
			try {
				validateMigrationHistory(database, migrations);
				validateVersionMatchesHistory(database);
				ensureMigrationTable(database);
				const existing = database
					.query(`SELECT version, name, checksum FROM ${MIGRATION_TABLE} WHERE version = ?`)
					.get(migration.version) as AppliedMigration | null;
				if (existing) {
					if (existing.name !== migration.name || existing.checksum !== migration.checksum) {
						throw new Error(`Migración aplicada fue modificada: ${migration.name}`);
					}
					database.exec('COMMIT');
					if (migration.foreignKeysOff) setForeignKeys(database, true);
					skipped.push(migration.name);
					continue;
				}
				for (const statement of migration.statements) database.exec(statement);
				const foreignKeyViolations = database.query('PRAGMA foreign_key_check').all();
				if (foreignKeyViolations.length > 0) {
					throw new Error(
						`La migración ${migration.name} dejaría ${foreignKeyViolations.length} violación(es) de claves foráneas.`
					);
				}
				const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
				database
					.query(
						`INSERT INTO ${MIGRATION_TABLE} (version, name, checksum, appliedAt, durationMs)
						 VALUES (?, ?, ?, ?, ?)`
					)
					.run(migration.version, migration.name, migration.checksum, new Date().toISOString(), durationMs);
				database.exec(`PRAGMA user_version = ${migration.version + 1}`);
				database.exec('COMMIT');
				if (migration.foreignKeysOff) setForeignKeys(database, true);
				applied.push(migration.name);
			} catch (error) {
				rollbackQuietly(database);
				if (migration.foreignKeysOff) setForeignKeys(database, true);
				throw error;
			}
		}
		const userVersion = readPragmaNumber(database, 'user_version');
		if (userVersion !== migrations.length) {
			throw new Error(
				`user_version no coincide con la historia aplicada: actual=${userVersion}, esperado=${migrations.length}.`
			);
		}
		if (validateSchema) await validateCanonicalSchema(database, migrationsDirectory);
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
		database.exec('PRAGMA foreign_keys = ON');
		const integrityRow = database.query('PRAGMA integrity_check').get() as Record<string, unknown>;
		const integrity = String(Object.values(integrityRow)[0] ?? 'unknown');
		const foreignKeyViolations = database.query('PRAGMA foreign_key_check').all().length;
		const userVersionRow = database.query('PRAGMA user_version').get() as Record<string, unknown>;
		const userVersion = Number(Object.values(userVersionRow)[0] ?? 0);
		const expectedUserVersion = status.migrations.length;
		const schema = compareSchema(database, await loadSchemaContract());
		const migrationFailure = status.migrations.some((entry) => entry.state !== 'applied');
		const schemaFailure =
			schema.missing.length > 0 ||
			schema.changed.length > 0 ||
			schema.extra.some((entry) => entry.classification === 'unknown');
		const [databaseStats, filesystemStats] = await Promise.all([stat(databasePath), statfs(dirname(databasePath))]);
		const journalMode = String(readFirstValue(database.query('PRAGMA journal_mode').get() as Record<string, unknown>));
		const foreignKeysEnabled = readPragmaNumber(database, 'foreign_keys') === 1;
		const diagnostics = {
			availableBytes: Number(filesystemStats.bavail) * Number(filesystemStats.bsize),
			databaseBytes: databaseStats.size,
			foreignKeysEnabled,
			freelistCount: readPragmaNumber(database, 'freelist_count'),
			journalMode,
			pageCount: readPragmaNumber(database, 'page_count'),
			pageSize: readPragmaNumber(database, 'page_size'),
			sqliteVersion: String(
				readFirstValue(database.query('SELECT sqlite_version() AS version').get() as Record<string, unknown>) ??
					'unknown'
			),
		};
		const errors: string[] = [];
		if (integrity !== 'ok') errors.push(`integrity_check=${integrity}`);
		if (foreignKeyViolations > 0) errors.push(`foreign_key_violations=${foreignKeyViolations}`);
		if (!foreignKeysEnabled) errors.push('foreign_keys=off');
		if (migrationFailure) errors.push('migration_history_not_current');
		if (status.unknownMigrations.length > 0) errors.push('unknown_migrations');
		if (schemaFailure) errors.push('schema_drift');
		if (userVersion !== expectedUserVersion) {
			errors.push(`user_version_mismatch=${userVersion}:${expectedUserVersion}`);
		}
		const warnings: string[] = [];
		if (journalMode.toLowerCase() !== 'wal') warnings.push(`journal_mode=${journalMode}`);
		const legacyObjects = schema.extra.filter((entry) => entry.classification === 'legacy').length;
		if (legacyObjects > 0) warnings.push(`legacy_schema_objects=${legacyObjects}`);
		if (diagnostics.availableBytes < Math.max(diagnostics.databaseBytes * 2, 1_073_741_824)) {
			warnings.push('low_free_space_for_safe_upgrade');
		}
		const healthStatus: DatabaseCheck['status'] = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok';
		return {
			diagnostics,
			errors,
			expectedUserVersion,
			foreignKeyViolations,
			healthy: errors.length === 0,
			integrity,
			migrations: status.migrations,
			schema,
			unknownMigrations: status.unknownMigrations,
			userVersion,
			status: healthStatus,
			warnings,
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

async function claimFreshDatabaseInitialization(databasePath: string): Promise<{
	release: () => Promise<void>;
}> {
	const markerPath = `${databasePath}.migration-initializing`;
	const target = await stat(databasePath).catch(() => null);
	let ownsMarker = false;
	let waitsForOwner = false;
	if (!target || target.size === 0) {
		try {
			const marker = await open(markerPath, 'wx');
			try {
				await marker.writeFile(JSON.stringify({ createdAt: new Date().toISOString(), processId: process.pid }), 'utf8');
			} finally {
				await marker.close();
			}
			ownsMarker = true;
		} catch (error) {
			if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
			waitsForOwner = true;
		}
	}
	if (!ownsMarker && !waitsForOwner && (await stat(markerPath).catch(() => null))) {
		// The owner may have created the SQLite file between our target stat and marker check.
		// Wait for it, but never inherit its permission to apply pending migrations.
		waitsForOwner = true;
	}
	if (waitsForOwner) {
		const waitDeadline = Date.now() + 30_000;
		while (true) {
			const markerStats = await stat(markerPath).catch(() => null);
			if (!markerStats) break;
			if (Date.now() - markerStats.mtimeMs > 5 * 60 * 1000) {
				throw new Error(
					`Marcador de inicialización SQLite vencido: ${markerPath}. Revísalo antes de volver a intentar.`
				);
			}
			if (Date.now() >= waitDeadline) {
				throw new Error('Otra inicialización SQLite no terminó dentro de 30 segundos.');
			}
			await new Promise((resolveWait) => setTimeout(resolveWait, 50));
		}
	}
	return {
		release: async () => {
			if (ownsMarker) await rm(markerPath, { force: true });
		},
	};
}

export async function migrateDatabaseFromCli(
	databasePath: string,
	afterClaim?: () => Promise<void>
): Promise<{ applied: string[]; skipped: string[] }> {
	const initialization = await claimFreshDatabaseInitialization(databasePath);
	try {
		await afterClaim?.();
		// Marker ownership serializes fresh initialization; it never grants in-place upgrade authority.
		return await migrateDatabase({ databasePath });
	} finally {
		await initialization.release();
	}
}

async function runCli(): Promise<void> {
	const { command, databasePath, json } = parseCli(process.argv.slice(2));
	if (command === 'migrate') {
		const result = await migrateDatabaseFromCli(databasePath);
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
