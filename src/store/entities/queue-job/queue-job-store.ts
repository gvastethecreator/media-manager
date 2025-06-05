/**
 * @file Store global para la gestión de trabajos en cola
 * @module store/entities/queue-job/queue-job-store
 * @description Implementación del store de Zustand para trabajos en cola
 */

import { clientLogger } from '@/lib/logger/client-logger';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createQueueJobCoreSlice } from './slices/core';
import { createQueueJobFiltersSlice } from './slices/filters';
import { queueJobSelectors } from './slices/selectors';
import { createQueueJobUISlice } from './slices/ui';
import { QueueJobState, initialQueueJobState } from './types';

// Logger para el store
const logger = clientLogger.withContext('QueueJobStore');

/**
 * Store para la gestión de trabajos en cola
 *
 * Usa una arquitectura de slices para separar la lógica:
 * - core: datos principales y acciones CRUD
 * - ui: estado de interfaz de usuario
 * - filters: filtros, ordenamiento y paginación
 */
export const useQueueJobStore = create<QueueJobState>()(
	devtools(
		persist(
			immer((...a) => ({
				// Estado inicial
				...initialQueueJobState,

				// Slices
				...createQueueJobCoreSlice(...a),
				...createQueueJobUISlice(...a),
				...createQueueJobFiltersSlice(...a),
			})),
			{
				name: 'queue-job-store',
				// Solo persistir las preferencias de UI y filtros
				partialize: (state) => ({
					ui: {
						viewMode: state.ui.viewMode,
					},
					filters: {
						pageSize: state.filters.pageSize,
						sortField: state.filters.sortField,
						sortOrder: state.filters.sortOrder,
					},
				}),
				onRehydrateStorage: () => {
					logger.info('🔄 Store de QueueJob hidratado desde localStorage');
					return (state) => {
						if (state) {
							logger.debug('🧮 Estado de QueueJob restaurado', { state });
						}
					};
				},
			}
		),
		{ name: 'QueueJobStore' }
	)
);

/**
 * Log de inicialización del store
 */
logger.info('🚀 Store de QueueJob inicializado');

/**
 * Exportación de selectores
 */
export const queueJobStore = {
	use: useQueueJobStore,
	get: useQueueJobStore.getState,
	selectors: queueJobSelectors,
};
