import { serverLogger } from '@/lib/logger/server-logger';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
	createCoreSlice,
	createExecutionSlice,
	createFiltersSlice,
	createRelationsSlice,
	createUISlice,
} from './slices';
import type { PromptStore } from './types';

const storeLogger = serverLogger.withContext('PromptStore');

/**
 * Store para la gestión de prompts combinando todas las slices
 */
export const usePromptStore = create<PromptStore>()(
	devtools(
		(...args) => {
			storeLogger.info('🏗️ Inicializando PromptStore');

			// Combinar todas las slices
			return {
				...createCoreSlice(...args),
				...createFiltersSlice(...args),
				...createUISlice(...args),
				...createExecutionSlice(...args),
				...createRelationsSlice(...args),
			};
		},
		{
			name: 'PromptStore',
			enabled: process.env.NODE_ENV === 'development',
		}
	)
);

// Selectors para acceder a partes específicas del estado
export const selectPrompts = (state: PromptStore) => state.prompts;
export const selectSelectedPrompt = (state: PromptStore) => state.selectedPrompt;
export const selectIsLoading = (state: PromptStore) => state.isLoading;
export const selectError = (state: PromptStore) => state.error;

export const selectFilters = (state: PromptStore) => state.filters;
export const selectSortBy = (state: PromptStore) => state.sortBy;
export const selectPage = (state: PromptStore) => state.page;
export const selectPageSize = (state: PromptStore) => state.pageSize;

export const selectViewMode = (state: PromptStore) => state.viewMode;
export const selectIsCreateModalOpen = (state: PromptStore) => state.isCreateModalOpen;
export const selectIsEditModalOpen = (state: PromptStore) => state.isEditModalOpen;
export const selectIsDeleteDialogOpen = (state: PromptStore) => state.isDeleteDialogOpen;
export const selectIsDetailsDrawerOpen = (state: PromptStore) => state.isDetailsDrawerOpen;
export const selectIsExecuteModalOpen = (state: PromptStore) => state.isExecuteModalOpen;

export const selectIsExecuting = (state: PromptStore) => state.isExecuting;
export const selectExecutionResult = (state: PromptStore) => state.executionResult;
export const selectExecutionError = (state: PromptStore) => state.executionError;
