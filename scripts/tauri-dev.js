#!/usr/bin/env node

/**
 * Script para desarrollo con Tauri
 * Inicia el backend y frontend en modo desarrollo con variables de entorno configuradas
 */

import { spawn, spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createLocalSessionEnvironment } from './local-session-environment.js';
import { resolveTauriDevelopmentDatabase } from './tauri-dev-database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Iniciando desarrollo de Tauri...\n');

let databasePath;
try {
	databasePath = resolveTauriDevelopmentDatabase();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
}
const databaseUrl = pathToFileURL(databasePath).href;

const migration = spawnSync(process.execPath, ['scripts/db/migrations.ts', 'migrate', '--database', databaseUrl], {
	cwd: rootDir,
	env: process.env,
	stdio: 'inherit',
});
if (migration.status !== 0) {
	console.error(
		'No se iniciará Tauri: una base existente con migraciones pendientes debe pasar por db:upgrade y seleccionarse con MEDIA_MANAGER_TAURI_DEV_DATABASE.'
	);
	process.exit(migration.status ?? 1);
}

// Configurar variables de entorno para desarrollo de Tauri
const tauriEnv = createLocalSessionEnvironment({
	...process.env,
	NODE_ENV: 'development',
	DATABASE_URL: databaseUrl,
	API_PORT: '4000',
	PORT: '4000',
	CORS_ORIGIN: 'http://localhost:5173',
	TAURI_ENV: 'dev',
});

console.log('🔧 Variables de entorno configuradas:');
console.log('- API_PORT:', tauriEnv.API_PORT);
console.log('- CORS_ORIGIN:', tauriEnv.CORS_ORIGIN);
console.log();

// Función para crear proceso con manejo de errores
function createProcess(command, args, options = {}) {
	const proc = spawn(command, args, {
		cwd: rootDir,
		stdio: 'inherit',
		shell: true,
		env: tauriEnv, // Usar las variables de entorno configuradas
		...options,
	});

	proc.on('error', (error) => {
		console.error(`❌ Error en ${command}:`, error.message);
	});

	return proc;
}

// 1. Iniciar backend en modo desarrollo
console.log('🔧 Iniciando backend...');
const backendProcess = createProcess('bun', ['run', 'dev:server:hot']);

// 2. Esperar un poco para que el backend esté listo
setTimeout(() => {
	console.log('🎨 Iniciando Tauri en modo desarrollo...');

	// 3. Iniciar Tauri (que automáticamente iniciará Vite)
	const tauriProcess = createProcess('bunx', ['tauri', 'dev']);

	// Manejar cierre del proceso
	process.on('SIGINT', () => {
		console.log('\n🛑 Cerrando procesos...');

		backendProcess.kill('SIGINT');
		tauriProcess.kill('SIGINT');

		setTimeout(() => {
			process.exit(0);
		}, 1000);
	});
}, 2000);
