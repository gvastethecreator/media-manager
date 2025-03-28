/**
 * @file Implementación del store completo para la entidad Character
 * @module store/entities/character
 */

import type { CharacterExtended, CharacterSortOption, CharacterViewConfig } from '@/types/entities/character';
import { CHARACTER_KEY_PREFIX } from '@/utils/character';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createCharacterCoreSlice } from './slices/core';
import { createCharacterFiltersSlice } from './slices/filters';
import { createCharacterUISlice } from './slices/ui';
import type { CharacterState, CharacterStore } from './types';

/**
 * Estado inicial para el store de Character
 */
const initialState: CharacterState = {
	// Datos principales
	characters: {},

	// Estado UI
	viewConfig: {
		mode: 'grid',
		gridColumns: 3,
		cardSize: 'medium',
		showStats: true,
		showDescription: true,
		defaultView: 'cards',
	},
	selectedCharacterId: null,
	hoveredCharacterId: null,
	expandedCharacterIds: [],

	// Estado de carga y errores
	isLoading: false,
	error: null,

	// Filtrado y ordenamiento
	activeFilters: [],
	searchTerm: '',
	defaultSortOption: 'name_asc',
	currentSortOption: 'name_asc',

	// Agrupamiento
	groupBy: 'none',
};

/**
 * Crea y exporta el store de Character con persistencia
 */
export const useCharacterStore = create<CharacterStore>()(
	persist(
		(...a) => ({
			...initialState,
			...createCharacterCoreSlice(...a),
			...createCharacterUISlice(...a),
			...createCharacterFiltersSlice(...a),
		}),
		{
			name: `${CHARACTER_KEY_PREFIX}store`,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				characters: state.characters,
				viewConfig: state.viewConfig,
				defaultSortOption: state.defaultSortOption,
				currentSortOption: state.currentSortOption,
				groupBy: state.groupBy,
			}),
		}
	)
);

/**
 * Selectores útiles para obtener rápidamente datos del store
 */

/**
 * Obtiene un personaje específico por ID
 * @param id ID del personaje
 * @returns Personaje encontrado o undefined
 */
export const selectCharacterById = (id: string): CharacterExtended | undefined =>
	useCharacterStore((state) => state.characters[id]);

/**
 * Obtiene los personajes ordenados según la opción actual
 * @returns Array de personajes ordenados
 */
export const selectSortedCharacters = (): CharacterExtended[] =>
	useCharacterStore((state) => state.getSortedCharacters());

/**
 * Obtiene los personajes agrupados según el criterio actual
 * @returns Objeto con grupos de personajes
 */
export const selectGroupedCharacters = (): Record<string, CharacterExtended[]> =>
	useCharacterStore((state) => state.getGroupedCharacters());

/**
 * Obtiene los personajes filtrados
 * @returns Array de personajes filtrados
 */
export const selectFilteredCharacters = (): CharacterExtended[] =>
	useCharacterStore((state) => state.getFilteredCharacters());

/**
 * Obtiene solo los personajes favoritos
 * @returns Array de personajes favoritos
 */
export const selectFavoriteCharacters = (): CharacterExtended[] =>
	useCharacterStore((state) => Object.values(state.characters).filter((character) => character.isFavorite));

/**
 * Obtiene el personaje seleccionado actualmente
 * @returns Personaje seleccionado o undefined
 */
export const selectCurrentCharacter = (): CharacterExtended | undefined =>
	useCharacterStore((state) => {
		const selectedId = state.selectedCharacterId;
		return selectedId ? state.characters[selectedId] : undefined;
	});

/**
 * Obtiene la configuración actual de visualización
 * @returns Configuración de visualización
 */
export const selectViewConfig = (): CharacterViewConfig => useCharacterStore((state) => state.viewConfig);

/**
 * Obtiene los IDs de personajes que están expandidos
 * @returns Array de IDs de personajes expandidos
 */
export const selectExpandedCharacterIds = (): string[] => useCharacterStore((state) => state.expandedCharacterIds);

/**
 * Obtiene la opción de ordenamiento actual
 * @returns Opción de ordenamiento
 */
export const selectCurrentSortOption = (): CharacterSortOption => useCharacterStore((state) => state.currentSortOption);
