/**
 * @file Slice principal (core) para el store de Album.
 * @module store/entities/album/slices/core
 * @description Gestiona el estado y las acciones CRUD para la entidad Album.
 */

import { produce } from 'immer';
import type { StateCreator } from 'zustand';
// Consumimos la API en lugar de las server actions
import {
	createAlbumInApi,
	deleteAlbumFromApi,
	getAlbumsFromApi,
	updateAlbumInApi,
} from '@/lib/api/client/album.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/lib/ui/toast';
import type { AlbumCoreActions, AlbumCoreState, AlbumStore } from '../types';

const logger = clientLogger.withContext('AlbumCoreSlice');

const initialState: AlbumCoreState = {
	albums: {},
	isLoading: false,
	error: null,
	lastUpdated: null,
};

export const createAlbumCoreSlice: StateCreator<
	AlbumStore,
	[['zustand/immer', never]],
	[],
	AlbumCoreState & AlbumCoreActions
> = (set, get) => ({
	...initialState,

	// Getters
	getSortedAlbums: () => {
		const albums = Object.values(get().albums);
		// Ordenar por fecha de actualización descendente por defecto
		return albums.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	},

	loadAlbums: async () => {
		if (get().isLoading) return;
		set((state) => {
			state.isLoading = true;
			state.error = null;
		});

		try {
			const albums = await getAlbumsFromApi();
			set((state) => {
				state.albums = albums.reduce(
					(acc, album) => {
						acc[album.id] = album;
						return acc;
					},
					{} as Record<string, (typeof albums)[0]>
				);
				state.lastUpdated = Date.now();
			});
			logger.info(`✅ ${albums.length} álbumes cargados.`);
		} catch (error) {
			const errorMsg = '❌ Error al cargar los álbumes.';
			logger.error(errorMsg, error);
			set((state) => {
				state.error = errorMsg;
			});
			toastService.error(errorMsg);
		} finally {
			set((state) => {
				state.isLoading = false;
			});
		}
	},

	createAlbum: async (data) => {
		try {
			await createAlbumInApi(data);
			toastService.success(`Álbum "${data.name}" creado.`);
			await get().loadAlbums();
		} catch (error) {
			const errorMsg = `❌ Error al crear el álbum "${data.name}".`;
			logger.error(errorMsg, error);
			toastService.error(errorMsg);
		}
	},

	updateAlbum: async (id, data) => {
		try {
			await updateAlbumInApi(id, data);
			toastService.success('Álbum actualizado.');
			await get().loadAlbums();
		} catch (error) {
			const errorMsg = '❌ Error al actualizar el álbum.';
			logger.error(errorMsg, error);
			toastService.error(errorMsg);
		}
	},

	deleteAlbum: async (id) => {
		const albumName = get().albums[id]?.name ?? id;
		set(
			produce((draft) => {
				delete draft.albums[id];
			})
		);
		try {
			await deleteAlbumFromApi(id);
			toastService.success(`Álbum "${albumName}" eliminado.`);
		} catch (error) {
			const errorMsg = '❌ Error al eliminar el álbum.';
			logger.error(errorMsg, { id, error });
			toastService.error(errorMsg);
			await get().loadAlbums(); // Revertir si falla
		}
	},
});
