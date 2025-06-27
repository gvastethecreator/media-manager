/**
 * @file Selectores optimizados para el store de Tag
 * @module store/entities/tag/selectors
 */

import { createTagsGroupedByCategory } from '@/lib/utils/sort';
import { useTagStore } from './index';
import { TagSortCriteria, TagWithStats } from './types';

// Selectores simples directos
export const useAllTags = () => {
	return Object.values(useTagStore((state) => state.tags));
};

export const useSelectedTag = () => {
	const { tags, selectedId } = useTagStore();
	if (!selectedId) return null;
	return tags[selectedId] || null;
};

export const useLoading = () => useTagStore((state) => state.isLoading);
export const useError = () => useTagStore((state) => state.error);
export const useFilters = () => useTagStore((state) => state.filters);
export const useViewMode = () => useTagStore((state) => state.viewMode);

/**
 * Filtra tags por término de búsqueda
 */
const filterBySearchTerm = (tags: TagWithStats[], searchTerm: string) => {
	if (!searchTerm) return tags;
	const lowerCaseSearchTerm = searchTerm.toLowerCase();
	return tags.filter(
		(tag) =>
			tag.name.toLowerCase().includes(lowerCaseSearchTerm) ||
			tag.description?.toLowerCase().includes(lowerCaseSearchTerm)
	);
};

/**
 * Filtra tags por categoría
 */
const filterByCategory = (tags: TagWithStats[], category: string | null) => {
	if (!category) return tags;
	return tags.filter((tag) => tag.category === category);
};

/**
 * Ordena tags según el criterio especificado
 */
const sortTags = (tags: TagWithStats[], sortBy: TagSortCriteria) => {
	const tagsCopy = [...tags];

	switch (sortBy) {
		case TagSortCriteria.NAME_ASC:
			return tagsCopy.sort((a, b) => a.name.localeCompare(b.name));
		case TagSortCriteria.NAME_DESC:
			return tagsCopy.sort((a, b) => b.name.localeCompare(a.name));
		case TagSortCriteria.CREATED_ASC:
			return tagsCopy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		case TagSortCriteria.CREATED_DESC:
			return tagsCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		case TagSortCriteria.UPDATED_ASC:
			return tagsCopy.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
		case TagSortCriteria.UPDATED_DESC:
			return tagsCopy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
		case TagSortCriteria.USAGE_ASC:
			return tagsCopy.sort((a, b) => a.stats.totalRelations - b.stats.totalRelations);
		case TagSortCriteria.USAGE_DESC:
			return tagsCopy.sort((a, b) => b.stats.totalRelations - a.stats.totalRelations);
		default:
			return tagsCopy;
	}
};

/**
 * Devuelve tags filtrados por el término de búsqueda actual
 */
export const useFilteredTags = () => {
	const tags = useAllTags();
	const { searchTerm, category } = useFilters();
	return filterByCategory(filterBySearchTerm(tags, searchTerm), category);
};

/**
 * Devuelve tags filtrados y ordenados
 */
export const useFilteredAndSortedTags = () => {
	const filteredTags = useFilteredTags();
	const { sortBy } = useFilters();
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
	const tags = useAllTags();
	const categories = tags.reduce(
		(acc, tag) => {
			const category = tag.category || 'general';
			if (!acc[category]) {
				acc[category] = { count: 0, name: category };
			}
			acc[category].count++;
			return acc;
		},
		{} as Record<string, { count: number; name: string }>
	);
	return Object.values(categories).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Devuelve tags favoritos
 */
export const useFavoriteTags = () => {
	const tags = useAllTags();
	return tags.filter((tag) => tag.isFavorite);
};

/**
 * Devuelve estadísticas generales sobre los tags
 */
export const useTagsStats = () => {
	const tags = useAllTags();
	return {
		total: tags.length,
		favorites: tags.filter((tag) => tag.isFavorite).length,
		withShortcuts: tags.filter((tag) => !!tag.shortcut).length,
		withDescription: tags.filter((tag) => !!tag.description).length,
		categoriesCount: new Set(tags.map((tag) => tag.category || 'general')).size,
		mostUsedTag:
			tags.length > 0
				? tags.reduce((prev, current) => (current.stats.totalRelations > prev.stats.totalRelations ? current : prev))
				: null,
	};
};
