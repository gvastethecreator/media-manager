/**
 * Enumerado para los modos de vista de carpetas
 */
export enum FolderViewMode {
	LIST = 'list',
	GRID = 'grid',
	DETAILS = 'details',
	CARDS = 'cards',
	COMPACT = 'compact',
}

/**
 * Enumerado para el orden de las carpetas
 */
export enum FolderSortBy {
	NAME = 'name',
	CREATED_AT = 'createdAt',
	UPDATED_AT = 'updatedAt',
	TOTAL_FILES = 'totalFiles',
	TOTAL_SIZE = 'totalSize',
	LAST_INDEXED = 'lastIndexed',
}

/**
 * Enumerado para la dirección de ordenamiento
 */
export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc',
}

/**
 * Enumerado para el estado de indexación de carpetas
 */
export enum FolderIndexStatus {
	NEVER = 'never',
	PENDING = 'pending',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	FAILED = 'failed',
}

/**
 * Constantes para los colores predeterminados de carpetas
 */
export const FOLDER_DEFAULT_COLORS = {
	DEFAULT: '#3b82f6',
	FAVORITE: '#f59e0b',
	SYSTEM: '#10b981',
	ERROR: '#ef4444',
	WARNING: '#f97316',
	INFO: '#6366f1',
};

/**
 * Constantes para los emoji predeterminados de carpetas
 */
export const FOLDER_DEFAULT_EMOJIS = {
	DEFAULT: '📁',
	FAVORITE: '⭐',
	SYSTEM: '⚙️',
	PHOTOS: '📸',
	VIDEOS: '🎬',
	DOWNLOADS: '📥',
};

/**
 * Tipos de efectos visuales disponibles para carpetas
 */
export enum FolderVisualEffectType {
	GLOW = 'glow',
	SHADOW = '3d_shadow',
	HOLOGRAPHIC = 'holographic',
	GRAIN = 'grain',
	SCANLINES = 'scanlines',
	ANIMATED_BORDER = 'animated_border',
}
