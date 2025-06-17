/**
 * @file Slice de core para el store de Folder
 * @module store/entities/folder/slices/core.slice
 */

import { StateCreator } from 'zustand';
import {
	createFolder as apiCreateFolder,
	deleteFolder as apiDeleteFolder,
	getFolderById as apiFindFolder,
	searchFolders as apiSearchFolders,
	updateFolder as apiUpdateFolder,
} from '@/app/actions/folders';
import { Logger } from '@/lib/logger';
import type {
	FolderCoreActions,
	FolderCoreState,
	FolderSearchOptions,
	FolderStore,
} from '@/types/entities/folder/types';

const logger = new Logger('FolderCoreSlice');

/**
 * 📂 Creador del slice de core para el store de Folder
 */
export const createFolderCoreSlice: StateCreator<FolderStore, [], [], FolderCoreState & FolderCoreActions> = (
	set,
	get
) => ({
	// Estado inicial
	items: [],
	selected: null,
	isLoading: false,
	error: null,

	// Carga todas las carpetas
	loadFolders: async () => {
		try {
			set({ isLoading: true, error: null });

			logger.info('🔍 Cargando todas las carpetas');

			const options: FolderSearchOptions = {
				include: {
					children: true,
					parent: true,
					count: true,
				},
			};

			const result = await apiSearchFolders(options);

			set({
				items: result.items,
				isLoading: false,
			});

			logger.info(`✅ Carpetas cargadas: ${result.items.length}`);

			return result.items;
		} catch (error) {
			logger.error('❌ Error al cargar carpetas:', error);
			set({
				error: error instanceof Error ? error : new Error('Error desconocido al cargar carpetas'),
				isLoading: false,
			});
			return [];
		}
	},

	// Carga una carpeta por ID
	loadFolder: async (id) => {
		try {
			set({ isLoading: true, error: null });

			logger.info(`🔍 Cargando carpeta con ID: ${id}`);

			const folder = await apiFindFolder(id);

			if (!folder) {
				logger.warn(`⚠️ No se encontró carpeta con ID: ${id}`);
				set({ isLoading: false });
				return null;
			}

			// Actualizar la carpeta en la lista si ya existe
			const items = get().items;
			const itemIndex = items.findIndex((item) => item.id === folder.id);

			if (itemIndex >= 0) {
				items[itemIndex] = folder;
				set({ items: [...items] });
			} else {
				set({ items: [...items, folder] });
			}

			set({ isLoading: false });

			logger.info(`✅ Carpeta cargada: ${folder.name}`);

			return folder;
		} catch (error) {
			logger.error(`❌ Error al cargar carpeta ${id}:`, error);
			set({
				error: error instanceof Error ? error : new Error(`Error desconocido al cargar carpeta ${id}`),
				isLoading: false,
			});
			return null;
		}
	},

	// Crea una nueva carpeta
	createFolder: async (data) => {
		try {
			set({ isLoading: true, error: null });

			logger.info('➕ Creando carpeta:', data);

			const newFolder = await apiCreateFolder(data);

			set((state) => ({
				items: [...state.items, newFolder],
				isLoading: false,
				selected: newFolder, // Seleccionar la nueva carpeta
			}));

			logger.info(`✅ Carpeta creada: ${newFolder.name}`);

			return newFolder;
		} catch (error) {
			logger.error('❌ Error al crear carpeta:', error);
			set({
				error: error instanceof Error ? error : new Error('Error desconocido al crear carpeta'),
				isLoading: false,
			});
			throw error;
		}
	},

	// Actualiza una carpeta existente
	updateFolder: async (id, data) => {
		try {
			set({ isLoading: true, error: null });

			logger.info(`🔄 Actualizando carpeta ${id}:`, data);

			const updatedFolder = await apiUpdateFolder(id, data);

			// Actualizar el estado con la carpeta modificada
			set((state) => {
				const items = state.items.map((item) => (item.id === updatedFolder.id ? updatedFolder : item));

				// Si la carpeta actualizada es la seleccionada, actualizarla también
				const selected = state.selected && state.selected.id === updatedFolder.id ? updatedFolder : state.selected;

				return {
					items,
					selected,
					isLoading: false,
				};
			});

			logger.info(`✅ Carpeta actualizada: ${updatedFolder.name}`);

			return updatedFolder;
		} catch (error) {
			logger.error(`❌ Error al actualizar carpeta ${id}:`, error);
			set({
				error: error instanceof Error ? error : new Error(`Error desconocido al actualizar carpeta ${id}`),
				isLoading: false,
			});
			throw error;
		}
	},

	// Elimina una carpeta por ID
	deleteFolder: async (id) => {
		try {
			set({ isLoading: true, error: null });

			logger.info(`🗑️ Eliminando carpeta con ID: ${id}`);

			await apiDeleteFolder(id);

			// Eliminar la carpeta del estado
			set((state) => {
				const items = state.items.filter((item) => item.id !== id);

				// Si la carpeta eliminada es la seleccionada, deseleccionarla
				const selected = state.selected && state.selected.id === id ? null : state.selected;

				return {
					items,
					selected,
					isLoading: false,
				};
			});

			logger.info(`✅ Carpeta eliminada: ${id}`);
		} catch (error) {
			logger.error(`❌ Error al eliminar carpeta ${id}:`, error);
			set({
				error: error instanceof Error ? error : new Error(`Error desconocido al eliminar carpeta ${id}`),
				isLoading: false,
			});
			throw error;
		}
	},

	// Establece la carpeta seleccionada
	setSelected: (folder) => {
		set({ selected: folder });
	},

	// Establece el estado de carga
	setLoading: (isLoading) => {
		set({ isLoading });
	},

	// Establece un error
	setError: (error) => {
		set({ error });
	},

	// Resetea el estado
	reset: () => {
		set({
			items: [],
			selected: null,
			isLoading: false,
			error: null,
		});
	},
});
