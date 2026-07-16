#!/usr/bin/env bun

import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { migrateDatabase } from './db/migrations';

async function reservePort(): Promise<number> {
	const server = createServer();
	await new Promise<void>((done, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', done);
	});
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('No se pudo reservar un puerto loopback.');
	const port = address.port;
	await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
	return port;
}

async function waitUntilPortIsReusable(port: number): Promise<void> {
	const deadline = Date.now() + 10_000;
	while (Date.now() < deadline) {
		const probe = createServer();
		try {
			await new Promise<void>((done, reject) => {
				probe.once('error', reject);
				probe.listen(port, '127.0.0.1', done);
			});
			await new Promise<void>((done) => probe.close(() => done()));
			return;
		} catch {
			probe.close();
			await Bun.sleep(100);
		}
	}
	throw new Error(`El puerto ${port} siguió ocupado después del teardown de Playwright.`);
}

async function closeServer(server: Server): Promise<void> {
	if (!server.listening) return;
	await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
}

async function proveOccupiedBackendFailsCleanly(
	workspaceRoot: string,
	environment: Record<string, string | undefined>,
	publicPort: number,
	backendPort: number
): Promise<void> {
	const occupiedBackend = createServer();
	await new Promise<void>((done, reject) => {
		occupiedBackend.once('error', reject);
		occupiedBackend.listen(backendPort, '127.0.0.1', done);
	});

	try {
		const child = Bun.spawn([process.execPath, 'scripts/start-production.ts'], {
			cwd: workspaceRoot,
			env: environment,
			stderr: 'pipe',
			stdout: 'pipe',
		});
		const stdoutPromise = new Response(child.stdout).text();
		const stderrPromise = new Response(child.stderr).text();
		const timeoutMarker = Symbol('negative lifecycle timeout');
		let failureCode: number | typeof timeoutMarker;
		try {
			failureCode = await Promise.race([child.exited, Bun.sleep(20_000).then(() => timeoutMarker)]);
		} finally {
			if (child.exitCode === null) child.kill('SIGKILL');
			await child.exited;
		}
		const [stdout, stderr] = await Promise.all([stdoutPromise, stderrPromise]);
		if (failureCode === timeoutMarker) {
			throw new Error('El runtime no terminó dentro del plazo al encontrar el puerto interno ocupado.');
		}
		if (failureCode === 0) throw new Error('El runtime aceptó un puerto interno ya ocupado.');
		const output = `${stdout}\n${stderr}`;
		if (!(output.includes(backendPort.toString()) && output.includes('no pudo escuchar'))) {
			throw new Error('El fallo por puerto interno ocupado no produjo un diagnóstico accionable.');
		}
		await waitUntilPortIsReusable(publicPort);
	} finally {
		await closeServer(occupiedBackend);
	}
}

const workspaceRoot = resolve(import.meta.dir, '..');
if (
	!(
		existsSync(join(workspaceRoot, 'dist/client/index.html')) && existsSync(join(workspaceRoot, 'dist/server/index.js'))
	)
) {
	throw new Error('Faltan artefactos de producción. Ejecuta `bun run build` antes del smoke hermético.');
}

const temporaryRoot = await mkdtemp(join(tmpdir(), 'media-manager-production-smoke-'));
let exitCode = 1;
try {
	const databasePath = join(temporaryRoot, 'media-manager.sqlite');
	const mediaRoot = join(temporaryRoot, 'media');
	const uploadsRoot = join(temporaryRoot, 'uploads');
	await Promise.all([mkdir(mediaRoot), mkdir(uploadsRoot)]);
	await migrateDatabase({ databasePath });
	const publicPort = await reservePort();
	let backendPort = await reservePort();
	while (backendPort === publicPort) backendPort = await reservePort();

	const environment = {
		...process.env,
		DATABASE_URL: pathToFileURL(databasePath).href,
		MEDIA_MANAGER_APP_PORT: publicPort.toString(),
		MEDIA_MANAGER_FILE_MUTATION_RECOVERY_JOURNAL: join(temporaryRoot, 'file-mutation-recovery.jsonl'),
		MEDIA_MANAGER_INTERNAL_API_PORT: backendPort.toString(),
		MEDIA_MANAGER_ROOT_GRANTS: JSON.stringify([
			{
				id: 'smoke-root',
				label: 'Production smoke fixture',
				path: mediaRoot,
				permissions: ['read', 'index', 'write', 'delete', 'export'],
			},
		]),
		UPLOADS_DIR: uploadsRoot,
	};

	const child = Bun.spawn(['bunx', 'playwright', 'test', '--config', 'playwright.production.config.ts'], {
		cwd: workspaceRoot,
		env: environment,
		stderr: 'inherit',
		stdout: 'inherit',
	});
	exitCode = await child.exited;
	await Promise.all([waitUntilPortIsReusable(publicPort), waitUntilPortIsReusable(backendPort)]);
	if (exitCode === 0) {
		await proveOccupiedBackendFailsCleanly(workspaceRoot, environment, publicPort, backendPort);
	}
} finally {
	await rm(temporaryRoot, { force: true, maxRetries: 100, recursive: true, retryDelay: 100 });
}

process.exitCode = exitCode;
