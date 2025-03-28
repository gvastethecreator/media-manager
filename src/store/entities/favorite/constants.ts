// 🏷️ Nombre del store para persistencia
export const FAVORITE_STORE_NAME = 'favorite-store';

// 📊 Configuración de vista por defecto
export const DEFAULT_VIEW_CONFIG = {
	sortBy: 'createdAt',
	sortOrder: 'desc',
	groupBy: null,
	filterBy: null,
} as const;

// 🔄 Estados de carga
export const LOADING_STATES = {
	IDLE: 'idle',
	LOADING: 'loading',
	ERROR: 'error',
	SUCCESS: 'success',
} as const;
