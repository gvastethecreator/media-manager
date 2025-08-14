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
const SERVER_DIST = 'dist/server/index.js';
const SERVER_DIR = 'src/server';
const REQUIRED_DEPS = ['music-metadata', 'ffprobe-static'];

let serverProcess = null;

// Función para compilar el servidor con Bun
function buildServer() {
	console.log(chalk.blue('🔨 Compilando servidor con Bun...'));

	try {
		const buildProcess = spawn('bun', ['build', SERVER_SRC, '--outdir', 'dist/server', '--target', 'node'], {
			stdio: 'inherit',
			shell: true,
		});

		return new Promise((resolve, reject) => {
			buildProcess.on('close', (code) => {
				if (code === 0) {
					console.log(chalk.green('✅ Build exitoso'));
					resolve(true);
				} else {
					console.log(chalk.red('❌ Error en build'));
					reject(new Error(`Build falló con código ${code}`));
				}
			});
		});
	} catch (error) {
		console.error(chalk.red('❌ Error compilando servidor:'), error);
		throw error;
	}
}

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

	if (!existsSync(SERVER_DIST)) {
		console.log(chalk.red('❌ Archivo compilado no encontrado:', SERVER_DIST));
		return;
	}

	console.log(chalk.green('🚀 Iniciando servidor con variables de entorno...'));

	serverProcess = spawn('bun', [SERVER_DIST], {
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
		// Build inicial
		await buildServer();
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

			try {
				await buildServer();
				startServer();
			} catch (error) {
				console.error(chalk.red('❌ Error en hot reload:'), error);
			}
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
