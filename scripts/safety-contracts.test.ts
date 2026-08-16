import { afterEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	isLoopbackHost,
	resolveLocalServiceHost,
	shouldEnableDevelopmentRoutes,
} from '../src/config/local-runtime-security';
import { runIsolatedCommand } from './run-tests-isolated';
import { migrateDatabase } from './db/migrations';
import { seedDeterministicTestFixture } from './db/test-fixture';
import {
	assertIsolatedTestDatabase,
	TEST_DATABASE_MARKER,
	TEST_DATABASE_OWNER,
} from '../tests/safety/test-database-guard';
import { prepareWorkerTestDatabase } from '../tests/safety/prepare-worker-database';

const temporaryDirectories: string[] = [];
const workspacePath = resolve(import.meta.dir, '..');

async function createTemporaryDirectory(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'media-manager-safety-'));
	temporaryDirectories.push(directory);
	return directory;
}

async function runProcess(command: string[], cwd: string, environment: NodeJS.ProcessEnv = process.env) {
	const child = Bun.spawn(command, {
		cwd,
		env: environment,
		stderr: 'pipe',
		stdout: 'pipe',
	});
	const [exitCode, stdout, stderr] = await Promise.all([
		child.exited,
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
	]);
	return { exitCode, stderr, stdout };
}

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, recursive: true });
	}
});

describe('run-with-log exit contract', () => {
	const runnerPath = resolve(workspacePath, 'scripts', 'run-with-log.js');
	const exitFixturePath = resolve(workspacePath, 'scripts', 'fixtures', 'exit-with-code.ts');

	it('preserva exit code 0', async () => {
		const cwd = await createTemporaryDirectory();
		const result = await runProcess(
			[process.execPath, runnerPath, 'contract-success', process.execPath, exitFixturePath, '0'],
			cwd
		);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain('Comando ejecutado exitosamente');
	});

	it('preserva exit code no-cero por defecto', async () => {
		const cwd = await createTemporaryDirectory();
		const result = await runProcess(
			[process.execPath, runnerPath, 'contract-failure', process.execPath, exitFixturePath, '7', 'vitest'],
			cwd
		);

		expect(result.exitCode).toBe(7);
		expect(result.stderr).toContain('Error al ejecutar comando (Exit code: 7)');
		expect(result.stdout).toContain('El comando finalizó con exit code 7');
	});

	it('sólo tolera fallos cuando el modo fue habilitado explícitamente', async () => {
		const cwd = await createTemporaryDirectory();
		const result = await runProcess(
			[process.execPath, runnerPath, 'contract-tolerant', process.execPath, exitFixturePath, '7'],
			cwd,
			{ ...process.env, RUN_WITH_LOG_TOLERANT: '1' }
		);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain('Modo tolerante explícito');
	});
});

describe('test database guard', () => {
	it('rechaza ejecución sin marker de aislamiento', () => {
		expect(() => assertIsolatedTestDatabase({}, workspacePath)).toThrow('falta MEDIA_MANAGER_TEST_DB=1');
	});

	it('rechaza la DB real aunque el marker de entorno esté activo', () => {
		expect(() =>
			assertIsolatedTestDatabase(
				{
					DATABASE_URL: pathToFileURL(resolve(workspacePath, 'db.sqlite')).href,
					MEDIA_MANAGER_TEST_DB: '1',
					MEDIA_MANAGER_TEST_DB_ROOT: workspacePath,
				},
				workspacePath
			)
		).toThrow('DB real de la aplicación');
	});

	it('rechaza también el path legacy dev.db', () => {
		expect(() =>
			assertIsolatedTestDatabase(
				{
					DATABASE_URL: pathToFileURL(resolve(workspacePath, 'dev.db')).href,
					MEDIA_MANAGER_TEST_DB: '1',
					MEDIA_MANAGER_TEST_DB_ROOT: workspacePath,
				},
				workspacePath
			)
		).toThrow('DB real de la aplicación');
	});

	it('acepta una DB temporal con marker coincidente', async () => {
		const root = await createTemporaryDirectory();
		const runDirectory = join(root, 'run-valid');
		const databasePath = join(runDirectory, 'db.sqlite');
		await mkdir(runDirectory);
		await writeFile(databasePath, 'fixture', 'utf8');
		await writeFile(
			join(runDirectory, TEST_DATABASE_MARKER),
			JSON.stringify({ databasePath, owner: TEST_DATABASE_OWNER, schemaVersion: 'test-fixture' }),
			'utf8'
		);

		expect(
			assertIsolatedTestDatabase(
				{
					DATABASE_URL: pathToFileURL(databasePath).href,
					MEDIA_MANAGER_TEST_DB: '1',
					MEDIA_MANAGER_TEST_DB_ROOT: runDirectory,
				},
				workspacePath
			)
		).toBe(resolve(databasePath));
	});
});

