// 🔢 Versionado
export const VERSIONING = {
	STORE: '1.0.0',
	API: '1.0.0',
	SCHEMA: '1.0.0',
	CACHE: '1.0.0',
} as const;

// 🔄 Estados de carga
export const LOADING_STATES = {
	IDLE: 'idle',
	LOADING: 'loading',
	ERROR: 'error',
	SUCCESS: 'success',
} as const;

// 🎯 Estados de entidad
export const ENTITY_STATES = {
	ACTIVE: 'active',
	ARCHIVED: 'archived',
	DELETED: 'deleted',
	DRAFT: 'draft',
} as const;

// 📊 Configuración de vista por defecto
export const DEFAULT_VIEW_CONFIG = {
	sortBy: 'createdAt',
	sortOrder: 'desc',
	groupBy: null,
	filterBy: null,
	layout: 'grid',
	pageSize: 50,
} as const;

// 📄 Configuración de paginación
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
export const MIN_PAGE_SIZE = 10;

// 🎨 Colores por defecto
export const DEFAULT_COLORS = {
	primary: '#3b82f6',
	secondary: '#8b5cf6',
	accent: '#f59e0b',
	neutral: '#6b7280',
} as const;

// 🎭 Emojis por defecto
export const DEFAULT_EMOJIS = {
	folder: '📁',
	image: '🖼️',
	album: '📸',
	collection: '🌟',
	tag: '🏷️',
	character: '👤',
	place: '📍',
	worldItem: '🎯',
	concept: '💡',
	prompt: '🎯',
	note: '📝',
} as const;

// Re-exportar otros módulos de constantes
export * from './blend-modes';
