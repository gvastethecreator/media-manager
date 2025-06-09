/**
 * @file Funciones para transformar datos de conceptos
 * @module transformers/concept/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { ConceptCreateInput, ConceptUpdateInput } from '@/types/entities/concept/base';
import type { ConceptFilters } from '@/types/entities/concept/extended';
import {
	CONCEPT_SORT_PROPERTY_MAP,
	ConceptBase,
	ConceptSearchOptions as ConceptSearchOptionsType,
	ConceptSearchResult,
	ConceptSortCriteria,
} from '@/types/entities/concept/types';
import type { Prisma } from '@prisma/client';
import { deserializeTags } from './serializers';

const logger = serverLogger.withContext('ConceptMapper');

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
export function toCreateConceptData(data: any): Prisma.ConceptCreateInput {
	try {
		const result: Prisma.ConceptCreateInput = {
			name: data.name,
			emoji: data.emoji || '💡',
			color: data.color || '#3b82f6',
			description: data.description ?? null,
			content: data.content || '',
			category: data.category || 'general',
			tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : (data.tags || '[]'), // serializa si es array
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
		};

		// Relaciones: solo si existen en el input
		if (Array.isArray(data.groupIds) && data.groupIds.length) result.groups = { connect: data.groupIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.propertyIds) && data.propertyIds.length) result.properties = { connect: data.propertyIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.wildcardIds) && data.wildcardIds.length) result.wildcards = { connect: data.wildcardIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.imageIds) && data.imageIds.length) result.images = { connect: data.imageIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.videoIds) && data.videoIds.length) result.videos = { connect: data.videoIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.albumIds) && data.albumIds.length) result.albums = { connect: data.albumIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.collectionIds) && data.collectionIds.length) result.collections = { connect: data.collectionIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.tagIds) && data.tagIds.length) result.tagEntities = { connect: data.tagIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.characterIds) && data.characterIds.length) result.characters = { connect: data.characterIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.placeIds) && data.placeIds.length) result.places = { connect: data.placeIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.worldItemIds) && data.worldItemIds.length) result.worldItems = { connect: data.worldItemIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.promptIds) && data.promptIds.length) result.prompts = { connect: data.promptIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.noteIds) && data.noteIds.length) result.notes = { connect: data.noteIds.map((id: string) => ({ id })) };

		return result;
	} catch (error) {
		logger.error('Error en toCreateConceptData:', error);
		throw new Error(`Error al mapear datos para crear concepto: ${(error as Error).message}`);
	}
}

/**
 * Mapea un concepto para su actualización en la base de datos
 * @param data Datos para actualizar el concepto
 * @returns Datos formateados para Prisma
 */
export function toUpdateConceptData(data: any): Prisma.ConceptUpdateInput {
	try {
		const result: Prisma.ConceptUpdateInput = {};

		if (data.name !== undefined) result.name = data.name;
		if (data.emoji !== undefined) result.emoji = data.emoji;
		if (data.color !== undefined) result.color = data.color;
		if (data.description !== undefined) result.description = data.description;
		if (data.content !== undefined) result.content = data.content;
		if (data.category !== undefined) result.category = data.category;
		if (data.featuredImage !== undefined) result.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) result.isFavorite = data.isFavorite;
		if (data.tags !== undefined) result.tags = Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags;

		// Relaciones: solo si existen en el input
		if (Array.isArray(data.groupIds)) result.groups = { set: data.groupIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.propertyIds)) result.properties = { set: data.propertyIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.wildcardIds)) result.wildcards = { set: data.wildcardIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.imageIds)) result.images = { set: data.imageIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.videoIds)) result.videos = { set: data.videoIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.albumIds)) result.albums = { set: data.albumIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.collectionIds)) result.collections = { set: data.collectionIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.tagIds)) result.tagEntities = { set: data.tagIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.characterIds)) result.characters = { set: data.characterIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.placeIds)) result.places = { set: data.placeIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.worldItemIds)) result.worldItems = { set: data.worldItemIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.promptIds)) result.prompts = { set: data.promptIds.map((id: string) => ({ id })) };
		if (Array.isArray(data.noteIds)) result.notes = { set: data.noteIds.map((id: string) => ({ id })) };

		return result;
	} catch (error) {
		logger.error('Error en toUpdateConceptData:', error);
		throw new Error(`Error al mapear datos para actualizar concepto: ${(error as Error).message}`);
	}
}

// --- Corrección de toSearchOptions y toSearchFilters para tipos y nombres válidos ---
/**
 * Mapea opciones de búsqueda al formato necesario para Prisma
 * @param options Opciones de búsqueda
 * @returns Opciones formateadas para Prisma
 */
