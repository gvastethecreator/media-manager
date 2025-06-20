/**
 * 🎨 Store de Workflow
 * @module store/entities/workflow/workflow.store
 * @description Store Zustand para gestionar el estado de workflows
 */

import { createWorkflow, deleteWorkflow, getWorkflows, updateWorkflow } from '@/app/actions/workflow/workflow.actions';
import type { WorkflowComplete, WorkflowFilters, WorkflowFormData } from '@/types/entities/workflow/types';
import { createSelectors } from '@/utils/store/create-selectors';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 🏪 Estado del store de Workflow
 */
export interface WorkflowState {
	// Estado de datos
	workflows: WorkflowComplete[];
	selectedWorkflows: WorkflowComplete[];
	currentWorkflow: WorkflowComplete | null;

	// Estado de UI
	loading: boolean;
	error: string | null;
	filters: WorkflowFilters;

	// Acciones de datos
	fetchWorkflows: () => Promise<void>;
	createWorkflow: (data: WorkflowFormData) => Promise<WorkflowComplete | undefined>;
	updateWorkflow: (id: string, data: WorkflowFormData) => Promise<WorkflowComplete | undefined>;
	deleteWorkflow: (id: string) => Promise<void>;

	// Acciones de selección
	selectWorkflow: (workflow: WorkflowComplete) => void;
	deselectWorkflow: (workflowId: string) => void;
	clearSelection: () => void;

	// Acciones de filtrado
	setFilters: (filters: Partial<WorkflowFilters>) => void;
	clearFilters: () => void;

	// Utilidades
	getWorkflowById: (id: string) => WorkflowComplete | undefined;
	toggleFavorite: (id: string) => Promise<void>;
}

const useWorkflowStoreBase = create<WorkflowState>()(
	devtools(
		(set, get) => ({
			// Estado inicial
			workflows: [],
			selectedWorkflows: [],
			currentWorkflow: null,
			loading: false,
			error: null,
			filters: {},

			// Acciones de datos
			fetchWorkflows: async () => {
				set({ loading: true, error: null });
				try {
					const workflows = await getWorkflows();
					set({ workflows, loading: false });
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			createWorkflow: async (data: WorkflowFormData) => {
				set({ loading: true, error: null });
				try {
					const newWorkflow = await createWorkflow(data);
					set((state) => ({
						workflows: [...state.workflows, newWorkflow],
						loading: false,
					}));
					return newWorkflow;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return undefined;
				}
			},

			updateWorkflow: async (id: string, data: WorkflowFormData) => {
				set({ loading: true, error: null });
				try {
					const updatedWorkflow = await updateWorkflow(id, data);
					set((state) => ({
						workflows: state.workflows.map((w) => (w.id === id ? updatedWorkflow : w)),
						currentWorkflow: state.currentWorkflow?.id === id ? updatedWorkflow : state.currentWorkflow,
						loading: false,
					}));
					return updatedWorkflow;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return undefined;
				}
			},

			deleteWorkflow: async (id: string) => {
				set({ loading: true, error: null });
				try {
					await deleteWorkflow(id);
					set((state) => ({
						workflows: state.workflows.filter((w) => w.id !== id),
						selectedWorkflows: state.selectedWorkflows.filter((w) => w.id !== id),
						currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
						loading: false,
					}));
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			// Acciones de selección
			selectWorkflow: (workflow: WorkflowComplete) => {
				set((state) => ({
					selectedWorkflows: [...state.selectedWorkflows, workflow],
					currentWorkflow: workflow,
				}));
			},

			deselectWorkflow: (workflowId: string) => {
				set((state) => ({
					selectedWorkflows: state.selectedWorkflows.filter((w) => w.id !== workflowId),
				}));
			},

			clearSelection: () => {
				set({ selectedWorkflows: [], currentWorkflow: null });
			},

			// Acciones de filtrado
			setFilters: (newFilters: Partial<WorkflowFilters>) => {
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				}));
			},

			clearFilters: () => {
				set({ filters: {} });
			},

			// Utilidades
			getWorkflowById: (id: string) => {
				return get().workflows.find((w) => w.id === id);
			},

			toggleFavorite: async (id: string) => {
				const workflow = get().getWorkflowById(id);
				if (workflow) {
					await get().updateWorkflow(id, {
						...workflow,
						isFavorite: !workflow.isFavorite,
					});
				}
			},
		}),
		{
			name: 'workflow-store',
		}
	)
);

export const useWorkflowStore = createSelectors(useWorkflowStoreBase);
