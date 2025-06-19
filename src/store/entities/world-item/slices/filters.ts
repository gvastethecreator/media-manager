/**
 * @file Slice para los filtros del store de WorldItem
 * @module store/entities/world-item/slices/filters
 */

import { WorldItemSortCriteria } from '@/types/entities/world-item/enums';
import type { WorldItemFilters } from '@/types/entities/world-item/types';
import type { StateCreator } from 'zustand';
import type { WorldItemActions, WorldItemState } from '../types';

export interface WorldItemFiltersSlice {
	filters: WorldItemFilters;
	updateFilters: (filters: Partial<WorldItemFilters>) => void;
	clearFilters: () => void;
	getFilteredWorldItems: () => any[];
	getSortedWorldItems: () => any[];
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
		category: null,
		rarity: null,
		type: null,
	},
	updateFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
	clearFilters: () =>
		set({
			filters: {
				sortBy: WorldItemSortCriteria.NAME_ASC,
				searchTerm: '',
				category: null,
				rarity: null,
				type: null,
			},
		}),
	getFilteredWorldItems: () => {
		const { worldItems, filters } = get();
		const { searchTerm, category, rarity, type } = filters;
		return worldItems.filter((item) => {
			const nameMatch =
				!searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
			const categoryMatch = !category || item.category === category;
			const rarityMatch = !rarity || item.rarity === rarity;
			const typeMatch = !type || item.type === type;
			return nameMatch && categoryMatch && rarityMatch && typeMatch;
		});
	},
	getSortedWorldItems: () => {
		const {
			filters: { sortBy },
		} = get();
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
