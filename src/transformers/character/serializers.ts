/**
 * @file Funciones de serialización para la entidad Character
 * @module transformers/character/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';

/**
 * 🔍 Valida un objeto como Character
 * @param input Objeto a validar
 * @returns El objeto validado
 * @throws TransformerError si la validación falla
 * @deprecated Usar validateCharacter de ./server.ts para evitar duplicación
 */
// export function validateCharacter<T>(input: T): T {
// 	try {
// 		const result = CharacterSchema.safeParse(input);
// 		if (!result.success) {
// 			throw new TransformerError(`Validación de character fallida: ${result.error.message}`);
// 		}
// 		return input;
// 	} catch (error) {
// 		serverLogger.error(`Error validando character: ${error}`);
// 		if (error instanceof TransformerError) {
// 			throw error;
// 		}
// 		throw new TransformerError(`Error validando character: ${(error as Error).message}`);
// 	}
// }

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
			// Eliminado soporte a 'empty_array', solo se acepta '[]' como array vacío
			if (relationships === '' || relationships === '[]') {
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
		return '[]';
	}
	try {
		return JSON.stringify(relationships);
	} catch (error) {
		serverLogger.warn(`Error serializando relationships, usando array vacío: ${error}`);
		return '[]';
	}
}

/**
 * 🔄 Deserializa un string JSON de array a array
 * @param array String JSON o array
 * @returns Array de elementos
 */
export function deserializeArray(array: string | any[] | undefined): any[] {
	if (typeof array === 'string') {
		try {
			// Eliminado soporte a 'empty_array', solo se acepta '[]' como array vacío
			if (array === '' || array === '[]') {
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
 * 🔄 Serializa un array a string JSON
 * @param array Array o string JSON
 * @returns String JSON de array
 */
export function serializeArray(array: any[] | string | undefined): string {
	if (typeof array === 'string') {
		return array;
	}
	if (!array || array.length === 0) {
		return '[]';
	}
	try {
		return JSON.stringify(array);
	} catch (error) {
		serverLogger.warn(`Error serializando array, usando array vacío: ${error}`);
		return '[]';
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
			if (filters === 'empty_object' || filters === '') {
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
		return 'empty_object';
	}
	try {
		return JSON.stringify(filters);
	} catch (error) {
		serverLogger.warn(`Error serializando filters, usando objeto vacío: ${error}`);
		return 'empty_object';
	}
}
