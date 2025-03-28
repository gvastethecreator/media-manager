/**
 * @file Implementación del slice principal para Character
 * @module store/entities/character/slices/core
 */

import { serializeArray, serializeObject, toCharacterExtended } from '@/transformers/character';
import type { CharacterBase, CharacterExtended } from '@/types/entities/character';
import { generateCharacterId } from '@/utils/character';
import type { StateCreator } from 'zustand';
import type { CharacterCoreSlice, CharacterState } from '../types';

/**
 * Crea el slice principal para Character
 * Contiene operaciones CRUD y gestión de datos
 */
export const createCharacterCoreSlice: StateCreator<CharacterState & CharacterCoreSlice, [], [], CharacterCoreSlice> = (
	set,
	get
) => ({
	/**
	 * Añade un nuevo personaje al store
	 * @param character Datos del personaje
	 */
	addCharacter: (character: CharacterBase | CharacterExtended) => {
		set((state) => {
			// Asegurarse de que el personaje tiene un ID
			const characterWithId = {
				...character,
				id: character.id || generateCharacterId(),
			};

			// Convertir a CharacterExtended si no lo es ya
			const characterExtended =
				'isSelected' in characterWithId
					? (characterWithId as CharacterExtended)
					: toCharacterExtended(characterWithId as CharacterBase);

			// Añadir al store
			return {
				characters: {
					...state.characters,
					[characterExtended.id]: characterExtended,
				},
			};
		});
	},

	/**
	 * Actualiza un personaje existente
	 * @param characterId ID del personaje
	 * @param updates Datos a actualizar
	 */
	updateCharacter: (characterId: string, updates: Partial<CharacterBase>) => {
		set((state) => {
			const currentCharacter = state.characters[characterId];

			if (!currentCharacter) {
				return state;
			}

			// Serializar datos complejos si es necesario
			const processedUpdates = { ...updates };

			if (updates.stats && typeof updates.stats !== 'string') {
				processedUpdates.stats = serializeObject(updates.stats);
			}

			if (updates.filters && typeof updates.filters !== 'string') {
				processedUpdates.filters = serializeArray(updates.filters);
			}

			if (updates.relationships && typeof updates.relationships !== 'string') {
				processedUpdates.relationships = serializeArray(updates.relationships);
			}

			if (updates.goals && typeof updates.goals !== 'string') {
				processedUpdates.goals = serializeArray(updates.goals);
			}

			if (updates.fears && typeof updates.fears !== 'string') {
				processedUpdates.fears = serializeArray(updates.fears);
			}

			if (updates.beliefs && typeof updates.beliefs !== 'string') {
				processedUpdates.beliefs = serializeArray(updates.beliefs);
			}

			if (updates.personality && typeof updates.personality !== 'string') {
				processedUpdates.personality = serializeArray(updates.personality);
			}

			// Actualizar fecha de modificación
			processedUpdates.updatedAt = new Date();

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...currentCharacter,
						...processedUpdates,
					},
				},
			};
		});
	},

	/**
	 * Elimina un personaje del store
	 * @param characterId ID del personaje
	 */
	removeCharacter: (characterId: string) => {
		set((state) => {
			const { [characterId]: removed, ...remaining } = state.characters;
			return { characters: remaining };
		});
	},

	/**
	 * Añade múltiples personajes al store
	 * @param characters Array de personajes
	 */
	bulkAddCharacters: (characters: (CharacterBase | CharacterExtended)[]) => {
		set((state) => {
			const newCharacters = { ...state.characters };

			characters.forEach((character) => {
				// Asegurarse de que el personaje tiene un ID
				const characterWithId = {
					...character,
					id: character.id || generateCharacterId(),
				};

				// Convertir a CharacterExtended si no lo es ya
				const characterExtended =
					'isSelected' in characterWithId
						? (characterWithId as CharacterExtended)
						: toCharacterExtended(characterWithId as CharacterBase);

				newCharacters[characterExtended.id] = characterExtended;
			});

			return { characters: newCharacters };
		});
	},

	/**
	 * Actualiza múltiples personajes
	 * @param updates Array de actualizaciones (id y datos)
	 */
	bulkUpdateCharacters: (updates: Array<{ id: string; data: Partial<CharacterBase> }>) => {
		set((state) => {
			const newCharacters = { ...state.characters };

			updates.forEach(({ id, data }) => {
				const currentCharacter = newCharacters[id];

				if (currentCharacter) {
					// Serializar datos complejos si es necesario
					const processedUpdates = { ...data };

					if (data.stats && typeof data.stats !== 'string') {
						processedUpdates.stats = serializeObject(data.stats);
					}

					if (data.filters && typeof data.filters !== 'string') {
						processedUpdates.filters = serializeArray(data.filters);
					}

					if (data.relationships && typeof data.relationships !== 'string') {
						processedUpdates.relationships = serializeArray(data.relationships);
					}

					// Actualizar fecha de modificación
					processedUpdates.updatedAt = new Date();

					newCharacters[id] = {
						...currentCharacter,
						...processedUpdates,
					};
				}
			});

			return { characters: newCharacters };
		});
	},

	/**
	 * Elimina múltiples personajes
	 * @param characterIds IDs de personajes a eliminar
	 */
	bulkRemoveCharacters: (characterIds: string[]) => {
		set((state) => {
			const newCharacters = { ...state.characters };

			characterIds.forEach((id) => {
				delete newCharacters[id];
			});

			return { characters: newCharacters };
		});
	},

	/**
	 * Alterna el estado favorito de un personaje
	 * @param characterId ID del personaje
	 */
	toggleFavorite: (characterId: string) => {
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
						isFavorite: !character.isFavorite,
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Establece la imagen destacada de un personaje
	 * @param characterId ID del personaje
	 * @param imageId ID de la imagen o null para quitar
	 */
	setFeaturedImage: (characterId: string, imageId: string | null) => {
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
						featuredImage: imageId,
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Incrementa el nivel de un personaje
	 * @param characterId ID del personaje
	 */
	incrementLevel: (characterId: string) => {
		set((state) => {
			const character = state.characters[characterId];

			if (!character) {
				return state;
			}

			const currentLevel =
				typeof character.level === 'number' ? character.level : Number.parseInt(character.level || '1', 10) || 1;

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						level: currentLevel + 1,
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Decrementa el nivel de un personaje (mínimo 1)
	 * @param characterId ID del personaje
	 */
	decrementLevel: (characterId: string) => {
		set((state) => {
			const character = state.characters[characterId];

			if (!character) {
				return state;
			}

			const currentLevel =
				typeof character.level === 'number' ? character.level : Number.parseInt(character.level || '1', 10) || 1;

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						level: Math.max(1, currentLevel - 1),
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Establece el estado de carga global
	 * @param isLoading Estado de carga
	 */
	setLoading: (isLoading: boolean) => {
		set({ isLoading });
	},

	/**
	 * Establece un mensaje de error global
	 * @param error Mensaje de error o null
	 */
	setError: (error: string | null) => {
		set({ error });
	},

	/**
	 * Limpia el mensaje de error global
	 */
	clearError: () => {
		set({ error: null });
	},

	/**
	 * Añade una relación entre personajes
	 * @param characterId ID del personaje origen
	 * @param targetId ID del personaje destino
	 * @param targetName Nombre del personaje destino
	 * @param type Tipo de relación
	 * @param strength Fuerza de la relación (0-100)
	 */
	addRelationship: (characterId: string, targetId: string, targetName: string, type: string, strength: number) => {
		set((state) => {
			const character = state.characters[characterId];

			if (!character) {
				return state;
			}

			const newRelationship = {
				characterId: targetId,
				name: targetName,
				type,
				strength: Math.max(0, Math.min(100, strength)),
			};

			// Obtener relaciones actuales y agregar la nueva
			const currentRelationships = character.parsedRelationships || [];
			const updatedRelationships = [...currentRelationships.filter((r) => r.characterId !== targetId), newRelationship];

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						parsedRelationships: updatedRelationships,
						relationships: serializeArray(updatedRelationships),
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Elimina una relación entre personajes
	 * @param characterId ID del personaje origen
	 * @param targetId ID del personaje destino
	 */
	removeRelationship: (characterId: string, targetId: string) => {
		set((state) => {
			const character = state.characters[characterId];

			if (!character || !character.parsedRelationships) {
				return state;
			}

			// Filtrar la relación a eliminar
			const updatedRelationships = character.parsedRelationships.filter((r) => r.characterId !== targetId);

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						parsedRelationships: updatedRelationships,
						relationships: serializeArray(updatedRelationships),
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Restablece la lista de personajes
	 */
	resetCharacters: () => {
		set({ characters: {} });
	},

	/**
	 * Restablece todo el estado
	 */
	resetState: () => {
		set({
			characters: {},
			selectedCharacterId: null,
			hoveredCharacterId: null,
			expandedCharacterIds: [],
			isLoading: false,
			error: null,
			activeFilters: [],
			searchTerm: '',
			currentSortOption: get().defaultSortOption,
		});
	},
});
