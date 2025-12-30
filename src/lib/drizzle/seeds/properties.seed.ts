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
				id: 'ffffffff-ffff-4fff-afff-fffffffffff1',
				name: 'Estilo Artístico',
				description: 'Define el estilo visual de la imagen',
				emoji: '🎨',
				color: '#f59e0b',
				category: 'visual',
				shortcut: 'ctrl+e',
				featuredImage: null,
				isFavorite: true,
			},
			{
				id: 'ffffffff-ffff-4fff-afff-fffffffffff2',
				name: 'Calidad',
				description: 'Nivel de calidad de la imagen',
				emoji: '⭐',
				color: '#10b981',
				category: 'técnico',
				shortcut: 'ctrl+q',
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
