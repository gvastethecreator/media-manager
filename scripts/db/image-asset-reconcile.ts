#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { resolveDatabasePath } from './database-safety';
import { reconcileImageAssets, type ImageRootMapping } from './image-asset-reconciliation';

try {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			database: { type: 'string' },
			roots: { type: 'string' },
		},
		strict: true,
	});
	if (!values.database) {
		throw new TypeError('Uso: db:image:reconcile -- --database <copy.sqlite> [--roots <roots.json>]');
	}
	const roots = values.roots ? (JSON.parse(await readFile(resolve(values.roots), 'utf8')) as ImageRootMapping[]) : [];
	const database = new Database(resolveDatabasePath(values.database), { readonly: true, strict: true });
	try {
		const report = await reconcileImageAssets(database, roots);
		console.log(JSON.stringify(report, null, 2));
	} finally {
		database.clearQueryCache();
		database.close();
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
	process.exitCode = error instanceof TypeError || code.startsWith('ERR_PARSE_ARGS') ? 2 : 1;
}
