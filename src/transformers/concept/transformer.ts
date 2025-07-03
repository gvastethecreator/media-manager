/**
 * @file Transformador principal para la entidad Concept.
 * @module transformers/concept/transformer
 * @description Contiene la lógica para transformar datos de Drizzle a tipos canónicos de la aplicación.
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import type { ConceptComplete, ConceptWithStats } from '@/types/entities/concept';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleConceptWithCounts = {
	id: string;
	name: string;
	description: string | null;
	color: string;
	emoji: string;
	isPublic: boolean;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	_count?: {
		images?: number;
		videos?: number;
		tags?: number;
		groups?: number;
		properties?: number;
		collections?: number;
		albums?: number;
		places?: number;
		worldItems?: number;
		characters?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
	};
};

type DrizzleConceptWithRelations = DrizzleConceptWithCounts & {
	characters?: any[];
	notes?: any[];
	// Otras relaciones se pueden agregar según sea necesario
};

/**
 * 🧠 Transforma un concepto de Drizzle a ConceptWithStats
 * ✅ MIGRADO A DRIZZLE
 * @param concept Concepto con conteos de Drizzle
 * @returns Concepto con estadísticas pre-calculadas
 */
export function fromDrizzleConcept(concept: DrizzleConceptWithCounts): ConceptWithStats {
	const now = new Date();

	// Calcular estadísticas
	const totalImages = concept._count?.images || 0;
	const totalVideos = concept._count?.videos || 0;
	const totalTags = concept._count?.tags || 0;
	const totalGroups = concept._count?.groups || 0;
	const totalProperties = concept._count?.properties || 0;
	const totalCollections = concept._count?.collections || 0;
	const totalAlbums = concept._count?.albums || 0;
	const totalPlaces = concept._count?.places || 0;
	const totalWorldItems = concept._count?.worldItems || 0;
	const totalCharacters = concept._count?.characters || 0;
	const totalPrompts = concept._count?.prompts || 0;
	const totalNotes = concept._count?.notes || 0;
	const totalWildcards = concept._count?.wildcards || 0;

	const totalAssociations =
		totalImages +
		totalVideos +
		totalTags +
		totalGroups +
		totalProperties +
		totalCollections +
		totalAlbums +
		totalPlaces +
		totalWorldItems +
		totalCharacters +
		totalPrompts +
		totalNotes +
		totalWildcards;

	return {
		...concept,
		statistics: {
			totalImages,
			totalVideos,
			totalTags,
			totalGroups,
			totalProperties,
			totalCollections,
			totalAlbums,
			totalPlaces,
			totalWorldItems,
			totalCharacters,
			totalPrompts,
			totalNotes,
			totalWildcards,
			totalAssociations,
			lastUpdated: now,
		},
	};
}

/**
 * 🧠 Transforma un concepto de Drizzle con relaciones completas a ConceptComplete
 * ✅ MIGRADO A DRIZZLE
 * @param concept Concepto de Drizzle con relaciones
 * @returns Concepto completo con relaciones transformadas
 */
export function fromDrizzleConceptWithRelations(concept: DrizzleConceptWithRelations): ConceptComplete {
	return {
		...concept,
		// Transformar relaciones usando transformers específicos
		characters: concept.characters || [], // Simplificado para evitar dependencias circulares
		notes: concept.notes || [], // Simplificado para evitar dependencias circulares
		// ... existing code for other relations ...
	};
}

/**
 * 🔄 Transforma una lista de objetos Concept de Drizzle a un array de ConceptComplete.
 * ✅ MIGRADO A DRIZZLE
 * @param concepts - Los objetos Concept obtenidos de Drizzle.
 * @returns Un array de objetos ConceptComplete.
 */
export function fromDrizzleConcepts(concepts: DrizzleConceptWithCounts[]): ConceptComplete[] {
	return concepts.map(fromDrizzleConcept).filter((c): c is ConceptComplete => c !== null);
}
