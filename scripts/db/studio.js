/**
 * Script para abrir Drizzle Studio
 */
import { execSync } from 'child_process';
import fs from 'fs';
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
	cyan: '\x1b[36m',
	magenta: '\x1b[35m',
};

// Función para mostrar mensajes con colores
function log(message, color = colors.blue) {
	console.log(`${color}${message}${colors.reset}`);
}

// Verificar que existe la base de datos
const rootDir = path.resolve(__dirname, '../..');
const dbPath = path.join(rootDir, 'dev.db');

if (!fs.existsSync(dbPath)) {
	log('⚠️ La base de datos no existe. Debes ejecutar primero:', colors.yellow);
	log('   db:reset está bloqueado hasta disponer de migraciones reproducibles', colors.yellow);
	process.exit(1);
}

// Abrir Drizzle Studio
log('🚀 Abriendo Drizzle Studio...', colors.green);
log('📊 Podrás explorar y editar los datos de la base de datos', colors.cyan);
log('🔗 URL: http://localhost:4983', colors.magenta);
log('⌨️ Presiona Ctrl+C para cerrar Drizzle Studio', colors.yellow);

try {
	execSync('bunx drizzle-kit studio', { stdio: 'inherit' });
} catch (error) {
	if (error.signal === 'SIGINT') {
		log('\n👋 Drizzle Studio cerrado correctamente', colors.green);
	} else {
		log(`\n❌ Error al ejecutar Drizzle Studio: ${error.message}`, colors.red);
		process.exit(1);
	}
}
