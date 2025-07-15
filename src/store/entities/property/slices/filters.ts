/**
 * @file Slice de filtros para el store de Property.
 * @module store/entities/property/slices/filters
 * @description Gestiona el estado de los filtros para las propiedades.
 */

import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import { type PropertyFilterActions, type PropertyFilters, PropertySortCriteria, type PropertyStore } from '../types';

const initialState: PropertyFilters = {
	sortBy: PropertySortCriteria.NAME_ASC,
	searchTerm: '',
	category: null,
	onlyFavorites: false,
};

export const createPropertyFilterSlice: StateCreator<
	PropertyStore,
	[['zustand/immer', never]],
	[],
	{ filters: PropertyFilters } & PropertyFilterActions
> = (set, _get) => ({
	filters: initialState,

	updateFilters: (newFilters: Partial<PropertyFilters>) => {
		set(
			produce((draft) => {
				draft.filters = { ...draft.filters, ...newFilters };
			})
		);
	},

	clearFilters: () => {
		set(
			produce((draft) => {
				draft.filters = initialState;
			})
		);
	},
});
