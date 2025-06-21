/**
 * @file Funciones de mapeo para la entidad Prompt
 * @module transformers/prompt/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    CreatePromptData,
    PromptBase,
    PromptComplete,
    PromptCounts,
    PromptFilters,
    PromptWithRelations,
    PromptWithStats,
    UpdatePromptData
} from '@/types/entities/prompt';
import { PromptSortCriteria } from '@/types/entities/prompt';
import type { Prisma } from '@prisma/client';
import { deserializeParameters, serializeParameters, serializeTags } from './serializers';

const logger = serverLogger.withContext('PromptMappers');

// #region Tipos Internos de Prisma (Utility Types)
// Evitan la necesidad de importar @prisma/client directamente en todo el código

type ConnectInput = { connect: { id: string }[] };
type SetInput = { set: { id: string }[] };
type RelationObject = { id: string };
type RelationInput = (string | RelationObject)[];

// #endregion

// #region Funciones de Mapeo a Prisma

/**
 * Normaliza una relación (array de strings o de objetos con id) a un formato de objetos con id.
 * @param relation El array de la relación a normalizar.
 * @returns Un array de objetos con la propiedad id.
 */
function normalizeRelation(relation: RelationInput | undefined): RelationObject[] {
	if (!relation) return [];
	return relation.map((item) => (typeof item === 'string' ? { id: item } : { id: item.id }));
}

/**
 * Crea el objeto de conexión para una relación en Prisma.
 * @param relation El array de la relación a normalizar.
 * @returns Un objeto para conectar la relación en Prisma, o undefined si la relación está vacía.
 */
function normalizeRelationToConnect(relation: RelationInput | undefined): ConnectInput | undefined {
	if (!relation || relation.length === 0) return undefined;
	const normalized = normalizeRelation(relation);
	if (normalized.length === 0) return undefined;
	return { connect: normalized };
}

/**
 * Crea el objeto para establecer (set) una relación en Prisma.
 * @param relation El array de la relación a normalizar.
 * @returns Un objeto para establecer la relación en Prisma, o undefined si no se proporciona relación.
 */
function normalizeRelationToSet(relation: RelationInput | undefined): SetInput | undefined {
	if (relation === undefined) return undefined;
	return { set: normalizeRelation(relation) };
}

/**
 * 🔄 Mapea datos de creación de Prompt a formato Prisma.
 * @param data Datos de creación.
 * @returns Objeto compatible con Prisma.PromptCreateInput.
 */
