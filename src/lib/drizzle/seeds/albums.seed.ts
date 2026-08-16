import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { albums } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra álbumes con IDs legibles
 * Formato: alb-nombre-01, alb-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedAlbums(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('📔 Creando álbumes de prueba...');

	try {
		const sampleAlbums = [
			{
				id: generateReadableId('album', 'Favoritos', 1),
				name: 'Favoritos',
				description: 'Favorite images album',
				emoji: '⭐',
				color: '#f59e0b',
				featuredImage: null,
			},
			{
				id: generateReadableId('album', 'Coleccion Digital', 1),
				name: 'Colección Digital',
				description: 'Digital art and design',
				emoji: '🎨',
				color: '#a855f7',
				featuredImage: null,
			},
			{
				id: generateReadableId('album', 'Paisajes Epic', 1),
				name: 'Paisajes Épicos',
				description: 'Panoramic views and nature',
				emoji: '🏔️',
				color: '#22c55e',
				featuredImage: null,
			},
			{
				id: generateReadableId('album', 'Retratos Creativos', 1),
				name: 'Retratos Creativos',
				description: 'Artistic and expressive portraits',
				emoji: '📸',
				color: '#ec4899',
				featuredImage: null,
			},
		];

		await db.insert(albums).values(sampleAlbums);

		seedLogger.success(`✅ ${sampleAlbums.length} albums created`);
	} catch (error) {
		seedLogger.error('❌ Could not create albums:', error);
		throw error;
	}
}