describe('isolated test runner', () => {
	const childFixturePath = resolve(workspacePath, 'scripts', 'fixtures', 'isolated-test-child.ts');

	it('crea desde migraciones, valida el guard y limpia el run directory', async () => {
		const sandbox = await createTemporaryDirectory();
		const testRootPath = join(sandbox, 'test-runs');
		const resultPath = join(sandbox, 'child-result.json');

		const exitCode = await runIsolatedCommand({
			command: [process.execPath, childFixturePath, resultPath, '0'],
			cwd: workspacePath,
			testRootPath,
		});
		const result = JSON.parse(await readFile(resultPath, 'utf8')) as {
			databasePath: string;
			markerEnabled: boolean;
			migrationCount: number;
			profileCount: number;
			testRoot: string;
		};

		expect(exitCode).toBe(0);
		expect(result.markerEnabled).toBe(true);
		expect(result.migrationCount).toBeGreaterThan(0);
		expect(result.profileCount).toBe(1);
		expect(existsSync(result.databasePath)).toBe(false);
		expect(existsSync(dirname(result.databasePath))).toBe(false);
	});

	it('propaga el exit code del child y limpia después de un fallo', async () => {
		const sandbox = await createTemporaryDirectory();
		const testRootPath = join(sandbox, 'test-runs');
		const resultPath = join(sandbox, 'child-result.json');

		const exitCode = await runIsolatedCommand({
			command: [process.execPath, childFixturePath, resultPath, '9'],
			cwd: workspacePath,
			testRootPath,
		});
		const result = JSON.parse(await readFile(resultPath, 'utf8')) as { databasePath: string };

		expect(exitCode).toBe(9);
		expect(existsSync(result.databasePath)).toBe(false);
	});

	it('clona una DB independiente por archivo y worker y mantiene el guard de propiedad', async () => {
		const sandbox = await createTemporaryDirectory();
		const testRootPath = join(sandbox, 'worker-runs');
		await mkdir(testRootPath, { recursive: true });
		const templatePath = join(testRootPath, 'template.sqlite');
		const migrationResult = await migrateDatabase({ databasePath: templatePath });
		seedDeterministicTestFixture(templatePath);

		const firstEnvironment = {
			DATABASE_URL: pathToFileURL(templatePath).href,
			MEDIA_MANAGER_TEST_DB: '1',
			MEDIA_MANAGER_TEST_DB_ROOT: testRootPath,
			MEDIA_MANAGER_TEST_DB_TEMPLATE: templatePath,
			MEDIA_MANAGER_TEST_SCHEMA_VERSION: migrationResult.applied.at(-1) ?? 'current',
			VITEST_WORKER_ID: '101',
		} as NodeJS.ProcessEnv;
		const sameWorkerSecondFileEnvironment = { ...firstEnvironment };
		const secondEnvironment = { ...firstEnvironment, VITEST_WORKER_ID: '202' };
		const firstPath = await prepareWorkerTestDatabase(firstEnvironment, 'file-a');
		const sameWorkerSecondPath = await prepareWorkerTestDatabase(sameWorkerSecondFileEnvironment, 'file-b');
		const secondPath = await prepareWorkerTestDatabase(secondEnvironment, 'file-a');

		expect(firstPath).not.toBe(secondPath);
		expect(firstPath).not.toBe(sameWorkerSecondPath);
		expect(assertIsolatedTestDatabase(firstEnvironment, workspacePath)).toBe(firstPath);
		expect(assertIsolatedTestDatabase(sameWorkerSecondFileEnvironment, workspacePath)).toBe(sameWorkerSecondPath);
		expect(assertIsolatedTestDatabase(secondEnvironment, workspacePath)).toBe(secondPath);
		const firstDatabase = new Database(firstPath!);
		firstDatabase.exec('CREATE TABLE worker_isolation_proof (id TEXT PRIMARY KEY)');
		firstDatabase.close();
		const sameWorkerSecondDatabase = new Database(sameWorkerSecondPath!, { readonly: true });
		const leakedToSameWorkerFile = sameWorkerSecondDatabase
			.query("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'worker_isolation_proof'")
			.get();
		sameWorkerSecondDatabase.close();
		const secondDatabase = new Database(secondPath!, { readonly: true });
		const leakedToOtherWorker = secondDatabase
			.query("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'worker_isolation_proof'")
			.get();
		secondDatabase.close();
		expect(leakedToSameWorkerFile).toBeNull();
		expect(leakedToOtherWorker).toBeNull();
	});

	it('ejecuta también los tests de tooling dentro de una DB descartable', async () => {
		const packageJson = JSON.parse(await readFile(resolve(workspacePath, 'package.json'), 'utf8')) as {
			scripts: Record<string, string>;
		};
		const toolingRunner = await readFile(resolve(workspacePath, 'scripts/run-tooling-tests-isolated.ts'), 'utf8');

		expect(packageJson.scripts['test:tooling']).toBe('bun scripts/run-tooling-tests-isolated.ts');
		expect(toolingRunner).toMatch(/import\s+\{\s*runIsolatedCommand\s*\}\s+from\s+['"]\.\/run-tests-isolated['"]/);
		expect(toolingRunner).not.toMatch(/DATABASE_URL\s*:/);
		expect(toolingRunner).toMatch(/process\.execPath,\s*['"]test['"]/);
	});
});

describe('local runtime network policy', () => {
	it('usa loopback como bind por defecto', () => {
		expect(resolveLocalServiceHost({ serviceName: 'test service' })).toBe('127.0.0.1');
	});

	it('acepta hosts loopback conocidos', () => {
		expect(isLoopbackHost('localhost')).toBe(true);
		expect(isLoopbackHost('127.0.0.1')).toBe(true);
		expect(isLoopbackHost('::1')).toBe(true);
	});

	it('rechaza wildcard y hosts externos sin opt-in', () => {
		expect(() => resolveLocalServiceHost({ host: '0.0.0.0', serviceName: 'test service' })).toThrow(
			'bloqueó bind externo'
		);
		expect(() => resolveLocalServiceHost({ host: '192.168.1.50', serviceName: 'test service' })).toThrow(
			'bloqueó bind externo'
		);
	});

	it('permite bind externo sólo con opt-in explícito', () => {
		expect(resolveLocalServiceHost({ allowExternalBind: true, host: '0.0.0.0', serviceName: 'test service' })).toBe(
			'0.0.0.0'
		);
	});

	it('habilita rutas de desarrollo sólo con ambiente y flag', () => {
		expect(shouldEnableDevelopmentRoutes({ NODE_ENV: 'production', ENABLE_DEBUG_ROUTES: '1' })).toBe(false);
		expect(shouldEnableDevelopmentRoutes({ NODE_ENV: 'development' })).toBe(false);
		expect(shouldEnableDevelopmentRoutes({ NODE_ENV: 'development', ENABLE_DEBUG_ROUTES: '1' })).toBe(true);
	});
});

describe('destructive maintenance contract', () => {
	it('mantiene reset fail-closed sin target disposable explícito', async () => {
		const cwd = await createTemporaryDirectory();
		const resetScript = resolve(workspacePath, 'scripts', 'db', 'reset.ts');
		const result = await runProcess([process.execPath, resetScript], cwd);

		expect(result.exitCode).toBe(2);
		expect(result.stderr).toContain('Uso: db:reset');
		expect(await readdir(cwd)).toEqual([]);
	});

	it('no publica reset, cleanup de logs ni mutaciones thumbnail por GET', async () => {
		const systemRoutes = await readFile(resolve(workspacePath, 'src/server/routes/system.ts'), 'utf8');
		const reindexLogRoutes = await readFile(resolve(workspacePath, 'src/server/routes/api/reindex-logs.ts'), 'utf8');
		const thumbnailRoutes = await readFile(resolve(workspacePath, 'src/server/routes/thumbnails.effect.ts'), 'utf8');

		expect(systemRoutes).not.toContain("'/reset-db'");
		expect(reindexLogRoutes).not.toMatch(/\.post\(\s*['"]\/cleanup['"]/);
		expect(thumbnailRoutes).not.toMatch(/router\.get\(\s*['"]\/(?:cleanup|optimize|reprocess)['"]/);
		expect(thumbnailRoutes).toMatch(/router\.post\(\s*['"]\/clean['"]/);
		expect(thumbnailRoutes).toMatch(/router\.post\(\s*['"]\/optimize['"]/);
		expect(thumbnailRoutes).toMatch(/router\.post\(\s*['"]\/reprocess['"]/);
	});
});

describe('production bootstrap contract', () => {
	it('construye el frontend con entorno de producción explícito', async () => {
		const packageJson = JSON.parse(await readFile(resolve(workspacePath, 'package.json'), 'utf8')) as {
			scripts: Record<string, string>;
		};
		const buildRunner = await readFile(resolve(workspacePath, 'scripts/build-vite.ts'), 'utf8');
		const viteConfig = await readFile(resolve(workspacePath, 'vite.config.ts'), 'utf8');
		const errorBoundary = await readFile(resolve(workspacePath, 'src/components/core/error-boundary.tsx'), 'utf8');

		expect(packageJson.scripts['build:vite']).toContain('scripts/build-vite.ts');
		expect(buildRunner).toContain("NODE_ENV: 'production'");
		expect(buildRunner).toContain("resolve(process.cwd(), 'dist', 'emojis')");
		expect(buildRunner).toContain('await rm(legacyBuildOutput, { force: true, recursive: true })');
		expect(viteConfig).toContain('nodeEnvironment = process.env.NODE_ENV ??');
		expect(viteConfig).toContain("'process.env.NODE_ENV': JSON.stringify(nodeEnvironment)");
		expect(viteConfig).toContain("'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion)");
		expect(errorBoundary).not.toContain("from '../../../package.json'");
	});

	it('empaqueta migraciones versionadas y nunca la DB del workspace en Tauri', async () => {
		const tauriConfig = await readFile(resolve(workspacePath, 'src-tauri/tauri.conf.json'), 'utf8');
		const tauriBuild = await readFile(resolve(workspacePath, 'scripts/tauri-build.js'), 'utf8');

		expect(tauriConfig).toContain('../src/lib/drizzle/migrations/');
		expect(tauriConfig).not.toContain('dist/server/db.sqlite');
		expect(tauriBuild).toContain("'0000_baseline.sql'");
		expect(tauriBuild).not.toContain('MEDIA_MANAGER_DATABASE_PATH');
		expect(tauriBuild).not.toContain('cpSync(dbSourcePath');
	});

	it('exige DATABASE_URL y mantiene las lecturas de Favorite libres de DDL runtime', async () => {
		const drizzleSource = await readFile(resolve(workspacePath, 'src/lib/drizzle/index.ts'), 'utf8');
		const favoriteSource = await readFile(resolve(workspacePath, 'src/services/favorite/favorite.service.ts'), 'utf8');

		expect(drizzleSource).toContain('DATABASE_URL es obligatorio en servidor/tests');
		expect(drizzleSource).not.toMatch(/env\.DATABASE_URL\s*\|\|\s*['"]file:\.\/db\.sqlite/);
		expect(favoriteSource).not.toMatch(/(?:ALTER TABLE|DROP INDEX|CREATE (?:UNIQUE )?INDEX|UPDATE "Favorite")/);
	});

	it('elimina todos los fallbacks silenciosos a la DB real del workspace', async () => {
		const sourceFiles = [
			'src/config/env.ts',
			'src/lib/drizzle/index.ts',
			'src/lib/drizzle/seeds/index.ts',
			'src/server/security/file-mutation-recovery.ts',
			'src/server/services/system.service.ts',
			'src/server/services/system/system.stats.ts',
			'scripts/tauri-dev.js',
		];
		const sources = await Promise.all(sourceFiles.map((file) => readFile(resolve(workspacePath, file), 'utf8')));
		for (const source of sources) expect(source).not.toMatch(/DATABASE_URL\s*\|\|\s*['"]file:\.\/db\.sqlite/);
		const tauriDevSource = sources.at(-1)!;
		const tauriDevDatabaseSource = await readFile(resolve(workspacePath, 'scripts/tauri-dev-database.js'), 'utf8');
		expect(tauriDevSource).not.toContain('process.env.DATABASE_URL');
		expect(tauriDevDatabaseSource).toContain('MEDIA_MANAGER_TAURI_DEV_DATABASE');
		expect(tauriDevDatabaseSource).toContain('debe permanecer dentro del data dir de desarrollo dedicado');
		expect(tauriDevDatabaseSource).toContain('isSymbolicLink()');
	});

	it('mantiene un solo contexto de tema y protege también el árbol de providers', async () => {
		const retiredThemeFiles = [
			resolve(workspacePath, 'src/hooks/use-theme.ts'),
			resolve(workspacePath, 'src/lib/contexts/theme-context.tsx'),
		];
		const consumers = [
			'src/components/theme-sync.tsx',
			'src/components/ui/sonner.tsx',
			'src/components/cards/world-item-card/world-item-card-content.tsx',
			'src/components/settings/themes/theme-settings.tsx',
			'src/components/settings/modern/appearance-settings-modern.tsx',
		];
		const consumerSources = await Promise.all(
			consumers.map((consumer) => readFile(resolve(workspacePath, consumer), 'utf8'))
		);
		const appShell = await readFile(resolve(workspacePath, 'src/platform/app-shell/app-shell.tsx'), 'utf8');

		for (const retiredThemeFile of retiredThemeFiles) {
			expect(existsSync(retiredThemeFile)).toBe(false);
		}
		for (const source of consumerSources) {
			expect(source).not.toContain('@/hooks/use-theme');
			expect(source).not.toContain('@/lib/contexts/theme-context');
			expect(source).toContain('@/components/ui/theme-provider');
		}
		expect(appShell.indexOf('<GlobalErrorHandler>')).toBeLessThan(appShell.indexOf('<AppProvider>'));
	});
});
