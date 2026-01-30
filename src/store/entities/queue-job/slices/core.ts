/**
 * @file Slice core para el store de QueueJob
 * @module store/entities/queue-job/slices/core
 * @description Implementación del slice core para la gestión de trabajos en cola
 */

import type { StateCreator } from 'zustand';
// Refactor 2025-07: se reemplaza QueueJobService por cliente API
import {
	cancelQueueJobInApi,
	createQueueJobInApi,
	deleteQueueJobFromApi,
	getQueueJobsFromApi,
	getQueueStatsFromApi,
	matchesFilters,
	retryQueueJobInApi,
	updateQueueJobInApi,
} from '@/lib/api/client/queue-job.client';
import { clientLogger } from '@/lib/logger/client-logger';
import type {
	CreateQueueJobInput,
	QueueJobExtended,
	QueueJobFilters,
	UpdateQueueJobInput,
} from '@/types/entities/queue-job';
import type { QueueJobState } from '../types';

// Logger para el slice
const coreLogger = clientLogger.withContext('QueueJobStore:Core');

/**
 * Slice que contiene el estado y las acciones principales para los trabajos en cola
 */
export interface QueueJobCoreSlice {
	// Acciones de carga
	loadJobs: () => Promise<void>;
	loadStats: () => Promise<void>;

	// Acciones CRUD
	createJob: (input: CreateQueueJobInput) => Promise<QueueJobExtended>;
	updateJob: (id: string, input: UpdateQueueJobInput) => Promise<QueueJobExtended>;
	deleteJob: (id: string) => Promise<void>;

	// Acciones específicas
	retryJob: (id: string) => Promise<QueueJobExtended>;
	cancelJob: (id: string) => Promise<QueueJobExtended>;
	selectJob: (job?: QueueJobExtended) => void;

	// Reseteo
	resetJobs: () => void;
}

/**
 * Crea el slice core para el store de QueueJob
 */
