import {
	type AlbumWithStats as ActionAlbumWithStats,
	type AlbumCreate,
	type AlbumUpdate,
	addImageToAlbum as addImageToAlbumAction,
	createAlbum as createAlbumAction,
	deleteAlbum as deleteAlbumAction,
	getAlbums,
	updateAlbum as updateAlbumAction,
} from '@/app/actions/albums/album.actions';
import { serverLogger } from '@/lib/logger/server-logger';
import type { Album } from '@prisma/client';
import { create } from 'zustand';

const albumsLogger = serverLogger.withContext('AlbumsStore');

export type AlbumWithStats = ActionAlbumWithStats;

interface AlbumsStore {
	albums: AlbumWithStats[];
	isLoading: boolean;
	error: string | null;
	loadAlbums: () => Promise<void>;
	createAlbum: (album: AlbumCreate) => Promise<Album | null>;
	updateAlbum: (id: string, album: AlbumUpdate) => Promise<void>;
	deleteAlbum: (id: string) => Promise<void>;
	addImageToAlbum: (imageId: string, albumId: string) => Promise<void>;
}

export const useAlbumsStore = create<AlbumsStore>((set) => ({
	albums: [],
	isLoading: false,
	error: null,
	loadAlbums: async () => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('🔄 Cargando álbumes...');
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info(`✅ ${albums.length} álbumes cargados`);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al cargar álbumes';
			albumsLogger.error('❌ Error al cargar álbumes:', error);
			set({ error: message, isLoading: false });
		}
	},
	createAlbum: async (album) => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('✨ Creando álbum:', album);
			const createdAlbum = await createAlbumAction(album);
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info('✅ Álbum creado', createdAlbum);
			return createdAlbum;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al crear álbum';
			albumsLogger.error('❌ Error al crear álbum:', error);
			set({ error: message, isLoading: false });
			return null;
		}
	},
	updateAlbum: async (id, album) => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('💾 Actualizando álbum:', album);
			await updateAlbumAction(id, { ...album, id });
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info('✅ Álbum actualizado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al actualizar álbum';
			albumsLogger.error('❌ Error al actualizar álbum:', error);
			set({ error: message, isLoading: false });
		}
	},
	deleteAlbum: async (id) => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('🗑️ Eliminando álbum:', id);
			await deleteAlbumAction(id);
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info('✅ Álbum eliminado');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al eliminar álbum';
			albumsLogger.error('❌ Error al eliminar álbum:', error);
			set({ error: message, isLoading: false });
		}
	},
	addImageToAlbum: async (imageId, albumId) => {
		try {
			set({ isLoading: true, error: null });
			albumsLogger.info('➕ Agregando imagen a álbum:', { albumId, imageId });
			await addImageToAlbumAction(albumId, imageId);
			const albums = await getAlbums();
			set({ albums, isLoading: false });
			albumsLogger.info('✅ Imagen agregada al álbum');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al agregar imagen al álbum';
			albumsLogger.error('❌ Error al agregar imagen al álbum:', error);
			set({ error: message, isLoading: false });
		}
	},
}));
