/**
 * @file Exportaciones para el transformer de Character
 * @module transformers/character
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type {
	CharacterComplete,
	CharacterCreateInput,
	CharacterSearchOptions,
	CharacterSearchResult,
	CharacterUpdateInput,
} from '@/types/entities/character/types';
import { handleTransformerError } from '@/utils/transformers/errors';

// Importar funciones del transformador principal
import {
	transformCharacter,
	transformCharacterToExtended,
	transformCharacterToWithStats,
	transformCharacters,
} from './transformer';

// Importar serializadores
import {
	deserializeArray,
	deserializeFilters,
	deserializeRelationships,
	deserializeStats,
	fromPrismaCharacter,
	serializeArray,
	serializeFilters,
	serializeRelationships,
	serializeStats,
	toPrismaCharacter,
	validateCharacter,
} from './serializers';

// Importar mappers
import {
	filterCharacters,
	mapCharacterSearchOptionsToPrisma,
	mapCharacterToRelatedCharacter,
	mapCreateCharacterDataToPrisma,
	mapUpdateCharacterDataToPrisma,
	paginateCharacters,
	processCharacters,
	sortCharacters,
} from './mappers';

const logger = serverLogger.withContext('CharacterTransformer');

/**
 * 🔍 Busca personajes según los criterios especificados
 */
export async function searchCharacters(options: CharacterSearchOptions): Promise<CharacterSearchResult> {
	try {
		// Mapear opciones de búsqueda a formato Prisma
		const prismaOptions = mapCharacterSearchOptionsToPrisma(options);

		// Realizar búsqueda
		const [items, total] = await Promise.all([
			prisma.character.findMany(prismaOptions),
			prisma.character.count({ where: prismaOptions.where }),
		]);

		// Deserializar resultados
		const characters = items.map((item) =>
			fromPrismaCharacter({
				...item,
				images: [],
				videos: [],
				collections: [],
				albums: [],
				tags: [],
				places: [],
				worldItems: [],
				concepts: [],
				prompts: [],
				notes: [],
				wildcards: [],
				properties: [],
				groups: [],
				relatedCharacters: [],
				relatedTo: [],
				_count: {
					images: 0,
					videos: 0,
					collections: 0,
					albums: 0,
					tags: 0,
					places: 0,
					worldItems: 0,
					concepts: 0,
					prompts: 0,
					notes: 0,
					wildcards: 0,
					properties: 0,
					groups: 0,
					relatedCharacters: 0,
					relatedTo: 0,
				},
			})
		);

		return {
			items: characters,
			total,
			hasMore: total > (options.skip || 0) + items.length,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Obtiene un personaje por su ID
 */
export async function getCharacterById(id: string): Promise<CharacterComplete | null> {
	try {
		const character = await prisma.character.findUnique({
			where: { id },
			include: {
				images: true,
				videos: true,
				collections: true,
				albums: true,
				tags: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				relatedCharacters: true,
				relatedTo: true,
				_count: true,
			},
		});

		if (!character) {
			return null;
		}

		return fromPrismaCharacter(character);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * ✨ Crea un nuevo personaje
 */
export async function createCharacter(data: CharacterCreateInput): Promise<CharacterComplete> {
	try {
		// Validar datos de entrada
		await validateCharacter(data);

		// Serializar datos para Prisma
		const prismaData = toPrismaCharacter(data);

		// Mapear datos a formato Prisma
		const createData = mapCreateCharacterDataToPrisma(data);

		// Crear personaje
		const character = await prisma.character.create({
			data: createData,
			include: {
				images: true,
				videos: true,
				collections: true,
				albums: true,
				tags: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				relatedCharacters: true,
				relatedTo: true,
				_count: true,
			},
		});

		return fromPrismaCharacter(character);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 📝 Actualiza un personaje existente
 */
export async function updateCharacter(id: string, data: CharacterUpdateInput): Promise<CharacterComplete> {
	try {
		// Validar datos de entrada
		await validateCharacter(data);

		// Serializar datos para Prisma
		const prismaData = toPrismaCharacter(data);

		// Mapear datos a formato Prisma
		const updateData = mapUpdateCharacterDataToPrisma(data);

		// Actualizar personaje
		const character = await prisma.character.update({
			where: { id },
			data: updateData,
			include: {
				images: true,
				videos: true,
				collections: true,
				albums: true,
				tags: true,
				places: true,
				worldItems: true,
				concepts: true,
				prompts: true,
				notes: true,
				wildcards: true,
				properties: true,
				groups: true,
				relatedCharacters: true,
				relatedTo: true,
				_count: true,
			},
		});

		return fromPrismaCharacter(character);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🗑️ Elimina un personaje
 */
export async function deleteCharacter(id: string): Promise<void> {
	try {
		await prisma.character.delete({
			where: { id },
		});
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Convierte un personaje a su versión relacionada
 */
export function toRelatedCharacter(character: CharacterComplete) {
	try {
		return mapCharacterToRelatedCharacter(character);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Parsea filtros de personaje
 */
export function parseCharacterFilterOptions(filters: unknown) {
	try {
		return parseCharacterFilters(filters);
	} catch (error) {
		throw handleTransformerError(error);
	}
}

// Objeto de compatibilidad para código anterior
export const CharacterTransformer = {
	searchCharacters,
	getCharacterById,
	createCharacter,
	updateCharacter,
	deleteCharacter,
	toRelatedCharacter,
	parseCharacterFilterOptions,
	// Añadir nuevas funciones al objeto exportado
	transformCharacter,
	transformCharacters,
	transformCharacterToExtended,
	transformCharacterToWithStats,
	// Serializadores
	fromPrismaCharacter,
	toPrismaCharacter,
	validateCharacter,
	deserializeArray,
	deserializeFilters,
	deserializeRelationships,
	deserializeStats,
	serializeArray,
	serializeFilters,
	serializeRelationships,
	serializeStats,
	// Mappers
	filterCharacters,
	mapCharacterSearchOptionsToPrisma,
	mapCharacterToRelatedCharacter,
	mapCreateCharacterDataToPrisma,
	mapUpdateCharacterDataToPrisma,
	paginateCharacters,
	processCharacters,
	sortCharacters,
};

export default CharacterTransformer;
