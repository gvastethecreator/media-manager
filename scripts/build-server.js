/**
 * @file Script para cargar variables de entorno y ejecutar el build del servidor
 * @description Carga el archivo .env antes de ejecutar tsup
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

console.log('✅ Variables de entorno cargadas');
console.log('📦 Iniciando build del servidor...');

// Ejecutar tsup con las variables de entorno cargadas
try {
	execSync('tsup', { stdio: 'inherit' });
	console.log('✅ Build del servidor completado');
} catch (error) {
	console.error('❌ Error en el build del servidor:', error);
	process.exit(1);
}
