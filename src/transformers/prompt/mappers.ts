import { serverLogger } from '@/lib/logger/server-logger';
import type {
	PromptBase,
	PromptExtended,
	PromptFilters,
	PromptSortOption,
	PromptWithStats,
} from '@/types/entities/prompt';
import { toExtendedPrompt } from './serializers';

const mappersLogger = serverLogger.withContext('PromptMappers');

/**
 * Mapea datos de creación de prompt a formato Prisma
 * @param data Datos para crear un prompt
 * @returns Objeto con formato para Prisma
 */
export function mapCreatePromptDataToPrisma(data: any): any {
	return {
		name: data.name,
		emoji: data.emoji || null,
		color: data.color || null,
		description: data.description || null,
		content: data.content || '',
		purpose: data.purpose || 'general',
		category: data.category || 'general',
		parameters: data.parameters || '[]',
		featuredImage: data.featuredImage || null,
		isFavorite: data.isFavorite || false,
		// Conexión con grupos si existen
		groups: data.groupIds
			? {
					connect: data.groupIds.map((id: string) => ({ id })),
				}
			: undefined,
		// Conexión con propiedades si existen
		properties: data.propertyIds
			? {
					connect: data.propertyIds.map((id: string) => ({ id })),
				}
			: undefined,
		// Conexión con comodines si existen
		wildcards: data.wildcardIds
			? {
					connect: data.wildcardIds.map((id: string) => ({ id })),
				}
			: undefined,
	};
}

/**
 * Mapea datos de actualización de prompt a formato Prisma
 * @param data Datos para actualizar un prompt
 * @returns Objeto con formato para Prisma
 */
export function mapUpdatePromptDataToPrisma(data: any): any {
	const updateData: Record<string, any> = {};

	// Solo incluir campos que estén presentes en los datos
	if (data.name !== undefined) updateData.name = data.name;
	if (data.emoji !== undefined) updateData.emoji = data.emoji;
	if (data.color !== undefined) updateData.color = data.color;
	if (data.description !== undefined) updateData.description = data.description;
	if (data.content !== undefined) updateData.content = data.content;
	if (data.purpose !== undefined) updateData.purpose = data.purpose;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.parameters !== undefined) updateData.parameters = data.parameters;
	if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
	if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

	// Gestionar relaciones con grupos
	if (data.groupIds !== undefined) {
		updateData.groups = {
			set: data.groupIds.map((id: string) => ({ id })),
		};
	}

	// Gestionar relaciones con propiedades
	if (data.propertyIds !== undefined) {
		updateData.properties = {
			set: data.propertyIds.map((id: string) => ({ id })),
		};
	}

	// Gestionar relaciones con comodines
	if (data.wildcardIds !== undefined) {
		updateData.wildcards = {
			set: data.wildcardIds.map((id: string) => ({ id })),
		};
	}

	return updateData;
}

/**
 * Transforma un prompt de Prisma a un prompt con estadísticas
 * @param prompt Prompt base con datos de conteo
 * @returns Prompt con estadísticas
 */
export function toPromptWithStats(prompt: any): PromptWithStats {
	// Asegurar que _count existe y tiene la estructura correcta
	const _count = prompt._count || {};

	return {
		...prompt,
		_count: {
			characters: _count.characters || 0,
			places: _count.places || 0,
			worldItems: _count.worldItems || 0,
			notes: _count.notes || 0,
			concepts: _count.concepts || 0,
			images: _count.images || 0,
			groups: _count.groups || 0,
			properties: _count.properties || 0,
			wildcards: _count.wildcards || 0,
		},
	};
}

/**
 * Filtra una lista de prompts según criterios
 * @param prompts Lista de prompts
 * @param filters Criterios de filtrado
 * @returns Lista filtrada de prompts
 */
