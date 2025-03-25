import { serverLogger } from '@/lib/logger/server-logger';
import type { ConceptBase, ConceptExtended, ConceptFilters, ConceptSortOption, ConceptWithStats } from '@/types/entities/concept';
import { serializeTags, toExtendedConcept } from './serializers';

const mappersLogger = serverLogger.withContext('ConceptMappers');

/**
 * Transforma un concepto de Prisma a un concepto con estadísticas
 * @param concept Concepto base con datos de conteo
 * @returns Concepto con estadísticas
 */
export function toConceptWithStats(concept: any): ConceptWithStats {
  // Asegurar que _count existe y tiene la estructura correcta
  const _count = concept._count || {};

  return {
    ...concept,
    _count: {
      characters: _count.characters || 0,
      places: _count.places || 0,
      worldItems: _count.worldItems || 0,
      notes: _count.notes || 0,
      prompts: _count.prompts || 0,
      images: _count.images || 0,
    },
  };
}

/**
 * Filtra una lista de conceptos según criterios
 * @param concepts Lista de conceptos
 * @param filters Criterios de filtrado
 * @returns Lista filtrada de conceptos
 */
export function filterConcepts(concepts: ConceptBase[], filters: ConceptFilters = {}): ConceptBase[] {
  mappersLogger.info('🔍 Filtrando conceptos con criterios:', filters);

  return concepts.filter((concept) => {
    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = concept.name.toLowerCase().includes(searchLower);
      const descMatch = concept.description?.toLowerCase().includes(searchLower) || false;
      const contentMatch = concept.content?.toLowerCase().includes(searchLower) || false;

      if (!nameMatch && !descMatch && !contentMatch) {
        return false;
      }
    }

    // Filtro por categoría
    if (filters.category && concept.category !== filters.category) {
      return false;
    }

    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      const conceptTags = serializeTags(concept.tags);
      const hasMatchingTag = filters.tags.some(tag => conceptTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Filtro por favoritos
    if (filters.onlyFavorites && !concept.isFavorite) {
      return false;
    }

    // Filtro por fecha de creación
    if (filters.startDate) {
      const conceptDate = new Date(concept.createdAt);
      if (conceptDate < filters.startDate) {
        return false;
      }
    }

    if (filters.endDate) {
      const conceptDate = new Date(concept.createdAt);
      if (conceptDate > filters.endDate) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ordena una lista de conceptos según el criterio especificado
 * @param concepts Lista de conceptos
 * @param sortBy Criterio de ordenación
 * @returns Lista ordenada de conceptos
 */
export function sortConcepts(concepts: ConceptBase[], sortBy: ConceptSortOption = 'name_asc'): ConceptBase[] {
  mappersLogger.info('⏬ Ordenando conceptos por:', sortBy);

  const conceptsCopy = [...concepts];

  switch (sortBy) {
    case 'name_asc':
      return conceptsCopy.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return conceptsCopy.sort((a, b) => b.name.localeCompare(a.name));
    case 'created_asc':
      return conceptsCopy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'created_desc':
      return conceptsCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'updated_asc':
      return conceptsCopy.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    case 'updated_desc':
      return conceptsCopy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case 'category_asc':
      return conceptsCopy.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    case 'category_desc':
      return conceptsCopy.sort((a, b) => (b.category || '').localeCompare(a.category || ''));
    case 'favorites_first':
      return conceptsCopy.sort((a, b) => {
        if (a.isFavorite === b.isFavorite) {
          return a.name.localeCompare(b.name);
        }
        return a.isFavorite ? -1 : 1;
      });
    default:
      return conceptsCopy;
  }
}

/**
 * Aplica paginación a una lista de conceptos
 * @param concepts Lista de conceptos
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Lista paginada de conceptos
 */
export function paginateConcepts(concepts: ConceptBase[], page = 1, pageSize = 20): ConceptBase[] {
  const startIndex = (page - 1) * pageSize;
  return concepts.slice(startIndex, startIndex + pageSize);
}

/**
 * Procesa una lista de conceptos aplicando filtrado, ordenación y paginación
 * @param concepts Lista de conceptos
 * @param filters Criterios de filtrado
 * @param sortBy Criterio de ordenación
 * @param page Número de página
 * @param pageSize Tamaño de página
 * @returns Lista procesada de conceptos extendidos
 */
export function processConcepts(
  concepts: ConceptBase[],
  filters: ConceptFilters = {},
  sortBy: ConceptSortOption = 'name_asc',
  page = 1,
  pageSize = 20
): { items: ConceptExtended[]; total: number; totalPages: number } {
  // Aplicar filtros
  const filteredConcepts = filterConcepts(concepts, filters);

  // Aplicar ordenación
  const sortedConcepts = sortConcepts(filteredConcepts, sortBy);

  // Calcular total y páginas
  const total = sortedConcepts.length;
  const totalPages = Math.ceil(total / pageSize);

  // Aplicar paginación
  const paginatedConcepts = paginateConcepts(sortedConcepts, page, pageSize);

  // Transformar a conceptos extendidos
  const extendedConcepts = paginatedConcepts.map(toExtendedConcept);

  return {
    items: extendedConcepts,
    total,
    totalPages,
  };
}