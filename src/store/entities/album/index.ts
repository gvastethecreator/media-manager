/**
 * @file Store principal para la entidad Album
 * @module store/entities/album
 * @description Define el store de Zustand para la gestión de álbumes.
 * @updated 2025-06-21
 */

import {
    createAlbum as createServerAlbum,
    deleteAlbum as deleteServerAlbum,
    getAlbums,
    updateAlbum as updateServerAlbum,
} from '@/app/actions/albums/album.actions';
import { VERSIONING } from '@/lib/constants';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { AlbumComplete, AlbumCreateInput, AlbumSortCriteria, AlbumUpdateInput, AlbumViewMode } from '@/types/entities/album';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AlbumStore } from './types';

// Logger específico para el store de álbumes
const albumLogger = clientLogger.withContext('AlbumStore');

// Re-exportar tipos para fácil acceso
export * from './types';

// 🏗️ Crear el store con persistencia
export const useAlbumStore = create<AlbumStore>()(
	persist(
		(set, get) => ({
			// 📋 Estado inicial de datos
			albums: [] as AlbumComplete[],
			isLoading: false,
			error: null,
			lastUpdated: null,

			// 🎮 Estado inicial de UI
			ui: {
				selectedIds: [],
				viewMode: AlbumViewMode.GRID,
				isViewerOpen: false,
				currentAlbumId: null,
				displayState: {},
				draggedAlbumId: null,
				dropTargetAlbumId: null,
				highlightedId: null,
				expandedIds: [],
			},

			// 🔍 Estado inicial de filtros
			filters: {
				sortBy: AlbumSortCriteria.DATE_CREATED_DESC,
				searchQuery: '',
				filterByType: null,
				filterByParentId: null,
				filterFavorites: false,
				filterShared: false,
				filterArchived: false,
				dateRange: {
					from: null,
					to: null,
				},
				query: '', // para compatibilidad con AlbumFilters
			},

			// 🔄 --- ACCIONES --- 🔄

			// 📥 Carga de datos
			loadAlbums: async () => {
				try {
					set({ isLoading: true, error: null });
					albumLogger.info('🔄 Cargando álbumes...');
					const albums = await getAlbums();
					set({ albums, isLoading: false, lastUpdated: Date.now() });
					albumLogger.info('✅ Álbumes cargados correctamente');
				} catch (error) {
					const errorMessage = 'Error al cargar los álbumes';
					albumLogger.error(`❌ ${errorMessage}:`, error);
					set({ error: errorMessage, isLoading: false });
					toastService.system.error(errorMessage);
				}
			},

			loadAlbumById: async (id: string) => {
				const album = get().albums.find((a) => a.id === id);
				if (!album) {
					albumLogger.warn(`Album con id ${id} no encontrado en el store.`);
				}
				return album;
			},

			// 📝 Gestión de álbumes
			createAlbum: async (albumData: AlbumCreateInput) => {
				try {
					albumLogger.info('➕ Creando álbum:', albumData.name);
					const newAlbum = await createServerAlbum(albumData);
					set((state) => ({ albums: [...state.albums, newAlbum] }));
					albumLogger.info('✅ Álbum creado correctamente');
					toastService.system.success('Álbum creado correctamente');
				} catch (error) {
					const errorMessage = 'Error al crear el álbum';
					albumLogger.error(`❌ ${errorMessage}:`, error);
					toastService.system.error(errorMessage);
				}
			},

			updateAlbum: async (id: string, albumData: AlbumUpdateInput) => {
				try {
					albumLogger.info('🔄 Actualizando álbum:', id);
					const updatedAlbum = await updateServerAlbum(id, albumData);
					set((state) => ({
						albums: state.albums.map((a) => (a.id === id ? updatedAlbum : a)),
					}));
					albumLogger.info('✅ Álbum actualizado correctamente');
					toastService.system.success('Álbum actualizado correctamente');
				} catch (error) {
					const errorMessage = 'Error al actualizar el álbum';
					albumLogger.error(`❌ ${errorMessage}:`, error);
					toastService.system.error(errorMessage);
				}
			},

			deleteAlbum: async (id: string) => {
				try {
					albumLogger.info('🗑️ Eliminando álbum:', id);
					await deleteServerAlbum(id);
					set((state) => ({
						albums: state.albums.filter((a) => a.id !== id),
					}));
					albumLogger.info('✅ Álbum eliminado correctamente');
					toastService.system.success('Álbum eliminado correctamente');
				} catch (error) {
					const errorMessage = 'Error al eliminar el álbum';
					albumLogger.error(`❌ ${errorMessage}:`, error);
					toastService.system.error(errorMessage);
				}
			},

			// 🎮 Acciones de UI
			selectAlbum: (id) => set((state) => ({ ui: { ...state.ui, selectedIds: id ? [id] : [] } })),
			selectMultipleAlbums: (ids) => set((state) => ({ ui: { ...state.ui, selectedIds: ids } })),
			toggleSelection: (id: string) =>
				set((state) => {
					const selectedIds = state.ui.selectedIds.includes(id)
						? state.ui.selectedIds.filter((selectedId) => selectedId !== id)
						: [...state.ui.selectedIds, id];
					return { ui: { ...state.ui, selectedIds } };
				}),
			clearSelection: () => set((state) => ({ ui: { ...state.ui, selectedIds: [] } })),

			// 🖼️ Acciones de imágenes (Placeholder - requieren server actions)
			addImageToAlbum: async (albumId, imageId) => {
				albumLogger.info(`🖼️ Agregando imagen ${imageId} al álbum ${albumId}`);
				// Aquí iría la llamada a la server action
				// await addImageToAlbumAction(albumId, imageId);
				// Y luego actualizar el estado local
			},
			removeImageFromAlbum: async (albumId, imageId) => {
				albumLogger.info(`🖼️ Eliminando imagen ${imageId} del álbum ${albumId}`);
				// Aquí iría la llamada a la server action
				// await removeImageFromAlbumAction(albumId, imageId);
				// Y luego actualizar el estado local
			},

			// 🔍 Filtros
			updateFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
			clearFilters: () =>
				set({
					filters: {
						sortBy: AlbumSortCriteria.DATE_CREATED_DESC,
						searchQuery: '',
						filterByType: null,
						filterByParentId: null,
						filterFavorites: false,
						filterShared: false,
						filterArchived: false,
						dateRange: { from: null, to: null },
						query: '',
					},
				}),
			setSearchQuery: (query) => set((state) => ({ filters: { ...state.filters, searchQuery: query } })),

			// --- SELECTORES ---

			getAlbumById: (id) => get().albums.find((album) => album.id === id),

			getFilteredAlbums: () => {
				const { albums, filters } = get();
				const { searchQuery, filterFavorites } = filters;

				return albums.filter((album) => {
					const matchesSearch = searchQuery
						? album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							album.description?.toLowerCase().includes(searchQuery.toLowerCase())
						: true;
					const matchesFavorite = filterFavorites ? album.isFavorite : true;

					return matchesSearch && matchesFavorite;
				});
			},

			getSortedAlbums: () => {
				const { filters } = get();
				const filteredAlbums = get().getFilteredAlbums();

				return [...filteredAlbums].sort((a, b) => {
					switch (filters.sortBy) {
						case AlbumSortCriteria.NAME_ASC:
							return a.name.localeCompare(b.name);
						case AlbumSortCriteria.NAME_DESC:
							return b.name.localeCompare(a.name);
						case AlbumSortCriteria.DATE_CREATED_ASC:
							return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
						case AlbumSortCriteria.DATE_CREATED_DESC:
							return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
						default:
							return 0;
					}
				});
			},
		}),
		{
			name: 'album-store',
			storage: createJSONStorage(() => localStorage),
			version: Number.parseInt(VERSIONING.STORE, 10),
			partialize: (state) => ({
				ui: {
					viewMode: state.ui.viewMode,
					expandedIds: state.ui.expandedIds,
				},
				filters: {
					sortBy: state.filters.sortBy,
				},
			}),
		}
	)
);
