#!/usr/bin/env node

/**
 * Script para iniciar Vite con configuración para manejar headers grandes
 * Esto resuelve el error 431 "Request Header Fields Too Large"
 */

const { spawn } = require('child_process');

let frontendReadyLogged = false;

// Configurar variables de entorno para manejar headers grandes
// Aumentamos a 128KB para asegurar que cookies grandes no bloqueen la carga
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-http-header-size=131072`;

console.log('🚀 Iniciando Vite+ con soporte para headers grandes (128KB)...');
console.log('🔧 NODE_OPTIONS:', process.env.NODE_OPTIONS);

async function waitForFrontend(url, { retries = 80, intervalMs = 250 } = {}) {
	for (let i = 0; i < retries; i++) {
		try {
			const response = await fetch(url, { method: 'GET' });
			if (response.ok) {
				return true;
			}
		} catch {
			// seguir intentando mientras arranca
		}

		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	return false;
}

// Ejecutar Vite+ (vp dev)
const viteProcess = spawn('bun', ['run', 'dev:vite:app'], {
	stdio: 'pipe',
	shell: true,
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
	console.error('❌ Error al iniciar Vite:', error);
	process.exit(1);
});

viteProcess.on('close', (code) => {
	console.log(`🔚 Vite+ terminó con código: ${code}`);
	process.exit(code);
});

void waitForFrontend('http://localhost:5173').then((isReady) => {
	if (isReady && !frontendReadyLogged) {
		frontendReadyLogged = true;
		console.log('✅ Frontend listo en http://localhost:5173');
	}
});

// Manejar señales de terminación
process.on('SIGINT', () => {
	console.log('\n👋 Deteniendo Vite+...');
	viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
	console.log('\n👋 Deteniendo Vite+...');
	viteProcess.kill('SIGTERM');
});
