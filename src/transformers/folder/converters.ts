/**
 * @file Funciones de conversión para la entidad Folder
 * @module transformers/folder/converters
 */

import { DEFAULT_COLORS, DEFAULT_EMOJIS } from '@/lib/constants';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Folder, FolderComplete, FolderCreateInput, FolderUpdateInput } from '@/types/entities/folder/types';
import { normalizeFolderPath } from './serializers';

const logger = serverLogger.withContext('FolderConverters');

/**
 * 📂 Convierte un objeto Folder de Prisma a un objeto FolderComplete
 * Incluye todas las propiedades necesarias para gestionar una carpeta
 *
 * @param folder Carpeta retornada por Prisma
 * @returns Objeto FolderComplete con propiedades adicionales
 */
export function toFolderComplete(folder: any): FolderComplete {
	try {
		if (!folder || typeof folder !== 'object') {
			throw new Error('Invalid folder object');
		}

		return {
			// 🔑 Campos básicos de identificación (requeridos por PrismaFolder)
			id: folder.id,
			name: folder.name || '',
			path: folder.path || '',
			description: folder.description || null,

			// 🎨 Propiedades de visualización (requeridos por PrismaFolder)
			emoji: folder.emoji || DEFAULT_EMOJIS.folder,
			color: folder.color || DEFAULT_COLORS.primary,
			featuredImage: folder.featuredImage || null,
			isFavorite: folder.isFavorite || false,

			// 📊 Propiedades de sistema (requeridos por PrismaFolder)
			totalFiles: folder.totalFiles || folder._count?.images || 0,
			totalSize: folder.totalSize || 0,
			autoReindex: folder.autoReindex || false,
			lastIndexed: folder.lastIndexed || null,

			// 🗂️ Relaciones (requeridos por PrismaFolder)
			parentId: folder.parentId || null,
			presetId: folder.presetId || null,

			// 📅 Metadatos de timestamp (requeridos por PrismaFolder)
			createdAt: folder.createdAt || new Date(),
			updatedAt: folder.updatedAt || new Date(),

			// 🔗 Campos adicionales esperados por FolderComplete
			children: folder.children || [],
			parent: folder.parent || null,
			stats: folder.stats || null,
			metadata: folder.metadata || {},
			_count: folder._count || {
				children: 0,
				images: 0,
				videos: 0,
			},
		};
	} catch (error) {
		logger.error('Error converting to FolderComplete:', error);
		return folder;
	}
}

/**
 * 📁 Convierte datos de entrada para creación a formato Prisma
 *
 * @param data Datos para crear un folder
 * @returns Datos transformados para Prisma
 */
export function toPrismaFolder(data: FolderCreateInput | FolderUpdateInput): any {
	try {
		const result: any = { ...data };

		// Normalizar el path si existe
		if (data.path !== undefined) {
			result.path = normalizeFolderPath(data.path);
		}

		// Convertir objetos complejos a JSON si existen
		if (data.metadata && typeof data.metadata === 'object') {
			result.metadata = data.metadata;
		}

		return result;
	} catch (error) {
		logger.error('Error converting to Prisma format:', error);
		return data;
	}
}

/**
 * 🔄 Mapea datos de un Folder a otro Folder
 * Útil para transferir propiedades entre objetos folder
 *
 * @param source Folder fuente
 * @param target Folder destino (opcional)
 * @returns Nuevo objeto Folder con propiedades combinadas
 */
export function mapFolderToFolder(source: Partial<Folder>, target?: Partial<Folder>): Folder {
	try {
		const result: any = { ...target, ...source };

		// Asegurar que las fechas sean objetos Date
		if (result.createdAt && !(result.createdAt instanceof Date)) {
			result.createdAt = new Date(result.createdAt);
		}

		if (result.updatedAt && !(result.updatedAt instanceof Date)) {
			result.updatedAt = new Date(result.updatedAt);
		}

		return result as Folder;
	} catch (error) {
		logger.error('Error mapping folder to folder:', error);
		return { ...target, ...source } as Folder;
	}
}
