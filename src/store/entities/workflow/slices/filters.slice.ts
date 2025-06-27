/**
 * @file Slice de filtros para el store de Workflow.
 * @module store/entities/workflow/slices/filters
 * @description Gestiona el estado de los filtros y la ordenación para los workflows.
 */

import type { StateCreator } from 'zustand';
import {
    type WorkflowFilterActions,
    type WorkflowFilterState,
    type WorkflowFilters,
    WorkflowSortCriteria,
    type WorkflowStore,
} from '../types';

const initialState: WorkflowFilterState = {
	filters: {
		searchTerm: '',
		tags: [],
		isFavorite: undefined,
	},
	sortBy: WorkflowSortCriteria.NAME_ASC,
};

export const createWorkflowFilterSlice: StateCreator<
	WorkflowStore,
	[['zustand/immer', never]],
	[],
	WorkflowFilterState & WorkflowFilterActions
> = (set, get) => ({
	...initialState,

	updateFilters: (newFilters: Partial<WorkflowFilters>) => {
		set(state => {
			state.filters = { ...state.filters, ...newFilters };
		});
	},

	setSortBy: sortBy => {
		set(state => {
			state.sortBy = sortBy;
		});
	},

	clearFilters: () => {
		set(state => {
			state.filters = initialState.filters;
			state.sortBy = initialState.sortBy;
		});
	},
});
