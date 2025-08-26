#!/usr/bin/env bun

/**
 * Script para ejecutar frontend (Vite) y backend (Express) simultáneamente
 * Ejecuta ambos servidores en paralelo con logs diferenciados
 */

import chalk from 'chalk';
import { spawn } from 'child_process';

const processes = [];

// Función para manejar la salida con colores
function logWithPrefix(prefix, color, data) {
	const lines = data
		.toString()
		.split('\n')
		.filter((line) => line.trim());
	for (const line of lines) {
		console.log(chalk[color](`[${prefix}]`), line);
	}
}

// Función para limpiar procesos al salir
function cleanup() {
	console.log(chalk.yellow('\n🛑 Cerrando servidores...'));
	for (const proc of processes) {
		if (proc && !proc.killed) {
			proc.kill('SIGTERM');
		}
	}
	process.exit(0);
}

// Manejar señales de cierre
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

console.log(chalk.blue('🚀 Iniciando desarrollo completo...'));
console.log(chalk.gray('   Frontend: http://localhost:5173'));
console.log(chalk.gray('   Backend:  http://localhost:4000\n'));
// Utilidad: esperar a que el backend esté listo antes de lanzar Vite
async function waitForHealth(url, { retries = 40, intervalMs = 250 } = {}) {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(url, { method: 'GET' });
			if (res.ok) return true;
		} catch {
			// ignorar mientras arranca
		}
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	return false;
}

(async () => {
	// Ejecutar backend (Express con hot reload) una sola vez
	const serverProcess = spawn('bun', ['run', 'dev:server:hot'], {
		stdio: 'pipe',
		shell: true,
		cwd: process.cwd(),
	});

	serverProcess.stdout.on('data', (data) => {
		logWithPrefix('SERVER', 'green', data);
	});

	serverProcess.stderr.on('data', (data) => {
		logWithPrefix('SERVER', 'red', data);
	});

	serverProcess.on('error', (error) => {
		console.error(chalk.red(`[SERVER] Error: ${error.message}`));
	});

	processes.push(serverProcess);

	const ok = await waitForHealth('http://localhost:4000/health');
	if (!ok) {
		console.warn(chalk.yellow('[DEV] Backend no respondió al health check a tiempo, lanzando Vite de todas formas...'));
	}

	// Ejecutar frontend (Vite) una vez que el backend esté arriba (o tras timeout)
	const viteProcess = spawn('bun', ['run', 'dev:vite'], {
		stdio: 'pipe',
		shell: true,
		cwd: process.cwd(),
	});

	viteProcess.stdout.on('data', (data) => {
		logWithPrefix('VITE', 'cyan', data);
	});

	viteProcess.stderr.on('data', (data) => {
		logWithPrefix('VITE', 'red', data);
	});

	viteProcess.on('error', (error) => {
		console.error(chalk.red(`[VITE] Error: ${error.message}`));
	});

	processes.push(viteProcess);

	console.log(chalk.yellow('⌨️  Presiona Ctrl+C para detener ambos servidores\n'));
})();
