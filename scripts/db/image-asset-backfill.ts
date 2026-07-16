#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { backfillImageAssets, type ImageRootMapping, validateImageRootMappings } from './image-asset-reconciliation';
import { upgradeDatabase } from './upgrade';

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
	const upgraded = await upgradeDatabase({
		appVersion: await readAppVersion(),
		backupDirectory: values['backup-dir'],
		databasePath: values.database,
		outputPath: values.output,
		rootReferences: roots.map((root) => root.id),
		workspaceRoot: process.cwd(),
	});
	const database = new Database(upgraded.outputPath, { strict: true });
	database.exec('PRAGMA foreign_keys = ON');
	try {
		const result = await backfillImageAssets(database, roots);
		console.log(
			values.json
				? JSON.stringify({ ...result, outputPath: upgraded.outputPath })
				: `Backfill verificado: ${upgraded.outputPath}`
		);
	} catch (error) {
		database.clearQueryCache();
		database.close();
		await rm(upgraded.outputPath, { force: true, maxRetries: 40, retryDelay: 100 });
		throw error;
	}
	database.clearQueryCache();
	database.close();
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = error instanceof TypeError ? 2 : 1;
});
