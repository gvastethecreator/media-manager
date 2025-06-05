/**
 * @file Exportaciones del store de trabajos en cola
 * @module store/entities/queue-job
 * @description Exporta el store, selectores, y tipos para el módulo de QueueJob
 */

// Exportar store principal y selectores
export { queueJobStore, useQueueJobStore } from './queue-job-store';

// Exportar selectores
export { queueJobSelectors } from './slices/selectors';

// Exportar tipos
export type {
	QueueJobCoreState,
	QueueJobState,
} from './types';

export {
	QueueJobStatus,
	QueueJobType,
	initialQueueJobState,
} from './types';

// Exportar interfaces de slices
export type { QueueJobCoreSlice } from './slices/core';

export type { QueueJobUISlice } from './slices/ui';

export type { QueueJobFiltersSlice } from './slices/filters';
