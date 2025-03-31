/**
 * @file Selectores para el store de QueueJob
 * @module store/entities/queue-job/slices/selectors
 * @description Implementación de selectores optimizados para el store de QueueJob
 */

import type { QueueJobState } from '../types';

/**
 * Selectores básicos para acceder a las propiedades del estado
 */
export const coreSelectors = {
  // Selector de todos los jobs
  jobs: (state: QueueJobState) => state.core.items,

  // Selector de job seleccionado
  selectedJob: (state: QueueJobState) => state.core.selectedJob,

  // Selector de ID de job seleccionado
  selectedJobId: (state: QueueJobState) => state.core.selectedJob?.id || null,

  // Selector de estadísticas
  stats: (state: QueueJobState) => state.core.stats,

  // Selector de estado de carga
  isLoading: (state: QueueJobState) => state.core.isLoading,

  // Selector de estado de error
  error: (state: QueueJobState) => state.core.error,

  // Selector para verificar si hay algún job
  hasJobs: (state: QueueJobState) => state.core.items.length > 0,
};

/**
 * Selectores para la UI
 */
export const uiSelectors = {
  // Selectores de estado de acciones
  isCreating: (state: QueueJobState) => state.ui.isCreating,
  isUpdating: (state: QueueJobState) => state.ui.isUpdating,
  isDeleting: (state: QueueJobState) => state.ui.isDeleting,
  isRetrying: (state: QueueJobState) => state.ui.isRetrying,
  isCancelling: (state: QueueJobState) => state.ui.isCancelling,

  // Selectores para la ventana modal de detalles
  isDetailsModalOpen: (state: QueueJobState) => state.ui.isDetailsModalOpen,
  jobDetailsId: (state: QueueJobState) => state.ui.jobDetailsId,

  // Selectores para selección de jobs
  selectedIds: (state: QueueJobState) => state.ui.selectedIds,
  selectedCount: (state: QueueJobState) => state.ui.selectedIds.length,

  // Selector para modo de vista
  viewMode: (state: QueueJobState) => state.ui.viewMode,

  // Selector para saber si alguna acción está en progreso
  isProcessing: (state: QueueJobState) =>
    state.ui.isCreating ||
    state.ui.isUpdating ||
    state.ui.isDeleting ||
    state.ui.isRetrying ||
    state.ui.isCancelling,
};

/**
 * Selectores para los filtros
 */
export const filterSelectors = {
  // Selectores de filtros
  searchTerm: (state: QueueJobState) => state.filters.searchTerm,
  statusFilter: (state: QueueJobState) => state.filters.status,
  statusListFilter: (state: QueueJobState) => state.filters.statusList,
  typeFilter: (state: QueueJobState) => state.filters.type,
  typeListFilter: (state: QueueJobState) => state.filters.typeList,
  dateRange: (state: QueueJobState) => ({
    startDate: state.filters.startDate,
    endDate: state.filters.endDate
  }),
  userFilter: (state: QueueJobState) => state.filters.userId,
  priorityFilter: (state: QueueJobState) => state.filters.priority,

  // Selectores de ordenamiento
  sortField: (state: QueueJobState) => state.filters.sortField,
  sortOrder: (state: QueueJobState) => state.filters.sortOrder,

  // Selectores de paginación
  currentPage: (state: QueueJobState) => state.filters.page,
  pageSize: (state: QueueJobState) => state.filters.pageSize,
  totalItems: (state: QueueJobState) => state.filters.totalItems,
  totalPages: (state: QueueJobState) => state.filters.totalPages,

  // Selector para verificar si hay filtros activos
  hasActiveFilters: (state: QueueJobState) => {
    const { filters } = state;
    return (
      !!filters.searchTerm ||
      filters.statusList.length > 0 ||
      filters.typeList.length > 0 ||
      !!filters.startDate ||
      !!filters.endDate ||
      !!filters.userId ||
      !!filters.priority
    );
  },
};

/**
 * Selectores compuestos que combinan múltiples partes del estado
 */
export const computedSelectors = {
  // Selector para obtener job por ID
  getJobById: (state: QueueJobState) => (id: string) =>
    state.core.items.find(job => job.id === id),

  // Selector para obtener lista de jobs seleccionados
  selectedJobs: (state: QueueJobState) =>
    state.core.items.filter(job => state.ui.selectedIds.includes(job.id)),

  // Selector para verificar si un job está seleccionado por ID
  isJobSelected: (state: QueueJobState) => (id: string) =>
    state.ui.selectedIds.includes(id),

  // Selector para estadísticas filtradas por estado
  jobCountByStatus: (state: QueueJobState) => {
    const stats = state.core.stats || {};
    return {
      total: stats.total || state.core.items.length,
      pending: stats.pending || 0,
      active: stats.active || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      cancelled: stats.cancelled || 0
    };
  },

  // Selector para trabajos filtrados por estado
  jobsByStatus: (state: QueueJobState) => (status: string) =>
    state.core.items.filter(job => job.status === status),

  // Selector para verificar si hay un error en cualquier parte del estado
  hasError: (state: QueueJobState) =>
    !!state.core.error,

  // Selector para información de paginación
  paginationInfo: (state: QueueJobState) => {
    const { page, pageSize, totalItems } = state.filters;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
      startItem: (page - 1) * pageSize + 1,
      endItem: Math.min(page * pageSize, totalItems),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }
};

/**
 * Exportación de todos los selectores agrupados
 */
export const queueJobSelectors = {
  ...coreSelectors,
  ...uiSelectors,
  ...filterSelectors,
  ...computedSelectors
};