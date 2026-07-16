#!/usr/bin/env bun

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateDatabase } from './migrations';
import { createSchemaContract, loadSchemaContract, SCHEMA_CONTRACT_PATH } from './schema-fingerprint';
import { Database } from 'bun:sqlite';

const directory = await mkdtemp(join(tmpdir(), 'media-manager-schema-contract-'));
const databasePath = join(directory, 'contract.sqlite');

try {
	await migrateDatabase({ databasePath, validateSchema: false });
	const database = new Database(databasePath, { readonly: true, strict: true });
	const contract = createSchemaContract(database);
	database.clearQueryCache();
	database.close();
	const serialized = `${JSON.stringify(contract, null, '\t')}\n`;
	if (process.argv.includes('--write')) {
		await writeFile(SCHEMA_CONTRACT_PATH, serialized, 'utf8');
		console.log(`Contrato actualizado: ${SCHEMA_CONTRACT_PATH}`);
	} else {
		const committed = await loadSchemaContract();
		if (JSON.stringify(committed) !== JSON.stringify(contract)) {
			throw new Error('El contrato de schema no coincide con las migraciones versionadas.');
		}
		console.log(`Contrato verificado: ${contract.fingerprint}`);
	}
} finally {
	await rm(directory, { force: true, recursive: true });
}
