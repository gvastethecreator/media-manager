/**
 * @file Funciones de serialización/deserialización para la entidad Folder
 * @module transformers/folder/serializers
 */

import type {
	FolderExtended,
	FolderSummary,
	FolderTreeItem,
	FolderVisualConfigExtended,
} from '@/types/entities/folder';
import type { Folder as PrismaFolder, FolderVisualConfig as PrismaFolderVisualConfig } from '@prisma/client';

/**
 * Transforma un objeto Folder de Prisma a un objeto FolderExtended
 * @param folder Folder de Prisma
 * @returns FolderExtended con propiedades adicionales
 */
export function toFolderExtended(folder: PrismaFolder): FolderExtended {
	return {
		...folder,
		lastIndexed: folder.lastIndexed || undefined,
		// Propiedades adicionales de UI que no existen en la BD
		isSelected: false,
		isOpen: false,
		level: 0,
		isLoading: false,
		hasError: false,
	};
}

/**
 * Transforma un objeto FolderVisualConfig de Prisma a FolderVisualConfigExtended
 * @param config FolderVisualConfig de Prisma
 * @returns FolderVisualConfigExtended con propiedades adicionales
 */
export function toFolderVisualConfigExtended(config: PrismaFolderVisualConfig): FolderVisualConfigExtended {
	return {
		...config,
		// Propiedades adicionales de UI
		previewMode: 'default',
		isActive: false,
		effectsEnabled: true,
	};
}

/**
 * Transforma un FolderExtended (o un Folder de Prisma) en un elemento para árbol de navegación
 * @param folder Folder a transformar
 * @param level Nivel de profundidad en el árbol
 * @param isSelected Si está seleccionado
 * @param isOpen Si está expandido
 * @returns FolderTreeItem para usar en navegación
 */
export function toFolderTreeItem(
	folder: PrismaFolder | FolderExtended,
	level = 0,
	isSelected = false,
	isOpen = false
): FolderTreeItem {
	return {
		id: folder.id,
		name: folder.name,
		path: folder.path,
		parentId: folder.parentId,
		emoji: folder.emoji || '📁',
		color: folder.color || '#3b82f6',
		children: [],
		level,
		isOpen,
		isSelected,
		hasChildren: false,
	};
}

/**
 * Transforma un Folder en un resumen para listados
 * @param folder Folder a resumir
 * @returns FolderSummary con datos básicos
 */
export function toFolderSummary(folder: PrismaFolder | FolderExtended): FolderSummary {
	return {
		id: folder.id,
		name: folder.name,
		path: folder.path,
		imageCount: folder.totalFiles || 0,
		totalSize: folder.totalSize || 0,
		lastIndexed: folder.lastIndexed instanceof Date ? folder.lastIndexed : null,
	};
}

/**
 * Prepara los datos de una carpeta para guardar en la base de datos
 * Elimina propiedades que no son parte del modelo Prisma
 * @param folder Folder con datos extendidos
 * @returns Datos limpios para guardar en BD
 */
export function toPrismaFolder(folder: Partial<FolderExtended>): Partial<PrismaFolder> {
	// Extraer solo las propiedades que existen en PrismaFolder
	const {
		id,
		name,
		description,
		path,
		parentId,
		createdAt,
		updatedAt,
		visualConfigId,
		totalFiles,
		totalSize,
		lastIndexed,
		autoReindex,
		featuredImage,
		isFavorite,
		emoji,
		color,
		presetId,
	} = folder;

	return {
		id,
		name,
		description,
		path,
		parentId,
		createdAt,
		updatedAt,
		visualConfigId,
		totalFiles,
		totalSize,
		lastIndexed: lastIndexed instanceof Date ? lastIndexed : undefined,
		autoReindex,
		featuredImage,
		isFavorite,
		emoji,
		color,
		presetId,
	};
}
