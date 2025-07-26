/**
 * @file Funciones de mapeo para la entidad Prompt
 * @module transformers/prompt/mappers

 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
	PromptBase,
	PromptComplete,
	PromptCreateInput,
	PromptFilters,
	PromptUpdateInput,
	PromptWithRelations,
	PromptWithStats,
	DrizzleCreatePromptData,
	DrizzleUpdatePromptData,
	DrizzleWhereFilter,
	DrizzleOrderBy,
	DrizzleUpdateArgs,
	PromptRelated,
} from '@/types/entities/prompt';
import { PromptSortCriteria } from '@/types/entities/prompt/enums';
import { serializeParameters, serializeTags } from './serializers';

const logger = serverLogger.withContext('PromptMappers');

// #region Tipos auxiliares

type RelationObject = { id: string };
type RelationInput = (string | RelationObject)[];

// #endregion

// #region Funciones de Mapeo a Drizzle

/**
 * Normaliza una relación (array de strings o de objetos con id) a un formato de objetos con id.
 * ✅ MIGRADO A DRIZZLE
 * @param relation El array de la relación a normalizar.
 * @returns Un array de objetos con la propiedad id.
 */
function normalizeRelation(relation: RelationInput | undefined): RelationObject[] {
	if (!relation) return [];
	return relation.map((item) => (typeof item === 'string' ? { id: item } : { id: item.id }));
}

/**
 * 🔄 Mapea datos de creación de Prompt a formato Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de creación.
 * @returns Objeto compatible con inserción en Drizzle.
 */
