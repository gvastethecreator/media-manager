import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { startLocalAppBroker } from '../src/runtime/local-app-broker';
import { createProductionRuntimeConfig } from '../src/runtime/production-runtime-config';
import { createRuntimeHealthController } from '../src/runtime/runtime-health';

const { publicHost, publicPort, runtimeEnvironment } = createProductionRuntimeConfig();
const clientRoot = resolve(process.cwd(), 'dist/client');
const backendEntry = resolve(process.cwd(), 'dist/server/index.js');

if (!(existsSync(resolve(clientRoot, 'index.html')) && existsSync(backendEntry))) {
	throw new Error('Faltan artefactos de producción. Ejecuta `bun run build` antes de `bun run start`.');
}

const runtimeHealth = createRuntimeHealthController();
let backend: ReturnType<typeof Bun.spawn> | undefined;
let broker: ReturnType<typeof startLocalAppBroker> | undefined;
let shuttingDown = false;

async function waitForBackend(): Promise<void> {
	const deadline = Date.now() + 20_000;
	while (Date.now() < deadline) {
		if (!backend || backend.exitCode !== null) {
			throw new Error(`El backend terminó durante startup con código ${backend.exitCode}.`);
		}
		try {
			const response = await fetch(`${runtimeEnvironment.MEDIA_MANAGER_API_TARGET}/health`, {
				signal: AbortSignal.timeout(Math.max(1, Math.min(1_000, deadline - Date.now()))),
			});
			if (response.ok && ((await response.json()) as { status?: string }).status === 'ready') return;
		} catch {
			// Continue until the startup deadline.
		}
		const remaining = deadline - Date.now();
		if (remaining > 0) await Bun.sleep(Math.min(250, remaining));
	}
	throw new Error('El backend no alcanzó health dentro del plazo de startup.');
}

async function shutdown(exitCode = 0): Promise<void> {
	if (shuttingDown) return;
	shuttingDown = true;
	runtimeHealth.transition('stopping');
	await broker?.stop(true);
	if (backend && backend.exitCode === null) backend.kill('SIGTERM');
	if (backend) {
		await Promise.race([
			backend.exited,
			Bun.sleep(12_000).then(async () => {
				if (backend?.exitCode === null) backend.kill('SIGKILL');
				await backend?.exited;
			}),
		]);
	}
	process.exit(exitCode);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => void shutdown());
}

try {
	broker = startLocalAppBroker({
		backendOrigin: runtimeEnvironment.MEDIA_MANAGER_API_TARGET,
		clientRoot,
		publicPort,
		runtimeHealth: () => runtimeHealth.getSnapshot(),
		sessionToken: runtimeEnvironment.MEDIA_MANAGER_SESSION_TOKEN,
	});
	backend = Bun.spawn([process.execPath, backendEntry], {
		cwd: process.cwd(),
		env: runtimeEnvironment,
		stderr: 'inherit',
		stdout: 'inherit',
	});
	void backend.exited.then((exitCode) => {
		if (!shuttingDown) {
			runtimeHealth.transition('degraded');
			void shutdown(exitCode || 1);
		}
	});
	await waitForBackend();
	runtimeHealth.transition('ready');
	console.log(`[runtime] Media Manager listo en http://${publicHost}:${publicPort}`);
} catch (error) {
	runtimeHealth.transition('degraded');
	console.error(`[runtime] Startup falló: ${error instanceof Error ? error.message : String(error)}`);
	await shutdown(1);
}
