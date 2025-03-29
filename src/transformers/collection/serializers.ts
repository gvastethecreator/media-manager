/**
 * @file Funciones de serialización/deserialización para la entidad Collection
 * @module transformers/collection/serializers
 */

import type {
  CollectionComplete,
  CollectionEdition,
  CollectionExtended,
  CollectionFilter,
  CollectionSummary
} from '@/types/entities/collection';
import type { Collection as PrismaCollection } from '@prisma/client';

/**
 * Transforma un objeto Collection de Prisma a un objeto CollectionExtended
 * @param collection Collection de Prisma
 * @returns CollectionExtended con propiedades adicionales
 */
export function toCollectionExtended(collection: PrismaCollection | CollectionComplete): CollectionExtended {
	return {
		...collection,
		// Propiedades adicionales de UI
		isSelected: false,
		isHovered: false,
		isOpen: false,
		isLoading: false,
		hasError: false,
		// Calculados/runtime
		parsedFilters: 'filters' in collection && Array.isArray(collection.filters)
			? collection.filters
			: parseCollectionFilters(collection.filters),
		imageCount: 0,
		totalValue: collection.price || 0,
	};
}

/**
 * Transforma un objeto Collection de Prisma a un objeto CollectionComplete
 * con todos los campos JSON deserializados
 * @param collection Collection de Prisma
 * @returns CollectionComplete con campos JSON deserializados
 */
export function toCollectionComplete(collection: PrismaCollection): CollectionComplete {
	return {
		...collection,
		filters: parseCollectionFilters(collection.filters),
		sortBy: parseSortBy(collection.sortBy),
		editions: parseEditions(collection.editions),
	};
}

/**
 * Transforma un CollectionComplete a un objeto PrismaCollection
 * con todos los campos JSON serializados
 * @param collection CollectionComplete con campos deserializados
 * @returns PrismaCollection con campos serializados para guardar en BD
 */
export function fromCollectionComplete(collection: CollectionComplete): PrismaCollection {
	const { filters, sortBy, editions, ...rest } = collection;

	return {
		...rest,
		filters: serializeCollectionFilters(filters),
		sortBy: serializeSortBy(sortBy),
		editions: serializeEditions(editions),
	} as PrismaCollection;
}

/**
 * Transforma un Collection en un resumen para listados
 * @param collection Collection a resumir
 * @param imageCount Cantidad de imágenes opcional
 * @returns CollectionSummary con datos básicos
 */
export function toCollectionSummary(
	collection: PrismaCollection | CollectionExtended,
	imageCount?: number
): CollectionSummary {
	return {
		id: collection.id,
		name: collection.name,
		emoji: collection.emoji || '🌟',
		color: collection.color || '#3b82f6',
		imageCount: imageCount || 0,
		category: collection.category || undefined,
	};
}

/**
 * Prepara los datos de una colección para guardar en la base de datos
 * Elimina propiedades que no son parte del modelo Prisma
 * @param collection Collection con datos extendidos
 * @returns Datos limpios para guardar en BD
 */
export function toPrismaCollection(collection: Partial<CollectionExtended>): Partial<PrismaCollection> {
	// Extraer solo las propiedades que existen en PrismaCollection
	const {
		id,
		name,
		emoji,
		description,
		color,
		shortcut,
		sortBy,
		filters,
		url,
		alternativeUrl,
		sourceImage,
		platform,
		price,
		editions,
		featuredImage,
		isFavorite,
		createdAt,
		updatedAt,
		category,
		...restProps
	} = collection;

	// Serializar los campos JSON
	const serializedFilters = collection.parsedFilters
		? serializeCollectionFilters(collection.parsedFilters)
		: filters;

	const serializedEditions = typeof editions === 'string'
		? editions
		: serializeEditions(editions as CollectionEdition[]);

	const serializedSortBy = typeof sortBy === 'string'
		? sortBy
		: serializeSortBy(sortBy);

	return {
		id,
		name,
		emoji,
		description,
		color,
		shortcut,
		sortBy: serializedSortBy,
		filters: serializedFilters,
		url,
		alternativeUrl,
		sourceImage,
		platform,
		price,
		editions: serializedEditions,
		featuredImage,
		isFavorite,
		createdAt,
		updatedAt,
		category,
		...(restProps as any),  // Resto de propiedades compatibles con PrismaCollection
	};
}

/**
 * Parsea una cadena de filtros a un array de objetos CollectionFilter
 * @param filtersStr Cadena serializada de filtros
 * @returns Array de objetos CollectionFilter
 */
export function parseCollectionFilters(filtersStr: string): CollectionFilter[] {
	try {
		// Si es "empty_array", retornar un array vacío
		if (!filtersStr || filtersStr === 'empty_array') {
			return [];
		}

		// Intentar parsear el JSON
		const parsedFilters = JSON.parse(filtersStr);

		// Validar que sea un array
		if (!Array.isArray(parsedFilters)) {
			return [];
		}

		return parsedFilters;
	} catch (error) {
		console.error('Error al parsear filtros de colección:', error);
		return [];
	}
}

/**
 * Serializa un array de filtros a formato JSON string
 * @param filters Array de CollectionFilter
 * @returns String serializado
 */
export function serializeCollectionFilters(filters: CollectionFilter[]): string {
	try {
		if (!filters || filters.length === 0) {
			return 'empty_array';
		}

		return JSON.stringify(filters);
	} catch (error) {
		console.error('Error al serializar filtros de colección:', error);
		return 'empty_array';
	}
}

/**
 * Parsea una cadena de criterio de ordenación a su objeto respectivo
 * @param sortByStr Cadena serializada del criterio de ordenación
 * @returns Objeto de criterio de ordenación
 */
export function parseSortBy(sortByStr: string): any {
	try {
		if (!sortByStr || sortByStr === 'null' || sortByStr === '{}') {
			return {};
		}

		return JSON.parse(sortByStr);
	} catch (error) {
		console.error('Error al parsear criterio de ordenación:', error);
		return {};
	}
}

/**
 * Serializa un objeto de criterio de ordenación a string JSON
 * @param sortBy Objeto de criterio de ordenación
 * @returns String serializado
 */
export function serializeSortBy(sortBy: any): string {
	try {
		if (!sortBy || Object.keys(sortBy).length === 0) {
			return '{}';
		}

		return JSON.stringify(sortBy);
	} catch (error) {
		console.error('Error al serializar criterio de ordenación:', error);
		return '{}';
	}
}

/**
 * Parsea una cadena de ediciones a un array de objetos CollectionEdition
 * @param editionsStr Cadena serializada de ediciones
 * @returns Array de objetos CollectionEdition
 */
export function parseEditions(editionsStr: string): CollectionEdition[] {
	try {
		if (!editionsStr || editionsStr === 'empty_array' || editionsStr === '[]') {
			return [];
		}

		const parsedEditions = JSON.parse(editionsStr);

		if (!Array.isArray(parsedEditions)) {
			return [];
		}

		return parsedEditions;
	} catch (error) {
		console.error('Error al parsear ediciones de colección:', error);
		return [];
	}
}

/**
 * Serializa un array de ediciones a formato JSON string
 * @param editions Array de CollectionEdition
 * @returns String serializado
 */
export function serializeEditions(editions: CollectionEdition[]): string {
	try {
		if (!editions || editions.length === 0) {
			return '[]';
		}

		return JSON.stringify(editions);
	} catch (error) {
		console.error('Error al serializar ediciones de colección:', error);
		return '[]';
	}
}
