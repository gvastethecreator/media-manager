/**
 * @file Tipos para el store de la entidad Character
 * @module store/entities/character/types
 */

import type {
    CharacterAlignment,
    CharacterBase,
    CharacterCategory,
    CharacterClass,
    CharacterExtended,
    CharacterFilter,
    CharacterRace,
    CharacterSortOption,
    CharacterViewConfig,
} from '@/types/entities/character';

/**
 * Estado base para el store de Character
 */
export interface CharacterState {
	// Datos principales
	characters: Record<string, CharacterExtended>;

	// Estado UI
	viewConfig: CharacterViewConfig;
	selectedCharacterId: string | null;
	hoveredCharacterId: string | null;
	expandedCharacterIds: string[];

	// Estado de carga y errores
	isLoading: boolean;
	error: string | null;

	// Filtrado y ordenamiento
	activeFilters: CharacterFilter[];
	searchTerm: string;
	defaultSortOption: CharacterSortOption;
	currentSortOption: CharacterSortOption;

	// Agrupamiento
	groupBy: 'none' | 'class' | 'race' | 'category' | 'level';
}

/**
 * Tipo para las acciones principales del store
 * (operaciones CRUD y gestión de datos)
 */
export interface CharacterCoreSlice {
	// Operaciones principales CRUD
	addCharacter: (character: CharacterBase | CharacterExtended) => void;
	updateCharacter: (characterId: string, updates: Partial<CharacterBase>) => void;
	removeCharacter: (characterId: string) => void;

	// Operaciones por lotes
	bulkAddCharacters: (characters: (CharacterBase | CharacterExtended)[]) => void;
	bulkUpdateCharacters: (updates: Array<{ id: string; data: Partial<CharacterBase> }>) => void;
	bulkRemoveCharacters: (characterIds: string[]) => void;

	// Operaciones especializadas
	toggleFavorite: (characterId: string) => void;
	setFeaturedImage: (characterId: string, imageId: string | null) => void;
	incrementLevel: (characterId: string) => void;
	decrementLevel: (characterId: string) => void;

	// Gestión del estado de carga
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;

	// Operaciones avanzadas
	addRelationship: (characterId: string, targetId: string, targetName: string, type: string, strength: number) => void;
	removeRelationship: (characterId: string, targetId: string) => void;

	// Gestión de relaciones
	getCharacterGroups: (characterId: string) => string[];
	getCharacterProperties: (characterId: string) => string[];
	getCharacterWildcards: (characterId: string) => string[];

	addGroupToCharacter: (characterId: string, groupId: string) => void;
	removeGroupFromCharacter: (characterId: string, groupId: string) => void;

	addPropertyToCharacter: (characterId: string, propertyId: string) => void;
	removePropertyFromCharacter: (characterId: string, propertyId: string) => void;

	addWildcardToCharacter: (characterId: string, wildcardId: string) => void;
	removeWildcardFromCharacter: (characterId: string, wildcardId: string) => void;

	updateCharacterRelations: (characterId: string, data: {
		groupIds?: string[],
		propertyIds?: string[],
		wildcardIds?: string[]
	}) => void;

	// Operaciones de restablecimiento
	resetCharacters: () => void;
	resetState: () => void;
}

/**
 * Tipo para el slice que maneja la UI y el estado visual
 */
export interface CharacterUISlice {
	// Configuración de vista
	getViewConfig: () => CharacterViewConfig;
	setViewConfig: (config: Partial<CharacterViewConfig>) => void;
	setGridColumns: (columns: number) => void;
	setCardSize: (size: 'small' | 'medium' | 'large') => void;

	// Selección, hover y expandido
	selectCharacter: (characterId: string | null) => void;
	hoverCharacter: (characterId: string | null) => void;
	toggleExpandCharacter: (characterId: string) => void;
	expandCharacter: (characterId: string) => void;
	collapseCharacter: (characterId: string) => void;

	// Estados múltiples
	expandAllCharacters: () => void;
	collapseAllCharacters: () => void;

	// Estado de carga por personaje
	setCharacterLoading: (characterId: string, isLoading: boolean) => void;
	setCharacterError: (characterId: string, hasError: boolean) => void;

	// Restablecimiento de UI
	resetUIState: () => void;
}

/**
 * Tipo para el slice que maneja filtros y ordenamiento
 */
export interface CharacterFiltersSlice {
	// Filtros por criterios específicos
	filterByClass: (characterClass: CharacterClass | null) => void;
	filterByRace: (race: CharacterRace | null) => void;
	filterByLevel: (minLevel: number | null, maxLevel: number | null) => void;
	filterByCategory: (category: CharacterCategory | null) => void;
	filterByAlignment: (alignment: CharacterAlignment | null) => void;
	filterByText: (searchTerm: string) => void;
	filterByFavorites: (onlyFavorites: boolean) => void;

	// Obtener caracteres filtrados/ordenados
	getSortedCharacters: (sortOption?: CharacterSortOption) => CharacterExtended[];
	getGroupedCharacters: (
		groupBy?: 'none' | 'class' | 'race' | 'category' | 'level'
	) => Record<string, CharacterExtended[]>;
	getFilteredCharacters: () => CharacterExtended[];
	getCharactersByIds: (ids: string[]) => CharacterExtended[];

	// Operaciones avanzadas de filtrado
	addFilter: (filter: CharacterFilter) => void;
	removeFilter: (filterId: string) => void;
	clearFilters: () => void;
	applyFilters: (filters: CharacterFilter[]) => void;

	// Configuración de ordenamiento
	setSortOption: (option: CharacterSortOption) => void;
	setDefaultSortOption: (option: CharacterSortOption) => void;

	// Configuración de agrupamiento
	setGroupBy: (groupBy: 'none' | 'class' | 'race' | 'category' | 'level') => void;
}

// Tipo completo del store Character
export type CharacterStore = CharacterState & CharacterCoreSlice & CharacterUISlice & CharacterFiltersSlice;
