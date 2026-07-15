import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { startLocalAppBroker } from '../src/runtime/local-app-broker';
import { createProductionRuntimeConfig } from '../src/runtime/production-runtime-config';

const { publicHost, publicPort, runtimeEnvironment } = createProductionRuntimeConfig();
const clientRoot = resolve(process.cwd(), 'dist/client');
const backendEntry = resolve(process.cwd(), 'dist/server/index.js');

if (!(existsSync(resolve(clientRoot, 'index.html')) && existsSync(backendEntry))) {
	throw new Error('Faltan artefactos de producción. Ejecuta `bun run build` antes de `bun run start`.');
}

const backend = Bun.spawn([process.execPath, backendEntry], {
	cwd: process.cwd(),
	env: runtimeEnvironment,
	stderr: 'inherit',
	stdout: 'inherit',
});

async function waitForBackend(): Promise<void> {
	for (let attempt = 0; attempt < 80; attempt += 1) {
		if (backend.exitCode !== null) {
			throw new Error(`El backend terminó durante startup con código ${backend.exitCode}.`);
		}
		try {
			const response = await fetch(`${runtimeEnvironment.MEDIA_MANAGER_API_TARGET}/health`);
			if (response.ok) return;
		} catch {
			// Continue until the startup deadline.
		}
		await Bun.sleep(250);
	}
	throw new Error('El backend no alcanzó health dentro del plazo de startup.');
}

await waitForBackend();
const broker = startLocalAppBroker({
	backendOrigin: runtimeEnvironment.MEDIA_MANAGER_API_TARGET,
	clientRoot,
	publicPort,
	sessionToken: runtimeEnvironment.MEDIA_MANAGER_SESSION_TOKEN,
});
console.log(`[runtime] Media Manager listo en http://${publicHost}:${publicPort}`);

let shuttingDown = false;
async function shutdown(exitCode = 0): Promise<void> {
	if (shuttingDown) return;
	shuttingDown = true;
	await broker.stop(true);
	backend.kill('SIGTERM');
	await backend.exited;
	process.exit(exitCode);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => void shutdown());
}
void backend.exited.then((exitCode) => {
	if (!shuttingDown) void shutdown(exitCode || 1);
});
