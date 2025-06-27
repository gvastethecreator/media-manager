/**
 * @file Store principal de Zustand para la entidad Property.
 * @module store/entities/property
 * @description Combina los slices (core, ui, filters) en un único store.
 *   - Usa `immer` para actualizaciones inmutables.
 *   - Usa `devtools` para debugging.
 *   - Usa `persist` para guardar filtros y configuraciones de UI.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createPropertyCoreSlice } from './slices/core';
import { createPropertyFilterSlice } from './slices/filters';
import { createPropertyUISlice } from './slices/ui';
import type { PropertyStore } from './types';

export const usePropertyStore = create<PropertyStore>()(
	devtools(
		persist(
			immer((...a) => ({
				...createPropertyCoreSlice(...a),
				...createPropertyUISlice(...a),
				...createPropertyFilterSlice(...a),
			})),
			{
				name: 'property-store-v2', // Versión actualizada
				partialize: (state) => ({
					// Solo persistir lo que no es dato de sesión
					filters: state.filters,
					viewMode: state.viewMode,
				}),
			}
		),
		{ name: 'PropertyStore' }
	)
);
