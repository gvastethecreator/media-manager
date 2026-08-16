import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { generateReadableId } from '@/lib/utils/id-generator';
import { concepts } from '../schema';
import { seedLogger } from './index';

/**
 * Siembra conceptos con IDs legibles
 * Formato: cpt-nombre-01, cpt-nombre-02, etc.
 *
 * NOTA: Los colores hex en este archivo son datos de prueba para inicializar la DB.
 * No se usan directamente en la UI de producción - la UI usa tokens CSS
 * definidos en src/styles/tokens.css y src/styles/design-tokens.css.
 */
export async function seedConcepts(db: LibSQLDatabase<Record<string, never>>) {
	seedLogger.info('💡 Creando conceptos de prueba...');

	try {
		const sampleConcepts = [
			{
				id: generateReadableId('concept', 'Iluminacion Natural', 1),
				name: 'Iluminación Natural',
				description: 'Lighting techniques using natural light',
				emoji: '☀️',
				color: '#f59e0b',
				category: 'fotografía',
				type: 'técnico',
				complexity: 'intermedio',
				applications: 'Fotografía de retrato, paisajes',
				examples: 'Hora dorada, luz de ventana',
				relatedConcepts: 'Composición, color',
				notes: 'Fundamental para fotografía natural',
				parentId: null,
			},
			{
				id: generateReadableId('concept', 'Composicion Visual', 1),
				name: 'Composición Visual',
				description: 'Composition principles in visual arts',
				emoji: '🖼️',
				color: '#3b82f6',
				category: 'diseño',
				type: 'artístico',
				complexity: 'básico',
				applications: 'Fotografía, diseño gráfico',
				examples: 'Regla de tercios, líneas guía',
				relatedConcepts: 'Color, balance',
				notes: 'Base del diseño visual',
				parentId: null,
			},
			{
				id: generateReadableId('concept', 'Teoria del Color', 1),
				name: 'Teoría del Color',
				description: 'Fundamentals of color harmony and contrast',
				emoji: '🌈',
				color: '#ec4899',
				category: 'diseño',
				type: 'técnico',
				complexity: 'intermedio',
				applications: 'Pintura, diseño web, branding',
				examples: 'Colores complementarios, análogos',
				relatedConcepts: 'Composición, iluminación',
				notes: 'Esencial para crear paletas efectivas',
				parentId: null,
			},
			{
				id: generateReadableId('concept', 'Perspectiva Atmosferica', 1),
				name: 'Perspectiva Atmosférica',
				description: 'Depth technique using desaturation',
				emoji: '🌫️',
				color: '#6366f1',
				category: 'pintura',
				type: 'artístico',
				complexity: 'avanzado',
				applications: 'Paisajes, concept art',
				examples: 'Montañas difuminadas, niebla',
				relatedConcepts: 'Profundidad, color',
				notes: 'Crea sensación de distancia',
				parentId: null,
			},
		];

		await db.insert(concepts).values(sampleConcepts);

		seedLogger.success(`✅ ${sampleConcepts.length} conceptos creados`);
	} catch (error) {
		seedLogger.error('❌ Could not create concepts:', error);
		throw error;
	}
}
