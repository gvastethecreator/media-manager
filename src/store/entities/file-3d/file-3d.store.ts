/**
 * 📦 Store de File3D
 * @module store/entities/file-3d/file-3d.store
 * @description Store Zustand para gestionar el estado de archivos 3D
 * ✅ MIGRADO A DRIZZLE - Usa tipos locales en lugar de Prisma
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
// Migrado para consumir la API REST en lugar del servicio del servidor
import {
	createFile3DInApi,
	deleteFile3DFromApi,
	getFile3DsFromApi,
	updateFile3DInApi,
} from '@/lib/api/client/file3d.client';
import { createSelectors } from '@/lib/utils/store/create-selectors';
import type { File3DCreateInput, File3DUpdateInput, File3DWithStats } from '@/types/entities/file3d';

// Definiendo un tipo de filtro genérico hasta que se creen los esquemas Zod
export type File3DFilters = Record<string, any>;

/**
 * 🏪 Estado del store de File3D
 */
export interface File3DState {
	// Estado de datos
	file3Ds: File3DWithStats[];
	selectedFile3Ds: File3DWithStats[];
	currentFile3D: File3DWithStats | null;

	// Estado de UI
	loading: boolean;
	error: string | null;
	filters: File3DFilters;

	// Acciones de datos
	fetchFile3Ds: () => Promise<void>;
	createFile3D: (data: File3DCreateInput) => Promise<File3DWithStats | undefined>;
	updateFile3D: (id: string, data: File3DUpdateInput) => Promise<File3DWithStats | undefined>;
	deleteFile3D: (id: string) => Promise<void>;

	// Acciones de selección
	selectFile3D: (file3D: File3DWithStats) => void;
	deselectFile3D: (file3DId: string) => void;
	clearSelection: () => void;

	// Acciones de filtrado
	setFilters: (filters: Partial<File3DFilters>) => void;
	clearFilters: () => void;

	// Utilidades
	getFile3DById: (id: string) => File3DWithStats | undefined;
	toggleFavorite: (id: string) => Promise<void>;
}

const useFile3DStoreBase = create<File3DState>()(
	devtools(
		(set, get) => ({
			// Estado inicial
			file3Ds: [],
			selectedFile3Ds: [],
			currentFile3D: null,
			loading: false,
			error: null,
			filters: {},

			// Acciones de datos
			fetchFile3Ds: async () => {
				set({ loading: true, error: null });
				try {
					const file3Ds = await getFile3DsFromApi();
					set({ file3Ds, loading: false });
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			createFile3D: async (data: File3DCreateInput) => {
				set({ loading: true, error: null });
				try {
					const newFile3D = await createFile3DInApi(data);
					set((state) => ({
						file3Ds: [...state.file3Ds, newFile3D],
						loading: false,
					}));
					return newFile3D;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return;
				}
			},

			updateFile3D: async (id: string, data: File3DUpdateInput) => {
				set({ loading: true, error: null });
				try {
					const updatedFile3D = await updateFile3DInApi(id, data);
					set((state) => ({
						file3Ds: state.file3Ds.map((f) => (f.id === id ? updatedFile3D : f)),
						currentFile3D: state.currentFile3D?.id === id ? updatedFile3D : state.currentFile3D,
						loading: false,
					}));
					return updatedFile3D;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return;
				}
			},

			deleteFile3D: async (id: string) => {
				set({ loading: true, error: null });
				try {
					await deleteFile3DFromApi(id);
					set((state) => ({
						file3Ds: state.file3Ds.filter((f) => f.id !== id),
						selectedFile3Ds: state.selectedFile3Ds.filter((f) => f.id !== id),
						currentFile3D: state.currentFile3D?.id === id ? null : state.currentFile3D,
						loading: false,
					}));
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			// Acciones de selección
			selectFile3D: (file3D: File3DWithStats) => {
				set((state) => ({
					selectedFile3Ds: [...state.selectedFile3Ds, file3D],
					currentFile3D: file3D,
				}));
			},

			deselectFile3D: (file3DId: string) => {
				set((state) => ({
					selectedFile3Ds: state.selectedFile3Ds.filter((f) => f.id !== file3DId),
				}));
			},

			clearSelection: () => {
				set({ selectedFile3Ds: [], currentFile3D: null });
			},

			// Acciones de filtrado
			setFilters: (newFilters: Partial<File3DFilters>) => {
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				}));
			},

			clearFilters: () => {
				set({ filters: {} });
			},

			// Utilidades
			getFile3DById: (id: string) => {
				return get().file3Ds.find((f) => f.id === id);
			},

			toggleFavorite: async (id: string) => {
				const file3D = get().getFile3DById(id);
				if (file3D) {
					await get().updateFile3D(id, {
						isFavorite: !file3D.isFavorite,
					});
				}
			},
		}),
		{
			name: 'file-3d-store',
		}
	)
);

export const useFile3DStore = createSelectors(useFile3DStoreBase);
