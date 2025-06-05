/**
 * @file Slice de UI para el store de Folder
 * @module store/entities/folder/slices/ui.slice
 */

import { Logger } from '@/lib/logger';
import { FolderViewMode } from '@/types/entities/folder/enums';
import type { FolderStore, FolderUIActions, FolderUIState } from '@/types/entities/folder/types';
import { StateCreator } from 'zustand';

const logger = new Logger({ context: 'FolderUISlice' });

/**
 * 🎮 Creador del slice de UI para el store de Folder
 */
export const createFolderUISlice: StateCreator<FolderStore, [], [], { ui: FolderUIState } & FolderUIActions> = (
	set,
	get
) => ({
	// Estado inicial de UI
	ui: {
		viewMode: FolderViewMode.GRID,
		selectedIds: [],
		expandedIds: [],
		isModalOpen: false,
		currentModalId: null,
		modalMode: null,
	},

	// Establece el modo de visualización
	setViewMode: (mode) => {
		logger.info(`👁️ Cambiando modo de visualización a: ${mode}`);

		set((state) => ({
			ui: {
				...state.ui,
				viewMode: mode,
			},
		}));
	},
	// Selecciona una carpeta
	selectFolder: (id) => {
		// Si id es null, limpiar la selección
		if (id === null) {
			logger.info('🧹 Limpiando selección de carpeta');
			set((state) => ({
				ui: {
					...state.ui,
					selectedIds: [],
				},
			}));

			// También limpiar la carpeta seleccionada en el core state
			get().setSelected(null);
			return;
		}

		logger.info(`🔍 Seleccionando carpeta: ${id}`);

		set((state) => {
			// 🔧 Verificar que selectedIds existe y es un array
			const currentSelectedIds = state.ui.selectedIds || [];

			// Si ya está seleccionada, no hacer nada
			if (currentSelectedIds.includes(id)) {
				return state;
			}

			return {
				ui: {
					...state.ui,
					selectedIds: [...currentSelectedIds, id],
				},
			};
		});

		// También actualizar el selected en el core state
		const folder = get().items.find((item) => item.id === id);
		if (folder) {
			get().setSelected(folder);
		}
	},
	// Deselecciona una carpeta
	unselectFolder: (id) => {
		logger.info(`🔍 Deseleccionando carpeta: ${id}`);

		set((state) => {
			// 🔧 Verificar que selectedIds existe y es un array
			const currentSelectedIds = state.ui.selectedIds || [];

			return {
				ui: {
					...state.ui,
					selectedIds: currentSelectedIds.filter((selectedId) => selectedId !== id),
				},
			};
		});

		// Si la carpeta deseleccionada era la selected en el core state, limpiarla
		if (get().selected?.id === id) {
			get().setSelected(null);
		}
	},
	// Selecciona múltiples carpetas
	selectMultipleFolders: (ids) => {
		logger.info(`🔍 Seleccionando múltiples carpetas: ${ids.length}`);

		set((state) => {
			// 🔧 Verificar que selectedIds existe y es un array
			const currentSelectedIds = state.ui.selectedIds || [];

			// Filtrar IDs que no estén ya seleccionados
			const newIds = ids.filter((id) => !currentSelectedIds.includes(id));

			// Si no hay nuevos IDs, no hacer nada
			if (newIds.length === 0) {
				return state;
			}

			return {
				ui: {
					...state.ui,
					selectedIds: [...currentSelectedIds, ...newIds],
				},
			};
		});
	},

	// Limpia todas las selecciones
	clearSelection: () => {
		logger.info('🧹 Limpiando selección');

		set((state) => ({
			ui: {
				...state.ui,
				selectedIds: [],
			},
		}));

		// También limpiar la carpeta seleccionada en el core state
		get().setSelected(null);
	},
	// Expande una carpeta
	expandFolder: (id) => {
		logger.info(`📂 Expandiendo carpeta: ${id}`);

		set((state) => {
			// 🔧 Verificar que expandedIds existe y es un array
			const currentExpandedIds = state.ui.expandedIds || [];

			// Si ya está expandida, no hacer nada
			if (currentExpandedIds.includes(id)) {
				return state;
			}

			return {
				ui: {
					...state.ui,
					expandedIds: [...currentExpandedIds, id],
				},
			};
		});
	},
	// Colapsa una carpeta
	collapseFolder: (id) => {
		logger.info(`📁 Colapsando carpeta: ${id}`);

		set((state) => {
			// 🔧 Verificar que expandedIds existe y es un array
			const currentExpandedIds = state.ui.expandedIds || [];

			return {
				ui: {
					...state.ui,
					expandedIds: currentExpandedIds.filter((expandedId) => expandedId !== id),
				},
			};
		});
	},
	// Alterna la expansión de una carpeta
	toggleFolderExpansion: (id) => {
		logger.info(`🔄 Alternando expansión de carpeta: ${id}`);

		set((state) => {
			// 🔧 Verificar que expandedIds existe y es un array
			const currentExpandedIds = state.ui.expandedIds || [];
			const isExpanded = currentExpandedIds.includes(id);

			return {
				ui: {
					...state.ui,
					expandedIds: isExpanded
						? currentExpandedIds.filter((expandedId) => expandedId !== id)
						: [...currentExpandedIds, id],
				},
			};
		});
	},

	// Abre el modal de creación
	openCreateModal: () => {
		logger.info('🆕 Abriendo modal de creación');

		set((state) => ({
			ui: {
				...state.ui,
				isModalOpen: true,
				currentModalId: null,
				modalMode: 'create',
			},
		}));
	},

	// Abre el modal de edición
	openEditModal: (id) => {
		logger.info(`✏️ Abriendo modal de edición para carpeta: ${id}`);

		set((state) => ({
			ui: {
				...state.ui,
				isModalOpen: true,
				currentModalId: id,
				modalMode: 'edit',
			},
		}));
	},

	// Abre el modal de eliminación
	openDeleteModal: (id) => {
		logger.info(`🗑️ Abriendo modal de eliminación para carpeta: ${id}`);

		set((state) => ({
			ui: {
				...state.ui,
				isModalOpen: true,
				currentModalId: id,
				modalMode: 'delete',
			},
		}));
	},

	// Cierra el modal actual
	closeModal: () => {
		logger.info('❌ Cerrando modal');

		set((state) => ({
			ui: {
				...state.ui,
				isModalOpen: false,
				currentModalId: null,
				modalMode: null,
			},
		}));
	},
});
