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
		// Definir carpetas padre y subcarpetas de ejemplo para demostrar la jerarquía visual
		const sampleFolders = [
			// Carpetas padre
			{
				id: 'cartoons',
				name: 'Cartoons',
				description: 'Cartoons y animaciones',
				path: 'D:\\Pictures\\Cartoons',
				emoji: '🎬',
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
				id: 'photography',
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
				id: 'wallpapers',
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
				id: 'memes',
				name: 'Memes',
				description: 'Memes y chistes',
				path: 'D:\\Pictures\\memes',
				emoji: '🎵',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: false,
				color: '#eab308',
				isFavorite: true,
				parentId: null,
				presetId: null,
			},
			// Subcarpetas para demostrar jerarquía
			{
				id: 'silenthill',
				name: 'SilentHill',
				description: 'Anime y manga',
				path: 'D:\\Pictures\\SilentHill',
				emoji: '🎌',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: true,
				color: '#8b5cf6',
				isFavorite: false,
				parentId: '',
				presetId: null,
			},
			{
				id: 'aesthethic',
				name: 'Aesthethic',
				description: 'Películas de Disney',
				path: 'D:\\Pictures\\Aesthethic',
				emoji: '🏰',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: false,
				color: '#f59e0b',
				isFavorite: true,
				parentId: '',
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
