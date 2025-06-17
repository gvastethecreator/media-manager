/**
 * @file Store principal para la entidad Wildcard
 * @module store/entities/wildcard
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { WildcardSortCriteria, WildcardViewMode } from '../../../types/entities/wildcard';
import { createWildcardCoreSlice, type WildcardCoreSlice } from './slices/core';
import { createWildcardFiltersSlice, type WildcardFiltersSlice } from './slices/filters';
import { createWildcardUISlice, type WildcardUISlice } from './slices/ui';
import type { WildcardState } from './types';

// Combinación de todos los slices
export type WildcardStore = WildcardState & WildcardCoreSlice & WildcardUISlice & WildcardFiltersSlice;

// Estado inicial
const initialState: WildcardState = {
	core: {
		wildcards: {},
		wildcardItems: {},
		isLoading: false,
		error: null,
		lastUpdated: null,
	},
	ui: {
		selectedIds: [],
		viewMode: WildcardViewMode.GRID,
		isViewerOpen: false,
		currentWildcardId: null,
		displayState: {},
		draggedWildcardId: null,
		dropTargetWildcardId: null,
		highlightedId: null,
		expandedIds: [],
	},
	filters: {
		sortBy: WildcardSortCriteria.NAME_ASC,
		searchQuery: '',
		filterByCategory: null,
		filterFavorites: false,
		parentId: null,
		onlyWithChildren: false,
		dateRange: {
			from: null,
			to: null,
		},
	},
};

// Crear store combinando slices
export const useWildcardStore = create<WildcardStore>()(
	devtools(
		persist(
			(set, get, ...rest) => ({
				...initialState,
				...createWildcardCoreSlice(set, get, ...rest),
				...createWildcardUISlice(set, get, ...rest),
				...createWildcardFiltersSlice(set, get, ...rest),
			}),
			{
				name: 'wildcard-store',
				partialize: (state) => ({
					ui: {
						viewMode: state.ui.viewMode,
						expandedIds: state.ui.expandedIds,
					},
					filters: {
						sortBy: state.filters.sortBy,
						parentId: state.filters.parentId,
					},
				}),
			}
		),
		{ name: 'WildcardStore' }
	)
);
