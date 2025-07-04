#!/usr/bin/env tsx

/**
 * Script para verificar las tablas que existen en la base de datos
 */

import { db } from '@/lib/drizzle';

async function main() {
	console.log('🔍 Verificando tablas en la base de datos...\n');

	try {
		// Listar todas las tablas
		const tablesResult = await db.all(
			"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
		);

		console.log('📋 Tablas encontradas:');
		tablesResult.forEach((table: any) => {
			console.log(`  - ${table.name}`);
		});

		console.log(`\n✅ Total: ${tablesResult.length} tablas\n`);

		// Verificar específicamente las tablas que nos interesan
		const propertyExists = tablesResult.some((t: any) => t.name === 'Property');
		const wildcardExists = tablesResult.some((t: any) => t.name === 'Wildcard');

		console.log('🎯 Verificación específica:');
		console.log(`  - Property: ${propertyExists ? '✅ Existe' : '❌ No existe'}`);
		console.log(`  - Wildcard: ${wildcardExists ? '✅ Existe' : '❌ No existe'}`);

		// Buscar variaciones de nombres
		const propertyVariations = tablesResult.filter(
			(t: any) => t.name.toLowerCase().includes('property') || t.name.toLowerCase().includes('properties')
		);
		const wildcardVariations = tablesResult.filter((t: any) => t.name.toLowerCase().includes('wildcard'));

		if (propertyVariations.length > 0) {
			console.log('\n🔍 Variaciones de Property encontradas:');
			propertyVariations.forEach((t: any) => console.log(`  - ${t.name}`));
		}

		if (wildcardVariations.length > 0) {
			console.log('\n🔍 Variaciones de Wildcard encontradas:');
			wildcardVariations.forEach((t: any) => console.log(`  - ${t.name}`));
		}
	} catch (error) {
		console.error('❌ Error al verificar las tablas:', error);
	}
}

main();
