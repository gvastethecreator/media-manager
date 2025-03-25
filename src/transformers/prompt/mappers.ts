import { serverLogger } from '@/lib/logger/server-logger';
import type { PromptBase, PromptExtended, PromptFilters, PromptSortOption, PromptWithStats } from '@/types/entities/prompt';
import { serializeTags, toExtendedPrompt } from './serializers';

const mappersLogger = serverLogger.withContext('PromptMappers');

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

    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      const promptTags = serializeTags(prompt.tags);
      const hasMatchingTag = filters.tags.some(tag => promptTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
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