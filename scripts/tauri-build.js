#!/usr/bin/env node

/**
 * Script para preparar y construir la aplicación Tauri
 * Incluye el backend como sidecar
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🏗️  Iniciando build de Tauri con backend integrado...\n');

// 1. Construir el frontend
console.log('📦 Construyendo frontend...');
try {
	execSync('bun run build:vite', {
		cwd: rootDir,
		stdio: 'inherit',
	});
	console.log('✅ Frontend construido correctamente\n');
} catch (error) {
	console.error('❌ Error construyendo frontend:', error.message);
	process.exit(1);
}

// 2. Construir el backend
console.log('🚀 Construyendo backend...');
try {
	execSync('bun run build:server', {
		cwd: rootDir,
		stdio: 'inherit',
	});
	console.log('✅ Backend construido correctamente\n');
} catch (error) {
	console.error('❌ Error construyendo backend:', error.message);
	process.exit(1);
}

// 3. La distribución incluye migraciones, nunca una copia de datos del workspace.
console.log('🗃️  Verificando migraciones versionadas...');
const migrationsPath = join(rootDir, 'src', 'lib', 'drizzle', 'migrations', '0000_baseline.sql');
if (!existsSync(migrationsPath)) {
	console.error('❌ Falta el baseline de migraciones versionado.');
	process.exit(1);
}
console.log('✅ Baseline listo; no se empaquetará db.sqlite\n');

// 4. Crear script wrapper para el backend
console.log('📝 Creando wrapper del backend...');
const wrapperScript = `#!/usr/bin/env node

// Wrapper para ejecutar el backend en el contexto de Tauri
const { join } = require('path');
const { existsSync } = require('fs');

// Determinar la ruta del ejecutable
const isPackaged = process.env.TAURI_ENV === 'prod';
const backendPath = isPackaged
  ? join(process.resourcesPath, 'server', 'index.js')
  : join(__dirname, 'index.js');

// Configurar variables de entorno
if (isPackaged) {
  // Modo producción: usar recursos empaquetados
  process.env.NODE_ENV = 'production';
	if (!process.env.MEDIA_MANAGER_DATABASE_PATH) {
		throw new Error('Tauri debe proporcionar MEDIA_MANAGER_DATABASE_PATH dentro del app data dir.');
	}
	process.env.DATABASE_URL = 'file:' + process.env.MEDIA_MANAGER_DATABASE_PATH;
  process.env.API_PORT = process.env.PORT || '4000';
  process.env.CORS_ORIGIN = 'tauri://localhost';
} else {
  // Modo desarrollo: usar variables de entorno del proyecto
  process.env.NODE_ENV = 'development';
  process.env.DATABASE_URL = 'file:' + join(__dirname, 'db.sqlite');
  process.env.API_PORT = process.env.PORT || '4000';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.VITE_API_URL = 'http://localhost:4000/api';
}

// Log para debug
console.log('[Tauri Backend] Configuración:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DATABASE_URL:', process.env.DATABASE_URL);
console.log('- API_PORT:', process.env.API_PORT);
console.log('- Packaged:', isPackaged);

// Ejecutar el backend
require(backendPath);
`;

const wrapperPath = join(rootDir, 'dist', 'server', 'wrapper.js');
writeFileSync(wrapperPath, wrapperScript);
console.log('✅ Wrapper del backend creado\n');

// 5. Construir aplicación Tauri
console.log('🦀 Construyendo aplicación Tauri...');
try {
	execSync('bunx tauri build', {
		cwd: rootDir,
		stdio: 'inherit',
	});
	console.log('\n🎉 ¡Build de Tauri completado exitosamente!');
	console.log('📁 Los archivos de instalación están en: src-tauri/target/release/bundle/');
} catch (error) {
	console.error('❌ Error construyendo Tauri:', error.message);
	process.exit(1);
}
