import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { TEST_DATABASE_MARKER, TEST_DATABASE_OWNER } from './test-database-guard';

function isPathInside(parent: string, child: string): boolean {
	const childRelativePath = relative(parent, child);
	return childRelativePath !== '' && !childRelativePath.startsWith('..') && !isAbsolute(childRelativePath);
}

function safeWorkerId(environment: NodeJS.ProcessEnv): string {
	const candidate = environment.VITEST_WORKER_ID ?? environment.VITEST_POOL_ID ?? 'single';
	return candidate.replaceAll(/[^a-zA-Z0-9_-]/g, '_');
}

function safeInstanceId(instanceId: string): string {
	return instanceId.replaceAll(/[^a-zA-Z0-9_-]/g, '_');
}

export async function prepareWorkerTestDatabase(
	environment: NodeJS.ProcessEnv = process.env,
	instanceId = randomUUID()
): Promise<string | null> {
	const templateInput = environment.MEDIA_MANAGER_TEST_DB_TEMPLATE;
	const testRootInput = environment.MEDIA_MANAGER_TEST_DB_ROOT;
	if (!templateInput) return null;
	if (!testRootInput) throw new Error('MEDIA_MANAGER_TEST_DB_ROOT es obligatorio para clonar la DB por worker.');

	const templatePath = resolve(templateInput);
	const testRoot = resolve(testRootInput);
	if (!isPathInside(testRoot, templatePath)) {
		throw new Error('La plantilla de tests está fuera del root temporal autorizado.');
	}
	await stat(templatePath);

	const workerDirectory = resolve(testRoot, `worker-${safeWorkerId(environment)}`);
	const fileDirectory = resolve(workerDirectory, `file-${safeInstanceId(instanceId)}`);
	const databasePath = resolve(fileDirectory, 'db.sqlite');
	if (!isPathInside(testRoot, databasePath)) {
		throw new Error('La DB del worker quedó fuera del root temporal autorizado.');
	}

	await mkdir(fileDirectory, { recursive: true });
	await copyFile(templatePath, databasePath);
	await writeFile(
		join(fileDirectory, TEST_DATABASE_MARKER),
		JSON.stringify(
			{
				databasePath,
				instanceId: safeInstanceId(instanceId),
				owner: TEST_DATABASE_OWNER,
				processId: process.pid,
				schemaVersion: environment.MEDIA_MANAGER_TEST_SCHEMA_VERSION ?? 'current',
				workerId: safeWorkerId(environment),
			},
			null,
			2
		),
		'utf8'
	);

	environment.DATABASE_URL = pathToFileURL(databasePath).href;
	environment.MEDIA_MANAGER_TEST_WORKER_DB = databasePath;
	return databasePath;
}
