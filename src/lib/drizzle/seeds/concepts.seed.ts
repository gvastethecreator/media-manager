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
				id: '55555555-5555-4555-a555-555555555551',
				name: 'Iluminación Natural',
				description: 'Técnicas de iluminación usando luz natural',
				emoji: '☀️',
				color: 'var(--dt-warning-500)',
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
				id: '55555555-5555-4555-a555-555555555552',
				name: 'Composición Visual',
				description: 'Principios de composición en artes visuales',
				emoji: '🖼️',
				color: 'var(--dt-primary-500)',
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
			{
				id: '55555555-5555-4555-a555-555555555553',
				name: 'Teoría del Color',
				description: 'Fundamentos de armonía y contraste cromático',
				emoji: '🌈',
				color: 'var(--preset-pink)',
				category: 'diseño',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'técnico',
				complexity: 'intermedio',
				applications: 'Pintura, diseño web, branding',
				examples: 'Colores complementarios, análogos',
				relatedConcepts: 'Composición, iluminación',
				notes: 'Esencial para crear paletas efectivas',
				featuredImage: null,
				parentId: null,
			},
			{
				id: '55555555-5555-4555-a555-555555555554',
				name: 'Perspectiva Atmosférica',
				description: 'Técnica de profundidad mediante desaturación',
				emoji: '🌫️',
				color: 'var(--preset-indigo)',
				category: 'pintura',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'artístico',
				complexity: 'avanzado',
				applications: 'Paisajes, concept art',
				examples: 'Montañas difuminadas, niebla',
				relatedConcepts: 'Profundidad, color',
				notes: 'Crea sensación de distancia',
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
