#!/usr/bin/env bun

/**
 * Script para ejecutar frontend (Vite) y backend (Express) simultÃƒÂ¡neamente.
 * Ejecuta ambos servidores en paralelo con logs diferenciados.
 */

import chalk from 'chalk';
import { spawn } from 'child_process';

const processes = [];
let shuttingDown = false;

function logWithPrefix(prefix, color, data) {
	const lines = data
		?.toString()
		.split('\n')
		.filter((line) => line.trim());

	if (!lines) {
		return;
	}

	for (const line of lines) {
		console.log(chalk[color](`[${prefix}]`), line);
	}
}

function cleanup(reason = 'EXIT') {
	if (shuttingDown) {
		return;
	}

	shuttingDown = true;
	console.log(chalk.yellow(`\nCerrando servidores (${reason})...`));

	for (const proc of processes) {
		if (proc && !proc.killed) {
			proc.kill('SIGTERM');
		}
	}

	if (reason !== 'EXIT') {
		process.exit(0);
	}
}

process.once('SIGINT', () => cleanup('SIGINT'));
process.once('SIGTERM', () => cleanup('SIGTERM'));
process.on('exit', () => cleanup('EXIT'));

console.log(chalk.blue('Iniciando desarrollo completo...'));
console.log(chalk.gray('   Frontend: http://localhost:5173'));
console.log(chalk.gray('   Backend:  http://localhost:4000\n'));

async function waitForHealth(url, { retries = 40, intervalMs = 250 } = {}) {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(url, { method: 'GET' });
			if (res.ok) return true;
		} catch {
			// ignorar mientras arranca
		}
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
	return false;
}

(async () => {
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
		console.warn(chalk.yellow('[DEV] Backend no respondiÃƒÂ³ al health check a tiempo, se lanza Vite igualmente.'));
	}

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

	console.log(chalk.yellow('Presiona Ctrl+C para detener ambos servidores\n'));
})();
