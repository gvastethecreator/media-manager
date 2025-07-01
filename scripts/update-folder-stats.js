#!/usr/bin/env node

/**
 * @file Script para actualizar estadísticas de carpetas
 * @description Script auxiliar para ejecutar la actualización de estadísticas desde la terminal
 */

import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

function log(message, color = colors.blue) {
	console.log(`${color}${message}${colors.reset}`);
}

async function main() {
	log('🔄 Iniciando actualización de estadísticas de carpetas...', colors.yellow);

	try {
		// Importar dinámicamente las funciones del filesystem
		const { updateAllFolderStats } = await import('../src/lib/filesystem/folder-stats.js');

		await updateAllFolderStats();
		log('✅ Estadísticas de carpetas actualizadas exitosamente', colors.green);
		process.exit(0);
	} catch (error) {
		log(`❌ Error actualizando estadísticas: ${error.message}`, colors.red);
		console.error(error);
		process.exit(1);
	}
}

main();
