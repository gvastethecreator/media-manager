/**
 * @file Exportaciones para el transformer de Character
 * @module transformers/character
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { CharacterSchema } from '@/types/entities/character/schema';
import type {
    CharacterComplete,
    CharacterCreateInput,
    CharacterSearchOptions,
    CharacterSearchResult,
    CharacterUpdateInput,
    TransformCharacterOptions
} from '@/types/entities/character/types';
import { handleTransformerError } from '@/utils/transformers/errors';
import type { Character, Prisma } from '@prisma/client';
import { deserializeArray, deserializeFilters, deserializeRelationships, deserializeStats, serializeArray, serializeFilters, serializeRelationships, serializeStats } from './serializers';

// Importar funciones del transformador principal

// Importar serializadores

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
 * 🔄 Transforma un objeto de Prisma a CharacterComplete
 * @param input Character de Prisma o datos parciales
 * @param options Opciones de transformación
 * @returns Character completo con campos procesados
 */
export function fromPrismaCharacter<T extends Partial<Character> | unknown>(
	input: T,
	options: TransformCharacterOptions = {}
): CharacterComplete {
	try {
		const {
			validateFields = true,
			deserializeFields = true,
			includeRelations = false,
			includeUI = true,
			includeStats = false,
		} = options;

		// Preparar el objeto base
		const character = input as Character;

		// Procesar campos JSON si es necesario
		const parsedCharacter: CharacterComplete = {
			...character,
			// Deserializar campos JSON si se requiere
			stats: deserializeFields ? deserializeStats(character.stats) : character.stats,
			psychologicalProfile: character.psychologicalProfile || '',
			socialProfile: character.socialProfile || '',
			relationships: deserializeFields ? deserializeRelationships(character.relationships) : character.relationships,
			goals: deserializeFields ? deserializeArray(character.goals) : character.goals,
			fears: deserializeFields ? deserializeArray(character.fears) : character.fears,
			beliefs: deserializeFields ? deserializeArray(character.beliefs) : character.beliefs,
			personality: deserializeFields ? deserializeArray(character.personality) : character.personality,
			skills: deserializeFields ? deserializeArray(character.skills) : character.skills,
			abilities: deserializeFields ? deserializeArray(character.abilities) : character.abilities,
			filters: deserializeFields ? deserializeFilters(character.filters) : character.filters,
			notes: character.notes?.map((note) => ({ id: note.id })) ?? [],
		};

		// --- VALIDACIÓN ZOD DESPUÉS DE DESERIALIZAR ---
		if (validateFields) {
			const result = CharacterSchema.safeParse(parsedCharacter);
			if (!result.success) {
				serverLogger.error('❌ Fallo de validación Zod después de deserializar:', result.error.issues);
				throw new TransformerError(`Validación post-deserialización fallida: ${result.error.message}`);
			}
			// Devolver el objeto validado (aunque parsedCharacter ya tiene la estructura correcta)
			return result.data as CharacterComplete;
		}

		// Retornar el personaje transformado (sin validación Zod si validateFields es false)
		return parsedCharacter;
	} catch (error) {
		serverLogger.error(`Error transformando prisma character: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando prisma character: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un CharacterComplete a formato Prisma para operaciones CRUD
 * @param character Character completo
 * @returns Datos formateados para operaciones Prisma
 */
export function toPrismaCharacter<T extends Partial<CharacterComplete>>(
	character: T
): Prisma.CharacterCreateInput | Prisma.CharacterUpdateInput {
	try {
		// Serializar campos de array/objeto a string JSON para Prisma
		return {
			...character,
			stats: serializeStats(character.stats),
			relationships: serializeRelationships(character.relationships),
			goals: serializeArray(character.goals),
			fears: serializeArray(character.fears),
			beliefs: serializeArray(character.beliefs),
			personality: serializeArray(character.personality),
			skills: serializeArray(character.skills),
			abilities: serializeArray(character.abilities),
			filters: serializeFilters(character.filters),
		};
	} catch (error) {
		serverLogger.error(`Error serializando character para Prisma: ${error}`);
		throw new TransformerError(`Error serializando character para Prisma: ${(error as Error).message}`);
	}
}

/**
 * 🔍 Valida un objeto como Character
 * @param input Objeto a validar
 * @returns El objeto validado
 * @throws TransformerError si la validación falla
 */
export function validateCharacter<T>(input: T): T {
	try {
		const result = CharacterSchema.safeParse(input);
		if (!result.success) {
			throw new TransformerError(`Validación de character fallida: ${result.error.message}`);
		}
		return input;
	} catch (error) {
		serverLogger.error(`Error validando character: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error validando character: ${(error as Error).message}`);
	}
}

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
