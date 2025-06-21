/**
 * @file Transformador principal para la entidad Concept.
 * @module transformers/concept/transformer
 * @description Contiene la lógica para transformar datos de Prisma a tipos canónicos de la aplicación.
 */


import type { CharacterWithStats } from '@/types/entities/character';
import type { ConceptComplete, ConceptWithStats, PrismaConceptWithCounts } from '@/types/entities/concept';
import type { Prisma } from '@prisma/client';
import { fromPrismaCharacter } from '../character/transformer';
import { fromPrismaNote } from '../note/transformer';

// --- TIPO DE PAYLOAD DE PRISMA ---

export const conceptPayload = {
	include: {
		images: true,
		videos: true,
		albums: true,
		collections: true,
		tagEntities: true, // Usar el nombre de la relación en Prisma
		characters: true,
		places: true,
		worldItems: true,
		prompts: true,
		notes: true,
		wildcards: true,
		properties: true,
		groups: true,
		_count: true,
	},
};

export type ConceptFromPrisma = Prisma.ConceptGetPayload<typeof conceptPayload>;

/**
 * 🧠 Transforma un concepto de Prisma a ConceptWithStats
 * @param concept Concepto con conteos de Prisma
 * @returns Concepto con estadísticas pre-calculadas
 */
export function fromPrismaConcept(concept: PrismaConceptWithCounts): ConceptWithStats {
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

	const totalAssociations = totalImages + totalVideos + totalTags + totalGroups +
		totalProperties + totalCollections + totalAlbums + totalPlaces +
		totalWorldItems + totalCharacters + totalPrompts + totalNotes + totalWildcards;

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
 * 🧠 Transforma un concepto de Prisma con relaciones completas a ConceptComplete
 * @param concept Concepto de Prisma con relaciones
 * @returns Concepto completo con relaciones transformadas
 */
export function fromPrismaConceptWithRelations(concept: any): ConceptComplete {
	return {
		...concept,
		// Transformar relaciones usando transformers específicos
		characters:
			concept.characters?.map(fromPrismaCharacter).filter((c): c is CharacterWithStats => c !== null) || [],
		notes: concept.notes?.map(fromPrismaNote).filter((n): n is any => n !== null) || [],
		// ... existing code for other relations ...
	};
}

/**
 * 🔄 Transforma una lista de objetos Concept de Prisma a un array de ConceptComplete.
 * @param concepts - Los objetos Concept obtenidos de Prisma.
 * @returns Un array de objetos ConceptComplete.
 */
export function fromPrismaConcepts(concepts: ConceptFromPrisma[]): ConceptComplete[] {
	return concepts.map(fromPrismaConcept).filter((c): c is ConceptComplete => c !== null);
}
