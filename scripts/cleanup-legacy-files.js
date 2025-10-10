#!/usr/bin/env node
/**
 * Script para eliminar archivos legacy/backup/old del proyecto
 * Ejecutar: bun run scripts/cleanup-legacy-files.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Archivos identificados para eliminar (uso local, no necesita validación exhaustiva)
const LEGACY_FILES = [
	'src/services/file-entity-mapper/file-entity-mapper.service.legacy.ts',
	'src/services/file-entity-mapper/file-entity-mapper.service.clean.ts',
];

async function cleanupLegacyFiles() {
	console.log('🗑️  Eliminando archivos legacy...\n');

	let deleted = 0;
	let notFound = 0;
	let errors = 0;

	for (const relativePath of LEGACY_FILES) {
		const fullPath = path.join(PROJECT_ROOT, relativePath);

		try {
			await fs.access(fullPath);
			await fs.unlink(fullPath);
			console.log(`✅ Eliminado: ${relativePath}`);
			deleted++;
		} catch (error) {
			if (error.code === 'ENOENT') {
				console.log(`⚠️  Ya no existe: ${relativePath}`);
				notFound++;
			} else {
				console.log(`❌ Error: ${relativePath} - ${error.message}`);
				errors++;
			}
		}
	}

	console.log('\n📊 Resumen:');
	console.log(`   ✅ Eliminados: ${deleted}`);
	console.log(`   ⚠️  No encontrados: ${notFound}`);
	console.log(`   ❌ Errores: ${errors}`);

	if (deleted > 0) {
		console.log('\n✅ Limpieza completada exitosamente');
		console.log('💡 Ejecuta `bun run tsc` para verificar que no hay errores');
	}
}

cleanupLegacyFiles().catch((err) => {
	console.error('❌ Error fatal:', err);
	process.exit(1);
});
