/**
 * @file Implementación del slice de filtros para Character
 * @module store/entities/character/slices/filters
 */

import type {
	CharacterAlignment,
	CharacterCategory,
	CharacterClass,
	CharacterExtended,
	CharacterFilter,
	CharacterRace,
	CharacterSortOption,
} from '@/types/entities/character';
import { compareCharacters, getCharacterLevelAsNumber, matchesCharacterSearch } from '@/utils/character';
import type { StateCreator } from 'zustand';
import type { CharacterFiltersSlice, CharacterState } from '../types';

/**
 * Crea el slice de filtros para Character
 * Contiene operaciones relacionadas con el filtrado y ordenamiento
 */
export const createCharacterFiltersSlice: StateCreator<
	CharacterState & CharacterFiltersSlice,
	[],
	[],
	CharacterFiltersSlice
> = (set, get) => ({
	/**
	 * Filtra los personajes por clase
	 * @param characterClass Clase a filtrar o null para limpiar filtro
	 */
	filterByClass: (characterClass: CharacterClass | null) => {
		set((state) => {
			// Si characterClass es null, eliminamos el filtro de clase
			if (characterClass === null) {
				return {
					activeFilters: state.activeFilters.filter((filter) => filter.field !== 'class'),
				};
			}

			// Creamos o actualizamos el filtro de clase
			const classFilter: CharacterFilter = {
				field: 'class',
				operator: 'equals',
				value: characterClass,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.field === 'class');

			const newFilters = [...state.activeFilters];

			if (existingIndex >= 0) {
				newFilters[existingIndex] = classFilter;
			} else {
				newFilters.push(classFilter);
			}

			return { activeFilters: newFilters };
		});
	},

	/**
	 * Filtra los personajes por raza
	 * @param race Raza a filtrar o null para limpiar filtro
	 */
	filterByRace: (race: CharacterRace | null) => {
		set((state) => {
			// Si race es null, eliminamos el filtro de raza
			if (race === null) {
				return {
					activeFilters: state.activeFilters.filter((filter) => filter.field !== 'race'),
				};
			}

			// Creamos o actualizamos el filtro de raza
			const raceFilter: CharacterFilter = {
				field: 'race',
				operator: 'equals',
				value: race,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.field === 'race');

			const newFilters = [...state.activeFilters];

			if (existingIndex >= 0) {
				newFilters[existingIndex] = raceFilter;
			} else {
				newFilters.push(raceFilter);
			}

			return { activeFilters: newFilters };
		});
	},

	/**
	 * Filtra los personajes por nivel
	 * @param minLevel Nivel mínimo o null para sin mínimo
	 * @param maxLevel Nivel máximo o null para sin máximo
	 */
	filterByLevel: (minLevel: number | null, maxLevel: number | null) => {
		set((state) => {
			// Si ambos son null, eliminamos los filtros de nivel
			if (minLevel === null && maxLevel === null) {
				return {
					activeFilters: state.activeFilters.filter((filter) => filter.field !== 'level'),
				};
			}

			// Creamos los filtros necesarios
			const newFilters = state.activeFilters.filter((filter) => filter.field !== 'level');

			if (minLevel !== null) {
				newFilters.push({
					field: 'level',
					operator: 'gte',
					value: minLevel,
				});
			}

			if (maxLevel !== null) {
				newFilters.push({
					field: 'level',
					operator: 'lte',
					value: maxLevel,
				});
			}

			return { activeFilters: newFilters };
		});
	},

	/**
	 * Filtra los personajes por categoría
	 * @param category Categoría a filtrar o null para limpiar filtro
	 */
	filterByCategory: (category: CharacterCategory | null) => {
		set((state) => {
			// Si category es null, eliminamos el filtro
			if (category === null) {
				return {
					activeFilters: state.activeFilters.filter((filter) => filter.field !== 'category'),
				};
			}

			// Creamos o actualizamos el filtro de categoría
			const categoryFilter: CharacterFilter = {
				field: 'category',
				operator: 'equals',
				value: category,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.field === 'category');

			const newFilters = [...state.activeFilters];

			if (existingIndex >= 0) {
				newFilters[existingIndex] = categoryFilter;
			} else {
				newFilters.push(categoryFilter);
			}

			return { activeFilters: newFilters };
		});
	},

	/**
	 * Filtra los personajes por alineamiento
	 * @param alignment Alineamiento a filtrar o null para limpiar filtro
	 */
	filterByAlignment: (alignment: CharacterAlignment | null) => {
		set((state) => {
			// Si alignment es null, eliminamos el filtro
			if (alignment === null) {
				return {
					activeFilters: state.activeFilters.filter((filter) => filter.field !== 'alignment'),
				};
			}

			// Creamos o actualizamos el filtro de alineamiento
			const alignmentFilter: CharacterFilter = {
				field: 'alignment',
				operator: 'equals',
				value: alignment,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.field === 'alignment');

			const newFilters = [...state.activeFilters];

			if (existingIndex >= 0) {
				newFilters[existingIndex] = alignmentFilter;
			} else {
				newFilters.push(alignmentFilter);
			}

			return { activeFilters: newFilters };
		});
	},

	/**
	 * Filtra los personajes por texto de búsqueda
	 * @param searchTerm Término de búsqueda
	 */
	filterByText: (searchTerm: string) => {
		set({ searchTerm });
	},

	/**
	 * Filtra para mostrar solo favoritos
	 * @param onlyFavorites true para mostrar solo favoritos, false para mostrar todos
	 */
	filterByFavorites: (onlyFavorites: boolean) => {
		set((state) => {
			// Si onlyFavorites es false, eliminamos el filtro
			if (!onlyFavorites) {
				return {
					activeFilters: state.activeFilters.filter((filter) => filter.field !== 'isFavorite'),
				};
			}

			// Creamos o actualizamos el filtro de favoritos
			const favoritesFilter: CharacterFilter = {
				field: 'isFavorite',
				operator: 'equals',
				value: true,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.field === 'isFavorite');

			const newFilters = [...state.activeFilters];

			if (existingIndex >= 0) {
				newFilters[existingIndex] = favoritesFilter;
			} else {
				newFilters.push(favoritesFilter);
			}

			return { activeFilters: newFilters };
		});
	},

	/**
	 * Obtiene los personajes ordenados según opción especificada
	 * @param sortOption Opción de ordenamiento (usa currentSortOption si no se especifica)
	 * @returns Array de personajes ordenados
	 */
	getSortedCharacters: (sortOption?: CharacterSortOption) => {
		const state = get();
		const characters = get().getFilteredCharacters();
		const sortBy = sortOption || state.currentSortOption;

		return [...characters].sort((a, b) => compareCharacters(a, b, sortBy));
	},

	/**
	 * Obtiene los personajes agrupados según criterio especificado
	 * @param groupBy Criterio de agrupación (usa state.groupBy si no se especifica)
	 * @returns Objeto con grupos de personajes
	 */
	getGroupedCharacters: (groupBy?: 'none' | 'class' | 'race' | 'category' | 'level') => {
		const state = get();
		const characters = get().getSortedCharacters();
		const groupingCriteria = groupBy || state.groupBy;

		if (groupingCriteria === 'none') {
			return { all: characters };
		}

		const groups: Record<string, CharacterExtended[]> = {};

		characters.forEach((character) => {
			let key = 'unknown';

			switch (groupingCriteria) {
				case 'class':
					key = character.class || 'unknown';
					break;
				case 'race':
					key = character.race || 'unknown';
					break;
				case 'category':
					key = character.category || 'other';
					break;
				case 'level': {
					const level = getCharacterLevelAsNumber(character);
					// Agrupar por rangos de nivel
					if (level <= 5) key = '1-5';
					else if (level <= 10) key = '6-10';
					else if (level <= 15) key = '11-15';
					else if (level <= 20) key = '16-20';
					else key = '21+';
					break;
				}
			}

			if (!groups[key]) {
				groups[key] = [];
			}

			groups[key].push(character);
		});

		return groups;
	},

	/**
	 * Obtiene los personajes filtrados según filtros activos y término de búsqueda
	 * @returns Array de personajes filtrados
	 */
	getFilteredCharacters: () => {
		const state = get();
		const characters = Object.values(state.characters);
		const { activeFilters, searchTerm } = state;

		// Si no hay filtros ni término de búsqueda, devolver todos
		if (activeFilters.length === 0 && !searchTerm) {
			return characters;
		}

		return characters.filter((character) => {
			// Aplicar filtros
			for (const filter of activeFilters) {
				switch (filter.field) {
					case 'class':
						if (character.class !== filter.value) return false;
						break;
					case 'race':
						if (character.race !== filter.value) return false;
						break;
					case 'category':
						if (character.category !== filter.value) return false;
						break;
					case 'alignment':
						if (character.alignment !== filter.value) return false;
						break;
					case 'isFavorite':
						if (character.isFavorite !== filter.value) return false;
						break;
					case 'level_min': {
						const level = getCharacterLevelAsNumber(character);
						if (level < (filter.value as number)) return false;
						break;
					}
					case 'level_max': {
						const level = getCharacterLevelAsNumber(character);
						if (level > (filter.value as number)) return false;
						break;
					}
				}
			}

			// Aplicar búsqueda de texto
			if (searchTerm && !matchesCharacterSearch(character, searchTerm)) {
				return false;
			}

			return true;
		});
	},

	/**
	 * Obtiene personajes por IDs especificados
	 * @param ids Array de IDs de personajes
	 * @returns Array de personajes correspondientes a los IDs proporcionados
	 */
	getCharactersByIds: (ids: string[]) => {
		const state = get();

		return ids.map((id) => state.characters[id]).filter(Boolean);
	},

	/**
	 * Agrega un filtro personalizado
	 * @param filter Filtro a agregar
	 */
	addFilter: (filter: CharacterFilter) => {
		set((state) => {
			// Comprobar si ya existe un filtro con el mismo campo y operador
			const existingIndex = state.activeFilters.findIndex(
				(f) => f.field === filter.field && f.operator === filter.operator
			);

			if (existingIndex >= 0) {
				// Actualizar filtro existente
				const newFilters = [...state.activeFilters];
				newFilters[existingIndex] = filter;
				return { activeFilters: newFilters };
			}
				// Añadir nuevo filtro
				return {
					activeFilters: [...state.activeFilters, filter],
				};
		});
	},

	/**
	 * Elimina un filtro por su ID
	 * @param filterId ID del filtro a eliminar
	 */
	removeFilter: (filterId: string) => {
		set((state) => ({
			activeFilters: state.activeFilters.filter((f) => f.field !== filterId),
		}));
	},

	/**
	 * Limpia todos los filtros activos
	 */
	clearFilters: () => {
		set({
			activeFilters: [],
			searchTerm: '',
		});
	},

	/**
	 * Aplica un conjunto de filtros, reemplazando los existentes
	 * @param filters Filtros a aplicar
	 */
	applyFilters: (filters: CharacterFilter[]) => {
		set({ activeFilters: filters });
	},

	/**
	 * Establece la opción de ordenamiento actual
	 * @param option Opción de ordenamiento
	 */
	setSortOption: (option: CharacterSortOption) => {
		set({ currentSortOption: option });
	},

	/**
	 * Establece la opción de ordenamiento predeterminada
	 * @param option Opción de ordenamiento
	 */
	setDefaultSortOption: (option: CharacterSortOption) => {
		set({
			defaultSortOption: option,
			currentSortOption: option,
		});
	},

	/**
	 * Establece el criterio de agrupamiento
	 * @param groupBy Criterio de agrupamiento
	 */
	setGroupBy: (groupBy: 'none' | 'class' | 'race' | 'category' | 'level') => {
		set({ groupBy });
	},
});
