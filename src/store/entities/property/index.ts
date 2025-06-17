/**
 * @file Store principal para la entidad Property
 * @module store/entities/property
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PropertySortCriteria, PropertyViewMode } from '../../../types/entities/property';
import { createPropertyCoreSlice, type PropertyCoreSlice } from './slices/core';
import { createPropertyFiltersSlice, type PropertyFiltersSlice } from './slices/filters';
import { createPropertyUISlice, type PropertyUISlice } from './slices/ui';
import type { PropertyState } from './types';

// Combinación de todos los slices
export type PropertyStore = PropertyState & PropertyCoreSlice & PropertyUISlice & PropertyFiltersSlice;

// Estado inicial
const initialState: PropertyState = {
	core: {
		properties: {},
		propertyItems: {},
		isLoading: false,
		error: null,
		lastUpdated: null,
	},
	ui: {
		selectedIds: [],
		viewMode: PropertyViewMode.GRID,
		isViewerOpen: false,
		currentPropertyId: null,
		displayState: {},
		draggedPropertyId: null,
		dropTargetPropertyId: null,
		highlightedId: null,
		expandedIds: [],
	},
	filters: {
		sortBy: PropertySortCriteria.NAME_ASC,
		searchQuery: '',
		filterByCategory: null,
		filterFavorites: false,
		dateRange: {
			from: null,
			to: null,
		},
	},
};

// Crear store combinando slices
export const usePropertyStore = create<PropertyStore>()(
	devtools(
		persist(
			(set, get, ...rest) => ({
				...initialState,
				...createPropertyCoreSlice(set, get, ...rest),
				...createPropertyUISlice(set, get, ...rest),
				...createPropertyFiltersSlice(set, get, ...rest),
			}),
			{
				name: 'property-store',
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
		{ name: 'PropertyStore' }
	)
);
