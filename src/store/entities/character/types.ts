/**
 * @file Tipos para el store de Character
 * @module store/entities/character/types
 */

import type { CharacterFilterItem, CharacterViewConfig, CharacterWithStats } from '@/types/entities/character';
import type { CharacterSortOption } from '@/types/entities/character/enums';

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
	// 📦 Datos principales
	characters: Record<string, CharacterWithStats>; // 🎭 Personajes con estadísticas pre-calculadas

	// 🎨 Estado UI
	viewConfig: CharacterViewConfig;
	selectedCharacterId: string | null;
	hoveredCharacterId: string | null;
	expandedCharacterIds: string[];

	// ⏳ Estado de carga y errores
	isLoading: boolean;
	error: string | null;

	// 🔍 Filtrado y ordenamiento
	activeFilters: CharacterFilterItem[];
	searchTerm: string;
	defaultSortOption: CharacterSortOption;
	currentSortOption: CharacterSortOption;

	// 📊 Agrupamiento
	groupBy: string;
}

/**
 * 🎭 Slice principal con operaciones CRUD
 */
export interface CharacterCoreSlice {
	// ➕ Operaciones de escritura
	addCharacter: (character: CharacterWithStats) => void;
	bulkAddCharacters: (characters: CharacterWithStats[]) => void;
	updateCharacter: (id: string, updates: Partial<CharacterWithStats>) => void;
	bulkUpdateCharacters: (updates: Array<{ id: string; updates: Partial<CharacterWithStats> }>) => void;
	removeCharacter: (id: string) => void;
	bulkRemoveCharacters: (ids: string[]) => void;
	clearCharacters: () => void;

	// 📖 Operaciones de lectura
	getCharacterById: (id: string) => CharacterWithStats | undefined;
	getAllCharacters: () => CharacterWithStats[];
	getCharactersByIds: (ids: string[]) => CharacterWithStats[];

	// 🔄 Operaciones de sincronización
	syncCharacters: (characters: CharacterWithStats[]) => void;
	refreshCharacter: (id: string) => Promise<void>;
	refreshAllCharacters: () => Promise<void>;
}

/**
 * 🎨 Slice de interfaz de usuario
 */
export interface CharacterUISlice {
	// 🎯 Selección
	selectCharacter: (id: string | null) => void;
	toggleCharacterSelection: (id: string) => void;
	clearSelection: () => void;

	// 🖱️ Hover
	setHoveredCharacter: (id: string | null) => void;

	// 📂 Expansión
	toggleCharacterExpansion: (id: string) => void;
	expandCharacter: (id: string) => void;
	collapseCharacter: (id: string) => void;
	expandAllCharacters: () => void;
	collapseAllCharacters: () => void;

	// ⚙️ Configuración de vista
	updateViewConfig: (config: Partial<CharacterViewConfig>) => void;
	resetViewConfig: () => void;
}

/**
 * 🔍 Slice de filtrado y ordenamiento
 */
export interface CharacterFiltersSlice {
	// 🔍 Búsqueda
	setSearchTerm: (term: string) => void;
	clearSearch: () => void;

	// 🏷️ Filtros
	addFilter: (filter: CharacterFilterItem) => void;
	removeFilter: (filterId: string) => void;
	clearFilters: () => void;
	toggleFilter: (filter: CharacterFilterItem) => void;

	// 📊 Ordenamiento
	setSortOption: (option: CharacterSortOption) => void;
	toggleSortDirection: () => void;
	resetSorting: () => void;

	// 📊 Agrupamiento
	setGroupBy: (groupBy: string) => void;

	// 📖 Getters computados
	getFilteredCharacters: () => CharacterWithStats[];
	getSortedCharacters: () => CharacterWithStats[];
	getGroupedCharacters: () => Record<string, CharacterWithStats[]>;
}

/**
 * 🎭 Store completo de Character
 */
export interface CharacterStore extends CharacterState, CharacterCoreSlice, CharacterUISlice, CharacterFiltersSlice {}
