/**
 * @file Tipos para el store de Character
 * @module store/entities/character/types
 */

import type { CharacterFilterItem, CharacterViewConfig, CharacterWithStats } from '@/types/entities/character';
import type {
	CharacterAlignment,
	CharacterCategory,
	CharacterClass,
	CharacterRace,
	CharacterSortOption,
} from '@/types/entities/character/enums';

/**
 * 🎭 Función de utilidad para convertir array a Record
 * @param characters Array de personajes
 * @returns Record con personajes indexados por ID
 */
export function charactersToRecord(characters: CharacterWithStats[]): Record<string, CharacterWithStats> {
	return characters.reduce(
		(acc, character) => {
			acc[character.id] = character;
			return acc;
		},
		{} as Record<string, CharacterWithStats>
	);
}

/**
 * 🎭 Función de utilidad para obtener personaje por ID
 * @param characters Record de personajes
 * @param id ID del personaje
 * @returns Personaje encontrado o undefined
 */
export function getCharacterById(
	characters: Record<string, CharacterWithStats>,
	id: string
): CharacterWithStats | undefined {
	return characters[id];
}

/**
 * 🎭 Función de utilidad para obtener todos los personajes como array
 * @param characters Record de personajes
 * @returns Array de personajes
 */
export function getAllCharacters(characters: Record<string, CharacterWithStats>): CharacterWithStats[] {
	return Object.values(characters);
}

/**
 * 🎭 Estado principal del store de Character
 */
export interface CharacterState {
	// 🔍 Filtrado y ordenamiento
	activeFilters: CharacterFilterItem[];
	// 📦 Datos principales
	characters: Record<string, CharacterWithStats>; // 🎭 Personajes con estadísticas pre-calculadas
	currentSortOption: CharacterSortOption;
	defaultSortOption: CharacterSortOption;
	error: string | null;
	expandedCharacterIds: string[];

	// 📊 Agrupamiento
	groupBy: string;
	hoveredCharacterId: string | null;

	// ⏳ Estado de carga y errores
	isLoading: boolean;
	searchTerm: string;
	selectedCharacterId: string | null;

	// 🎨 Estado UI
	viewConfig: CharacterViewConfig;
}

/**
 * 🎭 Slice principal con operaciones CRUD
 */
export interface CharacterCoreSlice {
	// ➕ Operaciones de escritura
	addCharacter: (character: CharacterWithStats) => void;
	bulkAddCharacters: (characters: CharacterWithStats[]) => void;
	bulkRemoveCharacters: (ids: string[]) => void;
	bulkUpdateCharacters: (updates: Array<{ id: string; updates: Partial<CharacterWithStats> }>) => void;
	clearCharacters: () => void;
	getAllCharacters: () => CharacterWithStats[];

	// 📖 Operaciones de lectura
	getCharacterById: (id: string) => CharacterWithStats | undefined;
	getCharactersByIds: (ids: string[]) => CharacterWithStats[];
	refreshAllCharacters: () => Promise<void>;
	refreshCharacter: (id: string) => Promise<void>;
	removeCharacter: (id: string) => void;

	// 🔄 Operaciones de sincronización
	syncCharacters: (characters: CharacterWithStats[]) => void;
	updateCharacter: (id: string, updates: Partial<CharacterWithStats>) => void;
}

/**
 * 🎨 Slice de interfaz de usuario
 */
export interface CharacterUISlice {
	clearSelection: () => void;
	collapseAllCharacters: () => void;
	collapseCharacter: (id: string) => void;
	expandAllCharacters: () => void;
	expandCharacter: (id: string) => void;
	resetViewConfig: () => void;
	// 🎯 Selección
	selectCharacter: (id: string | null) => void;

	// 🖱️ Hover
	setHoveredCharacter: (id: string | null) => void;

	// 📂 Expansión
	toggleCharacterExpansion: (id: string) => void;
	toggleCharacterSelection: (id: string) => void;

	// ⚙️ Configuración de vista
	updateViewConfig: (config: Partial<CharacterViewConfig>) => void;
}

/**
 * 🔍 Slice de filtrado y ordenamiento
 */
export interface CharacterFiltersSlice {
	// 🏷️ Filtros
	addFilter: (filter: CharacterFilterItem) => void;
	applyFilters: (filters: CharacterFilterItem[]) => void;
	clearFilters: () => void;
	clearSearch: () => void;
	filterByAlignment: (alignment: CharacterAlignment | null) => void;
	filterByCategory: (category: CharacterCategory | null) => void;
	filterByClass: (characterClass: CharacterClass | null) => void;
	filterByFavorites: (onlyFavorites: boolean) => void;
	filterByLevel: (minLevel: number | null, maxLevel: number | null) => void;
	filterByRace: (race: CharacterRace | null) => void;

	// 📖 Getters computados
	getFilteredCharacters: () => CharacterWithStats[];
	getGroupedCharacters: () => Record<string, CharacterWithStats[]>;
	getSortedCharacters: () => CharacterWithStats[];
	removeFilter: (filterId: string) => void;
	resetSorting: () => void;
	setDefaultSortOption: (option: CharacterSortOption) => void;

	// 📊 Agrupamiento
	setGroupBy: (groupBy: 'none' | 'class' | 'race' | 'category' | 'level') => void;
	// 🔍 Búsqueda
	setSearchTerm: (term: string) => void;

	// 📊 Ordenamiento
	setSortOption: (option: CharacterSortOption) => void;
	toggleFilter: (filter: CharacterFilterItem) => void;
	toggleSortDirection: () => void;
}

/**
 * 🎭 Store completo de Character
 */
export interface CharacterStore extends CharacterState, CharacterCoreSlice, CharacterUISlice, CharacterFiltersSlice {}
