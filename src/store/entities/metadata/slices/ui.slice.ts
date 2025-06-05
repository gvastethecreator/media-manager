/**
 * @file UI slice para el store de metadata
 * @module store/entities/metadata/slices/ui
 */

import { StateCreator } from 'zustand';
import { MetadataStore } from '..';

// Modos de visualización
export type ViewMode = 'list' | 'grid' | 'table';

// Estado
export interface UIState {
	// Selección
	selectedMetadataIds: string[];

	// Visualización
	viewMode: ViewMode;

	// Modales
	isCreateModalOpen: boolean;
	isDeleteModalOpen: boolean;
	isDetailsModalOpen: boolean;

	// Detalles
	activeMetadataId: string | null;
}

// Acciones
export interface UIActions {
	// Selección
	selectMetadata: (id: string) => void;
	deselectMetadata: (id: string) => void;
	toggleSelectMetadata: (id: string) => void;
	selectAllMetadatas: () => void;
	deselectAllMetadatas: () => void;

	// Visualización
	setViewMode: (mode: ViewMode) => void;

	// Modales
	openCreateModal: () => void;
	closeCreateModal: () => void;
	openDeleteModal: () => void;
	closeDeleteModal: () => void;
	openDetailsModal: (id: string) => void;
	closeDetailsModal: () => void;

	// Activo
	setActiveMetadataId: (id: string | null) => void;
}

// Estado inicial
const initialState: UIState = {
	selectedMetadataIds: [],
	viewMode: 'grid',
	isCreateModalOpen: false,
	isDeleteModalOpen: false,
	isDetailsModalOpen: false,
	activeMetadataId: null,
};

// Crear slice
export const createUISlice: StateCreator<MetadataStore, [], [], UIState & UIActions> = (set, get) => ({
	...initialState,

	// Selección
	selectMetadata: (id) => {
		const { selectedMetadataIds } = get();
		if (!selectedMetadataIds.includes(id)) {
			set({ selectedMetadataIds: [...selectedMetadataIds, id] });
		}
	},

	deselectMetadata: (id) => {
		const { selectedMetadataIds } = get();
		set({
			selectedMetadataIds: selectedMetadataIds.filter((selectedId) => selectedId !== id),
		});
	},

	toggleSelectMetadata: (id) => {
		const { selectedMetadataIds } = get();
		if (selectedMetadataIds.includes(id)) {
			get().deselectMetadata(id);
		} else {
			get().selectMetadata(id);
		}
	},

	selectAllMetadatas: () => {
		const { metadatas } = get();
		set({
			selectedMetadataIds: metadatas.map((metadata) => metadata.id),
		});
	},

	deselectAllMetadatas: () => {
		set({ selectedMetadataIds: [] });
	},

	// Visualización
	setViewMode: (viewMode) => set({ viewMode }),

	// Modales
	openCreateModal: () => set({ isCreateModalOpen: true }),
	closeCreateModal: () => set({ isCreateModalOpen: false }),
	openDeleteModal: () => set({ isDeleteModalOpen: true }),
	closeDeleteModal: () => set({ isDeleteModalOpen: false }),
	openDetailsModal: (id) =>
		set({
			isDetailsModalOpen: true,
			activeMetadataId: id,
		}),
	closeDetailsModal: () =>
		set({
			isDetailsModalOpen: false,
			activeMetadataId: null,
		}),

	// Activo
	setActiveMetadataId: (activeMetadataId) => set({ activeMetadataId }),
});
