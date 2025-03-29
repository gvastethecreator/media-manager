import { PrismaClient } from '@prisma/client';
import { seedAlbums } from './seeds/album.seed';
import { seedCharacters } from './seeds/character.seed';
import { seedCollections } from './seeds/collection.seed';
import { seedConcepts } from './seeds/concept.seed';
import { seedFolders } from './seeds/folder.seed';
import { seedGroups } from './seeds/group.seed';
import { seedNotes } from './seeds/note.seed';
import { seedPlaces } from './seeds/place.seed';
import { seedProfiles } from './seeds/profile.seed';
import { seedPrompts } from './seeds/prompt.seed';
import { seedProperties } from './seeds/property.seed';
import { seedSettings } from './seeds/settings.seed';
import { seedTags } from './seeds/tag.seed';
import { safeDeleteMany, seedLogger } from './seeds/utils.seed';
import { seedWildcards } from './seeds/wildcard.seed';
import { seedWorldItems } from './seeds/worlditem.seed';

const prisma = new PrismaClient({
	log: ['error', 'warn'],
});

async function main() {
	seedLogger.info('🌱 Iniciando proceso de seed...');

	// Limpiar la base de datos de forma segura
	seedLogger.info('🧹 Limpiando base de datos...');

	// Lista de modelos y sus tablas correspondientes
	const modelsToClean = [
		{ model: 'profile', table: 'Profile' },
		{ model: 'settings', table: 'Settings' },
		{ model: 'folder', table: 'Folder' },
		{ model: 'image', table: 'Image' },
		{ model: 'video', table: 'Video' },
		{ model: 'uploadedImage', table: 'UploadedImage' },
		{ model: 'imageStats', table: 'ImageStats' },
		{ model: 'activity', table: 'Activity' },
		{ model: 'album', table: 'Album' },
		{ model: 'collection', table: 'Collection' },
		{ model: 'tag', table: 'Tag' },
		{ model: 'property', table: 'Property' },
		{ model: 'wildcard', table: 'Wildcard' },
		{ model: 'character', table: 'Character' },
		{ model: 'place', table: 'Place' },
		{ model: 'worldItem', table: 'WorldItem' },
		{ model: 'concept', table: 'Concept' },
		{ model: 'prompt', table: 'Prompt' },
		{ model: 'note', table: 'Note' },
		{ model: 'group', table: 'Group' },
	];

	// Eliminar registros de cada tabla de forma segura
	for (const { model, table } of modelsToClean) {
		await safeDeleteMany(prisma, model, table);
	}

	try {
		// Sembrar perfiles
		await seedProfiles(prisma);

		// Sembrar settings después de perfiles (por la relación cíclica)
		await seedSettings(prisma);

		 // Sembrar carpetas
		await seedFolders(prisma);

		// Sembrar etiquetas
		await seedTags(prisma);

		// Sembrar propiedades
		await seedProperties(prisma);

		// Sembrar wildcards
		await seedWildcards(prisma);

		// Sembrar álbumes
		await seedAlbums(prisma);

		// Sembrar colecciones
		await seedCollections(prisma);

		// Sembrar lugares
		await seedPlaces(prisma);

		// Sembrar personajes
		await seedCharacters(prisma);

		// Sembrar objetos del mundo
		await seedWorldItems(prisma);

		// Sembrar conceptos
		await seedConcepts(prisma);

		// Sembrar prompts
		await seedPrompts(prisma);

		// Sembrar notas
		await seedNotes(prisma);

		// Sembrar grupos (debe ser al final para poder agrupar entidades ya creadas)
		await seedGroups(prisma);

		seedLogger.info('✅ Proceso de seed completado con éxito');
	} catch (error) {
		seedLogger.error('❌ Error durante el proceso de seed:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		seedLogger.error('❌ Error durante el proceso de seed:', e);
		await prisma.$disconnect();
		process.exit(1);
	});
