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
				id: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb01',
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
				id: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb02',
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
			{
				id: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03',
				name: 'Colores Vibrantes',
				description: 'Paleta de colores intensos',
				emoji: '🎨',
				color: '#f59e0b',
				category: 'color',
				shortcut: null,
				children: '["rojo intenso", "azul eléctrico", "verde neón", "amarillo brillante"]',
				featuredImage: null,
				isFavorite: true,
				parentId: null,
			},
			{
				id: 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb04',
				name: 'Ambientes',
				description: 'Diferentes ambientaciones',
				emoji: '🌍',
				color: '#10b981',
				category: 'ambiente',
				shortcut: null,
				children: '["bosque mágico", "ciudad futurista", "desierto místico", "océano profundo"]',
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
