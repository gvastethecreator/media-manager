/**
 * @file Slice principal (core) para el store de Workflow.
 * @module store/entities/workflow/slices/core
 * @description Gestiona el estado y las acciones CRUD para la entidad Workflow.
 */

import { produce } from 'immer';
import type { StateCreator } from 'zustand';
// Refactor 2025-07: ahora usamos cliente API en lugar de workflow.service
import {
	createWorkflowInApi,
	deleteWorkflowFromApi,
	getWorkflowsFromApi,
	updateWorkflowInApi,
} from '@/lib/api/client/workflow.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { WorkflowCoreActions, WorkflowCoreState, WorkflowStore } from '../types';

const logger = clientLogger.withContext('WorkflowCoreSlice');

const initialState: WorkflowCoreState = {
	workflows: {},
	isLoading: false,
	error: null,
	lastUpdated: null,
};

export const createWorkflowCoreSlice: StateCreator<
	WorkflowStore,
	[['zustand/immer', never]],
	[],
	WorkflowCoreState & WorkflowCoreActions
> = (set, get) => ({
	...initialState,

	loadWorkflows: async () => {
		if (get().isLoading) return;
		set((state) => {
			state.isLoading = true;
			state.error = null;
		});

		try {
			const workflows = await getWorkflowsFromApi();
			set((state) => {
				state.workflows = workflows.reduce(
					(acc, wf) => {
						acc[wf.id] = wf;
						return acc;
					},
					{} as Record<string, (typeof workflows)[0]>
				);
				state.lastUpdated = Date.now();
			});
			logger.info(`✅ ${workflows.length} workflows cargados.`);
		} catch (error) {
			const errorMsg = '❌ Error al cargar los workflows.';
			logger.error(errorMsg, error);
			set((state) => {
				state.error = errorMsg;
			});
			toastService.error(errorMsg);
		} finally {
			set((state) => {
				state.isLoading = false;
			});
		}
	},

	createWorkflow: async (data) => {
		try {
			const newWorkflow = await createWorkflowInApi(data);
			set((state) => {
				state.workflows[newWorkflow.id] = newWorkflow;
				state.lastUpdated = Date.now();
			});
			toastService.success(`Workflow "${data.name}" creado.`);
		} catch (error) {
			const errorMsg = `❌ Error al crear el workflow "${data.name}".`;
			logger.error(errorMsg, error);
			toastService.error(errorMsg);
		}
	},

	updateWorkflow: async (id, data) => {
		try {
			const updatedWorkflow = await updateWorkflowInApi(id, data);
			set((state) => {
				state.workflows[id] = updatedWorkflow;
				state.lastUpdated = Date.now();
			});
			toastService.success('Workflow actualizado.');
		} catch (error) {
			const errorMsg = '❌ Error al actualizar el workflow.';
			logger.error(errorMsg, error);
			toastService.error(errorMsg);
		}
	},

	deleteWorkflow: async (id) => {
		const workflowName = get().workflows[id]?.name ?? id;
		set(
			produce((draft) => {
				delete draft.workflows[id];
			})
		);
		try {
			await deleteWorkflowFromApi(id);
			toastService.success(`Workflow "${workflowName}" eliminado.`);
		} catch (error) {
			const errorMsg = '❌ Error al eliminar el workflow.';
			logger.error(errorMsg, { id, error });
			toastService.error(errorMsg);
			// Revertir si falla
			await get().loadWorkflows();
		}
	},
});
