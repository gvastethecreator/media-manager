/**
 * 🔧 Script para limpiar campos Audio duplicados en schema.prisma
 *
 * Este script elimina los campos Audio duplicados que quedaron de migraciones anteriores
 * y mantiene solo el audioId como foreign key.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function cleanDuplicateAudioFields() {
	console.log('🔧 Iniciando limpieza de campos Audio duplicados...');

	// Leer el archivo
	let content = fs.readFileSync(SCHEMA_PATH, 'utf8');

	// Patrón para encontrar bloques de metadata con campos Audio duplicados
	const duplicatePattern =
		/(\s+\/\/ Metadata\s+createdAt DateTime @default\(now\(\)\)\s+updatedAt DateTime @updatedAt\s+)Audio\s+Audio\?\s+@relation\(fields: \[audioId\], references: \[id\]\)\s+audioId\s+String\?\s+Audio\s+Audio\?\s+@relation\(fields: \[audioId\], references: \[id\]\)\s+/g;

	// Reemplazar con la versión limpia
	const cleanReplacement = '$1\n  // Foreign keys\n  audioId String?\n\n  ';

	const originalContent = content;
	content = content.replace(duplicatePattern, cleanReplacement);

	// Contar reemplazos
	const replacements = (originalContent.match(duplicatePattern) || []).length;

	if (replacements > 0) {
		// Escribir el archivo limpio
		fs.writeFileSync(SCHEMA_PATH, content, 'utf8');
		console.log(`✅ Limpieza completada: ${replacements} bloques de campos duplicados corregidos`);

		// Mostrar resumen
		console.log('\n📋 Modelos corregidos:');
		console.log('- Video, Group, Album, Collection');
		console.log('- Tag, Property, Wildcard, Character');
		console.log('- Place, WorldItem, Concept, Prompt, Note');

		console.log('\n🎯 Próximos pasos:');
		console.log('1. Ejecutar: pnpm prisma generate');
		console.log('2. Verificar que no hay errores de TypeScript');
		console.log('3. Actualizar tipos para incluir isFavorite');
	} else {
		console.log('ℹ️  No se encontraron campos duplicados para limpiar');
	}
}

// Ejecutar el script
if (require.main === module) {
	cleanDuplicateAudioFields();
}

module.exports = { cleanDuplicateAudioFields };
