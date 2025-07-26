/**
 * @file Funciones de serialización para la entidad Character.
 * @module transformers/character/serializers
 * @description Contiene funciones para manejar la serialización de campos complejos (JSON) de la entidad Character.
 */

import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';

const logger = serverLogger.withContext('CharacterSerializers');

/**
 * 🔄 Deserializa un string JSON a un objeto.
 * @param jsonString El string a deserializar.
 * @param fieldName El nombre del campo para logging de errores.
 * @returns El objeto deserializado.
 * @throws {TransformerError} si el JSON es inválido.
 */
function deserializeObject(jsonString: string | null | undefined, fieldName: string): object {
	if (!jsonString || jsonString === '{}') {
		return {};
	}
	try {
		const parsed = JSON.parse(jsonString);
		return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
	} catch (error) {
		logger.error(`Error deserializando el campo '${fieldName}'`, { error, jsonString });
		throw new TransformerError(`El formato del campo '${fieldName}' es inválido.`);
	}
}

/**
 * 🔄 Serializa un objeto a un string JSON.
 * @param data El objeto a serializar.
 * @param fieldName El nombre del campo para logging de errores.
 * @returns El string JSON.
 * @throws {TransformerError} si la serialización falla.
 */
function serializeObject(data: object | null | undefined, fieldName: string): string {
	if (!data || Object.keys(data).length === 0) {
		return '{}';
	}
	try {
		return JSON.stringify(data);
	} catch (error) {
		logger.error(`Error serializando el campo '${fieldName}'`, { error, data });
		throw new TransformerError(`No se pudo serializar el campo '${fieldName}'.`);
	}
}

/**
 * 🔄 Deserializa un string JSON a un array.
 * @param jsonString El string a deserializar.
 * @param fieldName El nombre del campo para logging de errores.
 * @returns El array deserializado.
 * @throws {TransformerError} si el JSON es inválido.
 */
function deserializeArray(jsonString: string | null | undefined, fieldName: string): unknown[] {
	if (!jsonString || jsonString === '[]') {
		return [];
	}
	try {
		const parsed = JSON.parse(jsonString);
		return Array.isArray(parsed) ? parsed : [];
	} catch (error) {
		logger.error(`Error deserializando el campo '${fieldName}'`, { error, jsonString });
		throw new TransformerError(`El formato del campo '${fieldName}' es inválido.`);
	}
}

/**
 * 🔄 Serializa un array a un string JSON.
 * @param data El array a serializar.
 * @param fieldName El nombre del campo para logging de errores.
 * @returns El string JSON.
 * @throws {TransformerError} si la serialización falla.
 */
function serializeArray(data: unknown[] | null | undefined, fieldName: string): string {
	if (!data || data.length === 0) {
		return '[]';
	}
	try {
		return JSON.stringify(data);
	} catch (error) {
		logger.error(`Error serializando el campo '${fieldName}'`, { error, data });
		throw new TransformerError(`No se pudo serializar el campo '${fieldName}'.`);
	}
}

// --- Exportaciones específicas para cada campo ---

// Stats
export const deserializeStats = (json: string | null | undefined) => deserializeObject(json, 'stats');
export const serializeStats = (data: object | null | undefined) => serializeObject(data, 'stats');

// Relationships
export const deserializeRelationships = (json: string | null | undefined) => deserializeArray(json, 'relationships');
export const serializeRelationships = (data: unknown[] | null | undefined) => serializeArray(data, 'relationships');

// Goals
export const deserializeGoals = (json: string | null | undefined) => deserializeArray(json, 'goals');
export const serializeGoals = (data: unknown[] | null | undefined) => serializeArray(data, 'goals');

// Fears
export const deserializeFears = (json: string | null | undefined) => deserializeArray(json, 'fears');
export const serializeFears = (data: unknown[] | null | undefined) => serializeArray(data, 'fears');

// Beliefs
export const deserializeBeliefs = (json: string | null | undefined) => deserializeArray(json, 'beliefs');
export const serializeBeliefs = (data: unknown[] | null | undefined) => serializeArray(data, 'beliefs');

// Personality Traits
export const deserializePersonality = (json: string | null | undefined) => deserializeArray(json, 'personality');
export const serializePersonality = (data: unknown[] | null | undefined) => serializeArray(data, 'personality');

// Skills
export const deserializeSkills = (json: string | null | undefined) => deserializeObject(json, 'skills');
export const serializeSkills = (data: object | null | undefined) => serializeObject(data, 'skills');

// Abilities
export const deserializeAbilities = (json: string | null | undefined) => deserializeArray(json, 'abilities');
export const serializeAbilities = (data: unknown[] | null | undefined) => serializeArray(data, 'abilities');

// Filters
export const deserializeFilters = (json: string | null | undefined) => deserializeObject(json, 'filters');
export const serializeFilters = (data: object | null | undefined) => serializeObject(data, 'filters');
