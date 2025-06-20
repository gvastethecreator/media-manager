/**
 * @file Funciones de mapeo para la entidad Prompt
 * @module transformers/prompt/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    CreatePromptData,
    PromptBase,
    PromptComplete,
    PromptFilters,
    PromptWithRelations,
    UpdatePromptData,
} from '@/types/entities/prompt';
import { PromptSortCriteria } from '@/types/entities/prompt';
import { serializeParameters, serializeTags } from './serializers';

const logger = serverLogger.withContext('PromptMappers');

/**
 * Tipo para Prisma.PromptCreateInput
 */
export interface PrismaPromptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	purpose?: string;
	category?: string;
	parameters?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	groups?: {
		connect: Array<{ id: string }>;
	};
	properties?: {
		connect: Array<{ id: string }>;
	};
	wildcards?: {
		connect: Array<{ id: string }>;
	};
	tagEntities?: {
		connect: Array<{ id: string }>;
	};
}

/**
 * Tipo para Prisma.PromptUpdateInput
 */
export interface PrismaPromptUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	purpose?: string;
	category?: string;
	parameters?: string;
	tags?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	groups?: {
		set: Array<{ id: string }>;
	};
	properties?: {
		set: Array<{ id: string }>;
	};
	wildcards?: {
		set: Array<{ id: string }>;
	};
	tagEntities?: {
		set: Array<{ id: string }>;
	};
}

/**
 * Tipo para Prisma.PromptUpdateArgs
 */
export interface PrismaPromptUpdateArgs {
	where: { id: string };
	data: PrismaPromptUpdateInput;
}

/**
 * Tipo para Prisma.PromptWhereInput
 */
export interface PrismaPromptWhereInput {
	OR?: Array<{
		name?: { contains: string; mode: 'insensitive' };
		description?: { contains: string; mode: 'insensitive' };
		content?: { contains: string; mode: 'insensitive' };
	}>;
	category?: { in: string[] };
	purpose?: { in: string[] };
	isFavorite?: boolean;
	content?: { contains: string; mode: 'insensitive' };
}

/**
 * Tipo para Prisma.PromptOrderByWithRelationInput
 */
export interface PrismaPromptOrderByWithRelationInput {
	name?: 'asc' | 'desc';
	createdAt?: 'asc' | 'desc';
	updatedAt?: 'asc' | 'desc';
}

/**
 * 🔄 Mapea datos de creación de Prompt a formato Prisma
 * @param data Datos de creación
 * @returns Objeto compatible con Prisma.PromptCreateInput
 */
