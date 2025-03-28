/**
 * @file Constantes para la entidad WorldItem
 * @module store/entities/world-item/constants
 */

import { WorldItemViewMode } from '../../../types/entities/world-item';

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
	{ value: 'name_asc', label: 'Nombre (A-Z)' },
	{ value: 'name_desc', label: 'Nombre (Z-A)' },
	{ value: 'created_asc', label: 'Fecha creación (más antigua)' },
	{ value: 'created_desc', label: 'Fecha creación (más reciente)' },
	{ value: 'updated_asc', label: 'Última actualización (más antigua)' },
	{ value: 'updated_desc', label: 'Última actualización (más reciente)' },
	{ value: 'type_asc', label: 'Tipo (A-Z)' },
	{ value: 'type_desc', label: 'Tipo (Z-A)' },
	{ value: 'rarity_asc', label: 'Rareza (común a legendario)' },
	{ value: 'rarity_desc', label: 'Rareza (legendario a común)' },
];

/**
 * Mensaje para estado vacío
 */
export const EMPTY_WORLD_ITEMS_MESSAGE = 'No hay objetos del mundo disponibles';

/**
 * Mensaje para error de carga
 */
export const LOAD_WORLD_ITEMS_ERROR = 'Error al cargar objetos del mundo';

/**
 * Colores para categorías de objetos
 */
export const WORLD_ITEM_CATEGORY_COLORS = {
	combat: '#ef4444',
	magic: '#8b5cf6',
	technology: '#06b6d4',
	utility: '#10b981',
	decoration: '#f59e0b',
	survival: '#84cc16',
	transportation: '#0ea5e9',
	quest: '#ec4899',
	lore: '#d946ef',
	other: '#6b7280',
};

/**
 * Colores para rareza de objetos
 */
export const WORLD_ITEM_RARITY_COLORS = {
	common: '#6b7280',
	uncommon: '#22c55e',
	rare: '#3b82f6',
	epic: '#a855f7',
	legendary: '#f59e0b',
	mythic: '#ef4444',
	unique: '#ec4899',
	artifact: '#fcd34d',
};
