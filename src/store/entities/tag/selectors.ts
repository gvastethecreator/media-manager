/**
 * @file Selectores optimizados para el store de Tag
 * @module store/entities/tag/selectors
 */

import { TagSortCriteria } from '@/types/entities/tag/enums';
import type { TagComplete } from '@/types/entities/tag/types';
import { createTagsGroupedByCategory } from '@/utils/sort';
import { useTagStore } from './index';

// Selectores simples directos (sin memoización)
export const selectAllTags = () => useTagStore.getState().items;
export const selectSelectedTag = () => {
  const { items, selectedId } = useTagStore.getState();
  return items.find(tag => tag.id === selectedId) || null;
};
export const selectLoading = () => useTagStore.getState().isLoading;
export const selectError = () => useTagStore.getState().error;
export const selectFilters = () => useTagStore.getState().filters;
export const selectViewMode = () => useTagStore.getState().viewMode;

/**
 * Filtra tags por término de búsqueda
 * @param tags Lista de tags a filtrar
 * @param searchTerm Término de búsqueda
 * @returns Tags filtrados
 */
const filterBySearchTerm = (tags: TagComplete[], searchTerm: string) => {
  if (!searchTerm) return tags;

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  return tags.filter(tag =>
    tag.name.toLowerCase().includes(lowerCaseSearchTerm) ||
    tag.description?.toLowerCase().includes(lowerCaseSearchTerm)
  );
};

/**
 * Filtra tags por categoría
 * @param tags Lista de tags a filtrar
 * @param category Categoría a filtrar (null = todas)
 * @returns Tags filtrados
 */
const filterByCategory = (tags: TagComplete[], category: string | null) => {
  if (!category) return tags;
  return tags.filter(tag => tag.category === category);
};

/**
 * Ordena tags según el criterio especificado
 * @param tags Lista de tags a ordenar
 * @param sortBy Criterio de ordenación
 * @returns Tags ordenados
 */
const sortTags = (tags: TagComplete[], sortBy: TagSortCriteria) => {
  const tagsCopy = [...tags];

  switch (sortBy) {
    case TagSortCriteria.NAME_ASC:
      return tagsCopy.sort((a, b) => a.name.localeCompare(b.name));

    case TagSortCriteria.NAME_DESC:
      return tagsCopy.sort((a, b) => b.name.localeCompare(a.name));

    case TagSortCriteria.CREATED_ASC:
      return tagsCopy.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    case TagSortCriteria.CREATED_DESC:
      return tagsCopy.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    case TagSortCriteria.UPDATED_ASC:
      return tagsCopy.sort((a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      );

    case TagSortCriteria.UPDATED_DESC:
      return tagsCopy.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    case TagSortCriteria.USAGE_ASC:
      return tagsCopy.sort((a, b) => {
        const aCount = a._count ?
          (a._count.images || 0) + (a._count.videos || 0) : 0;
        const bCount = b._count ?
          (b._count.images || 0) + (b._count.videos || 0) : 0;
        return aCount - bCount;
      });

    case TagSortCriteria.USAGE_DESC:
      return tagsCopy.sort((a, b) => {
        const aCount = a._count ?
          (a._count.images || 0) + (a._count.videos || 0) : 0;
        const bCount = b._count ?
          (b._count.images || 0) + (b._count.videos || 0) : 0;
        return bCount - aCount;
      });

    default:
      return tagsCopy;
  }
};

/**
 * Selectores optimizados - Deben ser utilizados dentro de componentes con React.useMemo
 */

/**
 * Devuelve tags filtrados por el término de búsqueda actual
 */
export const useFilteredTags = () => {
  const { items, filters } = useTagStore();
  const { searchTerm, category } = filters;

  // Aplicar filtros en cadena
  return filterByCategory(
    filterBySearchTerm(items, searchTerm),
    category
  );
};

/**
 * Devuelve tags filtrados y ordenados
 */
export const useFilteredAndSortedTags = () => {
  const filteredTags = useFilteredTags();
  const { sortBy } = useTagStore(state => state.filters);

  return sortTags(filteredTags, sortBy);
};

/**
 * Devuelve tags agrupados por categoría
 */
export const useTagsGroupedByCategory = () => {
  const filteredAndSortedTags = useFilteredAndSortedTags();
  return createTagsGroupedByCategory(filteredAndSortedTags);
};

/**
 * Devuelve todas las categorías disponibles con conteo
 */
export const useTagCategories = () => {
  const tags = useTagStore(state => state.items);

  const categories = tags.reduce((acc, tag) => {
    const category = tag.category || 'general';
    if (!acc[category]) {
      acc[category] = { count: 0, name: category };
    }
    acc[category].count++;
    return acc;
  }, {} as Record<string, { count: number; name: string }>);

  return Object.values(categories).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Devuelve tags favoritos
 */
export const useFavoriteTags = () => {
  const tags = useTagStore(state => state.items);
  return tags.filter(tag => tag.isFavorite);
};

/**
 * Devuelve estadísticas generales sobre los tags
 */
export const useTagsStats = () => {
  const tags = useTagStore(state => state.items);

  return {
    total: tags.length,
    favorites: tags.filter(tag => tag.isFavorite).length,
    withShortcuts: tags.filter(tag => !!tag.shortcut).length,
    withDescription: tags.filter(tag => !!tag.description).length,
    categoriesCount: new Set(tags.map(tag => tag.category || 'general')).size,
    mostUsedTag: tags.length > 0
      ? tags.reduce((prev, current) => {
          const prevUsage = prev._count ?
            (prev._count.images || 0) + (prev._count.videos || 0) : 0;
          const currentUsage = current._count ?
            (current._count.images || 0) + (current._count.videos || 0) : 0;
          return currentUsage > prevUsage ? current : prev;
        })
      : null
  };
};