/**
 * @file Tipos para el store de WorldItem
 * @module store/entities/world-item/types
 * @description Define los tipos para el store de zustand de WorldItem
 * @updated 2025-06-20
 */

import type {
    WorldItemCreateInput as CreateWorldItemData,
    WorldItemUpdateInput as UpdateWorldItemData,
    WorldItem,
    WorldItemFilters,
    WorldItemViewMode
} from '@/types/entities/world-item';

/**
 * 📊 Estado global del store
 */
export interface WorldItemState {
	// 📋 Datos principales
	worldItems: WorldItem[];
	isLoading: boolean;
	error: string | null;

	// 🎨 UI y configuración visual
	ui: WorldItemUIState;
	filters: WorldItemFilters;

	// 🔍 Selectores y getters
	getWorldItemById: (id: string) => WorldItem | undefined;
	getFilteredWorldItems: () => WorldItem[];
	getSortedWorldItems: () => WorldItem[];
}

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
 * 🔄 Acciones disponibles en el store
 */
export interface WorldItemActions {
	// 📥 Carga de datos
	loadWorldItems: () => Promise<void>;

	// 📝 Gestión de items
	createWorldItem: (item: CreateWorldItemData) => Promise<void>;
	updateWorldItem: (id: string, item: UpdateWorldItemData) => Promise<void>;
	deleteWorldItem: (id: string) => Promise<void>;

	// 🎮 Acciones de UI
	selectWorldItem: (id: string | null) => void;
	startEditing: (id: string | null) => void;
	highlightWorldItem: (id: string | null) => void;
	setViewMode: (mode: WorldItemViewMode) => void;

	// 🔍 Filtros
	updateFilters: (filters: Partial<WorldItemFilters>) => void;
	clearFilters: () => void;
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
	transform?: (data: any) => WorldItem[];

	/**
	 * Manejador de errores personalizado
	 */
	errorHandler?: (error: any) => string;

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
	data?: Partial<WorldItem> | { [key: string]: any };
}

// 📊 Enum para ordenamiento
export enum WorldItemSortCriteria {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	CREATED_AT_ASC = 'created_at_asc',
	CREATED_AT_DESC = 'created_at_desc',
	UPDATED_AT_ASC = 'updated_at_asc',
	UPDATED_AT_DESC = 'updated_at_desc',
	RARITY_ASC = 'rarity_asc',
	RARITY_DESC = 'rarity_desc',
}
