/**
 * @file Implementación del slice principal para Character
 * @module store/entities/character/slices/core
 */

import { serializeArray, serializeStats } from '@/transformers/character/serializers';
import { transformCharacterToExtended } from '@/transformers/character/transformer';
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
					: transformCharacterToExtended(characterWithId as CharacterBase);

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
				processedUpdates.stats = serializeStats(updates.stats);
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

			for (const character of characters) {
				// Asegurarse de que el personaje tiene un ID
				const characterWithId = {
					...character,
					id: character.id || generateCharacterId(),
				};

				// Convertir a CharacterExtended si no lo es ya
				const characterExtended =
					'isSelected' in characterWithId
						? (characterWithId as CharacterExtended)
						: transformCharacterToExtended(characterWithId as CharacterBase);

				newCharacters[characterExtended.id] = characterExtended;
			}

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

			for (const { id, data } of updates) {
				const currentCharacter = newCharacters[id];

				if (currentCharacter) {
					// Serializar datos complejos si es necesario
					const processedUpdates = { ...data };

					if (data.stats && typeof data.stats !== 'string') {
						processedUpdates.stats = serializeStats(data.stats);
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
			}

			return { characters: newCharacters };
		});
	},

	/**
	 * Elimina múltiples personajes
	 * @param characterIds IDs de los personajes a eliminar
	 */
	bulkRemoveCharacters: (characterIds: string[]) => {
		set((state) => {
			const newCharacters = { ...state.characters };
			for (const id of characterIds) {
				delete newCharacters[id];
			}
			return { characters: newCharacters };
		});
	},

	/**
	 * Cambia el estado de favorito de un personaje
	 * @param characterId ID del personaje
	 */
	toggleFavorite: (characterId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) return state;

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
			if (!character) return state;

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
			if (!character) return state;

			const currentLevel = typeof character.level === 'number' ? character.level : 1;

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
	 * Decrementa el nivel de un personaje (min 1)
	 * @param characterId ID del personaje
	 */
	decrementLevel: (characterId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) return state;

			const currentLevel = typeof character.level === 'number' ? character.level : 1;
			const newLevel = Math.max(1, currentLevel - 1);

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						level: newLevel,
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Establece el estado de carga
	 * @param isLoading Estado de carga
	 */
	setLoading: (isLoading: boolean) => {
		set({ isLoading });
	},

	/**
	 * Establece un mensaje de error
	 * @param error Mensaje de error o null
	 */
	setError: (error: string | null) => {
		set({ error });
	},

	/**
	 * Limpia el mensaje de error
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
	 * @param strength Fuerza de la relación (1-10)
	 */
	addRelationship: (characterId: string, targetId: string, targetName: string, type: string, strength: number) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) return state;

			// Extraer relaciones existentes
			let relationships = [];
			if (character.relationships) {
				if (typeof character.relationships === 'string') {
					try {
						relationships = JSON.parse(character.relationships);
					} catch (e) {
						relationships = [];
					}
				} else {
					relationships = character.relationships;
				}
			}

			// Filtrar relación existente con el mismo destino si existe
			const filteredRelationships = relationships.filter((rel: any) => rel.targetId !== targetId);

			// Añadir nueva relación
			const newRelationships = [
				...filteredRelationships,
				{
					targetId,
					targetName,
					type,
					strength: Math.min(10, Math.max(1, strength)),
				},
			];

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						relationships: serializeArray(newRelationships),
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
			if (!character) return state;

			// Extraer relaciones existentes
			let relationships = [];
			if (character.relationships) {
				if (typeof character.relationships === 'string') {
					try {
						relationships = JSON.parse(character.relationships);
					} catch (e) {
						relationships = [];
					}
				} else {
					relationships = character.relationships;
				}
			}

			// Filtrar relación a eliminar
			const filteredRelationships = relationships.filter((rel: any) => rel.targetId !== targetId);

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						relationships: serializeArray(filteredRelationships),
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Obtiene los grupos asociados a un personaje
	 * @param characterId ID del personaje
	 * @returns Array de IDs de grupos
	 */
	getCharacterGroups: (characterId: string) => {
		const character = get().characters[characterId];
		if (!character || !character.groups) return [];
		return character.groups.map(group => group.id);
	},

	/**
	 * Obtiene las propiedades asociadas a un personaje
	 * @param characterId ID del personaje
	 * @returns Array de IDs de propiedades
	 */
	getCharacterProperties: (characterId: string) => {
		const character = get().characters[characterId];
		if (!character || !character.properties) return [];
		return character.properties.map(property => property.id);
	},

	/**
	 * Obtiene los comodines asociados a un personaje
	 * @param characterId ID del personaje
	 * @returns Array de IDs de comodines
	 */
	getCharacterWildcards: (characterId: string) => {
		const character = get().characters[characterId];
		if (!character || !character.wildcards) return [];
		return character.wildcards.map(wildcard => wildcard.id);
	},

	/**
	 * Añade un grupo a un personaje
	 * @param characterId ID del personaje
	 * @param groupId ID del grupo a añadir
	 */
	addGroupToCharacter: (characterId: string, groupId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) return state;

			const currentGroups = character.groups || [];
			if (currentGroups.some(g => g.id === groupId)) return state;

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						groups: [...currentGroups, { id: groupId }],
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Elimina un grupo de un personaje
	 * @param characterId ID del personaje
	 * @param groupId ID del grupo a eliminar
	 */
	removeGroupFromCharacter: (characterId: string, groupId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character || !character.groups) return state;

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						groups: character.groups.filter(g => g.id !== groupId),
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Añade una propiedad a un personaje
	 * @param characterId ID del personaje
	 * @param propertyId ID de la propiedad a añadir
	 */
	addPropertyToCharacter: (characterId: string, propertyId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) return state;

			const currentProperties = character.properties || [];
			if (currentProperties.some(p => p.id === propertyId)) return state;

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						properties: [...currentProperties, { id: propertyId }],
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Elimina una propiedad de un personaje
	 * @param characterId ID del personaje
	 * @param propertyId ID de la propiedad a eliminar
	 */
	removePropertyFromCharacter: (characterId: string, propertyId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character || !character.properties) return state;

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						properties: character.properties.filter(p => p.id !== propertyId),
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Añade un comodín a un personaje
	 * @param characterId ID del personaje
	 * @param wildcardId ID del comodín a añadir
	 */
	addWildcardToCharacter: (characterId: string, wildcardId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) return state;

			const currentWildcards = character.wildcards || [];
			if (currentWildcards.some(w => w.id === wildcardId)) return state;

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						wildcards: [...currentWildcards, { id: wildcardId }],
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Elimina un comodín de un personaje
	 * @param characterId ID del personaje
	 * @param wildcardId ID del comodín a eliminar
	 */
	removeWildcardFromCharacter: (characterId: string, wildcardId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character || !character.wildcards) return state;

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...character,
						wildcards: character.wildcards.filter(w => w.id !== wildcardId),
						updatedAt: new Date(),
					},
				},
			};
		});
	},

	/**
	 * Actualiza las relaciones de un personaje de forma masiva
	 * @param characterId ID del personaje
	 * @param data Datos de relaciones a actualizar
	 */
	updateCharacterRelations: (characterId: string, data: {
		groupIds?: string[],
		propertyIds?: string[],
		wildcardIds?: string[]
	}) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) return state;

			const updates = { ...character };

			if (data.groupIds !== undefined) {
				updates.groups = data.groupIds.map(id => ({ id }));
			}

			if (data.propertyIds !== undefined) {
				updates.properties = data.propertyIds.map(id => ({ id }));
			}

			if (data.wildcardIds !== undefined) {
				updates.wildcards = data.wildcardIds.map(id => ({ id }));
			}

			updates.updatedAt = new Date();

			return {
				characters: {
					...state.characters,
					[characterId]: updates,
				},
			};
		});
	},

	/**
	 * Restablece todos los personajes
	 * Elimina todos los personajes del store
	 */
	resetCharacters: () => {
		set({ characters: {} });
	},

	/**
	 * Restablece el estado completo del slice
	 */
	resetState: () => {
		set({
			characters: {},
			isLoading: false,
			error: null,
		});
	},
});
