import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { folders } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra las carpetas por defecto en la base de datos con Drizzle
 * Mantiene la estructura original del sistema Prisma
 */
export async function seedFolders(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📁 Creando carpetas por defecto...');

	try {
		// Definir carpetas de ejemplo (manteniendo estructura original)
		const sampleFolders = [
			{
				id: 'folder-1',
				name: 'Cartoons',
				description: 'Cartoons',
				path: 'D:\\Pictures\\Cartoons',
				emoji: '🏞️',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: true,
				color: '#3b82f6',
				isFavorite: true,
				parentId: null,
				presetId: null,
			},
			{
				id: 'folder-2',
				name: 'Wallpapers',
				description: 'Fondos de pantalla',
				path: 'D:\\Pictures\\Wallpapers',
				emoji: '🖼️',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: false,
				color: '#ef4444',
				isFavorite: false,
				parentId: null,
				presetId: null,
			},
			{
				id: 'folder-3',
				name: 'Photography',
				description: 'Fotografías personales',
				path: 'D:\\Pictures\\Photography',
				emoji: '📷',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: true,
				color: '#10b981',
				isFavorite: false,
				parentId: null,
				presetId: null,
			},
			{
				id: 'folder-4',
				name: 'Memes',
				description: 'Colección de memes',
				path: 'D:\\Pictures\\Memes',
				emoji: '😂',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: false,
				color: '#eab308',
				isFavorite: true,
				parentId: null,
				presetId: null,
			},
		];

		// Insertar carpetas
		await db.insert(folders).values(sampleFolders);

		seedLogger.success(`✅ ${sampleFolders.length} carpetas creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando carpetas:', error);
		throw error;
	}
}
