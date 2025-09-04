#!/usr/bin/env node

/**
 * Script de migración para crear la tabla EntityAggregates
 * y migrar datos existentes de entidades con campos agregados
 */

import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '@/lib/drizzle';
import { serverLogger } from '@/lib/logger/server-logger';

async function runMigration() {
	try {
		console.log('🚀 Iniciando migración EntityAggregates...');

		// Leer el archivo SQL de migración
		const migrationPath = join(process.cwd(), 'src/lib/drizzle/migrations/0001_create_entity_aggregates.sql');
		const migrationSQL = readFileSync(migrationPath, 'utf8');

		// Dividir el archivo en comandos individuales
		const commands = migrationSQL
			.split(';')
			.map((cmd) => cmd.trim())
			.filter((cmd) => cmd.length > 0 && !cmd.startsWith('--'));

		console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);

		// Ejecutar cada comando
		for (let i = 0; i < commands.length; i++) {
			const command = commands[i];
			console.log(`⏳ Ejecutando comando ${i + 1}/${commands.length}...`);

			try {
				await db.run(sql.raw(command));
				console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
			} catch (error) {
				// Algunos comandos pueden fallar si ya existen (por ejemplo, CREATE TABLE IF NOT EXISTS)
				if (error.message.includes('already exists')) {
					console.log(`⚠️  Comando ${i + 1} omitido (ya existe)`);
				} else {
					throw error;
				}
			}
		}

		// Verificar que la tabla fue creada
		const result = await db.get(sql`SELECT COUNT(*) as count FROM entity_aggregates`);
		console.log(`📊 Tabla entity_aggregates creada con ${result.count} registros`);

		console.log('✅ Migración EntityAggregates completada exitosamente');
	} catch (error) {
		console.error('❌ Error durante la migración:', error);
		serverLogger.error('Migration failed', { error: error.message, stack: error.stack });
		process.exit(1);
	}
}

// Ejecutar la migración si el script se ejecuta directamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
	runMigration().catch(console.error);
}

export { runMigration };
