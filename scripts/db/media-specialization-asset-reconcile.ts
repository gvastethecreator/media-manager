#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { reconcileMediaSpecializationAssets, type MediaRootMapping } from './media-specialization-asset-reconciliation';

async function run(): Promise<void> {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: { database: { type: 'string' }, roots: { type: 'string' } },
		strict: true,
	});
	if (!values.database || !values.roots)
		throw new TypeError('Uso: db:media:reconcile -- --database <copy.sqlite> --roots <roots.json>');
	const roots = JSON.parse(await readFile(resolve(values.roots), 'utf8')) as MediaRootMapping[];
	const database = new Database(resolve(values.database), { readonly: true, strict: true });
	database.exec('PRAGMA foreign_keys = ON');
	try {
		const report = await reconcileMediaSpecializationAssets(database, roots);
		console.log(JSON.stringify(report));
		if (!report.dataConsistent || report.pathVerification !== 'verified') process.exitCode = 1;
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = error instanceof TypeError ? 2 : 1;
});
