#!/usr/bin/env bun
/**
 * Script de prueba de conexión a la base de datos
 */

// Importar la configuración de la base de datos
import { db } from './src/lib/drizzle/index.js';
import { folders } from './src/lib/drizzle/schema.js';

async function testDatabaseConnection() {
	try {
		console.log('🔍 Probando conexión a la base de datos...');

		// Intentar una consulta simple
		const result = await db.select().from(folders).limit(1);

		console.log('✅ Conexión a la base de datos exitosa');
		console.log('📊 Ejemplo de carpeta:', result[0] || 'No hay carpetas en la base de datos');

		process.exit(0);
	} catch (error) {
		console.error('❌ Error de conexión a la base de datos:', error);
		process.exit(1);
	}
}

testDatabaseConnection();
