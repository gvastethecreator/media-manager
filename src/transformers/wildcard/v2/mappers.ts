/**
 * @file Funciones de mapeo para transformación de datos de wildcards (v2)
 * @module transformers/wildcard/v2/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type {
    CreateWildcardData,
    UpdateWildcardData,
    WildcardBase,
    WildcardBulkUpdateData,
    WildcardRelated,
    WildcardSearchFilters,
    WildcardSearchOptions,
} from '@/types/entities/wildcard';
import { DEFAULT_WILDCARD_COLOR, DEFAULT_WILDCARD_EMOJI } from './serializers';

// Logger específico para este módulo
const logger = serverLogger.withContext('WildcardTransformer:Mappers');

/**
 * Mapea datos de creación de wildcard a formato Prisma
 * @param data Datos de creación
 * @returns Datos formateados para Prisma
 */
export function toCreateWildcardData(data: CreateWildcardData): Record<string, any> {
	try {
		const result: Record<string, any> = {
			id: data.id,
			name: data.name,
			emoji: data.emoji || DEFAULT_WILDCARD_EMOJI,
			color: data.color || DEFAULT_WILDCARD_COLOR,
			description: data.description || '',
			shortcut: data.shortcut || '',
			category: data.category || 'general',
			parentId: data.parentId || null,
			isFavorite: data.isFavorite || false,
			featuredImage: data.featuredImage || null,
			children: Array.isArray(data.children) ? JSON.stringify(data.children) : data.children || '[]',
		};

		return result;
	} catch (error) {
		logger.error('Error mapeando datos de creación de wildcard', { error });
		throw new TransformerError('Error mapeando datos de creación de wildcard');
	}
}

/**
 * Mapea datos de actualización de wildcard a formato Prisma
 * @param data Datos de actualización
 * @returns Datos formateados para Prisma
 */
export function toUpdateWildcardData(data: UpdateWildcardData): Record<string, any> {
	try {
		const result: Record<string, any> = {};

		// Solo incluir campos que están presentes en los datos de entrada
		if (data.name !== undefined) result.name = data.name;
		if (data.emoji !== undefined) result.emoji = data.emoji;
		if (data.color !== undefined) result.color = data.color;
		if (data.description !== undefined) result.description = data.description;
		if (data.shortcut !== undefined) result.shortcut = data.shortcut;
		if (data.category !== undefined) result.category = data.category;
		if (data.parentId !== undefined) result.parentId = data.parentId;
		if (data.featuredImage !== undefined) result.featuredImage = data.featuredImage;

		// Manejar conversión de isFavorite a favorite
		if (data.isFavorite !== undefined) {
			result.isFavorite = data.isFavorite;
		}

		// Serializar children si está presente
		if (data.children !== undefined) {
			result.children = typeof data.children === 'string' ? data.children : JSON.stringify(data.children);
		}

		return result;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de wildcard', { error });
		throw new TransformerError('Error mapeando datos de actualización de wildcard');
	}
}

/**
 * Mapea datos para actualizaciones en lote de wildcards
 * @param data Datos de actualización en lote
 * @returns Datos formateados para Prisma
 */
export function toBulkUpdateWildcardData(data: WildcardBulkUpdateData): Record<string, any> {
	try {
		const result: Record<string, any> = {};

		// Solo incluir campos que están presentes en los datos de entrada
		if (data.parentId !== undefined) result.parentId = data.parentId;
		if (data.category !== undefined) result.category = data.category;
		if (data.isFavorite !== undefined) result.isFavorite = data.isFavorite;

		return result;
	} catch (error) {
		logger.error('Error mapeando datos de actualización en lote de wildcards', { error });
		throw new TransformerError('Error mapeando datos de actualización en lote de wildcards');
	}
}

/**
 * Mapea un wildcard a su versión simplificada para relaciones
 * @param wildcard Wildcard a mapear
 * @returns Wildcard relacionado simplificado
 */
