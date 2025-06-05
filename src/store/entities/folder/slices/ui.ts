/**
 * @file UI slice para el store de carpetas
 * @module store/entities/folder/slices/ui
 */

import { clientLogger } from '@/lib/logger/client-logger';
import type { FolderUISlice } from '../types';

const uiLogger = clientLogger.withContext('FolderStore:UI');

export const createUISlice: FolderUISlice = (set, get) => ({
	uiState: {
		// Estado inicial
		viewMode: 'grid',
		itemSize: 'medium',
		sidebarExpanded: true,
		expandedFolders: [],
		showCreateModal: false,
		showEditModal: false,
		showDeleteModal: false,
		showStatsModal: false,
		statsSelectedFolderId: null,
	},

	uiActions: {
		// Acciones
		setViewMode: (mode) => {
			const { uiState } = get();
			uiLogger.info(`👓 Cambiando modo de visualización a: ${mode}`);
			set({ uiState: { ...uiState, viewMode: mode } });
		},

		setItemSize: (size) => {
			const { uiState } = get();
			uiLogger.info(`📏 Cambiando tamaño de elementos a: ${size}`);
			set({ uiState: { ...uiState, itemSize: size } });
		},

		toggleSidebar: () => {
			const { uiState } = get();
			const newState = !uiState.sidebarExpanded;
			uiLogger.info(`📑 ${newState ? 'Expandiendo' : 'Colapsando'} sidebar`);
			set({ uiState: { ...uiState, sidebarExpanded: newState } });
		},

		toggleFolderExpanded: (id) => {
			const { uiState } = get();
			const isExpanded = uiState.expandedFolders.includes(id);
			uiLogger.info(`📂 ${isExpanded ? 'Colapsando' : 'Expandiendo'} carpeta: ${id}`);

			const newExpandedFolders = isExpanded
				? uiState.expandedFolders.filter((folderId) => folderId !== id)
				: [...uiState.expandedFolders, id];

			set({ uiState: { ...uiState, expandedFolders: newExpandedFolders } });
		},

		openCreateModal: () => {
			const { uiState } = get();
			uiLogger.info('➕ Abriendo modal de creación de carpeta');
			set({ uiState: { ...uiState, showCreateModal: true } });
		},

		closeCreateModal: () => {
			const { uiState } = get();
			uiLogger.info('✖️ Cerrando modal de creación de carpeta');
			set({ uiState: { ...uiState, showCreateModal: false } });
		},

		openEditModal: () => {
			const { uiState } = get();
			uiLogger.info('✏️ Abriendo modal de edición de carpeta');
			set({ uiState: { ...uiState, showEditModal: true } });
		},

		closeEditModal: () => {
			const { uiState } = get();
			uiLogger.info('✖️ Cerrando modal de edición de carpeta');
			set({ uiState: { ...uiState, showEditModal: false } });
		},

		openDeleteModal: () => {
			const { uiState } = get();
			uiLogger.info('🗑️ Abriendo modal de confirmación de eliminación');
			set({ uiState: { ...uiState, showDeleteModal: true } });
		},

		closeDeleteModal: () => {
			const { uiState } = get();
			uiLogger.info('✖️ Cerrando modal de confirmación de eliminación');
			set({ uiState: { ...uiState, showDeleteModal: false } });
		},

		openStatsModal: (folderId) => {
			const { uiState } = get();
			uiLogger.info(`📊 Abriendo modal de estadísticas para carpeta: ${folderId}`);
			set({
				uiState: {
					...uiState,
					showStatsModal: true,
					statsSelectedFolderId: folderId,
				},
			});
		},

		closeStatsModal: () => {
			const { uiState } = get();
			uiLogger.info('✖️ Cerrando modal de estadísticas');
			set({
				uiState: {
					...uiState,
					showStatsModal: false,
					statsSelectedFolderId: null,
				},
			});
		},
	},
});
