#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { resolveDatabasePath } from './database-safety';
import { compareSchema, loadSchemaContract } from './schema-fingerprint';

type SchemaSqlRow = {
	name: string;
	sql: string;
	type: string;
};

export async function exportDatabaseSchema(databasePath: string): Promise<string> {
	const database = new Database(resolve(databasePath), { readonly: true, strict: true });
	try {
		const drift = compareSchema(database, await loadSchemaContract());
		const unknown = drift.extra.filter((entry) => entry.classification === 'unknown');
		if (unknown.length > 0) {
			throw new Error(
				`El schema contiene ${unknown.length} objetos desconocidos; no se exportará como representativo.`
			);
		}
		const rows = database
			.query(
				`SELECT type, name, sql
				 FROM sqlite_schema
				 WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name <> '__media_manager_migrations'
				 ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 WHEN 'trigger' THEN 2 ELSE 3 END, name`
			)
			.all() as SchemaSqlRow[];
		const statements = rows.map((row) => `${row.sql.trim().replace(/;$/, '')};`);
		return [
			'-- Media Manager representative schema (DDL only; no row data or source path).',
			`-- Objects with explicit SQL: ${rows.length}.`,
			'',
			...statements.flatMap((statement) => [statement, '']),
		].join('\n');
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

if (import.meta.main) {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			database: { type: 'string' },
			output: { type: 'string' },
		},
		strict: true,
	});
	if (!(values.database && values.output)) {
		console.error('Uso: bun run db:schema:export -- --database <copy.sqlite> --output <schema.sql>');
		process.exit(2);
	}
	try {
		const outputPath = resolve(values.output);
		const databasePath = resolveDatabasePath(values.database);
		if (outputPath === databasePath || (await stat(outputPath).catch(() => null))) {
			throw new Error('El output ya existe o coincide con la base y no será sobrescrito.');
		}
		const ddl = await exportDatabaseSchema(databasePath);
		await mkdir(dirname(outputPath), { recursive: true });
		await writeFile(outputPath, ddl, { encoding: 'utf8', flag: 'wx' });
		console.log(`DDL representativo exportado: ${outputPath}`);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}
