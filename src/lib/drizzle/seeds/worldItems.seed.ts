import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { worldItems } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra objetos del mundo minimalistas para verificación del sistema
 */
export async function seedWorldItems(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎯 Creando world items de prueba...');

	try {
		const sampleWorldItems = [
			{
				id: 'worlditem-1',
				name: 'Espada Legendaria',
				description: 'Arma mítica de gran poder',
				emoji: '🗡️',
				color: '#f59e0b',
				category: 'arma',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'arma',
				rarity: 'legendaria',
				value: '10000',
				weight: '2kg',
				materials: 'acero, magia',
				origin: 'forjada por dioses',
				properties: 'indestructible',
				uses: 'combate',
				history: 'usada en la gran guerra',
				notes: 'Solo para pruebas',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'worlditem-2',
				name: 'Poción Curativa',
				description: 'Restaura la salud',
				emoji: '🧪',
				color: '#10b981',
				category: 'consumible',
				isPublic: false,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'poción',
				rarity: 'común',
				value: '50',
				weight: '0.1kg',
				materials: 'hierbas',
				origin: 'alquimista local',
				properties: 'cura heridas',
				uses: 'curación',
				history: 'usada por aventureros',
				notes: 'Solo para pruebas',
				featuredImage: null,
				parentId: null,
			},
		];

		await db.insert(worldItems).values(sampleWorldItems);

		seedLogger.success(`✅ ${sampleWorldItems.length} world items creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando world items:', error);
		throw error;
	}
}
