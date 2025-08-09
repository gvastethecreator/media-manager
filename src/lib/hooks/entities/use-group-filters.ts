import { useState } from 'react';
import type { GroupWithStats } from '@/types/entities/group/types';

interface UseGroupFiltersProps {
	groups: GroupWithStats[];
}

interface GroupFiltersState {
	searchQuery: string;
	selectedCategories: string[];
	onlyFavorites: boolean;
}

export function useGroupFilters({ groups }: UseGroupFiltersProps) {
	const [filters, setFilters] = useState<GroupFiltersState>({
		searchQuery: '',
		selectedCategories: [],
		onlyFavorites: false,
	});

	const setSearchQuery = (query: string) => {
		setFilters((prev) => ({ ...prev, searchQuery: query }));
	};

	const toggleCategory = (category: string) => {
		setFilters((prev) => ({
			...prev,
			selectedCategories: prev.selectedCategories.includes(category)
				? prev.selectedCategories.filter((c) => c !== category)
				: [...prev.selectedCategories, category],
		}));
	};

	const setOnlyFavorites = (value: boolean) => {
		setFilters((prev) => ({ ...prev, onlyFavorites: value }));
	};

	// Obtener categorías únicas de los grupos
	const availableCategories = Array.from(new Set(groups.map((group) => group.category).filter(Boolean)));

	// Aplicar filtros
	const filteredGroups = groups.filter((group) => {
		let matches = true;

		// Filtrar por búsqueda
		if (filters.searchQuery) {
			const normalizedQuery = filters.searchQuery.toLowerCase();
			matches =
				Boolean(matches) &&
				(group.name.toLowerCase().includes(normalizedQuery) ||
					Boolean(group.description?.toLowerCase().includes(normalizedQuery)));
		}

		// Filtrar por categorías
		if (filters.selectedCategories.length > 0) {
			matches = Boolean(matches) && (group.category ? filters.selectedCategories.includes(group.category) : false);
		}

		// Filtrar favoritos
		if (filters.onlyFavorites) {
			matches = Boolean(matches) && (group.isFavorite === true);
		}

		return matches;
	});

	return {
		filters,
		setSearchQuery,
		toggleCategory,
		setOnlyFavorites,
		availableCategories,
		filteredGroups,
	};
}
