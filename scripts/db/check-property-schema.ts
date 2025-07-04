#!/usr/bin/env tsx

/**
 * Script para verificar la estructura de la tabla Property
 */

import { db } from '@/lib/drizzle';

async function main() {
	console.log('🔍 Verificando estructura de la tabla Property...\n');

	try {
		// Obtener información de la tabla Property
		const tableInfo = await db.all('PRAGMA table_info(Property)');

		console.log('📋 Columnas de la tabla Property:');
		console.log('┌─────┬──────────────────┬─────────────┬─────────┬─────────────┬────┐');
		console.log('│ CID │ Name             │ Type        │ NotNull │ Default     │ PK │');
		console.log('├─────┼──────────────────┼─────────────┼─────────┼─────────────┼────┤');

		tableInfo.forEach((column: any) => {
			const cid = String(column.cid).padEnd(3);
			const name = String(column.name).padEnd(16);
			const type = String(column.type).padEnd(11);
			const notnull = String(column.notnull).padEnd(7);
			const dflt = String(column.dflt_value || '').padEnd(11);
			const pk = String(column.pk).padEnd(2);

			console.log(`│ ${cid} │ ${name} │ ${type} │ ${notnull} │ ${dflt} │ ${pk} │`);
		});

		console.log('└─────┴──────────────────┴─────────────┴─────────┴─────────────┴────┘\n');

		// Verificar también la tabla Wildcard
		console.log('🔍 Verificando estructura de la tabla Wildcard...\n');

		const wildcardInfo = await db.all('PRAGMA table_info(Wildcard)');

		console.log('📋 Columnas de la tabla Wildcard:');
		console.log('┌─────┬──────────────────┬─────────────┬─────────┬─────────────┬────┐');
		console.log('│ CID │ Name             │ Type        │ NotNull │ Default     │ PK │');
		console.log('├─────┼──────────────────┼─────────────┼─────────┼─────────────┼────┤');

		wildcardInfo.forEach((column: any) => {
			const cid = String(column.cid).padEnd(3);
			const name = String(column.name).padEnd(16);
			const type = String(column.type).padEnd(11);
			const notnull = String(column.notnull).padEnd(7);
			const dflt = String(column.dflt_value || '').padEnd(11);
			const pk = String(column.pk).padEnd(2);

			console.log(`│ ${cid} │ ${name} │ ${type} │ ${notnull} │ ${dflt} │ ${pk} │`);
		});

		console.log('└─────┴──────────────────┴─────────────┴─────────┴─────────────┴────┘\n');

		// Verificar qué columnas están definidas en Drizzle pero no existen en la BD
		const expectedPropertyColumns = [
			'id',
			'name',
			'description',
			'emoji',
			'color',
			'category',
			'isPublic',
			'isFavorite',
			'totalImages',
			'totalVideos',
			'createdAt',
			'updatedAt',
		];

		const actualPropertyColumns = tableInfo.map((col: any) => col.name);
		const missingPropertyColumns = expectedPropertyColumns.filter((col) => !actualPropertyColumns.includes(col));

		const expectedWildcardColumns = [
			'id',
			'name',
			'description',
			'emoji',
			'color',
			'category',
			'isPublic',
			'isFavorite',
			'totalImages',
			'totalVideos',
			'parentId',
			'createdAt',
			'updatedAt',
		];

		const actualWildcardColumns = wildcardInfo.map((col: any) => col.name);
		const missingWildcardColumns = expectedWildcardColumns.filter((col) => !actualWildcardColumns.includes(col));

		console.log('⚠️ Análisis de diferencias:');

		if (missingPropertyColumns.length > 0) {
			console.log(`\n❌ Columnas faltantes en Property: ${missingPropertyColumns.join(', ')}`);
		} else {
			console.log('\n✅ Todas las columnas esperadas de Property están presentes');
		}

		if (missingWildcardColumns.length > 0) {
			console.log(`❌ Columnas faltantes en Wildcard: ${missingWildcardColumns.join(', ')}`);
		} else {
			console.log('✅ Todas las columnas esperadas de Wildcard están presentes');
		}
	} catch (error) {
		console.error('❌ Error al verificar la estructura:', error);
	}
}

main();
