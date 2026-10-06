#!/usr/bin/env node

/**
 * Script para iniciar Vite con configuración para manejar headers grandes
 * Esto resuelve el error 431 "Request Header Fields Too Large"
 */

const { spawn } = require('child_process');
const { createLocalSessionEnvironment } = require('./local-session-environment.js');

let frontendReadyLogged = false;
let stopped = false;
let requestedStop = false;
const frontendUrl = `http://${process.env.VITE_HOST || '127.0.0.1'}:${process.env.VITE_PORT || '5173'}`;

// Configurar variables de entorno para manejar headers grandes
// Aumentamos a 128KB para asegurar que cookies grandes no bloqueen la carga
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-http-header-size=131072`;
if (process.env.MEDIA_MANAGER_TRUSTED_SUPERVISOR !== '1' || !process.env.MEDIA_MANAGER_SESSION_TOKEN) {
	Object.assign(process.env, createLocalSessionEnvironment());
}

console.log('🚀 Iniciando Vite+ con soporte para headers grandes (128KB)...');
console.log('🔧 NODE_OPTIONS:', process.env.NODE_OPTIONS);
console.log('🔒 API session: isolated standalone session (use dev:full for a connected backend)');

async function waitForFrontend(url) {
	const deadline = Date.now() + 120_000;
	while (Date.now() < deadline && !stopped) {
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
			await response.body?.cancel();
			if (response.ok) {
				return true;
			}
		} catch {
			// seguir intentando mientras arranca
		}

		await new Promise((resolve) => setTimeout(resolve, 250));
	}

	return false;
}

// Ejecutar Vite+ (vp dev)
const viteProcess = spawn(process.execPath, ['run', 'dev:vite:app'], {
	stdio: 'pipe',
	cwd: process.cwd(),
	env: process.env,
});

viteProcess.stdout.on('data', (data) => {
	process.stdout.write(data);
});

viteProcess.stderr.on('data', (data) => {
	process.stderr.write(data);
});

viteProcess.on('error', (error) => {
	stopped = true;
	console.error('❌ Error al iniciar Vite:', error);
	process.exit(1);
});

viteProcess.on('close', (code) => {
	stopped = true;
	console.log(`🔚 Vite+ terminó con código: ${code}`);
	process.exitCode = requestedStop ? 0 : (code ?? 1);
});

void waitForFrontend(frontendUrl).then((isReady) => {
	if (isReady && !stopped && !frontendReadyLogged) {
		frontendReadyLogged = true;
		console.log(`Frontend ready at ${frontendUrl}`);
	} else if (!stopped) {
		console.error('Frontend did not become ready.');
		viteProcess.kill('SIGTERM');
		process.exitCode = 1;
	}
});

// Manejar señales de terminación
process.on('SIGINT', () => {
	stopped = true;
	requestedStop = true;
	console.log('\n👋 Deteniendo Vite+...');
	viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
	stopped = true;
	requestedStop = true;
	console.log('\n👋 Deteniendo Vite+...');
	viteProcess.kill('SIGTERM');
});
