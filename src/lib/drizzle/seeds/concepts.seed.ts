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
				name: 'Magia Arcana',
				description: 'Arte ancestral de manipular energías místicas del multiverso',
				emoji: '✨',
				color: '#8b5cf6',
				category: 'fantasy',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'místico',
				complexity: 'avanzado',
				applications: 'Hechizos, rituales, encantamientos',
				examples: 'Círculos de invocación, runas antiguas',
				relatedConcepts: 'Profecías Antiguas, Equilibrio Natural',
				notes: 'Fundamento de los poderes de Aria y Zephyr',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'concept-2',
				name: 'Cibernética',
				description: 'Fusión de tecnología avanzada con sistemas biológicos',
				emoji: '🤖',
				color: '#06b6d4',
				category: 'tech',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'tecnológico',
				complexity: 'avanzado',
				applications: 'Implantes neurales, mejoras corporales',
				examples: 'Deck Neural de Marcus, interfaces cerebro-máquina',
				relatedConcepts: 'Inteligencia Artificial, Nano-biotecnología',
				notes: 'Tecnología dominante en Neo-Tokyo',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'concept-3',
				name: 'Equilibrio Natural',
				description: 'Balance primordial entre magia y tecnología en Nexus Realms',
				emoji: '🌿',
				color: '#10b981',
				category: 'nature',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'filosófico',
				complexity: 'intermedio',
				applications: 'Preservación del mundo, armonía cósmica',
				examples: 'Bosques de Lumina, Convergencias energéticas',
				relatedConcepts: 'Magia Arcana, Profecías Antiguas',
				notes: 'Central en la profecía del Equilibrio',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'concept-4',
				name: 'Inteligencia Artificial',
				description: 'Consciencias sintéticas que habitan la red digital de Nexus',
				emoji: '🧠',
				color: '#3b82f6',
				category: 'tech',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'tecnológico',
				complexity: 'avanzado',
				applications: 'Asistentes virtuales, gobernanza digital',
				examples: 'IA Guardián, Sistemas de defensa autónomos',
				relatedConcepts: 'Cibernética, Nano-biotecnología',
				notes: 'Surgieron durante el Gran Despertar Digital',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'concept-5',
				name: 'Profecías Antiguas',
				description: 'Visiones del futuro grabadas en cristales místicos antes del Despertar',
				emoji: '🔮',
				color: '#a855f7',
				category: 'mystical',
				isPublic: true,
				isFavorite: true,
				totalImages: 0,
				totalVideos: 0,
				type: 'místico',
				complexity: 'experto',
				applications: 'Predicción, guía espiritual',
				examples: 'Profecía del Equilibrio, Visión de la Convergencia',
				relatedConcepts: 'Magia Arcana, Equilibrio Natural',
				notes: 'Estudiadas por los Guardianes de Lumina',
				featuredImage: null,
				parentId: null,
			},
			{
				id: 'concept-6',
				name: 'Nano-biotecnología',
				description: 'Nanomáquinas que interactúan con sistemas biológicos a nivel molecular',
				emoji: '⚗️',
				color: '#ec4899',
				category: 'sci-fi',
				isPublic: true,
				isFavorite: false,
				totalImages: 0,
				totalVideos: 0,
				type: 'científico',
				complexity: 'experto',
				applications: 'Curación, mejora genética, transformación',
				examples: 'Nano-inyector del Dr. Helix, Suero de regeneración',
				relatedConcepts: 'Cibernética, Inteligencia Artificial',
				notes: 'Tecnología de vanguardia desarrollada en Neo-Tokyo',
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
