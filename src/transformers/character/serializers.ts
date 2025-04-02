/**
 * @file Funciones de serialización para la entidad Character
 * @module transformers/character/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { CharacterSchema } from '@/types/entities/character/schema';
import { TransformerError } from '@/utils/transformers/errors';
import type { Character, Prisma } from '@prisma/client';
import type { CharacterComplete, TransformCharacterOptions } from './types';

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
			includeStats = false
		} = options;

		// Preparar el objeto base
		const character = input as Character;

		// Procesar campos JSON si es necesario
		const parsedCharacter: CharacterComplete = {
			...character,
			// Deserializar campos JSON si se requiere
			stats: deserializeFields
				? deserializeStats(character.stats)
				: character.stats,
			psychologicalProfile: character.psychologicalProfile || '',
			socialProfile: character.socialProfile || '',
			relationships: deserializeFields
				? deserializeRelationships(character.relationships)
				: character.relationships,
			goals: deserializeFields
				? deserializeArray(character.goals)
				: character.goals,
			fears: deserializeFields
				? deserializeArray(character.fears)
				: character.fears,
			beliefs: deserializeFields
				? deserializeArray(character.beliefs)
				: character.beliefs,
			personality: deserializeFields
				? deserializeArray(character.personality)
				: character.personality,
			skills: deserializeFields
				? deserializeArray(character.skills)
				: character.skills,
			abilities: deserializeFields
				? deserializeArray(character.abilities)
				: character.abilities,
			filters: deserializeFields
				? deserializeFilters(character.filters)
				: character.filters,
			notes: character.notes?.map(note => ({ id: note.id })) ?? [],
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
			filters: serializeFilters(character.filters)
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
 * 🔄 Deserializa un string JSON de estadísticas a objeto
 * @param stats String JSON o objeto de estadísticas
 * @returns Objeto de estadísticas
 */
export function deserializeStats(stats: string | Record<string, any> | undefined): Record<string, any> {
	if (typeof stats === 'string') {
		try {
			if (stats === 'empty_object' || stats === '') {
				return {};
			}
			return JSON.parse(stats);
		} catch (error) {
			serverLogger.warn(`Error deserializando stats, usando objeto vacío: ${error}`);
			return {};
		}
	}
	return stats || {};
}

/**
 * 🔄 Serializa un objeto de estadísticas a string JSON
 * @param stats Objeto de estadísticas o string JSON
 * @returns String JSON de estadísticas
 */
export function serializeStats(stats: Record<string, any> | string | undefined): string {
	if (typeof stats === 'string') {
		return stats;
	}
	if (!stats || Object.keys(stats).length === 0) {
		return 'empty_object';
	}
	try {
		return JSON.stringify(stats);
	} catch (error) {
		serverLogger.warn(`Error serializando stats, usando objeto vacío: ${error}`);
		return 'empty_object';
	}
}

/**
 * 🔄 Deserializa un string JSON de relaciones a array
 * @param relationships String JSON o array de relaciones
 * @returns Array de relaciones
 */
export function deserializeRelationships(relationships: string | any[] | undefined): any[] {
	if (typeof relationships === 'string') {
		try {
			if (relationships === 'empty_array' || relationships === '') {
				return [];
			}
			return JSON.parse(relationships);
		} catch (error) {
			serverLogger.warn(`Error deserializando relationships, usando array vacío: ${error}`);
			return [];
		}
	}
	return relationships || [];
}

/**
 * 🔄 Serializa un array de relaciones a string JSON
 * @param relationships Array de relaciones o string JSON
 * @returns String JSON de relaciones
 */
export function serializeRelationships(relationships: any[] | string | undefined): string {
	if (typeof relationships === 'string') {
		return relationships;
	}
	if (!relationships || relationships.length === 0) {
		return 'empty_array';
	}
	try {
		return JSON.stringify(relationships);
	} catch (error) {
		serverLogger.warn(`Error serializando relationships, usando array vacío: ${error}`);
		return 'empty_array';
	}
}

/**
 * 🔄 Deserializa un string JSON de array genérico
 * @param array String JSON o array genérico
 * @returns Array deserializado
 */
export function deserializeArray(array: string | any[] | undefined): any[] {
	if (typeof array === 'string') {
		try {
			if (array === 'empty_array' || array === '') {
				return [];
			}
			return JSON.parse(array);
		} catch (error) {
			serverLogger.warn(`Error deserializando array, usando array vacío: ${error}`);
			return [];
		}
	}
	return array || [];
}

/**
 * 🔄 Serializa un array genérico a string JSON
 * @param array Array o string JSON
 * @returns String JSON del array
 */
export function serializeArray(array: any[] | string | undefined): string {
	if (typeof array === 'string') {
		return array;
	}
	if (!array || array.length === 0) {
		return 'empty_array';
	}
	try {
		return JSON.stringify(array);
	} catch (error) {
		serverLogger.warn(`Error serializando array, usando array vacío: ${error}`);
		return 'empty_array';
	}
}

/**
 * 🔄 Deserializa un string JSON de filtros a objeto
 * @param filters String JSON o objeto de filtros
 * @returns Objeto de filtros
 */
export function deserializeFilters(filters: string | Record<string, any> | undefined): Record<string, any> {
	if (typeof filters === 'string') {
		try {
			if (filters === 'empty_array' || filters === '') {
				return {};
			}
			return JSON.parse(filters);
		} catch (error) {
			serverLogger.warn(`Error deserializando filters, usando objeto vacío: ${error}`);
			return {};
		}
	}
	return filters || {};
}

/**
 * 🔄 Serializa un objeto de filtros a string JSON
 * @param filters Objeto de filtros o string JSON
 * @returns String JSON de filtros
 */
export function serializeFilters(filters: Record<string, any> | string | undefined): string {
	if (typeof filters === 'string') {
		return filters;
	}
	if (!filters || Object.keys(filters).length === 0) {
		return 'empty_array';
	}
	try {
		return JSON.stringify(filters);
	} catch (error) {
		serverLogger.warn(`Error serializando filters, usando objeto vacío: ${error}`);
		return 'empty_array';
	}
}
