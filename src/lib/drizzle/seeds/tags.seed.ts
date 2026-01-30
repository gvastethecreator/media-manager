import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { tags } from '../schema/index';
import { seedLogger } from './index';

/**
 * Siembra etiquetas con IDs legibles
 * Formato: tag-nombre-01, tag-nombre-02, etc.
 */
export async function seedTags(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🏷️ Creando etiquetas de prueba...');

	try {
		const sampleTags = [
			{
				id: generateReadableId('tag', 'Arte Digital', 1),
				name: 'Arte Digital',
				description: 'Creaciones artísticas digitales',
				emoji: '🎨',
				color: '#a855f7',
				category: 'arte',
				isFavorite: true,
			},
			{
				id: generateReadableId('tag', 'Naturaleza', 1),
				name: 'Naturaleza',
				description: 'Paisajes y elementos naturales',
				emoji: '🌿',
				color: '#22c55e',
				category: 'tematica',
				isFavorite: false,
			},
			{
				id: generateReadableId('tag', 'Retrato', 1),
				name: 'Retrato',
				description: 'Fotografías de retratos y rostros',
				emoji: '👤',
				color: '#f59e0b',
				category: 'genero',
				isFavorite: true,
			},
			{
				id: generateReadableId('tag', 'Cyberpunk', 1),
				name: 'Cyberpunk',
				description: 'Estética futurista y tecnológica',
				emoji: '🤖',
				color: '#ef4444',
				category: 'estilo',
				isFavorite: false,
			},
			{
				id: generateReadableId('tag', 'Fantasia', 1),
				name: 'Fantasía',
				description: 'Mundos mágicos e imaginarios',
				emoji: '🧙',
				color: '#6366f1',
				category: 'genero',
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
