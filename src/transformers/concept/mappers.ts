/**
 * @file Funciones para mapear datos de la entidad Concept a formatos de Drizzle.
 * @module transformers/concept/mappers
 * @description Estas funciones se encargan de transformar la entrada de la aplicación
 * (ej. desde formularios o actions) a los tipos que Drizzle espera para las operaciones de BD.
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import type {
	ConceptBase,
	ConceptCreateInput,
	ConceptFilters,
	ConceptSearchOptions,
	ConceptSortOption,
	ConceptUpdateInput,
} from '@/types/entities/concept';

// Tipos locales equivalentes a Prisma (migración a Drizzle)
type DrizzleConceptCreateInput = {
	id?: string;
	name: string;
	description?: string | null;
	content?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isFavorite?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
};

type DrizzleConceptUpdateInput = {
	name?: string;
	description?: string | null;
	content?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isFavorite?: boolean;
	updatedAt?: Date;
};

type DrizzleConceptWhereInput = {
	id?: string;
	name?: { contains?: string };
	description?: { contains?: string };
	content?: { contains?: string };
	category?: { in?: string[] } | string;
	isFavorite?: boolean;
	AND?: DrizzleConceptWhereInput[];
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
 * @param options - Opciones de búsqueda que contienen el `orderBy`.
 * @returns El objeto `orderBy` para Drizzle.
 */
export function createOrderByDrizzle(options: ConceptSearchOptions = {}): DrizzleConceptOrderByInput | undefined {
	if (options.orderBy) {
		return options.orderBy as DrizzleConceptOrderByInput;
	}
	return { updatedAt: 'desc' };
}

/**
 * Crea la cláusula `where` para las consultas de Drizzle a partir de los filtros.
 * ✅ MIGRADO A DRIZZLE
 * @param filters - Los filtros de búsqueda de la aplicación.
 * @returns El objeto `where` para Drizzle.
 */
export function createFilterDrizzle(filters: ConceptSearchOptions['filters'] = {}): DrizzleConceptWhereInput {
	const conditions: DrizzleConceptWhereInput[] = [];

	if (filters?.search) {
		const search = filters.search.trim();
		conditions.push({
			OR: [{ name: { contains: search } }, { description: { contains: search } }, { content: { contains: search } }],
		});
	}

	if (filters?.category) {
		const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
		conditions.push({ category: { in: categories } });
	}

	if (filters?.onlyFavorites) {
		conditions.push({ isFavorite: true });
	}

	if (filters?.tags && filters.tags.length > 0) {
		conditions.push({ tagEntities: { some: { id: { in: filters.tags } } } });
	}

	return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Mapea las opciones de búsqueda de la aplicación a los argumentos de consulta de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param options - Opciones de búsqueda de la aplicación.
 * @returns Argumentos para consultas de Drizzle.
 */
export function toSearchOptionsDrizzle(options: ConceptSearchOptions = {}): DrizzleConceptFindManyArgs {
	return {
		where: createFilterDrizzle(options.filters),
		orderBy: createOrderByDrizzle(options),
		skip: options.skip,
		take: options.take,
		include: options.includeRelations ? { _count: true } : undefined,
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
			case 'name':
				return a.name.localeCompare(b.name);
			case 'name-desc':
				return b.name.localeCompare(a.name);
			case 'created':
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			case 'created-desc':
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			case 'updated':
				return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
			case 'updated-desc':
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

// Mantener funciones legacy con nombres de Prisma por compatibilidad (DEPRECATED)
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
