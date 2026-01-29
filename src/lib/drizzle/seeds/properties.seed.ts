import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { properties } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra propiedades con IDs legibles
 * Formato: prop-nombre-01, prop-nombre-02, etc.
 */
export async function seedProperties(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🔍 Creando propiedades de prueba...');

	try {
		const sampleProperties = [
			{
				id: generateReadableId('property', 'Estilo Artistico', 1),
				name: 'Estilo Artístico',
				description: 'Define el estilo visual de la imagen',
				emoji: '🎨',
				color: '#f59e0b',
				category: 'visual',
				isFavorite: true,
			},
			{
				id: generateReadableId('property', 'Calidad', 1),
				name: 'Calidad',
				description: 'Nivel de calidad de la imagen',
				emoji: '⭐',
				color: '#22c55e',
				category: 'técnico',
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
