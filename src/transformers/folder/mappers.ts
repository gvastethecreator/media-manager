/**
 * @file Funciones de mapeo para la entidad Folder
 * @module transformers/folder/mappers
 */

import { Logger } from '@/lib/logger';
import { FolderSortBy } from '@/types/entities/folder/enums';
import type {
	Folder,
	FolderComplete,
	FolderCreateInput,
	FolderFilter,
	FolderSearchOptions,
	FolderUpdateInput,
} from '@/types/entities/folder/types';
import { normalizeFolderPath } from './serializers';

const logger = new Logger('FolderMappers');

/**
 * 🔍 Crea un objeto de filtro para consultas de Prisma
 *
 * @param filter Filtro de carpeta
 * @returns Objeto de filtro para Prisma
 */
export function createFolderFilter(filter: FolderFilter = {}): any {
	try {
		const prismaFilter: any = {};

		// Filtrado por ID
		if (filter.id) {
			prismaFilter.id = filter.id;
		}

		// Filtrado por nombre (insensible a mayúsculas/minúsculas)
		if (filter.name) {
			prismaFilter.name = {
				contains: filter.name,
				mode: 'insensitive',
			};
		}

		// Filtrado por path
		if (filter.path) {
			prismaFilter.path = {
				contains: filter.path,
			};
		}

		// Filtrado por ID de padre
		if (filter.parentId !== undefined) {
			prismaFilter.parentId = filter.parentId;
		}

		// Filtrado por fecha de creación
		if (filter.createdAt) {
			prismaFilter.createdAt = filter.createdAt;
		}

		// Filtrado por fecha de actualización
		if (filter.updatedAt) {
			prismaFilter.updatedAt = filter.updatedAt;
		}

		return prismaFilter;
	} catch (error) {
		logger.error('Error creando filtro de folder para Prisma:', error);
		return {};
	}
}

/**
 * 📊 Crea un objeto de ordenación para consultas de Prisma
 *
 * @param sortBy Criterio de ordenación
 * @returns Objeto de ordenación para Prisma
 */
export function createFolderOrderBy(sortBy: FolderSortBy = FolderSortBy.NAME_ASC): any {
	try {
		switch (sortBy) {
			case FolderSortBy.NAME_ASC:
				return { name: 'asc' };

			case FolderSortBy.NAME_DESC:
				return { name: 'desc' };

			case FolderSortBy.CREATED_ASC:
				return { createdAt: 'asc' };

			case FolderSortBy.CREATED_DESC:
				return { createdAt: 'desc' };

			case FolderSortBy.UPDATED_ASC:
				return { updatedAt: 'asc' };

			case FolderSortBy.UPDATED_DESC:
				return { updatedAt: 'desc' };

			case FolderSortBy.PATH_ASC:
				return { path: 'asc' };

			case FolderSortBy.PATH_DESC:
				return { path: 'desc' };

			default:
				return { name: 'asc' };
		}
	} catch (error) {
		logger.error('Error creando orden de folder para Prisma:', error);
		return { name: 'asc' };
	}
}

/**
 * 🔄 Mapea opciones de búsqueda a parámetros de Prisma
 *
 * @param options Opciones de búsqueda
 * @returns Opciones de búsqueda para Prisma
 */
export function mapFolderSearchOptionsToPrisma(options: FolderSearchOptions = {}): any {
	try {
		const prismaOptions: any = {};

		// Mapear filtros
		if (options.filter) {
			prismaOptions.where = createFolderFilter(options.filter);
		}

		// Mapear ordenación
		prismaOptions.orderBy = createFolderOrderBy(options.sortBy);

		// Mapear paginación
		if (options.skip !== undefined) {
			prismaOptions.skip = options.skip;
		}

		if (options.take !== undefined) {
			prismaOptions.take = options.take;
		}

		// Mapear relaciones a incluir
		if (options.include) {
			prismaOptions.include = {};

			if (options.include.parent) {
				prismaOptions.include.parent = true;
			}

			if (options.include.children) {
				prismaOptions.include.children = true;
			}

			if (options.include.images) {
				prismaOptions.include.images = true;
			}

			if (options.include.count) {
				prismaOptions.include._count = {
					select: {
						children: true,
						images: true,
						uploadedImages: true,
						tags: true,
					},
				};
			}
		}

		return prismaOptions;
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda de folder para Prisma:', error);
		return {};
	}
}

