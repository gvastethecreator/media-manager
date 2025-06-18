/**
 * @file Funciones de mapeo para la entidad Property
 * @module transformers/property/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    CreatePropertySchema,
    PropertyFiltersSchema,
    PropertySearchOptionsSchema,
    UpdatePropertySchema,
} from '@/types/entities/property/schema';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import {
    PropertyBase,
    PropertySortCriteria,
    PropertyWithRelations,
} from '@/types/entities/property';
import { TransformerError } from '@/utils/transformers/errors';
import { fromPrismaProperty, generatePropertyColor, generatePropertyEmoji } from './serializers';

// Infer types from Zod schemas
export type CreatePropertyData = z.infer<typeof CreatePropertySchema>;
export type PropertyUpdateInput = z.infer<typeof UpdatePropertySchema>;
export type PropertyFilters = z.infer<typeof PropertyFiltersSchema>;
export type PropertySearchOptions = z.infer<typeof PropertySearchOptionsSchema>;

/**
 * Generic search result type
 */
export interface SearchResult<T> {
	items: T[];
	total: number;
	totalPages: number;
	page: number;
	pageSize: number;
}

/**
 * Property search result type
 */
export type PropertySearchResult = SearchResult<PropertyWithRelations>;

/**
 * Map for sorting criteria
 * NOTE: 'usage' is not a direct field in PropertyBase and will require special handling in the service.
 */
export const PROPERTY_SORT_PROPERTY_MAP: { [key in PropertySortCriteria]: string } = {
	[PropertySortCriteria.NAME_ASC]: 'name',
	[PropertySortCriteria.NAME_DESC]: 'name',
	[PropertySortCriteria.USAGE_ASC]: 'usage', // Placeholder
	[PropertySortCriteria.USAGE_DESC]: 'usage', // Placeholder
	[PropertySortCriteria.CREATED_ASC]: 'createdAt',
	[PropertySortCriteria.CREATED_DESC]: 'createdAt',
	[PropertySortCriteria.UPDATED_ASC]: 'updatedAt',
	[PropertySortCriteria.UPDATED_DESC]: 'updatedAt',
};

// Logger específico para este módulo
const logger = serverLogger.child({ module: 'PropertyTransformer:Mappers' });

/**
 * Mapea datos de creación de propiedad a formato compatible con Prisma
 * @param data Datos de creación de propiedad
 * @returns Objeto formateado para Prisma
 */
export function toCreatePropertyData(data: CreatePropertyData): Prisma.PropertyCreateInput {
	try {
		return {
			name: data.name,
			emoji: data.emoji || generatePropertyEmoji(data.name, data.category),
			color: data.color || generatePropertyColor(data.name),
			description: data.description || null,
			shortcut: data.shortcut || null,
			category: data.category || 'general',
			featuredImage: data.featuredImage || null,
			favorite: data.isFavorite || false,
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación de Property', { error });
		throw new TransformerError('Error mapeando datos de creación');
	}
}

/**
 * Mapea datos de actualización de propiedad a formato compatible con Prisma
 * @param data Datos de actualización de propiedad
 * @returns Objeto formateado para Prisma
 */
export function toUpdatePropertyData(data: PropertyUpdateInput): Prisma.PropertyUpdateInput {
	try {
		// Crear objeto solo con las propiedades definidas
		const prismaData: Prisma.PropertyUpdateInput = {};

		if (data.name !== undefined) prismaData.name = data.name;
		if (data.emoji !== undefined) prismaData.emoji = data.emoji;
		if (data.color !== undefined) prismaData.color = data.color;
		if (data.description !== undefined) prismaData.description = data.description;
		if (data.shortcut !== undefined) prismaData.shortcut = data.shortcut;
		if (data.category !== undefined) prismaData.category = data.category;
		if (data.featuredImage !== undefined) prismaData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) prismaData.favorite = data.isFavorite;

		return prismaData;
	} catch (error) {
		logger.error('Error mapeando datos de actualización de Property', { error });
		throw new TransformerError('Error mapeando datos de actualización');
	}
}

/**
 * Mapea opciones de búsqueda a formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Objeto de opciones para Prisma
 */
