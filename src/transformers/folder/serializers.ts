/**
 * @file Funciones de serialización/deserialización para la entidad Folder
 * @module transformers/folder/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    FolderBase,
    FolderComplete,
    FolderExtended,
    FolderExtendedComplete,
    FolderSummary,
    FolderTreeItem,
} from '@/types/entities/folder';
import type { Folder as PrismaFolder } from '@prisma/client';

const serializerLogger = serverLogger.withContext('FolderSerializer');

/**
 * Transforma un objeto Folder de Prisma a un objeto FolderComplete
 * Esto deserializa todos los campos y prepara la estructura completa.
 * Folder no tiene campos JSON para deserializar, pero mantenemos este patrón
 * para consistencia con las otras entidades.
 *
 * @param folder Folder de Prisma
 * @returns FolderComplete con todos los campos deserializados
 */
export function toFolderComplete(folder: FolderBase): FolderComplete {
	try {
		// Dado que Folder no tiene campos JSON para deserializar,
		// simplemente devolvemos el objeto como FolderComplete
		return {
			...folder
		};
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar Folder:', error);
		// En caso de error, devolvemos el objeto original sin deserializar
		return folder;
	}
}

/**
 * Transforma un objeto FolderComplete de vuelta a un FolderBase para persistir
 *
 * @param folder FolderComplete
 * @returns FolderBase para guardar en BD
 */
export function fromFolderComplete(folder: FolderComplete): FolderBase {
	try {
		// Como no hay campos para serializar a JSON, simplemente retornamos el objeto
		return {
			...folder
		};
	} catch (error) {
		serializerLogger.error('❌ Error al serializar Folder para BD:', error);
		// En caso de error, devolvemos el objeto original
		return folder;
	}
}

/**
 * Transforma un FolderComplete a un FolderExtendedComplete con propiedades de UI
 * @param folder FolderComplete
 * @returns FolderExtendedComplete con propiedades UI
 */
export function mapFolderExtendedFromComplete(folder: FolderComplete): FolderExtendedComplete {
	return {
		...folder,
		// Propiedades adicionales de UI
		isSelected: false,
		isOpen: false,
		level: 0,
		isLoading: false,
		hasError: false,
	};
}

/**
 * Transforma un objeto Folder de Prisma a un objeto FolderExtended
 * @param folder Folder de Prisma
 * @returns FolderExtended con propiedades adicionales
 * @deprecated Usar toFolderComplete y mapFolderExtendedFromComplete en su lugar
 */
export function toFolderExtended(folder: PrismaFolder): FolderExtended {
	return {
		...folder,
		lastIndexed: folder.lastIndexed || undefined,
		// Propiedades adicionales de UI
		isSelected: false,
		isOpen: false,
		level: 0,
		isLoading: false,
		hasError: false,
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
 * @deprecated Usar fromFolderComplete en su lugar
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

/**
 * Transforma un folder con datos de relaciones/conteos en una versión con estadísticas
 * @param folder Folder de la base de datos con _count
 * @returns Folder extendido con estadísticas para UI
 */
export function toFolderWithStats(folder: FolderBase & { _count?: { images?: number; files?: number } }) {
	return {
		...folder,
		imageCount: folder._count?.images || 0,
		fileCount: folder._count?.files || 0,
		totalFiles: folder.totalFiles || 0,
		totalSize: folder.totalSize || 0,
	};
}
