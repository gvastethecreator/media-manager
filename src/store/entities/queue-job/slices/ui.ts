/**
 * @file Slice de UI para el store de QueueJob
 * @module store/entities/queue-job/slices/ui
 * @description Implementación del slice de UI para la gestión de trabajos en cola
 */

import type { StateCreator } from 'zustand';
import { clientLogger } from '@/lib/logger/client-logger';
import type { QueueJobState } from '../types';

// Logger para el slice
const uiLogger = clientLogger.withContext('QueueJobStore:UI');

/**
 * Slice que contiene el estado y las acciones de la interfaz de usuario
 */
export interface QueueJobUISlice {
	clearSelection: () => void;
	closeDetailsModal: () => void;

	// Acciones para vista de detalles
	openDetailsModal: (jobId: string) => void;

	// Acciones para reseteo
	resetUIState: () => void;
	selectJobs: (jobIds: string[]) => void;

	// Acciones para estado de cancelación
	setIsCancelling: (isCancelling: boolean) => void;
	// Acciones para estado de creación
	setIsCreating: (isCreating: boolean) => void;

	// Acciones para estado de eliminación
	setIsDeleting: (isDeleting: boolean) => void;

	// Acciones para estado de reintento
	setIsRetrying: (isRetrying: boolean) => void;

	// Acciones para estado de actualización
	setIsUpdating: (isUpdating: boolean) => void;

	// Acciones para vista
	setViewMode: (mode: 'grid' | 'list' | 'table') => void;

	// Acciones para selección de trabajos
	toggleSelected: (jobId: string) => void;
}

/**
 * Valores iniciales para el slice UI
 */
export const initialUIState = {
	isCreating: false,
	isUpdating: false,
	isDeleting: false,
	isRetrying: false,
	isCancelling: false,
	selectedIds: [] as string[],
	jobDetailsId: null as string | null,
	isDetailsModalOpen: false,
	viewMode: 'table' as 'grid' | 'list' | 'table',
};

/**
 * Crea el slice UI para el store de QueueJob
 */
export const createQueueJobUISlice: StateCreator<QueueJobState, [], [], QueueJobUISlice> = (set, get) => ({
	// Establece el estado de creación
	setIsCreating: (isCreating: boolean) => {
		uiLogger.debug('Actualizando estado de creación', { isCreating });
		set({ ui: { ...get().ui, isCreating } });
	},

	// Establece el estado de actualización
	setIsUpdating: (isUpdating: boolean) => {
		uiLogger.debug('Actualizando estado de actualización', { isUpdating });
		set({ ui: { ...get().ui, isUpdating } });
	},

	// Establece el estado de eliminación
	setIsDeleting: (isDeleting: boolean) => {
		uiLogger.debug('Actualizando estado de eliminación', { isDeleting });
		set({ ui: { ...get().ui, isDeleting } });
	},

	// Establece el estado de reintento
	setIsRetrying: (isRetrying: boolean) => {
		uiLogger.debug('Actualizando estado de reintento', { isRetrying });
		set({ ui: { ...get().ui, isRetrying } });
	},

	// Establece el estado de cancelación
	setIsCancelling: (isCancelling: boolean) => {
		uiLogger.debug('Actualizando estado de cancelación', { isCancelling });
		set({ ui: { ...get().ui, isCancelling } });
	},

	// Abre el modal de detalles para un trabajo
	openDetailsModal: (jobId: string) => {
		uiLogger.info('Abriendo modal de detalles', { jobId });
		set({
			ui: {
				...get().ui,
				jobDetailsId: jobId,
				isDetailsModalOpen: true,
			},
		});

		// Asegurarse de que el trabajo esté seleccionado en el estado
		const state = get();
		const job = state.items.find((item) => item.id === jobId);
		if (job) {
			set((currentState) => ({ ...currentState, selectedJob: job }));
		}
	},

	// Cierra el modal de detalles
	closeDetailsModal: () => {
		uiLogger.info('Cerrando modal de detalles');
		set({
			ui: {
				...get().ui,
				isDetailsModalOpen: false,
			},
		});
	},

	// Alterna la selección de un trabajo
	toggleSelected: (jobId: string) => {
		const { ui } = get();
		const selectedIds = [...ui.selectedIds];
		const index = selectedIds.indexOf(jobId);

		if (index === -1) {
			selectedIds.push(jobId);
			uiLogger.debug('Trabajo seleccionado', { jobId });
		} else {
			selectedIds.splice(index, 1);
			uiLogger.debug('Trabajo deseleccionado', { jobId });
		}

		set({ ui: { ...ui, selectedIds } });
	},

	// Selecciona múltiples trabajos
	selectJobs: (jobIds: string[]) => {
		uiLogger.info('Seleccionando múltiples trabajos', { count: jobIds.length });
		set({
			ui: {
				...get().ui,
				selectedIds: [...jobIds],
			},
		});
	},

	// Limpia la selección de trabajos
	clearSelection: () => {
		uiLogger.info('Limpiando selección de trabajos');
		set({
			ui: {
				...get().ui,
				selectedIds: [],
			},
		});
	},

	// Establece el modo de vista
	setViewMode: (viewMode: 'grid' | 'list' | 'table') => {
		uiLogger.info('Cambiando modo de vista', { viewMode });
		set({
			ui: {
				...get().ui,
				viewMode,
			},
		});
	},

	// Resetea el estado de la UI
	resetUIState: () => {
		uiLogger.info('Reseteando estado de UI');
		set({
			ui: {
				...initialUIState,
			},
		});
	},
});
