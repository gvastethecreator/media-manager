/**
 * @file Store principal para la entidad Group
 * @module store/entities/group
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { GroupSortCriteria, GroupViewMode } from '@/types/entities/group';
import { createGroupCoreSlice, type GroupCoreSlice } from './slices/core';
import { createGroupFiltersSlice, type GroupFiltersSlice } from './slices/filters';
import { createGroupUISlice, type GroupUISlice } from './slices/ui';
import type { GroupState } from './types';

// Combinación de todos los slices
export type GroupStore = GroupState & GroupCoreSlice & GroupUISlice & GroupFiltersSlice;

// Estado inicial
const initialState: GroupState = {
	core: {
		groups: {},
		groupItems: {},
		isLoading: false,
		error: null,
		lastUpdated: null,
	},
	ui: {
		selectedIds: [],
		viewMode: GroupViewMode.GRID,
		isViewerOpen: false,
		currentGroupId: null,
		displayState: {},
		draggedGroupId: null,
		dropTargetGroupId: null,
		highlightedId: null,
		expandedIds: [],
	},
	filters: {
		sortBy: GroupSortCriteria.DATE_CREATED_DESC,
		searchQuery: '',
		filterByType: null,
		filterByCategory: null,
		filterFavorites: false,
		dateRange: {
			from: null,
			to: null,
		},
	},
};

// Crear store combinando slices
export const useGroupStore = create<GroupStore>()(
	devtools(
		persist(
			(set, get, ...rest) => ({
				...initialState,
				...createGroupCoreSlice(set, get, ...rest),
				...createGroupUISlice(set, get, ...rest),
				...createGroupFiltersSlice(set, get, ...rest),
			}),
			{
				name: 'group-store',
				partialize: (state) => ({
					ui: {
						viewMode: state.ui.viewMode,
						expandedIds: state.ui.expandedIds,
					},
					filters: {
						sortBy: state.filters.sortBy,
					},
				}),
			}
		),
		{ name: 'GroupStore' }
	)
);
