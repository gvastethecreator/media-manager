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
				name: '__style__',
				description: 'Estilos visuales para generación de imágenes',
				emoji: '🎨',
				color: '#8b5cf6',
				category: 'visual',
				shortcut: null,
				children: '["realista", "cartoon", "anime", "pintura digital", "concept art", "fotorrealista"]',
				featuredImage: null,
				isFavorite: true,
				parentId: null,
			},
			{
				id: 'wildcard-2',
				name: '__lighting__',
				description: 'Tipos de iluminación para escenas',
				emoji: '💡',
				color: '#f59e0b',
				category: 'visual',
				shortcut: null,
				children: '["dramática", "suave", "neón", "mágica", "natural", "ciberpunk", "hora dorada"]',
				featuredImage: null,
				isFavorite: true,
				parentId: null,
			},
			{
				id: 'wildcard-3',
				name: '__mood__',
				description: 'Atmósferas y estados de ánimo',
				emoji: '🎭',
				color: '#06b6d4',
				category: 'emotional',
				shortcut: null,
				children: '["épico", "misterioso", "esperanzador", "sombrío", "dinámico", "sereno", "intenso"]',
				featuredImage: null,
				isFavorite: true,
				parentId: null,
			},
			{
				id: 'wildcard-4',
				name: '__quality__',
				description: 'Niveles de calidad de renderizado',
				emoji: '⭐',
				color: '#10b981',
				category: 'technical',
				shortcut: null,
				children: '["ultra detallado", "alta calidad", "calidad media", "4K", "8K", "masterpiece"]',
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
