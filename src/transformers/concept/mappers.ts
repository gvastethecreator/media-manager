/**
 * @file Funciones de mapeo para la entidad Concept
 * @module transformers/concept/mappers
 */

import { Prisma } from '@prisma/client';
import {
	ConceptBase,
	ConceptComplete,
	ConceptCreateInput,
	ConceptFilters,
	ConceptSearchOptions,
	ConceptSearchResult,
	ConceptSortCriteria,
	ConceptUpdateInput,
	CONCEPT_SORT_PROPERTY_MAP,
} from '@/types/entities/concept/types';
import { createLogger } from '@/utils/logger';
import { deserializeTags, fromPrismaConcept, serializeTags, toPrismaConcept } from './serializers';

const logger = createLogger('ConceptMapper');

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
			isFavorite: data.isFavorite || false,
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
		if (data.isFavorite !== undefined) result.isFavorite = data.isFavorite;

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
 * Mapea opciones de búsqueda a un formato compatible con Prisma
 * @param options Opciones de búsqueda
 * @returns Opciones formateadas para Prisma
 */
export function toSearchOptions(options: ConceptSearchOptions = {}): {
	where: any;
	orderBy: any;
	skip?: number;
	take?: number;
	include?: any;
} {
	try {
		const {
			filters = {},
			sortBy = ConceptSortCriteria.NAME_ASC,
			page = 1,
			pageSize = 20,
			includeRelations = false,
			includeStats = false
		} = options;

		// Construir condiciones de búsqueda
		const where = toSearchFilters(filters);

		// Determinar ordenación
		const sortProperty = CONCEPT_SORT_PROPERTY_MAP[sortBy as ConceptSortCriteria] || 'name';
		const sortDirection = sortBy.toString().endsWith(':desc') ? 'desc' : 'asc';
		const orderBy = { [sortProperty]: sortDirection };

		// Calcular paginación
		const skip = (page - 1) * pageSize;
		const take = pageSize;

		// Inclusiones
		const include: any = {};

		if (includeStats) {
			include._count = {
				select: {
					images: true,
					videos: true,
					albums: true,
					collections: true,
					tagEntities: true,
					characters: true,
					places: true,
					worldItems: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
				}
			};
		}

		if (includeRelations) {
			include.images = true;
			include.videos = true;
			include.albums = true;
			include.collections = true;
			include.tagEntities = true;
			include.characters = true;
			include.places = true;
			include.worldItems = true;
			include.prompts = true;
			include.notes = true;
			include.wildcards = true;
			include.properties = true;
			include.groups = true;
		}

		return {
			where,
			orderBy,
			skip,
			take,
			...(Object.keys(include).length ? { include } : {})
		};
	} catch (error) {
		logger.error('Error en toSearchOptions:', error);
		throw new Error(`Error al mapear opciones de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * Mapea filtros de búsqueda a condiciones Prisma
 * @param filters Filtros de búsqueda
 * @returns Condiciones para Prisma
 */
export function toSearchFilters(filters: ConceptFilters = {}): any {
	try {
		const conditions: any[] = [];

		// Filtrar por texto de búsqueda
		if (filters.searchQuery) {
			conditions.push({
				OR: [
					{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
					{ content: { contains: filters.searchQuery, mode: 'insensitive' } },
				],
			});
		}

		// Filtrar por categorías
		if (filters.categories && filters.categories.length > 0) {
			conditions.push({
				category: { in: filters.categories },
			});
		}

		// Filtrar favoritos
		if (filters.onlyFavorites) {
			conditions.push({
				isFavorite: true,
			});
		}

		// Filtrar por contenido específico
		if (filters.contentContains) {
			conditions.push({
				content: { contains: filters.contentContains, mode: 'insensitive' },
			});
		}

		// Combinar todas las condiciones con AND
		return conditions.length > 0 ? { AND: conditions } : {};
	} catch (error) {
		logger.error('Error en toSearchFilters:', error);
		throw new Error(`Error al mapear filtros de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * Mapea un array de conceptos a un resultado de búsqueda con paginación
 * @param concepts Conceptos a mapear
 * @param options Opciones de búsqueda
 * @param total Total de conceptos sin paginar
 * @returns Resultado de búsqueda formateado
 */
export function toSearchResult(
	concepts: ConceptBase[],
	options: ConceptSearchOptions = {},
	total: number
): ConceptSearchResult {
	try {
		const { page = 1, pageSize = 20 } = options;
		const totalPages = Math.ceil(total / pageSize);

		// Deserializar campos JSON
		const items = concepts.map(concept => fromPrismaConcept(concept, {
			includeUI: true,
			includeStats: true,
			includeRelations: true
		}));

		return {
			items: items as ConceptComplete[],
			total,
			totalPages
		};
	} catch (error) {
		logger.error('Error en toSearchResult:', error);
		throw new Error(`Error al mapear resultado de búsqueda: ${(error as Error).message}`);
	}
}

/**
 * Mapea un concepto a un formato relacionado para usar en listas o relaciones
 * @param concept Concepto a mapear
 * @returns Concepto formateado para relaciones
 */
export function toRelatedConcept(concept: ConceptBase): {
	id: string;
	name: string;
	excerpt: string;
	relationStrength?: number;
} {
	try {
		// Deserializar el concepto
		const deserialized = fromPrismaConcept(concept);

		// Generar extracto
		const excerpt = concept.content
			? concept.content.substring(0, 100) + (concept.content.length > 100 ? '...' : '')
			: '';

		return {
			id: concept.id,
			name: concept.name,
			excerpt,
		};
	} catch (error) {
		logger.error('Error en toRelatedConcept:', error);
		return {
			id: concept.id,
			name: concept.name || 'Concepto sin nombre',
			excerpt: '',
		};
	}
}

// Funciones obsoletas con advertencias

/**
 * @deprecated Use toCreateConceptData en su lugar
 */
export function mapCreateConceptDataToPrisma(data: any): any {
	logger.warn('Función obsoleta: mapCreateConceptDataToPrisma. Use toCreateConceptData en su lugar.');
	return toCreateConceptData(data as ConceptCreateInput);
}

/**
 * @deprecated Use toUpdateConceptData en su lugar
 */
export function mapUpdateConceptDataToPrisma(data: any): any {
	logger.warn('Función obsoleta: mapUpdateConceptDataToPrisma. Use toUpdateConceptData en su lugar.');
	return toUpdateConceptData(data as ConceptUpdateInput);
}

/**
 * @deprecated Use toSearchFilters y filtrado directo en la base de datos
 */
export function filterConcepts(concepts: ConceptBase[], filters: ConceptFilters = {}): ConceptBase[] {
	logger.warn('Función obsoleta: filterConcepts. Use toSearchFilters y filtrado directo en la base de datos.');

	let filtered = [...concepts];

	if (filters.searchQuery) {
		const query = filters.searchQuery.toLowerCase();
		filtered = filtered.filter(concept =>
			concept.name.toLowerCase().includes(query) ||
			(concept.description && concept.description.toLowerCase().includes(query)) ||
			concept.content.toLowerCase().includes(query)
		);
	}

	if (filters.categories && filters.categories.length > 0) {
		filtered = filtered.filter(concept =>
			filters.categories!.includes(concept.category)
		);
	}

	if (filters.onlyFavorites) {
		filtered = filtered.filter(concept => concept.isFavorite);
	}

	if (filters.contentContains) {
		const content = filters.contentContains.toLowerCase();
		filtered = filtered.filter(concept =>
			concept.content.toLowerCase().includes(content)
		);
	}

	return filtered;
}

/**
 * @deprecated Use toSearchOptions con ordenación en base de datos
 */
export function sortConcepts(
	concepts: ConceptBase[],
	sortBy: ConceptSortCriteria = ConceptSortCriteria.NAME_ASC
): ConceptBase[] {
	logger.warn('Función obsoleta: sortConcepts. Use toSearchOptions con ordenación en base de datos.');

	const sortProperty = CONCEPT_SORT_PROPERTY_MAP[sortBy];
	const isDescending = sortBy.toString().endsWith(':desc');

	return [...concepts].sort((a, b) => {
		let valueA: any = (a as any)[sortProperty];
		let valueB: any = (b as any)[sortProperty];

		// Manejar fechas
		if (sortProperty === 'createdAt' || sortProperty === 'updatedAt') {
			valueA = new Date(valueA).getTime();
			valueB = new Date(valueB).getTime();
		}

		if (isDescending) {
			return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
		} else {
			return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
		}
	});
}

/**
 * @deprecated Use toSearchOptions con paginación en base de datos
 */
export function paginateConcepts(
	concepts: ConceptBase[],
	page = 1,
	pageSize = 20
): ConceptBase[] {
	logger.warn('Función obsoleta: paginateConcepts. Use toSearchOptions con paginación en base de datos.');

	const startIndex = (page - 1) * pageSize;
	const endIndex = startIndex + pageSize;

	return concepts.slice(startIndex, endIndex);
}

/**
 * @deprecated Use toSearchOptions y toSearchResult
 */
export function processConcepts(
	concepts: ConceptBase[],
	filters: ConceptFilters = {},
	sortBy: ConceptSortCriteria = ConceptSortCriteria.NAME_ASC,
	page = 1,
	pageSize = 20
): ConceptSearchResult {
	logger.warn('Función obsoleta: processConcepts. Use toSearchOptions y toSearchResult.');

	// Filtrar
	const filtered = filterConcepts(concepts, filters);

	// Ordenar
	const sorted = sortConcepts(filtered, sortBy);

	// Total sin paginar
	const total = sorted.length;

	// Paginar
	const paginated = paginateConcepts(sorted, page, pageSize);

	// Deserializar
	const items = paginated.map(concept => fromPrismaConcept(concept, {
		includeUI: true
	})) as ConceptComplete[];

	return {
		items,
		total,
		totalPages: Math.ceil(total / pageSize)
	};
}
