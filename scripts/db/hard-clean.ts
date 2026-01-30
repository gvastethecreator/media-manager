/**
 * Script de limpieza radical de la base de datos
 * Intenta eliminar todas las tablas, incluyendo las virtuales de FTS
 */

import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';

async function hardReset() {
	const client = createClient({
		url: process.env.DATABASE_URL || 'file:./db.sqlite',
	});

	const db = drizzle(client);

	try {
		console.log('🧨 Iniciando limpieza radical de la base de datos...');

		// 1. Obtener todas las tablas (incluyendo virtuales)
		const tablesResult = await db.all(sql`
            SELECT name FROM sqlite_master 
            WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'
        `);

		const tables = tablesResult.map((t) => t.name);
		console.log(`📋 Encontradas ${tables.length} entidades para eliminar.`);

		// 2. Deshabilitar FKs
		await db.run(sql`PRAGMA foreign_keys = OFF`);

		// 3. Eliminar tablas una por una
		for (const table of tables) {
			try {
				console.log(`🗑️ Eliminando: ${table}`);
				await db.run(sql.raw(`DROP TABLE IF EXISTS "${table}"`));
			} catch (e) {
				console.warn(`⚠️ No se pudo eliminar la tabla ${table} (podría ser parte de un índice virtual): ${e.message}`);
			}
		}

		// 4. Rehabilitar FKs
		await db.run(sql`PRAGMA foreign_keys = ON`);

		console.log('✅ Limpieza radical completada.');
	} catch (error) {
		console.error('❌ Error en limpieza radical:', error);
		throw error;
	} finally {
		client.close();
	}
}

hardReset().catch((err) => {
	console.error(err);
	process.exit(1);
});