export function mapCreatePromptDataToPrisma(data: CreatePromptData): PrismaPromptCreateInput {
	try {
		// Serializar parámetros y tags
		const parameters = typeof data.parameters === 'string' ? data.parameters : serializeParameters(data.parameters);
		const tags = typeof data.tags === 'string' ? data.tags : serializeTags(data.tags?.map(t => t.id) || []);

		// Preparar datos base
		const promptData: PrismaPromptCreateInput = {
			name: data.name,
			emoji: data.emoji || '💬',
			color: data.color || '#3B82F6',
			description: data.description || null,
			content: data.content,
			purpose: data.purpose,
			category: data.category,
			parameters,
			tags,
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
		};

		// Agregar relaciones si existen
		if (data.groups && data.groups.length > 0) {
			promptData.groups = {
				connect: data.groups.map((group) => ({ id: group.id })),
			};
		}

		if (data.properties && data.properties.length > 0) {
			promptData.properties = {
				connect: data.properties.map((property) => ({ id: property.id })),
			};
		}

		if (data.wildcards && data.wildcards.length > 0) {
			promptData.wildcards = {
				connect: data.wildcards.map((wildcard) => ({ id: wildcard.id })),
			};
		}

		if (data.tags && data.tags.length > 0) {
			promptData.tagEntities = {
				connect: data.tags.map((tag) => ({ id: tag.id })),
			};
		}

		return promptData;
	} catch (error) {
		logger.error('Error mapeando datos de creación:', error);
		throw new Error(
			`Error al mapear datos de creación de prompt: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Mapea datos de actualización de Prompt a formato Prisma
 * @param id ID del prompt a actualizar
 * @param data Datos de actualización
 * @returns Objeto compatible con Prisma.PromptUpdateArgs
 */
export function mapUpdatePromptDataToPrisma(id: string, data: UpdatePromptData): PrismaPromptUpdateArgs {
	try {
		// Preparar datos base (solo incluir campos proporcionados)
		const updateData: PrismaPromptUpdateInput = {};

		// Asignar campos simples si están definidos
		if (data.name !== undefined) updateData.name = data.name;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.content !== undefined) updateData.content = data.content;
		if (data.purpose !== undefined) updateData.purpose = data.purpose;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		// Serializar campos complejos si están definidos
		if (data.parameters !== undefined) {
			updateData.parameters =
				typeof data.parameters === 'string' ? data.parameters : serializeParameters(data.parameters);
		}
		if (data.tags !== undefined) {
			updateData.tags = typeof data.tags === 'string' ? data.tags : serializeTags(data.tags);
		}

		// Actualizar relaciones si están definidas - usar connect/disconnect según el tipo UpdateInput
		if (data.connect?.groups !== undefined) {
			updateData.groups = {
				set: data.connect.groups.map((group) => ({ id: group.id })),
			};
		}

		if (data.connect?.properties !== undefined) {
			updateData.properties = {
				set: data.connect.properties.map((property) => ({ id: property.id })),
			};
		}

		if (data.connect?.wildcards !== undefined) {
			updateData.wildcards = {
				set: data.connect.wildcards.map((wildcard) => ({ id: wildcard.id })),
			};
		}

		if (data.connect?.tags !== undefined) {
			updateData.tagEntities = {
				set: data.connect.tags.map((tag) => ({ id: tag.id })),
			};
		}

		return {
			where: { id },
			data: updateData,
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización:', error);
		throw new Error(
			`Error al mapear datos de actualización de prompt: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Mapea filtros de Prompt a condiciones where de Prisma
 * @param filters Filtros para consultar prompts
 * @returns Objeto compatible con Prisma.PromptWhereInput
 */
export function mapPromptFiltersToPrisma(filters: PromptFilters = {}): PrismaPromptWhereInput {
	try {
		const where: PrismaPromptWhereInput = {};

		// Búsqueda por texto
		if (filters.searchQuery) {
			where.OR = [
				{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
				{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
				{ content: { contains: filters.searchQuery, mode: 'insensitive' } },
			];
		}

		// Filtrar por categorías
		if (filters.categories && filters.categories.length > 0) {
			where.category = { in: filters.categories };
		}

		// Filtrar por propósitos
		if (filters.purposes && filters.purposes.length > 0) {
			where.purpose = { in: filters.purposes };
		}

		// Filtrar por favoritos
		if (filters.onlyFavorites) {
			where.isFavorite = true;
		}

		// Filtrar por contenido específico - usar searchQuery como alternativa
		if (filters.searchQuery && !where.OR) {
			where.content = { contains: filters.searchQuery, mode: 'insensitive' };
		}

		return where;
	} catch (error) {
		logger.error('Error mapeando filtros:', error);
		return {}; // Devolver objeto vacío en caso de error
	}
}

/**
 * 🔄 Mapea criterios de ordenación a formato Prisma
 * @param sortBy Criterio de ordenación
 * @returns Objeto compatible con Prisma.PromptOrderByWithRelationInput
 */
export function mapPromptSortCriteriaToPrisma(
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_DESC
): PrismaPromptOrderByWithRelationInput {
	// Extraer campo y dirección del criterio
	const [field, direction] = sortBy.split(':');
	const sortDirection = direction === 'asc' ? 'asc' : 'desc';

	// Mapear campo a propiedad de Prisma
	switch (field) {
		case 'name':
			return { name: sortDirection };
		case 'created':
			return { createdAt: sortDirection };
		case 'updated':
		default:
			return { updatedAt: sortDirection };
	}
}

/**
 * 🔄 Mapea un Prompt a formato simplificado para relaciones
 * @param prompt Prompt completo
 * @returns Prompt simplificado para relaciones
 */
export function mapPromptToRelated(
	prompt: PromptComplete | PromptWithRelations
): Pick<PromptComplete, 'id' | 'name' | 'emoji' | 'color'> {
	return {
		id: prompt.id,
		name: prompt.name,
		emoji: prompt.emoji,
		color: prompt.color,
	};
}

/**
 * 🔄 Mapea un array de Prompts a formato simplificado para relaciones
 * @param prompts Array de prompts
 * @returns Array de prompts simplificados
 */
export function mapPromptsToRelated(
	prompts: Array<PromptComplete | PromptWithRelations>
): Array<Pick<PromptComplete, 'id' | 'name' | 'emoji' | 'color'>> {
	return prompts.map(mapPromptToRelated);
}

/**
 * 🔍 Filtra un array de prompts según los criterios especificados
 * @param prompts Array de prompts a filtrar
 * @param filters Filtros a aplicar
 * @returns Array de prompts filtrados
 */
export function filterPrompts(prompts: PromptBase[], filters: PromptFilters = {}): PromptBase[] {
	let filtered = [...prompts];

	// Filtrar por búsqueda de texto
	if (filters.searchQuery) {
		const query = filters.searchQuery.toLowerCase();
		filtered = filtered.filter(
			(prompt) =>
				prompt.name.toLowerCase().includes(query) ||
				prompt.description?.toLowerCase().includes(query) ||
				prompt.content.toLowerCase().includes(query)
		);
	}

	// Filtrar por categorías
	if (filters.categories && filters.categories.length > 0) {
		filtered = filtered.filter((prompt) => filters.categories!.includes(prompt.category));
	}

	// Filtrar por propósitos
	if (filters.purposes && filters.purposes.length > 0) {
		filtered = filtered.filter((prompt) => filters.purposes!.includes(prompt.purpose));
	}

	// Filtrar por favoritos
	if (filters.onlyFavorites) {
		filtered = filtered.filter((prompt) => prompt.isFavorite);
	}

	// Filtrar por contenido específico
	if (filters.contentContains) {
		const content = filters.contentContains.toLowerCase();
		filtered = filtered.filter((prompt) => prompt.content.toLowerCase().includes(content));
	}

	return filtered;
}

/**
 * 📄 Pagina un array de prompts
 * @param prompts Array de prompts a paginar
 * @param page Número de página (empezando en 1)
 * @param limit Número de elementos por página
 * @returns Objeto con prompts paginados y metadatos
 */
export function paginatePrompts(
	prompts: PromptBase[],
	page = 1,
	limit = 20
): {
	data: PromptBase[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
} {
	const total = prompts.length;
	const totalPages = Math.ceil(total / limit);
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	const data = prompts.slice(startIndex, endIndex);

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
 * 🔄 Ordena un array de prompts según el criterio especificado
 * @param prompts Array de prompts a ordenar
 * @param sortBy Criterio de ordenación
 * @returns Array de prompts ordenados
 */
export function sortPrompts(
	prompts: PromptBase[],
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_DESC
): PromptBase[] {
	const [field, direction] = sortBy.split(':');
	const isAsc = direction === 'asc';

	return [...prompts].sort((a, b) => {
		let valueA: any;
		let valueB: any;

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

		if (valueA < valueB) return isAsc ? -1 : 1;
		if (valueA > valueB) return isAsc ? 1 : -1;
		return 0;
	});
}

/**
 * 🔄 Procesa un array de prompts aplicando filtros, ordenación y paginación
 * @param prompts Array de prompts a procesar
 * @param options Opciones de procesamiento
 * @returns Prompts procesados con metadatos
 */
export function processPrompts(
	prompts: PromptBase[],
	options: {
		filters?: PromptFilters;
		sortBy?: PromptSortCriteria;
		page?: number;
		limit?: number;
	} = {}
): {
	data: PromptBase[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
} {
	let processed = [...prompts];

	// Aplicar filtros
	if (options.filters) {
		processed = filterPrompts(processed, options.filters);
	}

	// Aplicar ordenación
	if (options.sortBy) {
		processed = sortPrompts(processed, options.sortBy);
	}

	// Aplicar paginación
	return paginatePrompts(processed, options.page, options.limit);
}

/**
 * 📊 Convierte un prompt base a un prompt con estadísticas
 * @param prompt Prompt base
 * @param stats Estadísticas opcionales
 * @returns Prompt con estadísticas
 */
export function toPromptWithStats(prompt: PromptBase, stats?: Partial<PromptCounts['_count']>): PromptWithStats {
	const defaultStats: PromptCounts['_count'] = {
		images: 0,
		videos: 0,
		albums: 0,
		collections: 0,
		tags: 0,
		characters: 0,
		places: 0,
		worldItems: 0,
		concepts: 0,
		notes: 0,
		wildcards: 0,
		properties: 0,
		groups: 0,
		...stats,
	};

	return {
		...prompt,
		_count: defaultStats,
	};
}
