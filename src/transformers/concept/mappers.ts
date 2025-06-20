/**
 * @file Funciones para transformar datos de conceptos
 * @module transformers/concept/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ConceptBase } from '@/types/entities/concept';
import type { ConceptFilters } from '@/types/entities/concept/extended';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('ConceptMapper');

/**
 * Interfaces para búsqueda de conceptos
 */
export interface ConceptSearchOptions {
	filters?: ConceptFilters;
	sortBy?: string;
	page?: number;
	pageSize?: number;
	includeRelations?: boolean;
}

export interface ConceptSearchResult {
	items: ConceptBase[];
	total: number;
	totalPages: number;
}

// Enum para criterios de ordenación
export enum ConceptSortCriteria {
	NAME_ASC = 'NAME_ASC',
	NAME_DESC = 'NAME_DESC',
	CREATED_AT_ASC = 'CREATED_AT_ASC',
	CREATED_AT_DESC = 'CREATED_AT_DESC',
	UPDATED_AT_ASC = 'UPDATED_AT_ASC',
	UPDATED_AT_DESC = 'UPDATED_AT_DESC',
	CATEGORY_ASC = 'CATEGORY_ASC',
	CATEGORY_DESC = 'CATEGORY_DESC',
}

/**
 * Interfaces para los tipos de Prisma que necesitamos
 */
export interface PrismaConceptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

export interface PrismaConceptUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
}

export interface PrismaConceptFindManyArgs {
	where?: PrismaConceptWhereInput;
	orderBy?: PrismaConceptOrderByInput;
	skip?: number;
	take?: number;
	include?: Record<string, boolean>;
}

export interface PrismaConceptWhereInput {
	AND?: PrismaConceptWhereInput[];
	OR?: PrismaConceptWhereInput[];
	name?: { contains: string; mode: string };
	description?: { contains: string; mode: string };
	content?: { contains: string; mode: string };
	category?: string;
	tags?: { contains: string; mode: string };
	isFavorite?: boolean;
}

export interface PrismaConceptOrderByInput {
	name?: 'asc' | 'desc';
	createdAt?: 'asc' | 'desc';
	updatedAt?: 'asc' | 'desc';
	category?: 'asc' | 'desc';
}

// Mapa de propiedades para ordenación
export const CONCEPT_SORT_PROPERTY_MAP: Record<ConceptSortCriteria, keyof Prisma.ConceptOrderByWithRelationInput> = {
	NAME_ASC: 'name',
	NAME_DESC: 'name',
	CREATED_AT_ASC: 'createdAt',
	CREATED_AT_DESC: 'createdAt',
	UPDATED_AT_ASC: 'updatedAt',
	UPDATED_AT_DESC: 'updatedAt',
	CATEGORY_ASC: 'category',
	CATEGORY_DESC: 'category',
};

/**
 * Opciones para operaciones de concepto
 */
export interface ConceptOperationOptions {
	select?: Record<string, boolean>;
	include?: Record<string, boolean>;
	validateFields?: boolean;
	throwIfNotFound?: boolean;
}

/**
 * Mapea un concepto para su creación en la base de datos
 * @param data Datos para crear el concepto
 * @returns Datos formateados para Prisma
 */
export function toCreateConceptData(data: Partial<ConceptBase>): Prisma.ConceptCreateInput {
	return {
		name: data.name || 'Nuevo Concepto',
		emoji: data.emoji || '💡',
		color: data.color || '#3b82f6',
		description: data.description ?? null,
		content: data.content || '',
		category: data.category || 'general',
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
	};
}

/**
 * Mapea un concepto para su actualización en la base de datos
 * @param data Datos para actualizar el concepto
 * @returns Datos formateados para Prisma
 */
export function toUpdateConceptData(data: Partial<ConceptBase>): Prisma.ConceptUpdateInput {
	const result: Prisma.ConceptUpdateInput = {};
	if (data.name !== undefined) result.name = data.name;
	if (data.emoji !== undefined) result.emoji = data.emoji;
	if (data.color !== undefined) result.color = data.color;
	if (data.description !== undefined) result.description = data.description;
	if (data.content !== undefined) result.content = data.content;
	if (data.category !== undefined) result.category = data.category;
	if (data.featuredImage !== undefined) result.featuredImage = data.featuredImage;
	if (data.isFavorite !== undefined) result.isFavorite = data.isFavorite;
	return result;
}

/**
 * Mapea opciones de búsqueda al formato necesario para Prisma
 * @param options Opciones de búsqueda
 * @returns Opciones formateadas para Prisma
 */
