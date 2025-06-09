/**
 * @file Funciones de serialización/deserialización para la entidad Collection
 * @module transformers/collection/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    CollectionComplete,
    CollectionEdition,
    CollectionExtended,
    CollectionFilter,
    CollectionSummary,
} from '@/types/entities/collection';
import {
    type CollectionBase,
    type CollectionCreateInput,
    CollectionSchema,
    type CollectionUpdateInput,
} from '@/types/entities/collection/types';
import {
    deserializeJsonField,
    serializeJsonField,
    validateFieldType,
    validateRequiredFields,
} from '@/utils/transformers/common';
import { handleTransformerError } from '@/utils/transformers/errors';
import { getRelationCounts, preparePrismaRelations, validateEntityRelations } from '@/utils/transformers/relations';
import { validateBaseEntity, validateMetadataFields } from '@/utils/transformers/validation';
import type { Prisma, Collection as PrismaCollection } from '@prisma/client';

const logger = serverLogger.withContext('CollectionSerializer');

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
		parsedFilters:
			'filters' in collection && Array.isArray(collection.filters)
				? collection.filters
				: parseCollectionFiltersFromString(collection.filters),
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
		filters: parseCollectionFiltersFromString(collection.filters),
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
 * 🔄 Serializa una Collection para Prisma
 */
