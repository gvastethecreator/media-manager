#!/usr/bin/env tsx

/**
 * Script para verificar datos en las tablas principales
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { activities, characters, collections, folders, images, places, tags, worldItems } from '@/lib/drizzle/schema';

async function main() {
	console.log('🔍 Verificando datos en tablas principales...\n');

	try {
		// Obtener contadores de cada tabla
		const [
			totalImages,
			totalFolders,
			totalTags,
			totalCollections,
			totalCharacters,
			totalPlaces,
			totalWorldItems,
			totalActivities,
		] = await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(images),
			db.select({ count: sql<number>`count(*)` }).from(folders),
			db.select({ count: sql<number>`count(*)` }).from(tags),
			db.select({ count: sql<number>`count(*)` }).from(collections),
			db.select({ count: sql<number>`count(*)` }).from(characters),
			db.select({ count: sql<number>`count(*)` }).from(places),
			db.select({ count: sql<number>`count(*)` }).from(worldItems),
			db.select({ count: sql<number>`count(*)` }).from(activities),
		]);

		console.log('📊 Contadores de tablas:');
		console.log(`  - Images: ${totalImages[0]?.count || 0}`);
		console.log(`  - Folders: ${totalFolders[0]?.count || 0}`);
		console.log(`  - Tags: ${totalTags[0]?.count || 0}`);
		console.log(`  - Collections: ${totalCollections[0]?.count || 0}`);
		console.log(`  - Characters: ${totalCharacters[0]?.count || 0}`);
		console.log(`  - Places: ${totalPlaces[0]?.count || 0}`);
		console.log(`  - WorldItems: ${totalWorldItems[0]?.count || 0}`);
		console.log(`  - Activities: ${totalActivities[0]?.count || 0}`);

		// Verificar si hay algún dato
		const hasData = [
			totalImages[0]?.count,
			totalFolders[0]?.count,
			totalTags[0]?.count,
			totalCollections[0]?.count,
			totalCharacters[0]?.count,
			totalPlaces[0]?.count,
			totalWorldItems[0]?.count,
			totalActivities[0]?.count,
		].some((count) => count && count > 0);

		console.log(
			`\n${hasData ? '✅' : '❌'} Estado de datos: ${hasData ? 'Hay datos en las tablas' : 'No hay datos en las tablas'}`
		);

		if (!hasData) {
			console.log('\n💡 Sugerencia: Ejecutar seeds para poblar la base de datos');
			console.log('   bun run scripts/db/seed-drizzle.ts');
		}
	} catch (error) {
		console.error('❌ Error al verificar datos:', error);
		process.exit(1);
	}
}

main();
