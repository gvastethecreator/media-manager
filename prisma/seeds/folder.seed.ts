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
			// Definir carpetas de ejemplo con sus metadatos
			const sampleFolders = [
				{
					name: 'Cartoons',
					description: 'Cartoons',
					path: 'D:\\Pictures\\Cartoons',
					emoji: '🏞️',
					totalFiles: 45,
					totalSize: 230000000, // 230MB en bytes
					lastIndexed: new Date(),
					autoReindex: true,
					color: '#3b82f6',
					isFavorite: true,
				},
				{
					name: 'Wallpapers',
					description: 'Fondos de pantalla',
					path: 'D:\\Pictures\\Wallpapers',
					emoji: '🖼️',
					totalFiles: 120,
					totalSize: 800000000, // 800MB
					lastIndexed: new Date(),
					autoReindex: false,
					color: '#ef4444',
					isFavorite: false,
				},
				{
					name: 'Photography',
					description: 'Fotografías personales',
					path: 'D:\\Pictures\\Photography',
					emoji: '📷',
					totalFiles: 350,
					totalSize: 2100000000, // 2.1GB
					lastIndexed: new Date(),
					autoReindex: true,
					color: '#10b981',
					isFavorite: false,
				},
				{
					name: 'Memes',
					description: 'Colección de memes',
					path: 'D:\\Pictures\\Memes',
					emoji: '😂',
					totalFiles: 80,
					totalSize: 400000000, // 400MB
					lastIndexed: new Date(),
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
