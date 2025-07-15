#!/usr/bin/env node

/**
 * Script para desarrollo con Tauri
 * Inicia el backend y frontend en modo desarrollo con variables de entorno configuradas
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Iniciando desarrollo de Tauri...\n');

// Configurar variables de entorno para desarrollo de Tauri
const tauriEnv = {
	...process.env,
	NODE_ENV: 'development',
	DATABASE_URL: 'file:./db.sqlite',
	API_PORT: '3001',
	PORT: '3001',
	CORS_ORIGIN: 'http://localhost:5173',
	VITE_API_URL: 'http://localhost:3001/api',
	TAURI_ENV: 'dev',
};

console.log('🔧 Variables de entorno configuradas:');
console.log('- DATABASE_URL:', tauriEnv.DATABASE_URL);
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
