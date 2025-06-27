/**
 * @file Store principal de Zustand para la entidad Workflow.
 * @module store/entities/workflow
 * @description Combina los slices (core, ui, filters) en un único store.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWorkflowCoreSlice } from './slices/core.slice';
import { createWorkflowFilterSlice } from './slices/filters.slice';
import { createWorkflowUISlice } from './slices/ui.slice';
import type { WorkflowStore } from './types';

export const useWorkflowStore = create<WorkflowStore>()(
	devtools(
		persist(
			immer((...a) => ({
				...createWorkflowCoreSlice(...a),
				...createWorkflowUISlice(...a),
				...createWorkflowFilterSlice(...a),
			})),
			{
				name: 'workflow-store-v2',
				partialize: state => ({
					filters: state.filters,
					sortBy: state.sortBy,
				}),
			},
		),
		{ name: 'WorkflowStore' },
	),
);
