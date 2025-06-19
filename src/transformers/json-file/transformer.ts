// Funciones principales de transformación para JsonFile
import type { JsonFileComplete } from '@/types/entities/json-file';

export function normalizeJsonFile(json: JsonFileComplete): JsonFileComplete {
	// Aquí se pueden agregar normalizaciones adicionales
	return json;
}

export function transformJsonFile(data: any): JsonFileComplete {
	return {
		id: data.id,
		name: data.name,
		filePath: data.filePath,
		content: data.content,
		createdAt: new Date(data.createdAt),
		updatedAt: new Date(data.updatedAt),
	};
}
