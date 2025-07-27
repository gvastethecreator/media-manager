/**
 * @file Serializadores y validadores para JsonFile
 * @module transformers/json-file/serializers
 */

import type { JsonFileWithStats } from '../../types/entities/json-file';

/**
 * Valida y serializa datos de entrada para crear un JsonFile
 * @param input - Datos de entrada a validar
 * @returns JsonFile válido
 * @throws Error si los datos no son válidos
 */
export function validateAndSerializeJsonFile(input: unknown): JsonFileWithStats {
	if (!input || typeof input !== 'object') {
		throw new Error('Los datos de entrada deben ser un objeto válido');
	}

	const data = input as Record<string, unknown>;

	// Validaciones básicas
	if (!data.name || typeof data.name !== 'string') {
		throw new Error('El nombre es requerido y debe ser una cadena');
	}

	if (!data.content) {
		throw new Error('El contenido es requerido');
	}

	const content = JSON.stringify(data.content);

	// Crear JsonFile basándose en el schema de Drizzle
	const jsonFile: JsonFileWithStats = {
		id: (data.id as string) || generateId(),
		name: data.name as string,
		path: (data.path as string) || '',
		size: content.length,
		hash: generateHash(content),
		mimeType: 'application/json',
		extension: '.json',
		folderId: (data.folderId as string) || '',
		isFavorite: (data.isFavorite as boolean) || false,
		isArchived: (data.isArchived as boolean) || false,
		content: content,
		schema: (data.schema as string) || null,
		isValid: true,
		validationErrors: null,
		keyCount: calculateKeyCount(data.content),
		depth: calculateNestingDepth(data.content),
		createdAt: new Date(),
		updatedAt: new Date(),
		// Estadísticas calculadas
		stats: {
			size: content.length,
			nestingDepth: calculateNestingDepth(data.content),
			isValid: true,
			keyCount: calculateKeyCount(data.content),
		},
	};

	return jsonFile;
}

/**
 * Calcula la profundidad de anidamiento de un objeto
 */
function calculateNestingDepth(obj: unknown): number {
	if (obj === null || typeof obj !== 'object') {
		return 0;
	}

	let maxDepth = 0;

	if (Array.isArray(obj)) {
		for (const item of obj) {
			const depth = calculateNestingDepth(item);
			maxDepth = Math.max(maxDepth, depth);
		}
	} else {
		for (const value of Object.values(obj as Record<string, unknown>)) {
			const depth = calculateNestingDepth(value);
			maxDepth = Math.max(maxDepth, depth);
		}
	}

	return maxDepth + 1;
}

/**
 * Cuenta el número total de claves en un objeto (recursivamente)
 */
function calculateKeyCount(obj: unknown): number {
	if (obj === null || typeof obj !== 'object') {
		return 0;
	}

	let count = 0;

	if (Array.isArray(obj)) {
		for (const item of obj) {
			count += calculateKeyCount(item);
		}
	} else {
		const objRecord = obj as Record<string, unknown>;
		count += Object.keys(objRecord).length;

		for (const value of Object.values(objRecord)) {
			count += calculateKeyCount(value);
		}
	}

	return count;
}

/**
 * Genera un ID único simple
 */
function generateId(): string {
	return `json_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Genera un hash simple para el contenido
 */
function generateHash(content: string): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash).toString(16);
}
