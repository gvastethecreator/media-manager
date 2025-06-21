/**
 * @file Funciones de serialización para la entidad Prompt
 * @module transformers/prompt/serializers
 * @description Proporciona funciones para serializar y deserializar campos complejos de la entidad Prompt,
 * como 'parameters' y 'tags', para su almacenamiento en la base de datos como strings JSON.
 */

import { serverLogger } from '@/lib/logger/server';
import type { PromptParameter } from '@/types/entities/prompt';

const logger = serverLogger.withContext('PromptSerializers');

/**
 * Serializa un array de PromptParameter a un string JSON.
 * @param parameters - El array de parámetros a serializar.
 * @returns Un string JSON o un array vacío en formato string si hay un error.
 */
export function serializeParameters(parameters: PromptParameter[] | undefined | null): string {
    if (!parameters) {
        return '[]';
    }
    try {
        return JSON.stringify(parameters);
    } catch (error) {
        logger.error('Error serializing parameters', { error, parameters });
        return '[]';
    }
}

/**
 * Deserializa un string JSON a un array de PromptParameter.
 * @param jsonString - El string JSON a deserializar.
 * @returns Un array de PromptParameter o un array vacío si el string es inválido o hay un error.
 */
export function deserializeParameters(jsonString: string | undefined | null): PromptParameter[] {
    if (!jsonString) {
        return [];
    }
    try {
        const parsed = JSON.parse(jsonString);
        // Validar que el resultado es un array para seguridad
        if (Array.isArray(parsed)) {
            return parsed;
        }
		logger.warn('Deserialized parameters is not an array', { jsonString });
        return [];
    } catch (error) {
        logger.error('Error deserializing parameters', { error, jsonString });
        return [];
    }
}

/**
 * Serializa un array de strings (tags) a un string JSON.
 * @param tags - El array de tags a serializar.
 * @returns Un string JSON o '[]' en caso de error.
 */
export function serializeTags(tags: string[] | undefined | null): string {
    if (!tags) {
        return '[]';
    }
    try {
        return JSON.stringify(tags);
    } catch (error)        {
        logger.error('Error serializing tags', { error, tags });
        return '[]';
    }
}

/**
 * Deserializa un string JSON a un array de strings (tags).
 * @param jsonString - El string JSON a deserializar.
 * @returns Un array de strings o un array vacío si hay errores.
 */
export function deserializeTags(jsonString: string | undefined | null): string[] {
    if (!jsonString) {
        return [];
    }
    try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed)) {
            // Asegurarse que todos los elementos son strings
            return parsed.map(String);
        }
		logger.warn('Deserialized tags is not an array', { jsonString });
        return [];
    } catch (error) {
        logger.error('Error deserializing tags', { error, jsonString });
        return [];
    }
}