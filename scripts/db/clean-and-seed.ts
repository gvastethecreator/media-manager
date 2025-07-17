#!/usr/bin/env tsx

/**
 * Script para limpiar completamente la base de datos y ejecutar seeds
 * Resuelve problemas de claves duplicadas eliminando datos existentes
 */

import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { runSeeds } from '../../src/lib/drizzle/seeds/index';

async function cleanDatabase() {
	const client = createClient({
		url: process.env.DATABASE_URL || 'file:./db.sqlite',
	});

	const db = drizzle(client);

	try {
		console.log('🧹 Limpiando base de datos...');

		// Obtener todas las tablas
		const tables = await db.all(sql`
			SELECT name FROM sqlite_master 
			WHERE type='table' AND name NOT LIKE 'sqlite_%'
		`);

		console.log(`📋 Encontradas ${tables.length} tablas para limpiar`);

		// Deshabilitar foreign keys temporalmente
		await db.run(sql`PRAGMA foreign_keys = OFF`);

		// Eliminar datos de todas las tablas
		for (const table of tables) {
			const tableName = table.name;
			console.log(`🗑️ Limpiando tabla: ${tableName}`);
			await db.run(sql.raw(`DELETE FROM "${tableName}"`));
		}

		// Rehabilitar foreign keys
		await db.run(sql`PRAGMA foreign_keys = ON`);

		console.log('✅ Base de datos limpiada exitosamente');
	} catch (error) {
		console.error('❌ Error limpiando base de datos:', error);
		throw error;
	} finally {
		client.close();
	}
}

async function main() {
	try {
		console.log('🚀 Iniciando limpieza y seeds...');

		// Limpiar base de datos
		await cleanDatabase();

		// Ejecutar seeds
		console.log('🌱 Ejecutando seeds...');
		await runSeeds();

		console.log('🎉 Proceso completado exitosamente');
		process.exit(0);
	} catch (error) {
		console.error('💥 Error en el proceso:', error);
		process.exit(1);
	}
}

main();
