/**
 * @file Slice de filtros para el store de QueueJob
 * @module store/entities/queue-job/slices/filters
 * @description Implementación del slice de filtros para la gestión de trabajos en cola
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { StateCreator } from 'zustand';
import type { QueueJobSortField, QueueJobSortOrder, QueueJobState, QueueJobStatus, QueueJobType } from '../types';

// Logger para el slice
const filtersLogger = clientLogger.withContext('QueueJobStore:Filters');

/**
 * Slice que contiene el estado y las acciones de filtrado
 */
export interface QueueJobFiltersSlice {
  // Búsqueda por texto
  setSearchTerm: (searchTerm: string) => void;

  // Filtros de estado
  setStatusFilter: (status: QueueJobStatus | null) => void;
  toggleStatusFilter: (status: QueueJobStatus) => void;

  // Filtros de tipo
  setTypeFilter: (type: QueueJobType | null) => void;
  toggleTypeFilter: (type: QueueJobType) => void;

  // Filtros de rango de fechas
  setDateRange: (startDate: Date | null, endDate: Date | null) => void;

  // Filtros de usuarios
  setUserFilter: (userId: string | null) => void;

  // Filtros de prioridad
  setPriorityFilter: (priority: number | null) => void;

  // Ordenamiento
  setSortField: (field: QueueJobSortField) => void;
  setSortOrder: (order: QueueJobSortOrder) => void;

  // Paginación
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Reseteo de filtros
  resetFilters: () => void;

  // Persistencia de filtros
  saveFilters: () => void;
  loadSavedFilters: () => void;
}

/**
 * Valores iniciales para el slice de filtros
 */
export const initialFiltersState = {
  searchTerm: '',
  status: null as QueueJobStatus | null,
  statusList: [] as QueueJobStatus[],
  type: null as QueueJobType | null,
  typeList: [] as QueueJobType[],
  startDate: null as Date | null,
  endDate: null as Date | null,
  userId: null as string | null,
  priority: null as number | null,
  sortField: 'createdAt' as QueueJobSortField,
  sortOrder: 'desc' as QueueJobSortOrder,
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
};

/**
 * Crea el slice de filtros para el store de QueueJob
 */
export const createQueueJobFiltersSlice: StateCreator<
  QueueJobState,
  [],
  [],
  QueueJobFiltersSlice