export function mapCreatePromptDataToDrizzle(data: PromptCreateInput): DrizzleCreatePromptData {
	try {
		const { tags, groups, properties, wildcards, ...restData } = data;

		return {
			...restData,
			emoji: data.emoji || '💬',
			color: data.color || '#3B82F6',
			parameters: serializeParameters(data.parameters),
			tags: serializeTags((tags || []).map((t) => (typeof t === 'string' ? t : t.id))),
			// Las relaciones groups, properties, wildcards, tagEntities se manejan por separado en Drizzle
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación:', { data, error });
		throw new Error(
			`Error al mapear datos de creación de prompt: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Mapea datos de actualización de Prompt a formato Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param id ID del prompt a actualizar.
 * @param data Datos de actualización.
 * @returns Objeto compatible con actualización en Drizzle.
 */
export function mapUpdatePromptDataToDrizzle(id: string, data: PromptUpdateInput): DrizzleUpdateArgs {
	try {
		const { tags, groups, properties, wildcards, parameters, ...restData } = data;
		const updateData: DrizzleUpdatePromptData = { ...restData };

		if (parameters) {
			if (typeof parameters === 'string') {
				updateData.parameters = parameters;
			} else {
				updateData.parameters = JSON.stringify(parameters);
			}
		}
		// Las relaciones tags, groups, properties, wildcards se manejan por separado en Drizzle

		return { set: updateData, where: { id } };
	} catch (error) {
		logger.error('Error mapeando datos de actualización:', { id, data, error });
		throw new Error(
			`Error al mapear datos de actualización: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

// #endregion

// #region Mapeo y Procesamiento de Datos (Filtros, Ordenación, etc.)

/**
 * 🔄 Mapea filtros de Prompt a condiciones `where` de Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param filters Filtros para consultar prompts.
 * @returns Objeto compatible con filtros de Drizzle.
 */
export function mapPromptFiltersToDrizzle(filters: PromptFilters = {}): DrizzleWhereFilter {
	const where: DrizzleWhereFilter = {};

	// Buscar por texto en múltiples campos
	const searchText = filters.searchQuery || filters.search;
	if (searchText) {
		where.OR = [
			{ name: searchText },
			{ content: searchText }
		];
	}

	// Filtrar por categorías
	const categories = filters.categories || filters.category;
	if (categories?.length) {
		where.category = categories;
	}

	// Filtrar por propósitos
	const purposes = filters.purposes || filters.purpose;
	if (purposes?.length) {
		where.purpose = purposes;
	}

	// Filtrar solo favoritos
	if (filters.onlyFavorites || filters.isFavorite) {
		where.isFavorite = true;
	}

	return where;
}

/**
 * 🔄 Mapea criterios de ordenación a formato Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param sortBy Criterio de ordenación.
 * @returns Objeto compatible con ordenación de Drizzle.
 */
export function mapPromptSortCriteriaToDrizzle(
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_AT_DESC
): DrizzleOrderBy {
	const [field, direction] = sortBy.split(':');
	const sortDir = direction === 'asc' ? 'asc' : 'desc';

	switch (field) {
		case 'name':
			return { name: sortDir };
		case 'created':
			return { createdAt: sortDir };
		default:
			return { updatedAt: sortDir };
	}
}

/**
 * 🔄 Mapea un Prompt a un formato simplificado para mostrar en relaciones.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapPromptToRelated(prompt: PromptComplete | PromptWithRelations): PromptRelated {
	return {
		id: prompt.id,
		name: prompt.name,
		description: prompt.description,
		emoji: prompt.emoji,
		color: prompt.color,
		category: prompt.category,
		type: prompt.type,
		createdAt: prompt.createdAt,
		updatedAt: prompt.updatedAt,
	};
}

/**
 * 🔄 Mapea un array de Prompts a un formato simplificado.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapPromptsToRelated(prompts: (PromptComplete | PromptWithRelations)[]): PromptRelated[] {
	return prompts.map(mapPromptToRelated);
}

/**
 * 🔍 Filtra un array de prompts en memoria.
 * ✅ MIGRADO A DRIZZLE
 * @param prompts Array de prompts a filtrar.
 * @param filters Filtros a aplicar.
 * @returns Array filtrado de prompts.
 */
export function filterPrompts(prompts: PromptBase[], filters: PromptFilters = {}): PromptBase[] {
	let filtered = [...prompts];

	// Buscar por texto
	const searchText = filters.searchQuery || filters.search;
	if (searchText) {
		const query = searchText.toLowerCase();
		filtered = filtered.filter(
			(prompt) =>
				prompt.name.toLowerCase().includes(query) ||
				prompt.description?.toLowerCase().includes(query) ||
				prompt.content?.toLowerCase().includes(query)
		);
	}

	// Filtrar por categorías
	const categories = filters.categories || filters.category;
	if (categories?.length) {
		filtered = filtered.filter((prompt) => categories.includes(prompt.category));
	}

	// Filtrar por propósitos
	const purposes = filters.purposes || filters.purpose;
	if (purposes?.length) {
		filtered = filtered.filter((prompt) => purposes.includes(prompt.purpose));
	}

	// Filtrar solo favoritos
	if (filters.onlyFavorites || filters.isFavorite) {
		filtered = filtered.filter((prompt) => prompt.isFavorite);
	}

	return filtered;
}

/**
 * 📄 Pagina un array de elementos.
 * ✅ MIGRADO A DRIZZLE
 * @param items Array de elementos a paginar.
 * @param page Número de página (empezando desde 1).
 * @param limit Número de elementos por página.
 * @returns Objeto con los elementos paginados y metadatos.
 */
export function paginatePrompts<T>(items: T[], page = 1, limit = 20) {
	const offset = (page - 1) * limit;
	const paginatedItems = items.slice(offset, offset + limit);

	return {
		items: paginatedItems,
		totalItems: items.length,
		totalPages: Math.ceil(items.length / limit),
		currentPage: page,
		hasNextPage: page * limit < items.length,
		hasPrevPage: page > 1,
	};
}

/**
 * 📊 Ordena un array de prompts según el criterio especificado.
 * ✅ MIGRADO A DRIZZLE
 * @param prompts Array de prompts a ordenar.
 * @param sortBy Criterio de ordenación.
 * @returns Array ordenado de prompts.
 */
export function sortPrompts(
	prompts: PromptBase[],
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_AT_DESC
): PromptBase[] {
	const [field, direction] = sortBy.split(':');
	const isAsc = direction === 'asc';

	return [...prompts].sort((a, b) => {
		let aValue: any;
		let bValue: any;

		switch (field) {
			case 'name':
				aValue = a.name.toLowerCase();
				bValue = b.name.toLowerCase();
				break;
			case 'created':
				aValue = new Date(a.createdAt);
				bValue = new Date(b.createdAt);
				break;
			default:
				aValue = new Date(a.updatedAt);
				bValue = new Date(b.updatedAt);
				break;
		}

		if (aValue < bValue) return isAsc ? -1 : 1;
		if (aValue > bValue) return isAsc ? 1 : -1;
		return 0;
	});
}

/**
 * 🔄 Procesa un array de prompts aplicando filtros, ordenación y paginación.
 * ✅ MIGRADO A DRIZZLE
 * @param prompts Array de prompts a procesar.
 * @param options Opciones de procesamiento.
 * @returns Resultado procesado con metadatos.
 */
export function processPrompts(
	prompts: PromptBase[],
	options: {
		filters?: PromptFilters;
		sortBy?: PromptSortCriteria;
		page?: number;
		limit?: number;
	} = {}
) {
	const { filters, sortBy, page, limit } = options;

	let processed = [...prompts];

	if (filters) {
		processed = filterPrompts(processed, filters);
	}

	if (sortBy) {
		processed = sortPrompts(processed, sortBy);
	}

	if (page !== undefined && limit !== undefined) {
		return paginatePrompts(processed, page, limit);
	}

	return {
		items: processed,
		totalItems: processed.length,
	};
}

/**
 * 📊 Convierte un PromptComplete a PromptWithStats calculando estadísticas.
 * ✅ MIGRADO A DRIZZLE
 * @param prompt Prompt completo con relaciones.
 * @returns Prompt con estadísticas calculadas.
 */
export function toPromptWithStats(prompt: PromptComplete): PromptWithStats {
	const stats: PromptStatistics = {
		totalUsages: 0, // Se debería calcular desde la base de datos
		averageRating: 0, // Se debería calcular desde la base de datos
		lastUsedAt: null, // Se debería obtener desde la base de datos
		relatedEntitiesCount: {
			groups: prompt.groups?.length || 0,
			properties: prompt.properties?.length || 0,
			wildcards: prompt.wildcards?.length || 0,
			tags: prompt.tagEntities?.length || 0,
		},
	};

	return {
		...prompt,
		stats,
	};
}
