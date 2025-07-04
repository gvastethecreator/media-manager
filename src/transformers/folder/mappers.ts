/**
 * @file Funciones de mapeo para la entidad Folder
 * @module transformers/folder/mappers
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type {
	FolderComplete,
	FolderCreateInput,
	FolderFilters,
	FolderSearchOptions,
	FolderUpdateInput,
} from '@/types/entities/folder';
import { normalizeFolderPath } from './serializers';

const logger = serverLogger.withContext('FolderMappers');

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleFolderCreateInput = {
	id?: string;
	name: string;
	path: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	totalFiles?: number;
	totalSize?: number;
	autoReindex?: boolean;
	lastIndexed?: Date | null;
	parentId?: string | null;
	presetId?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
};

type DrizzleFolderUpdateInput = {
	name?: string;
	path?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	totalFiles?: number;
	totalSize?: number;
	autoReindex?: boolean;
	lastIndexed?: Date | null;
	parentId?: string | null;
	presetId?: string | null;
	updatedAt?: Date;
};

type DrizzleFolderWhereInput = {
	id?: string;
	name?: { contains?: string };
	description?: { contains?: string };
	path?: string;
	isFavorite?: boolean;
	parentId?: string | null;
	OR?: DrizzleFolderWhereInput[];
	images?: { some?: any };
};

type DrizzleFolderFindManyArgs = {
	skip?: number;
	take?: number;
	orderBy?: any;
	where?: DrizzleFolderWhereInput;
	include?: any;
};

type DrizzleFolder = {
	id: string;
	name: string;
	path: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	featuredImage: string | null;
	isFavorite: boolean;
	totalFiles: number;
	totalSize: number;
	autoReindex: boolean;
	lastIndexed: Date | null;
	parentId: string | null;
	presetId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * 🔄 Mapea un `FolderCreateInput` a un `DrizzleFolderCreateInput`.
 * Normaliza la ruta y establece valores por defecto.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapCreateFolderDataToDrizzle(data: FolderCreateInput): DrizzleFolderCreateInput {
	try {
		return {
			id: crypto.randomUUID(),
			name: data.name,
			path: data.path,
			autoReindex: data.autoReindex ?? false,
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
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de carpeta', { error, data });
		throw new TransformerError('Error al mapear datos de creación de carpeta.');
	}
}

/**
 * 🔄 Mapea un `FolderUpdateInput` a un `DrizzleFolderUpdateInput`.
 * Normaliza la ruta si se proporciona.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapUpdateFolderDataToDrizzle(data: FolderUpdateInput): DrizzleFolderUpdateInput {
	try {
		const drizzleData: DrizzleFolderUpdateInput = { ...data };
		if (data.path) {
			drizzleData.path = data.path;
		}
		drizzleData.updatedAt = new Date();
		return drizzleData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de carpeta', { error, data });
		throw new TransformerError('Error al mapear datos de actualización de carpeta.');
	}
}

/**
 * 🔄 Mapea `FolderSearchOptions` a `DrizzleFolderFindManyArgs`.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapFolderSearchOptionsToDrizzle(options: FolderSearchOptions): DrizzleFolderFindManyArgs {
	const { skip, take, orderBy, filters, include } = options;
	const args: DrizzleFolderFindManyArgs = {
		skip,
		take,
		orderBy,
		include,
	};

	if (filters) {
		args.where = mapFolderFiltersToDrizzle(filters);
	}

	return args;
}

/**
 * 🔄 Mapea `FolderFilters` a `DrizzleFolderWhereInput`.
 * ✅ MIGRADO A DRIZZLE
 */
function mapFolderFiltersToDrizzle(filters: FolderFilters): DrizzleFolderWhereInput {
	const where: DrizzleFolderWhereInput = {};

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
 * 🔄 Transforma un objeto FolderComplete a formato Drizzle
 * ✅ MIGRADO A DRIZZLE
 *
 * @param folder Objeto FolderComplete
 * @returns Datos para Drizzle
 */
export function transformCompleteFolderToDrizzle(folder: FolderComplete): DrizzleFolder {
	try {
		// Extraer propiedades no persistibles
		const { children, parent, stats, _count, metadata, ...persistableData } = folder;

		// Convertir el objeto a formato Drizzle
		return {
			...persistableData,
			// Normalizar path si existe
			path: folder.path ? normalizeFolderPath(folder.path) : folder.path,
			// Asegurar que todos los campos requeridos estén presentes
			id: persistableData.id || crypto.randomUUID(),
			createdAt: persistableData.createdAt || new Date(),
			updatedAt: persistableData.updatedAt || new Date(),
		} as DrizzleFolder;
	} catch (error) {
		logger.error('Error transformando folder completo a Drizzle:', error);
		return folder as DrizzleFolder;
	}
}

/**
 * 🔄 Transforma un objeto Folder a formato Drizzle
 * ✅ MIGRADO A DRIZZLE
 *
 * @param folder Objeto Folder
 * @returns Datos para Drizzle
 */
export function transformFolderToDrizzle(folder: any): DrizzleFolder {
	try {
		// Extraer la propiedad _count que no es persistible
		const { _count, ...persistableData } = folder;

		// Convertir el objeto a formato Drizzle
		return {
			...persistableData,
			// Normalizar path si existe
			path: folder.path ? normalizeFolderPath(folder.path) : folder.path,
			// Asegurar que todos los campos requeridos estén presentes
			id: persistableData.id || crypto.randomUUID(),
			createdAt: persistableData.createdAt || new Date(),
			updatedAt: persistableData.updatedAt || new Date(),
		} as DrizzleFolder;
	} catch (error) {
		logger.error('Error transformando folder a Drizzle:', error);
		return folder as DrizzleFolder;
	}
}


