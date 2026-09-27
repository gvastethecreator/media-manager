#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { randomUUID } from 'node:crypto';
import { link, readFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { backfillImageAssets, type ImageRootMapping, validateImageRootMappings } from './image-asset-reconciliation';
import { upgradeDatabase } from './upgrade';

async function removeDatabaseArtifacts(databasePath: string): Promise<void> {
	for (const path of [databasePath, `${databasePath}-shm`, `${databasePath}-wal`, `${databasePath}-journal`]) {
		await rm(path, { force: true, maxRetries: 40, retryDelay: 100 });
	}
}

async function readAppVersion(): Promise<string> {
	const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as {
		version?: string;
	};
	return packageJson.version ?? 'unknown';
}

async function run(): Promise<void> {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			'backup-dir': { type: 'string' },
			database: { type: 'string' },
			json: { type: 'boolean' },
			output: { type: 'string' },
			roots: { type: 'string' },
		},
		strict: true,
	});
	if (!(values.database && values['backup-dir'] && values.output && values.roots)) {
		throw new TypeError(
			'Uso: db:image:backfill -- --database <source> --backup-dir <externo> --output <nueva.sqlite> --roots <roots.json>'
		);
	}
	const roots = await validateImageRootMappings(
		JSON.parse(await readFile(resolve(values.roots), 'utf8')) as ImageRootMapping[]
	);
	const outputPath = resolve(values.output);
	if (await stat(outputPath).catch(() => null)) {
		throw new Error(`La salida final ya existe y no será sobrescrita: ${outputPath}`);
	}
	const stagingOutputPath = `${outputPath}.image-backfill-partial-${randomUUID().slice(0, 8)}`;
	const upgraded = await upgradeDatabase({
		appVersion: await readAppVersion(),
		backupDirectory: values['backup-dir'],
		databasePath: values.database,
		outputPath: stagingOutputPath,
		rootReferences: roots.map((root) => root.id),
		workspaceRoot: process.cwd(),
	});
	let database: Database | undefined;
	try {
		database = new Database(upgraded.outputPath, { strict: true });
		database.exec('PRAGMA foreign_keys = ON');
		const result = await backfillImageAssets(database, roots);
		database.exec('PRAGMA wal_checkpoint(TRUNCATE)');
		database.clearQueryCache();
		database.close();
		database = undefined;
		await link(stagingOutputPath, outputPath);
		await removeDatabaseArtifacts(stagingOutputPath);
		console.log(values.json ? JSON.stringify({ ...result, outputPath }) : `Backfill verificado: ${outputPath}`);
	} catch (error) {
		database?.clearQueryCache();
		database?.close();
		await removeDatabaseArtifacts(stagingOutputPath);
		throw error;
	}
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = error instanceof TypeError ? 2 : 1;
});
