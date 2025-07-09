/**
 * @file Implementación del slice de filtros para Character optimizado
 * @module store/entities/character/slices/filters
 */

import type { StateCreator } from 'zustand';
import { matchesCharacterSearch, sortCharacters } from '@/lib/utils/character';
import type { CharacterFilterItem, CharacterWithStats } from '@/types/entities/character';
import {
	CharacterAlignment,
	CharacterCategory,
	CharacterClass,
	CharacterRace,
	CharacterSortOption,
} from '@/types/entities/character';
import type { CharacterFiltersSlice, CharacterState } from '../types';

/**
 * Crea el slice de filtros optimizado para Character
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
					activeFilters: state.activeFilters.filter((filter) => filter.query !== 'class'),
				};
			}

			// Creamos o actualizamos el filtro de clase
			const classFilter: CharacterFilterItem = {
				query: 'class',
				value: characterClass,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.query === 'class');

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
					activeFilters: state.activeFilters.filter((filter) => filter.query !== 'race'),
				};
			}

			// Creamos o actualizamos el filtro de raza
			const raceFilter: CharacterFilterItem = {
				query: 'race',
				value: race,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.query === 'race');

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
					activeFilters: state.activeFilters.filter((filter) => filter.query !== 'level'),
				};
			}

			// Creamos los filtros necesarios
			const newFilters = state.activeFilters.filter((filter) => filter.query !== 'level');

			if (minLevel !== null && maxLevel !== null) {
				newFilters.push({
					query: 'level',
					value: `${minLevel}-${maxLevel}`,
				});
			} else if (minLevel !== null) {
				newFilters.push({
					query: 'level',
					value: `${minLevel}+`,
				});
			} else if (maxLevel !== null) {
				newFilters.push({
					query: 'level',
					value: `<${maxLevel}`,
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
					activeFilters: state.activeFilters.filter((filter) => filter.query !== 'category'),
				};
			}

			// Creamos o actualizamos el filtro de categoría
			const categoryFilter: CharacterFilterItem = {
				query: 'category',
				value: category,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.query === 'category');

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
					activeFilters: state.activeFilters.filter((filter) => filter.query !== 'alignment'),
				};
			}

			// Creamos o actualizamos el filtro de alineamiento
			const alignmentFilter: CharacterFilterItem = {
				query: 'alignment',
				value: alignment,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.query === 'alignment');

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
	setSearchTerm: (searchTerm: string) => {
		set({ searchTerm });
	},

	/**
	 * Limpia el término de búsqueda
	 */
	clearSearch: () => {
		set({ searchTerm: '' });
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
					activeFilters: state.activeFilters.filter((filter) => filter.query !== 'isFavorite'),
				};
			}

			// Creamos o actualizamos el filtro de favoritos
			const favoritesFilter: CharacterFilterItem = {
				query: 'isFavorite',
				value: true,
			};

			// Reemplazamos el filtro existente o añadimos uno nuevo
			const existingIndex = state.activeFilters.findIndex((filter) => filter.query === 'isFavorite');

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
		const { characters, currentSortOption } = get();
		const charactersArray = Object.values(characters);
		const option = sortOption || currentSortOption;
		return sortCharacters(charactersArray, option);
	},

	/**
	 * Obtiene los personajes agrupados según criterio especificado
	 * @param groupBy Criterio de agrupación (usa state.groupBy si no se especifica)
	 * @returns Objeto con grupos de personajes
	 */
	getGroupedCharacters: (groupBy?: 'none' | 'class' | 'race' | 'category' | 'level') => {
		const { characters, groupBy: currentGroupBy } = get();
		const charactersArray = Object.values(characters);
		const groupByOption = groupBy || currentGroupBy;

		if (groupByOption === 'none') {
			return { all: charactersArray };
		}

		const groups: Record<string, CharacterWithStats[]> = {};

		for (const character of charactersArray) {
			let groupKey: string;

			switch (groupByOption) {
				case 'class':
					groupKey = character.class || 'unknown';
					break;
				case 'race':
					groupKey = character.race || 'unknown';
					break;
				case 'category':
					groupKey = character.category || 'uncategorized';
					break;
				case 'level':
					groupKey = `Level ${Math.floor(character.level / 5) * 5}-${Math.floor(character.level / 5) * 5 + 4}`;
					break;
				default:
					groupKey = 'all';
			}

			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(character);
		}

		return groups;
	},

	/**
	 * Obtiene los personajes filtrados según filtros activos y término de búsqueda
	 * @returns Array de personajes filtrados
	 */
	getFilteredCharacters: () => {
		const { characters, activeFilters, searchTerm } = get();
		let charactersArray = Object.values(characters);

		// Aplicar filtros activos
		for (const filter of activeFilters) {
			charactersArray = charactersArray.filter((character) => {
				switch (filter.query) {
					case 'class':
						return character.class === filter.value;
					case 'race':
						return character.race === filter.value;
					case 'category':
						return character.category === filter.value;
					case 'alignment':
						return character.alignment === filter.value;
					case 'isFavorite':
						return character.isFavorite === filter.value;
					case 'level': {
						const levelValue = filter.value as string;
						if (levelValue.includes('-')) {
							const [min, max] = levelValue.split('-').map(Number);
							return character.level >= min && character.level <= max;
						}
						if (levelValue.endsWith('+')) {
							const min = Number(levelValue.slice(0, -1));
							return character.level >= min;
						}
						if (levelValue.startsWith('<')) {
							const max = Number(levelValue.slice(1));
							return character.level < max;
						}
						return true;
					}
					default:
						return true;
				}
			});
		}

		// Aplicar búsqueda por texto
		if (searchTerm.trim()) {
			charactersArray = charactersArray.filter((character) => matchesCharacterSearch(character, searchTerm));
		}

		return charactersArray;
	},

	

	/**
	 * Agrega un filtro personalizado
	 * @param filter Filtro a agregar
	 */
	addFilter: (filter: CharacterFilterItem) => {
		set((state) => ({
			activeFilters: [...state.activeFilters, filter],
		}));
	},

	/**
	 * Elimina un filtro por su ID
	 * @param filterId ID del filtro a eliminar
	 */
	removeFilter: (filterId: string) => {
		set((state) => ({
			activeFilters: state.activeFilters.filter((_, index) => index.toString() !== filterId),
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
	 * Alterna un filtro (añade si no existe, elimina si existe)
	 * @param filter Filtro a alternar
	 */
	toggleFilter: (filter: CharacterFilterItem) => {
		set((state) => {
			const existingFilter = state.activeFilters.find(
				(f) => f.query === filter.query && f.value === filter.value
			);
			if (existingFilter) {
				return {
					activeFilters: state.activeFilters.filter(
						(f) => !(f.query === filter.query && f.value === filter.value)
					),
				};
			} else {
				return {
					activeFilters: [...state.activeFilters, filter],
				};
			}
		});
	},

	/**
	 * Alterna la dirección de ordenamiento (ASC/DESC)
	 */
	toggleSortDirection: () => {
		set((state) => {
			const currentOption = state.currentSortOption;
			let newOption: CharacterSortOption;

			if (currentOption.endsWith('_ASC')) {
				newOption = currentOption.replace('_ASC', '_DESC') as CharacterSortOption;
			} else if (currentOption.endsWith('_DESC')) {
				newOption = currentOption.replace('_DESC', '_ASC') as CharacterSortOption;
			} else {
				// Default to ascending if no clear direction
				newOption = `${currentOption}_ASC` as CharacterSortOption;
			}
			return { currentSortOption: newOption };
		});
	},

	/**
	 * Restablece el ordenamiento a la opción predeterminada
	 */
	resetSorting: () => {
		set((state) => ({
			currentSortOption: state.defaultSortOption,
		}));
	},

	/**
	 * Aplica un conjunto de filtros, reemplazando los existentes
	 * @param filters Filtros a aplicar
	 */
	applyFilters: (filters: CharacterFilterItem[]) => {
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
