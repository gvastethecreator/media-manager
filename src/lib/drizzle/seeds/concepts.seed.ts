import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { concepts } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra conceptos minimalistas para verificación del sistema
 */
export async function seedConcepts(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('💡 Creando conceptos de prueba...');

	try {
		const sampleConcepts = [
			{
				id: 'concept-1',
				name: 'Iluminación Natural',
				description: 'Técnicas de iluminación usando luz natural',
				emoji: '☀️',
				color: '#f59e0b',
				category: 'fotografía',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'técnico',
				complexity: 'intermedio',
				applications: 'Fotografía de retrato, paisajes',
				examples: 'Hora dorada, luz de ventana',
				relatedConcepts: 'Composición, color',
				notes: 'Fundamental para fotografía natural',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'concept-2',
				name: 'Composición Visual',
				description: 'Principios de composición en artes visuales',
				emoji: '🖼️',
				color: '#3b82f6',
				category: 'diseño',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'artístico',
				complexity: 'básico',
				applications: 'Fotografía, diseño gráfico',
				examples: 'Regla de tercios, líneas guía',
				relatedConcepts: 'Color, balance',
				notes: 'Base del diseño visual',
				featuredImage: null,
				parentId: null,
			},
		];

		await db.insert(concepts).values(sampleConcepts);

		seedLogger.success(`✅ ${sampleConcepts.length} conceptos creados`);
	} catch (error) {
		seedLogger.error('❌ Error creando conceptos:', error);
		throw error;
	}
}
