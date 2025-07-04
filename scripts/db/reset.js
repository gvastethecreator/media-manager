/**
 * Script para resetear la base de datos usando Drizzle
 * Migrado de Prisma a Drizzle ORM
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para mostrar mensajes con colores
function log(message, type = 'info') {
	const colors = {
		info: '\x1b[36m', // cyan
		success: '\x1b[32m', // green
		warning: '\x1b[33m', // yellow
		error: '\x1b[31m', // red
		reset: '\x1b[0m', // reset
	};

	const prefix = {
		info: '📝 ',
		success: '✅ ',
		warning: '⚠️ ',
		error: '❌ ',
	};

	console.log(`${colors[type]}${prefix[type]}${message}${colors.reset}`);
}

// Función para ejecutar comandos con mejor manejo de errores
function runCommand(command, args = []) {
	log(`Ejecutando: ${command} ${args.join(' ')}`, 'info');

	const result = spawnSync(command, args, {
		stdio: 'inherit',
		shell: true,
	});

	if (result.error) {
		log(`Error al ejecutar el comando: ${result.error.message}`, 'error');
		return false;
	}

	if (result.status !== 0) {
		log(`El comando falló con código de salida: ${result.status}`, 'error');
		return false;
	}

	return true;
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
	try {
		return fs.existsSync(filePath);
	} catch (error) {
		log(`Error al verificar si existe el archivo ${filePath}: ${error.message}`, 'error');
		return false;
	}
}

// Función para eliminar un archivo si existe
function deleteFileIfExists(filePath) {
	if (fileExists(filePath)) {
		try {
			fs.unlinkSync(filePath);
			log(`Archivo eliminado: ${filePath}`, 'success');
			return true;
		} catch (error) {
			log(`Error al eliminar el archivo ${filePath}: ${error.message}`, 'error');
			return false;
		}
	}

	log(`El archivo no existe, no es necesario eliminarlo: ${filePath}`, 'info');
	return true;
}

// Función para eliminar un directorio si existe
function deleteDirIfExists(dirPath) {
	if (fileExists(dirPath)) {
		try {
			fs.rmSync(dirPath, { recursive: true, force: true });
			log(`Directorio eliminado: ${dirPath}`, 'success');
			return true;
		} catch (error) {
			log(`Error al eliminar el directorio ${dirPath}: ${error.message}`, 'error');
			return false;
		}
	}

	log(`El directorio no existe, no es necesario eliminarlo: ${dirPath}`, 'info');
	return true;
}

// Función para asegurar que existe el archivo .env con DATABASE_URL
function ensureEnvFile() {
	const rootDir = path.resolve(__dirname, '../..');
	const envPath = path.join(rootDir, '.env');

	if (!fileExists(envPath)) {
		log('Creando archivo .env...', 'info');
		try {
			fs.writeFileSync(envPath, 'DATABASE_URL="file:./db.sqlite"\n');
			log('Archivo .env creado correctamente', 'success');
		} catch (error) {
			log(`Error al crear el archivo .env: ${error.message}`, 'error');
			return false;
		}
	} else {
		log('El archivo .env ya existe', 'info');

		try {
			const envContent = fs.readFileSync(envPath, 'utf8');
			if (!envContent.includes('DATABASE_URL=')) {
				log('Añadiendo DATABASE_URL al archivo .env...', 'info');
				fs.appendFileSync(envPath, '\nDATABASE_URL="file:./db.sqlite"\n');
				log('DATABASE_URL añadido al archivo .env', 'success');
			} else {
				log('DATABASE_URL ya existe en el archivo .env', 'info');
			}
		} catch (error) {
			log(`Error al leer/modificar el archivo .env: ${error.message}`, 'error');
			return false;
		}
	}

	return true;
}

// Función principal para resetear la base de datos con Drizzle
async function resetDatabase() {
	log('Iniciando reset de la base de datos con Drizzle...', 'info');

	const rootDir = path.resolve(__dirname, '../..');

	// Paso 1: Asegurar que existe el archivo .env con DATABASE_URL
	if (!ensureEnvFile()) {
		return false;
	}

	// Paso 2: Eliminar la base de datos si existe
	const dbPath = path.join(rootDir, 'db.sqlite');
	if (!deleteFileIfExists(dbPath)) {
		return false;
	}

	// Paso 3: Eliminar directorio de migraciones de Drizzle si existe
	const drizzlePath = path.join(rootDir, 'drizzle');
	if (!deleteDirIfExists(drizzlePath)) {
		return false;
	}

	// Paso 4: Generar migraciones con Drizzle
	log('Generando migraciones con Drizzle...', 'info');
	if (!runCommand('npx', ['drizzle-kit', 'generate'])) {
		log('Falló la generación de migraciones con Drizzle', 'error');
		return false;
	}
	log('Migraciones de Drizzle generadas correctamente', 'success');

	// Paso 5: Aplicar migraciones con Drizzle Push
	log('Aplicando esquema con Drizzle Push...', 'info');
	if (!runCommand('npx', ['drizzle-kit', 'push'])) {
		log('Falló la aplicación del esquema con Drizzle', 'error');
		return false;
	}
	log('Esquema aplicado correctamente con Drizzle', 'success');

	// Paso 6: Ejecutar seed con el nuevo sistema
	log('Ejecutando seed para poblar la base de datos...', 'info');
	if (!runCommand('tsx', ['scripts/db/seed-drizzle.ts'])) {
		log('Falló la ejecución del seed con Drizzle', 'error');
		return false;
	}
	log('Seed ejecutado correctamente con Drizzle', 'success');

	log('Reset de la base de datos completado con éxito usando Drizzle', 'success');
	return true;
}

// Ejecutar la función principal
resetDatabase().then((success) => {
	if (!success) {
		log('El proceso de reset falló', 'error');
		process.exit(1);
	}
});
