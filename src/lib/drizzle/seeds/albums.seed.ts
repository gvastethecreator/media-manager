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
				description: 'Álbum de imágenes favoritas',
				emoji: '⭐',
				color: '#f59e0b',
				featuredImage: null,
				isFavorite: true,
			},
			{
				id: generateReadableId('album', 'Coleccion Digital', 1),
				name: 'Colección Digital',
				description: 'Arte y diseño digital',
				emoji: '🎨',
				color: '#a855f7',
				featuredImage: null,
				isFavorite: false,
			},
			{
				id: generateReadableId('album', 'Paisajes Epic', 1),
				name: 'Paisajes Épicos',
				description: 'Vistas panorámicas y naturaleza',
				emoji: '🏔️',
				color: '#22c55e',
				featuredImage: null,
				isFavorite: true,
			},
			{
				id: generateReadableId('album', 'Retratos Creativos', 1),
				name: 'Retratos Creativos',
				description: 'Retratos artísticos y expresivos',
				emoji: '📸',
				color: '#ec4899',
				featuredImage: null,
				isFavorite: false,
			},
		];

		await db.insert(albums).values(sampleAlbums);

		seedLogger.success(`✅ ${sampleAlbums.length} álbumes creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando álbumes:', error);
		throw error;
	}
}
