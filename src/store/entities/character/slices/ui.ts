/**
 * @file Implementación del slice de UI para Character
 * @module store/entities/character/slices/ui
 */

import type { StateCreator } from 'zustand';
import type { CharacterViewConfig } from '@/types/entities/character';
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

		// También actualizar el estado isHovered en cada personaje
		if (characterId !== get().hoveredCharacterId) {
			set((state) => {
				const updatedCharacters = { ...state.characters };

				// Resetear todos los personajes con hover
				for (const id of Object.keys(updatedCharacters)) {
					if (updatedCharacters[id].isHovered) {
						updatedCharacters[id] = {
							...updatedCharacters[id],
							isHovered: false,
						};
					}
				}

				// Establecer hover en el personaje seleccionado
				if (characterId && updatedCharacters[characterId]) {
					updatedCharacters[characterId] = {
						...updatedCharacters[characterId],
						isHovered: true,
					};
				}

				return { characters: updatedCharacters };
			});
		}
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

			// Actualizar estado isOpen en el personaje
			const characters = { ...state.characters };
			if (characters[characterId]) {
				characters[characterId] = {
					...characters[characterId],
					isOpen: !isCurrentlyExpanded,
				};
			}

			return { expandedCharacterIds, characters };
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

			// Actualizar estado isOpen en el personaje
			const characters = { ...state.characters };
			if (characters[characterId]) {
				characters[characterId] = {
					...characters[characterId],
					isOpen: true,
				};
			}

			return { expandedCharacterIds, characters };
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

			// Actualizar estado isOpen en el personaje
			const characters = { ...state.characters };
			if (characters[characterId]) {
				characters[characterId] = {
					...characters[characterId],
					isOpen: false,
				};
			}

			return { expandedCharacterIds, characters };
		});
	},

	/**
	 * Expande todos los personajes
	 */
	expandAllCharacters: () => {
		set((state) => {
			const characterIds = Object.keys(state.characters);

			// Actualizar cada personaje
			const updatedCharacters = { ...state.characters };
			for (const id of characterIds) {
				updatedCharacters[id] = {
					...updatedCharacters[id],
					isOpen: true,
				};
			}

			return {
				expandedCharacterIds: characterIds,
				characters: updatedCharacters,
			};
		});
	},

	/**
	 * Colapsa todos los personajes
	 */
	collapseAllCharacters: () => {
		set((state) => {
			// Actualizar cada personaje
			const updatedCharacters = { ...state.characters };
			for (const id of Object.keys(updatedCharacters)) {
				updatedCharacters[id] = {
					...updatedCharacters[id],
					isExpanded: false,
				};
			}

			return {
				expandedCharacterIds: [],
				characters: updatedCharacters,
			};
		});
	},

	/**
	 * Establece el estado de carga para un personaje específico
	 * @param characterId ID del personaje
	 * @param isLoading Estado de carga
	 */
	setCharacterLoading: (characterId: string, isLoading: boolean) => {
		set((state) => {
			const character = state.characters[characterId];

			if (!character) {
				return state;
			}

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						isLoading,
					},
				},
			};
		});
	},

	/**
	 * Establece el estado de error para un personaje específico
	 * @param characterId ID del personaje
	 * @param hasError Indica si hay error
	 */
	setCharacterError: (characterId: string, hasError: boolean) => {
		set((state) => {
			const character = state.characters[characterId];

			if (!character) {
				return state;
			}

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						hasError,
					},
				},
			};
		});
	},

	/**
	 * Restablece el estado de la UI
	 */
	resetUIState: () => {
		set((state) => {
			// Resetear estados de UI en cada personaje
			const updatedCharacters = { ...state.characters };
			for (const id of Object.keys(updatedCharacters)) {
				updatedCharacters[id] = {
					...updatedCharacters[id],
					isSelected: false,
					isExpanded: false,
					isEditing: false,
				};
			}

			return {
				selectedCharacterId: null,
				hoveredCharacterId: null,
				expandedCharacterIds: [],
				characters: updatedCharacters,
			};
		});
	},
});
