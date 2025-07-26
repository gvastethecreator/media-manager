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
import type { GroupStore } from './types';

// Crear store combinando slices
export const useGroupStore = create<GroupStore>()(
	devtools(
		persist(
			(set, get, api) => ({
				...createGroupCoreSlice(set, get, api),
				...createGroupUISlice(set, get, api),
				...createGroupFiltersSlice(set, get, api),
			}),
			{
				name: 'group-store',
				partialize: (state) => ({
					viewMode: state.viewMode,
					expandedIds: state.expandedIds,
					sortBy: state.sortBy,
				}),
			}
		),
		{ name: 'GroupStore' }
	)
);