export function toWildcardRelated(wildcard: WildcardBase): WildcardRelated {
	return {
		id: wildcard.id,
		name: wildcard.name,
		emoji: wildcard.emoji || DEFAULT_WILDCARD_EMOJI,
		color: wildcard.color || DEFAULT_WILDCARD_COLOR,
		category: wildcard.category || 'general',
		parentId: wildcard.parentId,
		isFavorite: 'favorite' in wildcard ? (wildcard as any).isFavorite : wildcard.isFavorite || false,
	};
}

/**
 * Mapea opciones de búsqueda a formato Prisma
 * @param options Opciones de búsqueda
 * @returns Opciones formateadas para Prisma
 */
export function toSearchOptions(options: WildcardSearchOptions = {}): Record<string, any> {
	try {
		const {
			page = 1,
			limit = 30,
			sortBy = 'updatedAt',
			sortOrder = 'desc',
			searchQuery,
			filters = {},
			includeStats = false,
			includeImages = false,
			includeVideos = false,
			includeAlbums = false,
			includeTags = false,
			includeParent = false,
		} = options;

		// Configurar opciones de paginación
		const skip = (page - 1) * limit;
		const take = limit;

		// Configurar ordenamiento
		const orderBy: Record<string, string> = {
			[sortBy]: sortOrder,
		};

		// Configurar condiciones de búsqueda
		const where: Record<string, any> = {};

		// Aplicar filtros de búsqueda
		if (filters) {
			applyFilters(where, filters);
		}

		// Aplicar búsqueda por texto
		if (searchQuery) {
			where.OR = [{ name: { contains: searchQuery } }, { description: { contains: searchQuery } }];
		}

		// Configurar inclusiones de relaciones
		const include: Record<string, any> = {
			_count: includeStats,
		};

		if (includeParent) {
			include.parent = true;
		}

		if (includeImages) {
			include.images = {
				take: 5,
				orderBy: { updatedAt: 'desc' },
			};
		}

		if (includeVideos) {
			include.videos = {
				take: 5,
				orderBy: { updatedAt: 'desc' },
			};
		}

		if (includeAlbums) {
			include.albums = {
				take: 5,
				orderBy: { updatedAt: 'desc' },
			};
		}

		if (includeTags) {
			include.tags = {
				take: 5,
				orderBy: { updatedAt: 'desc' },
			};
		}

		return { skip, take, orderBy, where, include };
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda', { error });
		throw new TransformerError('Error mapeando opciones de búsqueda');
	}
}

/**
 * Aplica filtros a la consulta de búsqueda
 * @param where Objeto where de Prisma
 * @param filters Filtros a aplicar
 */
function applyFilters(where: Record<string, any>, filters: WildcardSearchFilters): void {
	// Filtrar por categoría
	if (filters.category) {
		where.category = filters.category;
	}

	// Filtrar por parentId
	if (filters.parentId !== undefined) {
		where.parentId = filters.parentId;
	}

	// Filtrar por favoritos
	if (filters.isFavorite !== undefined) {
		where.isFavorite = filters.isFavorite;
	}

	// Filtrar por IDs específicos
	if (filters.ids && filters.ids.length > 0) {
		where.id = { in: filters.ids };
	}

	// Filtrar por IDs a excluir
	if (filters.excludeIds && filters.excludeIds.length > 0) {
		where.id = {
			...where.id,
			notIn: filters.excludeIds,
		};
	}

	// Filtrar por fecha de creación
	if (filters.createdAfter || filters.createdBefore) {
		where.createdAt = {
			...(filters.createdAfter ? { gte: filters.createdAfter } : {}),
			...(filters.createdBefore ? { lte: filters.createdBefore } : {}),
		};
	}

	// Filtrar por fecha de actualización
	if (filters.updatedAfter || filters.updatedBefore) {
		where.updatedAt = {
			...(filters.updatedAfter ? { gte: filters.updatedAfter } : {}),
			...(filters.updatedBefore ? { lte: filters.updatedBefore } : {}),
		};
	}
}
