import { afterEach, describe, expect, it } from 'bun:test';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	isLoopbackHost,
	resolveLocalServiceHost,
	shouldEnableDevelopmentRoutes,
} from '../src/config/local-runtime-security';
import { runIsolatedCommand } from './run-tests-isolated';
import {
	assertIsolatedTestDatabase,
	TEST_DATABASE_MARKER,
	TEST_DATABASE_OWNER,
} from '../tests/safety/test-database-guard';

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

	it('muta sólo la copia, valida el guard y limpia el run directory', async () => {
		const sandbox = await createTemporaryDirectory();
		const sourceDatabasePath = join(sandbox, 'source.sqlite');
		const testRootPath = join(sandbox, 'test-runs');
		const resultPath = join(sandbox, 'child-result.json');
		await writeFile(sourceDatabasePath, 'original', 'utf8');

		const exitCode = await runIsolatedCommand({
			command: [process.execPath, childFixturePath, resultPath, '0'],
			cwd: workspacePath,
			sourceDatabasePath,
			testRootPath,
		});
		const result = JSON.parse(await readFile(resultPath, 'utf8')) as {
			databasePath: string;
			markerEnabled: boolean;
			testRoot: string;
		};

		expect(exitCode).toBe(0);
		expect(result.markerEnabled).toBe(true);
		expect(await readFile(sourceDatabasePath, 'utf8')).toBe('original');
		expect(existsSync(result.databasePath)).toBe(false);
		expect(existsSync(dirname(result.databasePath))).toBe(false);
	});

	it('propaga el exit code del child y limpia después de un fallo', async () => {
		const sandbox = await createTemporaryDirectory();
		const sourceDatabasePath = join(sandbox, 'source.sqlite');
		const testRootPath = join(sandbox, 'test-runs');
		const resultPath = join(sandbox, 'child-result.json');
		await writeFile(sourceDatabasePath, 'original', 'utf8');

		const exitCode = await runIsolatedCommand({
			command: [process.execPath, childFixturePath, resultPath, '9'],
			cwd: workspacePath,
			sourceDatabasePath,
			testRootPath,
		});
		const result = JSON.parse(await readFile(resultPath, 'utf8')) as { databasePath: string };

		expect(exitCode).toBe(9);
		expect(existsSync(result.databasePath)).toBe(false);
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
	it('bloquea el reset legacy antes de ejecutar comandos o tocar archivos', async () => {
		const cwd = await createTemporaryDirectory();
		const resetScript = resolve(workspacePath, 'scripts', 'db', 'reset.js');
		const result = await runProcess([process.execPath, resetScript], cwd);

		expect(result.exitCode).toBe(2);
		expect(result.stderr).toContain('deshabilitado');
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
		expect(viteConfig).toContain('nodeEnvironment = process.env.NODE_ENV ??');
		expect(viteConfig).toContain("'process.env.NODE_ENV': JSON.stringify(nodeEnvironment)");
		expect(viteConfig).toContain("'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion)");
		expect(errorBoundary).not.toContain("from '../../../package.json'");
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