export function toSearchOptions(options: ConceptSearchOptions = {}): Prisma.ConceptFindManyArgs {
	try {
		const where = toSearchFilters(options.filters || {});
		const sortBy = options.sortBy || 'NAME_ASC';
		const propertyName = CONCEPT_SORT_PROPERTY_MAP[sortBy] || 'name';
		const direction = sortBy.includes('DESC') ? 'desc' : 'asc';

		const orderBy: Prisma.ConceptOrderByWithRelationInput = {
			[propertyName]: direction,
		};

		const result: Prisma.ConceptFindManyArgs = {
			where,
			orderBy,
		};

		if (options.page !== undefined && options.pageSize !== undefined) {
			const page = Math.max(1, options.page);
			const pageSize = Math.max(1, options.pageSize);
			result.skip = (page - 1) * pageSize;
			result.take = pageSize;
		}

		if (options.includeRelations) {
			result.include = {
				images: true,
				_count: {
					select: {
						images: true,
					},
				},
			};
		}

		return result;
	} catch (error) {
		logger.error('Error en toSearchOptions:', error);
		throw new Error(`Error al mapear opciones de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * Convierte filtros de búsqueda al formato necesario para Prisma
 * @param filters Filtros de búsqueda
 * @returns Filtros formateados para Prisma
 */
export function toSearchFilters(filters: ConceptFilters = {}): Prisma.ConceptWhereInput {
	try {
		const conditions: Prisma.ConceptWhereInput[] = [];

		if (filters.search) {
			const textFilter = filters.search.trim();
			if (textFilter) {
				conditions.push({
					OR: [
						{ name: { contains: textFilter, mode: 'insensitive' } },
						{ description: { contains: textFilter, mode: 'insensitive' } },
						{ content: { contains: textFilter, mode: 'insensitive' } },
					],
				});
			}
		}

		if (filters.category) {
			conditions.push({ category: { equals: filters.category } });
		}

		if (filters.tags && filters.tags.length > 0) {
			const tagsConditions: Prisma.ConceptWhereInput[] = filters.tags.map((tag: string) => ({
				tags: { contains: tag, mode: 'insensitive' },
			}));
			conditions.push({ OR: tagsConditions });
		}

		if (filters.onlyFavorites !== undefined) {
			conditions.push({ isFavorite: filters.onlyFavorites });
		}

		if (conditions.length > 0) {
			return { AND: conditions };
		}

		return {};
	} catch (error) {
		logger.error('Error en toSearchFilters:', error);
		throw new Error(`Error al mapear filtros de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * Convierte resultados de búsqueda al formato de respuesta
 * @param concepts Conceptos encontrados
 * @param total Total de conceptos
 * @param options Opciones de búsqueda
 * @returns Resultado formateado
 */
export function toSearchResult(
	concepts: ConceptBase[],
	total: number,
	options: ConceptSearchOptions = {},
): ConceptSearchResult {
	try {
		const pageSize = options.pageSize ?? 20;
		const totalPages = Math.ceil(total / pageSize);
		return {
			items: concepts,
			total,
			totalPages,
		};
	} catch (error) {
		logger.error('Error en toSearchResult:', error);
		throw new Error(`Error al mapear resultado de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * Convierte un concepto a un formato plano para la exportación
 * @param concept Concepto original
 * @returns Concepto en formato plano
 */
export function toPlainConcept(concept: ConceptBase): Record<string, any> {
	try {
		return {
			id: concept.id,
			name: concept.name,
			emoji: concept.emoji,
			color: concept.color,
			description: concept.description,
			content: concept.content,
			category: concept.category,
			featuredImage: concept.featuredImage,
			isFavorite: concept.isFavorite,
			createdAt: concept.createdAt,
			updatedAt: concept.updatedAt,
		};
	} catch (error) {
		logger.error('Error en toPlainConcept:', error);
		return {
			id: concept.id,
			name: concept.name,
			emoji: concept.emoji,
			color: concept.color,
			description: concept.description,
			content: concept.content,
			category: concept.category,
			featuredImage: null,
			isFavorite: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}

/**
 * Filtra conceptos según criterios
 * @param concepts Lista de conceptos
 * @param filters Filtros a aplicar
 * @returns Lista filtrada de conceptos
 */
export function filterConcepts(concepts: ConceptBase[], filters: ConceptFilters = {}): ConceptBase[] {
	try {
		let result = concepts;

		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			result = result.filter(
				(c) =>
					c.name.toLowerCase().includes(searchLower) ||
					(c.description && c.description.toLowerCase().includes(searchLower)) ||
					(c.content && c.content.toLowerCase().includes(searchLower)),
			);
		}

		if (filters.category) {
			result = result.filter((c) => c.category === filters.category);
		}

		if (filters.onlyFavorites) {
			result = result.filter((c) => c.isFavorite);
		}

		return result;
	} catch (error) {
		logger.error('Error en filterConcepts:', error);
		return concepts;
	}
}
