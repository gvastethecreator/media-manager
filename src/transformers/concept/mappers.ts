/**
 * @file Funciones para transformar datos de conceptos
 * @module transformers/concept/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    CONCEPT_SORT_PROPERTY_MAP,
    ConceptBase,
    ConceptCreateInput,
    ConceptFilters,
    ConceptSearchOptions as ConceptSearchOptionsType,
    ConceptSearchResult,
    ConceptSortCriteria,
    ConceptUpdateInput
} from '@/types/entities/concept/types';
import type { Prisma } from '@prisma/client';
import { deserializeTags, serializeTags } from './serializers';

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
export function toCreateConceptData(data: ConceptCreateInput): Prisma.ConceptCreateInput {
    try {
        // Serializar tags si es un array
        const tags = Array.isArray(data.tags)
            ? serializeTags(data.tags)
            : typeof data.tags === 'string'
                ? data.tags // Ya es un string, posiblemente JSON
                : 'empty_array';

        // Construir objeto base
        const result: Prisma.ConceptCreateInput = {
            name: data.name,
            emoji: data.emoji || '💡',
            color: data.color || '#3b82f6',
            description: data.description ?? null,
            content: data.content || '',
            category: data.category || 'general',
            tags,
            featuredImage: data.featuredImage || null,
            favorite: data.isFavorite || false,
        };

        // Agregar relaciones
        if (data.groupIds?.length) {
            result.groups = {
                connect: data.groupIds.map((id) => ({ id })),
            };
        }

        if (data.propertyIds?.length) {
            result.properties = {
                connect: data.propertyIds.map((id) => ({ id })),
            };
        }

        if (data.wildcardIds?.length) {
            result.wildcards = {
                connect: data.wildcardIds.map((id) => ({ id })),
            };
        }

        if (data.imageIds?.length) {
            result.images = {
                connect: data.imageIds.map((id) => ({ id })),
            };
        }

        if (data.videoIds?.length) {
            result.videos = {
                connect: data.videoIds.map((id) => ({ id })),
            };
        }

        if (data.albumIds?.length) {
            result.albums = {
                connect: data.albumIds.map((id) => ({ id })),
            };
        }

        if (data.collectionIds?.length) {
            result.collections = {
                connect: data.collectionIds.map((id) => ({ id })),
            };
        }

        if (data.tagIds?.length) {
            result.tagEntities = {
                connect: data.tagIds.map((id) => ({ id })),
            };
        }

        if (data.characterIds?.length) {
            result.characters = {
                connect: data.characterIds.map((id) => ({ id })),
            };
        }

        if (data.placeIds?.length) {
            result.places = {
                connect: data.placeIds.map((id) => ({ id })),
            };
        }

        if (data.worldItemIds?.length) {
            result.worldItems = {
                connect: data.worldItemIds.map((id) => ({ id })),
            };
        }

        if (data.promptIds?.length) {
            result.prompts = {
                connect: data.promptIds.map((id) => ({ id })),
            };
        }

        if (data.noteIds?.length) {
            result.notes = {
                connect: data.noteIds.map((id) => ({ id })),
            };
        }

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
export function toUpdateConceptData(data: ConceptUpdateInput): Prisma.ConceptUpdateInput {
    try {
        const result: Prisma.ConceptUpdateInput = {};

        // Copiar solo campos presentes
        if (data.name !== undefined) result.name = data.name;
        if (data.emoji !== undefined) result.emoji = data.emoji;
        if (data.color !== undefined) result.color = data.color;
        if (data.description !== undefined) result.description = data.description;
        if (data.content !== undefined) result.content = data.content;
        if (data.category !== undefined) result.category = data.category;
        if (data.featuredImage !== undefined) result.featuredImage = data.featuredImage;
        if (data.isFavorite !== undefined) result.favorite = data.isFavorite;

        // Manejar tags especialmente si está presente
        if (data.tags !== undefined) {
            result.tags = Array.isArray(data.tags)
                ? serializeTags(data.tags)
                : typeof data.tags === 'string'
                    ? data.tags // Ya es un string, posiblemente JSON
                    : 'empty_array';
        }

        // Actualizar relaciones
        if (data.groupIds !== undefined) {
            result.groups = {
                set: data.groupIds.map((id) => ({ id })),
            };
        }

        if (data.propertyIds !== undefined) {
            result.properties = {
                set: data.propertyIds.map((id) => ({ id })),
            };
        }

        if (data.wildcardIds !== undefined) {
            result.wildcards = {
                set: data.wildcardIds.map((id) => ({ id })),
            };
        }

        if (data.imageIds !== undefined) {
            result.images = {
                set: data.imageIds.map((id) => ({ id })),
            };
        }

        if (data.videoIds !== undefined) {
            result.videos = {
                set: data.videoIds.map((id) => ({ id })),
            };
        }

        if (data.albumIds !== undefined) {
            result.albums = {
                set: data.albumIds.map((id) => ({ id })),
            };
        }

        if (data.collectionIds !== undefined) {
            result.collections = {
                set: data.collectionIds.map((id) => ({ id })),
            };
        }

        if (data.tagIds !== undefined) {
            result.tagEntities = {
                set: data.tagIds.map((id) => ({ id })),
            };
        }

        if (data.characterIds !== undefined) {
            result.characters = {
                set: data.characterIds.map((id) => ({ id })),
            };
        }

        if (data.placeIds !== undefined) {
            result.places = {
                set: data.placeIds.map((id) => ({ id })),
            };
        }

        if (data.worldItemIds !== undefined) {
            result.worldItems = {
                set: data.worldItemIds.map((id) => ({ id })),
            };
        }

        if (data.promptIds !== undefined) {
            result.prompts = {
                set: data.promptIds.map((id) => ({ id })),
            };
        }

        if (data.noteIds !== undefined) {
            result.notes = {
                set: data.noteIds.map((id) => ({ id })),
            };
        }

        return result;
    } catch (error) {
        logger.error('Error en toUpdateConceptData:', error);
        throw new Error(`Error al mapear datos para actualizar concepto: ${(error as Error).message}`);
    }
}

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
        // Construir condiciones de búsqueda
        const where = toSearchFilters(options.filters || {});

        // Configurar ordenamiento
        const orderBy: any = {};
        const sortBy = options.sortBy || ConceptSortCriteria.NAME_ASC;
        const propertyName = CONCEPT_SORT_PROPERTY_MAP[sortBy] || 'name';
        const direction = sortBy.includes('_DESC') ? 'desc' : 'asc';
        orderBy[propertyName] = direction;

        // Configurar paginación
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

        // Incluir paginación si se especifica
        if (options.page !== undefined && options.pageSize !== undefined) {
            const page = Math.max(1, options.page);
            const pageSize = Math.max(1, options.pageSize);
            result.skip = (page - 1) * pageSize;
            result.take = pageSize;
        } else if (options.skip !== undefined || options.limit !== undefined) {
            if (options.skip !== undefined) {
                result.skip = Math.max(0, options.skip);
            }
            if (options.limit !== undefined) {
                result.take = Math.max(1, options.limit);
            }
        }

        // Incluir relaciones si se solicitan
        if (options.includeRelations) {
            result.include = {
                images: !!options.includeImages,
                videos: !!options.includeVideos,
                albums: !!options.includeAlbums,
                collections: !!options.includeCollections,
                groups: !!options.includeGroups,
                properties: !!options.includeProperties,
                wildcards: !!options.includeWildcards,
                tagEntities: !!options.includeTags,
                characters: !!options.includeCharacters,
                places: !!options.includePlaces,
                worldItems: !!options.includeWorldItems,
                prompts: !!options.includePrompts,
                notes: !!options.includeNotes,
                _count: !!options.includeCount,
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
        if (filters.searchText) {
            const textFilter = filters.searchText.trim();
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

        // Filtro por tags
        if (filters.tags && filters.tags.length > 0) {
            const tagsConditions = filters.tags.map((tag) => ({
                tags: { contains: tag, mode: 'insensitive' },
            }));
            conditions.push({ OR: tagsConditions });
        }

        // Filtro por favoritos
        if (filters.isFavorite !== undefined) {
            conditions.push({ favorite: filters.isFavorite });
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

/**
 * Formatea el resultado de una búsqueda de conceptos
 * @param concepts Conceptos encontrados
 * @param total Total de resultados sin paginación
 * @param options Opciones de búsqueda utilizadas
 * @returns Resultado de búsqueda formateado
 */