export function mapCreatePromptDataToPrisma(data: CreatePromptData): Prisma.PromptCreateInput {
	try {
		const { tags, groups, properties, wildcards, ...restData } = data;

		return {
			...restData,
			emoji: data.emoji || '💬',
			color: data.color || '#3B82F6',
			parameters: serializeParameters(data.parameters),
			tags: serializeTags((tags || []).map((t) => (typeof t === 'string' ? t : t.id))),
			groups: normalizeRelationToConnect(groups),
			properties: normalizeRelationToConnect(properties),
			wildcards: normalizeRelationToConnect(wildcards),
			tagEntities: normalizeRelationToConnect(tags),
		};
	} catch (error) {
		logger.error('Error mapeando datos de creación:', { data, error });
		throw new Error(
			`Error al mapear datos de creación de prompt: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Mapea datos de actualización de Prompt a formato Prisma.
 * @param id ID del prompt a actualizar.
 * @param data Datos de actualización.
 * @returns Objeto compatible con Prisma.PromptUpdateArgs.
 */
export function mapUpdatePromptDataToPrisma(id: string, data: UpdatePromptData): Prisma.PromptUpdateArgs {
	try {
		const { tags, groups, properties, wildcards, parameters, ...restData } = data;
		const updateData: Prisma.PromptUpdateInput = { ...restData };

		if (parameters) {
			updateData.parameters = serializeParameters(parameters);
		}
		if (tags) {
			updateData.tags = serializeTags(tags.map((t) => (typeof t === 'string' ? t : t.id)));
			updateData.tagEntities = normalizeRelationToSet(tags);
		}
		if (groups) updateData.groups = normalizeRelationToSet(groups);
		if (properties) updateData.properties = normalizeRelationToSet(properties);
		if (wildcards) updateData.wildcards = normalizeRelationToSet(wildcards);

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
 * 🔄 Mapea filtros de Prompt a condiciones `where` de Prisma.
 * @param filters Filtros para consultar prompts.
 * @returns Objeto compatible con Prisma.PromptWhereInput.
 */
export function mapPromptFiltersToPrisma(filters: PromptFilters = {}): Prisma.PromptWhereInput {
	const where: Prisma.PromptWhereInput = {};

	if (filters.searchQuery) {
		const query = filters.searchQuery;
		where.OR = [
			{ name: { contains: query, mode: 'insensitive' } },
			{ description: { contains: query, mode: 'insensitive' } },
			{ content: { contains: query, mode: 'insensitive' } },
		];
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
 * 🔄 Mapea criterios de ordenación a formato Prisma.
 * @param sortBy Criterio de ordenación.
 * @returns Objeto compatible con Prisma.PromptOrderByWithRelationInput.
 */
export function mapPromptSortCriteriaToPrisma(
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_DESC
): Prisma.PromptOrderByWithRelationInput {
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
 */
export function mapPromptsToRelated(prompts: (PromptComplete | PromptWithRelations)[]) {
	return prompts.map(mapPromptToRelated);
}

/**
 * 🔍 Filtra un array de prompts en memoria.
 * @param prompts Array de prompts a filtrar.
 * @param filters Filtros a aplicar.
 * @returns Array de prompts filtrados.
 */
export function filterPrompts(prompts: PromptBase[], filters: PromptFilters = {}): PromptBase[] {
	return prompts.filter((prompt) => {
		if (filters.searchQuery) {
			const query = filters.searchQuery.toLowerCase();
			const inName = prompt.name.toLowerCase().includes(query);
			const inDesc = prompt.description?.toLowerCase().includes(query) ?? false;
			const inContent = prompt.content.toLowerCase().includes(query);
			if (!inName && !inDesc && !inContent) return false;
		}
		if (filters.categories?.length && !filters.categories.includes(prompt.category)) {
			return false;
		}
		if (filters.purposes?.length && !filters.purposes.includes(prompt.purpose)) {
			return false;
		}
		if (filters.onlyFavorites && !prompt.isFavorite) {
			return false;
		}
		return true;
	});
}

/**
 * 📄 Pagina un array de prompts.
 */
export function paginatePrompts<T>(items: T[], page = 1, limit = 20) {
	const total = items.length;
	const totalPages = Math.ceil(total / limit);
	const startIndex = (page - 1) * limit;
	const data = items.slice(startIndex, startIndex + limit);

	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
	};
}

/**
 * 🔄 Ordena un array de prompts con seguridad de tipos.
 */
export function sortPrompts(
	prompts: PromptBase[],
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_DESC
): PromptBase[] {
	const [field, direction] = sortBy.split(':');
	const isAsc = direction === 'asc';

	return [...prompts].sort((a, b) => {
		let valueA: string | number;
		let valueB: string | number;

		switch (field) {
			case 'name':
				valueA = a.name.toLowerCase();
				valueB = b.name.toLowerCase();
				break;
			case 'created':
				valueA = new Date(a.createdAt).getTime();
				valueB = new Date(b.createdAt).getTime();
				break;
			case 'updated':
			default:
				valueA = new Date(a.updatedAt).getTime();
				valueB = new Date(b.updatedAt).getTime();
				break;
		}

		if (typeof valueA === 'string' && typeof valueB === 'string') {
			return isAsc ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
		}
		return isAsc ? (valueA as number) - (valueB as number) : (valueB as number) - (valueA as number);
	});
}

/**
 * 🔄 Procesa un array de prompts aplicando filtros, ordenación y paginación.
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
	let processed = prompts;
	if (options.filters) {
		processed = filterPrompts(processed, options.filters);
	}
	if (options.sortBy) {
		processed = sortPrompts(processed, options.sortBy);
	}
	return paginatePrompts(processed, options.page, options.limit);
}

/**
 * 📊 Enriquece un prompt con sus estadísticas.
 * Deserializa `parameters` y `tags` si son strings JSON.
 * @param prompt El prompt a enriquecer.
 * @param stats Estadísticas opcionales.
 * @returns El prompt con estadísticas y campos deserializados.
 */
export function toPromptWithStats(prompt: PromptComplete): PromptWithStats {
	const { _count, ...rest } = prompt;

	const stats: PromptCounts['_count'] = {
		images: _count?.images ?? 0,
		videos: _count?.videos ?? 0,
		albums: _count?.albums ?? 0,
		collections: _count?.collections ?? 0,
		tags: _count?.tags ?? 0,
		characters: _count?.characters ?? 0,
		places: _count?.places ?? 0,
		worldItems: _count?.worldItems ?? 0,
		concepts: _count?.concepts ?? 0,
		notes: _count?.notes ?? 0,
		wildcards: _count?.wildcards ?? 0,
		properties: _count?.properties ?? 0,
		groups: _count?.groups ?? 0,
	};

	return {
		...rest,
		parameters: typeof rest.parameters === 'string' ? deserializeParameters(rest.parameters) : rest.parameters,
		tags: typeof rest.tags === 'string' ? JSON.parse(rest.tags) : rest.tags,
		_count: stats,
	};
}
// #endregion
