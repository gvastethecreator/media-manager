import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { favorites } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra favoritos minimalistas para verificación del sistema
 */
export async function seedFavorites(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('⭐ Creando favoritos de prueba...');

	try {
		const sampleFavorites = [
			{
				id: 'dddddddd-dddd-4ddd-addd-dddddddddd01',
				userId: '88888888-8888-4888-a888-888888888881',
				entityType: 'image',
				entityId: 'img-seed-001',
				notes: 'Imagen favorita de paisaje',
			},
			{
				id: 'dddddddd-dddd-4ddd-addd-dddddddddd02',
				userId: '88888888-8888-4888-a888-888888888881',
				entityType: 'album',
				entityId: 'V1StGXR8_Z5jdHi6B-myc',
				notes: 'Álbum favorito de fotografía',
			},
		];

		await db.insert(favorites).values(sampleFavorites);
		seedLogger.success(`✅ ${sampleFavorites.length} favoritos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando favoritos:', error);
		throw error;
	}
}
