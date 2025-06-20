/**
 * @file Implementación del slice de UI para Character
 * @module store/entities/character/slices/ui
 */

import type { CharacterViewConfig } from '@/types/entities/character';
import type { StateCreator } from 'zustand';
import type { CharacterState, CharacterUISlice } from '../types';

/**
 * Crea el slice de UI para Character
 * Contiene operaciones relacionadas con el estado visual y la interacción
 */
export const createCharacterUISlice: StateCreator<CharacterState & CharacterUISlice, [], [], CharacterUISlice> = (
	set,
	get
) => ({
	/**
	 * Obtiene la configuración actual de visualización
	 * @returns Configuración de visualización
	 */
	getViewConfig: () => {
		return get().viewConfig;
	},

	/**
	 * Actualiza la configuración de visualización
	 * @param config Configuración parcial para aplicar
	 */
	setViewConfig: (config: Partial<CharacterViewConfig>) => {
		set((state) => ({
			viewConfig: {
				...state.viewConfig,
				...config,
			},
		}));
	},

	/**
	 * Establece el número de columnas en modo grid
	 * @param columns Número de columnas (1-6)
	 */
	setGridColumns: (columns: number) => {
		set((state) => ({
			viewConfig: {
				...state.viewConfig,
				gridColumns: Math.min(Math.max(1, columns), 6),
			},
		}));
	},

	/**
	 * Establece el tamaño de las tarjetas
	 * @param size Tamaño de tarjeta
	 */
	setCardSize: (size: 'small' | 'medium' | 'large') => {
		set((state) => ({
			viewConfig: {
				...state.viewConfig,
				cardSize: size,
			},
		}));
	},

	/**
	 * Selecciona un personaje
	 * @param characterId ID del personaje o null para deseleccionar
	 */
	selectCharacter: (characterId: string | null) => {
		set({ selectedCharacterId: characterId });
	},

	/**
	 * Establece el estado de hover sobre un personaje
	 * @param characterId ID del personaje o null para quitar hover
	 */
	hoverCharacter: (characterId: string | null) => {
		set({ hoveredCharacterId: characterId });
	},

	/**
	 * Alterna el estado expandido de un personaje
	 * @param characterId ID del personaje
	 */
	toggleExpandCharacter: (characterId: string) => {
		set((state) => {
			const isCurrentlyExpanded = state.expandedCharacterIds.includes(characterId);

			// Actualizar array de IDs expandidos
			const expandedCharacterIds = isCurrentlyExpanded
				? state.expandedCharacterIds.filter((id) => id !== characterId)
				: [...state.expandedCharacterIds, characterId];

			// El estado expandido se maneja solo en expandedCharacterIds
			return { expandedCharacterIds };
		});
	},

	/**
	 * Expande un personaje
	 * @param characterId ID del personaje
	 */
	expandCharacter: (characterId: string) => {
		set((state) => {
			// Verificar si ya está expandido
			if (state.expandedCharacterIds.includes(characterId)) {
				return state;
			}

			// Actualizar array de IDs expandidos
			const expandedCharacterIds = [...state.expandedCharacterIds, characterId];

			// El estado expandido se maneja solo en expandedCharacterIds
			return { expandedCharacterIds };
		});
	},

	/**
	 * Colapsa un personaje
	 * @param characterId ID del personaje
	 */
	collapseCharacter: (characterId: string) => {
		set((state) => {
			// Verificar si no está expandido
			if (!state.expandedCharacterIds.includes(characterId)) {
				return state;
			}

			// Actualizar array de IDs expandidos
			const expandedCharacterIds = state.expandedCharacterIds.filter((id) => id !== characterId);

			// El estado expandido se maneja solo en expandedCharacterIds
			return { expandedCharacterIds };
		});
	},

	/**
	 * Expande todos los personajes
	 */
	expandAllCharacters: () => {
		set((state) => {
			const characterIds = Object.keys(state.characters);

			// El estado expandido se maneja solo en expandedCharacterIds
			return {
				expandedCharacterIds: characterIds,
			};
		});
	},

	/**
	 * Colapsa todos los personajes
	 */
	collapseAllCharacters: () => {
		set(() => {
			// El estado expandido se maneja solo en expandedCharacterIds
			return {
				expandedCharacterIds: [],
			};
		});
	},

	/**
	 * Establece el estado de carga para un personaje específico
	 * @param characterId ID del personaje
	 * @param isLoading Estado de carga
	 */
	setCharacterLoading: (characterId: string, isLoading: boolean) => {
		// El estado de carga se maneja en el estado general del store
		// Los componentes pueden verificar isLoading del estado general
		set({ isLoading });
	},

	/**
	 * Establece el estado de error para un personaje específico
	 * @param characterId ID del personaje
	 * @param hasError Indica si hay error
	 */
	setCharacterError: (characterId: string, hasError: boolean) => {
		// El estado de error se maneja en el estado general del store
		set({ error: hasError ? 'Error en el personaje' : null });
	},

	/**
	 * Restablece el estado de la UI
	 */
	resetUIState: () => {
		set({
			selectedCharacterId: null,
			hoveredCharacterId: null,
			expandedCharacterIds: [],
			isLoading: false,
			error: null,
		});
	},
});
