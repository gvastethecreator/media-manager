/**
 * @file Funciones de serialización y utilidades para la entidad Folder
 * @module transformers/folder/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { FolderBase } from '@/types/entities/folder';

const logger = serverLogger.withContext('FolderSerializers');

/**
 * 📂 Normaliza un path de carpeta.
 * Reemplaza backslashes, asegura que empieza con un slash, y elimina duplicados y slashes finales.
 *
 * @param path Path a normalizar.
 * @returns Path normalizado.
 */
export function normalizeFolderPath(path: string): string {
	if (!path) return '/';
	try {
		let normalizedPath = path.trim().replace(/\\/g, '/');

		if (!normalizedPath.startsWith('/')) {
			normalizedPath = `/${normalizedPath}`;
		}

		normalizedPath = normalizedPath.replace(/\/\/+/g, '/');

		if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
			normalizedPath = normalizedPath.slice(0, -1);
		}

		return normalizedPath;
	} catch (error) {
		logger.error('Error normalizando path de folder:', { path, error });
		return path;
	}
}

/**
 * 🔄 Convierte un objeto Folder a una versión simplificada para ser usada en relaciones.
 *
 * @param folder El objeto FolderBase a simplificar.
 * @returns Un objeto con solo los campos esenciales para mostrar una relación.
 */
export function toRelatedFolder(folder: FolderBase): {
	id: string;
	name: string;
	path: string;
	emoji: string | null;
	color: string | null;
} {
	if (!folder) {
		// Retornar un objeto nulo o por defecto podría ser una opción
		throw new Error('Se requiere una carpeta para la transformación a "related folder".');
	}

	return {
		id: folder.id,
		name: folder.name,
		path: folder.path,
		emoji: folder.emoji,
		color: folder.color,
	};
}
