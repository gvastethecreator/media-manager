import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las carpetas por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedFolders(prisma: PrismaClient): Promise<void> {
	seedLogger.info('📁 Creando carpetas por defecto...');

	try {
		// Verificar si la tabla Folder existe
		if (await tableExists(prisma, 'Folder')) {
			// Definir carpetas de ejemplo con sus metadatos (sin datos falsos)
			const sampleFolders = [
				{
					name: 'Cartoons',
					description: 'Cartoons',
					path: 'D:\\Pictures\\Cartoons',
					emoji: '🏞️',
					totalFiles: 0, // Será actualizado por el reindexado
					totalSize: 0, // Será actualizado por el reindexado
					lastIndexed: null, // No indexado inicialmente
					autoReindex: true,
					color: '#3b82f6',
					isFavorite: true,
				},
				{
					name: 'Wallpapers',
					description: 'Fondos de pantalla',
					path: 'D:\\Pictures\\Wallpapers',
					emoji: '🖼️',
					totalFiles: 0, // Será actualizado por el reindexado
					totalSize: 0, // Será actualizado por el reindexado
					lastIndexed: null, // No indexado inicialmente
					autoReindex: false,
					color: '#ef4444',
					isFavorite: false,
				},
				{
					name: 'Photography',
					description: 'Fotografías personales',
					path: 'D:\\Pictures\\Photography',
					emoji: '📷',
					totalFiles: 0, // Será actualizado por el reindexado
					totalSize: 0, // Será actualizado por el reindexado
					lastIndexed: null, // No indexado inicialmente
					autoReindex: true,
					color: '#10b981',
					isFavorite: false,
				},
				{
					name: 'Memes',
					description: 'Colección de memes',
					path: 'D:\\Pictures\\Memes',
					emoji: '😂',
					totalFiles: 0, // Será actualizado por el reindexado
					totalSize: 0, // Será actualizado por el reindexado
					lastIndexed: null, // No indexado inicialmente
					autoReindex: false,
					color: '#eab308',
					isFavorite: true,
				},
			];

			// Crear carpetas
			for (const folderData of sampleFolders) {
				await prisma.folder.create({
					data: folderData,
				});
			}

			seedLogger.info(`✅ ${sampleFolders.length} carpetas creadas`);
		} else {
			seedLogger.warn('⚠️ La tabla Folder no existe, saltando creación de carpetas');
		}
	} catch (error) {
		seedLogger.error('❌ Error creando carpetas:', error);
		throw error;
	}
}
