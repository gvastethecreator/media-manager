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
				id: 'fav-1',
				userId: 'profile-1',
				entityType: 'image',
				entityId: 'img-example-1',
				notes: 'Imagen favorita de paisaje',
			},
			{
				id: 'fav-2',
				userId: 'profile-1',
				entityType: 'album',
				entityId: 'album-1',
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
