/**
 * @file Seeds para datos de prueba
 * @module drizzle/seeds
 * @deprecated Todos los seeds poblaban `isFavorite` como columna embebida en tablas per-type.
 * Cuando se migre a la tabla canónica `favorites` (ADR-0002), los seeds deben
 * usar `favorites.seed.ts` como fuente única y eliminar `isFavorite` de los inserts.
 * Ver ADR-0002 + 04-favorite-bridge.md.
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { requireDatabaseUrl } from '../database-url';
import { seedAlbums } from './albums.seed';
import { seedAudios } from './audios.seed';
import { seedCharacters } from './characters.seed';
import { seedCollections } from './collections.seed';
import { seedConcepts } from './concepts.seed';
import { seedDocuments } from './documents.seed';
import { seedFile3Ds } from './file3Ds.seed';
import { seedFolders } from './folders.seed';
import { seedGroups } from './groups.seed';
import { seedImages } from './images.seed';
import { seedJsonFiles } from './jsonFiles.seed';
import { seedNotes } from './notes.seed';
import { seedPlaces } from './places.seed';
import { seedProfiles } from './profiles.seed';
import { seedPrompts } from './prompts.seed';
import { seedTags } from './tags.seed';
import { seedVideos } from './videos.seed';
import { seedWildcards } from './wildcards.seed';
import { seedWorldItems } from './worldItems.seed';

/**
 * =================================================================================
 * SISTEMA DE SEEDS PARA DRIZZLE ORM
 * =================================================================================
 * Seeds completas: Incluye todas las entidades principales con al menos 3 items
 * =================================================================================
 */

// Logger simple para seeds
export const seedLogger = {
	info: (message: string, ...args: any[]) => console.log(`ℹ️ ${message}`, ...args),
	warn: (message: string, ...args: any[]) => console.warn(`⚠️ ${message}`, ...args),
	error: (message: string, ...args: any[]) => console.error(`❌ ${message}`, ...args),
	success: (message: string, ...args: any[]) => console.log(`✅ ${message}`, ...args),
};

/**
 * Función principal para ejecutar todas las seeds
 */
export async function runSeeds() {
	const client = createClient({
		url: requireDatabaseUrl(),
	});

	const db = drizzle(client);

	try {
		seedLogger.info('🌱 Iniciando proceso de seeds para Drizzle...');

		// Ejecutar seeds en orden de dependencias
		// 1. Perfiles (configuración base)
		await seedProfiles(db);

		// 2. Carpetas (estructura de almacenamiento)
		await seedFolders(db);
		await seedImages(db);
		await seedVideos(db);
		await seedAudios(db);
		await seedDocuments(db);
		await seedJsonFiles(db);
		await seedFile3Ds(db);

		// 3. Entidades de organización
		await seedGroups(db);
		await seedAlbums(db);
		await seedCollections(db);

		// 4. Taxonomía y clasificación
		await seedTags(db);
		await seedWildcards(db);
		await seedPrompts(db);
		await seedNotes(db);

		// 5. Worldbuilding
		await seedCharacters(db);
		await seedPlaces(db);
		await seedConcepts(db);
		await seedWorldItems(db);

		seedLogger.success('🎉 Seeds completadas exitosamente');
	} catch (error) {
		seedLogger.error('💥 Error ejecutando seeds:', error);
		throw error;
	} finally {
		(client as any).close();
	}
}

// Ejecutar seeds si este archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
	runSeeds().catch(console.error);
}
