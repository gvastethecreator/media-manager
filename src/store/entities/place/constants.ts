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
  { value: 'name_asc', label: 'Nombre (A-Z)' },
  { value: 'name_desc', label: 'Nombre (Z-A)' },
  { value: 'created_asc', label: 'Creación (Más antigua)' },
  { value: 'created_desc', label: 'Creación (Más reciente)' },
  { value: 'updated_asc', label: 'Actualización (Más antigua)' },
  { value: 'updated_desc', label: 'Actualización (Más reciente)' },
  { value: 'type_asc', label: 'Tipo (A-Z)' },
  { value: 'type_desc', label: 'Tipo (Z-A)' },
  { value: 'population_asc', label: 'Población (Ascendente)' },
  { value: 'population_desc', label: 'Población (Descendente)' }
];

/**
 * Colores del mapa para los tipos de lugar
 */
export const PLACE_TYPE_COLORS: Record<string, string> = {
  city: '#3B82F6',       // Azul
  town: '#60A5FA',       // Azul claro
  village: '#93C5FD',    // Azul muy claro
  ruin: '#9CA3AF',       // Gris
  castle: '#8B5CF6',     // Morado
  fortress: '#7C3AED',   // Morado oscuro
  dungeon: '#6D28D9',    // Morado muy oscuro
  cave: '#4B5563',       // Gris oscuro
  forest: '#10B981',     // Verde
  mountain: '#6B7280',   // Gris medio
  valley: '#34D399',     // Verde claro
  island: '#FBBF24',     // Amarillo
  lake: '#0EA5E9',       // Azul cielo
  river: '#38BDF8',      // Azul claro
  ocean: '#0284C7',      // Azul oscuro
  desert: '#F59E0B',     // Naranja
  tundra: '#D1D5DB',     // Gris claro
  jungle: '#059669',     // Verde oscuro
  swamp: '#65A30D',      // Verde oliva
  other: '#6B7280'       // Gris por defecto
};

/**
 * Colores para las categorías de lugar
 */
export const PLACE_CATEGORY_COLORS: Record<string, string> = {
  settlement: '#3B82F6',    // Azul
  landscape: '#10B981',     // Verde
  structure: '#8B5CF6',     // Morado
  biome: '#34D399',         // Verde claro
  underground: '#4B5563',   // Gris oscuro
  mythical: '#EC4899',      // Rosa
  historical: '#F59E0B',    // Naranja
  other: '#6B7280'          // Gris
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
  other: '📍'
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
  regions: []
};