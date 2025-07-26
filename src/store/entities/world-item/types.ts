/**
 * @file Tipos para el store de WorldItem
 * @module store/entities/world-item/types
 * @description Define los tipos para el store de zustand de WorldItem
 * @updated 2025-06-20
 */

import type {
	WorldItemCreateInput as CreateWorldItemData,
	WorldItemFilters,
	WorldItemSortCriteria,
	WorldItemUpdateInput,
	WorldItemViewMode,
	WorldItemWithStats,
} from '@/types/entities/world-item';

/**
 * Tipo de WorldItem usado en el store
 */
export type WorldItem = WorldItemWithStats;

// WorldItemUpdateData se define en hooks.ts para evitar duplicación

/**
 * 🎮 Estado de UI del store
 */
export interface WorldItemUIState {
	selectedId: string | null;
	editingId: string | null;
	highlightedId: string | null;
	viewMode: WorldItemViewMode;
}

/**
 * 📊 Estado global del store (solo datos, sin métodos)
 */
export interface WorldItemState {
	// 📋 Datos principales
	worldItems: WorldItem[];
	isLoading: boolean;
	error: string | null;

	// 🎨 UI y configuración visual
	ui: WorldItemUIState;
	filters: WorldItemFilters;
}

/**
 * 🔄 Acciones disponibles en el store
 */
export interface WorldItemActions {
	// 📥 Carga de datos
	loadWorldItems: () => Promise<void>;

	// 📝 Gestión de items
	createWorldItem: (item: CreateWorldItemData) => Promise<void>;
	updateWorldItem: (id: string, item: WorldItemUpdateInput) => Promise<void>;
	deleteWorldItem: (id: string) => Promise<void>;

	// 🔍 Selectores y getters
	getWorldItemById: (id: string) => WorldItem | undefined;
	getFilteredWorldItems: () => WorldItem[];
	getSortedWorldItems: () => WorldItem[];

	// 🎮 Acciones de UI
	selectWorldItem: (id: string | null) => void;
	startEditing: (id: string | null) => void;
	highlightWorldItem: (id: string | null) => void;
	setViewMode: (mode: WorldItemViewMode) => void;
	clearSelection: () => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<WorldItemFilters>) => void;
	clearFilters: () => void;
	setSearchQuery: (query: string) => void;

	// 🛠️ Utilidades del store
	setWorldItems: (worldItems: WorldItem[]) => void;
	addWorldItem: (worldItem: WorldItem) => void;
	resetStore: () => void;
	setError: (error: string | null) => void;
}

/**
 * 🏗️ Tipo completo del store
 */
export type WorldItemStore = WorldItemState & WorldItemActions;

/**
 * Opciones para el servicio de API para la entidad WorldItem
 */
export interface WorldItemApiOptions {
	/**
	 * URL base para la API
	 */
	baseUrl?: string;

	/**
	 * Objeto de configuración fetch para las solicitudes
	 */
	fetchOptions?: RequestInit;

	/**
	 * Función de transformación personalizada para los datos obtenidos
	 */
	transform?: (data: unknown) => WorldItem[];

	/**
	 * Manejador de errores personalizado
	 */
	errorHandler?: (error: unknown) => string;

	/**
	 * Tiempo de caché en milisegundos
	 */
	cacheTime?: number;
}

/**
 * Opciones para la exportación de datos de WorldItem
 */
export interface WorldItemExportOptions {
	/**
	 * Formato de exportación (json, csv)
	 */
	format: 'json' | 'csv';

	/**
	 * IDs específicos para exportar, o todos si no se especifica
	 */
	ids?: string[];

	/**
	 * Incluir relaciones (imágenes, notas)
	 */
	includeRelations?: boolean;

	/**
	 * Incluir metadatos (fechas, ids)
	 */
	includeMetadata?: boolean;
}

/**
 * Resultado del servicio de búsqueda de WorldItem
 */
export interface WorldItemSearchResult {
	items: WorldItem[];
	totalCount: number;
	hasMore: boolean;
	nextCursor?: string;
}

/**
 * Opciones para las operaciones por lotes en WorldItem
 */
export interface WorldItemBatchOptions {
	/**
	 * Operación a realizar
	 */
	operation: 'delete' | 'update' | 'favorite' | 'unfavorite' | 'changeType' | 'changeCategory';

	/**
	 * IDs de los elementos a procesar
	 */
	ids: string[];

	/**
	 * Datos para la operación (solo para update, changeType, changeCategory)
	 */
	data?: Partial<WorldItem> | { [key: string]: unknown };
}

// Re-exportar tipos canónicos
export type { WorldItemSortCriteria };
