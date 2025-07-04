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
		type: file.type,
		mimeType: file.mimeType,
		extension: file.extension,
		hash: file.hash,
		isDirectory: file.isDirectory,
		parentPath: file.parentPath,
		absolutePath: file.absolutePath,
		relativePath: file.relativePath,
		isHidden: file.isHidden,
		isReadonly: file.isReadonly,
		folderId: file.folderId,
		// Fechas serializadas como ISO strings
		modifiedAt: file.modifiedAt.toISOString(),
		accessedAt: file.accessedAt.toISOString(),
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
 * 📊 Serializa estadísticas agrupadas de archivos por tipo.
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
 * 🗂️ Serializa estructura de directorio.
 *
 * @param directory - Directorio con archivos anidados
 * @returns Estructura serializada
 */
export function serializeDirectoryStructure(directory: {
	folder: FileWithStats;
	files: FileWithStats[];
	subdirectories: FileWithStats[];
}) {
	return {
		folder: serializeFileWithStats(directory.folder),
		files: directory.files.map(serializeFileWithStats),
		subdirectories: directory.subdirectories.map(serializeFileWithStats),
		totals: {
			fileCount: directory.files.length,
			subdirectoryCount: directory.subdirectories.length,
			totalSize: [...directory.files, ...directory.subdirectories].reduce((sum, item) => sum + item.size, 0),
		},
	};
}
