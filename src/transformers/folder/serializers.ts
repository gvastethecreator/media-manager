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
		entityType: folder.entityType,

		// Estadísticas
		stats: {
			hierarchyDepth: folder.stats.hierarchyDepth,
			totalDescendants: folder.stats.totalDescendants,
			directChildren: folder.stats.directChildren,
			contentDiversity: folder.stats.contentDiversity,
			organizationScore: folder.stats.organizationScore,
			totalItems: folder.stats.totalItems,
			accessFrequency: folder.stats.accessFrequency,
			lastActivity: folder.stats.lastActivity?.toISOString() || null,
			imageCount: folder.stats.imageCount,
			videoCount: folder.stats.videoCount,
			noteCount: folder.stats.noteCount,
			documentCount: folder.stats.documentCount,
			folderCount: folder.stats.folderCount,
			formattedSize: folder.stats.formattedSize,
			averageFileSize: folder.stats.averageFileSize,
			largestFile: folder.stats.largestFile,
			hasConsistentNaming: folder.stats.hasConsistentNaming,
			hasDeepHierarchy: folder.stats.hasDeepHierarchy,
			isWellOrganized: folder.stats.isWellOrganized,
			breadcrumbs: folder.stats.breadcrumbs,
			fullPath: folder.stats.fullPath,
			relativePath: folder.stats.relativePath,
			autoTags: folder.stats.autoTags,
			qualityGrade: folder.stats.qualityGrade,
			totalRelations: folder.stats.totalRelations,
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
		entityType: 'folder' as const,

		stats: {
			hierarchyDepth: data.stats.hierarchyDepth,
			totalDescendants: data.stats.totalDescendants,
			directChildren: data.stats.directChildren,
			contentDiversity: data.stats.contentDiversity,
			organizationScore: data.stats.organizationScore,
			totalItems: data.stats.totalItems,
			accessFrequency: data.stats.accessFrequency,
			lastActivity: data.stats.lastActivity ? new Date(data.stats.lastActivity) : null,
			imageCount: data.stats.imageCount,
			videoCount: data.stats.videoCount,
			noteCount: data.stats.noteCount,
			documentCount: data.stats.documentCount,
			folderCount: data.stats.folderCount,
			formattedSize: data.stats.formattedSize,
			averageFileSize: data.stats.averageFileSize,
			largestFile: data.stats.largestFile,
			hasConsistentNaming: data.stats.hasConsistentNaming,
			hasDeepHierarchy: data.stats.hasDeepHierarchy,
			isWellOrganized: data.stats.isWellOrganized,
			breadcrumbs: data.stats.breadcrumbs,
			fullPath: data.stats.fullPath,
			relativePath: data.stats.relativePath,
			autoTags: data.stats.autoTags,
			qualityGrade: data.stats.qualityGrade,
			totalRelations: data.stats.totalRelations,
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