export function toSearchOptions(options: ConceptSearchOptionsType = {}): {
	where: any;
	orderBy: any;
	skip?: number;
	take?: number;
	include?: any;
} {
	try {
		const where = toSearchFilters(options.filters || {});
		const orderBy: any = {};
		const sortBy = options.sortBy || ConceptSortCriteria.NAME_ASC;
		const propertyName = CONCEPT_SORT_PROPERTY_MAP[sortBy] || 'name';
		const direction = sortBy.includes('DESC') ? 'desc' : 'asc';
		orderBy[propertyName] = direction;
		const result: {
			where: any;
			orderBy: any;
			skip?: number;
			take?: number;
			include?: any;
		} = {
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
				videos: true,
				albums: true,
				collections: true,
				groups: true,
				properties: true,
				wildcards: true,
				tagEntities: true,
				characters: true,
				places: true,
				worldItems: true,
				prompts: true,
				notes: true,
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
export function toSearchFilters(filters: ConceptFilters = {}): any {
	try {
		const result: any = {};
		const conditions: any[] = [];

		// Filtro por texto (nombre, descripción, contenido)
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

		// Filtro por categoría
		if (filters.category) {
			conditions.push({ category: filters.category });
		}

		// Filtro por tags (en string serializado)
		if (filters.tags && filters.tags.length > 0) {
			const tagsConditions = filters.tags.map((tag: string) => ({
				tags: { contains: tag, mode: 'insensitive' },
			}));
			conditions.push({ OR: tagsConditions });
		}

		// Filtro por favoritos (onlyFavorites)
		if (filters.onlyFavorites !== undefined) {
			conditions.push({ isFavorite: filters.onlyFavorites });
		}

		// Combinar condiciones
		if (conditions.length > 0) {
			if (conditions.length === 1) {
				Object.assign(result, conditions[0]);
			} else {
				result.AND = conditions;
			}
		}

		return result;
	} catch (error) {
		logger.error('Error en toSearchFilters:', error);
		throw new Error(`Error al mapear filtros de búsqueda: ${(error as Error).message}`);
	}
}

// --- Corrección de paginación y resultado de búsqueda ---
export function toSearchResult(
	concepts: ConceptBase[],
	total: number,
	options: ConceptSearchOptionsType = {}
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
export function toPlainConcept(concept: ConceptBase): any {
	try {
		return {
			id: concept.id,
			name: concept.name,
			emoji: concept.emoji,
			color: concept.color,
			description: concept.description,
			content: concept.content,
			category: concept.category,
			tags: Array.isArray(concept.tags) ? concept.tags : deserializeTags(concept.tags as any),
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
			tags: [],
			featuredImage: null,
			isFavorite: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}

/**
 * @deprecated Use toCreateConceptData en su lugar
 */
export function mapCreateConceptDataToPrisma(data: ConceptCreateInput): Prisma.ConceptCreateInput {
	return toCreateConceptData(data);
}

/**
 * @deprecated Use toUpdateConceptData en su lugar
 */
export function mapUpdateConceptDataToPrisma(data: ConceptUpdateInput): Prisma.ConceptUpdateInput {
	return toUpdateConceptData(data);
}

/**
 * Filtra una lista de conceptos según los criterios especificados
 * @param concepts Lista de conceptos a filtrar
 * @param filters Filtros a aplicar
 * @returns Lista de conceptos filtrada
 */
export function filterConcepts(concepts: ConceptBase[], filters: ConceptFilters = {}): ConceptBase[] {
	try {
		let result = [...concepts];

		// Filtrar por texto (search)
		if (filters.search && typeof filters.search === 'string') {
			const textFilter = filters.search.toLowerCase().trim();
			if (textFilter) {
				result = result.filter(
					(concept) =>
						concept.name.toLowerCase().includes(textFilter) ||
						concept.description?.toLowerCase().includes(textFilter) ||
						concept.content.toLowerCase().includes(textFilter)
				);
			}
		}

		// Filtrar por categoría
		if (filters.category) {
			result = result.filter((concept) => concept.category === filters.category);
		}

		// Filtrar por tags (en string serializado)
		if (filters.tags?.length) {
			result = result.filter((concept) => {
				const conceptTags: string[] = Array.isArray(concept.tags) ? concept.tags : deserializeTags(concept.tags as any);
				return filters.tags?.some((tag: string) => conceptTags.includes(tag));
			});
		}

		// Filtrar por favoritos (onlyFavorites)
		if (typeof filters.onlyFavorites === 'boolean') {
			result = result.filter((concept) => !!concept.isFavorite === filters.onlyFavorites);
		}

		return result;
	} catch (error) {
		logger.error('Error en filterConcepts:', error);
		return concepts;
	}
}
