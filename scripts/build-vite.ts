import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const vitePlusExecutable = Bun.which('vp');
const legacyBuildOutputs = [resolve(process.cwd(), 'dist', 'emojis')];

if (!vitePlusExecutable) {
	console.error('[build:vite] No se encontró el ejecutable vp en PATH.');
	process.exit(1);
}

const environment = {
	...process.env,
	NODE_ENV: 'production',
};

console.log('[build:vite] Ejecutando build con NODE_ENV=production.');

const child = Bun.spawn([vitePlusExecutable, 'build', ...process.argv.slice(2)], {
	env: environment,
	stderr: 'inherit',
	stdout: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => child.kill(signal));
}

const exitCode = await child.exited;

if (exitCode === 0) {
	for (const legacyBuildOutput of legacyBuildOutputs) {
		await rm(legacyBuildOutput, { force: true, recursive: true });
	}
}

process.exitCode = exitCode;
