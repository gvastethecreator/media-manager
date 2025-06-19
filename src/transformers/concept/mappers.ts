/**
 * @file Funciones para transformar datos de conceptos
 * @module transformers/concept/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { Concept, ConceptBase, ConceptSearchOptions, ConceptSearchResult } from '@/types/entities/concept';
import type { ConceptFilters, ConceptSortCriteria } from '@/types/entities/concept/extended';
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('ConceptMapper');

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
export function toCreateConceptData(data: Partial<Concept>): Prisma.ConceptCreateInput {
	return {
		name: data.name || 'Nuevo Concepto',
		emoji: data.emoji || '💡',
		color: data.color || '#3b82f6',
		description: data.description ?? null,
		content: data.content || '',
		category: data.category || 'general',
		tags: data.tags ? JSON.stringify(data.tags) : '[]',
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
	};
}

/**
 * Mapea un concepto para su actualización en la base de datos
 * @param data Datos para actualizar el concepto
 * @returns Datos formateados para Prisma
 */
export function toUpdateConceptData(data: Partial<Concept>): Prisma.ConceptUpdateInput {
	const result: Prisma.ConceptUpdateInput = {};
	if (data.name !== undefined) result.name = data.name;
	if (data.emoji !== undefined) result.emoji = data.emoji;
	if (data.color !== undefined) result.color = data.color;
	if (data.description !== undefined) result.description = data.description;
	if (data.content !== undefined) result.content = data.content;
	if (data.category !== undefined) result.category = data.category;
	if (data.featuredImage !== undefined) result.featuredImage = data.featuredImage;
	if (data.isFavorite !== undefined) result.isFavorite = data.isFavorite;
	if (data.tags !== undefined) result.tags = JSON.stringify(data.tags);
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
 * Deserializa el campo `tags` de un concepto si es una cadena JSON.
 * @param concept - El concepto a procesar.
 * @returns El concepto con el campo `tags` como un array de strings.
 */
function deserializeConceptTags(concept: ConceptBase): ConceptBase {
	if (typeof concept.tags === 'string') {
		try {
			return { ...concept, tags: JSON.parse(concept.tags) };
		} catch (error) {
			logger.warn(`Error al deserializar tags para el concepto ${concept.id}. Se devolverá un array vacío.`);
			return { ...concept, tags: [] };
		}
	}
	return concept;
}

/**
 * Convierte un concepto a un formato plano para la exportación
 * @param concept Concepto original
 * @returns Concepto en formato plano
 */
export function toPlainConcept(concept: ConceptBase): Record<string, any> {
	try {
		const deserializedConcept = deserializeConceptTags(concept);
		return {
			id: deserializedConcept.id,
			name: deserializedConcept.name,
			emoji: deserializedConcept.emoji,
			color: deserializedConcept.color,
			description: deserializedConcept.description,
			content: deserializedConcept.content,
			category: deserializedConcept.category,
			tags: deserializedConcept.tags,
			featuredImage: deserializedConcept.featuredImage,
			isFavorite: deserializedConcept.isFavorite,
			createdAt: deserializedConcept.createdAt,
			updatedAt: deserializedConcept.updatedAt,
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
			tags: [],
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
		let result = concepts.map(deserializeConceptTags);

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

		if (filters.tags && filters.tags.length > 0) {
			result = result.filter((c) => {
				const conceptTags = Array.isArray(c.tags) ? c.tags : [];
				return filters.tags!.some((tag) => conceptTags.includes(tag));
			});
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
