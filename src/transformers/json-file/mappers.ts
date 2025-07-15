/**
 * @file Mappers para la entidad JsonFile
 * @module transformers/json-file/mappers
 
 */

import type { JsonFileBase, JsonFileCreateInput, JsonFileUpdateInput } from '@/types/entities/json-file';

/**
 * Mapea datos de creación a formato Drizzle
 */
export function mapCreateJsonFileDataToDrizzle(data: JsonFileCreateInput) {
	return {
		id: crypto.randomUUID(),
		name: data.name,
		path: data.path,
		content: data.content,
		schema: data.schema || null,
		isValid: data.isValid ?? true,
		size: data.size || 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

/**
 * Mapea datos de actualización a formato Drizzle
 */
export function mapUpdateJsonFileDataToDrizzle(data: JsonFileUpdateInput) {
	return {
		...data,
		updatedAt: new Date(),
	};
}

/**
 * Convierte JsonFile a formato Drizzle
 */
export function toDrizzleJsonFile(jsonFile: JsonFileBase) {
	return {
		id: jsonFile.id,
		name: jsonFile.name,
		path: jsonFile.path,
		content: jsonFile.content,
		schema: jsonFile.schema,
		isValid: jsonFile.isValid,
		size: jsonFile.size,
		createdAt: jsonFile.createdAt,
		updatedAt: jsonFile.updatedAt,
	};
}
