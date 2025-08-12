/**
 * @file Funciones de mapeo para la entidad Prompt
 * @module transformers/prompt/mappers

 */

import { serverLogger } from '../../lib/logger/server-logger';
import { calculateCompleteness } from '../../lib/utils/transformers/calculate-completeness';
import type {
	DrizzleCreatePromptData,
	DrizzleOrderBy,
	DrizzleUpdatePromptData,
	DrizzleWhereFilter,
	PromptBase,
	PromptComplete,
	PromptCreateInput,
	PromptFilters,
	PromptRelated,
	PromptStatistics,
	PromptUpdateInput,
	PromptWithRelations,
	PromptWithStats,
} from '../../types/entities/prompt';
import { PromptSortCriteria } from '../../types/entities/prompt/enums';

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
	if (!relation) {
		return [];
	}
	return relation.map((item) => (typeof item === 'string' ? { id: item } : { id: item.id }));
}

/**
 * 🔄 Mapea datos de creación de Prompt a formato Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de creación.
 * @returns Objeto compatible con inserción en Drizzle.
 */
export function mapCreatePromptDataToDrizzle(data: PromptCreateInput): DrizzleCreatePromptData {
	return {
		...data,
		// Serializar parámetros si existen - convertir string a null si es necesario
		parameters: typeof data.parameters === 'string' ? data.parameters : null,
	};
}

/**
 * 🔄 Mapea datos de actualización de Prompt a formato Drizzle.
 * ✅ MIGRADO A DRIZZLE
 * @param data Datos de actualización.
 * @returns Objeto compatible con actualización en Drizzle.
 */
export function mapUpdatePromptDataToDrizzle(data: PromptUpdateInput): DrizzleUpdatePromptData {
	return {
		...data,
		// Serializar parámetros si existen - convertir string a null si es necesario
		parameters: typeof data.parameters === 'string' ? data.parameters : null,
		updatedAt: new Date(),
	};
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
		where.OR = [{ name: searchText }, { content: searchText }];
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
		filtered = filtered.filter((prompt) => prompt.category && categories.includes(prompt.category));
	}

	// Filtrar por propósitos
	const purposes = filters.purposes || filters.purpose;
	if (purposes?.length) {
		filtered = filtered.filter((prompt) => prompt.purpose && purposes.includes(prompt.purpose));
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

		if (aValue < bValue) {
			return isAsc ? -1 : 1;
		}
		if (aValue > bValue) {
			return isAsc ? 1 : -1;
		}
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
	// Calcular completeness score
	const completenessScore = calculateCompleteness([
		prompt.name,
		prompt.description,
		prompt.content,
		prompt.parameters,
		prompt.category,
		prompt.style,
		prompt.mood,
		prompt.featuredImage,
	]);

	// Calcular estadísticas
	const stats: PromptStatistics = {
		// Conteos de relaciones base (EntityStats)
		imageCount: prompt._count?.images || 0,
		videoCount: prompt._count?.videos || 0,
		albumCount: prompt._count?.albums || 0,
		collectionCount: prompt._count?.collections || 0,
		tagCount: prompt._count?.tagEntities || 0,
		characterCount: prompt._count?.characters || 0,
		placeCount: prompt._count?.places || 0,
		worldItemCount: prompt._count?.worldItems || 0,
		conceptCount: prompt._count?.concepts || 0,
		promptCount: 0,
		noteCount: prompt._count?.notes || 0,
		wildcardCount: prompt._count?.wildcards || 0,
		propertyCount: prompt._count?.properties || 0,
		groupCount: prompt._count?.groups || 0,

		// Métricas globales
		totalItems: (prompt._count?.images || 0) + (prompt._count?.videos || 0) + (prompt._count?.albums || 0),
		totalAssociations: Object.values(prompt._count || {}).reduce((sum, count) => sum + (count || 0), 0),

		// Timestamps
		lastUpdated: prompt.updatedAt,

		// Propiedades del sistema de archivos
		size: 0,
		mtime: prompt.updatedAt,
		birthtime: prompt.createdAt,
		type: 'prompt',

		// Conteos específicos para compatibilidad con prompt-card
		totalImages: prompt._count?.images || 0,
		totalVideos: prompt._count?.videos || 0,
		totalCollections: prompt._count?.collections || 0,
		totalAlbums: prompt._count?.albums || 0,
		totalConcepts: prompt._count?.concepts || 0,
		totalNotes: prompt._count?.notes || 0,
		totalCharacters: prompt._count?.characters || 0,
		totalProperties: prompt._count?.properties || 0,
		totalWildcards: prompt._count?.wildcards || 0,
		totalGroups: prompt._count?.groups || 0,
		totalPlaces: prompt._count?.places || 0,

		// Métricas de contenido
		totalContentItems: 0,
		averageContentLength: prompt.content?.length || 0,
		parametersCount: prompt.parameters
			? (() => {
					try {
						return Object.keys(JSON.parse(prompt.parameters!)).length;
					} catch {
						return 0;
					}
				})()
			: 0,
		tagsCount: Array.isArray(prompt.tags) ? prompt.tags.length : 0,

		// Métricas de IA y uso
		executionCount: 0,
		successRate: 0,
		averageExecutionTime: 0,
		confidenceScore: 0,
		popularityScore: 0,

		// Análisis temporal
		lastExecutedAt: null,
		createdThisMonth: false,
		updatedThisWeek: false,
		executedToday: false,

		// Análisis de calidad
		hasDescription: !!prompt.description,
		hasFeaturedImage: !!prompt.featuredImage,
		isWellStructured:
			!!prompt.description && !!prompt.content && (Array.isArray(prompt.tags) ? prompt.tags.length > 0 : false),
		qualityGrade: calculateQualityGrade(prompt),
		completenessScore,
		creativeScore: 0,
		technicalScore: 0,
		usabilityScore: 0,

		// File system functions
		isDirectory: false,
		isFile: true,
	};

	return {
		...prompt,
		entityType: 'prompt' as const,
		stats,
	};
}

function calculateQualityGrade(prompt: PromptComplete): 'A' | 'B' | 'C' | 'D' {
	let score = 0;
	let maxScore = 0;

	// Nombre (obligatorio)
	maxScore += 20;
	if (prompt.name && prompt.name.length > 3) {
		score += 20;
	}

	// Descripción
	maxScore += 20;
	if (prompt.description && prompt.description.length > 10) {
		score += 20;
	}

	// Contenido
	maxScore += 20;
	if (prompt.content && prompt.content.length > 20) {
		score += 20;
	}

	// Tags
	maxScore += 15;
	if (Array.isArray(prompt.tags) && prompt.tags.length > 0) {
		score += 15;
	}

	// Parámetros
	maxScore += 15;
	if (prompt.parameters) {
		try {
			const params = JSON.parse(prompt.parameters);
			if (Object.keys(params).length > 0) {
				score += 15;
			}
		} catch {
			// Parámetros inválidos
		}
	}

	// Imagen destacada
	maxScore += 10;
	if (prompt.featuredImage) {
		score += 10;
	}

	const percentage = Math.round((score / maxScore) * 100);
	if (percentage >= 90) {
		return 'A';
	}
	if (percentage >= 75) {
		return 'B';
	}
	if (percentage >= 60) {
		return 'C';
	}
	return 'D';
}
