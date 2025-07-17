import 'dotenv/config';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../../src/lib/drizzle/schema/index.js';

console.log('🔧 Forzando creación de base de datos...');
console.log('📍 DATABASE_URL:', process.env.DATABASE_URL);

const client = createClient({
	url: process.env.DATABASE_URL || 'file:./db.sqlite',
});

const db = drizzle(client, { schema });

try {
	// Crear una consulta simple para forzar la creación del archivo
	console.log('🔨 Creando archivo de base de datos...');
	await db.run(sql`CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY)`);

	// Eliminar la tabla de prueba
	await db.run(sql`DROP TABLE IF EXISTS test_table`);

	console.log('✅ Base de datos creada exitosamente');

	// Verificar estructura de Activity
	console.log('🔍 Verificando tabla Activity...');
	const activityInfo = await db.all(sql`PRAGMA table_info(Activity)`);
	console.log('📋 Columnas de Activity:', JSON.stringify(activityInfo, null, 2));
} catch (error) {
	console.error('❌ Error:', error);
	process.exit(1);
} finally {
	client.close();
}
