import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { folders } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra las carpetas por defecto en la base de datos con Drizzle
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedFolders(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📁 Creando carpetas por defecto...');

	try {
		const allowDemoSeeds = process.env.SEED_DEMO === '1' || process.env.NODE_ENV === 'test';
		// Definir carpetas padre y subcarpetas de ejemplo para demostrar la jerarquía visual
		const sampleFolders = [
			// Carpetas padre
			// Más subcarpetas para demostrar jerarquía
			{
				id: 'test-files',
				name: 'Test Files',
				description: 'Archivos de prueba para desarrollo',
				path: 'D:\\DEV\\image-manager\\test-files',
				emoji: '🧪',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				color: '#6366f1', // indigo
				parentId: null,
				presetId: null,
			},
			{
				id: 'posters',
				name: 'Posters',
				description: 'Fotografías de posters',
				path: 'A:\\MOKLOS DATASETS\\! POSTERS',
				emoji: '🌿',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				color: '#22c55e', // green
				parentId: null,
				presetId: null,
			},
			{
				id: 'cursed-dump',
				name: 'Cursed Dump',
				description: 'Memes divertidos',
				path: 'B:\\#OUTPUTS\\A111\\cursed dump',
				emoji: '😂',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				color: '#eab308', // yellow
				parentId: null,
				presetId: null,
			},

			{
				id: 'comfy',
				name: 'comfy',
				description: 'Memes divertidos',
				path: 'B:\\#OUTPUTS\\COMFY',
				emoji: '😂',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				color: '#eab308', // yellow
				parentId: null,
				presetId: null,
			},
			{
				id: 'cartoons',
				name: 'Cartoons',
				description: 'Cartoons y animaciones',
				path: 'D:\\Pictures\\Cartoons',
				emoji: '🎬',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				color: '#8b5cf6', // violet
				parentId: null,
				presetId: null,
			},
			{
				id: 'primigenios-core',
				name: 'Primigenios Core',
				description: 'Fotografías personales',
				path: 'A:\\MOKLOS DATASETS\\! PRIMIGENIOS CORE',
				emoji: '📷',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				color: '#22c55e', // green
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
				color: '#ef4444', // red
				parentId: null,
				presetId: null,
			},
			{
				id: 'silenthill',
				name: 'SilentHill',
				description: 'Anime y manga',
				path: 'D:\\Pictures\\Cartoons\\SilentHill',
				emoji: '🎌',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				color: '#a855f7', // purple
				parentId: null,
				presetId: null,
			},
			{
				id: 'aesthethic',
				name: 'Aesthethic',
				description: 'Fotografías estéticas',
				path: 'D:\\Pictures\\Photography\\Aesthethic',
				emoji: '🏰',
				totalFiles: 0,
				totalSize: 0,
				lastIndexed: null,
				color: '#f59e0b', // amber/orange
				parentId: null,
				presetId: null,
			},
		];

		// Insertar carpetas
		await db.insert(folders).values(sampleFolders);

		seedLogger.success(`✅ ${sampleFolders.length} carpetas creadas (incluyendo jerarquía padre-hijo)`);
	} catch (error) {
		seedLogger.error('❌ Error creando carpetas:', error);
		throw error;
	}
}
