/**
 * @file Constantes para la entidad WorldItem
 * @module store/entities/world-item/constants
 */

import { WorldItemViewMode } from '@/types/entities/world-item';

/**
 * Clave para el almacenamiento persistente
 */
export const WORLD_ITEM_STORAGE_KEY = 'world-items-storage';

/**
 * Nombre del store para devtools
 */
export const WORLD_ITEM_STORE_NAME = 'WorldItemStore';

/**
 * Prefijo para la generación de IDs
 */
export const WORLD_ITEM_ID_PREFIX = 'wi_';

/**
 * Configuración por defecto para la visualización
 */
export const DEFAULT_WORLD_ITEM_VIEW_CONFIG = {
	viewMode: WorldItemViewMode.GRID,
	sortBy: 'name_asc',
	filters: {},
	expandedIds: [],
	selectedIds: [],
	currentItemId: null,
};

/**
 * Opciones de ordenamiento
 */
export const WORLD_ITEM_SORT_OPTIONS = [
	{ value: 'name_asc', label: 'Name (A-Z)' },
	{ value: 'name_desc', label: 'Name (Z-A)' },
	{ value: 'created_asc', label: 'Created (oldest first)' },
	{ value: 'created_desc', label: 'Created (newest first)' },
	{ value: 'updated_asc', label: 'Updated (oldest first)' },
	{ value: 'updated_desc', label: 'Updated (newest first)' },
	{ value: 'type_asc', label: 'Type (A-Z)' },
	{ value: 'type_desc', label: 'Type (Z-A)' },
	{ value: 'rarity_asc', label: 'Rarity (common to legendary)' },
	{ value: 'rarity_desc', label: 'Rarity (legendary to common)' },
];

/**
 * Mensaje para estado vacío
 */
export const EMPTY_WORLD_ITEMS_MESSAGE = 'No world items available';

/**
 * Mensaje para error de carga
 */
export const LOAD_WORLD_ITEMS_ERROR = 'Could not load world items';

/**
 * Colores para categorías de objetos
 */
export const WORLD_ITEM_CATEGORY_COLORS = {
	combat: 'var(--preset-red)',
	magic: 'var(--preset-purple)',
	technology: 'var(--preset-cyan)',
	utility: 'var(--preset-green)',
	decoration: 'var(--preset-yellow)',
	survival: 'var(--preset-lime)',
	transportation: 'var(--preset-sky)',
	quest: 'var(--preset-pink)',
	lore: 'var(--preset-fuchsia)',
	other: 'var(--dt-neutral-500)',
};

/**
 * Colores para rareza de objetos
 */
export const WORLD_ITEM_RARITY_COLORS = {
	common: 'var(--dt-neutral-500)',
	uncommon: 'var(--preset-green)',
	rare: 'var(--preset-blue)',
	epic: 'var(--preset-violet)',
	legendary: 'var(--preset-yellow)',
	mythic: 'var(--preset-red)',
	unique: 'var(--preset-pink)',
	artifact: 'var(--preset-orange)',
};
