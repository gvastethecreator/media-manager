/**
 * 🗂️ Store de JsonFile
 * @module store/entities/json-file/json-file.store
 * @description Store Zustand para gestionar el estado de archivos JSON
 * ✅ MIGRADO A DRIZZLE - Usa tipos locales en lugar de Prisma
 * 👉 2025-07 Refactor: ahora consume la API mediante json-file.client
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
// Refactor: se eliminan dependencias directas del servicio del servidor
// y se utilizan funciones cliente que consumen la API REST
import {
	createJsonFileInApi,
	deleteJsonFileFromApi,
	getJsonFilesFromApi,
	updateJsonFileInApi,
} from '@/lib/api/client/json-file.client';
import { createSelectors } from '@/lib/utils/store/create-selectors';
import type { JsonFileCreateInput, JsonFileUpdateInput, JsonFileWithStats } from '@/types/entities/json-file';

// Definiendo un tipo de filtro genérico hasta que se creen los esquemas Zod
export type JsonFileFilters = Record<string, any>;

/**
 * 🏪 Estado del store de JsonFile
 */
export interface JsonFileState {
	clearFilters: () => void;
	clearSelection: () => void;
	createJsonFile: (data: JsonFileCreateInput) => Promise<JsonFileWithStats | undefined>;
	currentJsonFile: JsonFileWithStats | null;
	deleteJsonFile: (id: string) => Promise<void>;
	deselectJsonFile: (jsonFileId: string) => void;
	error: string | null;

	// Acciones de datos
	fetchJsonFiles: () => Promise<void>;
	filters: JsonFileFilters;

	// Utilidades
	getJsonFileById: (id: string) => JsonFileWithStats | undefined;
	getSortedJsonFiles: () => JsonFileWithStats[];
	// Estado de datos
	jsonFiles: JsonFileWithStats[];

	// Estado de UI
	loading: boolean;
	selectedJsonFiles: JsonFileWithStats[];

	// Acciones de selección
	selectJsonFile: (jsonFile: JsonFileWithStats) => void;

	// Acciones de filtrado
	setFilters: (filters: Partial<JsonFileFilters>) => void;
	toggleFavorite: (id: string) => Promise<void>;
	updateJsonFile: (id: string, data: JsonFileUpdateInput) => Promise<JsonFileWithStats | undefined>;
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
					const jsonFiles = await getJsonFilesFromApi();
					set({ jsonFiles, loading: false });
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
				}
			},

			createJsonFile: async (data: JsonFileCreateInput) => {
				set({ loading: true, error: null });
				try {
					const newJsonFile = await createJsonFileInApi(data);
					set((state) => ({
						jsonFiles: [...state.jsonFiles, newJsonFile],
						loading: false,
					}));
					return newJsonFile;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return;
				}
			},

			updateJsonFile: async (id: string, data: JsonFileUpdateInput) => {
				set({ loading: true, error: null });
				try {
					const updatedJsonFile = await updateJsonFileInApi(id, data);
					set((state) => ({
						jsonFiles: state.jsonFiles.map((j) => (j.id === id ? updatedJsonFile : j)),
						currentJsonFile: state.currentJsonFile?.id === id ? updatedJsonFile : state.currentJsonFile,
						loading: false,
					}));
					return updatedJsonFile;
				} catch (error) {
					set({ error: (error as Error).message, loading: false });
					return;
				}
			},

			deleteJsonFile: async (id: string) => {
				set({ loading: true, error: null });
				try {
					await deleteJsonFileFromApi(id);
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

			getSortedJsonFiles: () => {
				return get().jsonFiles.sort((a, b) => {
					// Ordenar por nombre alfabéticamente
					return a.name.localeCompare(b.name);
				});
			},

			toggleFavorite: async (id: string) => {
				const jsonFile = get().getJsonFileById(id);
				if (jsonFile) {
					await get().updateJsonFile(id, { isFavorite: !jsonFile.isFavorite });
				}
			},
		}),
		{
			name: 'json-file-store',
		}
	)
);

export const useJsonFileStore = createSelectors(useJsonFileStoreBase);