/**
 * 🔄 Mapea filtros a parámetros de Prisma
 *
 * @param filters Filtros de carpeta
 * @returns Filtros para Prisma
 */
export function mapFolderFiltersToPrisma(filters: Record<string, any> = {}): any {
	try {
		const prismaFilters: any = {};

		// Mapear filtros comunes
		if (filters.id) {
			prismaFilters.id = filters.id;
		}

		if (filters.name) {
			prismaFilters.name = {
				contains: filters.name,
				mode: 'insensitive',
			};
		}

		if (filters.path) {
			prismaFilters.path = {
				contains: filters.path,
			};
		}

		if (filters.parentId !== undefined) {
			prismaFilters.parentId = filters.parentId === 'null' ? null : filters.parentId;
		}

		// Fechas
		if (filters.createdBefore) {
			prismaFilters.createdAt = {
				...(prismaFilters.createdAt || {}),
				lt: new Date(filters.createdBefore),
			};
		}

		if (filters.createdAfter) {
			prismaFilters.createdAt = {
				...(prismaFilters.createdAt || {}),
				gt: new Date(filters.createdAfter),
			};
		}

		if (filters.updatedBefore) {
			prismaFilters.updatedAt = {
				...(prismaFilters.updatedAt || {}),
				lt: new Date(filters.updatedBefore),
			};
		}

		if (filters.updatedAfter) {
			prismaFilters.updatedAt = {
				...(prismaFilters.updatedAt || {}),
				gt: new Date(filters.updatedAfter),
			};
		}

		return prismaFilters;
	} catch (error) {
		logger.error('Error mapeando filtros de folder para Prisma:', error);
		return {};
	}
}

/**
 * 🔄 Mapea datos para creación a formato Prisma
 *
 * @param data Datos para crear carpeta
 * @returns Datos para Prisma
 */
export function mapCreateFolderDataToPrisma(data: FolderCreateInput): any {
	try {
		const prismaData: any = { ...data };

		// Normalizar path
		if (data.path) {
			prismaData.path = normalizeFolderPath(data.path);
		}

		// Si no hay path pero hay nombre y parentId, generarlo
		if (!data.path && data.name && data.parentId) {
			// En un caso real, buscaríamos el path del padre
			// y concatenaríamos el nombre
			prismaData.path = `/parent-path/${data.name}`;
		}

		// Manejar objetos complejos como metadata
		if (data.metadata && typeof data.metadata === 'object') {
			prismaData.metadata = data.metadata;
		}

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de creación de folder para Prisma:', error);
		return data;
	}
}

/**
 * 🔄 Mapea datos para actualización a formato Prisma
 *
 * @param data Datos para actualizar carpeta
 * @returns Datos para Prisma
 */
export function mapUpdateFolderDataToPrisma(data: FolderUpdateInput): any {
	try {
		const prismaData: any = { ...data };

		// Normalizar path si existe
		if (data.path) {
			prismaData.path = normalizeFolderPath(data.path);
		}

		// Manejar objetos complejos como metadata
		if (data.metadata && typeof data.metadata === 'object') {
			prismaData.metadata = data.metadata;
		}

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de folder para Prisma:', error);
		return data;
	}
}

/**
 * 🔄 Transforma un objeto FolderComplete a formato Prisma
 *
 * @param folder Objeto FolderComplete
 * @returns Datos para Prisma
 */
export function transformCompleteFolderToPrisma(folder: FolderComplete): any {
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
export function transformFolderToPrisma(folder: Folder): any {
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
