const vitePlusExecutable = Bun.which('vp');

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

process.exitCode = await child.exited;
