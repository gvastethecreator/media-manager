/**
 * @file Transformador principal para la entidad Character
 * @module transformers/character/transformer
 * @description Contiene la lógica para convertir un objeto Character de Prisma a nuestros tipos canónicos.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CharacterComplete } from '@/types/entities/character';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('CharacterTransformer');

// Define el tipo de payload de Prisma que esperamos, con todas las relaciones y conteos.
interface CharacterFromPrisma {
	id: string;
	name: string;
	description: string | null;
	emoji: string;
	color: string;
	shortcut: string | null;
	category: string | null;
	level: number;
	class: string;
	race: string;
	type: string | null;
	alignment: string;
	backstory: string;
	// Campos JSON serializados como strings
	stats: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
	skills: string;
	abilities: string;
	// Configuración
	sortBy: string;
	filters: string;
	// Propiedades de visualización
	featuredImage: string | null;
	isFavorite: boolean;
	// Timestamps
	createdAt: Date;
	updatedAt: Date;
	// Relaciones
	images: any[];
	videos: any[];
	tags: any[];
	groups: any[];
	properties: any[];
	collections: any[];
	albums: any[];
	places: any[];
	worldItems: any[];
	concepts: any[];
	prompts: any[];
	notes: any[];
	wildcards: any[];
	relatedCharacters: any[];
	relatedTo: any[];
	_count: {
		images?: number;
		videos?: number;
		tags?: number;
		groups?: number;
		properties?: number;
		collections?: number;
		albums?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		relatedCharacters?: number;
		relatedTo?: number;
	};
}

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

		// Transformamos los datos crudos de Prisma al tipo de la aplicación
		return {
			...baseData,

			// Los campos JSON ya vienen como strings desde Prisma, los mantenemos así
			// Si necesitamos deserializarlos, lo haremos en capas superiores
			stats: baseData.stats || '{}',
			skills: baseData.skills || '[]',
			relationships: baseData.relationships || '[]',
			goals: baseData.goals || '[]',
			fears: baseData.fears || '[]',
			beliefs: baseData.beliefs || '[]',
			personality: baseData.personality || '[]',
			abilities: baseData.abilities || '[]',
			filters: baseData.filters || '[]',
			psychologicalProfile: baseData.psychologicalProfile || '',
			socialProfile: baseData.socialProfile || '',

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

			// Agregar conteos
			_count: _count ?? {},
		};
	} catch (error) {
		logger.error('Error al transformar personaje de Prisma', { error, prismaCharacter });
		throw new TransformerError('Error al transformar personaje de Prisma.');
	}
}

/**
 * 🔄 Transforma una lista de personajes de Prisma a una lista de CharacterComplete.
 *
 * @param prismaCharacters - Un array de objetos Character de Prisma.
 * @returns Un array de objetos CharacterComplete.
 */
export function fromPrismaCharacters(prismaCharacters: CharacterFromPrisma[]): CharacterComplete[] {
	return prismaCharacters.map(fromPrismaCharacter);
}
