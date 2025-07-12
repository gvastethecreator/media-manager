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
				id: 'folder-1',
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
				id: 'folder-2',
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
				id: 'folder-3',
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
				id: 'folder-4',
				name: 'Music',
				description: 'Álbumes y música',
				path: 'D:\\Pictures\\Music',
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
				id: 'folder-5',
				name: 'Anime',
				description: 'Anime y manga',
				path: 'D:\\Pictures\\Cartoons\\Anime',
				emoji: '🎌',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: true,
				color: '#8b5cf6',
				isFavorite: false,
				parentId: 'folder-1',
				presetId: null,
			},
			{
				id: 'folder-6',
				name: 'Disney',
				description: 'Películas de Disney',
				path: 'D:\\Pictures\\Cartoons\\Disney',
				emoji: '🏰',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: false,
				color: '#f59e0b',
				isFavorite: true,
				parentId: 'folder-1',
				presetId: null,
			},
			{
				id: 'folder-7',
				name: 'Portraits',
				description: 'Retratos y fotografía de personas',
				path: 'D:\\Pictures\\Photography\\Portraits',
				emoji: '👤',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				autoReindex: true,
				color: '#06b6d4',
				isFavorite: false,
				parentId: 'folder-2',
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
