#!/usr/bin/env bun

import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TEST_DATABASE_MARKER, TEST_DATABASE_OWNER } from '../tests/safety/test-database-guard';
import { migrateDatabase } from './db/migrations';
import { seedDeterministicTestFixture } from './db/test-fixture';

type RunIsolatedCommandOptions = {
	command: string[];
	cwd?: string;
	environment?: NodeJS.ProcessEnv;
	testRootPath?: string;
};

const isPathInside = (parent: string, child: string): boolean => {
	const childRelativePath = relative(parent, child);
	return childRelativePath !== '' && !childRelativePath.startsWith('..') && !isAbsolute(childRelativePath);
};

export async function runIsolatedCommand({
	command,
	cwd = process.cwd(),
	environment = process.env,
	testRootPath = environment.MEDIA_MANAGER_TEST_ROOT ?? resolve(cwd, '.scratch', 'test-dbs'),
}: RunIsolatedCommandOptions): Promise<number> {
	if (command.length === 0) {
		throw new Error('Falta el comando de tests a ejecutar.');
	}

	const testRoot = resolve(testRootPath);
	await mkdir(testRoot, { recursive: true });

	const runDirectory = await mkdtemp(join(testRoot, 'run-'));
	if (!isPathInside(testRoot, runDirectory)) {
		throw new Error(`Directorio temporal fuera del root autorizado: ${runDirectory}`);
	}

	const databasePath = resolve(runDirectory, 'db.sqlite');
	const markerPath = resolve(runDirectory, TEST_DATABASE_MARKER);
	let child: ReturnType<typeof Bun.spawn> | undefined;
	const forwardSignal = (signal: NodeJS.Signals) => {
		child?.kill(signal);
	};
	const handleInterrupt = () => forwardSignal('SIGINT');
	const handleTermination = () => forwardSignal('SIGTERM');

	try {
		console.log('🔒 Creando DB de tests descartable desde migraciones versionadas');
		const migrationResult = await migrateDatabase({ databasePath });
		seedDeterministicTestFixture(databasePath);
		await writeFile(
			markerPath,
			JSON.stringify(
				{
					databasePath,
					owner: TEST_DATABASE_OWNER,
					processId: process.pid,
					schemaVersion: environment.MEDIA_MANAGER_TEST_SCHEMA_VERSION ?? migrationResult.applied.at(-1) ?? 'current',
					startedAt: new Date().toISOString(),
				},
				null,
				2
			),
			'utf8'
		);

		const childEnvironment = {
			...environment,
			DATABASE_URL: pathToFileURL(databasePath).href,
			DISABLE_FTS5: '1',
			MEDIA_MANAGER_TEST_DB: '1',
			MEDIA_MANAGER_TEST_DB_ROOT: runDirectory,
			MEDIA_MANAGER_TEST_DB_TEMPLATE: databasePath,
			MEDIA_MANAGER_TEST_SCHEMA_VERSION:
				environment.MEDIA_MANAGER_TEST_SCHEMA_VERSION ?? migrationResult.applied.at(-1) ?? 'current',
			NODE_ENV: 'test',
		};

		process.on('SIGINT', handleInterrupt);
		process.on('SIGTERM', handleTermination);
		child = Bun.spawn(command, {
			cwd,
			env: childEnvironment,
			stderr: 'inherit',
			stdin: 'inherit',
			stdout: 'inherit',
		});

		return await child.exited;
	} finally {
		process.off('SIGINT', handleInterrupt);
		process.off('SIGTERM', handleTermination);
		if (isPathInside(testRoot, runDirectory)) {
			const workerDatabaseCount = (await readdir(runDirectory, { withFileTypes: true })).filter(
				(entry) => entry.isDirectory() && entry.name.startsWith('worker-')
			).length;
			if (workerDatabaseCount > 0) {
				console.log(`🧪 DBs SQLite aisladas creadas: ${workerDatabaseCount}`);
			}
			await rm(runDirectory, { force: true, recursive: true });
			console.log(`🧹 DB de tests eliminada: ${runDirectory}`);
		} else {
			console.error(`Cleanup bloqueado fuera del root temporal: ${runDirectory}`);
		}
	}
}

if (import.meta.main) {
	const testArguments = process.argv.slice(2);
	const exitCode = await runIsolatedCommand({
		command: [process.execPath, 'x', 'vp', 'test', ...testArguments],
	});
	process.exitCode = exitCode;
}
