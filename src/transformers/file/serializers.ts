/**
 * @file Serializadores para la entidad File
 * @module transformers/file/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
	type DirectoryReadResult,
	type FileBase,
	type FileInfo,
	type FileListItem,
	type FileOperationResult,
} from '@/types/entities/file';
import { toFileListItem } from './mappers';

const serializersLogger = serverLogger.withContext('File:Serializers');

// formatFileSize se ha movido a @/lib/utils/format.utils.ts para evitar duplicación
// Importar desde allí: import { formatFileSize } from '@/lib/utils/format.utils';

/**
 * Serializa un resultado de operación de directorio para la UI
 * @param path Ruta del directorio
 * @param items Lista de archivos y carpetas
 * @returns Objeto con datos estructurados para la UI
 */
export function serializeDirectoryContents(path: string, items: FileBase[]): DirectoryReadResult {
	try {
		// Contar archivos y directorios
		const directoryCount = items.filter((item) => item.isDirectory).length;
		const _fileCount = items.length - directoryCount;

		// Crear resultado de lectura
		const result: DirectoryReadResult = {
			path,
			items,
			totalItems: items.length,
			hasMore: false, // Este valor se actualizaría si hay paginación
			directories: items.filter((item) => item.isDirectory), // Array de DirectoryInfo
			files: items.filter((item) => !item.isDirectory), // Array de FileInfo
		};

		return result;
	} catch (error) {
		serializersLogger.error('Error al serializar contenido de directorio:', error);
		// Devolver un resultado mínimo en caso de error
		return {
			path,
			items: [],
			totalItems: 0,
			hasMore: false,
			directories: [], // Array vacío de DirectoryInfo
			files: [], // Array vacío de FileInfo
		};
	}
}

/**
 * Serializa un listado de archivos para la UI
 * @param files Lista de información de archivos
 * @returns Listado formateado para la UI
 */
export function serializeFileListForUI(files: FileInfo[]): FileListItem[] {
	try {
		// Convertir cada archivo al formato de UI
		return files.map((file) => toFileListItem(file));
	} catch (error) {
		serializersLogger.error('Error al serializar lista de archivos para UI:', error);
		return [];
	}
}

/**
 * Serializa un resultado de operación de archivo
 * @param success Indica si la operación fue exitosa
 * @param path Ruta del archivo
 * @param error Mensaje de error si lo hubo
 * @returns Objeto de resultado de operación
 */
export function serializeFileOperationResult(success: boolean, path?: string, error?: string): FileOperationResult {
	return {
		success,
		path,
		error,
		timestamp: new Date(),
	};
}

/**
 * Serializa metadatos de imagen para almacenamiento
 * @param metadata Objeto de metadatos de imagen
 * @returns String JSON o undefined
 */
export function serializeImageMetadata(metadata: Record<string, unknown>): string | undefined {
	if (!metadata) return undefined;

	try {
		return JSON.stringify(metadata);
	} catch (error) {
		serializersLogger.error('Error al serializar metadatos de imagen:', error);
		return undefined;
	}
}

/**
 * Deserializa metadatos de imagen desde formato almacenado
 * @param metadataStr String JSON de metadatos
 * @returns Objeto de metadatos o undefined
 */
export function deserializeImageMetadata(metadataStr?: string): Record<string, unknown> | undefined {
	if (!metadataStr) return undefined;

	try {
		return JSON.parse(metadataStr);
	} catch (error) {
		serializersLogger.error('Error al deserializar metadatos de imagen:', error);
		return undefined;
	}
}

/**
 * Convierte datos de ruta a una estructura arborescente para UI
 * @param paths Lista de rutas de directorio
 * @returns Estructura jerárquica para representar un árbol de directorios
 */
export function pathsToTreeStructure(paths: string[]): FileListItem[] {
	try {
		const tree: FileListItem[] = [];
		// const _pathMap: Record<string, any> = {}; // ❌ ELIMINADO - No usado

		// Construir el árbol
		for (const fullPath of paths) {
			// Dividir la ruta en segmentos
			const segments = fullPath.split('/').filter(Boolean);

			// Comenzar desde la raíz del árbol (que tiene children implícito)
			let currentLevel = tree;

			// Construir la ruta segmento por segmento
			for (let i = 0; i < segments.length; i++) {
				const segment = segments[i];
				const isFile = i === segments.length - 1 && !fullPath.endsWith('/');
				const currentPath = segments.slice(0, i + 1).join('/');

				// Buscar si el nodo ya existe en el nivel actual
				let node = currentLevel.find((child) => child.name === segment);

				if (!node) {
					// Crear nuevo nodo
					node = {
						id: `file-${currentPath}`, // Generar ID simple
						name: segment,
						path: currentPath,
						isDirectory: !isFile,
						children: [],
						size: 0,
						modifiedAt: new Date(),
						createdAt: new Date(),
					};

					// Añadir al nivel actual
					currentLevel.push(node);
				}

				// Si es el último segmento y es un archivo, actualizar propiedades
				// (fileInfoMap eliminado - no está definido)

				// Actualizar el nivel actual para la siguiente iteración
				currentLevel = node.children;
			}
		}

		return tree;
	} catch (error) {
		serializersLogger.error('Error al convertir rutas a estructura de árbol:', error);
		return [];
	}
}
