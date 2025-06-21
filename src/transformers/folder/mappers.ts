/**
 * @file Funciones de mapeo para la entidad Folder
 * @module transformers/folder/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    FolderComplete,
    FolderCreateInput,
    FolderFilters,
    FolderSearchOptions,
    FolderUpdateInput,
} from '@/types/entities/folder';
import { TransformerError } from '@/utils/transformers/errors';
import type { Prisma, Folder as PrismaFolder } from '@prisma/client';
import { normalizeFolderPath } from './serializers';

const logger = serverLogger.withContext('FolderMappers');

/**
 * 🔄 Mapea un `FolderCreateInput` a un `Prisma.FolderCreateInput`.
 * Normaliza la ruta y establece valores por defecto.
 */
export function mapCreateFolderDataToPrisma(data: FolderCreateInput): Prisma.FolderCreateInput {
	try {
		return {
			name: data.name,
			path: data.path,
			autoReindex: data.autoReindex,
			description: data.description ?? null,
			emoji: data.emoji ?? null,
			color: data.color ?? null,
			parentId: data.parentId ?? null,
			presetId: data.presetId ?? null,
			isFavorite: data.isFavorite ?? false,
			featuredImage: data.featuredImage ?? null,
			totalFiles: 0,
			totalSize: 0,
			lastIndexed: null,
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de carpeta', { error, data });
		throw new TransformerError('Error al mapear datos de creación de carpeta.');
	}
}

/**
 * 🔄 Mapea un `FolderUpdateInput` a un `Prisma.FolderUpdateInput`.
 * Normaliza la ruta si se proporciona.
 */
export function mapUpdateFolderDataToPrisma(data: FolderUpdateInput): Prisma.FolderUpdateInput {
	try {
		const prismaData: Prisma.FolderUpdateInput = { ...data };
		if (data.path) {
			prismaData.path = data.path;
		}
		prismaData.updatedAt = new Date();
		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de carpeta', { error, data });
		throw new TransformerError('Error al mapear datos de actualización de carpeta.');
	}
}

/**
 * 🔄 Mapea `FolderSearchOptions` a `Prisma.FolderFindManyArgs`.
 */
export function mapFolderSearchOptionsToPrisma(options: FolderSearchOptions): Prisma.FolderFindManyArgs {
	const { skip, take, orderBy, filters, include } = options;
	const args: Prisma.FolderFindManyArgs = {
		skip,
		take,
		orderBy,
		include,
	};

	if (filters) {
		args.where = mapFolderFiltersToPrisma(filters);
	}

	return args;
}

/**
 * 🔄 Mapea `FolderFilters` a `Prisma.FolderWhereInput`.
 */
function mapFolderFiltersToPrisma(filters: FolderFilters): Prisma.FolderWhereInput {
	const where: Prisma.FolderWhereInput = {};

	if (filters.search) {
		where.OR = [{ name: { contains: filters.search } }, { description: { contains: filters.search } }];
	}

	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}

	if (filters.parentId !== undefined) {
		where.parentId = filters.parentId;
	}

	if (filters.hasImages) {
		where.images = { some: {} };
	}

	return where;
}

/**
 * 🔄 Transforma un objeto FolderComplete a formato Prisma
 *
 * @param folder Objeto FolderComplete
 * @returns Datos para Prisma
 */
export function transformCompleteFolderToPrisma(folder: FolderComplete): PrismaFolder {
	try {
		// Extraer propiedades no persistibles
		const { children, parent, stats, _count, metadata, ...persistableData } = folder;

		// Convertir el objeto a formato Prisma
		return {
			...persistableData,
			// Normalizar path si existe
			path: folder.path ? normalizeFolderPath(folder.path) : folder.path,
			// Convertir metadatos a formato adecuado si existen
			metadata: metadata || {},
		};
	} catch (error) {
		logger.error('Error transformando folder completo a Prisma:', error);
		return folder;
	}
}

/**
 * 🔄 Transforma un objeto Folder a formato Prisma
 *
 * @param folder Objeto Folder
 * @returns Datos para Prisma
 */
export function transformFolderToPrisma(folder: Folder): PrismaFolder {
	try {
		// Extraer la propiedad _count que no es persistible
		const { _count, ...persistableData } = folder;

		// Convertir el objeto a formato Prisma
		return {
			...persistableData,
			// Normalizar path si existe
			path: folder.path ? normalizeFolderPath(folder.path) : folder.path,
		};
	} catch (error) {
		logger.error('Error transformando folder a Prisma:', error);
		return folder;
	}
}
