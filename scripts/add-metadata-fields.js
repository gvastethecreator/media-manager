#!/usr/bin/env node

/**
 * Script para agregar campos metadata a tablas Audio y File3D
 */

async function addMetadataFields() {
	try {
		console.log('🔄 Agregando campos metadata...');

		const { db } = await import('../src/lib/drizzle/index.js');
		const { sql } = await import('drizzle-orm');

		// Agregar campo metadata a Audio
		console.log('  ➕ Agregando metadata a Audio...');
		await db.run(sql.raw(`ALTER TABLE Audio ADD COLUMN metadata text`));
		console.log('  ✅ Campo metadata agregado a Audio');

		// Agregar campo metadata a File3D
		console.log('  ➕ Agregando metadata a File3D...');
		await db.run(sql.raw(`ALTER TABLE File3D ADD COLUMN metadata text`));
		console.log('  ✅ Campo metadata agregado a File3D');

		console.log('\n🎉 Campos metadata agregados exitosamente\n');
	} catch (error) {
		// Si el error es de columna duplicada, no es un problema
		if (error.message.includes('duplicate column name') || error.message?.includes('column metadata already exists')) {
			console.log('⚠️  Los campos metadata ya existen (continuando...)\n');
			return;
		}
		console.error('❌ Error al agregar campos metadata:', error);
		process.exit(1);
	}
}

addMetadataFields();
