import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { seedActivities } from './activities.seed';
import { seedAlbums } from './albums.seed';
import { seedAudios } from './audios.seed';
import { seedCharacters } from './characters.seed';
import { seedCollections } from './collections.seed';
import { seedConcepts } from './concepts.seed';
import { seedDocuments } from './documents.seed';
import { seedFavorites } from './favorites.seed';
import { seedFile3Ds } from './file3Ds.seed';
import { seedFiles } from './files.seed';
import { seedFolders } from './folders.seed';
import { seedGroups } from './groups.seed';
import { seedImageStats } from './imageStats.seed';
import { seedImages } from './images.seed';
import { seedJsonFiles } from './jsonFiles.seed';
import { seedMetadatas } from './metadatas.seed';
import { seedNotes } from './notes.seed';
import { seedPlaces } from './places.seed';
import { seedProfiles } from './profiles.seed';
import { seedPrompts } from './prompts.seed';
import { seedProperties } from './properties.seed';
import { seedQueueJobs } from './queueJobs.seed';
import { seedSettings } from './settings.seed';
import { seedTags } from './tags.seed';
import { seedThumbnails } from './thumbnails.seed';
import { seedUploadedImages } from './uploadedImages.seed';
import { seedVideos } from './videos.seed';
import { seedWildcards } from './wildcards.seed';
import { seedWorkflows } from './workflows.seed';
import { seedWorldItems } from './worldItems.seed';

/**
 * =================================================================================
 * SISTEMA DE SEEDS PARA DRIZZLE ORM
 * =================================================================================
 * Sistema completo de seeds para verificación del funcionamiento del sistema.
 * Incluye todas las entidades del esquema con datos de ejemplo.
 * Todas las entidades tienen máximo 2 elementos excepto folders que mantiene la estructura original.
 * Los archivos multimedia son referencias de ejemplo, no archivos reales.
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
		url: process.env.DATABASE_URL || 'file:./db.sqlite',
	});

	const db = drizzle(client);

	try {
		seedLogger.info('🌱 Iniciando proceso de seeds para Drizzle...');

		// Ejecutar seeds en orden de dependencias
		// Core entities
		await seedProfiles(db);
		await seedQueueJobs(db);
		await seedSettings(db);

		// Media entities
		await seedFolders(db);
		await seedImages(db);
		await seedVideos(db);
		await seedAudios(db);
		await seedUploadedImages(db);

		// Organization entities
		await seedAlbums(db);
		await seedCollections(db);
		await seedGroups(db);
		await seedFavorites(db);
		await seedFiles(db);

		// Taxonomy entities
		await seedTags(db);
		await seedCharacters(db);
		await seedProperties(db);
		await seedWildcards(db);
		await seedConcepts(db);
		await seedPrompts(db);
		await seedNotes(db);
		await seedPlaces(db);
		await seedWorldItems(db);

		// Content entities
		await seedWorkflows(db);
		await seedActivities(db);
		await seedDocuments(db);
		await seedFile3Ds(db);
		await seedJsonFiles(db);
		await seedImageStats(db);
		await seedMetadatas(db);
		await seedThumbnails(db);

		seedLogger.success('🎉 Seeds completadas exitosamente');
	} catch (error) {
		seedLogger.error('💥 Error ejecutando seeds:', error);
		throw error;
	} finally {
		client.close();
	}
}

// Ejecutar seeds si este archivo se ejecuta directamente
if (import.meta.main) {
	runSeeds().catch(console.error);
}