export const createQueueJobCoreSlice: StateCreator<QueueJobState, [], [], QueueJobCoreSlice> = (set, get) => ({
	// Carga los trabajos en cola según los filtros y paginación actuales
	loadJobs: async () => {
		try {
			coreLogger.info('Cargando trabajos en cola');
			set((state) => ({ ...state, isLoading: true, error: null }));

			const { filters, pagination } = get();
			const result = await getQueueJobsFromApi(filters as QueueJobFilters, pagination);

			set((state) => ({
				...state,
				items: result.items,
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
				isLoading: false,
			}));

			coreLogger.info(`Cargados ${result.items.length} trabajos de ${result.total} totales`);
		} catch (error) {
			coreLogger.error('Error al cargar trabajos en cola', { error });
			set((state) => ({
				...state,
				error: error as Error,
				isLoading: false,
			}));
			throw error;
		}
	},

	// Carga las estadísticas de la cola
	loadStats: async () => {
		try {
			coreLogger.info('Cargando estadísticas de cola');
			set((state) => ({ ...state, isLoading: true, error: null }));

			const stats = await getQueueStatsFromApi();

			set((state) => ({
				...state,
				stats,
				isLoading: false,
			}));

			coreLogger.info('Estadísticas de cola cargadas', { stats });
		} catch (error) {
			coreLogger.error('Error al cargar estadísticas de cola', { error });
			set((state) => ({
				...state,
				error: error as Error,
				isLoading: false,
			}));
			throw error;
		}
	},

	// Crea un nuevo trabajo en cola
	createJob: async (input: CreateQueueJobInput) => {
		try {
			coreLogger.info('Creando trabajo en cola', { input });
			set({ ui: { ...get().ui, isCreating: true } });

			const job = await createQueueJobInApi(input);

			// Actualizar lista si el trabajo coincide con los filtros actuales
			const { filters } = get();
			const matchesFiltersResult = matchesFilters(job, filters as QueueJobFilters);

			if (matchesFiltersResult) {
				set((state) => ({
					...state,
					items: [job, ...state.items],
					total: state.total + 1,
				}));
			}

			set({ ui: { ...get().ui, isCreating: false } });
			coreLogger.info('Trabajo en cola creado', { jobId: job.id });
			return job;
		} catch (error) {
			coreLogger.error('Error al crear trabajo en cola', { error, input });
			set((state) => ({
				...state,
				error: error as Error,
				ui: {
					...state.ui,
					isCreating: false,
				},
			}));
			throw error;
		}
	},

	// Actualiza un trabajo en cola
	updateJob: async (id: string, input: UpdateQueueJobInput) => {
		try {
			coreLogger.info('Actualizando trabajo en cola', { id, input });
			set({ ui: { ...get().ui, isUpdating: true } });

			const job = await updateQueueJobInApi(id, input);

			// Actualizar job en la lista
			set((state) => {
				const updatedItems = state.items.map((item) => (item.id === id ? job : item));
				return {
					...state,
					items: updatedItems,
					selectedJob: state.selectedJob?.id === id ? job : state.selectedJob,
					ui: {
						...state.ui,
						isUpdating: false,
					},
				};
			});

			coreLogger.info('Trabajo en cola actualizado', { jobId: id });
			return job;
		} catch (error) {
			coreLogger.error('Error al actualizar trabajo en cola', { error, id, input });
			set((state) => ({
				...state,
				error: error as Error,
				ui: {
					...state.ui,
					isUpdating: false,
				},
			}));
			throw error;
		}
	},

	// Elimina un trabajo en cola
	deleteJob: async (id: string) => {
		try {
			coreLogger.info('Eliminando trabajo en cola', { id });
			set({ ui: { ...get().ui, isDeleting: true } });

			await deleteQueueJobFromApi(id);

			// Eliminar job de la lista
			set((state) => {
				const updatedItems = state.items.filter((item) => item.id !== id);
				return {
					...state,
					items: updatedItems,
					total: Math.max(0, state.total - 1),
					selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
					ui: {
						...state.ui,
						isDeleting: false,
					},
				};
			});

			coreLogger.info('Trabajo en cola eliminado', { jobId: id });
		} catch (error) {
			coreLogger.error('Error al eliminar trabajo en cola', { error, id });
			set((state) => ({
				...state,
				error: error as Error,
				ui: {
					...state.ui,
					isDeleting: false,
				},
			}));
			throw error;
		}
	},

	// Reintenta un trabajo en cola fallido
	retryJob: async (id: string) => {
		try {
			coreLogger.info('Reintentando trabajo en cola', { id });
			set({ ui: { ...get().ui, isRetrying: true } });

			const job = await retryQueueJobInApi(id);

			// Actualizar job en la lista
			set((state) => {
				const updatedItems = state.items.map((item) => (item.id === id ? job : item));
				return {
					...state,
					items: updatedItems,
					selectedJob: state.selectedJob?.id === id ? job : state.selectedJob,
					ui: {
						...state.ui,
						isRetrying: false,
					},
				};
			});

			coreLogger.info('Trabajo en cola reintentado', { jobId: id });
			return job;
		} catch (error) {
			coreLogger.error('Error al reintentar trabajo en cola', { error, id });
			set((state) => ({
				...state,
				error: error as Error,
				ui: {
					...state.ui,
					isRetrying: false,
				},
			}));
			throw error;
		}
	},

	// Cancela un trabajo en cola
	cancelJob: async (id: string) => {
		try {
			coreLogger.info('Cancelando trabajo en cola', { id });
			set({ ui: { ...get().ui, isCancelling: true } });

			const job = await cancelQueueJobInApi(id);

			// Actualizar job en la lista
			set((state) => {
				const updatedItems = state.items.map((item) => (item.id === id ? job : item));
				return {
					...state,
					items: updatedItems,
					selectedJob: state.selectedJob?.id === id ? job : state.selectedJob,
					ui: {
						...state.ui,
						isCancelling: false,
					},
				};
			});

			coreLogger.info('Trabajo en cola cancelado', { jobId: id });
			return job;
		} catch (error) {
			coreLogger.error('Error al cancelar trabajo en cola', { error, id });
			set((state) => ({
				...state,
				error: error as Error,
				ui: {
					...state.ui,
					isCancelling: false,
				},
			}));
			throw error;
		}
	},

	// Selecciona un trabajo en cola
	selectJob: (job?: QueueJobExtended) => {
		coreLogger.info('Seleccionando trabajo en cola', { jobId: job?.id });
		set((state) => ({ ...state, selectedJob: job || null }));
	},

	// Resetea el estado de los trabajos en cola
	resetJobs: () => {
		coreLogger.info('Reseteando estado de trabajos en cola');
		set((state) => ({
			...state,
			items: [],
			total: 0,
			page: 1,
			limit: 10,
			totalPages: 0,
			selectedJob: null,
			isLoading: false,
			error: null,
		}));
	},
});