export function toSearchResult(
    concepts: ConceptBase[],
    total: number,
    options: ConceptSearchOptionsType = {}
): ConceptSearchResult {
    try {
        // Calcular valor de hasMore
        let hasMore = false;
        if (options.page !== undefined && options.pageSize !== undefined) {
            const page = Math.max(1, options.page);
            const pageSize = Math.max(1, options.pageSize);
            hasMore = total > page * pageSize;
        } else if (options.skip !== undefined && options.limit !== undefined) {
            hasMore = total > options.skip + options.limit;
        }

        // Construir resultado
        return {
            items: concepts,
            total,
            hasMore,
            page: options.page,
            pageSize: options.pageSize,
            skip: options.skip,
            limit: options.limit,
        };
    } catch (error) {
        logger.error('Error en toSearchResult:', error);
        throw new Error(`Error al mapear resultado de búsqueda: ${(error as Error).message}`);
    }
}

/**
 * Formatea un concepto para ser usado como concepto relacionado
 * @param concept Concepto base
 * @returns Concepto formateado para relación
 */
export function toRelatedConcept(concept: ConceptBase): {
    id: string;
    name: string;
    excerpt: string;
    relationStrength?: number;
} {
    try {
        return {
            id: concept.id,
            name: concept.name,
            excerpt: concept.description || getExcerpt(concept.content),
            relationStrength: 1.0,
        };
    } catch (error) {
        logger.error('Error en toRelatedConcept:', error);
        return {
            id: concept.id,
            name: concept.name || 'Concepto sin nombre',
            excerpt: 'Sin descripción',
            relationStrength: 1.0,
        };
    }
}

