/**
 * @file Constantes para el store de Task
 * @module store/entities/task/constants
 */

import { TaskSortCriteria, TaskViewMode } from './types';

/**
 * Valores por defecto para el modo de visualización
 */
export const DEFAULT_VIEW_MODE = TaskViewMode.LIST;

/**
 * Valores por defecto para la ordenación
 */
export const DEFAULT_SORT_CRITERIA = TaskSortCriteria.UPDATED_AT;
export const DEFAULT_SORT_DIRECTION = 'desc' as const;

/**
 * Valores por defecto para filtros
 */
export const DEFAULT_FILTERS = {
  status: [],
  priority: [],
  type: [],
  tags: [],
  search: '',
  createdAfter: null,
  createdBefore: null,
  updatedAfter: null,
  updatedBefore: null,
};

/**
 * Nombre del store para persistencia
 */
export const TASK_STORE_NAME = 'task-store';

/**
 * Estados de carga
 */
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;
