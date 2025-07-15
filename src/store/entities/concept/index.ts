/**
 * @file Store de Zustand para la entidad Concept
 * @module store/entities/concept
 * @description Unifica todos los slices y la lógica de estado para los conceptos.
 */

import { create, type StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
// Ahora usamos llamadas a la API en lugar del servicio del servidor
import {
	createConceptInApi,
	deleteConceptFromApi,
	getConceptsFromApi,
	updateConceptInApi,
} from '@/lib/api/client/concept.client';
import { VERSIONING } from '@/lib/constants';
import { clientLogger } from '@/lib/logger/client-logger';
import {
	ConceptCreateInput,
	ConceptSortOption,
	ConceptUpdateInput,
	ConceptViewMode,
	ConceptWithStats,
} from '@/types/entities/concept';
import type { ConceptStore } from './types';

const storeLogger = clientLogger.withContext('ConceptStore');

// --- SLICE: Core ---
const transformConceptToWithStats = (concept: any): ConceptWithStats => ({
	...concept,
	stats: {
		imageCount: concept._count?.images ?? 0,
		tagCount: concept._count?.tags ?? 0,
		noteCount: concept._count?.notes ?? 0,
		totalContentItems: (concept._count?.images ?? 0) + (concept._count?.notes ?? 0),
		lastUpdated: concept.updatedAt,
	},
});

const createCoreSlice: StateCreator<ConceptStore, [], [], ConceptCoreSlice> = (set, get) => ({
	concepts: [],
	selectedConcept: null,
	isLoading: false,
	error: null,
	loadConcepts: async () => {
		storeLogger.info('🔄 Loading concepts...');
		set({ isLoading: true, error: null });
		try {
			const concepts = await getConceptsFromApi();
			const transformedConcepts = concepts.items.map(transformConceptToWithStats);
			set({ concepts: transformedConcepts, isLoading: false });
			storeLogger.info(`✅ Loaded ${transformedConcepts.length} concepts.`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error loading concepts';
			storeLogger.error('❌ Error loading concepts:', error);
			set({ error: message, isLoading: false });
		}
	},
	createConcept: async (concept: ConceptCreateInput) => {
		storeLogger.info('✨ Creating concept...');
		await createConceptInApi(concept);
		await get().loadConcepts();
	},
	updateConcept: async (id: string, concept: ConceptUpdateInput) => {
		storeLogger.info(`🔄 Updating concept ${id}...`);
		await updateConceptInApi(id, concept);
		await get().loadConcepts();
	},
	deleteConcept: async (id: string) => {
		storeLogger.info(`🗑️ Deleting concept ${id}...`);
		await deleteConceptFromApi(id);
		await get().loadConcepts();
		if (get().selectedConcept?.id === id) {
			set({ selectedConcept: null });
		}
	},
	selectConcept: (concept) => set({ selectedConcept: concept as ConceptWithStats | null }),
	reset: () => set({ concepts: [], selectedConcept: null, isLoading: false, error: null }),
});

// --- SLICE: Filters ---
const createFiltersSlice: StateCreator<ConceptStore, [], [], ConceptFiltersSlice> = (set) => ({
	filters: { search: '', category: undefined, tags: [], onlyFavorites: false },
	sortBy: ConceptSortOption.NAME_ASC,
	page: 1,
	pageSize: 20,
	setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters }, page: 1 })),
	setSortBy: (sortBy) => set({ sortBy: sortBy as ConceptSortOption }),
	setPage: (page) => set({ page }),
	setPageSize: (pageSize) => set({ pageSize, page: 1 }),
	clearFilters: () => set({ filters: { search: '', category: undefined, tags: [], onlyFavorites: false }, page: 1 }),
	setCategoryFilter: (category: string | null) => {
		set((state) => ({
			filters: { ...state.filters, category: category || undefined },
			page: 1,
		}));
	},
	setSearchFilter: (search: string) => {
		set((state) => ({
			filters: { ...state.filters, search },
			page: 1,
		}));
	},
	setTagsFilter: (tags: string[]) => {
		set((state) => ({
			filters: { ...state.filters, tags },
			page: 1,
		}));
	},
	setOnlyFavoritesFilter: (onlyFavorites: boolean) => {
		set((state) => ({
			filters: { ...state.filters, onlyFavorites },
			page: 1,
		}));
	},
});

// --- SLICE: UI ---
const initialUIState = {
	isCreateModalOpen: false,
	isEditModalOpen: false,
	isDeleteDialogOpen: false,
	isDetailsDrawerOpen: false,
	viewMode: ConceptViewMode.GRID,
};
const createUISlice: StateCreator<ConceptStore, [], [], ConceptUISlice> = (set) => ({
	...initialUIState,
	openCreateModal: () => set({ isCreateModalOpen: true }),
	closeCreateModal: () => set({ isCreateModalOpen: false }),
	openEditModal: () => set({ isEditModalOpen: true }),
	closeEditModal: () => set({ isEditModalOpen: false }),
	openDeleteDialog: () => set({ isDeleteDialogOpen: true }),
	closeDeleteDialog: () => set({ isDeleteDialogOpen: false }),
	openDetailsDrawer: () => set({ isDetailsDrawerOpen: true }),
	closeDetailsDrawer: () => set({ isDetailsDrawerOpen: false }),
	setViewMode: (mode) => set({ viewMode: mode as ConceptViewMode }),
	resetUI: () => set({ ...initialUIState }),
});

// --- SLICE: Relations (Mock) ---
const createRelationsSlice: StateCreator<ConceptStore, [], [], ConceptRelationsSlice> = (_set, get) => ({
	addConceptToEntity: async (conceptId, entityId, entityType) => {
		// Mock implementation, replace with actual server action
		storeLogger.info(`🔗 Linking concept ${conceptId} to ${entityType} ${entityId}`);
		await new Promise((resolve) => setTimeout(resolve, 500));
		await get().loadConcepts();
	},
	removeConceptFromEntity: async (conceptId, entityId, entityType) => {
		// Mock implementation, replace with actual server action
		storeLogger.info(`✂️ Unlinking concept ${conceptId} from ${entityType} ${entityId}`);
		await new Promise((resolve) => setTimeout(resolve, 500));
		await get().loadConcepts();
	},
});

// --- STORE CREATION ---
export const useConceptStore = create<ConceptStore>()(
	devtools(
		persist(
			(set, get, api) => ({
				...createCoreSlice(set, get, api),
				...createFiltersSlice(set, get, api),
				...createUISlice(set, get, api),
				...createRelationsSlice(set, get, api),
			}),
			{
				name: 'concept-store',
				version: VERSIONING.STORE,
				partialize: (state) => {
					const { concepts, isLoading, error, selectedConcept, ...rest } = state;
					return rest; // Persist only UI and filter state
				},
			}
		),
		{
			name: 'ConceptStore',
			enabled: process.env.NODE_ENV === 'development',
		}
	)
);
