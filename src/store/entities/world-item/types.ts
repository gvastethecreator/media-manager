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
	editingId: string | null;
	highlightedId: string | null;
	selectedId: string | null;
	viewMode: WorldItemViewMode;
}

/**
 * 📊 Estado global del store (solo datos, sin métodos)
 */
export interface WorldItemState {
	error: string | null;
	filters: WorldItemFilters;
	isLoading: boolean;

	// 🎨 UI y configuración visual
	ui: WorldItemUIState;
	// 📋 Datos principales
	worldItems: WorldItem[];
}

/**
 * 🔄 Acciones disponibles en el store
 */
export interface WorldItemActions {
	addWorldItem: (worldItem: WorldItem) => void;
	clearFilters: () => void;
	clearSelection: () => void;

	// 📝 Gestión de items
	createWorldItem: (item: CreateWorldItemData) => Promise<void>;
	deleteWorldItem: (id: string) => Promise<void>;
	getFilteredWorldItems: () => WorldItem[];
	getSortedWorldItems: () => WorldItem[];

	// 🔍 Selectores y getters
	getWorldItemById: (id: string) => WorldItem | undefined;
	highlightWorldItem: (id: string | null) => void;
	// 📥 Carga de datos
	loadWorldItems: () => Promise<void>;
	resetStore: () => void;

	// 🎮 Acciones de UI
	selectWorldItem: (id: string | null) => void;
	setError: (error: string | null) => void;
	setSearchQuery: (query: string) => void;
	setViewMode: (mode: WorldItemViewMode) => void;

	// 🛠️ Utilidades del store
	setWorldItems: (worldItems: WorldItem[]) => void;
	startEditing: (id: string | null) => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<WorldItemFilters>) => void;
	updateWorldItem: (id: string, item: WorldItemUpdateInput) => Promise<void>;
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
	 * Tiempo de caché en milisegundos
	 */
	cacheTime?: number;

	/**
	 * Manejador de errores personalizado
	 */
	errorHandler?: (error: unknown) => string;

	/**
	 * Objeto de configuración fetch para las solicitudes
	 */
	fetchOptions?: RequestInit;

	/**
	 * Función de transformación personalizada para los datos obtenidos
	 */
	transform?: (data: unknown) => WorldItem[];
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
	 * Incluir metadatos (fechas, ids)
	 */
	includeMetadata?: boolean;

	/**
	 * Incluir relaciones (imágenes, notas)
	 */
	includeRelations?: boolean;
}

/**
 * Resultado del servicio de búsqueda de WorldItem
 */
export interface WorldItemSearchResult {
	hasMore: boolean;
	items: WorldItem[];
	nextCursor?: string;
	totalCount: number;
}

/**
 * Opciones para las operaciones por lotes en WorldItem
 */
export interface WorldItemBatchOptions {
	/**
	 * Datos para la operación (solo para update, changeType, changeCategory)
	 */
	data?: Partial<WorldItem> | { [key: string]: unknown };

	/**
	 * IDs de los elementos a procesar
	 */
	ids: string[];
	/**
	 * Operación a realizar
	 */
	operation: 'delete' | 'update' | 'favorite' | 'unfavorite' | 'changeType' | 'changeCategory';
}

// Re-exportar tipos canónicos
export type { WorldItemSortCriteria };
