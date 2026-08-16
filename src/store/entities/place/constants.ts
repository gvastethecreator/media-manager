/**
 * @file Constantes para la entidad Place
 * @module store/entities/place/constants
 */

/**
 * Nombre del store para la entidad Place
 */
export const PLACE_STORE_NAME = 'place-store';

/**
 * Prefijo para los IDs de lugares
 */
export const PLACE_ID_PREFIX = 'place_';

/**
 * Clave para el almacenamiento persistente de lugares
 */
export const PLACE_STORAGE_KEY = 'place-store-storage';

/**
 * Opciones de ordenación para lugares
 */
export const PLACE_SORT_OPTIONS = [
	{ value: 'name_asc', label: 'Name (A-Z)' },
	{ value: 'name_desc', label: 'Name (Z-A)' },
	{ value: 'created_asc', label: 'Created (oldest first)' },
	{ value: 'created_desc', label: 'Created (newest first)' },
	{ value: 'updated_asc', label: 'Updated (oldest first)' },
	{ value: 'updated_desc', label: 'Updated (newest first)' },
	{ value: 'type_asc', label: 'Type (A-Z)' },
	{ value: 'type_desc', label: 'Type (Z-A)' },
	{ value: 'population_asc', label: 'Population (ascending)' },
	{ value: 'population_desc', label: 'Population (descending)' },
];

/**
 * Colores del mapa para los tipos de lugar
 */
export const PLACE_TYPE_COLORS: Record<string, string> = {
	city: 'var(--preset-blue)',
	town: 'var(--preset-sky)',
	village: 'oklch(0.86 0.08 240)',
	ruin: 'var(--dt-neutral-400)',
	castle: 'var(--preset-purple)',
	fortress: 'var(--preset-violet)',
	dungeon: 'oklch(0.4 0.15 280)',
	cave: 'oklch(0.35 0.05 280)',
	forest: 'var(--preset-green)',
	mountain: 'var(--dt-neutral-500)',
	valley: 'oklch(0.76 0.14 145)',
	island: 'var(--preset-yellow)',
	lake: 'var(--preset-sky)',
	river: 'var(--preset-cyan)',
	ocean: 'oklch(0.45 0.12 240)',
	desert: 'var(--preset-orange)',
	tundra: 'var(--dt-neutral-300)',
	jungle: 'oklch(0.28 0.1 145)',
	swamp: 'var(--preset-lime)',
	other: 'var(--dt-neutral-500)',
};

/**
 * Colores para las categorías de lugar
 */
export const PLACE_CATEGORY_COLORS: Record<string, string> = {
	settlement: 'var(--preset-blue)',
	landscape: 'var(--preset-green)',
	structure: 'var(--preset-purple)',
	biome: 'oklch(0.76 0.14 145)',
	underground: 'oklch(0.35 0.05 280)',
	mythical: 'var(--preset-pink)',
	historical: 'var(--preset-orange)',
	other: 'var(--dt-neutral-500)',
};

/**
 * Símbolos de emoji por defecto según el tipo de lugar
 */
export const PLACE_TYPE_EMOJIS: Record<string, string> = {
	city: '🏙️',
	town: '🏘️',
	village: '🏡',
	ruin: '🏚️',
	castle: '🏰',
	fortress: '🏯',
	dungeon: '🧱',
	cave: '🕳️',
	forest: '🌲',
	mountain: '⛰️',
	valley: '🏞️',
	island: '🏝️',
	lake: '🌊',
	river: '🏞️',
	ocean: '🌊',
	desert: '🏜️',
	tundra: '❄️',
	jungle: '🌴',
	swamp: '🥀',
	other: '📍',
};

/**
 * Opciones por defecto de filter para el store de lugares
 */
export const DEFAULT_PLACE_FILTERS = {
	types: [],
	categories: [],
	minPopulation: undefined,
	maxPopulation: undefined,
	onlyFavorites: false,
	hasImages: false,
	hasNotes: false,
	hasConcepts: false,
	hasPrompts: false,
	regions: [],
};
