/**
 * 🗂️ Store de JsonFile
 * @module store/entities/json-file/json-file.store
 * @description Store Zustand para gestionar el estado de archivos JSON
 */

import {
	createJsonFile,
	deleteJsonFile,
	getJsonFiles,
	updateJsonFile,
} from '@/app/actions/json-file/json-file.actions';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import { createSelectors } from '@/lib/utils/store/create-selectors';
import type { Prisma } from '@prisma/client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Definiendo un tipo de filtro genérico hasta que se creen los esquemas Zod
export type JsonFileFilters = Record<string, any>;

/**
 * 🏪 Estado del store de JsonFile
 */
export interface JsonFileState {
	// Estado de datos
	jsonFiles: JsonFileWithStats[];
	selectedJsonFiles: JsonFileWithStats[];
	currentJsonFile: JsonFileWithStats | null;

	// Estado de UI
	loading: boolean;
	error: string | null;
	filters: JsonFileFilters;

	// Acciones de datos
	fetchJsonFiles: () => Promise<void>;
	createJsonFile: (data: Prisma.JsonFileCreateInput) => Promise<JsonFileWithStats | undefined>;
	updateJsonFile: (id: string, data: Prisma.JsonFileUpdateInput) => Promise<JsonFileWithStats | undefined>;
	deleteJsonFile: (id: string) => Promise<void>;

	// Acciones de selección
	selectJsonFile: (jsonFile: JsonFileWithStats) => void;
	deselectJsonFile: (jsonFileId: string) => void;
	clearSelection: () => void;

	// Acciones de filtrado
	setFilters: (filters: Partial<JsonFileFilters>) => void;
	clearFilters: () => void;

	// Utilidades
	getJsonFileById: (id: string) => JsonFileWithStats | undefined;
	toggleFavorite: (id: string) => Promise<void>;
}

const useJsonFileStoreBase = create<JsonFileState>()(
	devtools(
		(set, get) => ({
			// Estado inicial
			jsonFiles: [],
			selectedJsonFiles: [],
			currentJsonFile: null,
			loading: false,
			error: null,
			filters: {},

			// Acciones de datos
			fetchJsonFiles: async () => {
				set({ loading: true, error: null });
				try {
					const jsonFiles = await getJsonFiles();
					set({ jsonFiles, loading: false });
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			createJsonFile: async (data: Prisma.JsonFileCreateInput) => {
				set({ loading: true, error: null });
				try {
					const newJsonFile = await createJsonFile(data);
					set((state) => ({
						jsonFiles: [...state.jsonFiles, newJsonFile],
						loading: false,
					}));
					return newJsonFile;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return undefined;
				}
			},

			updateJsonFile: async (id: string, data: Prisma.JsonFileUpdateInput) => {
				set({ loading: true, error: null });
				try {
					const updatedJsonFile = await updateJsonFile(id, data);
					set((state) => ({
						jsonFiles: state.jsonFiles.map((j) => (j.id === id ? updatedJsonFile : j)),
						currentJsonFile: state.currentJsonFile?.id === id ? updatedJsonFile : state.currentJsonFile,
						loading: false,
					}));
					return updatedJsonFile;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return undefined;
				}
			},

			deleteJsonFile: async (id: string) => {
				set({ loading: true, error: null });
				try {
					await deleteJsonFile(id);
					set((state) => ({
						jsonFiles: state.jsonFiles.filter((j) => j.id !== id),
						selectedJsonFiles: state.selectedJsonFiles.filter((j) => j.id !== id),
						currentJsonFile: state.currentJsonFile?.id === id ? null : state.currentJsonFile,
						loading: false,
					}));
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			// Acciones de selección
			selectJsonFile: (jsonFile: JsonFileWithStats) => {
				set((state) => ({
					selectedJsonFiles: [...state.selectedJsonFiles, jsonFile],
					currentJsonFile: jsonFile,
				}));
			},

			deselectJsonFile: (jsonFileId: string) => {
				set((state) => ({
					selectedJsonFiles: state.selectedJsonFiles.filter((j) => j.id !== jsonFileId),
				}));
			},

			clearSelection: () => {
				set({ selectedJsonFiles: [], currentJsonFile: null });
			},

			// Acciones de filtrado
			setFilters: (newFilters: Partial<JsonFileFilters>) => {
				set((state) => ({
					filters: { ...state.filters, ...newFilters },
				}));
			},

			clearFilters: () => {
				set({ filters: {} });
			},

			// Utilidades
			getJsonFileById: (id: string) => {
				return get().jsonFiles.find((j) => j.id === id);
			},

			toggleFavorite: async (id: string) => {
				const jsonFile = get().getJsonFileById(id);
				if (jsonFile) {
					await get().updateJsonFile(id, {
						// @ts-ignore TODO: Arreglar el tipo isFavorite cuando se refactoricen las actions
						isFavorite: !jsonFile.isFavorite,
					});
				}
			},
		}),
		{
			name: 'json-file-store',
		}
	)
);

export const useJsonFileStore = createSelectors(useJsonFileStoreBase);
