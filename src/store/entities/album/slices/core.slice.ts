/**
 * @file Slice principal (core) para el store de Album.
 * @module store/entities/album/slices/core
 * @description Gestiona el estado y las acciones CRUD para la entidad Album.
 */

import * as actions from '@/app/actions/albums/album.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast';
import { produce } from 'immer';
import type { StateCreator } from 'zustand';
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

	loadAlbums: async () => {
		if (get().isLoading) return;
		set((state) => {
			state.isLoading = true;
			state.error = null;
		});

		try {
			const albums = await actions.getAlbums();
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
			await actions.createAlbum(data);
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
			await actions.updateAlbum(id, data);
			toastService.success(`Álbum actualizado.`);
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
			await actions.deleteAlbum(id);
			toastService.success(`Álbum "${albumName}" eliminado.`);
		} catch (error) {
			const errorMsg = '❌ Error al eliminar el álbum.';
			logger.error(errorMsg, { id, error });
			toastService.error(errorMsg);
			await get().loadAlbums(); // Revertir si falla
		}
	},
});