> = (set, get) => ({
  // Establece el término de búsqueda
  setSearchTerm: (searchTerm: string) => {
    filtersLogger.debug('Actualizando término de búsqueda', { searchTerm });
    set({
      filters: {
        ...get().filters,
        searchTerm,
        page: 1 // Resetear paginación al cambiar filtros
      }
    });
  },

  // Establece el filtro de estado
  setStatusFilter: (status: QueueJobStatus | null) => {
    filtersLogger.debug('Estableciendo filtro de estado', { status });
    set({
      filters: {
        ...get().filters,
        status,
        statusList: status ? [status] : [],
        page: 1
      }
    });
  },

  // Alterna un estado en la lista de filtros
  toggleStatusFilter: (status: QueueJobStatus) => {
    const { filters } = get();
    const statusList = [...filters.statusList];
    const index = statusList.indexOf(status);

    if (index === -1) {
      statusList.push(status);
      filtersLogger.debug('Agregando estado al filtro', { status });
    } else {
      statusList.splice(index, 1);
      filtersLogger.debug('Eliminando estado del filtro', { status });
    }

    set({
      filters: {
        ...filters,
        status: statusList.length === 1 ? statusList[0] : null,
        statusList,
        page: 1
      }
    });
  },

  // Establece el filtro de tipo
  setTypeFilter: (type: QueueJobType | null) => {
    filtersLogger.debug('Estableciendo filtro de tipo', { type });
    set({
      filters: {
        ...get().filters,
        type,
        typeList: type ? [type] : [],
        page: 1
      }
    });
  },

  // Alterna un tipo en la lista de filtros
  toggleTypeFilter: (type: QueueJobType) => {
    const { filters } = get();
    const typeList = [...filters.typeList];
    const index = typeList.indexOf(type);

    if (index === -1) {
      typeList.push(type);
      filtersLogger.debug('Agregando tipo al filtro', { type });
    } else {
      typeList.splice(index, 1);
      filtersLogger.debug('Eliminando tipo del filtro', { type });
    }

    set({
      filters: {
        ...filters,
        type: typeList.length === 1 ? typeList[0] : null,
        typeList,
        page: 1
      }
    });
  },

  // Establece el rango de fechas
  setDateRange: (startDate: Date | null, endDate: Date | null) => {
    filtersLogger.debug('Actualizando rango de fechas', { startDate, endDate });
    set({
      filters: {
        ...get().filters,
        startDate,
        endDate,
        page: 1
      }
    });
  },

  // Establece el filtro de usuario
  setUserFilter: (userId: string | null) => {
    filtersLogger.debug('Actualizando filtro de usuario', { userId });
    set({
      filters: {
        ...get().filters,
        userId,
        page: 1
      }
    });
  },

  // Establece el filtro de prioridad
  setPriorityFilter: (priority: number | null) => {
    filtersLogger.debug('Actualizando filtro de prioridad', { priority });
    set({
      filters: {
        ...get().filters,
        priority,
        page: 1
      }
    });
  },

  // Establece el campo de ordenamiento
  setSortField: (sortField: QueueJobSortField) => {
    filtersLogger.debug('Actualizando campo de ordenamiento', { sortField });
    set({
      filters: {
        ...get().filters,
        sortField
      }
    });
  },

  // Establece el orden
  setSortOrder: (sortOrder: QueueJobSortOrder) => {
    filtersLogger.debug('Actualizando orden', { sortOrder });
    set({
      filters: {
        ...get().filters,
        sortOrder
      }
    });
  },

  // Establece la página actual
  setPage: (page: number) => {
    filtersLogger.debug('Cambiando a página', { page });
    set({
      filters: {
        ...get().filters,
        page
      }
    });
  },

  // Establece el tamaño de página
  setPageSize: (pageSize: number) => {
    filtersLogger.debug('Actualizando tamaño de página', { pageSize });
    set({
      filters: {
        ...get().filters,
        pageSize,
        page: 1 // Resetear a primera página al cambiar el tamaño
      }
    });
  },

  // Resetea todos los filtros a sus valores iniciales
  resetFilters: () => {
    filtersLogger.info('Reseteando todos los filtros');
    set({
      filters: {
        ...initialFiltersState
      }
    });
  },

  // Guarda los filtros actuales en el localStorage
  saveFilters: () => {
    filtersLogger.info('Guardando filtros en localStorage');
    try {
      const { filters } = get();
      const filtersToSave = {
        ...filters,
        // Excluir valores que no se pueden serializar directamente
        startDate: filters.startDate ? filters.startDate.toISOString() : null,
        endDate: filters.endDate ? filters.endDate.toISOString() : null,
      };

      localStorage.setItem('queueJobFilters', JSON.stringify(filtersToSave));
    } catch (error) {
      filtersLogger.error('Error al guardar filtros', { error });
    }
  },

  // Carga los filtros guardados desde localStorage
  loadSavedFilters: () => {
    filtersLogger.info('Cargando filtros desde localStorage');
    try {
      const savedFilters = localStorage.getItem('queueJobFilters');

      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);

        // Convertir fechas de string a objetos Date
        const startDate = parsedFilters.startDate ? new Date(parsedFilters.startDate) : null;
        const endDate = parsedFilters.endDate ? new Date(parsedFilters.endDate) : null;

        set({
          filters: {
            ...get().filters,
            ...parsedFilters,
            startDate,
            endDate
          }
        });

        filtersLogger.debug('Filtros cargados correctamente', { parsedFilters });
      }
    } catch (error) {
      filtersLogger.error('Error al cargar filtros', { error });
    }
  }
});