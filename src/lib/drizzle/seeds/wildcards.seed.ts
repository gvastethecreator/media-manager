import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { wildcards } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra wildcards minimalistas para verificación del sistema
 */
export async function seedWildcards(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎭 Creando wildcards de prueba...');

	try {
		const sampleWildcards = [
			{
				id: 'wildcard-1',
				name: 'Elemento Aleatorio',
				description: 'Comodín para elementos aleatorios',
				emoji: '🎲',
				color: '#ef4444',
				category: 'aleatorio',
				shortcut: null,
				children: '["elemento1", "elemento2", "elemento3"]',
				featuredImage: null,
				isFavorite: true,
				parentId: null,
			},
			{
				id: 'wildcard-2',
				name: 'Estilo Dinámico',
				description: 'Comodín para estilos variables',
				emoji: '🌈',
				color: '#8b5cf6',
				category: 'estilo',
				shortcut: null,
				children: '["realista", "cartoon", "abstracto"]',
				featuredImage: null,
				isFavorite: false,
				parentId: null,
			},
		];

		await db.insert(wildcards).values(sampleWildcards);

		seedLogger.success(`✅ ${sampleWildcards.length} wildcards creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando wildcards:', error);
		throw error;
	}
}
