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
export function mapCreatePromptDataToPrisma(data: PromptCreateInput): Prisma.PromptCreateInput {
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
export function mapUpdatePromptDataToPrisma(id: string, data: PromptUpdateInput): Prisma.PromptUpdateArgs {
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
			{ name: { contains: query } },
			{ description: { contains: query } },
			{ content: { contains: query } },
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
 * 📊 Transforma un PromptComplete a PromptWithStats con estadísticas avanzadas.
 * Implementa el patrón EntityWithStats para máximo rendimiento.
 * @param prompt El prompt a transformar.
 * @returns El prompt con estadísticas y campos deserializados.
 */
export function toPromptWithStats(prompt: PromptComplete): PromptWithStats {
	const { _count, ...rest } = prompt;

	// Deserializar campos JSON
	const deserializedParameters =
		typeof rest.parameters === 'string' ? deserializeParameters(rest.parameters) : rest.parameters || [];
	const deserializedTags = typeof rest.tags === 'string' ? JSON.parse(rest.tags) : rest.tags || [];

	// Calcular conteos básicos
	const counts = {
		images: _count?.images ?? 0,
		videos: _count?.videos ?? 0,
		albums: _count?.albums ?? 0,
		collections: _count?.collections ?? 0,
		tagEntities: _count?.tagEntities ?? 0,
		characters: _count?.characters ?? 0,
		places: _count?.places ?? 0,
		worldItems: _count?.worldItems ?? 0,
		concepts: _count?.concepts ?? 0,
		notes: _count?.notes ?? 0,
		wildcards: _count?.wildcards ?? 0,
		properties: _count?.properties ?? 0,
		groups: _count?.groups ?? 0,
	};

	// Calcular estadísticas avanzadas
	const totalContentItems = counts.images + counts.videos + counts.albums + counts.collections;
	const totalRelations = Object.values(counts).reduce((sum, count) => sum + count, 0);
	const contentLength = rest.content?.length ?? 0;
	const parametersCount = Array.isArray(deserializedParameters) ? deserializedParameters.length : 0;
	const tagsCount = Array.isArray(deserializedTags) ? deserializedTags.length : 0;

	// Análisis temporal
	const now = new Date();
	const createdDate = new Date(rest.createdAt);
	const updatedDate = new Date(rest.updatedAt);
	const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
	const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	// Análisis de calidad
	const hasDescription = Boolean(rest.description?.trim());
	const hasFeaturedImage = Boolean(rest.featuredImage);
	const isWellStructured = parametersCount > 0 && tagsCount > 0;
	const qualityScore = Math.min(
		100,
		(hasDescription ? 25 : 0) +
			(hasFeaturedImage ? 15 : 0) +
			(isWellStructured ? 30 : 0) +
			(contentLength > 50 ? 20 : contentLength > 20 ? 10 : 0) +
			(totalRelations > 0 ? 10 : 0)
	);

	const statistics: PromptStatistics = {
		// Conteos de relaciones
		totalImages: counts.images,
		totalVideos: counts.videos,
		totalAlbums: counts.albums,
		totalCollections: counts.collections,
		totalTags: counts.tagEntities,
		totalCharacters: counts.characters,
		totalPlaces: counts.places,
		totalWorldItems: counts.worldItems,
		totalConcepts: counts.concepts,
		totalNotes: counts.notes,
		totalWildcards: counts.wildcards,
		totalProperties: counts.properties,
		totalGroups: counts.groups,

		// Métricas de contenido
		totalContentItems,
		averageContentLength: contentLength,
		parametersCount,
		tagsCount,

		// Métricas de IA y uso (valores por defecto, se actualizarán con datos reales)
		executionCount: 0,
		successRate: 0,
		averageExecutionTime: 0,
		confidenceScore: qualityScore / 100,
		popularityScore: Math.min(100, totalRelations * 5),

		// Análisis temporal
		lastExecutedAt: null,
		createdThisMonth: createdDate >= monthAgo,
		updatedThisWeek: updatedDate >= weekAgo,
		executedToday: false,

		// Análisis de calidad
		hasDescription,
		hasFeaturedImage,
		isWellStructured,
		qualityScore,
	};

	return {
		...rest,
		parameters: deserializedParameters,
		tags: deserializedTags,
		_count: counts,
		statistics,
	};
}
// #endregion