export function toPrismaCollection(
	data: CollectionCreateInput | CollectionUpdateInput
): Prisma.CollectionCreateInput | Prisma.CollectionUpdateInput {
	try {
		// Validar campos requeridos para creación
		if (!('id' in data)) {
			validateRequiredFields(data, ['name', 'type']);
		}

		// Validar tipos de datos
		validateFieldType(data.name, 'string', 'name');
		validateFieldType(data.type, 'string', 'type');
		if (data.category) validateFieldType(data.category, 'string', 'category');
		if (data.tags) validateFieldType(data.tags, 'array', 'tags');

		// Serializar campos JSON
		const metadata = serializeJsonField(data.metadata, '{}');
		const settings = serializeJsonField(data.settings, '{}');

		// Preparar relaciones para Prisma
		const relations = preparePrismaRelations('Collection', data);

		return {
			...data,
			metadata,
			settings,
			...relations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Deserializa una Collection desde Prisma
 */
export function fromPrismaCollection(
	prismaCollection: Prisma.CollectionGetPayload<{
		include: {
			owner: true;
			parent: true;
			children: true;
			images: true;
			videos: true;
			albums: true;
			tags: true;
			groups: true;
			characters: true;
			places: true;
			items: true;
			notes: true;
			sharedWith: true;
			_count: true;
		};
	}>
): CollectionComplete {
	try {
		// Deserializar campos JSON
		const metadata = deserializeJsonField(prismaCollection.metadata, {});
		const settings = deserializeJsonField(prismaCollection.settings, {});

		// Obtener conteos de relaciones
		const counts = getRelationCounts('Collection', prismaCollection);

		// Construir objeto base
		const baseCollection: CollectionBase = {
			id: prismaCollection.id,
			name: prismaCollection.name,
			description: prismaCollection.description,
			type: prismaCollection.type,
			category: prismaCollection.category,
			tags: prismaCollection.tags?.map((tag) => tag.name),
			isPublic: prismaCollection.isPublic,
			isFavorite: prismaCollection.isFavorite,
			metadata,
			settings,
			createdAt: prismaCollection.createdAt,
			updatedAt: prismaCollection.updatedAt,
		};

		// Validar objeto base
		validateBaseEntity(baseCollection);
		validateMetadataFields(baseCollection);

		// Construir objeto completo con relaciones
		return {
			...baseCollection,
			owner: prismaCollection.owner ? { id: prismaCollection.owner.id } : undefined,
			parent: prismaCollection.parent ? { id: prismaCollection.parent.id } : undefined,
			children: prismaCollection.children?.map((child) => ({ id: child.id })),
			images: prismaCollection.images?.map((img) => ({ id: img.id })),
			videos: prismaCollection.videos?.map((video) => ({ id: video.id })),
			albums: prismaCollection.albums?.map((album) => ({ id: album.id })),
			tags: prismaCollection.tags?.map((tag) => ({ id: tag.id })),
			groups: prismaCollection.groups?.map((group) => ({ id: group.id })),
			characters: prismaCollection.characters?.map((char) => ({ id: char.id })),
			places: prismaCollection.places?.map((place) => ({ id: place.id })),
			items: prismaCollection.items?.map((item) => ({ id: item.id })),
			notes: prismaCollection.notes?.map((note) => ({ id: note.id })),
			sharedWith: prismaCollection.sharedWith?.map((user) => ({ id: user.id })),
			_count: counts,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Valida una Collection
 */
export function validateCollection(data: unknown): CollectionComplete {
	try {
		const validated = CollectionSchema.parse(data);
		validateEntityRelations('Collection', validated);
		return validated as CollectionComplete;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Extiende una Collection con datos adicionales
 */
export async function extendCollection(
	collection: CollectionComplete,
	options: {
		includeRelations?: boolean;
		includeCount?: boolean;
		customFields?: string[];
	} = {}
): Promise<CollectionComplete> {
	try {
		const extended = { ...collection };

		// Aquí puedes agregar lógica para cargar datos adicionales
		// basado en las opciones proporcionadas

		return extended;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Parsea filtros de Collection
 */
export function parseCollectionFilters(filters: unknown): Record<string, unknown> {
	try {
		if (!filters || typeof filters !== 'object') {
			return {};
		}

		const parsed: Record<string, unknown> = {};
		const typedFilters = filters as Record<string, unknown>;

		// Procesar filtros específicos de Collection
		if (typedFilters.search) {
			parsed.OR = [
				{ name: { contains: typedFilters.search as string, mode: 'insensitive' } },
				{ description: { contains: typedFilters.search as string, mode: 'insensitive' } },
			];
		}

		// Filtros de tipo y categoría
		if (typedFilters.type?.length) {
			parsed.type = { in: typedFilters.type };
		}
		if (typedFilters.category?.length) {
			parsed.category = { in: typedFilters.category };
		}
		if (typedFilters.tags?.length) {
			parsed.tags = { some: { name: { in: typedFilters.tags } } };
		}

		// Filtros de estado
		if (typedFilters.isPublic !== undefined) {
			parsed.isPublic = typedFilters.isPublic;
		}
		if (typedFilters.isFavorite !== undefined) {
			parsed.isFavorite = typedFilters.isFavorite;
		}

		// Filtros de relaciones
		if (typedFilters.hasParent) {
			parsed.parent = { isNot: null };
		}
		if (typedFilters.hasChildren) {
			parsed.children = { some: {} };
		}
		if (typedFilters.hasImages) {
			parsed.images = { some: {} };
		}
		if (typedFilters.hasVideos) {
			parsed.videos = { some: {} };
		}
		if (typedFilters.hasAlbums) {
			parsed.albums = { some: {} };
		}
		if (typedFilters.isShared) {
			parsed.sharedWith = { some: {} };
		}

		// Filtros de fecha
		if (typedFilters.dateRange?.start) {
			parsed.createdAt = { ...parsed.createdAt, gte: typedFilters.dateRange.start };
		}
		if (typedFilters.dateRange?.end) {
			parsed.createdAt = { ...parsed.createdAt, lte: typedFilters.dateRange.end };
		}

		return parsed;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * Parsea una cadena de filtros a un array de objetos CollectionFilter
 * @param filtersStr Cadena serializada de filtros
 * @returns Array de objetos CollectionFilter
 */
export function parseCollectionFiltersFromString(filtersStr: string): CollectionFilter[] {
	try {
		// Si es "[]", retornar un array vacío
		if (!filtersStr || filtersStr === '[]') {
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
			return '[]';
		}

		return JSON.stringify(filters);
	} catch (error) {
		console.error('Error al serializar filtros de colección:', error);
		return '[]';
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
