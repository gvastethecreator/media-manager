#!/usr/bin/env bun

/**
 * Script de desarrollo del servidor con hot reload usando Bun nativo
 * Reemplaza tsup por el bundler integrado de Bun
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createLocalSessionEnvironment } from './local-session-environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Función para cargar variables de entorno desde archivo
function loadEnvFile(filePath) {
	try {
		if (!existsSync(filePath)) {
			console.log(chalk.yellow(`⚠️ Archivo ${filePath} no encontrado`));
			return {};
		}

		const content = readFileSync(filePath, 'utf8');
		const env = {};

		for (let line of content.split('\n')) {
			line = line.trim();
			if (line && !line.startsWith('#')) {
				const [key, ...valueParts] = line.split('=');
				if (key && valueParts.length > 0) {
					env[key.trim()] = valueParts.join('=').trim();
				}
			}
		}

		return env;
	} catch (error) {
		console.log(chalk.red(`❌ Error cargando archivo ${filePath}:`, error.message));
		return {};
	}
}

// Cargar variables de entorno
const defaultEnv = loadEnvFile(join(rootDir, '.env'));

// Combinar variables de entorno (prioridad: process.env > default).
// Un supervisor/test debe poder fijar DATABASE_URL y grants sin que un archivo local lo redirija a otra base.
const configuredServerEnv = {
	...defaultEnv,
	...process.env,
};
const inheritedSupervisorSession =
	process.env.MEDIA_MANAGER_TRUSTED_SUPERVISOR === '1' && process.env.MEDIA_MANAGER_SESSION_TOKEN
		? process.env
		: createLocalSessionEnvironment(configuredServerEnv);
const serverEnv = {
	...configuredServerEnv,
	MEDIA_MANAGER_API_TARGET: inheritedSupervisorSession.MEDIA_MANAGER_API_TARGET,
	MEDIA_MANAGER_TRUSTED_SUPERVISOR: inheritedSupervisorSession.MEDIA_MANAGER_TRUSTED_SUPERVISOR,
	MEDIA_MANAGER_SESSION_TOKEN: inheritedSupervisorSession.MEDIA_MANAGER_SESSION_TOKEN,
	MEDIA_MANAGER_SESSION_ALLOWED_HOSTS: inheritedSupervisorSession.MEDIA_MANAGER_SESSION_ALLOWED_HOSTS,
	MEDIA_MANAGER_SESSION_ALLOWED_ORIGINS: inheritedSupervisorSession.MEDIA_MANAGER_SESSION_ALLOWED_ORIGINS,
};

if (process.env.MEDIA_MANAGER_ENV_PROBE === '1') {
	console.log(
		JSON.stringify({
			databaseUrlMatchesExpected:
				Boolean(process.env.MEDIA_MANAGER_ENV_PROBE_EXPECTED_DATABASE_URL) &&
				serverEnv.DATABASE_URL === process.env.MEDIA_MANAGER_ENV_PROBE_EXPECTED_DATABASE_URL,
			nodeEnv: serverEnv.NODE_ENV,
		})
	);
	process.exit(0);
}

console.log(chalk.blue('🔧 Variables de entorno cargadas:'));
console.log(`- Database: ${serverEnv.DATABASE_URL ? 'configured' : 'undefined'}`);
console.log(`- API_PORT: ${serverEnv.API_PORT || serverEnv.PORT || 'undefined'}`);
console.log(`- NODE_ENV: ${serverEnv.NODE_ENV || 'undefined'}`);
console.log('- API session: isolated standalone session (use dev:full for a connected UI)');
console.log();

console.log('Starting backend with Bun watch.');
const serverProcess = spawn(process.execPath, ['--watch', 'src/server/index.ts'], {
	cwd: rootDir,
	stdio: 'inherit',
	env: serverEnv,
});
let stopped = false;
let requestedStop = false;
serverProcess.on('error', (error) => {
	stopped = true;
	console.error('Failed to start backend:', error.message);
	process.exitCode = 1;
});
serverProcess.on('close', (code) => {
	stopped = true;
	process.exitCode = requestedStop ? 0 : (code ?? 1);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => {
		requestedStop = true;
		stopped = true;
		serverProcess.kill(signal);
	});
}
const backendUrl = serverEnv.MEDIA_MANAGER_API_TARGET;
let ready = false;
const readinessDeadline = Date.now() + 120_000;
while (Date.now() < readinessDeadline && !stopped) {
	try {
		const response = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(1000) });
		await response.body?.cancel();
		if (response.ok && !stopped) {
			console.log(`Backend ready at ${backendUrl}`);
			ready = true;
			break;
		}
	} catch {
		// The child may still be starting.
	}
	await new Promise((resolve) => setTimeout(resolve, 250));
}
if (!ready && !stopped) {
	console.error('Backend did not become ready.');
	serverProcess.kill('SIGTERM');
	process.exitCode = 1;
}
