/**
 * @file Slice para los filtros del store de WorldItem
 * @module store/entities/world-item/slices/filters
 */

import type { StateCreator } from 'zustand';
import { WorldItemSortCriteria } from '@/types/entities/world-item/enums';
import type { WorldItemFilters } from '@/types/entities/world-item/types';
import type { WorldItem, WorldItemActions, WorldItemState } from '../types';

// Extender WorldItemFilters para incluir sortBy
interface ExtendedWorldItemFilters extends WorldItemFilters {
	sortBy: WorldItemSortCriteria;
}

export interface WorldItemFiltersSlice {
	clearFilters: () => void;
	filters: ExtendedWorldItemFilters;
	getFilteredWorldItems: () => WorldItem[];
	getSortedWorldItems: () => WorldItem[];
	setSearchQuery: (query: string) => void;
	updateFilters: (filters: Partial<ExtendedWorldItemFilters>) => void;
}

export const createWorldItemFiltersSlice: StateCreator<
	WorldItemState & WorldItemActions,
	[],
	[],
	WorldItemFiltersSlice
> = (set, get) => ({
	filters: {
		sortBy: WorldItemSortCriteria.NAME_ASC,
		searchTerm: '',
		category: undefined,
		rarity: undefined,
		type: undefined,
	} as ExtendedWorldItemFilters,
	updateFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
	clearFilters: () =>
		set({
			filters: {
				sortBy: WorldItemSortCriteria.NAME_ASC,
				searchTerm: '',
				category: undefined,
				rarity: undefined,
				type: undefined,
			} as ExtendedWorldItemFilters,
		}),
	setSearchQuery: (query) => set((state) => ({ filters: { ...state.filters, searchTerm: query } })),
	getFilteredWorldItems: () => {
		const { worldItems, filters } = get();
		const { searchTerm, category, rarity, type } = filters;
		return worldItems.filter((item) => {
			const nameMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
			const categoryMatch = !category || item.category === category;
			const rarityMatch = !rarity || item.rarity === rarity;
			const typeMatch = !type || item.type === type;
			return nameMatch && categoryMatch && rarityMatch && typeMatch;
		});
	},
	getSortedWorldItems: () => {
		const { filters } = get();
		const extendedFilters = filters as ExtendedWorldItemFilters;
		const { sortBy } = extendedFilters;
		const filtered = get().getFilteredWorldItems();
		return [...filtered].sort((a, b) => {
			switch (sortBy) {
				case WorldItemSortCriteria.NAME_ASC:
					return a.name.localeCompare(b.name);
				case WorldItemSortCriteria.NAME_DESC:
					return b.name.localeCompare(a.name);
				case WorldItemSortCriteria.CREATED_ASC:
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case WorldItemSortCriteria.CREATED_DESC:
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case WorldItemSortCriteria.UPDATED_ASC:
					return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
				case WorldItemSortCriteria.UPDATED_DESC:
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
				case WorldItemSortCriteria.RARITY_ASC:
					return (a.rarity || '').localeCompare(b.rarity || '');
				case WorldItemSortCriteria.RARITY_DESC:
					return (b.rarity || '').localeCompare(a.rarity || '');
				default:
					return 0;
			}
		});
	},
});
