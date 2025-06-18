/**
 * @file Transformador principal para la entidad Character
 * @module transformers/character/transformer
 * @description Contiene la lógica para convertir un objeto Character de Prisma a nuestros tipos canónicos.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CharacterComplete } from '@/types/entities/character';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma } from '@prisma/client';
import {
    deserializeAbilities,
    deserializeBeliefs,
    deserializeFears,
    deserializeFilters,
    deserializeGoals,
    deserializePersonality,
    deserializeRelationships,
    deserializeSkills,
    deserializeStats,
} from './serializers';

const logger = serverLogger.withContext('CharacterTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
type CharacterFromPrisma = Prisma.CharacterGetPayload<{
	include: {
		images: true;
		videos: true;
		tags: true;
		groups: true;
		properties: true;
		collections: true;
		albums: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		notes: true;
		wildcards: true;
		relatedCharacters: true;
		relatedTo: true;
		_count: true;
	};
}>;

/**
 * 🔄 Transforma un objeto Character de Prisma a nuestro tipo canónico CharacterComplete.
 *
 * @param prismaCharacter - El objeto Character obtenido de Prisma, debe incluir relaciones y conteos.
 * @returns Un objeto CharacterComplete compatible con nuestra aplicación.
 * @throws {TransformerError} Si el objeto de entrada es nulo o inválido.
 */
export function fromPrismaCharacter(prismaCharacter: CharacterFromPrisma | null): CharacterComplete {
	if (!prismaCharacter) {
		throw new TransformerError('El objeto de personaje de Prisma no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = prismaCharacter;

		// Aquí es donde transformamos los datos crudos de Prisma al tipo de la aplicación
		return {
			...baseData,

			// Deserializar todos los campos JSON
			stats: deserializeStats(baseData.stats),
			skills: deserializeSkills(baseData.skills),
			relationships: deserializeRelationships(baseData.relationships),
			goals: deserializeGoals(baseData.goals),
			fears: deserializeFears(baseData.fears),
			beliefs: deserializeBeliefs(baseData.beliefs),
			personality: deserializePersonality(baseData.personality),
			abilities: deserializeAbilities(baseData.abilities),
			filters: deserializeFilters(baseData.filters),

			// Asegurar que los campos opcionales no sean nulos
			inventory: baseData.inventory ?? [],
			spells: baseData.spells ?? [],
			feats: baseData.feats ?? [],
			metadata: baseData.metadata ?? {},

			// Asegurar que las relaciones no sean nulas
			images: baseData.images ?? [],
			videos: baseData.videos ?? [],
			tags: baseData.tags ?? [],
			groups: baseData.groups ?? [],
			properties: baseData.properties ?? [],
			collections: baseData.collections ?? [],
			albums: baseData.albums ?? [],
			places: baseData.places ?? [],
			worldItems: baseData.worldItems ?? [],
			concepts: baseData.concepts ?? [],
			prompts: baseData.prompts ?? [],
			notes: baseData.notes ?? [],
			wildcards: baseData.wildcards ?? [],
			relatedCharacters: baseData.relatedCharacters ?? [],
			relatedTo: baseData.relatedTo ?? [],

			// El conteo se asigna directamente y se asegura de que no sea nulo
			_count: _count ?? {},
		};
	} catch (error) {
		logger.error('Error transformando personaje desde Prisma', {
			error,
			characterId: prismaCharacter.id,
		});
		throw new TransformerError(
			`Error al transformar el personaje: ${(error as Error).message}`
		);
	}
}

/**
 * 🔄 Transforma una lista de personajes de Prisma a una lista de CharacterComplete.
 *
 * @param prismaCharacters - Un array de objetos Character de Prisma.
 * @returns Un array de objetos CharacterComplete.
 */
export function fromPrismaCharacters(
	prismaCharacters: CharacterFromPrisma[]
): CharacterComplete[] {
	return prismaCharacters.map(fromPrismaCharacter);
}