/**
 * Obtiene un extracto de texto para previsualización
 * @param text Texto completo
 * @param maxLength Longitud máxima
 * @returns Extracto formateado
 */
function getExcerpt(text?: string, maxLength = 100): string {
    if (!text) return '';
    const trimmed = text.trim();
    return trimmed.length > maxLength
        ? `${trimmed.slice(0, maxLength)}...`
        : trimmed;
}

/**
 * @deprecated Use toCreateConceptData instead
 */
export function mapCreateConceptDataToPrisma(data: ConceptCreateInput): Prisma.ConceptCreateInput {
    return toCreateConceptData(data);
}

/**
 * @deprecated Use toUpdateConceptData instead
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

        // Filtrar por texto
        if (filters.searchText) {
            const textFilter = filters.searchText.toLowerCase().trim();
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

        // Filtrar por tags
        if (filters.tags && filters.tags.length > 0) {
            result = result.filter((concept) => {
                const conceptTags = Array.isArray(concept.tags)
                    ? concept.tags
                    : deserializeTags(concept.tags as any);
                return filters.tags && filters.tags.some((tag) => conceptTags.includes(tag));
            });
        }

        // Filtrar por favoritos
        if (filters.isFavorite !== undefined) {
            result = result.filter((concept) => (concept.favorite || false) === filters.isFavorite);
        }

        return result;
    } catch (error) {
        logger.error('Error en filterConcepts:', error);
        return concepts;
    }
}

/**
 * Ordena una lista de conceptos según el criterio especificado
 * @param concepts Lista de conceptos a ordenar
 * @param sortBy Criterio de ordenación
 * @returns Lista de conceptos ordenada
 */
export function sortConcepts(
    concepts: ConceptBase[],
    sortBy: ConceptSortCriteria = ConceptSortCriteria.NAME_ASC
): ConceptBase[] {
    try {
        const result = [...concepts];

        switch (sortBy) {
            case ConceptSortCriteria.NAME_ASC:
                return result.sort((a, b) => a.name.localeCompare(b.name));
            case ConceptSortCriteria.NAME_DESC:
                return result.sort((a, b) => b.name.localeCompare(a.name));
            case ConceptSortCriteria.CREATED_AT_ASC:
                return result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case ConceptSortCriteria.CREATED_AT_DESC:
                return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case ConceptSortCriteria.UPDATED_AT_ASC:
                return result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
            case ConceptSortCriteria.UPDATED_AT_DESC:
                return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            default:
                return result;
        }
    } catch (error) {
        logger.error('Error en sortConcepts:', error);
        return concepts;
    }
}

/**
 * Pagina una lista de conceptos
 * @param concepts Lista de conceptos a paginar
 * @param page Número de página (comienza en 1)
 * @param pageSize Tamaño de página
 * @returns Lista de conceptos paginada
 */
export function paginateConcepts(
    concepts: ConceptBase[],
    page = 1,
    pageSize = 20
): ConceptBase[] {
    try {
        const validPage = Math.max(1, page);
        const validPageSize = Math.max(1, pageSize);
        const start = (validPage - 1) * validPageSize;
        const end = start + validPageSize;
        return concepts.slice(start, end);
    } catch (error) {
        logger.error('Error en paginateConcepts:', error);
        return concepts;
    }
}

/**
 * @deprecated Use toSearchOptions, filterConcepts, sortConcepts, paginateConcepts and toSearchResult instead
 */
export function processConcepts(
    concepts: ConceptBase[],
    filters: ConceptFilters = {},
    sortBy: ConceptSortCriteria = ConceptSortCriteria.NAME_ASC,
    page = 1,
    pageSize = 20
): ConceptSearchResult {
    // Filtrar
    const filtered = filterConcepts(concepts, filters);

    // Ordenar
    const sorted = sortConcepts(filtered, sortBy);

    // Paginar
    const paginated = paginateConcepts(sorted, page, pageSize);

    // Retornar resultado
    return {
        items: paginated,
        total: filtered.length,
        hasMore: filtered.length > (page * pageSize),
        page,
        pageSize
    };
}
