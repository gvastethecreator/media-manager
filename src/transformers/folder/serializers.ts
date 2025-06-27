/**
 * @file Serializers para la entidad Folder
 * @module transformers/folder/serializers
 * @description Funciones para serializar y deserializar datos de Folder
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { FolderBase, FolderComplete, FolderWithStats } from '@/types/entities/folder';

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

/**
 * 📁 Serializa FolderWithStats para API/JSON
 */
export function serializeFolderWithStats(folder: FolderWithStats): Record<string, any> {
	return {
		id: folder.id,
		name: folder.name,
		description: folder.description,
		path: folder.path,
		emoji: folder.emoji,
		color: folder.color,
		featuredImage: folder.featuredImage,
		isFavorite: folder.isFavorite,
		autoReindex: folder.autoReindex,
		totalFiles: folder.totalFiles,
		totalSize: folder.totalSize,
		lastIndexed: folder.lastIndexed?.toISOString() || null,
		parentId: folder.parentId,
		presetId: folder.presetId,
		createdAt: folder.createdAt.toISOString(),
		updatedAt: folder.updatedAt.toISOString(),

		// Estadísticas
		statistics: {
			hierarchyDepth: folder.statistics.hierarchyDepth,
			totalDescendants: folder.statistics.totalDescendants,
			directChildren: folder.statistics.directChildren,
			contentDiversity: folder.statistics.contentDiversity,
			organizationScore: folder.statistics.organizationScore,
			totalItems: folder.statistics.totalItems,
			accessFrequency: folder.statistics.accessFrequency,
			lastActivity: folder.statistics.lastActivity?.toISOString() || null,
			imageCount: folder.statistics.imageCount,
			videoCount: folder.statistics.videoCount,
			noteCount: folder.statistics.noteCount,
			documentCount: folder.statistics.documentCount,
			folderCount: folder.statistics.folderCount,
			formattedSize: folder.statistics.formattedSize,
			averageFileSize: folder.statistics.averageFileSize,
			largestFile: folder.statistics.largestFile,
			hasConsistentNaming: folder.statistics.hasConsistentNaming,
			hasDeepHierarchy: folder.statistics.hasDeepHierarchy,
			isWellOrganized: folder.statistics.isWellOrganized,
			breadcrumbs: folder.statistics.breadcrumbs,
			fullPath: folder.statistics.fullPath,
			relativePath: folder.statistics.relativePath,
			autoTags: folder.statistics.autoTags,
			qualityGrade: folder.statistics.qualityGrade,
			totalRelations: folder.statistics.totalRelations,
		},

		// Conteos
		_count: folder._count,
	};
}

/**
 * 📁 Deserializa datos JSON a FolderWithStats
 */
export function deserializeFolderWithStats(data: Record<string, any>): FolderWithStats {
	return {
		id: data.id,
		name: data.name,
		description: data.description,
		path: data.path,
		emoji: data.emoji,
		color: data.color,
		featuredImage: data.featuredImage,
		isFavorite: data.isFavorite,
		autoReindex: data.autoReindex,
		totalFiles: data.totalFiles,
		totalSize: data.totalSize,
		lastIndexed: data.lastIndexed ? new Date(data.lastIndexed) : null,
		parentId: data.parentId,
		presetId: data.presetId,
		createdAt: new Date(data.createdAt),
		updatedAt: new Date(data.updatedAt),

		statistics: {
			hierarchyDepth: data.statistics.hierarchyDepth,
			totalDescendants: data.statistics.totalDescendants,
			directChildren: data.statistics.directChildren,
			contentDiversity: data.statistics.contentDiversity,
			organizationScore: data.statistics.organizationScore,
			totalItems: data.statistics.totalItems,
			accessFrequency: data.statistics.accessFrequency,
			lastActivity: data.statistics.lastActivity ? new Date(data.statistics.lastActivity) : null,
			imageCount: data.statistics.imageCount,
			videoCount: data.statistics.videoCount,
			noteCount: data.statistics.noteCount,
			documentCount: data.statistics.documentCount,
			folderCount: data.statistics.folderCount,
			formattedSize: data.statistics.formattedSize,
			averageFileSize: data.statistics.averageFileSize,
			largestFile: data.statistics.largestFile,
			hasConsistentNaming: data.statistics.hasConsistentNaming,
			hasDeepHierarchy: data.statistics.hasDeepHierarchy,
			isWellOrganized: data.statistics.isWellOrganized,
			breadcrumbs: data.statistics.breadcrumbs,
			fullPath: data.statistics.fullPath,
			relativePath: data.statistics.relativePath,
			autoTags: data.statistics.autoTags,
			qualityGrade: data.statistics.qualityGrade,
			totalRelations: data.statistics.totalRelations,
		},

		_count: data._count,
	};
}

/**
 * 📁 Serializa FolderComplete para API/JSON (legacy)
 */
export function serializeFolderComplete(folder: FolderComplete): Record<string, any> {
	return {
		id: folder.id,
		name: folder.name,
		description: folder.description,
		path: folder.path,
		emoji: folder.emoji,
		color: folder.color,
		featuredImage: folder.featuredImage,
		isFavorite: folder.isFavorite,
		autoReindex: folder.autoReindex,
		totalFiles: folder.totalFiles,
		totalSize: folder.totalSize,
		lastIndexed: folder.lastIndexed?.toISOString() || null,
		parentId: folder.parentId,
		presetId: folder.presetId,
		createdAt: folder.createdAt.toISOString(),
		updatedAt: folder.updatedAt.toISOString(),

		// Relaciones (simplificadas)
		parent: folder.parent
			? {
					id: folder.parent.id,
					name: folder.parent.name,
					path: folder.parent.path,
				}
			: null,

		children:
			folder.children?.map((child) => ({
				id: child.id,
				name: child.name,
				path: child.path,
			})) || [],

		// Conteos
		_count: folder._count,
	};
}

/**
 * 📁 Serializa array de carpetas
 */
export function serializeFolders(folders: FolderWithStats[]): Record<string, any>[] {
	return folders.map(serializeFolderWithStats);
}

/**
 * 📁 Deserializa array de carpetas
 */
export function deserializeFolders(data: Record<string, any>[]): FolderWithStats[] {
	return data.map(deserializeFolderWithStats);
}
