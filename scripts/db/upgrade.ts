#!/usr/bin/env bun

import { Database } from 'bun:sqlite';
import { link, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import {
	createVerifiedBackup,
	resolveDatabasePath,
	restoreVerifiedBackup,
	type BackupManifest,
} from './database-safety';
import { checkDatabase, migrateDatabase, type DatabaseCheck } from './migrations';

type UpgradeOptions = {
	appVersion: string;
	backupDirectory: string;
	databasePath: string;
	migrationsDirectory?: string;
	outputPath: string;
	rootReferences?: string[];
	workspaceRoot: string;
};

export type UpgradeResult = {
	backupPath: string;
	check: DatabaseCheck;
	manifest: BackupManifest;
	manifestPath: string;
	outputPath: string;
};

async function removeDatabaseArtifacts(databasePath: string): Promise<void> {
	for (const path of [databasePath, `${databasePath}-shm`, `${databasePath}-wal`, `${databasePath}-journal`]) {
		await rm(path, { force: true, maxRetries: 40, retryDelay: 100 });
	}
}

function checkpointDatabase(databasePath: string): void {
	const database = new Database(databasePath, { strict: true });
	try {
		database.exec('PRAGMA wal_checkpoint(TRUNCATE)');
	} finally {
		database.clearQueryCache();
		database.close();
	}
}

export async function upgradeDatabase({
	appVersion,
	backupDirectory,
	databasePath,
	migrationsDirectory,
	outputPath,
	rootReferences = [],
	workspaceRoot,
}: UpgradeOptions): Promise<UpgradeResult> {
	const resolvedSource = resolve(databasePath);
	const resolvedOutput = resolve(outputPath);
	if (resolvedSource === resolvedOutput)
		throw new Error('Upgrade requiere un --output nuevo; nunca reemplaza la base origen.');
	if (await stat(resolvedOutput).catch(() => null)) {
		throw new Error(`El destino de upgrade ya existe y no será sobrescrito: ${resolvedOutput}`);
	}

	const backup = await createVerifiedBackup({
		appVersion,
		databasePath: resolvedSource,
		outputDirectory: backupDirectory,
		rootReferences,
		workspaceRoot,
	});
	const stagingPath = `${resolvedOutput}.upgrade-partial-${randomUUID().slice(0, 8)}`;
	try {
		await mkdir(dirname(resolvedOutput), { recursive: true });
		await restoreVerifiedBackup({ backupPath: backup.backupPath, outputPath: stagingPath });
		await migrateDatabase({ allowExistingPending: true, databasePath: stagingPath, migrationsDirectory });
		const check = await checkDatabase({ databasePath: stagingPath, migrationsDirectory });
		if (!check.healthy) throw new Error('La copia actualizada no superó db:check; la base origen permanece intacta.');
		checkpointDatabase(stagingPath);

		// Hard-link publication is atomic and fails if the final path appeared concurrently.
		await link(stagingPath, resolvedOutput);
		await removeDatabaseArtifacts(stagingPath);
		return {
			backupPath: backup.backupPath,
			check,
			manifest: backup.manifest,
			manifestPath: backup.manifestPath,
			outputPath: resolvedOutput,
		};
	} catch (error) {
		await removeDatabaseArtifacts(stagingPath);
		throw error;
	}
}

async function readAppVersion(): Promise<string> {
	const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8')) as {
		version?: string;
	};
	return packageJson.version ?? 'unknown';
}

if (import.meta.main) {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			'backup-dir': { type: 'string' },
			database: { type: 'string' },
			json: { type: 'boolean' },
			output: { type: 'string' },
			'root-id': { multiple: true, type: 'string' },
		},
		strict: true,
	});
	try {
		if (!(values.database || process.env.DATABASE_URL) || !values['backup-dir'] || !values.output) {
			throw new TypeError('Uso: db:upgrade -- --database <source> --backup-dir <externo> --output <nueva.sqlite>');
		}
		const result = await upgradeDatabase({
			appVersion: await readAppVersion(),
			backupDirectory: values['backup-dir'],
			databasePath: resolveDatabasePath(values.database ?? process.env.DATABASE_URL!),
			outputPath: values.output,
			rootReferences: values['root-id'],
			workspaceRoot: process.cwd(),
		});
		console.log(values.json ? JSON.stringify(result) : `Upgrade verificado en path nuevo: ${result.outputPath}`);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = error instanceof TypeError ? 2 : 1;
	}
}
