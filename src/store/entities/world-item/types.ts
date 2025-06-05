/**
 * @file Tipos para el store de WorldItem
 * @module store/entities/world-item/types
 */

import type { WorldItem as PrismaWorldItem } from '@prisma/client';
import type {
	ParsedWorldItemVisualConfig,
	WorldItem,
	WorldItemFilters,
	WorldItemViewMode,
} from '../../../types/entities/world-item';
import type { WorldItemCoreSlice } from './slices/core';
import type { WorldItemFiltersSlice } from './slices/filters';
import type { WorldItemUISlice } from './slices/ui';

/**
 * Estado global del store
 */
export interface WorldItemState {
	// Datos
	worldItems: WorldItem[];
	isLoading: boolean;
	error: string | null;

	// UI y configuración
	visualConfig: ParsedWorldItemVisualConfig | null;
	viewMode: WorldItemViewMode;
	sortBy: string;
	filters: WorldItemFilters;
	expandedIds: string[];
	selectedIds: string[];
	currentItemId: string | null;
	searchQuery: string;

	// Estados UI
	isCreatingItem: boolean;
	isEditingItem: boolean;
	isProcessingAction: boolean;

	// Nuevo estado para el store de WorldItem basado en Prisma
	ui: WorldItemUIState;
}

/**
 * Tipo completo del store
 */
export type WorldItemStore = WorldItemCoreSlice & WorldItemUISlice & WorldItemFiltersSlice & WorldItemActions;

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

// 🎯 Estado de UI
export interface WorldItemUIState {
	selectedId: string | null;
	editingId: string | null;
	highlightedId: string | null;
	viewMode: WorldItemViewMode;
}

// 🔄 Acciones del store
export interface WorldItemActions {
	// Carga de items
	loadWorldItems: () => Promise<void>;

	// Gestión de items
	createWorldItem: (item: Partial<PrismaWorldItem>) => Promise<void>;
	updateWorldItem: (id: string, item: Partial<PrismaWorldItem>) => Promise<void>;
	deleteWorldItem: (id: string) => Promise<void>;

	// Acciones de UI
	selectWorldItem: (id: string | null) => void;
	startEditing: (id: string | null) => void;
	highlightWorldItem: (id: string | null) => void;
	setViewMode: (mode: WorldItemViewMode) => void;

	// Filtros
	updateFilters: (filters: Partial<WorldItemFilters>) => void;
	clearFilters: () => void;

	// Selectores
	getWorldItemById: (id: string) => WorldItem | undefined;
	getFilteredWorldItems: () => WorldItem[];
	getSortedWorldItems: () => WorldItem[];
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
