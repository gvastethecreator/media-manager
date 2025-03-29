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
			];

			// Crear carpetas
			for (const folderData of sampleFolders) {
				await prisma.folder.create({
					data: folderData
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
