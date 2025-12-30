import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { tags } from '../schema/index';
import { seedLogger } from './index';

/**
 * Siembra etiquetas minimalistas para verificación del sistema
 */
export async function seedTags(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🏷️ Creando etiquetas de prueba...');

	try {
		const sampleTags = [
			{
				id: '11111111-1111-4111-a111-111111111111',
				name: 'Arte Digital',
				description: 'Creaciones artísticas digitales',
				emoji: '🎨',
				color: '#8b5cf6',
				category: 'arte',
				isFavorite: true,
			},
			{
				id: '11111111-1111-4111-a111-111111111112',
				name: 'Naturaleza',
				description: 'Paisajes y elementos naturales',
				emoji: '🌿',
				color: '#10b981',
				category: 'temática',
				isFavorite: false,
			},
			{
				id: '11111111-1111-4111-a111-111111111113',
				name: 'Retrato',
				description: 'Fotografías de retratos y rostros',
				emoji: '👤',
				color: '#f59e0b',
				category: 'género',
				isFavorite: true,
			},
			{
				id: '11111111-1111-4111-a111-111111111114',
				name: 'Cyberpunk',
				description: 'Estética futurista y tecnológica',
				emoji: '🤖',
				color: '#ef4444',
				category: 'estilo',
				isFavorite: false,
			},
			{
				id: '11111111-1111-4111-a111-111111111115',
				name: 'Fantasía',
				description: 'Mundos mágicos e imaginarios',
				emoji: '🧙',
				color: '#6366f1',
				category: 'género',
				isFavorite: true,
			},
		];

		await db.insert(tags).values(sampleTags);

		seedLogger.success(`✅ ${sampleTags.length} etiquetas creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando etiquetas:', error);
		throw error;
	}
}
