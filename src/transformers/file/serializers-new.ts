/**
 * @file Serializadores para la entidad File.
 * @module transformers/file/serializers
 * @description Contiene funciones para serializar datos de File para respuestas API y cliente.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

import type { FileBase, FileWithStats } from '@/types/entities/file';

/**
 * 📁 Serializa un archivo base para respuestas API.
 * Omite campos sensibles y aplica formato estándar.
 *
 * @param file - Archivo base desde Drizzle
 * @returns Archivo serializado para API
 */
export function serializeFileBase(file: FileBase) {
	return {
		id: file.id,
		name: file.name,
		path: file.path,
		size: file.size,
		hash: file.hash,
		mimeType: file.mimeType,
		extension: file.extension,
		type: file.type,
		isDirectory: file.isDirectory,
		parentPath: file.parentPath,
		relativePath: file.relativePath,
		modifiedAt: file.modifiedAt.toISOString(),
		accessedAt: file.accessedAt.toISOString(),
		folderId: file.folderId,
		isHidden: file.isHidden,
		isReadonly: file.isReadonly,
		createdAt: file.createdAt.toISOString(),
		updatedAt: file.updatedAt.toISOString(),
	};
}

/**
 * 📊 Serializa un archivo con estadísticas para respuestas API.
 *
 * @param file - Archivo con estadísticas
 * @returns Archivo serializado con estadísticas
 */
export function serializeFileWithStats(file: FileWithStats) {
	return {
		...serializeFileBase(file),
		stats: {
			formattedSize: file.stats.formattedSize,
			typeLabel: file.stats.typeLabel,
			iconName: file.stats.iconName,
			colorCode: file.stats.colorCode,
			daysSinceModified: file.stats.daysSinceModified,
			daysSinceAccessed: file.stats.daysSinceAccessed,
			isRecent: file.stats.isRecent,
			isLarge: file.stats.isLarge,
			formattedModifiedAt: file.stats.formattedModifiedAt,
			childCount: file.stats.childCount,
			shortPath: file.stats.shortPath,
		},
	};
}

/**
 * 📁 Serializa una lista de archivos para respuestas API.
 *
 * @param files - Lista de archivos con estadísticas
 * @returns Lista serializada
 */
export function serializeFileList(files: FileWithStats[]) {
	return files.map(serializeFileWithStats);
}

/**
 * 📂 Serializa el contenido de un directorio.
 *
 * @param directory - Información del directorio
 * @param files - Archivos en el directorio
 * @returns Contenido del directorio serializado
 */
export function serializeDirectoryContents(directory: FileWithStats, files: FileWithStats[]) {
	return {
		directory: serializeFileWithStats(directory),
		files: serializeFileList(files),
		totalFiles: files.length,
		totalSize: files.reduce((sum, file) => sum + file.size, 0),
		fileTypes: [...new Set(files.map((file) => file.type))],
	};
}

/**
 * 📊 Serializa estadísticas agrupadas de archivos.
 *
 * @param grouped - Archivos agrupados por tipo
 * @returns Estadísticas serializadas
 */
export function serializeFileGroupedStats(grouped: Record<string, FileWithStats[]>) {
	return Object.entries(grouped).map(([fileType, files]) => ({
		fileType,
		count: files.length,
		totalSize: files.reduce((sum, file) => sum + file.size, 0),
		files: files.map(serializeFileWithStats),
	}));
}

/**
 * 🔍 Serializa resultados de búsqueda de archivos.
 *
 * @param results - Resultados de búsqueda
 * @param query - Consulta de búsqueda
 * @returns Resultados serializados
 */
export function serializeFileSearchResults(results: FileWithStats[], query: string) {
	return {
		query,
		total: results.length,
		files: serializeFileList(results),
		summary: {
			byType: results.reduce(
				(acc, file) => {
					acc[file.type] = (acc[file.type] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			),
			totalSize: results.reduce((sum, file) => sum + file.size, 0),
			recentFiles: results.filter((file) => file.stats.isRecent).length,
			largeFiles: results.filter((file) => file.stats.isLarge).length,
		},
	};
}
