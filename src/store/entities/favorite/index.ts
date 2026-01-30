/**
 * @file Store principal para la entidad Favorite
 * @module store/entities/favorite
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { clientLogger } from '@/lib/logger/client-logger';
import { createSelectors } from '@/lib/utils/store-selectors.utils';

// Importar tipos

// Importar slices
import { ApiActions, ApiState, createApiSlice } from './slices/api.slice';
import { CoreActions, CoreState, createCoreSlice } from './slices/core.slice';
import { createFiltersSlice, FiltersActions, FiltersState } from './slices/filters.slice';
import { createUISlice, UIActions, UIState } from './slices/ui.slice';

const _favoriteLogger = clientLogger.withContext('FavoriteStore');

// Tipo del store completo
export type FavoriteStore = CoreState &
	CoreActions &
	UIState &
	UIActions &
	FiltersState &
	FiltersActions &
	ApiState &
	ApiActions;

// Crear el store con todos los slices
const useFavoriteStoreBase = create<FavoriteStore>()(
	devtools(
		persist(
			(...a) => ({
				...createCoreSlice(...a),
				...createUISlice(...a),
				...createFiltersSlice(...a),
				...createApiSlice(...a),
			}),
			{
				name: 'favorite-store',
				// Solo persistir algunas partes del state
				partialize: (state) => ({
					viewMode: state.viewMode,
					sortCriteria: state.sortCriteria,
					sortDirection: state.sortDirection,
					filters: state.filters,
				}),
			}
		),
		{ name: 'FavoriteStore' }
	)
);

// Exportar el store con selectores
export const useFavoriteStore = createSelectors(useFavoriteStoreBase);

// Re-exportar tipos y constantes
export * from './constants';
export * from './types';
