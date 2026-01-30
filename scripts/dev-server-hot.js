#!/usr/bin/env bun

/**
 * Script de desarrollo del servidor con hot reload usando Bun nativo
 * Reemplaza tsup por el bundler integrado de Bun
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import chokidar from 'chokidar';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
const tauriEnv = loadEnvFile(join(rootDir, '.env.tauri'));

// Combinar variables de entorno (prioridad: tauri > default > process.env)
const serverEnv = {
	...process.env,
	...defaultEnv,
	...tauriEnv,
};

console.log(chalk.blue('🔧 Variables de entorno cargadas:'));
console.log(`- DATABASE_URL: ${serverEnv.DATABASE_URL || 'undefined'}`);
console.log(`- API_PORT: ${serverEnv.API_PORT || serverEnv.PORT || 'undefined'}`);
console.log(`- NODE_ENV: ${serverEnv.NODE_ENV || 'undefined'}`);
console.log();

const SERVER_SRC = 'src/server/index.ts';
const SERVER_DIR = 'src/server';
const REQUIRED_DEPS = ['music-metadata', 'ffprobe-static'];

let serverProcess = null;

// NOTE:
// En desarrollo, preferimos ejecutar el entrypoint TS directamente.
// Esto evita fallos sutiles del bundler (orden de inicialización / exports undefined)
// y acelera el ciclo de feedback cuando el servidor se reinicia por cambios.

function checkRequiredDependencies() {
	const missing = [];
	for (const dep of REQUIRED_DEPS) {
		// Verifica existencia del directorio del paquete en node_modules
		if (!existsSync(join(rootDir, 'node_modules', dep))) {
			missing.push(dep);
		}
	}
	if (missing.length > 0) {
		console.log(chalk.red('❌ Dependencias faltantes detectadas:'), missing.join(', '));
		console.log(chalk.yellow('👉 Ejecuta: bun install'));
		return false;
	}
	return true;
}

// Función para iniciar el servidor
function startServer() {
	if (serverProcess) {
		console.log(chalk.yellow('🔄 Reiniciando servidor...'));
		serverProcess.kill();
	}

	if (!existsSync(SERVER_SRC)) {
		console.log(chalk.red('❌ Entry point no encontrado:', SERVER_SRC));
		return;
	}

	console.log(chalk.green('🚀 Iniciando servidor (TS) con variables de entorno...'));

	serverProcess = spawn('bun', [SERVER_SRC], {
		stdio: 'inherit',
		shell: true,
		env: serverEnv, // Usar las variables de entorno cargadas
	});

	serverProcess.on('error', (error) => {
		console.error(chalk.red('❌ Error ejecutando servidor:'), error);
	});

	serverProcess.on('close', (code) => {
		if (code !== 0 && code !== null) {
			console.log(chalk.red(`❌ Servidor terminó con código ${code}`));
		}
	});
}

// Función principal
async function main() {
	console.log(chalk.cyan('🌟 Iniciando desarrollo del servidor con Bun hot reload'));

	try {
		if (!checkRequiredDependencies()) {
			process.exit(1);
		}
		startServer();

		// Configurar watcher
		console.log(chalk.blue('👀 Monitoreando cambios en', SERVER_DIR));

		const watcher = chokidar.watch(SERVER_DIR, {
			ignored: ['**/node_modules/**', '**/.git/**'],
			persistent: true,
			ignoreInitial: true,
		});

		watcher.on('change', async (path) => {
			console.log(chalk.yellow(`📝 Cambio detectado: ${path}`));
			startServer();
		});

		// Manejar cierre graceful
		process.on('SIGINT', () => {
			console.log(chalk.yellow('\n🛑 Cerrando servidor...'));
			if (serverProcess) {
				serverProcess.kill();
			}
			watcher.close();
			process.exit(0);
		});

		console.log(chalk.green('✅ Hot reload activo. Presiona Ctrl+C para salir.'));
	} catch (error) {
		console.error(chalk.red('❌ Error iniciando desarrollo:'), error);
		process.exit(1);
	}
}

main();
