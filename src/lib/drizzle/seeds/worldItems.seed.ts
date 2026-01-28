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
				id: 'cccccccc-cccc-4ccc-accc-cccccccccc01',
				name: 'Espada Legendaria',
				description: 'Arma mítica de gran poder',
				emoji: '🗡️',
				color: 'var(--dt-warning-500)',
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
				id: 'cccccccc-cccc-4ccc-accc-cccccccccc02',
				name: 'Poción Curativa',
				description: 'Restaura la salud',
				emoji: '🧪',
				color: 'var(--dt-success-500)',
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
			{
				id: 'cccccccc-cccc-4ccc-accc-cccccccccc03',
				name: 'Amuleto de Protección',
				description: 'Otorga defensa mágica',
				emoji: '📿',
				color: 'var(--dt-primary-500)',
				category: 'accesorio',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'amuleto',
				rarity: 'raro',
				value: '2500',
				weight: '0.05kg',
				materials: 'plata, gema azul',
				origin: 'Templo del Este',
				properties: 'resistencia mágica +20',
				uses: 'protección',
				history: 'Bendecido por sacerdotes antiguos',
				notes: 'Brillante en presencia de magia',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'cccccccc-cccc-4ccc-accc-cccccccccc04',
				name: 'Mapa del Tesoro',
				description: 'Muestra ubicación de un tesoro escondido',
				emoji: '🗺️',
				color: '#a16207',
				category: 'especial',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'documento',
				rarity: 'épico',
				value: 'incalculable',
				weight: '0.01kg',
				materials: 'pergamino, tinta mágica',
				origin: 'Pirata Barbanegra',
				properties: 'revela ubicación al activarse',
				uses: 'navegación',
				history: 'Perdido hace 200 años',
				notes: 'Solo puede leerse bajo la luna llena',
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
