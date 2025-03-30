/**
 * @file Funciones de mapeo para la entidad Concept
 * @module transformers/concept/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	ConceptBase,
	ConceptExtended,
	ConceptFilters,
	ConceptSortOption,
	ConceptWithStats,
	CreateConceptData,
	UpdateConceptData
} from '@/types/entities/concept';
import {
	deserializeTags,
	serializeTags,
	toConceptComplete,
	toConceptExtendedComplete,
	toConceptWithStatsComplete
} from './serializers';

const mappersLogger = serverLogger.withContext('ConceptMappers');

/**
 * Prepara datos para crear un concepto, serializando campos JSON
 * @param data Datos con posibles campos deserializados
 * @returns Datos serializados listos para la base de datos
 */
export function toCreateConceptData(data: CreateConceptData): any {
	try {
		// Serializar tags si es un array
		const tags = Array.isArray(data.tags)
			? deserializeTags(data.tags)
			: typeof data.tags === 'string'
				? data.tags // Ya es un string, posiblemente JSON
				: 'empty_array';

		return {
			name: data.name,
			emoji: data.emoji || '💡',
			color: data.color || '#3b82f6',
			description: data.description ?? null,
			content: data.content || '',
			category: data.category || 'general',
			tags,
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
			// Conexiones con otros modelos
			groups: data.groupIds ? {
				connect: data.groupIds.map((id) => ({ id })),
			} : undefined,
			properties: data.propertyIds ? {
				connect: data.propertyIds.map((id) => ({ id })),
			} : undefined,
			wildcards: data.wildcardIds ? {
				connect: data.wildcardIds.map((id) => ({ id })),
			} : undefined,
		};
	} catch (error) {
		mappersLogger.error('❌ Error en toCreateConceptData:', error);
		// En caso de error, devolver un objeto básico válido
		return {
			name: data.name,
			content: '',
			category: 'general',
			tags: 'empty_array',
		};
	}
}

/**
 * Prepara datos para actualizar un concepto, serializando campos JSON
 * @param id ID del concepto a actualizar
 * @param data Datos con posibles campos deserializados
 * @returns Datos serializados listos para la base de datos
 */
export function toUpdateConceptData(id: string, data: UpdateConceptData): any {
	try {
		const updateData: any = {};

		// Copiar solo campos presentes
		if (data.name !== undefined) updateData.name = data.name;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.content !== undefined) updateData.content = data.content;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		// Manejar tags especialmente si está presente
		if (data.tags !== undefined) {
			updateData.tags = Array.isArray(data.tags)
				? deserializeTags(data.tags)
				: typeof data.tags === 'string'
					? data.tags // Ya es un string, posiblemente JSON
					: 'empty_array';
		}

		// Manejar conexiones con otros modelos si están presentes
		if (data.groupIds !== undefined) {
			updateData.groups = {
				set: data.groupIds.map((id) => ({ id })),
			};
		}

		if (data.propertyIds !== undefined) {
			updateData.properties = {
				set: data.propertyIds.map((id) => ({ id })),
			};
		}

		if (data.wildcardIds !== undefined) {
			updateData.wildcards = {
				set: data.wildcardIds.map((id) => ({ id })),
			};
		}

		return updateData;
	} catch (error) {
		mappersLogger.error('❌ Error en toUpdateConceptData:', error);
		// En caso de error, devolver un objeto mínimo
		return { id };
	}
}

/**
 * Mapea datos de concepto a un objeto con estadísticas para UI
 * @param concept Concepto con datos de estadísticas
 * @returns Concepto con estadísticas formateado para UI
 */
export function toConceptWithStats(concept: any): ConceptWithStats {
	try {
		// Primero deserializar campos JSON
		const conceptWithTags = toConceptWithStatsComplete(concept);

		// Asegurar la estructura correcta de _count
		const counts = concept._count || {};

		return {
			...conceptWithTags,
			_count: {
				images: counts.images || 0,
				characters: counts.characters || 0,
				places: counts.places || 0,
				worldItems: counts.worldItems || 0,
				notes: counts.notes || 0,
				prompts: counts.prompts || 0,
				groups: counts.groups || 0,
				properties: counts.properties || 0,
				wildcards: counts.wildcards || 0,
			},
		};
	} catch (error) {
		mappersLogger.error('❌ Error en toConceptWithStats:', error);
		// En caso de error, devolver objeto original con estructura mínima
		return {
			...concept,
			_count: {
				images: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				notes: 0,
				prompts: 0,
				groups: 0,
				properties: 0,
				wildcards: 0,
			},
		};
	}
}

/**
 * Mapea datos de creación de concepto a formato Prisma
 * @param data Datos para crear un concepto
 * @returns Objeto con formato para Prisma
 * @deprecated Use toCreateConceptData instead
 */
export function mapCreateConceptDataToPrisma(data: any): any {
	mappersLogger.warn('⚠️ Usando función obsoleta mapCreateConceptDataToPrisma. Use toCreateConceptData en su lugar.');
	return toCreateConceptData(data);
}

/**
 * Mapea datos de actualización de concepto a formato Prisma
 * @param data Datos para actualizar un concepto
 * @returns Objeto con formato para Prisma
 * @deprecated Use toUpdateConceptData instead
 */
