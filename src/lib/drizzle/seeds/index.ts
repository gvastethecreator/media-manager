import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { seedAlbums } from './albums.seed';
import { seedCharacters } from './characters.seed';
import { seedCollections } from './collections.seed';
import { seedConcepts } from './concepts.seed';
import { seedFolders } from './folders.seed';
import { seedGroups } from './groups.seed';
import { seedNotes } from './notes.seed';
import { seedPlaces } from './places.seed';
import { seedProfiles } from './profiles.seed';
import { seedPrompts } from './prompts.seed';
import { seedProperties } from './properties.seed';
import { seedSettings } from './settings.seed';
import { seedTags } from './tags.seed';
import { seedWildcards } from './wildcards.seed';
import { seedWorkflows } from './workflows.seed';
import { seedWorldItems } from './worldItems.seed';

/**
 * =================================================================================
 * SISTEMA DE SEEDS PARA DRIZZLE ORM
 * =================================================================================
 * Sistema minimalista de seeds para verificación del funcionamiento del sistema.
 * Solo se incluyen entidades abstractas (organización, etiquetas, taxonomías, flujos, settings, etc.).
 * Todas las entidades tienen máximo 2 elementos excepto folders que mantiene la estructura original.
 * No se generan seeds para entidades que dependen de archivos reales (imágenes, videos, audios, etc.).
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
		await seedProfiles(db);
		await seedFolders(db);
		await seedTags(db);
		await seedAlbums(db);
		await seedCollections(db);
		await seedCharacters(db);
		await seedProperties(db);
		await seedWildcards(db);
		await seedConcepts(db);
		await seedPrompts(db);
		await seedNotes(db);
		await seedGroups(db);
		await seedPlaces(db);
		await seedWorldItems(db);
		await seedSettings(db);
		await seedWorkflows(db);

		seedLogger.success('🎉 Seeds completadas exitosamente');
	} catch (error) {
		seedLogger.error('💥 Error ejecutando seeds:', error);
		throw error;
	} finally {
		client.close();
	}
}
