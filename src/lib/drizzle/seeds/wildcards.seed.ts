import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { wildcards } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra wildcards con IDs legibles
 * Formato: wild-nombre-01, wild-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedWildcards(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('🎭 Creando wildcards de prueba...');

	try {
		const sampleWildcards = [
			{
				id: generateReadableId('wildcard', 'Elemento Aleatorio', 1),
				name: 'Elemento Aleatorio',
				description: 'Wildcard for random elements',
				emoji: '🎲',
				color: '#ef4444',
				category: 'aleatorio',
				children: '["elemento1", "elemento2", "elemento3"]',
				parentId: null,
			},
			{
				id: generateReadableId('wildcard', 'Estilo Dinamico', 1),
				name: 'Estilo Dinámico',
				description: 'Wildcard for variable styles',
				emoji: '🌈',
				color: '#a855f7',
				category: 'estilo',
				children: '["realista", "cartoon", "abstracto"]',
				parentId: null,
			},
			{
				id: generateReadableId('wildcard', 'Colores Vibrantes', 1),
				name: 'Colores Vibrantes',
				description: 'Paleta de colores intensos',
				emoji: '🎨',
				color: '#f59e0b',
				category: 'color',
				children: '["rojo intenso", "azul eléctrico", "verde neón", "amarillo brillante"]',
				parentId: null,
			},
			{
				id: generateReadableId('wildcard', 'Ambientes', 1),
				name: 'Ambientes',
				description: 'Diferentes ambientaciones',
				emoji: '🌍',
				color: '#22c55e',
				category: 'ambiente',
				children: '["bosque mágico", "ciudad futurista", "desierto místico", "océano profundo"]',
				parentId: null,
			},
		];

		await db.insert(wildcards).values(sampleWildcards);

		seedLogger.success(`✅ ${sampleWildcards.length} wildcards creados`);
	} catch (error) {
		seedLogger.error('❌ Could not create wildcards:', error);
		throw error;
	}
}
