/**
 * @file Funciones para mapear datos de la entidad Concept a formatos de Drizzle.
 * @module transformers/concept/mappers
 * @description Estas funciones se encargan de transformar la entrada de la aplicación
 * (ej. desde formularios o actions) a los tipos que Drizzle espera para las operaciones de BD.

 */

import type {
	ConceptBase,
	ConceptCreateInput,
	ConceptFilters,
	ConceptSearchOptions,
	ConceptUpdateInput,
} from '@/types/entities/concept';
import { ConceptSortOption } from '@/types/entities/concept';

// Tipos locales equivalentes a Drizzle
type DrizzleConceptCreateInput = {
	id?: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;

	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	complexity?: string | null;
	applications?: string | null;
	examples?: string | null;
	relatedConcepts?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
};

type DrizzleConceptUpdateInput = {
	name?: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;

	isFavorite?: boolean;
	totalImages?: number;
	totalVideos?: number;
	type?: string | null;
	complexity?: string | null;
	applications?: string | null;
	examples?: string | null;
	relatedConcepts?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
	updatedAt?: Date;
};

type DrizzleConceptWhereInput = {
	id?: string;
	name?: { contains?: string };
	description?: { contains?: string };
	category?: { in?: string[] } | string;

	isFavorite?: boolean;
	type?: { in?: string[] };
	complexity?: { in?: string[] };
	applications?: { contains?: string };
	examples?: { contains?: string };
	relatedConcepts?: { contains?: string };
	notes?: { contains?: string };
	featuredImage?: { contains?: string };
	parentId?: string;
	OR?: DrizzleConceptWhereInput[];
	tagEntities?: { some?: { id?: { in?: string[] } } };
};

type DrizzleConceptOrderByInput = {
	name?: 'asc' | 'desc';
	createdAt?: 'asc' | 'desc';
	updatedAt?: 'asc' | 'desc';
	category?: 'asc' | 'desc';
};

type DrizzleConceptFindManyArgs = {
	where?: DrizzleConceptWhereInput;
	orderBy?: DrizzleConceptOrderByInput;
	skip?: number;
	take?: number;
	include?: any;
};

/**
 * Mapea la entrada de creación de un concepto al formato de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param input - Los datos para crear el concepto, incluyendo IDs de relaciones.
 * @returns Datos listos para inserción en Drizzle.
 */
export function toCreateDataDrizzle(input: ConceptCreateInput): DrizzleConceptCreateInput {
	const {
		imageIds,
		videoIds,
		albumIds,
		collectionIds,
		tagIds,
		characterIds,
		placeIds,
		worldItemIds,
		promptIds,
		noteIds,
		wildcardIds,
		propertyIds,
		groupIds,
		...rest
	} = input;

	return {
		...rest,
		id: crypto.randomUUID(),
		emoji: input.emoji || '💡',
		color: input.color || '#3b82f6',
		category: input.category || 'general',

		isFavorite: input.isFavorite || false,
		totalImages: input.totalImages || 0,
		totalVideos: input.totalVideos || 0,
		type: input.type || null,
		complexity: input.complexity || null,
		applications: input.applications || null,
		examples: input.examples || null,
		relatedConcepts: input.relatedConcepts || null,
		notes: input.notes || null,
		featuredImage: input.featuredImage || null,
		parentId: input.parentId || null,
		createdAt: new Date(),
		updatedAt: new Date(),
		// Nota: Las relaciones se manejan por separado en Drizzle
		// imageIds, videoIds, etc. se procesarán en tablas de unión después de la inserción
	};
}

/**
 * Mapea la entrada de actualización de un concepto al formato de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param input - Los datos para actualizar el concepto. Puede ser parcial.
 * @returns Datos listos para actualización en Drizzle.
 */
export function toUpdateDataDrizzle(input: ConceptUpdateInput): DrizzleConceptUpdateInput {
	const {
		imageIds,
		videoIds,
		albumIds,
		collectionIds,
		tagIds,
		characterIds,
		placeIds,
		worldItemIds,
		promptIds,
		noteIds,
		wildcardIds,
		propertyIds,
		groupIds,
		...rest
	} = input;

	const data: DrizzleConceptUpdateInput = {
		...rest,
		updatedAt: new Date(),
	};

	// Nota: Las relaciones se manejan por separado en Drizzle
	// imageIds, videoIds, etc. se procesarán en tablas de unión en operaciones separadas

	return data;
}

/**
 * Crea la cláusula `orderBy` para las consultas de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param options - Opciones de búsqueda que contienen el `sortBy` y `sortOrder`.
 * @returns El objeto `orderBy` para Drizzle.
 */
export function createOrderByDrizzle(options: ConceptSearchOptions = {}): DrizzleConceptOrderByInput | undefined {
	if (options.sortBy && options.sortOrder) {
		return { [options.sortBy]: options.sortOrder } as DrizzleConceptOrderByInput;
	}
	return { updatedAt: 'desc' };
}

