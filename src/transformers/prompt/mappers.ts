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
	PromptStatistics,
	PromptUpdateInput,
	PromptWithRelations,
	PromptWithStats,
} from '@/types/entities/prompt';
import { PromptSortCriteria } from '@/types/entities/prompt';
import { serializeParameters, serializeTags } from './serializers';

const logger = serverLogger.withContext('PromptMappers');

// #region Tipos locales equivalentes a Prisma (migración a Drizzle)

type DrizzleCreatePromptData = {
	name: string;
	description?: string | null;
	content: string;
	category: string;
	purpose: string;
	emoji: string;
	color: string;
	parameters: string; // JSON
	tags: string; // JSON
	isFavorite: boolean;
};

type DrizzleUpdatePromptData = Partial<DrizzleCreatePromptData>;

type DrizzleWhereFilter = {
	AND?: DrizzleWhereFilter[];
	OR?: DrizzleWhereFilter[];
	name?: { contains?: string; equals?: string };
	description?: { contains?: string; equals?: string };
	content?: { contains?: string; equals?: string };
	category?: { in?: string[] };
	purpose?: { in?: string[] };
	isFavorite?: boolean;
};

type DrizzleOrderBy = {
	[key: string]: 'asc' | 'desc';
};

type DrizzleUpdateArgs = {
	where: { id: string };
	data: DrizzleUpdatePromptData;
};

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
			updateData.parameters = serializeParameters(parameters);
		}
		if (tags) {
			updateData.tags = serializeTags(tags.map((t) => (typeof t === 'string' ? t : t.id)));
			// Las relaciones tagEntities se manejan por separado en Drizzle
		}
		// Las relaciones groups, properties, wildcards se manejan por separado en Drizzle

		return { where: { id }, data: updateData };
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

	if (filters.searchQuery) {
		const query = filters.searchQuery;
		where.OR = [{ name: { contains: query } }, { description: { contains: query } }, { content: { contains: query } }];
	}

	if (filters.categories?.length) {
		where.category = { in: filters.categories };
	}
	if (filters.purposes?.length) {
		where.purpose = { in: filters.purposes };
	}
	if (filters.onlyFavorites) {
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
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_DESC
): DrizzleOrderBy {
	const [field, direction] = sortBy.split(':');
	const sortDir = direction === 'asc' ? 'asc' : 'desc';

	switch (field) {
		case 'name':
			return { name: sortDir };
		case 'created':
			return { createdAt: sortDir };
		case 'updated':
		default:
			return { updatedAt: sortDir };
	}
}

/**
 * 🔄 Mapea un Prompt a un formato simplificado para mostrar en relaciones.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapPromptToRelated(prompt: PromptComplete | PromptWithRelations) {
	return {
		id: prompt.id,
		name: prompt.name,
		emoji: prompt.emoji,
		color: prompt.color,
	};
}

/**
 * 🔄 Mapea un array de Prompts a un formato simplificado.
 * ✅ MIGRADO A DRIZZLE
 */
export function mapPromptsToRelated(prompts: (PromptComplete | PromptWithRelations)[]) {
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

	if (filters.searchQuery) {
		const query = filters.searchQuery.toLowerCase();
		filtered = filtered.filter(
			(prompt) =>
				prompt.name.toLowerCase().includes(query) ||
				prompt.description?.toLowerCase().includes(query) ||
				prompt.content.toLowerCase().includes(query)
		);
	}

	if (filters.categories?.length) {
		filtered = filtered.filter((prompt) => filters.categories!.includes(prompt.category));
	}

	if (filters.purposes?.length) {
		filtered = filtered.filter((prompt) => filters.purposes!.includes(prompt.purpose));
	}

	if (filters.onlyFavorites) {
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
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_DESC
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
			case 'updated':
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

// Mantener funciones legacy para compatibilidad (DEPRECATED)
/**
 * @deprecated Usar mapCreatePromptDataToDrizzle
 */
export const mapCreatePromptDataToPrisma = mapCreatePromptDataToDrizzle;

/**
 * @deprecated Usar mapUpdatePromptDataToDrizzle
 */
export const mapUpdatePromptDataToPrisma = mapUpdatePromptDataToDrizzle;

/**
 * @deprecated Usar mapPromptFiltersToDrizzle
 */
export const mapPromptFiltersToPrisma = mapPromptFiltersToDrizzle;

/**
 * @deprecated Usar mapPromptSortCriteriaToDrizzle
 */

