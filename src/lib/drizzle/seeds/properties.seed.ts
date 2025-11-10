import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { properties } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra propiedades minimalistas para verificación del sistema
 */
export async function seedProperties(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🔍 Creando propiedades de prueba...');

	try {
		const sampleProperties = [
			{
				id: 'property-1',
				name: 'Nivel de Poder',
				description: 'Clasificación del poder de personajes e items',
				emoji: '💪',
				color: '#ef4444',
				category: 'stats',
				shortcut: null,
				featuredImage: null,
				isFavorite: true,
			},
			{
				id: 'property-2',
				name: 'Alineamiento',
				description: 'Posición moral del personaje o facción',
				emoji: '⚖️',
				color: '#8b5cf6',
				category: 'moral',
				shortcut: null,
				featuredImage: null,
				isFavorite: true,
			},
			{
				id: 'property-3',
				name: 'Rareza',
				description: 'Nivel de rareza y valor de items',
				emoji: '💎',
				color: '#06b6d4',
				category: 'item quality',
				shortcut: null,
				featuredImage: null,
				isFavorite: true,
			},
			{
				id: 'property-4',
				name: 'Era',
				description: 'Periodo temporal o época histórica',
				emoji: '⏳',
				color: '#f59e0b',
				category: 'temporal',
				shortcut: null,
				featuredImage: null,
				isFavorite: false,
			},
		];

		await db.insert(properties).values(sampleProperties);

		seedLogger.success(`✅ ${sampleProperties.length} propiedades creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando propiedades:', error);
		throw error;
	}
}
