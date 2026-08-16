#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { rm, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { parseArgs } from 'node:util';
import { resolveDatabasePath } from './database-safety';
import { migrateDatabase } from './migrations';

export const DISPOSABLE_DATABASE_APPLICATION_ID = 0x4d4d4752;

function isInside(root: string, candidate: string): boolean {
	const pathFromRoot = relative(resolve(root), resolve(candidate));
	return pathFromRoot === '' || !(pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot));
}

export function assertDisposableLocation(databasePath: string, workspaceRoot = process.cwd()): void {
	if (resolve(databasePath) === resolve(workspaceRoot, 'db.sqlite')) {
		throw new Error('db.sqlite real nunca puede marcarse ni resetearse como disposable.');
	}
	const allowedRoots = [resolve(workspaceRoot, '.scratch'), resolve(tmpdir())];
	if (!allowedRoots.some((root) => isInside(root, databasePath))) {
		throw new Error('Una DB disposable sólo puede vivir bajo .scratch o el directorio temporal del sistema.');
	}
}

function readApplicationId(databasePath: string): number {
	const database = new Database(databasePath, { readonly: true, strict: true });
	try {
		const row = database.query('PRAGMA application_id').get() as Record<string, unknown>;
		return Number(Object.values(row)[0] ?? 0);
	} finally {
		database.close();
	}
}

export async function markDisposableDatabase(databasePath: string, workspaceRoot = process.cwd()): Promise<void> {
	assertDisposableLocation(databasePath, workspaceRoot);
	if (!(await stat(databasePath).catch(() => null))) throw new Error('La DB a marcar no existe.');
	const database = new Database(databasePath, { strict: true });
	try {
		database.exec(`PRAGMA application_id = ${DISPOSABLE_DATABASE_APPLICATION_ID}`);
	} finally {
		database.close();
	}
}

export async function resetDisposableDatabase(databasePath: string, workspaceRoot = process.cwd()): Promise<void> {
	assertDisposableLocation(databasePath, workspaceRoot);
	if (readApplicationId(databasePath) !== DISPOSABLE_DATABASE_APPLICATION_ID) {
		throw new Error('La DB no tiene el marker disposable esperado; reset abortado.');
	}
	for (const candidate of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
		await rm(candidate, { force: true, maxRetries: 40, retryDelay: 100 });
	}
	await migrateDatabase({ databasePath });
	await markDisposableDatabase(databasePath, workspaceRoot);
}

if (import.meta.main) {
	const { positionals, values } = parseArgs({
		allowPositionals: true,
		args: process.argv.slice(2),
		options: {
			confirm: { type: 'string' },
			database: { type: 'string' },
		},
		strict: true,
	});
	try {
		if (!values.database || positionals.length !== 1) {
			throw new TypeError('Uso: db:reset -- --database <.scratch|temp.sqlite> --confirm RESET-DISPOSABLE');
		}
		const databasePath = resolveDatabasePath(values.database);
		if (positionals[0] === 'mark') {
			if (values.confirm !== 'MARK-DISPOSABLE') throw new TypeError('Se requiere --confirm MARK-DISPOSABLE.');
			await markDisposableDatabase(databasePath);
			console.log('DB marcada como disposable.');
		} else if (positionals[0] === 'reset') {
			if (values.confirm !== 'RESET-DISPOSABLE') {
				assertDisposableLocation(databasePath);
				console.log('Dry-run: target permitido; falta --confirm RESET-DISPOSABLE para borrar y recrear.');
			} else {
				await resetDisposableDatabase(databasePath);
				console.log('DB disposable recreada desde migraciones.');
			}
		} else {
			throw new TypeError('Subcomando requerido: mark | reset.');
		}
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = error instanceof TypeError ? 2 : 1;
	}
}
