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
				id: 'tag-1',
				name: 'Fantasy',
				description: 'Elementos fantásticos y mágicos',
				emoji: '🧙',
				color: '#8b5cf6',
				category: 'género',
				isFavorite: true,
			},
			{
				id: 'tag-2',
				name: 'Cyberpunk',
				description: 'Tecnología avanzada y atmósfera urbana',
				emoji: '🌃',
				color: '#06b6d4',
				category: 'género',
				isFavorite: true,
			},
			{
				id: 'tag-3',
				name: 'Magic',
				description: 'Magia, hechizos y poder arcano',
				emoji: '✨',
				color: '#a855f7',
				category: 'temática',
				isFavorite: true,
			},
			{
				id: 'tag-4',
				name: 'Technology',
				description: 'Tecnología avanzada y ciencia ficción',
				emoji: '🔬',
				color: '#3b82f6',
				category: 'temática',
				isFavorite: true,
			},
			{
				id: 'tag-5',
				name: 'Heroes',
				description: 'Protagonistas y personajes heroicos',
				emoji: '🦸',
				color: '#10b981',
				category: 'personaje',
				isFavorite: true,
			},
			{
				id: 'tag-6',
				name: 'Villains',
				description: 'Antagonistas y fuerzas oscuras',
				emoji: '🦹',
				color: '#ef4444',
				category: 'personaje',
				isFavorite: false,
			},
			{
				id: 'tag-7',
				name: 'Adventure',
				description: 'Aventuras épicas y misiones',
				emoji: '🗺️',
				color: '#f59e0b',
				category: 'temática',
				isFavorite: true,
			},
			{
				id: 'tag-8',
				name: 'Mystery',
				description: 'Misterios, secretos y revelaciones',
				emoji: '🔍',
				color: '#64748b',
				category: 'temática',
				isFavorite: false,
			},
		];

		await db.insert(tags).values(sampleTags);

		seedLogger.success(`✅ ${sampleTags.length} etiquetas creadas`);
	} catch (error) {
		seedLogger.error('❌ Error creando etiquetas:', error);
		throw error;
	}
}