/**
 * Crea la cláusula `where` para las consultas de Drizzle a partir de los filtros.
 * ✅ MIGRADO A DRIZZLE
 * @param filters - Los filtros de búsqueda de la aplicación.
 * @returns El objeto `where` para Drizzle.
 */
export function createFilterDrizzle(filters: ConceptSearchOptions = {}): DrizzleConceptWhereInput {
	const conditions: Partial<DrizzleConceptWhereInput> = {};

	if (filters?.search) {
		const search = filters.search.trim();
		conditions.OR = [
			{ name: { contains: search } },
			{ description: { contains: search } },
			{ applications: { contains: search } },
			{ examples: { contains: search } },
			{ relatedConcepts: { contains: search } },
			{ notes: { contains: search } },
		];
	}

	if (filters?.category) {
		const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
		conditions.category = { in: categories };
	}

	if (filters?.onlyFavorites) {
		conditions.isFavorite = true;
	}

	if (filters?.tags && filters.tags.length > 0) {
		conditions.tagEntities = { some: { id: { in: filters.tags } } };
	}

	return conditions as DrizzleConceptWhereInput;
}

/**
 * Mapea las opciones de búsqueda de la aplicación a los argumentos de consulta de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param options - Opciones de búsqueda de la aplicación.
 * @returns Argumentos para consultas de Drizzle.
 */
export function toSearchOptionsDrizzle(options: ConceptSearchOptions = {}): DrizzleConceptFindManyArgs {
	const skip = options.page && options.pageSize ? (options.page - 1) * options.pageSize : undefined;
	const take = options.pageSize;

	return {
		where: createFilterDrizzle(options),
		orderBy: createOrderByDrizzle(options),
		skip,
		take,
		include: { _count: true },
	};
}

/**
 * Procesa una lista de conceptos aplicando filtros, ordenamiento y paginación
 * ✅ MIGRADO A DRIZZLE
 * @param concepts - Lista de conceptos base
 * @param filters - Filtros a aplicar
 * @param sortBy - Criterio de ordenamiento
 * @param page - Página actual
 * @param pageSize - Tamaño de página
 * @returns Objeto con los conceptos procesados y metadatos
 */
export function processConcepts(
	concepts: ConceptBase[],
	filters: ConceptFilters,
	sortBy: ConceptSortOption,
	page: number,
	pageSize: number
): { items: ConceptBase[]; total: number } {
	let filteredConcepts = [...concepts];

	// Aplicar filtros
	if (filters.search) {
		const searchTerm = filters.search.toLowerCase();
		filteredConcepts = filteredConcepts.filter(
			(concept) =>
				concept.name.toLowerCase().includes(searchTerm) ||
				concept.description?.toLowerCase().includes(searchTerm) ||
				concept.content?.toLowerCase().includes(searchTerm)
		);
	}

	if (filters.category) {
		filteredConcepts = filteredConcepts.filter((concept) => concept.category === filters.category);
	}

	if (filters.onlyFavorites) {
		filteredConcepts = filteredConcepts.filter((concept) => concept.isFavorite);
	}

	// Aplicar ordenamiento
	filteredConcepts.sort((a, b) => {
		switch (sortBy) {
			case ConceptSortOption.NAME_ASC:
				return a.name.localeCompare(b.name);
			case ConceptSortOption.NAME_DESC:
				return b.name.localeCompare(a.name);
			case ConceptSortOption.CREATED_ASC:
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			case ConceptSortOption.CREATED_DESC:
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			case ConceptSortOption.UPDATED_ASC:
				return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
			case ConceptSortOption.UPDATED_DESC:
			default:
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
		}
	});

	// Aplicar paginación
	const startIndex = (page - 1) * pageSize;
	const endIndex = startIndex + pageSize;
	const paginatedConcepts = filteredConcepts.slice(startIndex, endIndex);

	return {
		items: paginatedConcepts,
		total: filteredConcepts.length,
	};
}

// Mantener funciones legacy con nombres de Drizzle por compatibilidad (DEPRECATED)
/**
 * @deprecated Usar toCreateDataDrizzle en su lugar
 */
export const toCreateData = toCreateDataDrizzle;

/**
 * @deprecated Usar toUpdateDataDrizzle en su lugar
 */
export const toUpdateData = toUpdateDataDrizzle;

/**
 * @deprecated Usar createOrderByDrizzle en su lugar
 */
export const createOrderBy = createOrderByDrizzle;

/**
 * @deprecated Usar createFilterDrizzle en su lugar
 */
export const createFilter = createFilterDrizzle;

/**
 * @deprecated Usar toSearchOptionsDrizzle en su lugar
 */
export const toSearchOptions = toSearchOptionsDrizzle;