export function mapUpdateConceptDataToPrisma(data: any): any {
	mappersLogger.warn('⚠️ Usando función obsoleta mapUpdateConceptDataToPrisma. Use toUpdateConceptData en su lugar.');

	if (data?.id) {
		return toUpdateConceptData(data.id, data);
	}

	const updateData: any = {};

	// Solo incluir campos que están presentes en el objeto data
	if (data.name !== undefined) updateData.name = data.name;
	if (data.emoji !== undefined) updateData.emoji = data.emoji;
	if (data.color !== undefined) updateData.color = data.color;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.content !== undefined) updateData.content = data.content;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
	if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

	// Manejar relaciones si están presentes
	if (data.groupIds !== undefined) {
		updateData.groups = {
			set: data.groupIds.map((id: string) => ({ id })),
		};
	}

	if (data.propertyIds !== undefined) {
		updateData.properties = {
			set: data.propertyIds.map((id: string) => ({ id })),
		};
	}

	if (data.wildcardIds !== undefined) {
		updateData.wildcards = {
			set: data.wildcardIds.map((id: string) => ({ id })),
		};
	}

	return updateData;
}

/**
 * Filtra una lista de conceptos según criterios
 * @param concepts Lista de conceptos
 * @param filters Criterios de filtrado
 * @returns Lista filtrada de conceptos
 */
export function filterConcepts(concepts: ConceptBase[], filters: ConceptFilters = {}): ConceptBase[] {
	mappersLogger.info('🔍 Filtrando conceptos con criterios:', filters);

	return concepts.filter((concept) => {
		// Filtro por búsqueda
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			const nameMatch = concept.name.toLowerCase().includes(searchLower);
			const descMatch = concept.description?.toLowerCase().includes(searchLower) || false;
			const contentMatch = concept.content?.toLowerCase().includes(searchLower) || false;

			if (!nameMatch && !descMatch && !contentMatch) {
				return false;
			}
		}

		// Filtro por categoría
		if (filters.category) {
			if (concept.category !== filters.category) {
				return false;
			}
		}

		// Filtro por etiquetas
		if (filters.tags && filters.tags.length > 0) {
			const conceptTags = serializeTags(concept.tags);
			const hasMatchingTag = filters.tags.some(tag => conceptTags.includes(tag));
			if (!hasMatchingTag) {
				return false;
			}
		}

		// Filtro por favoritos
		if (filters.onlyFavorites) {
			if (!concept.isFavorite) {
				return false;
			}
		}

		return true;
	});
}

/**
 * Ordena una lista de conceptos según criterio especificado
 * @param concepts Lista de conceptos
 * @param sortBy Criterio de ordenación
 * @returns Lista ordenada de conceptos
 */
export function sortConcepts(concepts: ConceptBase[], sortBy: ConceptSortOption = 'name_asc'): ConceptBase[] {
	mappersLogger.info('🔄 Ordenando conceptos por:', sortBy);

	// Clonar array para no modificar el original
	const sortedConcepts = [...concepts];

	// Determinar qué campo usar para ordenar
	const [field, direction] = sortBy.split('_');
	const isAsc = direction !== 'desc';

	// Ordenar según criterio
	return sortedConcepts.sort((a, b) => {
		let valueA: any = null;
		let valueB: any = null;

		// Determinar valores a comparar
		switch (field) {
			case 'name':
				valueA = a.name.toLowerCase();
				valueB = b.name.toLowerCase();
				break;
			case 'category':
				valueA = a.category.toLowerCase();
				valueB = b.category.toLowerCase();
				break;
			case 'createdAt':
				valueA = new Date(a.createdAt).getTime();
				valueB = new Date(b.createdAt).getTime();
				break;
			case 'updatedAt':
				valueA = new Date(a.updatedAt).getTime();
				valueB = new Date(b.updatedAt).getTime();
				break;
			default:
				valueA = a.name.toLowerCase();
				valueB = b.name.toLowerCase();
		}

		// Comparar valores
		if (valueA < valueB) return isAsc ? -1 : 1;
		if (valueA > valueB) return isAsc ? 1 : -1;
		return 0;
	});
}

/**
 * Pagina una lista de conceptos
 * @param concepts Lista de conceptos
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Subconjunto paginado de conceptos
 */
export function paginateConcepts(concepts: ConceptBase[], page = 1, pageSize = 20): ConceptBase[] {
	const startIndex = (page - 1) * pageSize;
	return concepts.slice(startIndex, startIndex + pageSize);
}

/**
 * Procesa una lista de conceptos aplicando filtros, ordenación y paginación
 * @param concepts Lista de conceptos
 * @param filters Filtros a aplicar
 * @param sortBy Criterio de ordenación
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Conceptos procesados, total y total de páginas
 */
export function processConcepts(
	concepts: ConceptBase[],
	filters: ConceptFilters = {},
	sortBy: ConceptSortOption = 'name_asc',
	page = 1,
	pageSize = 20
): { items: ConceptExtended[]; total: number; totalPages: number } {
	// Aplicar transformaciones en secuencia
	const filtered = filterConcepts(concepts, filters);
	const sorted = sortConcepts(filtered, sortBy);
	const paginated = paginateConcepts(sorted, page, pageSize);

	// Calcular total y páginas
	const total = filtered.length;
	const totalPages = Math.ceil(total / pageSize);

	// Transformar a formato extendido
	const items = paginated.map(concept => {
		// Usar los nuevos transformadores en secuencia
		const complete = toConceptComplete(concept);
		return toConceptExtendedComplete(complete);
	});

	return { items, total, totalPages };
}
