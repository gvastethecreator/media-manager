import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { tags } from '../schema/index';
import { seedLogger } from './index';

/**
 * Siembra etiquetas con IDs legibles
 * Formato: tag-nombre-01, tag-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedTags(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🏷️ Creando etiquetas de prueba...');

	try {
		const sampleTags = [
			{
				id: generateReadableId('tag', 'Arte Digital', 1),
				name: 'Arte Digital',
				description: 'Digital artwork',
				emoji: '🎨',
				color: '#a855f7',
				category: 'arte',
			},
			{
				id: generateReadableId('tag', 'Naturaleza', 1),
				name: 'Naturaleza',
				description: 'Paisajes y elementos naturales',
				emoji: '🌿',
				color: '#22c55e',
				category: 'tematica',
			},
			{
				id: generateReadableId('tag', 'Retrato', 1),
				name: 'Retrato',
				description: 'Portrait and face photography',
				emoji: '👤',
				color: '#f59e0b',
				category: 'genero',
			},
			{
				id: generateReadableId('tag', 'Cyberpunk', 1),
				name: 'Cyberpunk',
				description: 'Futuristic technology aesthetic',
				emoji: '🤖',
				color: '#ef4444',
				category: 'estilo',
			},
			{
				id: generateReadableId('tag', 'Fantasia', 1),
				name: 'Fantasía',
				description: 'Magical and imaginary worlds',
				emoji: '🧙',
				color: '#6366f1',
				category: 'genero',
			},
		];

		await db.insert(tags).values(sampleTags);

		seedLogger.success(`✅ ${sampleTags.length} tags created`);
	} catch (error) {
		seedLogger.error('❌ Could not create tags:', error);
		throw error;
	}
}