export function filterPrompts(prompts: PromptBase[], filters: PromptFilters = {}): PromptBase[] {
	mappersLogger.info('🔍 Filtrando prompts con criterios:', filters);

	return prompts.filter((prompt) => {
		// Filtro por búsqueda
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			const nameMatch = prompt.name.toLowerCase().includes(searchLower);
			const descMatch = prompt.description?.toLowerCase().includes(searchLower) || false;
			const contentMatch = prompt.content?.toLowerCase().includes(searchLower) || false;

			if (!nameMatch && !descMatch && !contentMatch) {
				return false;
			}
		}

		// Filtro por categoría
		if (filters.category && prompt.category !== filters.category) {
			return false;
		}

		// Filtro por tags - Esta entidad no tiene una propiedad 'tags' directa,
		// por lo que omitiremos este filtro o se puede implementar de otra manera
		// si se relaciona con Tags en una relación muchos a muchos
		if (filters.tags && filters.tags.length > 0) {
			// Este filtrado debería hacerse a nivel de consulta de base de datos
			// ya que requiere consultar las relaciones con Tags
			// Para propósitos de ejemplo, asumimos que no hay match si hay filtro de tags
			return false;
		}

		// Filtro por favoritos
		if (filters.onlyFavorites && !prompt.isFavorite) {
			return false;
		}

		// Filtro por fecha de creación
		if (filters.startDate) {
			const promptDate = new Date(prompt.createdAt);
			if (promptDate < filters.startDate) {
				return false;
			}
		}

		if (filters.endDate) {
			const promptDate = new Date(prompt.createdAt);
			if (promptDate > filters.endDate) {
				return false;
			}
		}

		return true;
	});
}

/**
 * Ordena una lista de prompts según el criterio especificado
 * @param prompts Lista de prompts
 * @param sortBy Criterio de ordenación
 * @returns Lista ordenada de prompts
 */
export function sortPrompts(prompts: PromptBase[], sortBy: PromptSortOption = 'name_asc'): PromptBase[] {
	mappersLogger.info('⏬ Ordenando prompts por:', sortBy);

	const promptsCopy = [...prompts];

	switch (sortBy) {
		case 'name_asc':
			return promptsCopy.sort((a, b) => a.name.localeCompare(b.name));
		case 'name_desc':
			return promptsCopy.sort((a, b) => b.name.localeCompare(a.name));
		case 'created_asc':
			return promptsCopy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		case 'created_desc':
			return promptsCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		case 'updated_asc':
			return promptsCopy.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
		case 'updated_desc':
			return promptsCopy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
		case 'category_asc':
			return promptsCopy.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
		case 'category_desc':
			return promptsCopy.sort((a, b) => (b.category || '').localeCompare(a.category || ''));
		case 'favorites_first':
			return promptsCopy.sort((a, b) => {
				if (a.isFavorite === b.isFavorite) {
					return a.name.localeCompare(b.name);
				}
				return a.isFavorite ? -1 : 1;
			});
		default:
			return promptsCopy;
	}
}

/**
 * Aplica paginación a una lista de prompts
 * @param prompts Lista de prompts
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Lista paginada de prompts
 */
export function paginatePrompts(prompts: PromptBase[], page = 1, pageSize = 20): PromptBase[] {
	const startIndex = (page - 1) * pageSize;
	return prompts.slice(startIndex, startIndex + pageSize);
}

/**
 * Procesa una lista de prompts aplicando filtrado, ordenación y paginación
 * @param prompts Lista de prompts
 * @param filters Criterios de filtrado
 * @param sortBy Criterio de ordenación
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Lista procesada de prompts extendidos
 */
export function processPrompts(
	prompts: PromptBase[],
	filters: PromptFilters = {},
	sortBy: PromptSortOption = 'name_asc',
	page = 1,
	pageSize = 20
): { items: PromptExtended[]; total: number; totalPages: number } {
	// Aplicar filtros
	const filteredPrompts = filterPrompts(prompts, filters);

	// Aplicar ordenación
	const sortedPrompts = sortPrompts(filteredPrompts, sortBy);

	// Calcular total y páginas
	const total = sortedPrompts.length;
	const totalPages = Math.ceil(total / pageSize);

	// Aplicar paginación
	const paginatedPrompts = paginatePrompts(sortedPrompts, page, pageSize);

	// Transformar a prompts extendidos
	const extendedPrompts = paginatedPrompts.map(toExtendedPrompt);

	return {
		items: extendedPrompts,
		total,
		totalPages,
	};
}
