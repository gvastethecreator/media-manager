import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { properties } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra propiedades con IDs legibles
 * Formato: prop-nombre-01, prop-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedProperties(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🔍 Creando propiedades de prueba...');

	try {
		const sampleProperties = [
			{
				id: generateReadableId('property', 'Estilo Artistico', 1),
				name: 'Estilo Artístico',
				description: 'Defines the visual style of the image',
				emoji: '🎨',
				color: '#f59e0b',
				category: 'visual',
			},
			{
				id: generateReadableId('property', 'Calidad', 1),
				name: 'Calidad',
				description: 'Image quality level',
				emoji: '⭐',
				color: '#22c55e',
				category: 'técnico',
			},
		];

		await db.insert(properties).values(sampleProperties);

		seedLogger.success(`✅ ${sampleProperties.length} propiedades creadas`);
	} catch (error) {
		seedLogger.error('❌ Could not create properties:', error);
		throw error;
	}
}
