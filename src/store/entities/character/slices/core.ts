/**
 * @file Implementación del slice principal para Character optimizado
 * @module store/entities/character/slices/core
 * @description Slice principal con estructura Record optimizada para acceso O(1).
 */

import type { StateCreator } from 'zustand';
import { serverLogger } from '@/lib/logger/server-logger';
import type { CharacterWithStats } from '@/types/entities/character';
import type { CharacterCoreSlice, CharacterState } from '../types';

const logger = serverLogger.withContext('CharacterCoreSlice');

/**
 * 🔄 Convierte array de personajes a Record para acceso O(1).
 */
export function charactersToRecord(characters: CharacterWithStats[]): Record<string, CharacterWithStats> {
	const record: Record<string, CharacterWithStats> = {};
	for (const character of characters) {
		record[character.id] = character;
	}
	return record;
}

/**
 * Crea el slice principal optimizado para Character.
 */
export const createCharacterCoreSlice: StateCreator<
	CharacterState & CharacterCoreSlice,
	[],
	[],
	CharacterState & CharacterCoreSlice
> = (set, get) => ({
	// Conversión y utilidades optimizadas
	charactersToRecord,

	getCharacterById: (id: string) => {
		const { characters } = get();
		return characters[id]; // Acceso O(1)
	},

	getAllCharacters: () => {
		const { characters } = get();
		return Object.values(characters);
	},

	getCharactersByIds: (ids: string[]) => {
		const { characters } = get();
		return ids.map((id) => characters[id]).filter(Boolean);
	},

	// Operaciones principales CRUD optimizadas
	addCharacter: (character: CharacterWithStats) => {
		set((state) => ({
			characters: {
				...state.characters,
				[character.id]: character,
			},
		}));
		logger.info(`➕ Personaje añadido al store: ${character.name}`);
	},

	updateCharacter: (characterId: string, updates: Partial<CharacterWithStats>) => {
		set((state) => {
			const existingCharacter = state.characters[characterId];
			if (!existingCharacter) {
				logger.warn(`❌ Personaje no encontrado para actualizar: ${characterId}`);
				return state;
			}

			return {
				characters: {
					...state.characters,
					[characterId]: {
						...existingCharacter,
						...updates,
						// Actualizar timestamp
						updatedAt: new Date(),
					},
				},
			};
		});
		logger.info(`🔄 Personaje actualizado en store: ${characterId}`);
	},

	removeCharacter: (characterId: string) => {
		set((state) => {
			const { [characterId]: removed, ...remainingCharacters } = state.characters;
			if (!removed) {
				logger.warn(`❌ Personaje no encontrado para eliminar: ${characterId}`);
				return state;
			}

			return {
				characters: remainingCharacters,
				// Limpiar selección si el personaje eliminado estaba seleccionado
				selectedCharacterId: state.selectedCharacterId === characterId ? null : state.selectedCharacterId,
				hoveredCharacterId: state.hoveredCharacterId === characterId ? null : state.hoveredCharacterId,
				expandedCharacterIds: state.expandedCharacterIds.filter((id) => id !== characterId),
			};
		});
		logger.info(`🗑️ Personaje eliminado del store: ${characterId}`);
	},

	// Operaciones por lotes optimizadas
	bulkAddCharacters: (characters: CharacterWithStats[]) => {
		const newCharactersRecord = charactersToRecord(characters);
		set((state) => ({
			characters: {
				...state.characters,
				...newCharactersRecord,
			},
		}));
		logger.info(`➕ ${characters.length} personajes añadidos al store en lote`);
	},

	bulkUpdateCharacters: (updates: Array<{ id: string; data: Partial<CharacterWithStats> }>) => {
		set((state) => {
			const updatedCharacters = { ...state.characters };
			const now = new Date();

			for (const { id, data } of updates) {
				const existingCharacter = updatedCharacters[id];
				if (existingCharacter) {
					updatedCharacters[id] = {
						...existingCharacter,
						...data,
						updatedAt: now,
					};
				}
			}

			return { characters: updatedCharacters };
		});
		logger.info(`🔄 ${updates.length} personajes actualizados en lote`);
	},

	bulkRemoveCharacters: (characterIds: string[]) => {
		set((state) => {
			const updatedCharacters = { ...state.characters };
			let removedCount = 0;

			for (const id of characterIds) {
				if (updatedCharacters[id]) {
					delete updatedCharacters[id];
					removedCount++;
				}
			}

			return {
				characters: updatedCharacters,
				// Limpiar selecciones
				selectedCharacterId: characterIds.includes(state.selectedCharacterId || '') ? null : state.selectedCharacterId,
				hoveredCharacterId: characterIds.includes(state.hoveredCharacterId || '') ? null : state.hoveredCharacterId,
				expandedCharacterIds: state.expandedCharacterIds.filter((id) => !characterIds.includes(id)),
			};
		});
		logger.info(`🗑️ ${characterIds.length} personajes eliminados del store en lote`);
	},

	// Operaciones especializadas
	toggleFavorite: (characterId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) {
				logger.warn(`❌ Personaje no encontrado para toggle favorite: ${characterId}`);
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
		logger.info(`⭐ Toggle favorite personaje: ${characterId}`);
	},

	setFeaturedImage: (characterId: string, imageId: string | null) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) {
				logger.warn(`❌ Personaje no encontrado para featured image: ${characterId}`);
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
		logger.info(`🖼️ Featured image actualizada para personaje: ${characterId}`);
	},

	incrementLevel: (characterId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) {
				logger.warn(`❌ Personaje no encontrado para incrementar nivel: ${characterId}`);
				return state;
			}

			const newLevel = Math.min(character.level + 1, 100); // Máximo nivel 100
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
		logger.info(`⬆️ Nivel incrementado para personaje: ${characterId}`);
	},

	decrementLevel: (characterId: string) => {
		set((state) => {
			const character = state.characters[characterId];
			if (!character) {
				logger.warn(`❌ Personaje no encontrado para decrementar nivel: ${characterId}`);
				return state;
			}

			const newLevel = Math.max(character.level - 1, 1); // Mínimo nivel 1
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
		logger.info(`⬇️ Nivel decrementado para personaje: ${characterId}`);
	},

	// Gestión del estado de carga
	setLoading: (isLoading: boolean) => {
		set({ isLoading });
		logger.info(`🔄 Estado de carga: ${isLoading}`);
	},

	setError: (error: string | null) => {
		set({ error });
		if (error) {
			logger.error(`❌ Error en store: ${error}`);
		}
	},

	clearError: () => {
		set({ error: null });
		logger.info('✅ Error limpiado del store');
	},

	// Operaciones de restablecimiento
	resetCharacters: () => {
		set({ characters: {} });
		logger.info('🔄 Personajes reseteados en store');
	},

	resetState: () => {
		set((state) => ({
			characters: {},
			selectedCharacterId: null,
			hoveredCharacterId: null,
			expandedCharacterIds: [],
			isLoading: false,
			error: null,
			activeFilters: [],
			searchTerm: '',
			groupBy: 'none',
			// Mantener configuración de vista
			viewConfig: state.viewConfig,
			defaultSortOption: state.defaultSortOption,
			currentSortOption: state.currentSortOption,
		}));
		logger.info('🔄 Estado completo reseteado en store');
	},
});
