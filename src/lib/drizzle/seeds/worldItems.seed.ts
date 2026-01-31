import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { worldItems } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra objetos del mundo con IDs legibles
 * Formato: item-nombre-01, item-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedWorldItems(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎯 Creando objetos del mundo de prueba...');

	try {
		const sampleWorldItems = [
			{
				id: generateReadableId('world-item', 'Espada Legendaria', 1),
				name: 'Espada Legendaria',
				description: 'Arma mítica de gran poder',
				emoji: '🗡️',
				color: '#f59e0b',
				category: 'arma',
				isFavorite: true,
				subtype: 'arma',
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
				parentId: null,
			},
			{
				id: generateReadableId('world-item', 'Pocion Curativa', 1),
				name: 'Poción Curativa',
				description: 'Restaura la salud',
				emoji: '🧪',
				color: '#22c55e',
				category: 'consumible',
				isFavorite: false,
				subtype: 'poción',
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
				parentId: null,
			},
			{
				id: generateReadableId('world-item', 'Amuleto Proteccion', 1),
				name: 'Amuleto de Protección',
				description: 'Otorga defensa mágica',
				emoji: '📿',
				color: '#3b82f6',
				category: 'accesorio',
				isFavorite: true,
				subtype: 'amuleto',
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
				parentId: null,
			},
			{
				id: generateReadableId('world-item', 'Mapa del Tesoro', 1),
				name: 'Mapa del Tesoro',
				description: 'Muestra ubicación de un tesoro escondido',
				emoji: '🗺️',
				color: '#a16207',
				category: 'especial',
				isFavorite: false,
				subtype: 'documento',
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
				parentId: null,
			},
		];

		await db.insert(worldItems).values(sampleWorldItems);

		seedLogger.success(`✅ ${sampleWorldItems.length} objetos del mundo creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando world items:', error);
		throw error;
	}
}
