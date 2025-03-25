/**
 * @file Tipos para el store de WorldItem
 * @module store/entities/world-item/types
 */

import {
    ParsedWorldItemVisualConfig,
    WorldItem,
    WorldItemFilters,
    WorldItemViewMode
} from '../../../types/entities/world-item';
import { WorldItemCoreSlice } from './slices/core';
import { WorldItemFiltersSlice } from './slices/filters';
import { WorldItemUISlice } from './slices/ui';

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
}

/**
 * Tipo completo del store
 */
export type WorldItemStore = WorldItemCoreSlice & WorldItemUISlice & WorldItemFiltersSlice;

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