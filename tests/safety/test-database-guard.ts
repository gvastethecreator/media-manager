import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEST_DATABASE_MARKER = '.media-manager-test-db.json';
export const TEST_DATABASE_OWNER = 'media-manager-test-runner';

type TestDatabaseMarker = {
	databasePath: string;
	owner: typeof TEST_DATABASE_OWNER;
	schemaVersion: number | string;
};

const normalizePath = (value: string): string => resolve(value).toLowerCase();

function databasePathFromUrl(databaseUrl: string): string {
	if (!databaseUrl.startsWith('file:')) {
		throw new Error('DATABASE_URL de tests debe usar una URL file: local.');
	}

	try {
		return resolve(fileURLToPath(databaseUrl));
	} catch (error) {
		throw new Error(`DATABASE_URL de tests no es una URL file: válida: ${String(error)}`);
	}
}

function isPathInside(parent: string, child: string): boolean {
	const childRelativePath = relative(parent, child);
	return childRelativePath !== '' && !childRelativePath.startsWith('..') && !isAbsolute(childRelativePath);
}

export function assertIsolatedTestDatabase(
	environment: NodeJS.ProcessEnv = process.env,
	workspacePath: string = process.cwd()
): string {
	if (environment.MEDIA_MANAGER_TEST_DB !== '1') {
		throw new Error(
			'Tests bloqueados: falta MEDIA_MANAGER_TEST_DB=1. Usa `bun run test` para crear una DB descartable.'
		);
	}

	const databaseUrl = environment.DATABASE_URL;
	const testRootValue = environment.MEDIA_MANAGER_TEST_DB_ROOT;
	if (!databaseUrl || !testRootValue) {
		throw new Error('Tests bloqueados: DATABASE_URL y MEDIA_MANAGER_TEST_DB_ROOT deben ser explícitos.');
	}

	const databasePath = databasePathFromUrl(databaseUrl);
	const testRoot = resolve(testRootValue);
	const applicationDatabasePaths = [resolve(workspacePath, 'db.sqlite'), resolve(workspacePath, 'dev.db')];

	if (
		applicationDatabasePaths.some((applicationPath) => normalizePath(databasePath) === normalizePath(applicationPath))
	) {
		throw new Error('Tests bloqueados: DATABASE_URL apunta a la DB real de la aplicación.');
	}
	if (!isPathInside(testRoot, databasePath)) {
		throw new Error('Tests bloqueados: la DB no está dentro del directorio temporal autorizado.');
	}
	if (!existsSync(databasePath)) {
		throw new Error('Tests bloqueados: la DB temporal no existe.');
	}

	const markerPath = resolve(dirname(databasePath), TEST_DATABASE_MARKER);
	if (!existsSync(markerPath)) {
		throw new Error('Tests bloqueados: la DB temporal no tiene marker de propiedad.');
	}

	let marker: TestDatabaseMarker;
	try {
		marker = JSON.parse(readFileSync(markerPath, 'utf8')) as TestDatabaseMarker;
	} catch (error) {
		throw new Error(`Tests bloqueados: marker de DB inválido: ${String(error)}`);
	}

	if (
		marker.owner !== TEST_DATABASE_OWNER ||
		marker.schemaVersion === undefined ||
		normalizePath(marker.databasePath) !== normalizePath(databasePath)
	) {
		throw new Error('Tests bloqueados: el marker no corresponde a la DB temporal seleccionada.');
	}

	return databasePath;
}
