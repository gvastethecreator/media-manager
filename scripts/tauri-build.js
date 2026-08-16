#!/usr/bin/env node

/**
 * Script para preparar y construir la aplicación Tauri
 * Incluye el backend como sidecar
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
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

// 4. Construir aplicación Tauri
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