export function toSearchOptions(options: PropertySearchOptions = {}): {
	skip?: number;
	take?: number;
	orderBy?: any;
	where?: any;
	include?: any;
} {
	try {
		const { page = 1, pageSize = 20, sortBy = PropertySortCriteria.NAME_ASC, filters = {}, include = {} } = options;

		// Calcular paginación
		const skip = (page - 1) * pageSize;
		const take = pageSize;

		// Mapear filtros
		const where = toSearchFilters(filters);

		// Mapear ordenación
		const orderByProperty = PROPERTY_SORT_PROPERTY_MAP[sortBy];
		const orderByDirection = sortBy.endsWith(':desc') ? 'desc' : 'asc';
		const orderBy = { [orderByProperty]: orderByDirection };

		// Mapear inclusiones
		const includeOptions: any = {};

		if (include.images) includeOptions.images = true;
		if (include.videos) includeOptions.videos = true;
		if (include.albums) includeOptions.albums = true;
		if (include.collections) includeOptions.collections = true;
		if (include.tags) includeOptions.tags = true;
		if (include.characters) includeOptions.characters = true;
		if (include.places) includeOptions.places = true;
		if (include.worldItems) includeOptions.worldItems = true;
		if (include.concepts) includeOptions.concepts = true;
		if (include.prompts) includeOptions.prompts = true;
		if (include.notes) includeOptions.notes = true;
		if (include.wildcards) includeOptions.wildcards = true;
		if (include.groups) includeOptions.groups = true;

		// Incluir conteos si se solicita alguna relación
		if (Object.keys(includeOptions).length > 0) {
			includeOptions._count = {
				select: Object.keys(includeOptions).reduce(
					(acc, key) => {
						acc[key] = true;
						return acc;
					},
					{} as Record<string, boolean>
				),
			};
		}

		return { skip, take, orderBy, where, include: includeOptions };
	} catch (error) {
		logger.error('Error mapeando opciones de búsqueda de Property', { error });
		return { skip: 0, take: 20 };
	}
}

/**
 * Mapea filtros de propiedad a formato compatible con Prisma para consultas
 * @param filters Filtros de propiedad
 * @returns Objeto de condiciones para Prisma
 */
export function toSearchFilters(filters: PropertyFilters): any {
	try {
		const where: Record<string, any> = {};

		// Filtrar por término de búsqueda
		if (filters.searchQuery) {
			where.OR = [
				{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
				{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
			];
		}

		// Filtrar por categorías
		if (filters.categories && filters.categories.length > 0) {
			where.category = { in: filters.categories };
		}

		// Filtrar favoritos
		if (filters.onlyFavorites) {
			where.favorite = true;
		}

		return where;
	} catch (error) {
		logger.error('Error mapeando filtros de Property', { error });
		return {};
	}
}

/**
 * Mapea un array de propiedades a un resultado de búsqueda con paginación
 * @param properties Propiedades a mapear
 * @param total Total de propiedades sin paginar
 * @param options Opciones de búsqueda
 * @returns Resultado de búsqueda formateado
 */
export function toSearchResult(
	properties: (PropertyBase & { _count?: any })[],
	total: number,
	options: PropertySearchOptions = {}
): PropertySearchResult {
	try {
		const { page = 1, pageSize = 20 } = options;
		const totalPages = Math.ceil(total / pageSize);

		// Deserializar campos JSON
		const items = properties.map((property) =>
			fromPrismaProperty(property, {
				includeUI: true,
				includeStats: true,
				includeRelations: true,
			})
		);

		return {
			items: items as PropertyWithRelations[],
			total,
			totalPages,
			page,
			pageSize,
		};
	} catch (error) {
		logger.error('Error generando resultado de búsqueda', { error });
		throw new TransformerError('Error generando resultado de búsqueda');
	}
}

/**
 * Convierte una propiedad a formato simplificado para relaciones
 * @param property Propiedad con posibles conteos
 * @returns Propiedad formateada para relaciones
 */
export function toRelatedProperty(property: PropertyBase & { _count?: any }): {
	id: string;
	name: string;
	color: string;
	emoji: string;
	itemCount: number;
} {
	const itemCount = property._count
		? Object.values(property._count).reduce((acc: number, count: any) => acc + (count as number), 0)
		: 0;

	return {
		id: property.id,
		name: property.name,
		color: property.color,
		emoji: property.emoji,
		itemCount,
	};
}