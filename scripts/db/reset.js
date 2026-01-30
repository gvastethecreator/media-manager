/**
 * Script para resetear la base de datos usando Drizzle
 * Optimizado para Windows y manejo de archivos bloqueados
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message, type = 'info') {
	const colors = {
		info: '\x1b[36m', // cyan
		success: '\x1b[32m', // green
		warning: '\x1b[33m', // yellow
		error: '\x1b[31m', // red
		reset: '\x1b[0m', // reset
	};
	const prefix = { info: '📝 ', success: '✅ ', warning: '⚠️ ', error: '❌ ' };
	console.log(`${colors[type]}${prefix[type]}${message}${colors.reset}`);
}

function runCommand(command, args = []) {
	log(`Ejecutando: ${command} ${args.join(' ')}`, 'info');
	const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
	if (result.status !== 0) {
		log(`El comando falló con código de salida: ${result.status}`, 'error');
		return false;
	}
	return true;
}

function resetDatabase() {
	log('Iniciando reset de la base de datos...', 'info');
	const rootDir = path.resolve(__dirname, '../..');
	const dbPath = path.join(rootDir, 'db.sqlite');

	// Paso 1: Intentar limpieza radical via SQL primero (esto limpia tablas virtuales FTS que dan problemas)
	log('Limpiando tablas existentes via SQL...', 'info');
	runCommand('tsx', ['scripts/db/hard-clean.ts']);

	// Paso 2: Intentar eliminar el archivo de la DB
	if (fs.existsSync(dbPath)) {
		try {
			fs.unlinkSync(dbPath);
			log('Archivo db.sqlite eliminado.', 'success');
		} catch (error) {
			if (error.code === 'EBUSY') {
				log('El archivo db.sqlite está bloqueado. Continuando con limpieza SQL parcial...', 'warning');
			} else {
				log(`Error al eliminar db.sqlite: ${error.message}`, 'error');
			}
		}
	}

	// Paso 3: Limpiar migraciones
	const migrationsPath = path.join(rootDir, 'src/lib/drizzle/migrations');
	if (fs.existsSync(migrationsPath)) {
		try {
			fs.rmSync(migrationsPath, { recursive: true, force: true });
			log('Migraciones antiguas eliminadas.', 'success');
		} catch (e) {
			log('No se pudieron eliminar las migraciones.', 'warning');
		}
	}

	// Paso 4: Generar y empujar
	log('Generando esquema...', 'info');
	if (!runCommand('bunx', ['drizzle-kit', 'generate'])) return false;

	log('Empujando esquema...', 'info');
	// Usamos push --force para ignorar advertencias de pérdida de datos en reset
	if (!runCommand('bunx', ['drizzle-kit', 'push', '--force'])) return false;

	// Paso 5: Seed
	log('Poblando base de datos...', 'info');
	if (!runCommand('tsx', ['scripts/db/clean-and-seed.ts'])) return false;

	log('Reset completado con éxito.', 'success');
	return true;
}

if (!resetDatabase()) {
	process.exit(1);
}
